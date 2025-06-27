import os
from sqlalchemy import Column, Integer, String, Float, create_engine
from sqlalchemy import UniqueConstraint
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

# Load Environment Variable from .env file
load_dotenv()
DATABASE_URL = DATABASE_URL = os.getenv("DATABASE_URL")

# Set up database engine and session
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Declare the base class
Base = declarative_base()

class CreditCardTransaction(Base):
    __tablename__ = "credit_card_transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False)
    description = Column(String, nullable=False)
    state = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    statement_period = Column(String, nullable=False)
    month = Column(String, nullable=False)
    transaction_hash = Column(String, nullable=True, index=True)

    __table_args__ = (
        UniqueConstraint(
            'date', 'description', 'state', 'amount', 'month',
            name='uq_credit_card_tx_unique_fields'
        ),
    )


class CheckingTransaction(Base):
    __tablename__ = "checking_transactions"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(String, nullable=False)
    description = Column(String, nullable=False)
    state = Column(String, nullable=True)
    amount = Column(Float, nullable=False)
    category = Column(String, nullable=False)
    statement_period = Column(String, nullable=False)
    month = Column(String, nullable=False)
    transaction_hash = Column(String, nullable=True, index=True)

    __table_args__ = (
        UniqueConstraint(
            'date', 'description', 'state', 'amount', 'month',
            name='uq_checking_tx_unique_fields'
        ),
    )

# You can later add a RentUtilitiesTransaction model for rent + utilities table similarly.

