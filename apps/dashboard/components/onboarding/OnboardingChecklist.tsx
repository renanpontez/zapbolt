'use client';

import Link from 'next/link';
import { Check, Circle, FolderPlus, Code, MessageSquare, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface OnboardingChecklistProps {
  totalProjects: number;
  activeProjects: number;
  totalFeedback: number;
}

export function OnboardingChecklist({
  totalProjects,
  activeProjects,
  totalFeedback,
}: OnboardingChecklistProps) {
  const steps: ChecklistStep[] = [
    {
      id: 'project',
      title: 'Create your first project',
      description: 'Set up a project to start collecting feedback',
      completed: totalProjects > 0,
      href: '/projects',
      icon: FolderPlus,
    },
    {
      id: 'script',
      title: 'Install the widget',
      description: 'Add the script tag to your website',
      completed: activeProjects > 0,
      href: totalProjects > 0 ? '/projects' : undefined,
      icon: Code,
    },
    {
      id: 'feedback',
      title: 'Receive your first feedback',
      description: 'Wait for users to submit feedback through the widget',
      completed: totalFeedback > 0,
      icon: MessageSquare,
    },
  ];

  const completedCount = steps.filter((s) => s.completed).length;
  const allCompleted = completedCount === steps.length;

  // Don't show if all steps are completed
  if (allCompleted) {
    return null;
  }

  // Find the first incomplete step for the CTA
  const nextStep = steps.find((s) => !s.completed);

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Get Started</CardTitle>
            <CardDescription>
              Complete these steps to start collecting feedback
            </CardDescription>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            {completedCount}/{steps.length} completed
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={cn(
                  'flex items-start gap-3 rounded-lg p-3 transition-colors',
                  step.completed
                    ? 'bg-background/50'
                    : 'bg-background border'
                )}
              >
                <div
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    step.completed
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  {step.completed ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <p
                      className={cn(
                        'text-sm font-medium',
                        step.completed && 'text-muted-foreground line-through'
                      )}
                    >
                      {step.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {step.description}
                  </p>
                </div>
                {!step.completed && step.href && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={step.href}>
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {nextStep?.href && (
          <Button className="w-full" asChild>
            <Link href={nextStep.href}>
              {nextStep.id === 'project' && 'Create Project'}
              {nextStep.id === 'script' && 'Go to Project Settings'}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
