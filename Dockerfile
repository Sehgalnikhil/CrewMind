FROM python:3.11-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy pyproject.toml
COPY backend/pyproject.toml ./

# Install python dependencies
RUN pip install --no-cache-dir -e .

# Copy application code
COPY backend/ .

# Expose port (Render sets $PORT, default to 8000)
ENV PORT=8000
EXPOSE $PORT

# Start command
# We run migrations first, then start the server
CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT"]
