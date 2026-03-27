FROM python:3.11-slim
LABEL service="cnc-mayyanks-ingestion"
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8003
HEALTHCHECK --interval=30s --timeout=10s CMD curl -f http://localhost:8003/health || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8003", "--workers", "2"]
