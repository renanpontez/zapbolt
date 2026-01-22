'use client';

import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, FolderKanban, TrendingUp, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useDashboardStats, type DashboardStats } from '@/hooks/useDashboardStats';
import { useAllFeedback, type FeedbackWithProject } from '@/hooks/useFeedback';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: number;
}

function StatCard({ title, value, description, icon: Icon, trend }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {trend !== undefined && trend !== 0 && (
            <span
              className={cn(
                'text-xs font-medium',
                trend > 0 ? 'text-green-600' : 'text-red-600'
              )}
            >
              {trend > 0 ? '+' : ''}{trend}%
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function StatsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function StatsError({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm font-medium">Failed to load statistics</span>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

interface DashboardStatsDisplayProps {
  stats: DashboardStats;
}

function DashboardStatsDisplay({ stats }: DashboardStatsDisplayProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Total Feedback"
        value={stats.totalFeedback.toString()}
        description="All time feedback received"
        icon={MessageSquare}
        trend={stats.recentTrend}
      />
      <StatCard
        title="New Feedback"
        value={stats.newFeedback.toString()}
        description="Awaiting review"
        icon={TrendingUp}
      />
      <StatCard
        title="Active Projects"
        value={stats.activeProjects.toString()}
        description={`${stats.totalProjects} total project${stats.totalProjects !== 1 ? 's' : ''}`}
        icon={FolderKanban}
      />
      <StatCard
        title="Open Issues"
        value={(stats.feedbackByStatus['in_progress'] || 0).toString()}
        description="Feedback in progress"
        icon={Clock}
      />
    </div>
  );
}

function RecentFeedbackLoading() {
  return (
    <div className="space-y-4">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-3 rounded-lg border">
          <Skeleton className="h-8 w-8 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full shrink-0" />
        </div>
      ))}
    </div>
  );
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'new':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    case 'resolved':
      return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    case 'closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

interface RecentFeedbackListProps {
  feedback: FeedbackWithProject[];
}

function RecentFeedbackList({ feedback }: RecentFeedbackListProps) {
  if (feedback.length === 0) {
    return (
      <div className="py-8 text-center">
        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
        <p className="text-sm text-muted-foreground">
          No feedback yet. Install the widget on your site to start collecting feedback.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {feedback.map((item) => (
        <Link
          key={item.id}
          href={`/feedback/${item.id}`}
          className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors group"
        >
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <MessageSquare className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {item.message}
            </p>
            <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground">
              <span className="truncate">{item.projectName}</span>
              <span>-</span>
              <span className="shrink-0">
                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
              </span>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={cn('shrink-0 capitalize', getStatusColor(item.status))}
          >
            {item.status.replace('_', ' ')}
          </Badge>
        </Link>
      ))}
      <Link
        href="/feedback"
        className="flex items-center justify-center gap-1 py-2 text-sm text-primary hover:underline"
      >
        View all feedback
        <ArrowUpRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

export default function DashboardPage() {
  const {
    data: stats,
    isLoading: statsLoading,
    error: statsError,
  } = useDashboardStats();

  const {
    data: feedbackData,
    isLoading: feedbackLoading,
    error: feedbackError,
  } = useAllFeedback({ pageSize: 5 });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Overview of your feedback and projects
        </p>
      </div>

      {/* Stats Section */}
      {statsLoading ? (
        <StatsLoading />
      ) : statsError ? (
        <StatsError message={statsError.message} />
      ) : stats ? (
        <DashboardStatsDisplay stats={stats} />
      ) : null}

      {/* Content Grid */}
      <div className="grid gap-4 lg:grid-cols-7">
        {/* Recent Feedback */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Feedback</CardTitle>
            <CardDescription>Latest feedback from your projects</CardDescription>
          </CardHeader>
          <CardContent>
            {feedbackLoading ? (
              <RecentFeedbackLoading />
            ) : feedbackError ? (
              <div className="py-4 text-center text-sm text-destructive">
                Failed to load recent feedback
              </div>
            ) : (
              <RecentFeedbackList feedback={feedbackData?.items || []} />
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start"
              asChild
            >
              <Link href="/projects">
                <FolderKanban className="mr-2 h-4 w-4" />
                Create new project
              </Link>
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start"
              asChild
            >
              <Link href="/feedback">
                <MessageSquare className="mr-2 h-4 w-4" />
                View all feedback
              </Link>
            </Button>
          </CardContent>

          {/* Stats Breakdown */}
          {stats && (stats.totalFeedback > 0) && (
            <>
              <CardHeader className="pt-0">
                <CardTitle className="text-base">Feedback by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.feedbackByStatus).map(([status, count]) => (
                    <div key={status} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-muted-foreground">
                        {status.replace('_', ' ')}
                      </span>
                      <Badge variant="secondary" className={getStatusColor(status)}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </>
          )}

          {/* Category Breakdown */}
          {stats && Object.keys(stats.feedbackByCategory).length > 0 && (
            <>
              <CardHeader className="pt-0">
                <CardTitle className="text-base">Feedback by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries(stats.feedbackByCategory).map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between text-sm">
                      <span className="capitalize text-muted-foreground">{category}</span>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
