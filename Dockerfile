# FinQuest Production Dockerfile
# Builds the React frontend and FastAPI backend into a single image

# ── Stage 1: Build Frontend ──
FROM node:20-alpine AS frontend-builder

WORKDIR /frontend

# Install dependencies
COPY app/package.json app/package-lock.json ./
RUN npm ci --no-audit --no-fund

# Build the frontend
COPY app/ ./
RUN npm run build

# ── Stage 2: Build Backend ──
FROM python:3.12-slim AS backend

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (includes numpy, scipy, scikit-learn for AI features)
COPY app/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source code
COPY app/backend/app/ ./app/

# Copy built frontend static files into backend's static directory
COPY --from=frontend-builder /frontend/dist/public/ ./dist/public/

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV ENVIRONMENT=production

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
