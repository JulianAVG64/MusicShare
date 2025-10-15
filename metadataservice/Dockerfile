FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy and install requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code (incluye proto ya generado)
COPY app/ ./app/

# Verify proto files exist
RUN ls -la app/proto/ && \
    test -f app/proto/metadata_pb2.py && \
    test -f app/proto/metadata_pb2_grpc.py || \
    (echo "ERROR: Proto files not found!" && exit 1)

# Create non-root user
RUN useradd -m -u 1001 appuser && \
    chown -R appuser:appuser /app

USER appuser

EXPOSE 50051

ENV PYTHONPATH=/app:$PYTHONPATH
ENV PYTHONUNBUFFERED=1

CMD ["python", "-m", "app.main"]