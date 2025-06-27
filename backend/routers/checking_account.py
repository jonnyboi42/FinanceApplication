from fastapi import APIRouter, UploadFile, File, Depends, Query, Body
from sqlalchemy.orm import Session
from utils.parser_checking import extract_checking_transactions_from_pdf
from utils.categorizer import categorize
from utils.hash_util import compute_transaction_hash  # ✅ new import
from database import get_db
from models import CheckingTransaction
from pydantic import BaseModel
from fastapi.responses import JSONResponse
import tempfile, os

router = APIRouter()

@router.post("/upload")
async def upload_checking_pdf(file: UploadFile = File(...), db: Session = Depends(get_db)):
    temp_path = tempfile.mktemp(suffix=".pdf")
    with open(temp_path, "wb") as f:
        f.write(await file.read())

    transactions_data, statement_period = extract_checking_transactions_from_pdf(temp_path)
    os.remove(temp_path)

    if not transactions_data or not statement_period:
        return {"error": "Failed to extract transactions or period."}

    transactions = []

    start_date_str = statement_period.split(" to ")[0]
    inferred_year = start_date_str.split("/")[-1]

    for tx in transactions_data:
        date = tx["date"]
        description = tx["description"]
        amount = tx["amount"]
        category = categorize(description)

        month_num = int(date.split("/")[0])
        month_str = f"{inferred_year}-{month_num:02d}"

        # ✅ Compute hash and skip if it already exists
        tx_hash = compute_transaction_hash(date, description, amount)
        existing = db.query(CheckingTransaction).filter_by(transaction_hash=tx_hash).first()
        if existing:
            continue

        db_tx = CheckingTransaction(
            date=date,
            description=description.strip(),
            state=None,
            amount=amount,
            category=category,
            statement_period=statement_period,
            month=month_str,
            transaction_hash=tx_hash,
        )
        db.add(db_tx)

        transactions.append({
            "date": date,
            "description": description.strip(),
            "amount": amount,
            "category": category,
        })

    db.commit()

    totals = {}
    for tx in transactions:
        totals[tx["category"]] = totals.get(tx["category"], 0) + tx["amount"]

    return {
        "statement_period": statement_period,
        "totals": totals,
        "transactions": transactions,
    }

@router.get("/available-statement-periods")
def get_statement_periods(db: Session = Depends(get_db)):
    periods = (
        db.query(CheckingTransaction.statement_period)
        .distinct()
        .all()
    )
    return [p[0] for p in periods]

@router.get("/available-months")
def get_available_months(db: Session = Depends(get_db)):
    months = (
        db.query(CheckingTransaction.month)
        .distinct()
        .all()
    )
    return [m[0] for m in months]

@router.get("/summary")
def get_summary(statement_period: str = Query(...), db: Session = Depends(get_db)):
    transactions = (
        db.query(CheckingTransaction)
        .filter(CheckingTransaction.statement_period == statement_period)
        .filter(CheckingTransaction.category != "Other")  # 👈 Exclude "Other"
        .all()
    )

    totals = {}
    for tx in transactions:
        totals[tx.category] = totals.get(tx.category, 0) + tx.amount

    summary = [{"category": cat, "total": total} for cat, total in totals.items()]
    return {"statement_period": statement_period, "summary": summary}

@router.get("/transactions")
def get_transactions_by_category(
    statement_period: str = Query(...),
    category: str = Query(...),
    db: Session = Depends(get_db)
):
    transactions = (
        db.query(CheckingTransaction)
        .filter(CheckingTransaction.statement_period == statement_period)
        .filter(CheckingTransaction.category == category)
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

@router.get("/uncategorized")
def get_uncategorized(statement_period: str = Query(...), db: Session = Depends(get_db)):
    uncategorized = (
        db.query(CheckingTransaction)
        .filter(CheckingTransaction.statement_period == statement_period)
        .filter(CheckingTransaction.category == "Other")
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

class CategoryUpdateRequest(BaseModel):
    tx_id: int
    new_category: str

@router.post("/update-category")
def update_category(payload: CategoryUpdateRequest = Body(...), db: Session = Depends(get_db)):
    tx = db.query(CheckingTransaction).filter(CheckingTransaction.id == payload.tx_id).first()
    if tx:
        tx.category = payload.new_category
        db.commit()
        return {"status": "success"}
    return {"error": "Transaction not found"}

@router.delete("/delete-transaction/{tx_id}")
def delete_transaction(tx_id: int, db: Session = Depends(get_db)):
    tx = db.query(CheckingTransaction).filter(CheckingTransaction.id == tx_id).first()
    if not tx:
        return JSONResponse(status_code=404, content={"error": "Transaction not found"})
    
    db.delete(tx)
    db.commit()
    return {"status": "deleted", "id": tx_id}
