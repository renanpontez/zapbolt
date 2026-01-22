'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MessageSquare, Loader2 } from 'lucide-react';
import type { FeedbackFilters, FeedbackStatus } from '@zapbolt/shared';

import { useProject } from '@/hooks/useProjects';
import {
  useFeedback,
  useDeleteFeedback,
  useBulkUpdateStatus,
  useBulkDeleteFeedback,
} from '@/hooks/useFeedback';
import { useToast } from '@/hooks/useToast';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FeedbackTable,
  type SortColumn,
  type SortOrder,
} from '@/components/feedback/feedback-table';
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

interface ProjectFeedbackPageProps {
  params: Promise<{ id: string }>;
}

function FeedbackLoading() {
  return (
    <div className="rounded-md border">
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-4">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function ProjectFeedbackPage({
  params,
}: ProjectFeedbackPageProps) {
  const { id } = use(params);
  const [filters, setFilters] = useState<FeedbackFilters>({});
  const [page, setPage] = useState(1);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Sort state - default to sorting by date descending
  const [sortColumn, setSortColumn] = useState<SortColumn>('created_at');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Selection state for bulk operations
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const { toast } = useToast();
  const { data: project } = useProject(id);
  const { data: feedbackData, isLoading } = useFeedback({
    projectId: id,
    filters,
    page,
    pageSize: 20,
    sortBy: sortColumn,
    sortOrder,
  });
  const deleteFeedback = useDeleteFeedback();
  const bulkUpdateStatus = useBulkUpdateStatus();
  const bulkDeleteFeedback = useBulkDeleteFeedback();

  const handleDelete = async () => {
    if (deleteId) {
      await deleteFeedback.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleSortChange = (column: SortColumn, order: SortOrder) => {
    setSortColumn(column);
    setSortOrder(order);
    // Reset to first page when sorting changes
    setPage(1);
  };

  const handleFiltersChange = (newFilters: FeedbackFilters) => {
    setFilters(newFilters);
    // Reset to first page when filters change
    setPage(1);
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

  // Handle page change - warn about selection across pages
  const handlePageChange = (newPage: number) => {
    if (selectedIds.length > 0) {
      // Clear selection when changing pages to avoid confusion
      setSelectedIds([]);
      toast({
        title: 'Selection cleared',
        description: 'Selection was cleared when changing pages',
      });
    }
    setPage(newPage);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Feedback</h2>
          <p className="text-muted-foreground">
            {project?.name || 'Loading...'} - All feedback submissions
          </p>
        </div>
      </div>

      {/* Filters */}
      <FeedbackFiltersComponent
        filters={filters}
        onChange={handleFiltersChange}
      />

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
          <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No feedback yet</h3>
          <p className="text-muted-foreground">
            Feedback will appear here once users submit it through the widget.
          </p>
        </div>
      ) : (
        <>
          <FeedbackTable
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
            <div className="flex items-center justify-between">
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
    </div>
  );
}
