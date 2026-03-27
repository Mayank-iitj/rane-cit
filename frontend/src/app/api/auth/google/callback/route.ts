import { NextRequest, NextResponse } from 'next/server';

function appendSearchParams(baseUrl: string, sourceParams: URLSearchParams): string {
  const target = new URL(baseUrl);
  sourceParams.forEach((value, key) => {
    target.searchParams.set(key, value);
  });
  return target.toString();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const explicitProxy = process.env.GOOGLE_OAUTH_CALLBACK_PROXY_URL;
  if (explicitProxy) {
    return NextResponse.redirect(appendSearchParams(explicitProxy, request.nextUrl.searchParams));
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
  if (apiBase.startsWith('http://') || apiBase.startsWith('https://')) {
    const origin = `${request.nextUrl.protocol}//${request.nextUrl.host}`;
    if (!apiBase.startsWith(origin)) {
      const proxyTarget = `${apiBase.replace(/\/$/, '')}/auth/google/callback`;
      return NextResponse.redirect(appendSearchParams(proxyTarget, request.nextUrl.searchParams));
    }
  }

  const appCallback = new URL('/auth/callback', request.nextUrl.origin);
  appCallback.searchParams.set('error', 'oauth_callback_proxy_not_configured');
  return NextResponse.redirect(appCallback.toString());
}
