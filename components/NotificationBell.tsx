'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bell, Check, ExternalLink, Inbox, CheckCheck, Loader2 } from 'lucide-react';
import { gsap } from 'gsap';
import { useNotifications, formatRelativeTime } from '@/hooks/useNotifications';
import { INotification } from '@/types';

interface NotificationBellProps {
  isAdmin?: boolean;
}

function NotificationAvatar({ name, src }: { name?: string; src?: string }) {
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
        className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
      />
    );
  }

  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-bold ring-1 ring-slate-200 shrink-0">
      {initial}
    </div>
  );
}

export default function NotificationBell({ isAdmin = true }: NotificationBellProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
  } = useNotifications(isAdmin);

  // GSAP animation for dropdown menu open/close
  useEffect(() => {
    if (!dropdownRef.current) return;

    if (isOpen) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -10, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.22, ease: 'power2.out' }
      );
    }
  }, [isOpen]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleNotificationClick = async (notif: INotification) => {
    const notifId = notif.id || notif._id;
    if (notifId && !notif.read && !notif.isRead) {
      await markAsRead(notifId);
    }
    setIsOpen(false);

    if (notif.taskId) {
      router.push(`/tasks?taskId=${notif.taskId}`);
    } else {
      router.push('/tasks');
    }
  };

  if (!isAdmin) return null;

  return (
    <div ref={containerRef} className="relative inline-block text-left">
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="p-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 relative transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        title="Task Submission Alerts"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[9px] font-extrabold ring-2 ring-white animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* GSAP-Animated Dropdown Menu */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl p-4 shadow-xl z-50 space-y-3 origin-top-right"
        >
          {/* Header matching Latest Updates style */}
          <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900">Task Submission Alerts</h4>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px]">
                  {unreadCount} new
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* List of Notifications matching Latest Updates card styling */}
          <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
            {loading && notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-xs font-medium">Loading notifications...</span>
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center text-slate-400 space-y-1.5">
                <Inbox className="w-6 h-6 mx-auto text-slate-300" />
                <p className="text-xs font-medium">No submission alerts yet</p>
                <p className="text-[11px] text-slate-400">When members submit tasks, you&apos;ll be notified here.</p>
              </div>
            ) : (
              notifications.map((n) => {
                const isUnread = !n.read && !n.isRead;
                const submitter = n.memberName || n.submitterName || 'Team Member';
                const taskName = n.taskTitle || 'Assigned Task';
                const timeText = formatRelativeTime(n.createdAt);

                return (
                  <div
                    key={n.id || n._id}
                    onClick={() => handleNotificationClick(n)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all hover:border-blue-300 hover:shadow-xs group ${
                      isUnread
                        ? 'bg-blue-50/60 border-blue-200'
                        : 'bg-slate-50/50 border-slate-200/70 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <NotificationAvatar name={submitter} />

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <p className="text-xs leading-snug text-slate-900">
                            <span className="font-bold">{submitter}</span>
                            <span className="text-slate-600 font-normal"> submitted </span>
                            <span className="font-semibold text-slate-900">&lsquo;{taskName}&rsquo;</span>
                          </p>
                          {isUnread && (
                            <span
                              className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"
                              title="Unread"
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                          <span>{timeText}</span>
                          <span className="font-semibold text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                            Review task <ExternalLink className="w-2.5 h-2.5" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer Link */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <Link
              href="/tasks"
              onClick={() => setIsOpen(false)}
              className="font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <span>Go to Task Manager</span>
              <span>→</span>
            </Link>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
