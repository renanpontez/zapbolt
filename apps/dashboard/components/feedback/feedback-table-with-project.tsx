'use client';

import Link from 'next/link';
import {
  MoreHorizontal,
  ExternalLink,
  Trash2,
  Image,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Minus,
  FolderKanban,
} from 'lucide-react';
import type { FeedbackWithProject } from '@/hooks/useFeedback';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { StatusBadge, PriorityBadge, CategoryBadge } from './status-badge';
import { formatRelativeTime, truncate, cn } from '@/lib/utils';

export type SortColumn = 'created_at' | 'status' | 'priority' | 'category';
export type SortOrder = 'asc' | 'desc';

interface FeedbackTableWithProjectProps {
  feedback: FeedbackWithProject[];
  onDelete?: (id: string) => void;
  sortColumn?: SortColumn;
  sortOrder?: SortOrder;
  onSortChange?: (column: SortColumn, order: SortOrder) => void;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
}

interface SortableHeaderProps {
  column: SortColumn;
  label: string;
  currentColumn?: SortColumn;
  currentOrder?: SortOrder;
  onSort?: (column: SortColumn, order: SortOrder) => void;
}

function SortableHeader({
  column,
  label,
  currentColumn,
  currentOrder,
  onSort,
}: SortableHeaderProps) {
  const isActive = currentColumn === column;

  const handleClick = () => {
    if (!onSort) return;

    const newOrder: SortOrder =
      isActive && currentOrder === 'desc' ? 'asc' : 'desc';
    onSort(column, newOrder);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'flex items-center gap-1 h-10 px-4 text-left text-sm font-medium transition-colors hover:text-foreground',
        isActive ? 'text-foreground' : 'text-muted-foreground'
      )}
      aria-label={`Sort by ${label}`}
      aria-sort={isActive ? (currentOrder === 'asc' ? 'ascending' : 'descending') : 'none'}
    >
      {label}
      {isActive ? (
        currentOrder === 'asc' ? (
          <ArrowUp className="h-4 w-4" />
        ) : (
          <ArrowDown className="h-4 w-4" />
        )
      ) : (
        <ArrowUpDown className="h-4 w-4 opacity-50" />
      )}
    </button>
  );
}

export function FeedbackTableWithProject({
  feedback,
  onDelete,
  sortColumn,
  sortOrder,
  onSortChange,
  selectedIds = [],
  onSelectionChange,
}: FeedbackTableWithProjectProps) {
  const allSelected = feedback.length > 0 && feedback.every((item) => selectedIds.includes(item.id));
  const someSelected = feedback.some((item) => selectedIds.includes(item.id)) && !allSelected;

  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      const currentPageIds = feedback.map((item) => item.id);
      const newSelection = [...new Set([...selectedIds, ...currentPageIds])];
      onSelectionChange(newSelection);
    } else {
      const currentPageIds = new Set(feedback.map((item) => item.id));
      const newSelection = selectedIds.filter((id) => !currentPageIds.has(id));
      onSelectionChange(newSelection);
    }
  };

  const handleSelectRow = (id: string, checked: boolean) => {
    if (!onSelectionChange) return;

    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  return (
    <div className="rounded-md border">
      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b bg-muted/50">
              {onSelectionChange && (
                <th className="h-10 w-[50px] px-4">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={allSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label={allSelected ? 'Deselect all' : 'Select all'}
                      className={someSelected ? 'data-[state=checked]:bg-primary' : ''}
                    />
                    {someSelected && (
                      <Minus className="absolute h-3 w-3 text-primary pointer-events-none" />
                    )}
                  </div>
                </th>
              )}
              <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">
                Message
              </th>
              <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground">
                Project
              </th>
              <th className="text-left">
                <SortableHeader
                  column="category"
                  label="Category"
                  currentColumn={sortColumn}
                  currentOrder={sortOrder}
                  onSort={onSortChange}
                />
              </th>
              <th className="text-left">
                <SortableHeader
                  column="status"
                  label="Status"
                  currentColumn={sortColumn}
                  currentOrder={sortOrder}
                  onSort={onSortChange}
                />
              </th>
              <th className="text-left">
                <SortableHeader
                  column="priority"
                  label="Priority"
                  currentColumn={sortColumn}
                  currentOrder={sortOrder}
                  onSort={onSortChange}
                />
              </th>
              <th className="text-left">
                <SortableHeader
                  column="created_at"
                  label="Date"
                  currentColumn={sortColumn}
                  currentOrder={sortOrder}
                  onSort={onSortChange}
                />
              </th>
              <th className="h-10 px-4 text-left text-sm font-medium text-muted-foreground w-[50px]">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {feedback.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <tr
                  key={item.id}
                  className={cn(
                    'border-b hover:bg-muted/50 transition-colors',
                    isSelected && 'bg-indigo-50 dark:bg-indigo-950/30'
                  )}
                >
                  {onSelectionChange && (
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) =>
                            handleSelectRow(item.id, checked === true)
                          }
                          aria-label={`Select feedback ${item.id}`}
                        />
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3">
                    <Link
                      href={`/feedback/${item.id}`}
                      className="hover:text-primary transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {truncate(item.message, 50)}
                        </span>
                        {item.screenshotUrl && (
                          <Image className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      {item.email && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {item.email}
                        </p>
                      )}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/projects/${item.projectId}`}
                      className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      <FolderKanban className="h-3.5 w-3.5" />
                      <span className="truncate max-w-[120px]">{item.projectName}</span>
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <CategoryBadge category={item.category} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={item.priority} />
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {formatRelativeTime(item.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/feedback/${item.id}`}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            View Details
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/projects/${item.projectId}`}>
                            <FolderKanban className="mr-2 h-4 w-4" />
                            View Project
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onDelete?.(item.id)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
