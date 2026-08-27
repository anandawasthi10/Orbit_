'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import {
  collection,
  query,
  limit,
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
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5

    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch (err) {
    // AudioContext autoplay restrictions are handled gracefully
  }
}

export function useAnnouncements(onNewAnnouncement?: (announcement: IAnnouncement) => void) {
  const { data: session } = useSession();
  const sessionUser = session?.user as any;
  const currentUserId = sessionUser?.id || sessionUser?._id || '';
  const currentUserName = sessionUser?.name || 'Teammate';
  const currentUserAvatar = sessionUser?.avatarUrl || '';
  const currentUserRole = (sessionUser?.role || 'member').toLowerCase();

  const [announcements, setAnnouncements] = useState<IAnnouncement[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  const isFirstLoadRef = useRef(true);
  const lastPostTimeRef = useRef(0);

  // Initialize browser notification permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  // Compute unread count from localStorage
  const calculateUnread = useCallback((items: IAnnouncement[]) => {
    if (typeof window === 'undefined') return 0;
    try {
      const lastSeen = localStorage.getItem('orbit_last_seen_announcement');
      if (!lastSeen) {
        return items.filter((a) => a.authorId !== currentUserId).length;
      }
      const lastSeenTime = new Date(lastSeen).getTime();
      return items.filter((a) => {
        const itemTime = new Date(a.isoCreatedAt || a.createdAt || 0).getTime();
        return a.authorId !== currentUserId && itemTime > lastSeenTime;
      }).length;
    } catch {
      return 0;
    }
  }, [currentUserId]);

  // Real-time Firestore onSnapshot listener with includeMetadataChanges: true
  useEffect(() => {
    setLoading(true);
    let unsubscribe: (() => void) | null = null;

    try {
      const announcementsRef = collection(db, 'announcements');
      const q = query(announcementsRef, limit(50));

      unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        (snapshot) => {
          const list: IAnnouncement[] = [];

          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const hasPendingWrites = docSnap.metadata.hasPendingWrites;

            let createdIso = data.isoCreatedAt || new Date().toISOString();
            if (data.createdAt?.toDate) {
              createdIso = data.createdAt.toDate().toISOString();
            }

            list.push({
              _id: docSnap.id,
              id: docSnap.id,
              authorId: data.authorId || '',
              authorName: data.authorName || 'Team Member',
              authorAvatar: data.authorAvatar || '',
              authorRole: data.authorRole || 'member',
              message: data.message || '',
              isPending: hasPendingWrites,
              createdAt: createdIso,
              isoCreatedAt: createdIso,
            });
          });

          // Sort newest first in memory
          list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          setAnnouncements(list);
          setUnreadCount(calculateUnread(list));
          setLoading(false);

          // Handle live incoming notifications for newly added docs from other members
          if (isFirstLoadRef.current) {
            isFirstLoadRef.current = false;
          } else {
            snapshot.docChanges().forEach((change) => {
              if (change.type === 'added') {
                const data = change.doc.data();
                const authorId = data.authorId;
                const isFromOtherUser = authorId && String(authorId) !== String(currentUserId);

                if (isFromOtherUser && !change.doc.metadata.hasPendingWrites) {
                  const newAnnouncement: IAnnouncement = {
                    id: change.doc.id,
                    authorId: data.authorId,
                    authorName: data.authorName || 'Teammate',
                    authorAvatar: data.authorAvatar || '',
                    authorRole: data.authorRole || 'member',
                    message: data.message,
                    createdAt: data.isoCreatedAt || new Date().toISOString(),
                  };

                  // 1. Play audio chime
                  playNotificationChime();

                  // 2. Trigger OS-Level Notification if permission is granted
                  if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                    const roleLabel = (data.authorRole || 'member').toLowerCase().includes('admin') ? 'Admin' : 'Member';
                    try {
                      new Notification(`📢 Orbit Announcement • ${data.authorName} (${roleLabel})`, {
                        body: data.message,
                        icon: '/orbit-logo.png',
                      });
                    } catch (notifErr) {
                      console.warn('OS Notification trigger notice:', notifErr);
                    }
                  }

                  // 3. Trigger In-App Toast callback
                  if (onNewAnnouncement) {
                    onNewAnnouncement(newAnnouncement);
                  }
                }
              }
            });
          }
        },
        (error) => {
          console.warn('[useAnnouncements] Firestore onSnapshot notice:', error.message);
          setLoading(false);
        }
      );
    } catch (err: any) {
      console.warn('[useAnnouncements] Subscription failed:', err);
      setLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [currentUserId, calculateUnread, onNewAnnouncement]);

  // Request browser Notification permission on explicit user gesture
  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'denied';
    }
    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      return permission;
    } catch {
      return 'denied';
    }
  };

  // Mark all announcements as seen (clears badge)
  const markAnnouncementsAsSeen = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('orbit_last_seen_announcement', new Date().toISOString());
      setUnreadCount(0);
    }
  }, []);

  // Post Announcement with debouncing to prevent duplicate rapid clicks
  const postAnnouncement = async (messageText: string) => {
    const trimmed = messageText.trim();
    if (!trimmed || isSubmitting) return;

    // Debounce rapid submissions (minimum 1.5s between posts)
    const now = Date.now();
    if (now - lastPostTimeRef.current < 1500) {
      return;
    }
    lastPostTimeRef.current = now;

    setIsSubmitting(true);
    const nowIso = new Date().toISOString();

    const roleTag = currentUserRole.includes('admin') ||
      currentUserRole.includes('lead') ||
      currentUserRole.includes('manager') ||
      currentUserRole.includes('ceo') ||
      currentUserRole.includes('founder') ||
      sessionUser?.email === 'anandawasthi610@gmail.com'
        ? 'admin'
        : 'member';

    try {
      await addDoc(collection(db, 'announcements'), {
        authorId: currentUserId || 'anonymous',
        authorName: currentUserName,
        authorAvatar: currentUserAvatar,
        authorRole: roleTag,
        message: trimmed,
        isoCreatedAt: nowIso,
        createdAt: serverTimestamp(),
      });
    } catch (err: any) {
      console.error('[useAnnouncements] Failed to post announcement:', err);
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Announcement
  const deleteAnnouncement = async (id: string) => {
    if (!id) return;
    try {
      await deleteDoc(doc(db, 'announcements', id));
      setAnnouncements((prev) => prev.filter((a) => a.id !== id && a._id !== id));
    } catch (err: any) {
      console.error('[useAnnouncements] Delete announcement notice:', err);
    }
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
