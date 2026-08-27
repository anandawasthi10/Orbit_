'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  collection,
  onSnapshot,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { IAnnouncement } from '@/types';

function playNotificationChime() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (_) {}
}

/** Merge two lists by id, keeping latest 200, sorted newest-first. */
function mergeAndSort(a: IAnnouncement[], b: IAnnouncement[]): IAnnouncement[] {
  const map = new Map<string, IAnnouncement>();
  [...a, ...b].forEach((item) => {
    const id = String(item._id || item.id || '');
    if (id) map.set(id, item);
  });
  return Array.from(map.values())
    .sort(
      (x, y) =>
        new Date(y.isoCreatedAt || y.createdAt || 0).getTime() -
        new Date(x.isoCreatedAt || x.createdAt || 0).getTime()
    )
    .slice(0, 200);
}

export function useAnnouncements(onNewAnnouncement?: (a: IAnnouncement) => void) {
  const { data: session } = useSession();
  const user = session?.user as any;
  const currentUserId = user?.id || user?._id || '';
  const currentUserName = user?.name || 'Teammate';
  const currentUserAvatar = user?.avatarUrl || '';
  const currentUserRole = (user?.role || 'member').toLowerCase();

  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const isFirstLoadRef = useRef(true);
  const lastPostTimeRef = useRef(0);
  const firestoreItemsRef = useRef<IAnnouncement[]>([]);
  const apiItemsRef = useRef<IAnnouncement[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const calculateUnread = useCallback(
    (items: IAnnouncement[]) => {
      if (typeof window === 'undefined') return 0;
      try {
        const lastSeen = localStorage.getItem('orbit_last_seen_announcement');
        if (!lastSeen) return items.filter((a) => a.authorId !== currentUserId).length;
        const lastSeenTime = new Date(lastSeen).getTime();
        return items.filter((a) => {
          const t = new Date(a.isoCreatedAt || a.createdAt || 0).getTime();
          return a.authorId !== currentUserId && t > lastSeenTime;
        }).length;
      } catch {
        return 0;
      }
    },
    [currentUserId]
  );

  const applyMerge = useCallback(
    (fsItems: IAnnouncement[], apiItems: IAnnouncement[]) => {
      const merged = mergeAndSort(fsItems, apiItems);
      setAnnouncements(merged);
      setUnreadCount(calculateUnread(merged));
      setLoading(false);
    },
    [calculateUnread]
  );

  // 1. Load persisted data from API (MongoDB / fileDb) on mount
  useEffect(() => {
    fetch('/api/announcements')
      .then((r) => (r.ok ? r.json() : []))
      .then((data: any[]) => {
        if (!Array.isArray(data)) return;
        const mapped: IAnnouncement[] = data.map((d) => ({
          _id: String(d._id || d.id || ''),
          id: String(d._id || d.id || ''),
          authorId: d.authorId || '',
          authorName: d.authorName || 'Teammate',
          authorAvatar: d.authorAvatar || '',
          authorRole: d.authorRole || 'member',
          message: d.message || '',
          isoCreatedAt: d.isoCreatedAt || d.createdAt || new Date().toISOString(),
          createdAt: d.isoCreatedAt || d.createdAt || new Date().toISOString(),
        }));
        apiItemsRef.current = mapped;
        applyMerge(firestoreItemsRef.current, mapped);
      })
      .catch(console.warn);
  }, [applyMerge]);

  // 2. Subscribe to Firestore for live updates
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    try {
      const ref = collection(db, 'announcements');
      unsubscribe = onSnapshot(
        ref,
        { includeMetadataChanges: true },
        (snapshot) => {
          const list: IAnnouncement[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            let createdIso =
              data.isoCreatedAt ||
              (data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : null) ||
              new Date().toISOString();

            list.push({
              _id: docSnap.id,
              id: docSnap.id,
              authorId: data.authorId || '',
              authorName: data.authorName || 'Teammate',
              authorAvatar: data.authorAvatar || '',
              authorRole: data.authorRole || 'member',
              message: data.message || '',
              isPending: docSnap.metadata.hasPendingWrites,
              isoCreatedAt: createdIso,
              createdAt: createdIso,
            });
          });

          firestoreItemsRef.current = list;
          applyMerge(list, apiItemsRef.current);

          // Detect new incoming announcements from other users
          if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;
          } else {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added' && !change.doc.metadata.hasPendingWrites) {
                const data = change.doc.data();
                const isFromOther = data.authorId && String(data.authorId) !== String(currentUserId);
                if (isFromOther) {
                  const newItem: IAnnouncement = {
                    id: change.doc.id,
                    authorId: data.authorId,
                    authorName: data.authorName || 'Teammate',
                    authorAvatar: data.authorAvatar || '',
                    authorRole: data.authorRole || 'member',
                    message: data.message,
                    createdAt: data.isoCreatedAt || new Date().toISOString(),
                    isoCreatedAt: data.isoCreatedAt || new Date().toISOString(),
                  };
                  playNotificationChime();
                  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    const role = (data.authorRole || 'member').includes('admin') ? 'Admin' : 'Member';
                    try {
                      new Notification(`📢 Orbit Announcement • ${data.authorName} (${role})`, {
                        body: data.message,
                        icon: '/orbit-logo.png',
                      });
                    } catch (_) {}
                  }
                  if (onNewAnnouncement) onNewAnnouncement(newItem);
                }
              }
            });
          }
        },
        (err) => {
          console.warn('[useAnnouncements] Firestore error:', err.message);
          // Still have API data — just keep showing it
          setLoading(false);
        }
      );
    } catch (err: any) {
      console.warn('[useAnnouncements] Firestore subscription failed:', err);
      setLoading(false);
    }
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserId, applyMerge, onNewAnnouncement]);

  const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (typeof window === 'undefined' || !('Notification' in window)) return 'denied';
    try {
      const p = await Notification.requestPermission();
      setNotificationPermission(p);
      return p;
    } catch {
      return 'denied';
    }
  };

  const markAnnouncementsAsSeen = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orbit_last_seen_announcement', new Date().toISOString());
      setUnreadCount(0);
    }
  }, []);

  const postAnnouncement = async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || isSubmitting) return;

    const now = Date.now();
    if (now - lastPostTimeRef.current < 1500) return;
    lastPostTimeRef.current = now;

    setIsSubmitting(true);
    const nowIso = new Date().toISOString();

    const roleTag =
      currentUserRole.includes('admin') ||
      currentUserRole.includes('lead') ||
      currentUserRole.includes('manager') ||
      currentUserRole.includes('ceo') ||
      currentUserRole.includes('founder') ||
      user?.email === 'anandawasthi610@gmail.com'
        ? 'admin'
        : 'member';

    const authorPayload = {
      authorId: currentUserId || 'anonymous',
      authorName: currentUserName,
      authorAvatar: currentUserAvatar,
      authorRole: roleTag,
      message: trimmed,
      isoCreatedAt: nowIso,
    };

    try {
      // Write to Firestore (real-time broadcast)
      addDoc(collection(db, 'announcements'), {
        ...authorPayload,
        createdAt: serverTimestamp(),
      }).catch((e) => console.warn('[useAnnouncements] Firestore addDoc:', e));

      // Write to persistent API (MongoDB / fileDb) — this is the permanent store
      fetch('/api/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: trimmed, authorRole: roleTag }),
      })
        .then((r) => r.json())
        .then((saved) => {
          if (saved?._id || saved?.id) {
            const persisted: IAnnouncement = {
              _id: String(saved._id || saved.id),
              id: String(saved._id || saved.id),
              ...authorPayload,
            };
            apiItemsRef.current = [persisted, ...apiItemsRef.current];
          }
        })
        .catch((e) => console.warn('[useAnnouncements] API post:', e));
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    if (!id) return;
    // Optimistic remove from local state
    setAnnouncements((prev) => prev.filter((a) => String(a._id || a.id) !== id));
    firestoreItemsRef.current = firestoreItemsRef.current.filter((a) => String(a._id || a.id) !== id);
    apiItemsRef.current = apiItemsRef.current.filter((a) => String(a._id || a.id) !== id);

    // Delete from Firestore
    deleteDoc(doc(db, 'announcements', id)).catch(console.warn);
    // Delete from persistent DB
    fetch(`/api/announcements/${id}`, { method: 'DELETE' }).catch(console.warn);
  };

  return {
    announcements,
    unreadCount,
    loading,
    isSubmitting,
    notificationPermission,
    requestNotificationPermission,
    markAnnouncementsAsSeen,
    postAnnouncement,
    deleteAnnouncement,
  };
}
