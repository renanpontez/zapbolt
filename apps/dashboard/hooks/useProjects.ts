'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import type { Project, ProjectCreateInput, ProjectUpdateInput } from '@zapbolt/shared';

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

export function useProjects() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['projects'],
    queryFn: () => fetchApi<Project[]>('/api/projects'),
    enabled: isAuthenticated,
  });
}

export function useProject(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['projects', id],
    queryFn: () => fetchApi<Project>(`/api/projects/${id}`),
    enabled: isAuthenticated && !!id,
  });
}

export function useProjectStats(id: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['projects', id, 'stats'],
    queryFn: () => fetchApi<{
      totalFeedback: number;
      monthlyFeedback: number;
      byStatus: Record<string, number>;
      byCategory: Record<string, number>;
      byPriority: Record<string, number>;
      recentTrend: number;
    }>(`/api/projects/${id}/stats`),
    enabled: isAuthenticated && !!id,
  });
}

/**
 * Creates a new project with optimistic updates.
 * The new project appears immediately in the UI before server confirmation,
 * providing instant feedback to the user. If the server request fails,
 * the optimistic update is rolled back automatically.
 */
export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProjectCreateInput) =>
      fetchApi<Project>('/api/projects', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onMutate: async (newProjectData) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot the previous value for potential rollback
      const previousProjects = queryClient.getQueryData<Project[]>(['projects']);

      // Create an optimistic project with temporary values
      // Using crypto.randomUUID() for a unique temporary ID
      const optimisticProject: Project = {
        id: `temp-${crypto.randomUUID()}`,
        userId: '',
        name: newProjectData.name,
        domain: newProjectData.domain,
        apiKey: '',
        widgetConfig: {
          position: 'bottom-right',
          primaryColor: '#3B82F6',
          textColor: '#FFFFFF',
          buttonText: 'Feedback',
          showBranding: true,
          categories: ['Bug', 'Feature', 'Improvement', 'Other'],
          collectEmail: 'optional',
          enableScreenshot: true,
          enableSessionReplay: false,
        },
        urlPatterns: [],
        tier: 'free',
        feedbackCount: 0,
        monthlyFeedbackCount: 0,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Optimistically update the cache - prepend the new project
      queryClient.setQueryData<Project[]>(['projects'], (old) => {
        if (!old) return [optimisticProject];
        return [optimisticProject, ...old];
      });

      // Return context with the previous state for potential rollback
      return { previousProjects };
    },
    onError: (_error, _newProject, context) => {
      // Rollback to the previous state on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
    },
    onSuccess: (createdProject) => {
      // Replace the optimistic project with the real one from the server
      queryClient.setQueryData<Project[]>(['projects'], (old) => {
        if (!old) return [createdProject];
        // Remove the optimistic entry (starts with 'temp-') and add the real project
        const withoutOptimistic = old.filter((p) => !p.id.startsWith('temp-'));
        return [createdProject, ...withoutOptimistic];
      });
    },
    onSettled: () => {
      // Always refetch after mutation to ensure cache consistency with server
      // This runs regardless of success or error
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProjectUpdateInput) =>
      fetchApi<Project>(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects', id] });
    },
  });
}

/**
 * Deletes a project with optimistic updates.
 * The project is removed from the UI immediately before server confirmation,
 * providing instant feedback. If the server request fails, the deletion
 * is rolled back automatically.
 */
export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      fetchApi<{ success: boolean }>(`/api/projects/${id}`, {
        method: 'DELETE',
      }),
    onMutate: async (deletedId) => {
      // Cancel any outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['projects'] });

      // Snapshot the previous value for potential rollback
      const previousProjects = queryClient.getQueryData<Project[]>(['projects']);

      // Optimistically remove the project from the cache
      queryClient.setQueryData<Project[]>(['projects'], (old) => {
        if (!old) return [];
        return old.filter((project) => project.id !== deletedId);
      });

      // Return context with the previous state for potential rollback
      return { previousProjects };
    },
    onError: (_error, _deletedId, context) => {
      // Rollback to the previous state on error
      if (context?.previousProjects) {
        queryClient.setQueryData(['projects'], context.previousProjects);
      }
    },
    onSettled: () => {
      // Always refetch after mutation to ensure cache consistency with server
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}

export function useRegenerateApiKey(projectId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () =>
      fetchApi<{ apiKey: string }>(`/api/projects/${projectId}/regenerate-key`, {
        method: 'POST',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects', projectId] });
    },
  });
}
