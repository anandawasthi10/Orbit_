'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { doc, collection, writeBatch, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ITask } from '@/types';

export interface SubmitTaskPayload {
  taskId: string;
  taskTitle?: string;
  link: string;
  note?: string;
  fileUrl?: string;
  memberId: string;
  memberName: string;
}

export function useSubmitTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: SubmitTaskPayload) => {
      const { taskId, taskTitle = 'Assigned Task', link, note = '', fileUrl = '', memberId, memberName } = payload;

      const submissionData = {
        status: 'submitted',
        submittedAt: new Date().toISOString(),
        submittedBy: memberId,
        submittedByName: memberName,
        submissionNote: note.trim(),
        submissionFile: fileUrl,
        submissionFiles: fileUrl ? [fileUrl] : [],
        submissionLink: link.trim(),
        updatedAt: new Date().toISOString(),
      };

      // 1. Atomic Batch Write in Firestore (Task update + Notification creation)
      // Both operations happen atomically in a single request (Spark-plan compatible, no Blaze needed).
      try {
        const batch = writeBatch(db);

        // Update task document in `tasks` collection
        const taskDocRef = doc(db, 'tasks', taskId);
        batch.set(
          taskDocRef,
          {
            ...submissionData,
            submittedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );

        // Create new notification document in `notifications` collection
        const notifDocRef = doc(collection(db, 'notifications'));
        batch.set(notifDocRef, {
          type: 'task_submitted',
          taskId,
          taskTitle,
          memberName,
          memberId,
          submissionLink: link.trim(),
          createdAt: serverTimestamp(),
          read: false,
          isRead: false,
          message: `${memberName} submitted '${taskTitle}' task`,
        });

        await batch.commit();
      } catch (fsErr) {
        console.warn('[useSubmitTask] Firestore atomic batch write warning:', fsErr);
      }

      // 2. Sync with Backend API (/api/submissions)
      const res = await fetch('/api/submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId,
          link: link.trim(),
          screenshotUrl: fileUrl,
          note: note.trim(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to submit task to server');
      }

      return res.json();
    },

    // Optimistic UI Update with Rollback
    onMutate: async (newSubmission) => {
      // Cancel any outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['tasks'] });

      // Snapshot the previous tasks state
      const previousTasks = queryClient.getQueriesData<ITask[]>({ queryKey: ['tasks'] });

      // Optimistically update all matching task queries in cache
      queryClient.setQueriesData<ITask[]>({ queryKey: ['tasks'] }, (oldTasks) => {
        if (!oldTasks) return [];
        return oldTasks.map((t) => {
          const currentId = t._id || t.id;
          if (currentId === newSubmission.taskId) {
            return {
              ...t,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
              submittedBy: newSubmission.memberId,
              submittedByName: newSubmission.memberName,
              submissionNote: newSubmission.note,
              submissionFile: newSubmission.fileUrl,
              submissionLink: newSubmission.link,
            };
          }
          return t;
        });
      });

      return { previousTasks };
    },

    // Rollback to previous state on error
    onError: (err, newSubmission, context) => {
      console.error('[useSubmitTask] Mutation failed, rolling back optimistic state:', err);
      if (context?.previousTasks) {
        context.previousTasks.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    // Always invalidate queries to ensure fresh data
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
