import { NextRequest, NextResponse } from 'next/server';

function getBackendApiBase(): string {
  const explicit =
    process.env.BACKEND_API_URL ||
    process.env.API_BASE_URL ||
    process.env.GOOGLE_OAUTH_BACKEND_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    '';

  if (!explicit || explicit.startsWith('/')) {
    return '';
  }

  return explicit.replace(/\/$/, '');
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const body = await request.text();
  const backendBase = getBackendApiBase();

  if (!backendBase) {
    console.error('[OAuth Verify] Backend API URL not configured');
    console.error('[OAuth Verify] Checked env vars: BACKEND_API_URL, API_BASE_URL, GOOGLE_OAUTH_BACKEND_URL, NEXT_PUBLIC_API_URL');
    return NextResponse.json(
      { error: 'oauth_backend_unconfigured', detail: 'Set BACKEND_API_URL or API_BASE_URL for OAuth verification.' },
      { status: 500 },
    );
  }

  const target = `${backendBase}/auth/google/verify-token`;
  console.log(`[OAuth Verify] Proxying token verification to: ${target}`);

  try {
    const resp = await fetch(target, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      cache: 'no-store',
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error(`[OAuth Verify] Backend rejected with ${resp.status}: ${text}`);
    }

    const text = await resp.text();
    return new NextResponse(text, {
      status: resp.status,
      headers: { 'Content-Type': resp.headers.get('content-type') || 'application/json' },
    });
  } catch (error) {
    console.error(`[OAuth Verify] Failed to reach backend at ${target}:`, error);
    return NextResponse.json(
      { error: 'oauth_verify_failed', detail: 'Could not reach backend API for token verification' },
      { status: 500 },
    );
  }
}
