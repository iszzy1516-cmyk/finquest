#!/bin/sh
set -e

# Seed test users (creates tables if needed)
python seed_test_data.py

# Start the FastAPI server (passes any extra args to uvicorn)
exec uvicorn app.main:app --host 0.0.0.0 --port 8000 "$@"
