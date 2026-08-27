'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import FluidGradientBg from '@/components/FluidGradientBg';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isLandingPage = pathname === '/';

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
