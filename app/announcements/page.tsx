'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Megaphone,
  Bell,
  BellRing,
  Sparkles,
  Loader2,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  User,
  Clock,
  Radio,
} from 'lucide-react';
import TopHeader from '@/components/TopHeader';
import AnnouncementComposer from '@/components/AnnouncementComposer';
import { useAnnouncements } from '@/hooks/useAnnouncements';
import { IAnnouncement } from '@/types';

function AuthorAvatar({ src, name, size = 'w-9 h-9' }: { src?: string | null; name?: string; size?: string }) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || 'U';

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (src && !imgError) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover ring-2 ring-slate-200 shrink-0`}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold ring-2 ring-slate-200 shrink-0`}
    >
      {initial}
    </div>
  );
}

export default function AnnouncementsPage() {
  const { data: session } = useSession();
  const user = session?.user as any;
  const userRole = (user?.role || '').toLowerCase();
  const userEmail = (user?.email || '').toLowerCase();

  const isAdmin =
    userEmail === 'anandawasthi610@gmail.com' ||
    userRole.includes('admin') ||
    userRole.includes('lead') ||
    userRole.includes('manager') ||
    userRole.includes('ceo') ||
    userRole.includes('founder');

  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IAnnouncement | null>(null);

  const showToast = (text: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  // Connect Announcements Real-Time Hook
  const {
    announcements,
    loading,
    isSubmitting,
    notificationPermission,
    requestNotificationPermission,
    markAnnouncementsAsSeen,
    postAnnouncement,
    deleteAnnouncement,
  } = useAnnouncements((newAnnouncement) => {
    showToast(
      `📢 New announcement from ${newAnnouncement.authorName}: "${newAnnouncement.message.slice(0, 60)}${
        newAnnouncement.message.length > 60 ? '...' : ''
      }"`,
      'info'
    );
  });

  // Mark all announcements as seen when page opens
  useEffect(() => {
    markAnnouncementsAsSeen();
  }, [markAnnouncementsAsSeen]);

  const handleEnableNotifications = async () => {
    const result = await requestNotificationPermission();
    if (result === 'granted') {
      showToast('Browser notifications enabled! You will receive live alerts.', 'success');
    } else {
      showToast('Notification permission was not granted.', 'info');
    }
  };

  const handlePost = async (messageText: string) => {
    try {
      await postAnnouncement(messageText);
      showToast('Announcement broadcasted to workspace!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to broadcast announcement', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget?.id && !deleteTarget?._id) return;
    const targetId = String(deleteTarget.id || deleteTarget._id);
    setDeleteTarget(null);
    await deleteAnnouncement(targetId);
    showToast('Announcement removed.', 'info');
  };

  const getRelativeTime = (timestamp?: string) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {toastMsg && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-top-4 duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-600 text-white'
              : toastMsg.type === 'error'
              ? 'bg-red-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : toastMsg.type === 'error' ? (
            <AlertTriangle className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <TopHeader
        title="Workspace Announcements"
        subtitle="Official workspace broadcasts from team leads & admins."
      />

      {/* Non-Blocking Browser Notification Permission Prompt */}
      {notificationPermission === 'default' && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
              <BellRing className="w-4 h-4" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900">Enable Desktop Broadcast Alerts</h4>
              <p className="text-[11px] text-slate-600">
                Receive instant OS-level banner notifications when announcements are posted even if this tab is in the background.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleEnableNotifications}
            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs shrink-0 self-start sm:self-auto"
          >
            Enable Browser Alerts
          </button>
        </div>
      )}

      {/* Announcement Composer — Admin Only */}
      {isAdmin ? (
        <AnnouncementComposer onPost={handlePost} isSubmitting={isSubmitting} />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 flex items-center gap-3.5 shadow-xs">
          <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center shrink-0">
            <Megaphone className="w-4.5 h-4.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900">Official Announcement Channel</h4>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <ShieldCheck className="w-3 h-3 text-amber-600" />
                Admin Broadcasts Only
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Only workspace admins and team leads can post announcements here. Live updates stream directly from Firebase.
            </p>
          </div>
        </div>
      )}

      {/* Real-time Announcements Feed */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600" />
            Live Broadcast Feed
          </h3>
          <span className="text-xs text-slate-500 font-semibold">
            {announcements.length} {announcements.length === 1 ? 'broadcast' : 'broadcasts'}
          </span>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium">Syncing live announcements...</p>
          </div>
        )}

        {!loading && announcements.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center space-y-3 border border-slate-200 shadow-sm">
            <Megaphone className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No broadcasts yet</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Be the first to post a team announcement, milestone update, or sprint notification!
            </p>
          </div>
        )}

        {!loading && announcements.length > 0 && (
          <div className="space-y-3.5">
            {announcements.map((item) => {
              const itemId = item._id || item.id || '';
              const isAuthorAdmin = (item.authorRole || '').toLowerCase().includes('admin');
              const isCurrentAuthor = item.authorId && user?.id && String(item.authorId) === String(user.id);
              const canDelete = isCurrentAuthor || isAdmin;

              return (
                <div
                  key={itemId}
                  className={`bg-white border rounded-2xl p-4.5 shadow-xs transition-all group relative ${
                    isAuthorAdmin
                      ? 'border-amber-200/90 bg-gradient-to-br from-white via-white to-amber-50/20'
                      : 'border-slate-200/80 hover:border-blue-300'
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <AuthorAvatar src={item.authorAvatar} name={item.authorName} />

                    <div className="flex-1 min-w-0 pr-6 space-y-1.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{item.authorName}</span>

                          {/* Role Badge */}
                          {isAuthorAdmin ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                              <ShieldCheck className="w-3 h-3 text-amber-600" />
                              Admin
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <User className="w-3 h-3 text-slate-500" />
                              Member
                            </span>
                          )}

                          {/* Pending local write indicator */}
                          {item.isPending && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200 animate-pulse">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              sending...
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                          <Clock className="w-3 h-3" />
                          <span>{getRelativeTime(item.isoCreatedAt || item.createdAt)}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-800 font-medium leading-relaxed whitespace-pre-line pt-0.5">
                        {item.message}
                      </p>
                    </div>

                    {/* Delete Option */}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(item)}
                        className="absolute top-3.5 right-3.5 p-1.5 rounded-lg text-slate-300 hover:text-rose-500 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-all opacity-0 group-hover:opacity-100"
                        title="Remove Announcement"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4 border border-rose-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-11 h-11 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center mx-auto text-rose-600">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold text-slate-900">Delete Announcement?</h3>
              <p className="text-xs text-slate-500">
                This will remove the announcement from all team feeds immediately.
              </p>
            </div>
            <div className="flex gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
