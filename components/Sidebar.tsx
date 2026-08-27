'use client';

import React, { useState, useEffect } from 'react';
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
  LogOut,
  User,
  UserPlus,
  ShieldCheck,
  Pencil,
  Megaphone,
} from 'lucide-react';
import EditProfileModal from '@/components/EditProfileModal';
import { useAnnouncements } from '@/hooks/useAnnouncements';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: string;
}

function UserAvatar({ src, name, size = 'w-9 h-9' }: UserAvatarProps) {
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
  const user = session?.user as any;
  const [profileName, setProfileName] = useState(user?.name || '');
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(user?.avatarUrl || '');
  const [profileRole, setProfileRole] = useState(user?.role || '');
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  const { unreadCount } = useAnnouncements();
  const [avatarCacheBust, setAvatarCacheBust] = useState<number>(Date.now());

  // Sync profile info from session + DB fresh on every session user change
  useEffect(() => {
    if (user) {
      // Apply session data immediately (no loading flicker)
      if (user.name) setProfileName(user.name);
      if (user.role) setProfileRole(user.role);
      // Only set avatar from session if it's a valid URL (not empty, not stale base64 stripped)
      if (user.avatarUrl) {
        setProfileAvatarUrl(user.avatarUrl);
        setAvatarCacheBust(Date.now());
      }

      // Always re-fetch fresh data from DB to pick up latest avatar/name
      fetch('/api/members/me', { cache: 'no-store' })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data) {
            if (data.name) setProfileName(data.name);
            if (data.avatarUrl) {
              setProfileAvatarUrl(data.avatarUrl);
              setAvatarCacheBust(Date.now());
            }
            if (data.role) setProfileRole(data.role);
          }
        })
        .catch(() => {});
    }
  }, [user?.id, user?.avatarUrl, user?.name, user?.role]); // eslint-disable-line react-hooks/exhaustive-deps

  const userRole = profileRole || user?.role || 'Member';
  const userEmail = (user?.email || '').toLowerCase();
  const isAdmin =
    userEmail === 'anandawasthi610@gmail.com' ||
    userRole.toLowerCase().includes('admin') ||
    userRole.toLowerCase().includes('lead') ||
    userRole.toLowerCase().includes('manager') ||
    userRole.toLowerCase().includes('ceo') ||
    userRole.toLowerCase().includes('founder');

  // Sidebar items tailored for Admin vs Member roles
  const navItems = isAdmin
    ? [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Announcements', href: '/announcements', icon: Megaphone, count: unreadCount },
        { label: 'Admin Control', href: '/admin', icon: ShieldCheck },
        { label: 'Team Workspace', href: '/teams', icon: UserPlus },
        { label: 'Member Directory', href: '/team', icon: Users },
        { label: 'Task Manager', href: '/tasks', icon: CheckSquare },
        { label: 'Projects', href: '/projects', icon: FolderKanban },
        { label: 'Daily Updates', href: '/daily-updates', icon: MessageSquare },
        { label: 'Resources', href: '/resources', icon: BookOpen },
      ]
    : [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { label: 'Announcements', href: '/announcements', icon: Megaphone, count: unreadCount },
        { label: 'Team', href: '/teams', icon: UserPlus },
        { label: 'Tasks', href: '/tasks', icon: CheckSquare },
        { label: 'Projects', href: '/projects', icon: FolderKanban },
        { label: 'Daily Updates', href: '/daily-updates', icon: MessageSquare },
        { label: 'Resources', href: '/resources', icon: BookOpen },
      ];

  return (
    <aside className="w-60 bg-[#0B1120] text-slate-300 flex flex-col shrink-0 h-screen sticky top-0 border-r border-slate-800/60 z-40 overflow-hidden relative">
      {/* Planet Background Image */}
      <div className="absolute inset-0 pointer-events-none z-0 select-none overflow-hidden">
        <img
          src="/images/orbit-planet-bg.png"
          alt=""
          className="absolute opacity-30"
          style={{
            width: '280px',
            height: '420px',
            bottom: '60px',
            left: '50%',
            transform: 'translateX(-50%)',
            objectFit: 'cover',
            objectPosition: 'center center',
            maskImage: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, transparent 65%)',
            WebkitMaskImage: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 35%, transparent 65%)',
          }}
        />
        {/* Subtle blue glow at bottom */}
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-blue-950/30 via-blue-900/10 to-transparent" />
      </div>

      {/* Top Logo & Title */}
      <div className="p-4 border-b border-slate-800/60 shrink-0 relative z-10">
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
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto relative z-10">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all group ${
                isActive
                  ? 'bg-[#2563EB] text-white shadow-md shadow-blue-500/20'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon className={`w-4.5 h-4.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`} />
                <span className="truncate">{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {Boolean(item.count && item.count > 0) && (
                  <span
                    className={`text-[10px] font-black px-2 py-0.5 rounded-full shrink-0 ${
                      isActive
                        ? 'bg-white text-blue-600 font-black'
                        : 'bg-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                    }`}
                  >
                    {item.count! > 99 ? '99+' : item.count}
                  </span>
                )}
                {(item as any).badge && (
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 rounded-md uppercase tracking-wider shrink-0 ${
                      isActive
                        ? 'bg-white/25 text-white'
                        : 'bg-purple-500/20 text-purple-300 border border-purple-400/30'
                    }`}
                  >
                    {(item as any).badge}
                  </span>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom User Account Panel */}
      {user ? (
        <div className="p-3 border-t border-slate-800/80 mt-auto bg-slate-950/40 shrink-0 relative z-10">
          <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:border-slate-700/60 transition-colors">
            <button
              type="button"
              onClick={() => setIsEditProfileOpen(true)}
              className="flex items-center gap-2.5 overflow-hidden text-left hover:opacity-90 transition-opacity flex-1 min-w-0 mr-1"
              title="Click to edit profile picture & name"
            >
              <div className="relative group">
                <UserAvatar
                  src={profileAvatarUrl || user.avatarUrl}
                  name={profileName || user.name}
                  key={avatarCacheBust}
                />
                <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Pencil className="w-3 h-3" />
                </div>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-bold text-white truncate leading-tight flex items-center gap-1">
                  {profileName || user.name}
                </span>
                <span className="text-[10px] text-slate-400 truncate">
                  {profileRole || user.role || 'Member'}
                </span>
              </div>
            </button>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditProfileOpen(true)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                title="Edit Profile"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>

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
        </div>
      ) : (
        <div className="p-4 border-t border-slate-800/80 mt-auto shrink-0 relative z-10">
          <Link
            href="/login"
            className="w-full saas-btn-primary py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"
          >
            <User className="w-4 h-4" />
            Log In
          </Link>
        </div>
      )}

      {/* Edit Profile Modal */}
      <EditProfileModal
        isOpen={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        onProfileUpdated={(updated) => {
          if (updated.name) setProfileName(updated.name);
          if (updated.avatarUrl) {
            setProfileAvatarUrl(updated.avatarUrl);
            setAvatarCacheBust(Date.now()); // Bust cache so <img> reloads
          }
          if (updated.role) setProfileRole(updated.role);
        }}
      />
    </aside>
  );
}
