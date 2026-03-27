# cnc.mayyanks.app — CNC Intelligence Platform

> Real-time CNC Process Intelligence & Predictive Automation

## Quick Start

```bash
# Clone and configure
cp .env.example .env
# Edit .env with your Google OAuth credentials

# Start all services
cd docker && docker compose up -d --build
```

- **Frontend**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **API Root**: http://localhost:8000/api

## Architecture

| Service | Port | Tech |
|---------|------|------|
| `cnc-mayyanks-api` | 8000 | FastAPI + PostgreSQL/TimescaleDB |
| `cnc-mayyanks-ml-service` | 8001 | XGBoost + Isolation Forest |
| `cnc-mayyanks-realtime` | 8002 | WebSocket + Live Simulator |
| `cnc-mayyanks-ingestion` | 8003 | Kafka Telemetry Pipeline |
| `cnc-mayyanks-edge-agent` | — | Go + MTConnect/OPC-UA |
| Frontend | 3000 | Next.js + React |

## Google OAuth Setup

1. Go to [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials)
2. Add **Authorized redirect URIs**:
   - Production: `https://cnc.mayyanks.app/api/auth/google/callback`
   - Development: `http://localhost:8000/api/auth/google/callback`
3. Set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env`

## Database Migrations

```bash
cd api
alembic upgrade head
alembic revision --autogenerate -m "description"
```

## Kubernetes Deployment

```bash
kubectl create namespace cnc-mayyanks
kubectl create secret generic cnc-mayyanks-secrets \
  --from-literal=database-url='...' \
  --from-literal=jwt-secret='...' \
  --from-literal=google-client-id='...' \
  --from-literal=google-client-secret='...' \
  -n cnc-mayyanks
kubectl apply -f infra/k8s/ -n cnc-mayyanks
```

## Security

- Google OAuth 2.0 (sole auth — no passwords)
- JWT session tokens (HS256)
- CORS whitelisting, trusted host enforcement
- HSTS, X-Frame-Options, CSP headers
- Rate limiting (NGINX: 100r/s API, 10r/s auth)
- API key auth for edge devices
- Request ID tracing + audit logging
- `.env` files gitignored

## License

Proprietary — cnc.mayyanks.app
