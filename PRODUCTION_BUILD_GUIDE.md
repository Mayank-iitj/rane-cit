# CNC.MAYYANKS.APP — PRODUCTION SYSTEM BUILD
# Complete, deployable, enterprise-grade CNC intelligence platform
# Domain: https://cnc.mayyanks.app

## 🏗️ SYSTEM ARCHITECTURE

### Microservices:
- **cnc-mayyanks-api** (NestJS - Main API Gateway)
- **cnc-mayyanks-frontend** (Next.js 16 - Dashboard)
- **cnc-mayyanks-realtime** (WebSocket Server - Live Data)  
- **cnc-mayyanks-ml-service** (Python/FastAPI - Predictions)
- **cnc-mayyanks-ingestion** (Data Intake)

### Infrastructure:
- PostgreSQL 16 + TimescaleDB (Time-series)
- Redis 7 (Caching + Sessions)
- Kafka 7.5.0 (Event Streaming)
- MQTT (Machine Communication)
- Nginx (Reverse Proxy)

## 📦 BUILD INSTRUCTIONS

### Prerequisites:
```bash
Node.js 18+ (Backend)
Python 3.11+ (ML Service)
Docker & Docker Compose
PostgreSQL 16 + TimescaleDB
```

### 1. Backend Setup (NestJS)
```bash
cd backend
npm install
npm run build
npm run start:prod
```

### 2. Frontend Setup (Next.js)
```bash
cd frontend
npm install
npm run build
npm start
```

### 3. ML Service Setup (Python)
```bash
cd ml-service
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt
python main.py
```

### 4. Docker Compose (Full Stack)
```bash
# Create .env file with secrets
cat > docker/.env << EOF
DB_PASSWORD=your-secure-password
JWT_SECRET=your-jwt-secret-32-chars-min
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
EOF

# Start all services
cd docker
docker-compose up -d

# Verify services are running
curl http://localhost:8000/health
curl http://localhost:3000
```

## 🚀 DEPLOYMENT

### Production Deployment (Ubuntu 22.04):
```bash
# 1. Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Clone repository
git clone https://github.com/Mayank-iitj/cnc-intelligence-platform.git
cd cnc-intelligence-platform

# 3. Setup environment
cat > docker/.env.production << EOF
NODE_ENV=production
DB_PASSWORD=$(openssl rand -hex 16)
JWT_SECRET=$(openssl rand -hex 32)
GOOGLE_CLIENT_ID=<your-google-client-id>
GOOGLE_CLIENT_SECRET=<your-google-client-secret>
EOF

# 4. Deploy with Docker Compose
cd docker
docker-compose -f docker-compose.prod.yml up -d

# 5. Configure Nginx with SSL
sudo apt install -y nginx certbot python3-certbot-nginx
sudo certbot --nginx -d cnc.mayyanks.app

# 6. Configure DNS
# Point cnc.mayyanks.app A record to server IP

# 7. Verify
curl https://cnc.mayyanks.app/health
open https://cnc.mayyanks.app
```

## 📊 API ENDPOINTS

### Core Routes:
```
POST   /api/auth/login               - User login
POST   /api/auth/register            - Registration
GET    /api/auth/me                  - Current user
POST   /api/machines                 - Register machine
GET    /api/machines                 - List machines
POST   /api/telemetry/ingest         - Submit telemetry
GET    /api/analytics/oee            - OEE metrics
GET    /api/alerts                   - List alerts
POST   /api/copilot/ask              - AI queries

WebSocket:
WS     /ws/telemetry/:machine_id     - Live data
WS     /ws/alerts                    - Alert stream
```

## 🔐 SECURITY FEATURES

✓ JWT authentication with refresh tokens
✓ Google OAuth 2.0 integration  
✓ Role-based access control (RBAC)
✓ Rate limiting (100 req/min)
✓ Input validation & sanitization
✓ CORS protection
✓ HTTPS/SSL
✓ Audit logging
✓ API key management

## 🧪 TESTING

```bash
# Backend
cd backend
npm run test
npm run test:cov

# Frontend
cd frontend
npm run test

# E2E testing
npm run test:e2e

# Load testing
k6 run tests/load-test.js
```

##  📚 MONITORING

### Health Checks:
```bash
# API health
curl http://localhost:8000/health

# Database
curl http://localhost:8000/health/db

# Redis
curl http://localhost:8000/health/redis

# Overall readiness
curl http://localhost:8000/health/ready
```

### Logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f cnc-mayyanks-api

# Follow with grep
docker-compose logs -f cnc-mayyanks-api | grep ERROR
```

## 🎯 PRODUCTION CHECKLIST

- [ ] Environment variables configured (DB, JWT, OAuth)
- [ ] Database migrations run
- [ ] Redis cache warmed
- [ ] SSL certificates installed
- [ ] DNS pointing to server
- [ ] Backup strategy configured
- [ ] Monitoring & alerting set up
- [ ] Log aggregation configured
- [ ] Rate limiting tested
- [ ] Load testing completed

## 📞 TROUBLESHOOTING

### Backend won't start:
```bash
docker-compose logs cnc-mayyanks-api
# Check: DB connection, Redis, JWT_SECRET
```

### Frontend can't connect to API:
```bash
# Verify CORS_ORIGINS in backend .env
# Check browser DevTools Network tab
# Ensure API_URL in .env.production is correct
```

### Database connection errors:
```bash
docker exec cnc-mayyanks-postgres pg_isready -U cnc_mayyanks
```

###High memory usage:
```bash
docker stats
# Adjust pool_size in database config
```

## 🔗 RESOURCES

- API Docs: `https://cnc.mayyanks.app/api/docs`
- Redoc: `https://cnc.mayyanks.app/api/redoc`
- GitHub: `https://github.com/Mayank-iitj/cnc-intelligence-platform`

---

**Status**: ✅ Production Ready
**Last Updated**: 2026-03-27
**Domain**: cnc.mayyanks.app
**Support**: Refer to GitHub Issues
