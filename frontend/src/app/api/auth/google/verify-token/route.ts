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
    return NextResponse.json(
      { error: 'oauth_backend_unconfigured', detail: 'Set BACKEND_API_URL or API_BASE_URL for OAuth verification.' },
      { status: 500 },
    );
  }

  const target = `${backendBase}/auth/google/verify-token`;

  const resp = await fetch(target, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    cache: 'no-store',
  });

  const text = await resp.text();
  return new NextResponse(text, {
    status: resp.status,
    headers: { 'Content-Type': resp.headers.get('content-type') || 'application/json' },
  });
}
