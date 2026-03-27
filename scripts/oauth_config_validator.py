#!/usr/bin/env python3
"""
OAuth Configuration Validator
Checks if Google OAuth 2.0 is properly configured across all services
"""

import os
import sys
import json
from pathlib import Path

def check_backend_oauth():
    """Verify backend OAuth configuration"""
    print("\n🔍 Checking Backend OAuth Configuration...")
    print("=" * 60)
    
    api_dir = Path(__file__).parent.parent / "api"
    env_file = Path(__file__).parent.parent / ".env"
    
    if not env_file.exists():
        print("❌ Backend .env file not found at:", env_file)
        return False
    
    backend_config = {
        'GOOGLE_CLIENT_ID': False,
        'GOOGLE_CLIENT_SECRET': False,
        'GOOGLE_REDIRECT_URI': False,
    }
    
    with open(env_file, 'r', encoding='utf-8', errors='ignore') as f:
        for line in f:
            for key in backend_config:
                if line.startswith(key + '='):
                    value = line.split('=', 1)[1].strip()
                    if value and not value.startswith('your-') and not value.startswith('CHANGE'):
                        backend_config[key] = True
                        print(f"  ✅ {key}: Configured")
                    else:
                        print(f"  ❌ {key}: Placeholder value (needs real credentials)")
    
    return all(backend_config.values())

def check_frontend_oauth():
    """Verify frontend OAuth configuration"""
    print("\n🔍 Checking Frontend OAuth Configuration...")
    print("=" * 60)
    
    frontend_dir = Path(__file__).parent.parent / "frontend"
    
    configs = {
        '.env.local': {'NEXT_PUBLIC_GOOGLE_CLIENT_ID': False, 'GOOGLE_REDIRECT_URI': False},
        '.env.production': {'NEXT_PUBLIC_GOOGLE_CLIENT_ID': False, 'GOOGLE_REDIRECT_URI': False},
    }
    
    all_valid = True
    
    for env_file_name, keys in configs.items():
        env_file = frontend_dir / env_file_name
        print(f"\n  Checking {env_file_name}:")
        
        if not env_file.exists():
            print(f"    ⚠️  {env_file_name} not found (required for {env_file_name.split('.')[1]} builds)")
            all_valid = False
            continue
            
        with open(env_file, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            for key in keys:
                if key in content:
                    # Check if value is not a placeholder
                    for line in content.split('\n'):
                        if line.startswith(key + '='):
                            value = line.split('=', 1)[1].strip()
                            if value and not value.startswith('your-') and not value.startswith('CHANGE'):
                                keys[key] = True
                                print(f"    ✅ {key}")
                            else:
                                print(f"    ❌ {key}: Placeholder value")
                else:
                    print(f"    ❌ {key}: Not configured")
        
        if not all(keys.values()):
            all_valid = False
    
    return all_valid

def check_google_cloud_config():
    """Print required Google Cloud Console configuration"""
    print("\n📋 Required Google Cloud Console Configuration:")
    print("=" * 60)
    print("""
To complete OAuth 2.0 setup, ensure these Authorized Redirect URIs are configured
in your Google Cloud Console OAuth 2.0 consent screen (Credentials):

For LOCAL DEVELOPMENT:
  • http://localhost:3000/api/auth/google/callback

For PRODUCTION (cnc.mayyanks.app):
  • https://cnc.mayyanks.app/api/auth/google/callback

Steps:
  1. Go to: https://console.cloud.google.com/apis/credentials
  2. Find your OAuth 2.0 Client ID for web application
  3. In "Authorized JavaScript origins" add:
     - http://localhost:3000 (local dev)
     - https://cnc.mayyanks.app (production)
  4. In "Authorized redirect URIs" add BOTH URIs above
  5. Copy the Client ID and Secret to your .env files

Current Configuration:
  Frontend (Local):     http://localhost:3000/api/auth/google/callback
  Frontend (Prod):      https://cnc.mayyanks.app/api/auth/google/callback
  Backend (Verified):   https://cnc.mayyanks.app/api/auth/google/callback
""")

def main():
    print("\n" + "=" * 60)
    print("🚀 CNC OAuth 2.0 Configuration Validator")
    print("=" * 60)
    
    backend_ok = check_backend_oauth()
    frontend_ok = check_frontend_oauth()
    
    check_google_cloud_config()
    
    print("\n" + "=" * 60)
    print("📊 Validation Summary:")
    print("=" * 60)
    print(f"  Backend OAuth:  {'✅ Configured' if backend_ok else '❌ Missing'}")
    print(f"  Frontend OAuth: {'✅ Configured' if frontend_ok else '❌ Missing'}")
    
    if backend_ok and frontend_ok:
        print("\n✅ OAuth Configuration is READY for deployment!")
        print("   → Ensure Google Cloud Console is configured with redirect URIs above")
        return 0
    else:
        print("\n❌ OAuth Configuration is INCOMPLETE")
        print("   → Check .env files and Google Cloud Console settings")
        return 1

if __name__ == '__main__':
    sys.exit(main())
