import { NextRequest, NextResponse } from 'next/server';

const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

function redirectWithError(request: NextRequest, code: string): NextResponse {
  const url = new URL('/auth/callback', request.nextUrl.origin);
  url.searchParams.set('error', code);
  return NextResponse.redirect(url.toString());
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const stateCookie = request.cookies.get('cnc_oauth_state')?.value;
  const oauthError = request.nextUrl.searchParams.get('error');

  if (oauthError) {
    return redirectWithError(request, oauthError);
  }

  if (!code || !state || !stateCookie || state !== stateCookie) {
    return redirectWithError(request, 'oauth_state_invalid');
  }

  const clientId = process.env.GOOGLE_CLIENT_ID || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    `${request.nextUrl.protocol}//${request.nextUrl.host}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return redirectWithError(request, 'oauth_env_missing');
  }

  const tokenResp = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
    cache: 'no-store',
  });

  if (!tokenResp.ok) {
    return redirectWithError(request, 'oauth_code_exchange_failed');
  }

  const tokenData = (await tokenResp.json()) as { id_token?: string };
  if (!tokenData.id_token) {
    return redirectWithError(request, 'oauth_id_token_missing');
  }

  const verifyUrl = new URL('/api/auth/google/verify-token', request.nextUrl.origin).toString();
  const verifyResp = await fetch(verifyUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id_token: tokenData.id_token }),
    cache: 'no-store',
  });

  if (!verifyResp.ok) {
    return redirectWithError(request, 'oauth_verify_failed');
  }

  const authData = (await verifyResp.json()) as {
    access_token: string;
    refresh_token: string;
    is_new_user?: boolean;
  };

  const appCallback = new URL('/auth/callback', request.nextUrl.origin);
  appCallback.searchParams.set('access_token', authData.access_token);
  appCallback.searchParams.set('refresh_token', authData.refresh_token);
  appCallback.searchParams.set('new_user', String(Boolean(authData.is_new_user)));

  const response = NextResponse.redirect(appCallback.toString());
  response.cookies.set('cnc_oauth_state', '', {
    httpOnly: true,
    secure: request.nextUrl.protocol === 'https:',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
