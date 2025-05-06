import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getServerManifestClient } from './lib/manifest/api-client/server';

const AUTH_PATHS = ['/', '/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  console.log('Running on ' + pathname);
  if (AUTH_PATHS.includes(pathname)) {
    return NextResponse.next();
  }

  const client = await getServerManifestClient();

  let res = await client.staffAuth.me();
  if (res.result?.id) {
    return NextResponse.next();
  }
  if (res.error) {
    res = await client.adminAuth.me();
    if (res.result?.id) {
      return NextResponse.next();
    }
    if (res.error) {
      // Clear cookies and redirect to /
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('auth_token');
      response.cookies.delete('auth_refresh_token');
      return response;
    }
  }
  // For any other status, continue (or you could block)
  return NextResponse.next();
}

export const config = {
  matcher: ['/kitchen/:path*', '/tables/:path*', '/settings/:path*'], // All routes except /, /login, and /api/*
};