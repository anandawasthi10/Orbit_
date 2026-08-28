'use client';

import React, { useState, useEffect, useRef } from 'react';
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

  // Helper to filter out any fake sample legacy records
  const sanitizeUpdates = (items: any[]): IUpdate[] => {
    return (items || []).filter((item) => {
      const id = String(item._id || item.id || '');
      return !id.startsWith('update-sample-');
    });
  };

  // Stable ref so Firestore closure always has latest API data
  const apiItemsRef = useRef<IUpdate[]>([]);
  const firestoreItemsRef = useRef<IUpdate[]>([]);

  function mergeAll(): IUpdate[] {
    const list = [...apiItemsRef.current, ...firestoreItemsRef.current];
    const uniqueList: IUpdate[] = [];

    for (const u of list) {
      const id = String(u._id || u.id || '');
      if (!id || id.startsWith('temp-') || id.startsWith('update-sample-')) continue;

      const isDuplicate = uniqueList.some((existing) => {
        if (String(existing._id || existing.id) === id) return true;
        const authorObj1 = typeof existing.author === 'object' ? existing.author : null;
        const authorObj2 = typeof u.author === 'object' ? u.author : null;
        const authorIdExisting = authorObj1?._id || authorObj1?.id || (existing as any).authorId || (typeof existing.author === 'string' ? existing.author : '');
        const authorIdNew = authorObj2?._id || authorObj2?.id || (u as any).authorId || (typeof u.author === 'string' ? u.author : '');
        if (
          authorIdExisting &&
          authorIdExisting === authorIdNew &&
          existing.message?.trim() === u.message?.trim() &&
          Math.abs(
            new Date(existing.createdAt || 0).getTime() -
            new Date(u.createdAt || 0).getTime()
          ) < 60000
        ) {
          return true;
        }
        return false;
      });

      if (!isDuplicate) {
        uniqueList.push(u);
      }
    }

    const result = uniqueList.sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    // Save to local cache for 0ms instant display on next reload
    if (typeof window !== 'undefined' && result.length > 0) {
      try {
        localStorage.setItem('orbit_cached_daily_updates', JSON.stringify(result.slice(0, 100)));
      } catch (_) {}
    }

    return result;
  }

  // 1. Instant 0ms hydration from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const cached = localStorage.getItem('orbit_cached_daily_updates');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setUpdates(parsed);
            apiItemsRef.current = parsed;
            setLoading(false);
          }
        }
      } catch (_) {}
    }
  }, []);

  // 2. Fetch from persistent API (MongoDB / fileDb)
  useEffect(() => {
    fetch('/api/updates', { credentials: 'include', cache: 'no-store' })
      .then(async (r) => {
        const contentType = r.headers.get('content-type') || '';
        if (!r.ok || !contentType.includes('application/json')) {
          return [];
        }
        return r.json();
      })
      .then((data: any[]) => {
        if (Array.isArray(data) && data.length > 0) {
          const normalized = sanitizeUpdates(data).map((u: any) => ({
            _id: String(u._id || u.id || ''),
            id: String(u._id || u.id || ''),
            message: u.message,
            type: u.type || 'general',
            author: u.author || {
              _id: u.authorId || '',
              name: u.authorName || 'Teammate',
              role: u.authorRole || 'Team Member',
              avatarUrl: u.authorAvatar || '',
            },
            createdAt: u.isoCreatedAt || u.createdAt || new Date().toISOString(),
            updatedAt: u.isoCreatedAt || u.updatedAt || new Date().toISOString(),
          }));
          apiItemsRef.current = normalized;
          const merged = mergeAll();
          setUpdates(merged);
          setLoading(false);
        }
      })
      .catch((e) => {
        console.warn('Updates API fetch error:', e);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 3. Subscribe to Firestore for live real-time updates (includeMetadataChanges: true)
  useEffect(() => {
    let unsubscribeFirestore: (() => void) | null = null;

    try {
      const updatesRef = collection(db, 'updates');
      unsubscribeFirestore = onSnapshot(
        updatesRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          const list: IUpdate[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const docId = docSnap.id;
            if (docId.startsWith('update-sample-') || docId.startsWith('temp-')) return;

            let createdIso = new Date().toISOString();
            if (data.createdAt?.toDate) {
              createdIso = data.createdAt.toDate().toISOString();
            } else if (data.isoCreatedAt) {
              createdIso = data.isoCreatedAt;
            } else if (data.createdAt) {
              createdIso = String(data.createdAt);
            }

            list.push({
              _id: docId,
              id: docId,
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

          firestoreItemsRef.current = list;
          const merged = mergeAll();
          setUpdates(merged);
          setLoading(false);
        },
        (fsErr) => {
          console.warn('Firestore updates error, using API data only:', fsErr);
          if (apiItemsRef.current.length > 0) {
            setUpdates(apiItemsRef.current);
          }
          setLoading(false);
        }
      );
    } catch (err: any) {
      console.warn('Firestore subscription failed, using API:', err);
      if (apiItemsRef.current.length > 0) {
        setUpdates(apiItemsRef.current);
      }
      setLoading(false);
    }

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps


  // Instant Optimistic Submit (0ms Response Time)
  const handleSubmitUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || submitting) return;

    const trimmedMessage = message.trim();
    const updateType = type;
    const nowIso = new Date().toISOString();
    const tempId = `temp-${Date.now()}`;

    const authorInfo = {
      _id: user?.id || user?._id || 'anon',
      id: user?.id || user?._id || 'anon',
      name: user?.name || 'Teammate',
      role: user?.role || 'Team Member',
      avatarUrl: user?.avatarUrl || '',
      email: user?.email || '',
    };

    const optimisticEntry: IUpdate = {
      _id: tempId,
      id: tempId,
      message: trimmedMessage,
      type: updateType as any,
      author: authorInfo as any,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    // 1. INSTANT UI UPDATE — show it right away
    setMessage('');
    setType('general');
    setSubmitting(true);
    const immediateList = [optimisticEntry, ...updates.filter((u) => String(u._id || u.id) !== tempId)];
    apiItemsRef.current = [optimisticEntry, ...apiItemsRef.current.filter((u) => String(u._id || u.id) !== tempId)];
    setUpdates(immediateList);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('orbit_cached_daily_updates', JSON.stringify(immediateList.slice(0, 100)));
      } catch (_) {}
    }
    showToast('Daily update posted!');

    try {
      // 2a. Write to Firestore for real-time broadcast to others
      addDoc(collection(db, 'updates'), {
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
      }).catch((fsErr) => console.warn('Firestore async addDoc notice:', fsErr));

      // 2b. Write to MongoDB API for permanent storage
      const apiRes = await fetch('/api/updates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          message: trimmedMessage,
          type: updateType,
          authorId: authorInfo.id,
          authorName: authorInfo.name,
          authorRole: authorInfo.role,
          authorAvatar: authorInfo.avatarUrl,
        }),
      });

      if (apiRes.ok) {
        const savedUpdate = await apiRes.json();
        if (savedUpdate?._id || savedUpdate?.id) {
          const realId = String(savedUpdate._id || savedUpdate.id);
          const persistedEntry: IUpdate = {
            _id: realId,
            id: realId,
            message: trimmedMessage,
            type: updateType as any,
            author: authorInfo as any,
            createdAt: nowIso,
            updatedAt: nowIso,
          };
          // Add real entry to ref and remove temp
          apiItemsRef.current = [persistedEntry, ...apiItemsRef.current.filter((u) => String(u._id || u.id) !== tempId && String(u._id || u.id) !== realId)];
          // Replace temp entry with real one in UI
          setUpdates((prev) => {
            const withoutTemp = prev.filter((u) => String(u._id || u.id) !== tempId && String(u._id || u.id) !== realId);
            const newList = [persistedEntry, ...withoutTemp];
            if (typeof window !== 'undefined') {
              try {
                localStorage.setItem('orbit_cached_daily_updates', JSON.stringify(newList.slice(0, 100)));
              } catch (_) {}
            }
            return newList;
          });
        }
      }
    } catch (err: any) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Instant Optimistic Delete
  const handleDeleteUpdate = async () => {
    if (!updateToDelete) return;
    const id = updateToDelete._id || updateToDelete.id;
    if (!id) return;

    const targetId = String(id);
    setUpdateToDelete(null);

    // 1. INSTANT OPTIMISTIC REMOVAL
    const remaining = updates.filter((u) => String(u._id || u.id) !== targetId);
    apiItemsRef.current = apiItemsRef.current.filter((u) => String(u._id || u.id) !== targetId);
    firestoreItemsRef.current = firestoreItemsRef.current.filter((u) => String(u._id || u.id) !== targetId);
    setUpdates(remaining);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('orbit_cached_daily_updates', JSON.stringify(remaining.slice(0, 100)));
      } catch (_) {}
    }
    showToast('Update removed.');

    // 2. Background Deletion
    try {
      deleteDoc(doc(db, 'updates', targetId)).catch((fsErr) =>
        console.warn('Firestore async delete notice:', fsErr)
      );
      fetch(`/api/updates/${targetId}`, { method: 'DELETE' }).catch((apiErr) =>
        console.warn('API async delete notice:', apiErr)
      );
    } catch (err: any) {
      console.error('Delete error:', err);
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
