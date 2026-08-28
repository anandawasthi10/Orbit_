'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Search, Bell, Users, CheckSquare, Loader2, X, ExternalLink, Inbox } from 'lucide-react';
import { IMember, ITask, INotification } from '@/types';

import NotificationBell from '@/components/NotificationBell';

interface TopHeaderProps {
  title: string;
  subtitle?: string;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  Research: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  Frontend: { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200' },
  Backend: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  DevOps: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'UI/UX': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200' },
  Documentation: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  General: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
};

function MemberAvatar({ src, name, size = 'w-6 h-6' }: { src?: string | null; name?: string; size?: string }) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || 'M';

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover ring-1 ring-slate-200 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold ring-1 ring-slate-200 shrink-0`}
    >
      {initial}
    </div>
  );
}

export default function TopHeader({ title, subtitle }: TopHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isDashboard = pathname === '/dashboard';

  const { data: session } = useSession();
  const user = session?.user;

  const userRole = (user as any)?.role || 'Member';
  const isAdmin =
    userRole.toLowerCase().includes('admin') ||
    userRole.toLowerCase().includes('lead') ||
    userRole.toLowerCase().includes('manager') ||
    userRole.toLowerCase().includes('ceo') ||
    userRole.toLowerCase().includes('founder');

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ members: IMember[]; tasks: ITask[] }>({ members: [], tasks: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Global '/' Keyboard Shortcut to Focus Search Bar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA'
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }

      if (e.key === 'Escape') {
        setShowSearchDropdown(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Click Outside Listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(e.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced Live Search Fetching (300ms)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults({ members: [], tasks: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setShowSearchDropdown(true);

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Search fetch error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectMember = (memberId?: string) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    router.push('/team');
  };

  const handleSelectTask = (taskId?: string) => {
    setShowSearchDropdown(false);
    setSearchQuery('');
    router.push('/tasks');
  };

  const hasResults =
    searchResults.members.length > 0 || searchResults.tasks.length > 0;

  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-0 z-30 shadow-xs">
      {/* Title & Greeting */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-slate-700 font-medium mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right Controls: Functional Search (Dashboard Only), Notifications */}
      <div className="flex items-center gap-3">
        {/* Search Bar Container - Rendered on Dashboard Only */}
        {isDashboard && (
          <div ref={searchContainerRef} className="relative w-full sm:w-72">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim()) setShowSearchDropdown(true);
                }}
                placeholder="Search members or tasks..."
                className="w-full pl-9 pr-8 py-1.5 rounded-lg saas-input text-xs text-slate-800 placeholder:text-slate-400"
              />

              {searchQuery ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchDropdown(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              ) : (
                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-400 border border-slate-200 pointer-events-none">
                  /
                </span>
              )}
            </div>

            {/* Search Live Results Popover Dropdown */}
            {showSearchDropdown && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150 space-y-3 max-h-96 overflow-y-auto">
                {isSearching ? (
                  <div className="flex items-center justify-center py-6 text-slate-400 gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span className="text-xs font-medium">Searching...</span>
                  </div>
                ) : !hasResults ? (
                  <div className="py-6 text-center text-xs text-slate-500">
                    No results found for &ldquo;<span className="font-semibold text-slate-700">{searchQuery}</span>&rdquo;
                  </div>
                ) : (
                  <>
                    {/* Members Section */}
                    {searchResults.members.length > 0 && (
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <Users className="w-3 h-3 text-blue-600" />
                          <span>Members</span>
                        </div>
                        <div className="space-y-1">
                          {searchResults.members.map((m) => (
                            <div
                              key={m._id || m.id}
                              onClick={() => handleSelectMember(m._id || m.id)}
                              className="p-2 rounded-lg hover:bg-blue-50/60 cursor-pointer flex items-center justify-between transition-colors group"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <MemberAvatar src={m.avatarUrl} name={m.name} />
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 truncate">
                                    {m.name}
                                  </span>
                                  <span className="text-[10px] text-slate-500 truncate">
                                    {m.role || 'Member'}
                                  </span>
                                </div>
                              </div>
                              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 group-hover:bg-blue-100 px-2 py-0.5 rounded-full shrink-0">
                                Directory →
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Tasks Section */}
                    {searchResults.tasks.length > 0 && (
                      <div className="space-y-1.5 pt-2 border-t border-slate-100">
                        <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <CheckSquare className="w-3 h-3 text-emerald-600" />
                          <span>Tasks</span>
                        </div>
                        <div className="space-y-1">
                          {searchResults.tasks.map((t) => {
                            const catStyle =
                              CATEGORY_COLORS[t.category || 'General'] || CATEGORY_COLORS.General;
                            return (
                              <div
                                key={t._id || t.id}
                                onClick={() => handleSelectTask(t._id || t.id)}
                                className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between transition-colors group"
                              >
                                <div className="space-y-0.5 min-w-0 flex-1 pr-2">
                                  <p className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 truncate">
                                    {t.title}
                                  </p>
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-1.5 py-0.2 rounded text-[9px] font-semibold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                                    >
                                      {t.category}
                                    </span>
                                    <span className="text-[10px] text-slate-400 capitalize">
                                      {(t.status || '').replace('_', ' ')}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-[10px] font-semibold text-slate-500 group-hover:text-blue-600 shrink-0">
                                  Open →
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Real-time Notifications Bell (Admin Only) */}
        <NotificationBell isAdmin={isAdmin} />
      </div>
    </header>
  );
}
