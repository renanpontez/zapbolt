'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import type {
  Feedback,
  FeedbackFilters,
  FeedbackReply,
  FeedbackReplyListResponse,
  FeedbackStatus,
  PaginatedResponse,
  CreateFeedbackReplyResponse,
} from '@zapbolt/shared';

// Extended feedback type that includes project information
export interface FeedbackWithProject extends Feedback {
  projectName: string;
}

async function fetchApi<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error?.message || 'Request failed');
  }

  return data;
}

export type SortColumn = 'created_at' | 'status' | 'priority' | 'category';
export type SortOrder = 'asc' | 'desc';

interface UseFeedbackOptions {
  projectId?: string;
  filters?: FeedbackFilters;
  page?: number;
  pageSize?: number;
  sortBy?: SortColumn;
  sortOrder?: SortOrder;
}

export function useFeedback({
  projectId,
  filters,
  page = 1,
  pageSize = 20,
  sortBy = 'created_at',
  sortOrder = 'desc',
}: UseFeedbackOptions = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['feedback', projectId, filters, page, pageSize, sortBy, sortOrder],
    queryFn: async () => {
      if (!projectId) {
        throw new Error('Project ID is required');
      }

      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });

      if (filters?.status?.length) {
        params.set('status', filters.status.join(','));
      }
      if (filters?.category?.length) {
        params.set('category', filters.category.join(','));
      }
      if (filters?.priority?.length) {
        params.set('priority', filters.priority.join(','));
      }
      if (filters?.search) {
        params.set('search', filters.search);
      }
      if (filters?.startDate) {
        params.set('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.set('endDate', filters.endDate);
      }

      return fetchApi<PaginatedResponse<Feedback>>(
        `/api/projects/${projectId}/feedback?${params}`
      );
    },
    enabled: isAuthenticated && !!projectId,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

interface UseAllFeedbackOptions {
  filters?: FeedbackFilters;
  projectId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: SortColumn;
  sortOrder?: SortOrder;
}

export function useAllFeedback({
  filters,
  projectId,
  page = 1,
  pageSize = 20,
  sortBy = 'created_at',
  sortOrder = 'desc',
}: UseAllFeedbackOptions = {}) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['feedback', 'all', projectId, filters, page, pageSize, sortBy, sortOrder],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
        sortBy,
        sortOrder,
      });

      if (projectId) {
        params.set('projectId', projectId);
      }
      if (filters?.status?.length) {
        params.set('status', filters.status.join(','));
      }
      if (filters?.category?.length) {
        params.set('category', filters.category.join(','));
      }
      if (filters?.priority?.length) {
        params.set('priority', filters.priority.join(','));
      }
      if (filters?.search) {
        params.set('search', filters.search);
      }
      if (filters?.startDate) {
        params.set('startDate', filters.startDate);
      }
      if (filters?.endDate) {
        params.set('endDate', filters.endDate);
      }

      return fetchApi<PaginatedResponse<FeedbackWithProject>>(
        `/api/feedback?${params}`
      );
    },
    enabled: isAuthenticated,
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useFeedbackItem(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['feedback', 'item', id],
    queryFn: () => fetchApi<Feedback>(`/api/feedback/${id}`),
    enabled: isAuthenticated && !!id,
  });
}

export function useUpdateFeedbackStatus(feedbackId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (status: FeedbackStatus) =>
      fetchApi<Feedback>(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    // Optimistic update
    onMutate: async (newStatus) => {
      await queryClient.cancelQueries({
        queryKey: ['feedback', 'item', feedbackId],
      });

      const previousFeedback = queryClient.getQueryData<Feedback>([
        'feedback',
        'item',
        feedbackId,
      ]);

      if (previousFeedback) {
        queryClient.setQueryData(['feedback', 'item', feedbackId], {
          ...previousFeedback,
          status: newStatus,
        });
      }

      return { previousFeedback };
    },
    onError: (_err, _newStatus, context) => {
      if (context?.previousFeedback) {
        queryClient.setQueryData(
          ['feedback', 'item', feedbackId],
          context.previousFeedback
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}

export function useUpdateFeedbackNotes(feedbackId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (internalNotes: string) =>
      fetchApi<Feedback>(`/api/feedback/${feedbackId}`, {
        method: 'PATCH',
        body: JSON.stringify({ internalNotes }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['feedback', 'item', feedbackId],
      });
    },
  });
}

export function useDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(`/api/feedback/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}

interface BulkUpdateStatusParams {
  ids: string[];
  status: FeedbackStatus;
}

export function useBulkUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids, status }: BulkUpdateStatusParams) =>
      fetchApi<{ updated: number }>('/api/feedback/bulk', {
        method: 'PATCH',
        body: JSON.stringify({ ids, status }),
      }),
    // Optimistic update for the list
    onMutate: async ({ ids, status }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feedback'] });

      // Snapshot the previous value
      const previousQueries = queryClient.getQueriesData<PaginatedResponse<Feedback>>({
        queryKey: ['feedback'],
      });

      // Optimistically update the cache
      queryClient.setQueriesData<PaginatedResponse<Feedback>>(
        { queryKey: ['feedback'] },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            items: old.items.map((item) =>
              ids.includes(item.id) ? { ...item, status } : item
            ),
          };
        }
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}

interface BulkDeleteParams {
  ids: string[];
}

export function useBulkDeleteFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ ids }: BulkDeleteParams) =>
      fetchApi<{ deleted: number }>('/api/feedback/bulk', {
        method: 'DELETE',
        body: JSON.stringify({ ids }),
      }),
    // Optimistic update for the list
    onMutate: async ({ ids }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['feedback'] });

      // Snapshot the previous value
      const previousQueries = queryClient.getQueriesData<PaginatedResponse<Feedback>>({
        queryKey: ['feedback'],
      });

      // Optimistically update the cache - remove deleted items
      queryClient.setQueriesData<PaginatedResponse<Feedback>>(
        { queryKey: ['feedback'] },
        (old) => {
          if (!old) return old;
          const filteredItems = old.items.filter((item) => !ids.includes(item.id));
          return {
            ...old,
            items: filteredItems,
            total: old.total - (old.items.length - filteredItems.length),
          };
        }
      );

      return { previousQueries };
    },
    onError: (_err, _variables, context) => {
      // Rollback on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['feedback'] });
    },
  });
}

// Feedback Replies Hooks

export function useFeedbackReplies(feedbackId: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['feedback', 'replies', feedbackId],
    queryFn: () => fetchApi<FeedbackReplyListResponse>(`/api/feedback/${feedbackId}/reply`),
    enabled: isAuthenticated && !!feedbackId,
  });
}

export function useSendReply(feedbackId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (message: string) =>
      fetchApi<CreateFeedbackReplyResponse>(`/api/feedback/${feedbackId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message }),
      }),
    onSuccess: (newReply) => {
      // Optimistically add the new reply to the cache
      queryClient.setQueryData<FeedbackReplyListResponse>(
        ['feedback', 'replies', feedbackId],
        (old) => {
          if (!old) return { replies: [] };
          const reply: FeedbackReply = {
            id: newReply.id,
            feedbackId,
            message: newReply.message,
            sentBy: 'admin',
            sentByEmail: '', // Will be updated on refetch
            createdAt: newReply.createdAt,
          };
          return {
            replies: [...old.replies, reply],
          };
        }
      );
      // Also invalidate to ensure fresh data
      queryClient.invalidateQueries({
        queryKey: ['feedback', 'replies', feedbackId],
      });
    },
  });
}
