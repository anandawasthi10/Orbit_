'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import {
  LayoutDashboard,
  CheckSquare,
  FolderKanban,
  Users,
  MessageSquare,
  BookOpen,
  Sparkles,
  LogOut,
  User,
  ShieldCheck,
  UserPlus,
} from 'lucide-react';

function UserAvatar({ src, name, size = 'w-9 h-9' }) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || 'U';

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover ring-2 ring-blue-500/40 shrink-0`}
      />
    );
  }

  return (
    <div className={`${size} rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-blue-500/30 shrink-0`}>
      {initial}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const [profileRole, setProfileRole] = useState(user?.role || '');

  useEffect(() => {
    if (user) {
      fetch('/api/members/me')
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.role) {
            setProfileRole(data.role);
          }
        })
        .catch(() => {});
    }
  }, [user]);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Team', href: '/teams', icon: UserPlus },
    { label: 'Directory', href: '/team', icon: Users },
    { label: 'Task Manager', href: '/tasks', icon: CheckSquare },
    { label: 'Projects', href: '/projects', icon: FolderKanban },
    { label: 'Daily Updates', href: '/daily-updates', icon: MessageSquare },
    { label: 'Resources', href: '/resources', icon: BookOpen },
  ];

  return (
    <aside className="w-60 bg-[#0B1120] text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800/60 z-40 overflow-hidden">
      {/* Top Logo & Title */}
      <div className="p-4 border-b border-slate-800/60 shrink-0">
        <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-3 group">
          <div className="relative w-10 h-10 rounded-xl bg-slate-900/90 border border-blue-500/30 flex items-center justify-center p-1 shadow-[0_0_12px_rgba(37,99,235,0.35)] shrink-0 group-hover:scale-105 group-hover:border-blue-400/50 transition-all duration-200">
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_6px_#60a5fa]" />
            <img
              src="/orbit-logo.png"
              alt="Orbit Logo"
              className="w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(37,99,235,0.5)]"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-black tracking-tight text-white">
              Orbit
            </span>
            <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-0.5">
              Workspace
            </span>
          </div>
        </Link>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-300'}`} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Account Panel */}
      {user ? (
        <div className="p-3 border-t border-slate-800/80 mt-auto bg-slate-950/40 shrink-0">
          <div className="flex items-center justify-between p-2 rounded-xl">
            <Link
              href="/onboarding"
              className="flex items-center gap-2.5 overflow-hidden hover:opacity-80 transition-opacity"
              title="View & Edit Profile"
            >
              <UserAvatar src={user.avatarUrl} name={user.name} />
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate leading-tight">
                  {user.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {profileRole || user.role || 'Member'}
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div className="p-4 border-t border-slate-800/80 mt-auto shrink-0">
          <Link
            href="/login"
            className="w-full saas-btn-primary py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <User className="w-4 h-4" />
            Log In
          </Link>
        </div>
      )}
    </aside>
  );
}
