# CNC-MAYYANKS.APP — QUICK START REFERENCE

**Status**: Production NestJS architecture skeleton complete  
**Domain**: https://cnc.mayyanks.app  
**Tech Stack**: NestJS + TypeORM + PostgreSQL + Redis  

---

## 🚀 IMMEDIATE START (Session 8+)

### 1. Verify Project Setup
```bash
cd c:\Users\MS\cnc-intelligence-platform\backend

# Check .env is present with DB credentials
cat .env

# Verify package.json has all dependencies
cat package.json

# Install if not done
npm install
```

### 2. Build & Start Development
```bash
# Build TypeScript
npm run build

# Start development server (with hot reload)
npm run start:dev

# Should see:
# 🚀 cnc-mayyanks-api is running on port 8000
# ✅ Database connected successfully
```

### 3. Test Backend is Running
```bash
# Test health endpoint
curl http://localhost:8000/health

# Should return: {"status":"ok"}
```

---

## 📁 KEY FILES CREATED (Session 7)

### Documentation
```
✅ PRODUCTION_BUILD_GUIDE.md          (Deployment instructions)
✅ SESSION_7_SUMMARY.md               (This session's work)
✅ BACKEND_DEPLOYMENT.md              (Previous session's guide)
```

### Database Entities (8 total)
```
✅ backend/src/entities/organization.entity.ts
✅ backend/src/entities/user.entity.ts
✅ backend/src/entities/machine.entity.ts
✅ backend/src/entities/telemetry.entity.ts
✅ backend/src/entities/alert.entity.ts
✅ backend/src/entities/gcode-program.entity.ts
✅ backend/src/entities/api-key.entity.ts
✅ backend/src/entities/audit-log.entity.ts
✅ backend/src/entities/index.ts        (Exports all)
```

### DTOs & Validation (4 groups)
```
✅ backend/src/dtos/auth.dto.ts        (5 DTOs: Login, Register, etc.)
✅ backend/src/dtos/machine.dto.ts     (4 DTOs: Create, Update, Response)
✅ backend/src/dtos/telemetry.dto.ts   (4 DTOs: Ingest, Batch, Response)
✅ backend/src/dtos/alert.dto.ts       (4 DTOs: Create, Update, Response)
✅ backend/src/dtos/index.ts           (Exports all)
```

---

## 🛠️ NEXT CRITICAL TASKS (Session 8)

### Task 1: Auth Module (START HERE - Foundation for everything)
**Why First**: All other modules depend on authentication

**Create Files**:
```
backend/src/modules/auth/
├── auth.controller.ts        (Routes: login, register, refresh, callback)
├── auth.service.ts           (JWT + OAuth logic)
├── jwt.strategy.ts           (Passport JWT strategy)
├── jwt-auth.guard.ts         (Request authentication guard)
└── auth.module.ts            (Module registration)
```

**Routes to Implement**:
```
POST   /api/auth/login              (email, password) → JWT
POST   /api/auth/register           (email, password, name) → JWT + refresh_token
POST   /api/auth/refresh            (refresh_token) → new JWT
GET    /api/auth/callback           (OAuth code) → JWT
POST   /api/auth/logout             (user) → success
GET    /api/auth/me                 (authenticated) → current user profile
```

### Task 2: Machine Module (Core feature)
**Create Files**:
```
backend/src/modules/machines/
├── machine.controller.ts     (REST endpoints)
├── machine.service.ts        (Business logic)
├── machine.repository.ts     (Database queries)
└── machine.module.ts         (Module registration)
```

**Routes to Implement**:
```
GET    /api/machines              (List all user's machines)
POST   /api/machines              (Register new machine)
GET    /api/machines/:id          (Get machine details)
PATCH  /api/machines/:id          (Update machine)
DELETE /api/machines/:id          (Deactivate machine)
GET    /api/machines/:id/status   (Live status)
GET    /api/machines/:id/metrics  (Key metrics)
```

### Task 3: Telemetry Module (Real-time data)
**Create Files**:
```
backend/src/modules/telemetry/
├── telemetry.controller.ts   (Data ingestion)
├── telemetry.service.ts      (Processing + queries)
├── telemetry.repository.ts   (Time-series queries)
└── telemetry.module.ts       (Module registration)
```

**Routes to Implement**:
```
POST   /api/telemetry/:machine_id/ingest       (Single reading)
POST   /api/telemetry/batch-ingest             (Batch readings)
GET    /api/telemetry/:machine_id/latest       (Last N minutes)
GET    /api/telemetry/:machine_id/day          (Daily data)
GET    /api/telemetry/:machine_id/statistics   (Aggregations)
```

### Task 4: Alert Module (Monitoring)
**Create Files**:
```
backend/src/modules/alerts/
├── alert.controller.ts       (Query + update)
├── alert.service.ts          (Creation + escalation)
├── alert.repository.ts       (Database queries)
└── alert.module.ts           (Module registration)
```

**Routes to Implement**:
```
GET    /api/alerts                  (List organization alerts)
GET    /api/alerts/:machine_id      (Machine-specific alerts)
POST   /api/alerts/:id/acknowledge  (Mark as seen)
POST   /api/alerts/:id/resolve      (Close alert)
POST   /api/alerts/:id/snooze       (Snooze alert)
GET    /api/alerts/stats            (Summary stats)
```

---

## 🔑 IMPORTANT PATTERNS

### Creating a Service
```typescript
// src/services/example.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Machine } from '../entities/machine.entity';

@Injectable()
export class MachineService {
  constructor(
    @InjectRepository(Machine)
    private machineRepository: Repository<Machine>,
  ) {}

  async create(dto: CreateMachineDto, organizationId: string) {
    const machine = this.machineRepository.create({
      ...dto,
      organization_id: organizationId,
    });
    return this.machineRepository.save(machine);
  }

  async findAll(organizationId: string) {
    return this.machineRepository.find({
      where: { organization_id: organizationId },
    });
  }
}
```

### Creating a Controller
```typescript
// src/modules/machines/machine.controller.ts

import { Controller, Get, Post, Patch, Delete, Param, Body } from '@nestjs/common';
import { MachineService } from './machine.service';
import { CreateMachineDto, UpdateMachineDto } from '../../dtos';

@Controller('machines')
export class MachineController {
  constructor(private machineService: MachineService) {}

  @Get()
  async findAll() {
    return this.machineService.findAll();
  }

  @Post()
  async create(@Body() dto: CreateMachineDto) {
    return this.machineService.create(dto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.machineService.findOne(id);
  }
}
```

### Module Registration
```typescript
// src/modules/machines/machine.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Machine } from '../../entities/machine.entity';
import { MachineService } from './machine.service';
import { MachineController } from './machine.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Machine])],
  controllers: [MachineController],
  providers: [MachineService],
})
export class MachineModule {}
```

---

## 🧪 TESTING WORKFLOW

### 1. Build & Run
```bash
npm run build          # Compile TypeScript
npm run start:dev      # Start with hot reload
```

### 2. Test Endpoints with cURL
```bash
# Test health
curl http://localhost:8000/health

# Test database connection
curl http://localhost:8000/health/db

# Test with auth (when implemented)
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### 3. Testing with Jest
```bash
npm run test           # Run all tests
npm run test:cov       # With coverage
npm run test:watch     # Watch mode
```

---

## 🚨 COMMON ISSUES & FIXES

### Issue: "Cannot find module '@nestjs/...'"
```bash
# Fix: Reinstall dependencies
npm install
npm run build
```

### Issue: "Database connection refused"
```bash
# Check .env has correct credentials
cat .env

# If using Docker:
docker-compose up -d postgres
docker-compose logs postgres
```

### Issue: "Port 8000 already in use"
```bash
# Find what's using port 8000
lsof -i :8000  # macOS/Linux
netstat -ano | findstr :8000  # Windows

# Kill the process or use different port
PORT=8001 npm run start:dev
```

### Issue: "TypeScript compilation errors (AnyError)"
```bash
# Check tsconfig.json has proper strict mode
cat tsconfig.json | grep strict

# Rebuild
npm run build --verbose
```

---

## 📋 CHECKLIST FOR SESSION 8

Before Starting:
- [ ] Project folder open in VS Code
- [ ] Terminal ready in backend/ directory
- [ ] .env file exists with DB credentials
- [ ] package.json shows all dependencies
- [ ] No prior npm_modules corruption (clean install if needed)

First 30 Minutes:
- [ ] Run `npm install` (if not done)
- [ ] Run `npm run build` (verify TypeScript compiles)
- [ ] Run `npm run start:dev` (check server starts)
- [ ] Test `curl http://localhost:8000/health` (returns ok)

Core Work:
- [ ] Create auth module (highest priority)
- [ ] Create machine module
- [ ] Create telemetry module
- [ ] Create alert module

Testing:
- [ ] Build succeeds: `npm run build`
- [ ] Server starts: `npm run start:dev`
- [ ] Health endpoint works
- [ ] No console errors

Before Committing:
- [ ] Run `npm run lint` (format code)
- [ ] Run `npm run test` (if tests exist)
- [ ] All services properly TypeScript typed
- [ ] No `any` types used
- [ ] Commit message includes cnc.mayyanks.app reference

---

## 📚 CRITICAL FILES TO REFERENCE

**Current Infrastructure** (already created):
```
backend/package.json          ← Dependencies
backend/src/main.ts           ← Bootstrap
backend/src/app.module.ts     ← Module registration
backend/src/config/database.config.ts  ← TypeORM config
backend/src/entities/index.ts          ← All 8 entities
backend/src/dtos/index.ts              ← All 4 DTO groups
```

**Deployment Guides**:
```
PRODUCTION_BUILD_GUIDE.md     ← Full deployment manual
SESSION_7_SUMMARY.md          ← This session recap
BACKEND_DEPLOYMENT.md         ← Previous session guide
```

---

## 💬 SESSION 8 GOAL

**OBJECTIVE**: Implement full Auth → Machine → Telemetry → Alert module stack

**SUCCESS CRITERIA**:
- ✅ Auth module with login + register + JWT
- ✅ Machine module with CRUD + status tracking
- ✅ Telemetry module with data ingestion
- ✅ Alert module with escalation
- ✅ All 46 API routes implemented
- ✅ Backend builds without errors
- ✅ Local development environment works

**COMPLETE BY**: End of Session 8

---

## 🎯 SYSTEM CONSTRAINTS (NEVER FORGET)

1. **Domain**: https://cnc.mayyanks.app (locked)
2. **Branding**: cnc-mayyanks-* (strict naming)
3. **Database**: PostgreSQL only
4. **Auth**: JWT + Google OAuth
5. **No Login Required**: Anonymous guest access
6. **Multi-tenant**: All data scoped to organization_id
7. **Typed**: 100% TypeScript (NO any)

---

**Good luck! You have everything you need. Start with the Auth module! 🚀**
