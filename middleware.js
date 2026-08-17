import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET || 'orbit-super-secret-key-1234567890-v2',
    cookieName: 'orbit.session-token',
  });

  const { pathname } = req.nextUrl;

  // Create response object
  let res = NextResponse.next();

  // Clear old next-auth cookies if present
  if (req.cookies.has('next-auth.session-token')) {
    res.cookies.set('next-auth.session-token', '', { maxAge: 0, path: '/' });
  }
  if (req.cookies.has('__Secure-next-auth.session-token')) {
    res.cookies.set('__Secure-next-auth.session-token', '', { maxAge: 0, path: '/' });
  }

  // If user is logged in and visits root landing page (/), redirect to /dashboard (or /onboarding)
  if (token && pathname === '/') {
    const targetPath = token.profileComplete === false ? '/onboarding' : '/dashboard';
    const targetUrl = new URL(targetPath, req.url);
    const redirectRes = NextResponse.redirect(targetUrl);
    redirectRes.cookies.set('next-auth.session-token', '', { maxAge: 0, path: '/' });
    return redirectRes;
  }

  // Public paths: /, /login, /signup, /api/auth, /_next, /uploads, static asset files
  const isPublicPath =
    pathname === '/' ||
    pathname === '/login' ||
    pathname === '/signup' ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/uploads') ||
    /\.(png|jpg|jpeg|gif|svg|ico|webp)$/i.test(pathname) ||
    pathname === '/favicon.ico';

  // Protected paths: /team, /dashboard, /onboarding, /tasks, /daily-updates, /api/members, /api/tasks, /api/updates
  if (!token && !isPublicPath) {
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // If user is logged in but profile is not complete, force /onboarding
  if (
    token &&
    token.profileComplete === false &&
    pathname !== '/onboarding' &&
    !pathname.startsWith('/api')
  ) {
    const onboardingUrl = new URL('/onboarding', req.url);
    return NextResponse.redirect(onboardingUrl);
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)).*)'],
};
