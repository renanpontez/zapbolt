'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Rocket, Globe } from 'lucide-react';
import { useCreateProject } from '@/hooks/useProjects';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const projectSchema = z.object({
  name: z.string().min(2, 'Project name must be at least 2 characters'),
  domain: z.string().min(1, 'Website URL is required'),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface OnboardingWizardProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingWizard({ open, onComplete }: OnboardingWizardProps) {
  const router = useRouter();
  const createProject = useCreateProject();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      name: '',
      domain: '',
    },
  });

  const onSubmit = async (data: ProjectFormData) => {
    setError(null);

    try {
      const project = await createProject.mutateAsync({
        name: data.name,
        domain: data.domain,
      });

      // Close the wizard
      onComplete();

      // Redirect to project settings page to show installation instructions
      router.push(`/projects/${project.id}/settings`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create project');
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="text-center sm:text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Rocket className="h-6 w-6 text-primary" />
          </div>
          <DialogTitle className="text-xl">Welcome to Zapbolt!</DialogTitle>
          <DialogDescription>
            Let&apos;s create your first project to start collecting feedback.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-4">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">Project Name</Label>
            <Input
              id="name"
              placeholder="My Website"
              {...register('name')}
              disabled={isSubmitting}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Website URL
            </Label>
            <Input
              id="domain"
              placeholder="https://example.com"
              {...register('domain')}
              disabled={isSubmitting}
            />
            <p className="text-xs text-muted-foreground">
              The website where you&apos;ll install the feedback widget
            </p>
            {errors.domain && (
              <p className="text-sm text-destructive">{errors.domain.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2 pt-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating Project...
                </>
              ) : (
                'Create Project'
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              You&apos;ll get installation instructions on the next page
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
