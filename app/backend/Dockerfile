# FinQuest Backend Development Dockerfile
# Includes numpy, scipy, scikit-learn for AI/ML features.
# For production (backend + frontend in one image), use the Dockerfile at the project root.

FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (includes numpy, scipy, scikit-learn for AI features)
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code and seed script
COPY app/ ./app/
COPY seed_test_data.py ./seed_test_data.py
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

ENTRYPOINT ["./docker-entrypoint.sh"]
