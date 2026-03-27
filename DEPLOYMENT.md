# CNC Intelligence Platform - Deployment & Getting Started Guide

## Quick Start (Local Development)

### Prerequisites
- Docker & Docker Compose
- Python 3.11+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Step 1: Environment Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
```

### Step 2: Database Initialization

```bash
cd backend
python scripts/seed_db.py
```

### Step 3: Run with Docker Compose

```bash
cd docker
docker-compose -f docker-compose.prod.yml up -d
```

This starts:
- **PostgreSQL** (port 5432)
- **TimescaleDB** (port 5433)
- **Redis** (port 6379)
- **Kafka** (port 9092)
- **MQTT** (port 1883)
- **Backend API** (port 8000)
- **Frontend** (port 3000)

### Step 4: Verify Installation

```bash
# Check service health
curl http://localhost:8000/health

# Access frontend
open http://localhost:3000

# Access API docs
open http://localhost:8000/docs
```

---

## Production Deployment

### AWS EC2 Deployment

```bash
# 1. Launch EC2 instance (Ubuntu 22.04 LTS, t3.medium or larger)
# 2. SSH into instance

ssh -i your-key.pem ubuntu@<instance-ip>

# 3. Install Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# 4. Clone repo
git clone https://github.com/yourusername/cnc-intelligence-platform.git
cd cnc-intelligence-platform

# 5. Configure environment
cp backend/.env.example backend/.env
nano backend/.env  # Edit with production values

# 6. Deploy
cd docker
docker-compose -f docker-compose.prod.yml up -d

# 7. Setup SSL (optional but recommended)
# Use Let's Encrypt with Certbot
```

### Google Cloud Deployment

```bash
# Similar to AWS - use Compute Engine VM
gcloud compute instances create cnc-platform --image-family=ubuntu-2204-lts

# Then follow AWS steps above
```

### Kubernetes Deployment

```bash
# 1. Build and publish images
docker build -f docker/Dockerfile.backend -t your-registry/cnc-backend:latest .
docker push your-registry/cnc-backend:latest

# 2. Create Kubernetes ConfigMap and Secrets
kubectl create configmap cnc-config --from-file=backend/.env

# 3. Deploy with Helm
helm install cnc-platform ./helm/cnc-platform
```

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Next.js)                       │
│              Real-time Dashboard & Analytics                │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP/WebSocket
┌─────────────────────▼───────────────────────────────────────┐
│                   BACKEND (FastAPI)                         │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ API Routes │ Auth/RBAC │ WebSocket │ Multi-tenant   │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  ML Engine │ Edge Processing │ Protocol Adapters    │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────┬──────────────┬──────────────┬───────────┬─────────┘
          │              │              │           │
  ┌───────▼──┐  ┌───────▼──┐  ┌───────▼──┐  ┌───▼────┐
  │PostgreSQL│  │ TimescaleDB│  │Kafka/   │  │ Redis  │
  │(Metadata)│  │(Telemetry)│  │Redpanda │  │(Cache) │
  └──────────┘  └───────────┘  └─────────┘  └────────┘
                                      │
                    ┌─────────────────┴──────────────────┐
                    │                                    │
            ┌───────▼──────┐                  ┌─────────▼─────┐
            │  MQTT Broker │                  │MQTT Edge Agent│
            │(EdgeMessages)│                  │(CNC Machine)  │
            └───────────────┘                  └───────────────┘
```

---

## API Endpoints

### Authentication
- `POST /api/v1/auth/login` - Get access token
- `POST /api/v1/auth/token/refresh` - Refresh token

### Machines
- `GET /api/v1/machines` - List all machines
- `GET /api/v1/machines/{machine_id}` - Get machine status
- `POST /api/v1/machines/{machine_id}/status` - Update machine status

### Predictions
- `POST /api/v1/predict/tool-health` - Predict RUL
- `GET /api/v1/predict/models/status` - Get model status

### Anomalies
- `POST /api/v1/detect/anomaly` - Detect anomaly
- `GET /api/v1/detect/status` - Get detector status

### Optimization
- `POST /api/v1/optimize/parameters` - Get parameter recommendations
- `GET /api/v1/optimize/config` - Get optimization config

### Dashboard
- `GET /api/v1/dashboard/stats` - Get dashboard statistics
- `GET /api/v1/alerts` - Get recent alerts
- `GET /api/v1/recommendations` - Get recommendations
- `WebSocket /api/v1/stream/live` - Real-time telemetry stream

---

## Feature Flags & Configuration

### Environment Variables
```
# ML/AI
ENABLE_DIGITAL_TWIN=False
ENABLE_COPILOT=False
ENABLE_GCODE_OPTIMIZER=False
ENABLE_ROI_ANALYTICS=True

# Streaming
KAFKA_BROKERS=localhost:9092
MQTT_BROKER=localhost

# Alerts
ALERT_EMAIL_ENABLED=False
ALERT_TWILIO_ENABLED=False
```

---

## Monitoring & Logging

### Health Checks
- Backend: `curl http://localhost:8000/health`
- Readiness: `curl http://localhost:8000/health/ready`
- Docker: `docker ps` (verify all containers running)

### Logs
```bash
# View backend logs
docker logs cnc-backend

# View frontend logs
docker logs cnc-frontend

# View all services
docker-compose logs -f
```

### Metrics
- Prometheus exposed at `/metrics` (not yet integrated)
- CPU/Memory: Use `docker stats`

---

## Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL
docker exec cnc-postgres psql -U cnc_user -d cnc_db -c "SELECT 1"

# Check TimescaleDB
docker exec cnc-timescaledb psql -U cnc_user -d cnc_timescale -c "SELECT 1"
```

### Kafka Connection Error
```bash
# Check Kafka broker
docker exec cnc-kafka kafka-broker-api-versions.sh --bootstrap-server localhost:9092
```

### MQTT Connection Error
```bash
# Check MQTT broker
docker exec cnc-mosquitto mosquitto_pub -h localhost -p 1883 -t "test" -m "hello"
```

### Frontend Can't Connect to Backend
- Check CORS: Verify `CORS_ORIGINS` in backend `.env`
- Check API URL: Verify `NEXT_PUBLIC_API_URL` in frontend env
- Check firewall: Ensure port 8000 is accessible

---

## Security Considerations

1. **Change default credentials** in `.env` before production
2. **Enable HTTPS** using nginx or cloud load balancer
3. **Setup VPC** to restrict network access
4. **Enable authentication** on all endpoints
5. **Rotate secret keys** regularly
6. **Monitor logs** for unauthorized access attempts
7. **Backup databases** regularly
8. **Use strong passwords** for database users

---

## Performance Tuning

### Database Optimization
```sql
-- Create indexes for common queries
CREATE INDEX idx_sensor_timestamp ON sensor_data(timestamp DESC);
CREATE INDEX idx_prediction_machine ON predictions(machine_id, timestamp DESC);

-- Run VACUUM regularly (PostgreSQL)
VACUUM ANALYZE;
```

### Redis Optimization
```bash
# Increase max memory for caching
redis-cli CONFIG SET maxmemory 1gb
```

### Kafka Optimization
```properties
# In server.properties
compression.type=snappy
log.retention.hours=168  # 7 days
num.network.threads=8
num.io.threads=8
```

---

## Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v --cov=app
```

### Frontend Tests
```bash
cd frontend
npm run test
npm run test:e2e
```

### Integration Tests
```bash
cd tests
pytest integration/ -v
```

---

## Support & Documentation

- **API Docs**: http://localhost:8000/docs (Swagger UI)
- **ReDoc**: http://localhost:8000/redoc
- **GitHub Issues**: Report bugs and feature requests
- **Email**: support@cnc-platform.example.com

---

## License

Proprietary - CNC Intelligence Platform
Copyright 2024 - All Rights Reserved

---

## Version History

- **v1.0.0** (2024-03-26) - Initial release
  - Core ML engine (LSTM + XGBoost)
  - Anomaly detection with Isolation Forest
  - Parameter optimization with RL hooks
  - Multi-tenant architecture
  - Real-time WebSocket streaming
  - Protocol adapters (MTConnect, OPC-UA, Modbus)
  - Edge processing module
  - Production deployment ready
