'use client';

import { useState } from 'react';
import Link from 'next/link';
import { MessageSquare, Loader2, FolderKanban } from 'lucide-react';
import type { FeedbackFilters, FeedbackStatus } from '@zapbolt/shared';

import { useProjects } from '@/hooks/useProjects';
import {
  useAllFeedback,
  useDeleteFeedback,
  useBulkUpdateStatus,
  useBulkDeleteFeedback,
  type FeedbackWithProject,
} from '@/hooks/useFeedback';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FeedbackTableWithProject,
  type SortColumn,
  type SortOrder,
} from '@/components/feedback/feedback-table-with-project';
import { FeedbackFiltersComponent } from '@/components/feedback/feedback-filters';
import { BulkActionsBar } from '@/components/feedback/bulk-actions-bar';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function FeedbackLoading() {
  return (
    <div className="rounded-md border">
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AllFeedbackPage() {
  const [filters, setFilters] = useState<FeedbackFilters>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Sort state - default to sorting by date descending
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const { toast } = useToast();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const { data: feedbackData, isLoading: feedbackLoading } = useAllFeedback({
    filters,
    projectId: selectedProjectId || undefined,
    page,
    pageSize: 20,
    sortBy: sortColumn,
    sortOrder,
  });
  const deleteFeedback = useDeleteFeedback();
  const bulkUpdateStatus = useBulkUpdateStatus();
  const bulkDeleteFeedback = useBulkDeleteFeedback();

  const isLoading = projectsLoading || feedbackLoading;

  const handleDelete = async () => {
    if (deleteId) {
      await deleteFeedback.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleSortChange = (column: SortColumn, order: SortOrder) => {
    setSortColumn(column);
    setSortOrder(order);
    setPage(1);
  };

  const handleFiltersChange = (newFilters: FeedbackFilters) => {
    setFilters(newFilters);
    setPage(1);
  };

  const handleProjectChange = (projectId: string) => {
    setSelectedProjectId(projectId === 'all' ? '' : projectId);
    setPage(1);
    setSelectedIds([]);
  };

  const handleSelectionChange = (newSelectedIds: string[]) => {
    setSelectedIds(newSelectedIds);
  };

  const handleBulkStatusChange = async (status: FeedbackStatus) => {
    if (selectedIds.length === 0) return;

    try {
      const result = await bulkUpdateStatus.mutateAsync({
        ids: selectedIds,
        status,
      });
      toast({
        title: 'Status updated',
        description: `Successfully updated ${result.updated} item${result.updated !== 1 ? 's' : ''} to "${status}"`,
        variant: 'success',
      });
      setSelectedIds([]);
    } catch (error) {
      toast({
        title: 'Update failed',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;

    try {
      const result = await bulkDeleteFeedback.mutateAsync({ ids: selectedIds });
      toast({
        title: 'Items deleted',
        description: `Successfully deleted ${result.deleted} item${result.deleted !== 1 ? 's' : ''}`,
        variant: 'success',
      });
      setSelectedIds([]);
      setShowBulkDeleteDialog(false);
    } catch (error) {
      toast({
        title: 'Delete failed',
        description: error instanceof Error ? error.message : 'Failed to delete items',
        variant: 'destructive',
      });
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handlePageChange = (newPage: number) => {
    if (selectedIds.length > 0) {
      setSelectedIds([]);
      toast({
        title: 'Selection cleared',
        description: 'Selection was cleared when changing pages',
      });
    }
    setPage(newPage);
  };

  // Check if there are no projects
  const hasNoProjects = !projectsLoading && (!projects || projects.length === 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">All Feedback</h2>
          <p className="text-muted-foreground">
            View and manage feedback from all your projects
          </p>
        </div>
      </div>

      {hasNoProjects ? (
        <div className="text-center py-12 border rounded-xl bg-card">
          <FolderKanban className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
          <p className="text-muted-foreground mb-4">
            Create a project first to start collecting feedback
          </p>
          <Button asChild>
            <Link href="/projects">Go to Projects</Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Project Filter and Filters */}
          <div className="space-y-4">
            {/* Project Selector */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Project:</span>
                <Select
                  value={selectedProjectId || 'all'}
                  onValueChange={handleProjectChange}
                >
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Projects" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Projects</SelectItem>
                    {projects?.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Standard Filters */}
            <FeedbackFiltersComponent
              filters={filters}
              onChange={handleFiltersChange}
            />
          </div>

          {/* Bulk Actions Bar */}
          {selectedIds.length > 0 && (
            <BulkActionsBar
              selectedCount={selectedIds.length}
              onStatusChange={handleBulkStatusChange}
              onDelete={() => setShowBulkDeleteDialog(true)}
              onClearSelection={handleClearSelection}
              isUpdating={bulkUpdateStatus.isPending}
              isDeleting={bulkDeleteFeedback.isPending}
            />
          )}

          {/* Table */}
          {isLoading ? (
            <FeedbackLoading />
          ) : feedbackData?.items.length === 0 ? (
            <div className="text-center py-12 border rounded-lg bg-card">
              <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No feedback yet</h3>
              <p className="text-muted-foreground">
                {selectedProjectId || Object.keys(filters).length > 0
                  ? 'No feedback matches your current filters. Try adjusting your search criteria.'
                  : 'Feedback will appear here once users submit it through the widget.'}
              </p>
            </div>
          ) : (
            <>
              <FeedbackTableWithProject
                feedback={feedbackData?.items || []}
                onDelete={setDeleteId}
                sortColumn={sortColumn}
                sortOrder={sortOrder}
                onSortChange={handleSortChange}
                selectedIds={selectedIds}
                onSelectionChange={handleSelectionChange}
              />

              {/* Pagination */}
              {feedbackData && feedbackData.totalPages > 1 && (
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    Showing {feedbackData.items.length} of {feedbackData.total}{' '}
                    feedback items
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(Math.max(1, page - 1))}
                      disabled={page === 1}
                    >
                      Previous
                    </Button>
                    <span className="text-sm">
                      Page {page} of {feedbackData.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(page + 1)}
                      disabled={!feedbackData.hasMore}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Single Delete Dialog */}
          <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Feedback</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this feedback? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={deleteFeedback.isPending}
                >
                  {deleteFeedback.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Bulk Delete Dialog */}
          <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {selectedIds.length} items?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selectedIds.length} feedback{' '}
                  {selectedIds.length === 1 ? 'item' : 'items'}? This action cannot
                  be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={bulkDeleteFeedback.isPending}>
                  Cancel
                </AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleBulkDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  disabled={bulkDeleteFeedback.isPending}
                >
                  {bulkDeleteFeedback.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete {selectedIds.length} {selectedIds.length === 1 ? 'item' : 'items'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
    </div>
  );
}
