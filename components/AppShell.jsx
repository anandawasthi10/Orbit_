'use client';

import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';

export default function AppShell({ children }) {
  const pathname = usePathname();

  // Full-screen pages without sidebar
  const isAuthPage = pathname === '/login' || pathname === '/signup';

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
