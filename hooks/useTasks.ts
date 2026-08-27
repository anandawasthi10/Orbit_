'use client';

import { useQuery } from '@tanstack/react-query';
import { ITask } from '@/types';

async function fetchTasks(): Promise<ITask[]> {
  const res = await fetch('/api/tasks');
  if (!res.ok) {
    throw new Error('Failed to fetch workspace tasks');
  }
  return res.json();
}

export function useTasks(userId?: string | null) {
  const query = useQuery({
    queryKey: ['tasks', userId || 'all'],
    queryFn: async () => {
      const allTasks = await fetchTasks();
      if (!userId) {
        return allTasks;
      }
      return allTasks.filter((t) => {
        const assignedId = typeof t.assignedTo === 'object' ? (t.assignedTo?._id || t.assignedTo?.id) : t.assignedTo;
        return assignedId && String(assignedId) === String(userId);
      });
    },
    staleTime: 30 * 1000,
  });

  return {
    tasks: query.data || [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}
