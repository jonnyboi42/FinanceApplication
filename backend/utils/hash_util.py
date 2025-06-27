import hashlib

def compute_transaction_hash(date, description, amount):
    raw = f"{date}|{description.lower().strip()}|{amount:.2f}"
    return hashlib.sha256(raw.encode()).hexdigest()
