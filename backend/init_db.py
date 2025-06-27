# backend/init_db.py
from models import Base, engine

# Base is your SQLAlchemy base class, from which all models (like Transaction) inherit.

# Base.metadata keeps track of all model/table definitions you've declared (like Transaction).

# .create_all(bind=engine) tells SQLAlchemy:

# “Look at all my model classes, and for each one, if the corresponding table doesn't already exist in the database, create it.”

# This creates the table(s)
# Base.metadata.create_all(bind=engine)

Base.metadata.drop_all(bind=engine)  # ← Drops existing tables
Base.metadata.create_all(bind=engine)  # ← Recreates with the new schema
print("Database initialized.")
