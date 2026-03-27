import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json(
      { error: 'GOOGLE_CLIENT_ID is not configured' },
      { status: 500 },
    );
  }

  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}/api/auth/google/callback`;

  const state = crypto.randomUUID();
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'offline',
    prompt: 'consent',
  });

  const response = NextResponse.redirect(`${GOOGLE_AUTH_URL}?${params.toString()}`);
  response.cookies.set('cnc_oauth_state', state, {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });

  return response;
}
