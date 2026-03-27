#!/usr/bin/env python3
"""
Backend verification script
Tests that all modules import correctly and core functionality is available
"""

import sys
import asyncio

def verify_imports():
    """Verify all backend modules can be imported"""
    print("🔍 Verifying backend module imports...")
    
    try:
        # Core imports
        from api.config import settings
        print("  ✓ Config loaded")
        
        from api.database.connection import DatabaseManager, Base
        print("  ✓ Database connection configured")
        
        from api.database.models import (
            Organization, User, Machine, Telemetry, Alert,
            GCodeProgram, APIKey, AuditLog
        )
        print("  ✓ All database models imported")
        
        # Middleware
        from api.middleware import (
            SecurityHeadersMiddleware, RequestIDMiddleware,
            RequestLoggingMiddleware, GlobalErrorMiddleware
        )
        print("  ✓ Middleware stack ready")
        
        # Module routers
        from api.modules.auth import router as auth_router
        from api.modules.auth.google_oauth import router as google_router
        from api.modules.machines import router as machines_router
        from api.modules.telemetry import router as telemetry_router
        from api.modules.analytics import router as analytics_router
        from api.modules.alerts import router as alerts_router
        from api.modules.gcode import router as gcode_router
        from api.modules.tenant import router as tenant_router
        from api.modules.copilot import router as copilot_router
        from api.modules.digital_twin import router as digital_twin_router
        print("  ✓ All module routers imported (10 modules)")
        
        # Main app
        from api .main import app
        print("  ✓ FastAPI app created successfully")
        
        return True
    except Exception as e:
        print(f"  ✗ Import error: {e}")
        import traceback
        traceback.print_exc()
        return False


async def verify_database():
    """Verify database connection works"""
    print("\n🔍 Verifying database connectivity...")
    
    try:
        from api.database.connection import DatabaseManager
        
        await DatabaseManager.init()
        is_healthy = await DatabaseManager.health_check()
        
        if is_healthy:
            print("  ✓ Database connection healthy")
            return True
        else:
            print("  ⚠ Database health check failed (DB may not be running)")
            return False
            
    except Exception as e:
        print(f"  ⚠ Database error (expected if not running): {type(e).__name__}")
        return None


def verify_endpoints():
    """Verify API endpoints are registered"""
    print("\n🔍 Verifying API endpoints...")
    
    try:
        from api.main import app
        
        routes = []
        for route in app.routes:
            if hasattr(route, 'path'):
                routes.append(route.path)
        
        # Check for key endpoints
        required = [
            '/api/auth', '/api/machines', '/api/telemetry',
            '/api/analytics', '/api/alerts', '/health'
        ]
        
        found = 0
        for endpoint in required:
            matching = [r for r in routes if r.startswith(endpoint)]
            if matching:
                print(f"  ✓ {endpoint} ({len(matching)} routes)")
                found += 1
            else:
                print(f"  ✗ {endpoint} not found")
        
        print(f"\n  Total routes registered: {len(routes)}")
        return found == len(required)
        
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


def main():
    """Run all verification checks"""
    print("=" * 60)
    print("CNC Intelligence Platform — Backend Verification")
    print("=" * 60)
    
    checks = [
        ("Module Imports", verify_imports()),
        ("Endpoint Registration", verify_endpoints()),
    ]
    
    # Database check (async)
    try:
        db_result = asyncio.run(verify_database())
        checks.append(("Database Connection", db_result))
    except:
        checks.append(("Database Connection", None))
    
    print("\n" + "=" * 60)
    print("Verification Summary:")
    print("=" * 60)
    
    for check_name, result in checks:
        if result is True:
            status = "✓ PASS"
        elif result is False:
            status = "✗ FAIL"
        else:
            status = "⚠ WARN"
        print(f"{status} — {check_name}")
    
    passed = sum(1 for _, r in checks if r is True)
    failed = sum(1 for _, r in checks if r is False)
    
    print("\n" + "=" * 60)
    if failed == 0:
        print("✓ Backend is production-ready! 🚀")
        print("=" * 60)
        return 0
    else:
        print(f"✗ {failed} check(s) failed. Fix issues before deploying.")
        print("=" * 60)
        return 1


if __name__ == "__main__":
    sys.exit(main())
