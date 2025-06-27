import pdfplumber
import re

def extract_transactions_from_pdf(temp_path):
    with pdfplumber.open(temp_path) as pdf:
        text = "\n".join(p.extract_text() for p in pdf.pages if p.extract_text())

        # Extract Statement Period
        date_range_match = re.search(r"Statement Period\s+(\d{2}/\d{2}/\d{4})\s+to\s+(\d{2}/\d{2}/\d{4})", text)
        if not date_range_match:
            return None, None
        start_date, end_date = date_range_match.groups()

        # Extract Transactions Section
        start = "Purchases, Balance Transfers & Other Charges"
        end = "TOTAL PURCHASES, BALANCE TRANSFERS & OTHER CHARGES FOR THIS PERIOD"
        match = re.search(f"{start}(.*?){end}", text, re.DOTALL)
        if not match:
            return None, None

        lines = match.group(1).strip().split("\n")
        return lines, f"{start_date} to {end_date}"
