# Google OAuth 2.0 Configuration Guide

## ✅ Current Status

CNC Intelligence Platform uses **Google OAuth 2.0** as the primary authentication method for `cnc.mayyanks.app`.

### Configuration Status
- ✅ **Backend**: OAuth routes fully implemented (`/api/auth/google/*`)
- ✅ **Frontend**: OAuth flow implemented in Next.js API routes
- ✅ **Credentials**: Google Client ID and Secret configured in `.env` 
- ✅ **Redirect URIs**: Configured in frontend environments (`.env.local` and `.env.production`)
- ⚠️ **Google Cloud Console**: MUST be manually configured (see below)

## 🔧 Frontend Configuration Files

### Local Development (`.env.local`)
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### Production (`.env.production`)
```bash
NEXT_PUBLIC_GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_REDIRECT_URI=https://cnc.mayyanks.app/api/auth/google/callback
NEXT_PUBLIC_API_URL=https://cnc.mayyanks.app/api
```

### Backend Configuration (`.env`)
```bash
GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-YOUR_SECRET_HERE
GOOGLE_REDIRECT_URI=https://cnc.mayyanks.app/api/auth/google/callback
```

## 🚨 CRITICAL: Google Cloud Console Setup

**These settings MUST be configured in Google Cloud Console for OAuth to work:**

### Step 1: Access Google Cloud Console

1. Go to: https://console.cloud.google.com/
2. Navigate to **APIs & Services** → **Credentials**
3. Find the OAuth 2.0 Client ID for "Web application"
   - If it doesn't exist, create one: **Create Credentials** → **OAuth 2.0 Client IDs**

### Step 2: Configure Authorized JavaScript Origins

For the OAuth 2.0 Client ID, add these **Authorized JavaScript origins**:

```
http://localhost:3000
https://cnc.mayyanks.app
```

### Step 3: Configure Authorized Redirect URIs

For the same OAuth 2.0 Client ID, add these **Authorized redirect URIs**:

```
http://localhost:3000/api/auth/google/callback
https://cnc.mayyanks.app/api/auth/google/callback
```

### Step 4: Verify Credentials Match

Ensure these values match exactly between Google Cloud Console and `.env` files:
- ✅ Client ID: `YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com`
- ✅ Client Secret: `GOCSPX-YOUR_SECRET_HERE`

## 📋 OAuth Flow Architecture

```
User clicks "Sign In"
    ↓
Frontend calls GET /api/auth/google/login
    ↓
Frontend redirects to Google OAuth consent screen
    ↓
Google redirects back to /api/auth/google/callback (Frontend receives code + state)
    ↓
Frontend validates state cookie, exchanges code for ID token
    ↓
Frontend sends ID token to backend POST /api/auth/google/verify-token
    ↓
Backend verifies ID token with Google, creates user, issues app JWT tokens
    ↓
Frontend redirects to /auth/callback with tokens
    ↓
User is authenticated, email/name fetched from /api/auth/me
    ↓
User lands on Dashboard
```

## 🔒 Security Features

1. **State Validation**: CSRF protection via random state + httpOnly cookies
2. **PKCE**: Not used (server-side flow is more secure for backend integration)
3. **ID Token Verification**: Backend validates with Google directly
4. **No Password Storage**: OAuth users have `password_hash = "google_oauth_no_password"`
5. **JWT Tokens**: App-issued JWT tokens (access: 30min, refresh: 7 days)

## ⚙️ Environment Variables Explained

| Variable | Frontend | Backend | Purpose |
|----------|----------|---------|---------|
| `GOOGLE_CLIENT_ID` | ✅ NEXT_PUBLIC | ✅ Required | OAuth app identifier |
| `GOOGLE_CLIENT_SECRET` | ❌ Never | ✅ Required | OAuth secret (never expose) |
| `GOOGLE_REDIRECT_URI` | ✅ Optional | ✅ Required | Callback URL |
| `NEXT_PUBLIC_API_URL` | ✅ Required | N/A | Backend API endpoint |
| `BACKEND_API_URL` | ✅ Optional | N/A | Backend for verify-token proxy |

## 🧪 Test OAuth Flow Locally

```bash
# 1. Start frontend (dev server)
cd frontend
npm run dev

# 2. Start backend
cd api
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 3. Open browser
open http://localhost:3000

# 4. Click "Sign In"
# → Should redirect to Google consent screen
# → After approval, should land on Dashboard
```

## 🚀 Deployment Checklist

- [ ] Google Cloud Console configured with production redirect URIs
- [ ] `.env.production` deployed to frontend build environment
- [ ] Backend `.env` has valid `GOOGLE_CLIENT_SECRET`
- [ ] `BACKEND_API_URL` points to backend service
- [ ] HTTPS enabled for `cnc.mayyanks.app`
- [ ] CORS configured to allow `https://cnc.mayyanks.app`
- [ ] SSL certificates valid for `cnc.mayyanks.app`

## 🐛 Troubleshooting

### ❌ "GOOGLE_CLIENT_ID is not configured"
- Check `.env.local` or `.env.production`
- Ensure `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is not empty

### ❌ "redirect_uri_mismatch" error from Google
- Google received redirect URI that wasn't registered
- Fix: Add exact URI to Google Cloud Console **Authorized redirect URIs**
- Common mistake: Using `https://cnc.mayyanks.app` when `https://cnc.mayyanks.app/api/auth/google/callback` is required

### ❌ "oauth_verify_failed" on login page
- Backend couldn't verify Google ID token
- Check: Backend has valid `GOOGLE_CLIENT_SECRET`
- Check: Backend can reach Google's tokeninfo endpoint
- Check: Backend logs for detailed error

### ❌ "oauth_env_missing" on login page
- Frontend missing `GOOGLE_CLIENT_SECRET` (never expose!)
- OR frontend can't reach backend verify-token endpoint
- Fix: Check `BACKEND_API_URL` env var in frontend

## 📞 Support

For issues with Google OAuth setup:
1. Verify all `.env` files have correct values
2. Run validation: `python scripts/oauth_config_validator.py`
3. Check Google Cloud Console redirect URIs match exactly
4. Review backend logs: `docker logs cnc-mayyanks-backend`
5. Check browser DevTools Network tab for request/response details

## 📚 References

- [Google OAuth 2.0 Docs](https://developers.google.com/identity/protocols/oauth2)
- [Google API Console](https://console.cloud.google.com/)
- [FastAPI OAuth Integration](https://fastapi.tiangolo.com/advanced/security/oauth2-scopes/)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
