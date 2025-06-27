import pdfplumber
import re

def extract_checking_transactions_from_pdf(temp_path):
    with pdfplumber.open(temp_path) as pdf:
        text = "\n".join(p.extract_text() or "" for p in pdf.pages)

    # Extract beginning date for year inference
    date_match = re.search(r"Beginning balance on (\d{1,2})/(\d{1,2})", text)
    year_match = re.search(r"\b(20\d{2})\b", text)

    if not date_match or not year_match:
        return None, None

    month, _ = date_match.groups()
    year = year_match.group(1)
    statement_period = f"{month}/01/{year} to {month}/31/{year}"

    # Clean and split lines
    lines = text.split("\n")
    transactions = []

    current_tx = []
    for line in lines:
        if not isinstance(line, str):
            continue
        line = line.strip()
        if not line:
            continue

        # Match new transaction start: a line that begins with MM/DD
        if re.match(r"^\d{1,2}/\d{1,2}", line):
            # Process the previous transaction
            if current_tx:
                tx = parse_transaction_block(current_tx, year)
                if tx:
                    transactions.append(tx)
                current_tx = []

        current_tx.append(line)

    # Catch final transaction
    if current_tx:
        tx = parse_transaction_block(current_tx, year)
        if tx:
            transactions.append(tx)

    return transactions, statement_period


def parse_transaction_block(lines, year):
    print("LINES BLOCK:", lines)  # Debug print

    block = " ".join(str(line).strip() for line in lines if isinstance(line, str) and line.strip())

    # Updated regex match
    match = re.match(r"(?P<date>\d{1,2}/\d{1,2})\s+(?P<desc>.+?)\s+(?P<amount>[\d,]+\.\d{2})", block)

    if not match:
        print("Failed to match block:", block)  # Debug
        return None

    date = match.group("date") + f"/{year}"
    desc = match.group("desc").strip()
    amount_str = match.group("amount").replace(",", "")
    amount = float(amount_str)

    return {
        "date": date,
        "description": desc,
        "amount": amount
    }
