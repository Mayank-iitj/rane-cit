#!/bin/bash

# CNC Intelligence Platform - Complete Setup & Verification Script
# This script handles full system setup, validation, and demo readiness

set -e

echo "=================================================="
echo "CNC Intelligence Platform - Setup & Verification"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Docker
echo -e "${BLUE}[1/5]${NC} Checking Docker installation..."
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install Docker.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker found${NC}"

# Check Docker Compose
echo -e "${BLUE}[2/5]${NC} Checking Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found. Please install Docker Compose.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Docker Compose found${NC}"

# Create .env if missing
echo -e "${BLUE}[3/5]${NC} Checking environment configuration..."
if [ ! -f "backend/.env" ]; then
    if [ -f "backend/.env.example" ]; then
        cp backend/.env.example backend/.env
        echo -e "${GREEN}✓ Created .env from template${NC}"
    else
        echo -e "${YELLOW}⚠ Warning: .env.example not found${NC}"
    fi
else
    echo -e "${GREEN}✓ .env already exists${NC}"
fi

# Start services
echo -e "${BLUE}[4/5]${NC} Starting services..."
cd docker
docker-compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}Waiting for services to initialize (60 seconds)...${NC}"
sleep 60

# Verify system
echo -e "${BLUE}[5/5]${NC} Verifying system..."

echo ""
echo "Service Status:"
echo "--------------"

# Check PostgreSQL
if docker ps | grep -q cnc-postgres; then
    echo -e "${GREEN}✓${NC} PostgreSQL running"
else
    echo -e "${RED}✗${NC} PostgreSQL not running"
fi

# Check TimescaleDB
if docker ps | grep -q cnc-timescaledb; then
    echo -e "${GREEN}✓${NC} TimescaleDB running"
else
    echo -e "${RED}✗${NC} TimescaleDB not running"
fi

# Check Redis
if docker ps | grep -q cnc-redis; then
    echo -e "${GREEN}✓${NC} Redis running"
else
    echo -e "${RED}✗${NC} Redis not running"
fi

# Check Kafka
if docker ps | grep -q cnc-kafka; then
    echo -e "${GREEN}✓${NC} Kafka running"
else
    echo -e "${RED}✗${NC} Kafka not running"
fi

# Check Backend
if docker ps | grep -q cnc-backend; then
    echo -e "${GREEN}✓${NC} Backend API running"
else
    echo -e "${RED}✗${NC} Backend API not running"
fi

# Check Frontend
if docker ps | grep -q cnc-frontend; then
    echo -e "${GREEN}✓${NC} Frontend running"
else
    echo -e "${RED}✗${NC} Frontend not running"
fi

echo ""
echo "=================================================="
echo "System Ready!"
echo "=================================================="
echo ""
echo "Access Points:"
echo "--------------"
echo "Dashboard:    ${BLUE}http://localhost:3000${NC}"
echo "API Docs:     ${BLUE}http://localhost:8000/docs${NC}"
echo "PostgreSQL:   ${BLUE}localhost:5432${NC}"
echo "TimescaleDB:  ${BLUE}localhost:5433${NC}"
echo "Redis:        ${BLUE}localhost:6379${NC}"
echo "Kafka:        ${BLUE}localhost:9092${NC}"
echo "MQTT:         ${BLUE}localhost:1883${NC}"
echo ""
echo "Next Steps:"
echo "-----------"
echo "1. Open ${BLUE}http://localhost:3000${NC} in your browser"
echo "2. View API documentation at ${BLUE}http://localhost:8000/docs${NC}"
echo "3. Run system verification: ${BLUE}python ../scripts/verify_system.py${NC}"
echo ""
echo "To stop all services:"
echo "  docker-compose -f docker-compose.prod.yml down"
echo ""
echo "Built for Real Factories, Not for Demos ™"
