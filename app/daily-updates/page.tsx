'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  collection,
  onSnapshot,
  addDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import {
  Send,
  Loader2,
  MessageSquare,
  Sparkles,
  Trash2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import TopHeader from '@/components/TopHeader';
import { IUpdate } from '@/types';

const TYPE_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  progress: { label: 'Progress', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', dot: 'bg-emerald-500' },
  blocker: { label: 'Blocker', color: 'bg-red-50 text-red-700 border-red-200', dot: 'bg-red-500' },
  announcement: { label: 'Announcement', color: 'bg-purple-50 text-purple-700 border-purple-200', dot: 'bg-purple-500' },
  general: { label: 'General', color: 'bg-slate-100 text-slate-700 border-slate-200', dot: 'bg-slate-500' },
};

function AuthorAvatar({ src, name, size = 'w-9 h-9' }: { src?: string | null; name?: string; size?: string }) {
  const [imgError, setImgError] = useState(false);
  const initial = name?.charAt(0).toUpperCase() || 'U';

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

export default function DailyUpdatesPage() {
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

  const [updates, setUpdates] = useState<IUpdate[]>([]);
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Delete State
  const [updateToDelete, setUpdateToDelete] = useState<IUpdate | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (text: string, toastType: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type: toastType });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Real-time Firestore sync with robust client-side ordering
  useEffect(() => {
    setLoading(true);
    let unsubscribeFirestore: (() => void) | null = null;

    try {
      const updatesRef = collection(db, 'updates');

      unsubscribeFirestore = onSnapshot(
        updatesRef,
        (snapshot) => {
          if (!snapshot.empty) {
            const list: IUpdate[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              let createdIso = new Date().toISOString();
              if (data.createdAt?.toDate) {
                createdIso = data.createdAt.toDate().toISOString();
              } else if (data.isoCreatedAt) {
                createdIso = data.isoCreatedAt;
              } else if (data.createdAt) {
                createdIso = String(data.createdAt);
              }

              list.push({
                _id: docSnap.id,
                id: docSnap.id,
                message: data.message,
                type: data.type || 'general',
                author: data.author || {
                  _id: data.authorId || '',
                  name: data.authorName || 'Teammate',
                  role: data.authorRole || 'Member',
                  avatarUrl: data.authorAvatar || '',
                },
                createdAt: createdIso,
                updatedAt: createdIso,
              } as any);
            });

            // Sort newest first in memory
            list.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());
            setUpdates(list);
            setLoading(false);
          } else {
            // Fallback to API if Firestore has no docs yet
            fetch('/api/updates')
              .then((res) => res.json())
              .then((data) => {
                if (Array.isArray(data)) {
                  setUpdates(data);
                }
              })
              .catch(console.warn)
              .finally(() => setLoading(false));
          }
        },
        (fsErr) => {
          console.warn('Firestore updates onSnapshot warning, falling back to API:', fsErr);
          fetch('/api/updates')
            .then((res) => res.json())
            .then((data) => setUpdates(Array.isArray(data) ? data : []))
            .catch((e) => setError(e.message))
            .finally(() => setLoading(false));
        }
      );
    } catch (err: any) {
      console.warn('Firestore subscription failed, using API:', err);
      fetch('/api/updates')
        .then((res) => res.json())
        .then((data) => setUpdates(Array.isArray(data) ? data : []))
        .catch((e) => setError(e.message))
        .finally(() => setLoading(false));
    }

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []);

  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSubmitting(true);
    const trimmedMessage = message.trim();
    const updateType = type;

    try {
      const authorInfo = {
        _id: user?.id || user?._id || 'anon',
        id: user?.id || user?._id || 'anon',
        name: user?.name || 'Teammate',
        role: user?.role || 'Team Member',
        avatarUrl: user?.avatarUrl || '',
        email: user?.email || '',
      };

      const nowIso = new Date().toISOString();

      // 1. Post to Firestore for real-time live sync across all tabs & users
      try {
        await addDoc(collection(db, 'updates'), {
          message: trimmedMessage,
          type: updateType,
          author: authorInfo,
          authorId: authorInfo.id,
          authorName: authorInfo.name,
          authorRole: authorInfo.role,
          authorAvatar: authorInfo.avatarUrl,
          isoCreatedAt: nowIso,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (fsErr) {
        console.warn('Firestore addDoc update notice:', fsErr);
      }

      // 2. Sync with Backend API
      const res = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmedMessage, type: updateType }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to post update to server');
      }

      const newEntry = await res.json();
      setUpdates((prev) => {
        const exists = prev.some((u) => String(u._id || u.id) === String(newEntry._id || newEntry.id));
        return exists ? prev : [newEntry, ...prev];
      });

      setMessage('');
      setType('general');
      showToast('Daily update posted successfully!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUpdate = async () => {
    if (!updateToDelete) return;
    const id = updateToDelete._id || updateToDelete.id;
    if (!id) return;

    setDeletingId(String(id));
    try {
      // 1. Delete from Firestore if exists
      try {
        await deleteDoc(doc(db, 'updates', String(id)));
      } catch (fsErr) {
        console.warn('Firestore deleteDoc notice:', fsErr);
      }

      // 2. Delete from API
      const res = await fetch(`/api/updates/${id}`, { method: 'DELETE' });
      const data = await res.json().catch(() => ({}));

      setUpdates((prev) => prev.filter((u) => String(u._id || u.id) !== String(id)));
      showToast('Update deleted successfully.');
      setUpdateToDelete(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setDeletingId(null);
    }
  };

  const getRelativeTime = (timestamp?: string) => {
    if (!timestamp) return 'Recently';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 2) return 'Just now';
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
            toastMsg.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toastMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4" />
          ) : (
            <AlertTriangle className="w-4 h-4" />
          )}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Header Bar */}
      <TopHeader
        title="Daily Updates"
        subtitle="Share progress, blockers, and daily team highlights with your workspace."
      />

      {/* Post Daily Update Card */}
      <div className="saas-card rounded-xl p-6 space-y-4 bg-white border border-slate-200/80 shadow-sm">
        <div className="flex items-center gap-3">
          <AuthorAvatar src={user?.avatarUrl} name={user?.name} />
          <div>
            <h3 className="text-sm font-bold text-slate-900">Post a Daily Update</h3>
            <p className="text-xs font-medium text-slate-700">Share what you accomplished or what you&apos;re working on today</p>
          </div>
        </div>

        <form onSubmit={handleSubmitUpdate} className="space-y-4">
          <textarea
            required
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="e.g. Completed user authentication flow and updated team documentation..."
            className="w-full px-3.5 py-2.5 rounded-lg saas-input text-sm text-slate-900 placeholder:text-slate-400"
          />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                Type:
              </span>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="px-3 py-1.5 rounded-lg saas-input text-xs font-semibold bg-white text-slate-800"
              >
                <option value="general">General Update</option>
                <option value="progress">Progress Milestone</option>
                <option value="blocker">Blocker / Issue</option>
                <option value="announcement">Announcement</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="saas-btn-primary px-5 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Posting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Post Daily Update</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Activity Feed Section */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            Activity Feed
          </h3>
          <span className="text-xs text-slate-700 font-semibold">
            {updates.length} {updates.length === 1 ? 'total update' : 'total updates'}
          </span>
        </div>

        {loading && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-3" />
            <p className="text-sm font-medium">Loading daily updates...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            Failed to load activity feed: {error}
          </div>
        )}

        {!loading && !error && updates.length === 0 && (
          <div className="saas-card rounded-xl p-12 text-center bg-white space-y-3 border border-slate-200">
            <MessageSquare className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-800">No updates yet</h4>
            <p className="text-xs text-slate-600 font-medium">Be the first teammate to share a progress update today!</p>
          </div>
        )}

        {!loading && !error && updates.length > 0 && (
          <div className="space-y-3">
            {updates.map((item) => {
              const itemId = item._id || item.id;
              const typeConfig = TYPE_CONFIG[item.type || 'general'] || TYPE_CONFIG.general;
              const authorObj = typeof item.author === 'object' ? item.author : null;
              const authorName = authorObj?.name || 'Teammate';
              const authorRole = authorObj?.role || 'Member';
              const authorAvatar = authorObj?.avatarUrl || '';
              const authorId = String(authorObj?._id || authorObj?.id || item.author || '');
              const isCurrentAuthor = authorId && user?.id && authorId === String(user.id);
              const canDelete = isAdmin || isCurrentAuthor;

              return (
                <div
                  key={itemId}
                  className="saas-card rounded-xl p-4 flex items-start gap-3.5 bg-white border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all group relative"
                >
                  <AuthorAvatar src={authorAvatar} name={authorName} />

                  <div className="flex-1 space-y-1 min-w-0 pr-6">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900">{authorName}</span>
                        <span className="text-[11px] text-slate-600 font-semibold">({authorRole})</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${typeConfig.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${typeConfig.dot}`} />
                          {typeConfig.label}
                        </span>
                        <span className="text-[11px] text-slate-600 font-semibold">
                          {getRelativeTime(item.createdAt)}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 font-medium leading-relaxed pt-1 whitespace-pre-line">
                      {item.message}
                    </p>
                  </div>

                  {/* Delete Update Button (Visible on Hover for Admin or Author) */}
                  {canDelete && (
                    <button
                      type="button"
                      onClick={() => setUpdateToDelete(item)}
                      className="absolute top-3 right-3 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 border border-transparent hover:border-red-200 transition-all opacity-0 group-hover:opacity-100"
                      title="Delete Update"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {updateToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-sm w-full space-y-4 border border-red-100 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-50 border border-red-200 flex items-center justify-center mx-auto text-red-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-bold text-slate-900">Delete Update?</h3>
              <p className="text-xs text-slate-600">
                Are you sure you want to remove this update from the activity feed?
              </p>
              <p className="text-[11px] text-red-600 font-medium">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={() => setUpdateToDelete(null)}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteUpdate}
                disabled={Boolean(deletingId)}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                {deletingId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {deletingId ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
