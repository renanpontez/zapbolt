'use client';

import { use, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, RefreshCw, Trash2, Code, Palette, Globe } from 'lucide-react';

import { useProject, useUpdateProject, useDeleteProject, useRegenerateApiKey } from '@/hooks/useProjects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { ScriptTagCopy } from '@/components/projects/script-tag-copy';
import { copyToClipboard } from '@/lib/utils';

interface ProjectSettingsPageProps {
  params: Promise<{ id: string }>;
}

const projectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  domain: z.string().min(1, 'Domain is required'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

export default function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject(id);
  const deleteProject = useDeleteProject();
  const regenerateApiKey = useRegenerateApiKey(id);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    values: project
      ? { name: project.name, domain: project.domain }
      : undefined,
  });

  const handleSave = async (data: ProjectFormData) => {
    await updateProject.mutateAsync(data);
  };

  const handleDelete = async () => {
    await deleteProject.mutateAsync(id);
    router.push('/projects');
  };

  const handleRegenerateKey = async () => {
    await regenerateApiKey.mutateAsync();
  };

  const handleCopyApiKey = async () => {
    if (project?.apiKey) {
      await copyToClipboard(project.apiKey);
      setApiKeyCopied(true);
      setTimeout(() => setApiKeyCopied(false), 2000);
    }
  };

  const handleToggleActive = async () => {
    if (project) {
      await updateProject.mutateAsync({ isActive: !project.isActive });
    }
  };

  const handlePositionChange = async (position: string) => {
    if (project) {
      await updateProject.mutateAsync({
        widgetConfig: { ...project.widgetConfig, position: position as any },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
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
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Project Settings</h2>
          <p className="text-muted-foreground">{project.name}</p>
        </div>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* General Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              General
            </CardTitle>
            <CardDescription>Basic project settings</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input id="name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input id="domain" {...form.register('domain')} />
                {form.formState.errors.domain && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.domain.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Active</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable or disable the widget on your site
                  </p>
                </div>
                <Switch
                  checked={project.isActive}
                  onCheckedChange={handleToggleActive}
                  disabled={updateProject.isPending}
                />
              </div>

              <Button type="submit" disabled={updateProject.isPending}>
                {updateProject.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Installation */}
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

        {/* Widget Customization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Widget Appearance
            </CardTitle>
            <CardDescription>Customize how the widget looks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Button Position</Label>
              <Select
                value={project.widgetConfig.position}
                onValueChange={handlePositionChange}
                disabled={updateProject.isPending}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bottom-right">Bottom Right</SelectItem>
                  <SelectItem value="bottom-left">Bottom Left</SelectItem>
                  <SelectItem value="top-right">Top Right</SelectItem>
                  <SelectItem value="top-left">Top Left</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primaryColor">Primary Color</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="primaryColor"
                  type="color"
                  value={project.widgetConfig.primaryColor}
                  onChange={(e) =>
                    updateProject.mutate({
                      widgetConfig: { ...project.widgetConfig, primaryColor: e.target.value },
                    })
                  }
                  className="w-12 h-9 p-1"
                />
                <Input
                  value={project.widgetConfig.primaryColor}
                  onChange={(e) =>
                    updateProject.mutate({
                      widgetConfig: { ...project.widgetConfig, primaryColor: e.target.value },
                    })
                  }
                  className="w-32"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API Key */}
        <Card>
          <CardHeader>
            <CardTitle>API Key</CardTitle>
            <CardDescription>
              Your project API key for server-side integrations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              <Input
                value={project.apiKey}
                readOnly
                className="font-mono"
              />
              <Button variant="outline" onClick={handleCopyApiKey}>
                {apiKeyCopied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <Button
              variant="outline"
              onClick={handleRegenerateKey}
              disabled={regenerateApiKey.isPending}
            >
              {regenerateApiKey.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Regenerate Key
            </Button>
            <p className="text-xs text-muted-foreground">
              Regenerating the key will invalidate the current key immediately.
            </p>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible and destructive actions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Project
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{project.name}&quot;? This action cannot
              be undone. All feedback associated with this project will be permanently
              deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteProject.isPending}
            >
              {deleteProject.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
