'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Users, LayoutDashboard, CheckSquare, MessageSquare, LogOut, User, ShieldCheck } from 'lucide-react';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: string;
}

function UserAvatar({ src, name, size = 'w-8 h-8' }: UserAvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || 'U';

  React.useEffect(() => {
    setImgError(false);
  }, [src]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover ring-2 ring-indigo-500/40`}
      />
    );
  }

  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-indigo-500/30`}>
      {initial}
    </div>
  );
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const loading = status === 'loading';
  const logoHref = session?.user ? '/dashboard' : '/';

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-white/10 backdrop-blur-xl bg-slate-950/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href={logoHref} className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-black/80 border border-slate-800 flex items-center justify-center p-0.5 shadow-md group-hover:scale-105 transition-transform duration-200 shrink-0">
              <img
                src="/orbit-logo.png"
                alt="Orbit Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Orbit
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <LayoutDashboard className="w-4 h-4 text-indigo-400" />
              Dashboard
            </Link>
            <Link
              href="/tasks"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <CheckSquare className="w-4 h-4 text-emerald-400" />
              Task Manager
            </Link>
            <Link
              href="/daily-updates"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <MessageSquare className="w-4 h-4 text-pink-400" />
              Daily Updates
            </Link>
            <Link
              href="/team"
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
            >
              <Users className="w-4 h-4 text-purple-400" />
              Directory
            </Link>
          </nav>

          {/* Auth State Action Buttons */}
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-24 h-9 bg-slate-800/60 animate-pulse rounded-lg" />
            ) : session?.user ? (
              <div className="flex items-center gap-3">
                <Link
                  href="/onboarding"
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/20 transition-all"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {(session.user as any).profileComplete ? 'Edit Profile' : 'Complete Profile'}
                </Link>

                <div className="flex items-center gap-2.5 pl-2 border-l border-white/10">
                  <UserAvatar src={(session.user as any).avatarUrl} name={session.user.name} />
                  <span className="hidden sm:inline-block text-sm font-medium text-slate-200">
                    {session.user.name}
                  </span>
                </div>

                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Log In
                </Link>
                <Link
                  href="/signup"
                  className="btn-primary px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-1.5"
                >
                  <User className="w-4 h-4" />
                  Join Orbit
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
