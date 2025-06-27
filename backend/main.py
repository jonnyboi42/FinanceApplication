from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers.credit_card import router as credit_card_router
from routers.checking_account import router as checking_account_router

app = FastAPI()

# CORS settings (adjust if needed)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Update with your frontend origin if needed
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include your route modules
app.include_router(credit_card_router, prefix="/credit", tags=["Credit Card"])
app.include_router(checking_account_router, prefix="/checking", tags=["Checking Account"])
