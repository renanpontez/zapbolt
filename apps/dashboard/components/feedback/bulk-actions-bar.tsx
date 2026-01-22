'use client';

import { Trash2, X, Loader2 } from 'lucide-react';
import type { FeedbackStatus } from '@zapbolt/shared';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BulkActionsBarProps {
  selectedCount: number;
  onStatusChange: (status: FeedbackStatus) => void;
  onDelete: () => void;
  onClearSelection: () => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

export function BulkActionsBar({
  selectedCount,
  onStatusChange,
  onDelete,
  onClearSelection,
  isUpdating = false,
  isDeleting = false,
}: BulkActionsBarProps) {
  const isDisabled = isUpdating || isDeleting;

  return (
    <div className="sticky top-0 z-10 flex items-center justify-between gap-4 rounded-lg bg-indigo-600 px-4 py-3 text-white shadow-lg">
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium">
          {selectedCount} {selectedCount === 1 ? 'item' : 'items'} selected
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="text-white hover:bg-indigo-700 hover:text-white"
          disabled={isDisabled}
        >
          <X className="mr-1 h-4 w-4" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <Select
          onValueChange={(value) => onStatusChange(value as FeedbackStatus)}
          disabled={isDisabled}
        >
          <SelectTrigger className="w-[160px] bg-indigo-700 border-indigo-500 text-white hover:bg-indigo-800 focus:ring-indigo-400">
            <SelectValue placeholder="Change status" />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          disabled={isDisabled}
          className="text-white hover:bg-red-600 hover:text-white"
        >
          {isDeleting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="mr-2 h-4 w-4" />
          )}
          Delete
        </Button>
      </div>
    </div>
  );
}
