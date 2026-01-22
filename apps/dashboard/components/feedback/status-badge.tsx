import type { FeedbackStatus, FeedbackPriority, FeedbackCategory } from '@zapbolt/shared';
import { Badge, type BadgeProps } from '@/components/ui/badge';

const statusConfig: Record<FeedbackStatus, { label: string; variant: BadgeProps['variant'] }> = {
  new: { label: 'New', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'warning' },
  resolved: { label: 'Resolved', variant: 'success' },
  closed: { label: 'Closed', variant: 'secondary' },
  archived: { label: 'Archived', variant: 'outline' },
};

const priorityConfig: Record<FeedbackPriority, { label: string; variant: BadgeProps['variant'] }> = {
  low: { label: 'Low', variant: 'outline' },
  medium: { label: 'Medium', variant: 'secondary' },
  high: { label: 'High', variant: 'warning' },
  critical: { label: 'Critical', variant: 'destructive' },
};

const categoryConfig: Record<FeedbackCategory, { label: string; variant: BadgeProps['variant'] }> = {
  bug: { label: 'Bug', variant: 'destructive' },
  feature: { label: 'Feature', variant: 'default' },
  improvement: { label: 'Improvement', variant: 'info' },
  question: { label: 'Question', variant: 'secondary' },
  other: { label: 'Other', variant: 'outline' },
};

interface StatusBadgeProps {
  status: FeedbackStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

interface PriorityBadgeProps {
  priority: FeedbackPriority;
}

export function PriorityBadge({ priority }: PriorityBadgeProps) {
  const config = priorityConfig[priority];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}

interface CategoryBadgeProps {
  category: FeedbackCategory;
}

export function CategoryBadge({ category }: CategoryBadgeProps) {
  const config = categoryConfig[category];
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
