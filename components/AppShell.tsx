'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import { ArrowRight, LogIn } from 'lucide-react';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const isAuthPage = pathname === '/login' || pathname === '/signup';
  const isLandingPage = pathname === '/';

  // 1. Auth pages (/login, /signup) -> full-screen dark planet theme without sidebar
  if (isAuthPage) {
    return (
      <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Planet Background Image */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <img
            src="/images/orbit-planet-bg.png"
            alt="Orbit Planet Background"
            className="w-full h-full object-cover object-center opacity-80"
          />
          {/* Dark Overlay (65-75% opacity with subtle gradient fade) */}
          <div className="absolute inset-0 bg-slate-950/70 bg-gradient-to-b from-slate-950/80 via-slate-950/60 to-slate-950/90" />
        </div>

        {/* Auth Card Content Wrapper */}
        <div className="relative z-10 w-full flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  // 2. Landing page (/) when user/admin is not logged in -> full width clean layout WITH top header nav and NO sidebar
  if (isLandingPage && !session?.user) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] text-slate-900 flex flex-col justify-between">
        {/* Landing Top Header Nav */}
        <header className="w-full bg-white/80 backdrop-blur-md border-b border-slate-200/80 px-6 py-4 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold shadow-md group-hover:scale-105 transition-transform">
                O
              </div>
              <div>
                <span className="font-extrabold text-lg text-slate-900 tracking-tight">Orbit</span>
                <span className="block text-[10px] text-slate-400 font-bold uppercase tracking-widest -mt-1">WORKSPACE</span>
              </div>
            </Link>

            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Log In</span>
              </Link>
              <Link
                href="/signup"
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md hover:shadow-lg transition-all flex items-center gap-1.5"
              >
                <span>Join Orbit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        </header>

        {/* Landing Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-8 space-y-6">
          {children}
        </main>

        {/* Landing Footer */}
        <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/80 bg-white">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>© {new Date().getFullYear()} Orbit Platform. All rights reserved.</p>
            <div className="flex items-center gap-4 text-slate-500 font-medium">
              <Link href="/login" className="hover:text-blue-600">Login</Link>
              <Link href="/signup" className="hover:text-blue-600">Register</Link>
            </div>
          </div>
        </footer>
      </div>
    );
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
