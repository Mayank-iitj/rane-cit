# CNC Intelligence Platform — Backend Deployment Guide
## Production Deployment for cnc.mayyanks.app

### Prerequisites
- Docker & Docker Compose installed
- PostgreSQL 16 + TimescaleDB
- Redis 7+
- Kafka 7.5.0
- MQTT Broker
- GitHub Secrets configured with actual credentials

### Quick Start — Docker Compose

```bash
# 1. Navigate to docker directory
cd docker

# 2. Create .env file with production secrets
cat > .env << EOF
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
SECRET_KEY=your-secret-key-min-32-chars
EOF

# 3. Build and start all services
docker-compose -f docker-compose.prod.yml up -d

# 4. Wait for services to be healthy (30-60 seconds)
sleep 60

# 5. Verify backend is running
curl http://localhost:8000/health
# Expected: {"status": "healthy", "service": "cnc-mayyanks-api", "database": "ok"}

# 6. Access API documentation
open http://localhost:8000/docs
```

### Service URLs (Local Development)

| Service | URL | Port |
|---------|-----|------|
| Backend API | http://localhost:8000 | 8000 |
| Frontend | http://localhost:3000 | 3000 |
| PostgreSQL | localhost:5432 | 5432 |
| Redis | localhost:6379 | 6379 |
| Kafka | localhost:9092 | 9092 |
| MQTT | localhost:1883 | 1883 |
| API Docs | http://localhost:8000/docs | - |
| Redoc | http://localhost:8000/redoc | - |

### Key Endpoints

#### Health & Status
- `GET /` — API root info
- `GET /api` — Comprehensive API documentation
- `GET /health` — Health check
- `GET /health/ready` — Readiness probe (Kubernetes)

#### Authentication
- `POST /api/auth/login` — Username/password login
- `POST /api/auth/register` — User registration
- `GET /api/auth/google/login` — Google OAuth consent screen
- `GET /api/auth/google/callback` — Google OAuth callback handler
- `POST /api/auth/google/verify-token` — Verify Google ID token
- `POST /api/auth/refresh` — Refresh JWT tokens
- `GET /api/auth/me` — Current user info

#### Machines
- `POST /api/machines` — Register new machine
- `GET /api/machines` — List all org machines
- `GET /api/machines/{id}` — Get machine details
- `PATCH /api/machines/{id}` — Update machine
- `DELETE /api/machines/{id}` — Delete machine
- `POST /api/machines/{id}/heartbeat` — Machine heartbeat
- `GET /api/machines/{id}/telemetry` — Recent telemetry

#### Telemetry
- `POST /api/telemetry/` — Record single data point
- `POST /api/telemetry/batch` — Bulk insert (recommended for agents)
- `GET /api/telemetry/{machine_id}` — Query telemetry history
- `GET /api/telemetry/{machine_id}/stats` — Aggregated statistics

#### Analytics
- `GET /api/analytics/machines/{id}/overview` — Machine performance
- `GET /api/analytics/org/roi` — Organization ROI calculation

#### Alerts
- `POST /api/alerts/` — Create alert
- `GET /api/alerts/` — List alerts (filterable by machine, severity)
- `GET /api/alerts/{id}` — Get alert details
- `PATCH /api/alerts/{id}/acknowledge` — Acknowledge alert
- `GET /api/alerts/org/critical-count` — Critical unacked count

### Database Migrations

```bash
# Create initial database schema
cd api
alembic upgrade head

# Generate new migration (after model changes)
alembic revision --autogenerate -m "Description of changes"

# Downgrade to previous revision (if needed)
alembic downgrade -1
```

### Environment Configuration

| Variable | Purpose | Production Value |
|----------|---------|------------------|
| `DATABASE_URL` | PostgreSQL connection | See docker-compose.prod.yml |
| `REDIS_URL` | Redis cache connection | redis://redis:6379/0 |
| `SECRET_KEY` | JWT signing key | Use strong random 32+ char string |
| `DEBUG` | Debug mode | false |
| `GOOGLE_CLIENT_ID` | OAuth app ID | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | OAuth app secret | From Google Cloud Console |
| `KAFKA_BROKERS` | Kafka connection | kafka:9092 |
| `MQTT_BROKER` | MQTT server | mqtt |
| `LOG_LEVEL` | Logging verbosity | INFO (or DEBUG in dev) |
| `ENABLE_SIMULATOR` | Demo data generation | true (disable in prod if preferred) |

### Production Deployment on Ubuntu 22.04

```bash
# 1. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 2. Clone repository
git clone https://github.com/Mayank-iitj/cnc-intelligence-platform.git
cd cnc-intelligence-platform

# 3. Configure secrets
cat > docker/.env.production << EOF
GOOGLE_CLIENT_ID=$(openssl rand -hex 16)
GOOGLE_CLIENT_SECRET=$(openssl rand -hex 32)
SECRET_KEY=$(openssl rand -hex 32)
EOF

# 4. Setup Nginx reverse proxy (HTTPS)
sudo apt install -y nginx
sudo cp infra/nginx.conf /etc/nginx/sites-available/cnc.mayyanks.app
sudo ln -s /etc/nginx/sites-available/cnc.mayyanks.app /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 5. Configure Let's Encrypt SSL
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d cnc.mayyanks.app

# 6. Start services
cd docker
sudo docker-compose -f docker-compose.prod.yml up -d

# 7. Verify
curl https://cnc.mayyanks.app/health
```

### Monitoring & Logging

```bash
# View backend logs
docker logs cnc-mayyanks-api-prod -f

# View all services
docker-compose -f docker/docker-compose.prod.yml logs -f

# Health check
curl http://localhost:8000/health

# Readiness probe (Kubernetes)
curl http://localhost:8000/health/ready
```

### Database Backups

```bash
# Backup database
docker exec cnc-mayyanks-postgres-prod pg_dump -U cnc_mayyanks cnc_mayyanks_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker exec -i cnc-mayyanks-postgres-prod psql -U cnc_mayyanks cnc_mayyanks_db < backup.sql
```

### Performance Tuning

1. **Database Connection Pooling** — Configured in `config.py` (pool_size=20, max_overflow=10)
2. **Redis Caching** — TTL set to 300 seconds for telemetry stats
3. **Kafka Batch Processing** — Telemetry batch endpoint optimized for bulk ingestion
4. **TimescaleDB Compression** — Automatically compresses telemetry older than 7 days
5. **API Rate Limiting** — 100 requests per minute per tenant

### Kubernetes Deployment

```yaml
# See infra/k8s/deployment.yaml for complete config
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cnc-api
spec:
  replicas: 3
  template:
    spec:
      containers:
      - name: api
        image: docker.io/yourusername/cnc-api:latest
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health/ready
            port: 8000
          initialDelaySeconds: 5
          periodSeconds: 5
```

### Troubleshooting

#### Backend won't start
```bash
# Check logs
docker logs cnc-mayyanks-api-prod

# Common issues:
# - Database not ready: Wait 30-60 seconds for postgres healthcheck
# - Port already in use: Change port in docker-compose.prod.yml
# - Environment variables missing: Add to .env file
```

#### Database connection errors
```bash
# Test connection
docker exec cnc-mayyanks-postgres-prod pg_isready -U cnc_mayyanks

# Check database
docker exec -it cnc-mayyanks-postgres-prod psql -U cnc_mayyanks -d cnc_mayyanks_db
```

#### High memory usage
```bash
# Check service memory
docker stats cnc-mayyanks-api-prod

# Reduce telemetry history (delete old data)
docker exec -it cnc-mayyanks-postgres-prod psql -U cnc_mayyanks -d cnc_mayyanks_db
# DELETE FROM telemetry WHERE timestamp < NOW() - INTERVAL '30 days';
```

### Security Checklist

- [ ] `SECRET_KEY` changed from default
- [ ] OAuth credentials set in GitHub Secrets
- [ ] Database password changed from default
- [ ] HTTPS/SSL configured with valid certificate
- [ ] CORS origins restricted to cnc.mayyanks.app
- [ ] Firewall rules restrict API access
- [ ] Regular database backups automated
- [ ] Log monitoring configured
- [ ] Rate limiting enabled

### Support & Documentation

- **API Docs**: http://cnc.mayyanks.app/docs (Swagger UI)
- **Redoc**: http://cnc.mayyanks.app/redoc (ReDoc)
- **GitHub Repo**: https://github.com/Mayank-iitj/cnc-intelligence-platform
- **Issues**: Report via GitHub Issues

---
**Last Updated**: March 27, 2026
**Status**: Production Ready ✅
