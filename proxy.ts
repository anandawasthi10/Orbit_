import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(req: NextRequest) {
  const secret = process.env.NEXTAUTH_SECRET || 'orbit-super-secret-key-1234567890-v2';

  // Resolve session token across all standard & secure cookie variants (Localhost & Vercel HTTPS)
  let token = await getToken({ req, secret });

  if (!token) {
    token = await getToken({ req, secret, cookieName: 'orbit.session-token' });
  }
  if (!token) {
    token = await getToken({ req, secret, cookieName: '__Secure-orbit.session-token' });
  }
  if (!token) {
    token = await getToken({ req, secret, cookieName: 'next-auth.session-token' });
  }
  if (!token) {
    token = await getToken({ req, secret, cookieName: '__Secure-next-auth.session-token' });
  }

  const { pathname } = req.nextUrl;

  // If user is already authenticated and visits /, /login, or /signup, redirect straight to /dashboard
  if (token && (pathname === '/' || pathname === '/login' || pathname === '/signup')) {
    const targetUrl = new URL('/dashboard', req.url);
    return NextResponse.redirect(targetUrl);
  }

  // Public paths that do not require authentication
  const isPublicPath =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp)$/i.test(pathname) ||
    pathname === '/favicon.ico';

  // Protected paths: redirect unauthenticated requests to /login
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)'],
};
