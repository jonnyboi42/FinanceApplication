# Personal Finance PDF Analyzer

This is a personal finance web application built to extract, categorize, and organize transactions from banking PDF statements — both **checking and credit card accounts**. The goal is to evaluate and visualize personal finances in a structured, scalable way.

## Features

- Upload **Wells Fargo PDF statements** (checking and credit).
- Automatically parses and extracts transactions.
- Categorizes expenses and displays visual summaries.
- Supports reviewing and reassigning uncategorized transactions.
- Clean frontend built with usability in mind.

## Tech Stack

- **Backend**: FastAPI (Python), SQLAlchemy
- **Frontend**: Next.js (React)
- **Database**: PostgreSQL
- **PDF Parsing**: pdfplumber

## Scalability in Mind

The app is designed to support multiple banks in the future. While it currently supports **Wells Fargo** (checking and credit card), the backend is structured so custom PDF parsers can be easily integrated for other financial institutions like Citi, Capital One, etc.



