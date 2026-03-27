# GIT WORKFLOW & COMMITS — cnc-mayyanks.app

**Repository**: https://github.com/Mayank-iitj/cnc-intelligence-platform  
**Branch**: main (production-ready commits only)  
**Branding**: ALL commits must reference cnc.mayyanks.app or cnc-mayyanks-*

---

## 📌 SESSION 7 COMMIT

### Commit Message (Recommended)
```bash
git add -A
git commit -m "feat: Complete NestJS infrastructure scaffold with 8 entities & 4 DTO groups

IMPLEMENTATION:
- Added 8 production-grade TypeORM entities:
  * Organization (multi-tenant)
  * User (auth + roles)
  * Machine (CNC tracking)
  * Telemetry (sensor data)
  * Alert (monitoring)
  * GcodeProgram (optimization)
  * ApiKey (secure access)
  * AuditLog (compliance)

- Added 4 complete DTO groups with class-validator:
  * Auth DTOs (Login, Register, OAuth, Response)
  * Machine DTOs (Create, Update, Response, List)
  * Telemetry DTOs (Ingest, Batch, Response)
  * Alert DTOs (Create, Update, Response, Stats)

- Created PRODUCTION_BUILD_GUIDE.md (comprehensive deployment documentation)
- Created SESSION_7_SUMMARY.md (session recap and next steps)
- Created QUICK_START_SESSION_8.md (developer quick reference)

TECHNICAL DETAILS:
- All entities use TypeORM decorators with UUID primary keys
- Proper multi-tenant relationships with CASCADE operations
- Strategic query indices for performance
- JSONB storage for flexible metadata
- Full timestamp tracking (created_at, updated_at)
- All DTOs with strict class-validator rules

STATUS: Ready for service layer implementation (Session 8)
DATABASE: PostgreSQL 16 + TimescaleDB compatible
DOMAIN: cnc.mayyanks.app
BRANDING: cnc-mayyanks-* (enforced throughout)

NEXT SESSION: Implement 8 core services + 7 module controllers"
```

### Push Command
```bash
git push origin main
```

---

## 📥 PULLING FOR NEXT SESSION

```bash
# Get latest code
git pull origin main

# Install/update dependencies
cd backend
npm install
npm run build

# Verify system is ready
npm run start:dev  # Should start on port 8000
```

---

## 🔄 WORKFLOW FOR SESSION 8 (Services Implementation)

### 1. Branch Strategy
```bash
# For development (optional, can work on main if low risk)
git checkout -b feat/auth-module
git checkout -b feat/machine-module
git checkout -b feat/telemetry-module
git checkout -b feat/alert-module
```

### 2. Commit as You Complete Modules

#### When Auth Module is Done
```bash
git add backend/src/modules/auth/
git commit -m "feat(auth): Implement JWT authentication & Google OAuth

- AuthController with POST /login, POST /register, POST /refresh, GET /callback
- AuthService with JWT generation, OAuth validation, token refresh
- JwtStrategy for Passport JWT authentication
- JwtAuthGuard for route protection
- Integration with User entity
- Proper error handling and validation

Domain: cnc.mayyanks.app
"
```

#### When Machine Module is Done
```bash
git add backend/src/modules/machines/
git commit -m "feat(machines): Implement machine management CRUD

- MachineController with full REST endpoints (GET, POST, PATCH, DELETE)
- MachineService with business logic and metrics calculation
- MachineRepository with optimized queries
- Status tracking (ACTIVE, IDLE, RUNNING, ERROR, MAINTENANCE, OFFLINE)
- Heartbeat and utilization tracking
- Integration with Telemetry and Alert modules

Routes:
- GET /api/machines
- POST /api/machines
- GET /api/machines/:id
- PATCH /api/machines/:id
- DELETE /api/machines/:id
- GET /api/machines/:id/status
- GET /api/machines/:id/metrics

Domain: cnc.mayyanks.app
"
```

#### When Telemetry Module is Done
```bash
git add backend/src/modules/telemetry/
git commit -m "feat(telemetry): Implement real-time data ingestion

- TelemetryController for single and batch data ingestion
- TelemetryService with aggregation and time-series queries
- TelemetryRepository with optimized queries for large datasets
- Support for spindle speed, temperature, vibration, power metrics
- Batch ingestion for high-frequency data
- Statistical calculations (min, max, avg, std)

Routes:
- POST /api/telemetry/:machine_id/ingest
- POST /api/telemetry/batch-ingest
- GET /api/telemetry/:machine_id/latest
- GET /api/telemetry/:machine_id/day
- GET /api/telemetry/:machine_id/statistics

Domain: cnc.mayyanks.app
"
```

#### When Alert Module is Done
```bash
git add backend/src/modules/alerts/
git commit -m "feat(alerts): Implement alert system with escalation

- AlertController for querying and managing alerts
- AlertService with creation, acknowledgment, resolution
- AlertRepository with optimized queries
- Severity levels (CRITICAL, ERROR, WARNING, INFO)
- Status tracking (OPEN, ACKNOWLEDGED, RESOLVED, SNOOZED)
- Confidence scoring for ML predictions
- Automatic escalation logic

Routes:
- GET /api/alerts
- GET /api/alerts/:machine_id
- POST /api/alerts/:id/acknowledge
- POST /api/alerts/:id/resolve
- POST /api/alerts/:id/snooze
- GET /api/alerts/stats

Domain: cnc.mayyanks.app
"
```

### 3. Final Integration Commit (All Modules)
```bash
git add backend/src/repositories/
git commit -m "feat: Complete repository pattern for all entities

- Created repository classes for Database abstraction
- Optimized queries for each entity type
- Pagination support for list endpoints
- Aggregation functions for analytics
- Proper error handling

Repositories:
- OrganizationRepository
- UserRepository
- MachineRepository
- TelemetryRepository
- AlertRepository
- GcodeRepository
- ApiKeyRepository
- AuditLogRepository

Domain: cnc.mayyanks.app
"
```

### 4. Build & Test Verification
```bash
git add NestJS build files
git commit -m "build: Verify backend builds successfully

- npm run build: ✅ TypeScript compile
- npm run lint: ✅ ESLint pass
- npm run start:dev: ✅ Starts on port 8000
- Health endpoints: ✅ All return ok
- Database migration: ✅ All entities created

Status: Ready for integration testing
Domain: cnc.mayyanks.app
"
```

---

## 🏗️ DIRECTORY STRUCTURE (Updated for Session 8)

```
branch: main

c:\Users\MS\cnc-intelligence-platform\
│
├── 📄 Documentation
│   ├── README.md                          (Main project overview)
│   ├── QUICK_START.md                     (Quick start guide)
│   ├── PRODUCTION_BUILD_GUIDE.md          ✅ NEW (Session 7)
│   ├── SESSION_7_SUMMARY.md               ✅ NEW (Session 7)
│   ├── QUICK_START_SESSION_8.md           ✅ NEW (Session 7)
│   ├── BACKEND_DEPLOYMENT.md              (Previous: FastAPI → NestJS transition)
│   ├── JUDGE_ENTRY_POINTS.md
│   ├── JUDGE_SUMMARY.md
│   ├── WINNING_SUMMARY.md
│   ├── PROJECT_INDEX.md
│   ├── DEPLOYMENT.md
│   └── IMPLEMENTATION_CHECKLIST.md
│
├── 🎨 Frontend (Next.js)
│   └── frontend/
│       ├── package.json
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx               (Marketing landing page ✅)
│       │   │   ├── dashboard/page.tsx     (Dashboard with lucide-react ✅)
│       │   │   ├── login/page.tsx
│       │   │   └── auth/
│       │   ├── components/                (React components)
│       │   ├── lib/                       (Utilities)
│       │   └── styles/
│       ├── tsconfig.json
│       ├── tailwind.config.js
│       └── Dockerfile
│
├── 🔧 Backend (NestJS) ← SESSION 8 FOCUS
│   └── backend/
│       ├── package.json                   ✅ (Dependencies)
│       ├── tsconfig.json
│       ├── src/
│       │   ├── main.ts                    ✅ (Bootstrap)
│       │   ├── app.module.ts              ✅ (Module registration)
│       │   │
│       │   ├── entities/                  ✅ (8 TypeORM entities)
│       │   │   ├── organization.entity.ts
│       │   │   ├── user.entity.ts
│       │   │   ├── machine.entity.ts
│       │   │   ├── telemetry.entity.ts
│       │   │   ├── alert.entity.ts
│       │   │   ├── gcode-program.entity.ts
│       │   │   ├── api-key.entity.ts
│       │   │   ├── audit-log.entity.ts
│       │   │   └── index.ts
│       │   │
│       │   ├── dtos/                      ✅ (4 DTO groups)
│       │   │   ├── auth.dto.ts
│       │   │   ├── machine.dto.ts
│       │   │   ├── telemetry.dto.ts
│       │   │   ├── alert.dto.ts
│       │   │   └── index.ts
│       │   │
│       │   ├── config/
│       │   │   └── database.config.ts     ✅ (TypeORM)
│       │   │
│       │   ├── services/                  ⏳ SESSION 8
│       │   │   ├── auth.service.ts
│       │   │   ├── machine.service.ts
│       │   │   ├── telemetry.service.ts
│       │   │   ├── alert.service.ts
│       │   │   └── (others)
│       │   │
│       │   ├── repositories/              ⏳ SESSION 8
│       │   │   ├── organization.repository.ts
│       │   │   ├── user.repository.ts
│       │   │   ├── machine.repository.ts
│       │   │   └── (others)
│       │   │
│       │   ├── modules/                   ⏳ SESSION 8
│       │   │   ├── auth/
│       │   │   │   ├── auth.controller.ts
│       │   │   │   ├── auth.module.ts
│       │   │   │   ├── jwt.strategy.ts
│       │   │   │   └── jwt-auth.guard.ts
│       │   │   ├── machines/
│       │   │   │   ├── machine.controller.ts
│       │   │   │   └── machine.module.ts
│       │   │   ├── telemetry/
│       │   │   │   ├── telemetry.controller.ts
│       │   │   │   └── telemetry.module.ts
│       │   │   ├── alerts/
│       │   │   │   └── (controllers, modules)
│       │   │   ├── analytics/
│       │   │   ├── gcode/
│       │   │   ├── tenant/
│       │   │   └── health/
│       │   │
│       │   ├── migrations/                (Alembic migrations)
│       │   └── (other services)
│       │
│       ├── dist/                          (Build output - git ignored)
│       ├── node_modules/                  (Dependencies - git ignored)
│       └── Dockerfile
│
├── 🏗️ Infrastructure & Docker
│   ├── docker/
│   │   ├── docker-compose.yml             (Development stack)
│   │   ├── docker-compose.prod.yml        (Production stack)
│   │   ├── Dockerfile.backend
│   │   ├── Dockerfile.frontend
│   │   └── mosquitto.conf
│   ├── infra/
│   │   ├── nginx.conf                     (Reverse proxy)
│   │   └── k8s/deployment.yaml
│   └── scripts/
│       ├── deploy.sh
│       ├── quickstart.sh
│       ├── seed_db.py
│       ├── verify_system.py
│       └── winning_ready_check.py
│
├── 📊 Data Pipeline & ML
│   ├── data_pipeline/
│   ├── ml-service/
│   │   ├── Dockerfile
│   │   ├── main.py
│   │   └── requirements.txt
│   ├── ingestion/
│   │   ├── Dockerfile
│   │   ├── main.py
│   │   └── requirements.txt
│   ├── realtime/
│   │   ├── Dockerfile
│   │   ├── main.py
│   │   └── requirements.txt
│   └── edge-agent/
│       ├── Dockerfile
│       ├── main.go
│       ├── go.mod
│       └── adapters/
│
└── 📦 Legacy API Module (Transitioning from FastAPI)
    └── api/
        ├── package.json
        ├── (FastAPI code - being replaced by NestJS)
        └── ...
```

---

## 💾 GIT COMMANDS REFERENCE

```bash
# Session Start
git pull origin main
cd backend
npm install
npm run build

# During Development
git status                          # Check what's changed
git add backend/src/modules/auth/   # Stage changes
git commit -m "feat: ..."           # Commit with message

# After Features Complete
git push origin main                # Push to GitHub

# Rollback if needed
git revert <commit-hash>            # Safe undo (creates new commit)
git reset --hard HEAD~1             # DANGEROUS: Undo last commit

# View History
git log --oneline --graph --all     # Visual history
git log -p backend/src/entities/    # History of specific file

# Before Merging to Main
git status                          # Nothing uncommitted
npm run lint                        # ESLint passes
npm run build                       # TypeScript compiles
npm run test                        # Tests pass (if any)
```

---

## ✅ COMMIT CHECKLIST

Before every commit:

```bash
# 1. Verify code quality
npm run lint             # ✅ No errors
npm run build            # ✅ Compiles

# 2. Check git status
git status               # ✅ Only intended files

# 3. Review changes
git diff --cached        # ✅ Make sense?

# 4. Write good commit message
# Format: type: scope - description (50 chars max)
# Types: feat, fix, refactor, docs, test, chore
# Example: feat(auth): Implement JWT authentication
git commit -m "type: description"

# 5. Reference domain in message body
# Include: cnc.mayyanks.app or cnc-mayyanks-* branding

# 6. Push safely
git push origin main     # Only after team approval
```

---

## 🎯 SESSION 8 COMMIT SCHEDULE

Recommended commit cadence for Session 8:

| Time | Module | Commit |
|------|--------|--------|
| 0-2h | Auth | "feat(auth): Implement JWT + Google OAuth" |
| 2-4h | Machines | "feat(machines): Implement CRUD + status" |
| 4-6h | Telemetry | "feat(telemetry): Implement data ingestion" |
| 6-8h | Alerts | "feat(alerts): Implement monitoring system" |
| 8-9h | Repositories | "feat: Complete repository pattern" |
| 9-10h | Testing | "test: Verify all modules work together" |
| 10h | Build | "build: Compile successful, ready for deploy" |

---

## 🔐 SECURITY NOTES

**NEVER Commit**:
```
❌ .env files with real credentials
❌ API keys or secrets
❌ Passwords or tokens
❌ node_modules/ folder
❌ dist/ or build/ folders
❌ .DS_Store or IDE files
```

**ALWAYS Include**:
```
✅ .env.example (template with placeholders)
✅ .gitignore (prevents accidental commits)
✅ Documentation for new modules
✅ Meaningful commit messages
✅ References to cnc.mayyanks.app
```

---

## 📝 EXAMPLE COMPLETE COMMIT MESSAGE

```
feat: Implement full authentication system

IMPLEMENTATION:
- JWT-based authentication with 24h expiration
- Google OAuth 2.0 integration via passport
- Refresh token mechanism for extended sessions
- Password hashing with bcrypt (10 rounds)
- Role-based access control (OWNER, ADMIN, USER, VIEWER, GUEST)

CONTROLLERS & ENDPOINTS:
- POST /api/auth/login (email + password)
- POST /api/auth/register (new user creation)
- POST /api/auth/refresh (token refresh)
- GET /api/auth/callback (OAuth redirect)
- POST /api/auth/logout (session cleanup)
- GET /api/auth/me (current user profile)

SERVICES & STRATEGIES:
- AuthService: login, register, validateGoogleToken, generateJWT
- JwtStrategy: Token validation via Passport
- JwtAuthGuard: Route protection decorator

TESTING:
- Manual: cURL tested all endpoints
- Verified: JWT validation works
- Verified: OAuth callback handling
- Verified: Error responses correct

BRANDING:
- Domain: https://cnc.mayyanks.app
- Service: cnc-mayyanks-api
- Logging: cnc-mayyanks branded

REFERENCES:
#47 Authentication Implementation
Closes #45 (OAuth)
```

---

**All systems ready for Session 8 commits! Push frequently and keep messages clear. 🚀**
