from fastapi import APIRouter, File, UploadFile, Depends, Query, Body
from sqlalchemy.orm import Session
from utils.parser_credit import extract_transactions_from_pdf
from utils.categorizer import categorize
from database import get_db
from models import CreditCardTransaction
from pydantic import BaseModel
import tempfile
import os
import re
from fastapi.responses import JSONResponse

router = APIRouter()

@router.post("/upload")
async def upload_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    temp_path = tempfile.mktemp(suffix=".pdf")
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    lines, statement_period = extract_transactions_from_pdf(temp_path)
    os.remove(temp_path)

    if not lines or not statement_period:
        return {"error": "Failed to extract transactions or period."}

    transactions = []
    start_date_str = statement_period.split(" to ")[0]
    inferred_year = start_date_str.split("/")[-1]

    for line in lines:
        if line.startswith("5675"):
            m = re.match(
                r"5675\s+(\d{2}/\d{2})\s+\d{2}/\d{2}\s+\S+\s+(.+?)\s+([A-Z]{2})\s+([\d,]+\.\d{2})$",
                line,
            )
            if m:
                date, description, state, amount = m.groups()
                category = categorize(description)
                month_str = f"{inferred_year}-{date[:2]}"

                tx_data = {
                    "date": date,
                    "description": description.strip(),
                    "state": state,
                    "amount": float(amount.replace(",", "")),
                    "category": category,
                }
                transactions.append(tx_data)

                db_tx = CreditCardTransaction(
                    date=date,
                    description=description.strip(),
                    state=state,
                    amount=float(amount.replace(",", "")),
                    category=category,
                    statement_period=statement_period,
                    month=month_str,
                    transaction_hash=None,
                )
                db.add(db_tx)

    db.commit()

    totals = {}
    for tx in transactions:
        totals[tx["category"]] = totals.get(tx["category"], 0) + tx["amount"]

    return {
        "month": statement_period,
        "totals": totals,
        "transactions": transactions,
    }

@router.get("/available-statement-periods")
def get_statement_periods(db: Session = Depends(get_db)):
    periods = (
        db.query(CreditCardTransaction.statement_period)
        .distinct()
        .all()
    )
    return [p[0] for p in periods]

@router.get("/transactions")
def get_transactions_by_category(
    statement_period: str = Query(...),
    category: str = Query(...),
    db: Session = Depends(get_db)
):
    transactions = (
        db.query(CreditCardTransaction)
        .filter(CreditCardTransaction.statement_period == statement_period)
        .filter(CreditCardTransaction.category == category)
        .all()
    )

    return [
        {
            "id": tx.id,
            "date": tx.date,
            "description": tx.description,
            "amount": tx.amount,
            "state": tx.state,
        }
        for tx in transactions
    ]

@router.get("/available-months")
def get_available_months(db: Session = Depends(get_db)):
    months = (
        db.query(CreditCardTransaction.month)
        .distinct()
        .all()
    )
    return [p[0] for p in months]

@router.get("/summary")
def get_summary(statement_period: str = Query(...), db: Session = Depends(get_db)):
    transactions = (
        db.query(CreditCardTransaction)
        .filter(CreditCardTransaction.statement_period == statement_period)
        .all()
    )

    totals = {}
    for tx in transactions:
        totals[tx.category] = totals.get(tx.category, 0) + tx.amount

    summary = [{"category": cat, "total": total} for cat, total in totals.items()]
    return {"statement_period": statement_period, "summary": summary}

@router.get("/uncategorized")
def get_uncategorized(statement_period: str = Query(...), db: Session = Depends(get_db)):
    uncategorized = (
        db.query(CreditCardTransaction)
        .filter(CreditCardTransaction.statement_period == statement_period)
        .filter(CreditCardTransaction.category == "Other")
        .all()
    )

    return [
        {
            "id": tx.id,
            "description": tx.description,
            "amount": tx.amount,
        }
        for tx in uncategorized
    ]

@router.get("/debug/months")
def debug_months(db: Session = Depends(get_db)):
    months = (
        db.query(CreditCardTransaction.month)
        .distinct()
        .all()
    )
    return [m[0] for m in months]

class CategoryUpdateRequest(BaseModel):
    tx_id: int
    new_category: str

@router.post("/update-category")
def update_category(
    payload: CategoryUpdateRequest = Body(...), 
    db: Session = Depends(get_db)
):
    tx = db.query(CreditCardTransaction).filter(CreditCardTransaction.id == payload.tx_id).first()
    if tx:
        tx.category = payload.new_category
        db.commit()
        return {"status": "success"}
    return {"error": "Transaction not found"}

@router.delete("/delete-transaction/{tx_id}")
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(CreditCardTransaction).filter(CreditCardTransaction.id == tx_id).first()
    if not tx:
        return JSONResponse(status_code=404, content={"error": "Transaction not found"})
    
    db.delete(tx)
    db.commit()
    return {"status": "deleted", "id": tx_id}
