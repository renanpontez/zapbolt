'use client';

import Link from 'next/link';
import { Globe, Loader2, MessageSquare, MoreVertical, Settings, Trash2 } from 'lucide-react';
import type { Project } from '@zapbolt/shared';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn, formatRelativeTime } from '@/lib/utils';

interface ProjectCardProps {
  project: Project;
  onDelete?: (id: string) => void;
}

export function ProjectCard({ project, onDelete }: ProjectCardProps) {
  // Check if this is an optimistic (pending) project
  const isPending = project.id.startsWith('temp-');

  return (
    <Card
      className={cn(
        'transition-all duration-200',
        isPending
          ? 'opacity-70 border-dashed animate-pulse'
          : 'hover:shadow-md'
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <span className="text-muted-foreground">{project.name}</span>
            </>
          ) : (
            <Link
              href={`/projects/${project.id}`}
              className="hover:text-primary transition-colors"
            >
              {project.name}
            </Link>
          )}
        </CardTitle>
        {!isPending && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href={`/projects/${project.id}/settings`}>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(project.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3">
          <Globe className="h-4 w-4" />
          <span>{project.domain}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              <span>{project.feedbackCount} feedback</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isPending ? (
              <Badge variant="secondary">Creating...</Badge>
            ) : (
              <Badge variant={project.isActive ? 'success' : 'secondary'}>
                {project.isActive ? 'Active' : 'Inactive'}
              </Badge>
            )}
          </div>
        </div>

        <p className="text-xs text-muted-foreground mt-3">
          {isPending ? 'Creating project...' : `Created ${formatRelativeTime(project.createdAt)}`}
        </p>
      </CardContent>
    </Card>
  );
}
