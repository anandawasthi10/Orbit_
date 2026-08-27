'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import FluidGradientBg from '@/components/FluidGradientBg';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isLandingPage = pathname === '/';
  const isEnterCodePage = pathname === '/enter-code';

  const [hasAccess, setHasAccess] = useState<boolean | null>(null);

  // Access Code Gatekeeper Guard
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Public pages: Landing (/) and Code Entry (/enter-code)
    if (isLandingPage || isEnterCodePage) {
      setHasAccess(true);
      return;
    }

    const verified =
      localStorage.getItem('orbit_access_verified') === 'true' ||
      document.cookie.includes('orbit_access_verified=true') ||
      Boolean(session?.user);

    if (!verified) {
      setHasAccess(false);
      router.replace('/enter-code');
    } else {
      setHasAccess(true);
    }
  }, [pathname, isLandingPage, isEnterCodePage, session?.user, router]);

  // If on enter-code page, render directly with no chrome
  if (isEnterCodePage) {
    return <>{children}</>;
  }

  // If unverified and trying to view a protected page, block rendering while redirecting
  if (hasAccess === false && !isLandingPage) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-[#f8f8ff]">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // 1. Auth pages (/login, /signup) -> full-screen clean white/black professional theme
  if (isAuthPage) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center relative overflow-hidden"
        style={{ background: '#f8f8ff' }}
      >
        {/* Fluid gradient blob animation */}
        <FluidGradientBg />

        {/* Frosted glass tint so card stays readable */}
        <div
          className="absolute inset-0 pointer-events-none z-0"
          style={{ backdropFilter: 'blur(0px)' }}
        />

        <div className="relative z-10 w-full flex items-center justify-center p-4">
          {children}
        </div>
      </div>
    );
  }

  // 2. Landing page (/) — no AppShell chrome, page renders its own navbar + hero
  if (isLandingPage && !session?.user) {
    return <>{children}</>;
  }


  // 3. Logged-in application pages (or logged-in Landing) -> Workspace layout with Sidebar
  return (
    <div className="flex min-h-screen bg-[#F7F8FA]">
      {/* Fixed Left Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
        <footer className="py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/50 mt-auto">
          <p>© {new Date().getFullYear()} Orbit. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
