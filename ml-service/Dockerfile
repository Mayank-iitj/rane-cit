FROM python:3.11-slim

LABEL service="cnc-mayyanks-ml-service"
LABEL maintainer="cnc.mayyanks.app"

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .

EXPOSE 8001
HEALTHCHECK --interval=30s --timeout=10s CMD curl -f http://localhost:8001/health || exit 1
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001", "--workers", "2"]
