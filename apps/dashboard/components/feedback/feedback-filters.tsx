'use client';

import { useState } from 'react';
import { Search, X, ChevronDown, CalendarIcon } from 'lucide-react';
import type {
  FeedbackStatus,
  FeedbackCategory,
  FeedbackPriority,
  FeedbackFilters,
} from '@zapbolt/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface FeedbackFiltersProps {
  filters: FeedbackFilters;
  onChange: (filters: FeedbackFilters) => void;
}

interface FilterOption<T extends string> {
  value: T;
  label: string;
}

const statusOptions: FilterOption<FeedbackStatus>[] = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
  { value: 'archived', label: 'Archived' },
];

const categoryOptions: FilterOption<FeedbackCategory>[] = [
  { value: 'bug', label: 'Bug' },
  { value: 'feature', label: 'Feature' },
  { value: 'improvement', label: 'Improvement' },
  { value: 'question', label: 'Question' },
  { value: 'other', label: 'Other' },
];

const priorityOptions: FilterOption<FeedbackPriority>[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

type DatePreset = 'last7days' | 'last30days' | 'last90days' | 'custom';

interface DatePresetOption {
  value: DatePreset;
  label: string;
  getDates: () => { startDate: string; endDate: string };
}

const datePresets: DatePresetOption[] = [
  {
    value: 'last7days',
    label: 'Last 7 days',
    getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 7);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    },
  },
  {
    value: 'last30days',
    label: 'Last 30 days',
    getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 30);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    },
  },
  {
    value: 'last90days',
    label: 'Last 90 days',
    getDates: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - 90);
      return {
        startDate: start.toISOString().split('T')[0],
        endDate: end.toISOString().split('T')[0],
      };
    },
  },
];

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

interface MultiSelectFilterProps<T extends string> {
  label: string;
  options: FilterOption<T>[];
  selected: T[];
  onChange: (selected: T[]) => void;
}

function MultiSelectFilter<T extends string>({
  label,
  options,
  selected,
  onChange,
}: MultiSelectFilterProps<T>) {
  const [open, setOpen] = useState(false);

  const handleToggle = (value: T) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  const handleClearAll = () => {
    onChange([]);
    setOpen(false);
  };

  const displayLabel =
    selected.length > 0 ? `${label} (${selected.length})` : label;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-[140px] justify-between',
            selected.length > 0 && 'border-primary'
          )}
        >
          <span className="truncate">{displayLabel}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0" align="start">
        <div className="p-2 space-y-1">
          {options.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 p-2 rounded-md cursor-pointer hover:bg-accent"
            >
              <Checkbox
                checked={selected.includes(option.value)}
                onCheckedChange={() => handleToggle(option.value)}
                aria-label={`Filter by ${option.label}`}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
        {selected.length > 0 && (
          <div className="border-t p-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-muted-foreground"
              onClick={handleClearAll}
            >
              Clear selection
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface DateRangeFilterProps {
  startDate?: string;
  endDate?: string;
  onChange: (startDate?: string, endDate?: string) => void;
}

function DateRangeFilter({ startDate, endDate, onChange }: DateRangeFilterProps) {
  const [open, setOpen] = useState(false);
  const [showCustom, setShowCustom] = useState(false);
  const [customStart, setCustomStart] = useState<Date | undefined>(
    startDate ? new Date(startDate) : undefined
  );
  const [customEnd, setCustomEnd] = useState<Date | undefined>(
    endDate ? new Date(endDate) : undefined
  );

  const hasDateFilter = startDate || endDate;

  const handlePresetSelect = (preset: DatePresetOption) => {
    const { startDate: start, endDate: end } = preset.getDates();
    onChange(start, end);
    setShowCustom(false);
    setOpen(false);
  };

  const handleCustomApply = () => {
    if (customStart && customEnd) {
      onChange(
        customStart.toISOString().split('T')[0],
        customEnd.toISOString().split('T')[0]
      );
      setOpen(false);
    }
  };

  const handleClear = () => {
    onChange(undefined, undefined);
    setCustomStart(undefined);
    setCustomEnd(undefined);
    setShowCustom(false);
    setOpen(false);
  };

  const getDisplayLabel = () => {
    if (!startDate && !endDate) return 'Date range';
    if (startDate && endDate) {
      return `${formatDate(startDate)} - ${formatDate(endDate)}`;
    }
    if (startDate) return `From ${formatDate(startDate)}`;
    if (endDate) return `Until ${formatDate(endDate)}`;
    return 'Date range';
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn(
            'w-auto min-w-[140px] justify-between',
            hasDateFilter && 'border-primary'
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          <span className="truncate text-sm">{getDisplayLabel()}</span>
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {!showCustom ? (
          <div className="p-2 space-y-1">
            {datePresets.map((preset) => (
              <Button
                key={preset.value}
                variant="ghost"
                className="w-full justify-start"
                onClick={() => handlePresetSelect(preset)}
              >
                {preset.label}
              </Button>
            ))}
            <Button
              variant="ghost"
              className="w-full justify-start"
              onClick={() => setShowCustom(true)}
            >
              Custom range...
            </Button>
            {hasDateFilter && (
              <div className="border-t pt-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-center text-muted-foreground"
                  onClick={handleClear}
                >
                  Clear dates
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="p-2">
            <div className="flex items-center gap-2 mb-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCustom(false)}
              >
                <ChevronDown className="h-4 w-4 rotate-90" />
                Back
              </Button>
              <span className="text-sm font-medium">Custom range</span>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Start date</p>
                <Calendar
                  selected={customStart}
                  onSelect={setCustomStart}
                  disabled={(date) => (customEnd ? date > customEnd : false)}
                />
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">End date</p>
                <Calendar
                  selected={customEnd}
                  onSelect={setCustomEnd}
                  disabled={(date) =>
                    (customStart ? date < customStart : false) || date > new Date()
                  }
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustom(false)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleCustomApply}
                disabled={!customStart || !customEnd}
              >
                Apply
              </Button>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}

interface ActiveFilterBadge {
  type: 'status' | 'category' | 'priority' | 'date';
  value: string;
  label: string;
}

export function FeedbackFiltersComponent({
  filters,
  onChange,
}: FeedbackFiltersProps) {
  const hasFilters =
    filters.search ||
    (filters.status?.length ?? 0) > 0 ||
    (filters.category?.length ?? 0) > 0 ||
    (filters.priority?.length ?? 0) > 0 ||
    filters.startDate ||
    filters.endDate;

  const clearFilters = () => {
    onChange({});
  };

  // Build active filter badges
  const activeFilters: ActiveFilterBadge[] = [];

  filters.status?.forEach((status) => {
    const option = statusOptions.find((o) => o.value === status);
    if (option) {
      activeFilters.push({
        type: 'status',
        value: status,
        label: `Status: ${option.label}`,
      });
    }
  });

  filters.category?.forEach((category) => {
    const option = categoryOptions.find((o) => o.value === category);
    if (option) {
      activeFilters.push({
        type: 'category',
        value: category,
        label: `Category: ${option.label}`,
      });
    }
  });

  filters.priority?.forEach((priority) => {
    const option = priorityOptions.find((o) => o.value === priority);
    if (option) {
      activeFilters.push({
        type: 'priority',
        value: priority,
        label: `Priority: ${option.label}`,
      });
    }
  });

  if (filters.startDate || filters.endDate) {
    let dateLabel = 'Date: ';
    if (filters.startDate && filters.endDate) {
      dateLabel += `${formatDate(filters.startDate)} - ${formatDate(filters.endDate)}`;
    } else if (filters.startDate) {
      dateLabel += `From ${formatDate(filters.startDate)}`;
    } else if (filters.endDate) {
      dateLabel += `Until ${formatDate(filters.endDate)}`;
    }
    activeFilters.push({
      type: 'date',
      value: 'date',
      label: dateLabel,
    });
  }

  const removeFilter = (badge: ActiveFilterBadge) => {
    switch (badge.type) {
      case 'status':
        onChange({
          ...filters,
          status: filters.status?.filter((s) => s !== badge.value),
        });
        break;
      case 'category':
        onChange({
          ...filters,
          category: filters.category?.filter((c) => c !== badge.value),
        });
        break;
      case 'priority':
        onChange({
          ...filters,
          priority: filters.priority?.filter((p) => p !== badge.value),
        });
        break;
      case 'date':
        onChange({
          ...filters,
          startDate: undefined,
          endDate: undefined,
        });
        break;
    }
  };

  return (
    <div className="space-y-3">
      {/* Filter Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search feedback..."
            value={filters.search || ''}
            onChange={(e) =>
              onChange({ ...filters, search: e.target.value || undefined })
            }
            className="pl-9"
            aria-label="Search feedback"
          />
        </div>

        {/* Status Multi-Select */}
        <MultiSelectFilter
          label="Status"
          options={statusOptions}
          selected={filters.status || []}
          onChange={(selected) =>
            onChange({
              ...filters,
              status: selected.length > 0 ? selected : undefined,
            })
          }
        />

        {/* Category Multi-Select */}
        <MultiSelectFilter
          label="Category"
          options={categoryOptions}
          selected={filters.category || []}
          onChange={(selected) =>
            onChange({
              ...filters,
              category: selected.length > 0 ? selected : undefined,
            })
          }
        />

        {/* Priority Multi-Select */}
        <MultiSelectFilter
          label="Priority"
          options={priorityOptions}
          selected={filters.priority || []}
          onChange={(selected) =>
            onChange({
              ...filters,
              priority: selected.length > 0 ? selected : undefined,
            })
          }
        />

        {/* Date Range Filter */}
        <DateRangeFilter
          startDate={filters.startDate}
          endDate={filters.endDate}
          onChange={(startDate, endDate) =>
            onChange({
              ...filters,
              startDate,
              endDate,
            })
          }
        />

        {/* Clear All Filters */}
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-1" />
            Clear all
          </Button>
        )}
      </div>

      {/* Active Filters Badges */}
      {activeFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {activeFilters.map((badge, index) => (
            <Badge
              key={`${badge.type}-${badge.value}-${index}`}
              variant="secondary"
              className="gap-1 pr-1"
            >
              {badge.label}
              <button
                type="button"
                onClick={() => removeFilter(badge)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
                aria-label={`Remove ${badge.label} filter`}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
