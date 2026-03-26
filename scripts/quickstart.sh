#!/bin/bash

# CNC Intelligence Platform - Quick Start Script
# Sets up and starts the entire system locally

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════╗"
echo "║   CNC Intelligence Platform - Quick Start                 ║"
echo "║   Production-Ready AI-Powered CNC System                  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check Docker
echo -e "${YELLOW}Checking Docker installation...${NC}"
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

# Check Docker Compose
echo -e "${YELLOW}Checking Docker Compose installation...${NC}"
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found. Please install Docker Compose.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found${NC}"

# Navigate to docker directory
cd docker

# Check if .env exists
if [ ! -f ../backend/.env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    cp ../backend/.env.example ../backend/.env
    echo -e "${GREEN}✓ .env file created (update with your settings)${NC}"
fi

# Start services
echo ""
echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo ""
echo -e "${YELLOW}Waiting for services to start (60 seconds)...${NC}"
sleep 60

# Check API health
echo -e "${YELLOW}Verifying API health...${NC}"
MAX_RETRIES=10
RETRY=0
while [ $RETRY -lt $MAX_RETRIES ]; do
    if curl -s http://localhost:8000/health > /dev/null; then
        echo -e "${GREEN}✓ API is healthy${NC}"
        break
    fi
    RETRY=$((RETRY + 1))
    echo "Waiting... (attempt $RETRY/$MAX_RETRIES)"
    sleep 3
done

if [ $RETRY -eq $MAX_RETRIES ]; then
    echo -e "${RED}✗ API failed to start${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗"
echo "║                    🎉 Ready to Use! 🎉                      ║"
echo "╚════════════════════════════════════════════════════════════╝${NC}"

echo ""
echo -e "${YELLOW}Access Points:${NC}"
echo -e "  Web Dashboard:    ${GREEN}http://localhost:3000${NC}"
echo -e "  API Server:       ${GREEN}http://localhost:8000${NC}"
echo -e "  API Docs:         ${GREEN}http://localhost:8000/docs${NC}"
echo ""
echo -e "${YELLOW}Services:${NC}"
echo -e "  PostgreSQL:       ${GREEN}localhost:5432${NC}"
echo -e "  TimescaleDB:      ${GREEN}localhost:5433${NC}"
echo -e "  Redis:            ${GREEN}localhost:6379${NC}"
echo -e "  Kafka:            ${GREEN}localhost:9092${NC}"
echo -e "  MQTT:             ${GREEN}localhost:1883${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo -e "  1. Open dashboard:        open http://localhost:3000"
echo -e "  2. Check API docs:         open http://localhost:8000/docs"
echo -e "  3. Verify system:          python ../scripts/verify_system.py"
echo -e "  4. View logs:              docker-compose logs -f"
echo -e "  5. Stop services:          docker-compose down"
echo ""
echo -e "${YELLOW}Demo Data:${NC}"
echo -e "  Simulator is running with 4 demo CNC machines"
echo -e "  Check 'Machines' page to see live telemetry"
echo ""
