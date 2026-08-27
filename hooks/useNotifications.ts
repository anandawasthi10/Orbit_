'use client';

import { useState, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  collection,
  query,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  getDocs,
  where,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { INotification } from '@/types';

export function formatRelativeTime(dateInput: any): string {
  if (!dateInput) return 'Just now';

  let date: Date;
  if (dateInput instanceof Timestamp) {
    date = dateInput.toDate();
  } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (dateInput && typeof dateInput.toDate === 'function') {
    date = dateInput.toDate();
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    return 'Just now';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) return 'Just now';
  if (diffInSeconds < 60) return `${diffInSeconds}s ago`;

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function useNotifications(isAdmin: boolean = true) {
  const queryClient = useQueryClient();

  const [notifications, setNotifications] = useState<INotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  // Sync with API fallback if needed
  const fetchApiFallback = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      if (res.ok) {
        const data = await res.json();
        const apiList = (data.notifications || []).map((n: any) => ({
          ...n,
          id: n._id || n.id,
          read: Boolean(n.isRead || n.read),
        }));
        setNotifications(apiList);
        setUnreadCount(data.unreadCount || apiList.filter((n: any) => !n.read).length);
        queryClient.setQueryData(['notifications'], apiList);
      }
    } catch (err) {
      console.warn('API fallback notifications fetch error:', err);
    }
  }, [queryClient]);

  useEffect(() => {
    if (!isAdmin) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);

    let unsubscribeFirestore: (() => void) | null = null;

    try {
      const notifRef = collection(db, 'notifications');
      const notifQuery = query(notifRef, orderBy('createdAt', 'desc'), limit(30));

      unsubscribeFirestore = onSnapshot(
        notifQuery,
        (snapshot) => {
          if (!snapshot.empty || snapshot.docs.length > 0) {
            const list: INotification[] = [];
            snapshot.forEach((docSnap) => {
              const data = docSnap.data();
              list.push({
                id: docSnap.id,
                _id: docSnap.id,
                taskId: data.taskId,
                taskTitle: data.taskTitle,
                memberName: data.memberName || data.submitterName,
                memberId: data.memberId,
                type: data.type || 'task_submitted',
                message: data.message || `${data.memberName || 'Member'} submitted '${data.taskTitle}' task`,
                read: data.read === true || data.isRead === true,
                isRead: data.read === true || data.isRead === true,
                createdAt: data.createdAt,
              });
            });

            setNotifications(list);
            setUnreadCount(list.filter((n) => !n.read && !n.isRead).length);
            queryClient.setQueryData(['notifications'], list);
            setLoading(false);
          } else {
            // If empty in firestore, fetch from API fallback as well
            fetchApiFallback().finally(() => setLoading(false));
          }
        },
        (error) => {
          console.warn('Firestore onSnapshot error (using API fallback):', error.message);
          fetchApiFallback().finally(() => setLoading(false));
        }
      );
    } catch (err) {
      console.warn('Firestore subscription failed, using API:', err);
      fetchApiFallback().finally(() => setLoading(false));
    }

    return () => {
      if (unsubscribeFirestore) {
        unsubscribeFirestore();
      }
    };
  }, [isAdmin, fetchApiFallback, queryClient]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!notificationId) return;

    // Optimistic UI & Query Cache update
    const updater = (prev: INotification[]) =>
      prev.map((n) =>
        (n.id === notificationId || n._id === notificationId)
          ? { ...n, read: true, isRead: true }
          : n
      );

    setNotifications(updater);
    queryClient.setQueryData<INotification[]>(['notifications'], (old) => (old ? updater(old) : []));
    setUnreadCount((prev) => Math.max(0, prev - 1));

    // Update in Firestore
    try {
      const docRef = doc(db, 'notifications', notificationId);
      await updateDoc(docRef, { read: true, isRead: true });
    } catch (err) {
      console.warn('Firestore updateDoc notification error:', err);
    }

    // Update in API / DB
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId }),
      });
    } catch (err) {
      console.warn('API PATCH notification error:', err);
    }
  }, [queryClient]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    // Optimistic UI & Query Cache update
    const updater = (prev: INotification[]) =>
      prev.map((n) => ({ ...n, read: true, isRead: true }));

    setNotifications(updater);
    queryClient.setQueryData<INotification[]>(['notifications'], (old) => (old ? updater(old) : []));
    setUnreadCount(0);

    // Update in Firestore
    try {
      const notifRef = collection(db, 'notifications');
      const unreadQuery = query(notifRef, where('read', '==', false), limit(50));
      const unreadDocs = await getDocs(unreadQuery);

      if (!unreadDocs.empty) {
        const batch = writeBatch(db);
        unreadDocs.forEach((d) => {
          batch.update(d.ref, { read: true, isRead: true });
        });
        await batch.commit();
      }
    } catch (err) {
      console.warn('Firestore batch mark read error:', err);
    }

    // Update in API / DB
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
    } catch (err) {
      console.warn('API PATCH mark all read error:', err);
    }
  }, [queryClient]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    formatRelativeTime,
  };
}
