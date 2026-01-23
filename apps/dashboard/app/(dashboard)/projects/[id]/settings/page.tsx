'use client';

import { use, useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, RefreshCw, Trash2, Code, Palette, Globe, Save, X } from 'lucide-react';

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
import { ProjectMembers } from '@/components/projects/project-members';
import { copyToClipboard } from '@/lib/utils';

interface ProjectSettingsPageProps {
  params: Promise<{ id: string }>;
}

const projectSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  domain: z.string().min(1, 'Domain is required'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface LocalWidgetConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor: string;
  [key: string]: unknown;
}

export default function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const { id } = use(params);
  const router = useRouter();

  const { data: project, isLoading } = useProject(id);
  const updateProject = useUpdateProject(id);
  const deleteProject = useDeleteProject();
  const regenerateApiKey = useRegenerateApiKey(id);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // Local state for widget config (to avoid saving on every change)
  const [localWidgetConfig, setLocalWidgetConfig] = useState<LocalWidgetConfig | null>(null);
  const [localIsActive, setLocalIsActive] = useState<boolean | null>(null);

  // Initialize local state when project loads
  useEffect(() => {
    if (project) {
      setLocalWidgetConfig({
        position: project.widgetConfig.position,
        primaryColor: project.widgetConfig.primaryColor,
      });
      setLocalIsActive(project.isActive);
    }
  }, [project]);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    values: project
      ? { name: project.name, domain: project.domain }
      : undefined,
  });

  // Check if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    if (!project || !localWidgetConfig) return false;

    const configChanged =
      localWidgetConfig.position !== project.widgetConfig.position ||
      localWidgetConfig.primaryColor !== project.widgetConfig.primaryColor;

    const activeChanged = localIsActive !== project.isActive;

    const formChanged = form.formState.isDirty;

    return configChanged || activeChanged || formChanged;
  }, [project, localWidgetConfig, localIsActive, form.formState.isDirty]);

  const handleSaveAll = async () => {
    const formData = form.getValues();
    const formValid = await form.trigger();

    if (!formValid || !project) return;

    await updateProject.mutateAsync({
      name: formData.name,
      domain: formData.domain,
      isActive: localIsActive ?? project.isActive,
      widgetConfig: localWidgetConfig
        ? { ...project.widgetConfig, ...localWidgetConfig }
        : project.widgetConfig,
    });

    // Reset form dirty state
    form.reset(formData);
  };

  const handleDiscardChanges = () => {
    if (project) {
      setLocalWidgetConfig({
        position: project.widgetConfig.position,
        primaryColor: project.widgetConfig.primaryColor,
      });
      setLocalIsActive(project.isActive);
      form.reset({ name: project.name, domain: project.domain });
    }
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

  const handleToggleActive = (checked: boolean) => {
    setLocalIsActive(checked);
  };

  const handlePositionChange = (position: string) => {
    if (localWidgetConfig) {
      setLocalWidgetConfig({
        ...localWidgetConfig,
        position: position as LocalWidgetConfig['position'],
      });
    }
  };

  const handleColorChange = (color: string) => {
    if (localWidgetConfig) {
      setLocalWidgetConfig({
        ...localWidgetConfig,
        primaryColor: color,
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
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/projects/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Project Settings</h2>
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
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name</Label>
              <Input
                id="name"
                {...form.register('name')}
                disabled={project.currentUserRole !== 'admin'}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="domain">Domain</Label>
              <Input
                id="domain"
                {...form.register('domain')}
                disabled={project.currentUserRole !== 'admin'}
              />
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
                checked={localIsActive ?? project.isActive}
                onCheckedChange={handleToggleActive}
                disabled={project.currentUserRole !== 'admin'}
              />
            </div>
            {project.currentUserRole !== 'admin' && (
              <p className="text-xs text-muted-foreground">
                Only project admins can edit these settings.
              </p>
            )}
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
                value={localWidgetConfig?.position ?? project.widgetConfig.position}
                onValueChange={handlePositionChange}
                disabled={project.currentUserRole !== 'admin'}
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
                  value={localWidgetConfig?.primaryColor ?? project.widgetConfig.primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-12 h-9 p-1 cursor-pointer"
                  disabled={project.currentUserRole !== 'admin'}
                />
                <Input
                  value={localWidgetConfig?.primaryColor ?? project.widgetConfig.primaryColor}
                  onChange={(e) => handleColorChange(e.target.value)}
                  className="w-32 font-mono"
                  placeholder="#3b82f6"
                  disabled={project.currentUserRole !== 'admin'}
                />
                {/* Color preview */}
                <div
                  className="w-9 h-9 rounded-md border shadow-sm"
                  style={{ backgroundColor: localWidgetConfig?.primaryColor ?? project.widgetConfig.primaryColor }}
                />
              </div>
            </div>
            {project.currentUserRole !== 'admin' && (
              <p className="text-xs text-muted-foreground">
                Only project admins can customize the widget appearance.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Team Members */}
        <ProjectMembers projectId={id} />

        {/* API Key - Admin only */}
        {project.currentUserRole === 'admin' && (
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
        )}

        {/* Danger Zone - Admin only */}
        {project.currentUserRole === 'admin' && (
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
        )}
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

      {/* Floating Save Bar */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex items-center justify-between gap-4 py-4 px-4 md:px-6 max-w-4xl mx-auto">
            <p className="text-sm text-muted-foreground">
              You have unsaved changes
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDiscardChanges}
                disabled={updateProject.isPending}
              >
                <X className="mr-2 h-4 w-4" />
                Discard
              </Button>
              <Button
                size="sm"
                onClick={handleSaveAll}
                disabled={updateProject.isPending}
              >
                {updateProject.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
