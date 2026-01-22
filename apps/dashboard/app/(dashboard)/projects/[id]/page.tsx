'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, MessageSquare, Code } from 'lucide-react';

import { useProject, useProjectStats } from '@/hooks/useProjects';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScriptTagCopy } from '@/components/projects/script-tag-copy';
import { formatDate } from '@/lib/utils';

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

function StatsLoading() {
  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { id } = use(params);
  const { data: project, isLoading: projectLoading } = useProject(id);
  const { data: stats, isLoading: statsLoading } = useProjectStats(id);

  if (projectLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
        <StatsLoading />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Project not found</p>
        <Button asChild className="mt-4">
          <Link href="/projects">Back to Projects</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button variant="ghost" size="icon" asChild className="w-fit">
          <Link href="/projects">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <h2 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{project.name}</h2>
            <Badge variant={project.isActive ? 'success' : 'secondary'}>
              {project.isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <p className="truncate text-muted-foreground">{project.domain}</p>
        </div>
        <Button asChild className="w-fit">
          <Link href={`/projects/${id}/settings`}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Link>
        </Button>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <StatsLoading />
      ) : stats ? (
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalFeedback}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                New
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.byStatus?.new || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                In Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.byStatus?.in_progress || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Resolved
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.byStatus?.resolved || 0}</div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Installation
            </CardTitle>
            <CardDescription>Add the widget to your website</CardDescription>
          </CardHeader>
          <CardContent>
            <ScriptTagCopy projectId={project.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recent Feedback
            </CardTitle>
            <CardDescription>Latest feedback from this project</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-4 text-sm text-muted-foreground">
              No feedback yet
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href={`/projects/${id}/feedback`}>View All Feedback</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Project Info */}
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Project ID</p>
              <p className="font-mono text-sm">{project.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Created</p>
              <p className="text-sm">{formatDate(project.createdAt)}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Tier</p>
              <Badge variant="outline">{project.tier}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Monthly Feedback</p>
              <p className="text-sm">{project.monthlyFeedbackCount} this month</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
