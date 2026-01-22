'use client';

import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProjects } from './useProjects';
import type { OnboardingSteps, OnboardingStepName, OnboardingStepStatus } from '@zapbolt/shared';

const ONBOARDING_STEP_KEY = 'zapbolt_onboarding_step';
const TOTAL_STEPS = 3;

// Map step numbers to step names
const STEP_NUMBER_TO_NAME: Record<number, OnboardingStepName> = {
  1: 'welcome',
  2: 'createProject',
  3: 'installWidget',
};

const STEP_NAME_TO_NUMBER: Record<OnboardingStepName, number> = {
  welcome: 1,
  createProject: 2,
  installWidget: 3,
};

export interface OnboardingState {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  isLoading: boolean;
}

interface OnboardingApiResponse {
  steps: OnboardingSteps | null;
  completedAt: string | null;
}

async function fetchOnboardingSteps(): Promise<OnboardingApiResponse> {
  const response = await fetch('/api/user/onboarding');
  if (!response.ok) {
    throw new Error('Failed to fetch onboarding steps');
  }
  return response.json();
}

async function updateOnboardingStep(stepName: OnboardingStepName, status: OnboardingStepStatus): Promise<{ success: boolean; steps: OnboardingSteps }> {
  const response = await fetch('/api/user/onboarding', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stepName, status }),
  });
  if (!response.ok) {
    throw new Error('Failed to update onboarding step');
  }
  return response.json();
}

async function completeOnboarding(): Promise<{ success: boolean }> {
  const response = await fetch('/api/user/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error('Failed to complete onboarding');
  }
  return response.json();
}

function getHighestCompletedStep(steps: OnboardingSteps | null): number {
  if (!steps) return 0;

  let highest = 0;
  for (const [stepName, record] of Object.entries(steps)) {
    if (record && (record.status === 'completed' || record.status === 'skipped')) {
      const stepNumber = STEP_NAME_TO_NUMBER[stepName as OnboardingStepName];
      if (stepNumber > highest) {
        highest = stepNumber;
      }
    }
  }
  return highest;
}

export function useOnboarding() {
  const { user, refreshUser } = useAuth();
  const { data: projects, isLoading: projectsLoading } = useProjects();
  const queryClient = useQueryClient();

  const [currentStep, setCurrentStep] = useState<number>(() => {
    if (typeof window === 'undefined') return 1;
    const stored = localStorage.getItem(ONBOARDING_STEP_KEY);
    return stored ? parseInt(stored, 10) : 1;
  });

  const [isActive, setIsActive] = useState(false);

  // Fetch onboarding steps from the database
  const { data: onboardingData, isLoading: stepsLoading } = useQuery({
    queryKey: ['onboarding-steps'],
    queryFn: fetchOnboardingSteps,
    enabled: !!user && !user.onboardingCompletedAt,
    staleTime: 30000, // 30 seconds
  });

  // Sync localStorage with DB state on load
  useEffect(() => {
    if (onboardingData?.steps) {
      const highestStep = getHighestCompletedStep(onboardingData.steps);
      const nextStep = Math.min(highestStep + 1, TOTAL_STEPS);

      // Only update if DB has more progress than localStorage
      const localStep = parseInt(localStorage.getItem(ONBOARDING_STEP_KEY) || '1', 10);
      if (nextStep > localStep) {
        setCurrentStep(nextStep);
        localStorage.setItem(ONBOARDING_STEP_KEY, nextStep.toString());
      }
    }
  }, [onboardingData]);

  // Mutation to update a single step
  const updateStepMutation = useMutation({
    mutationFn: ({ stepName, status }: { stepName: OnboardingStepName; status: OnboardingStepStatus }) =>
      updateOnboardingStep(stepName, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding-steps'] });
    },
    onError: (error) => {
      console.error('Failed to persist step to DB, continuing with localStorage only:', error);
      // Fallback: continue with localStorage only
    },
  });

  // Mutation to complete onboarding
  const completeOnboardingMutation = useMutation({
    mutationFn: completeOnboarding,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      queryClient.invalidateQueries({ queryKey: ['onboarding-steps'] });
      refreshUser();
    },
  });

  // Determine if onboarding should be active
  useEffect(() => {
    if (projectsLoading || stepsLoading || !user) {
      setIsActive(false);
      return;
    }

    // Check if onboarding is already completed
    if (user.onboardingCompletedAt) {
      setIsActive(false);
      localStorage.removeItem(ONBOARDING_STEP_KEY);
      return;
    }

    // Check if user has 0 projects - show onboarding
    const hasNoProjects = !projects || projects.length === 0;

    // Only show on larger screens (optional enhancement)
    const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 768;

    setIsActive(hasNoProjects && isDesktop);
  }, [user, projects, projectsLoading, stepsLoading]);

  // Persist step to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ONBOARDING_STEP_KEY, currentStep.toString());
    }
  }, [currentStep]);

  // Watch for project creation to auto-advance from step 2 to step 3
  useEffect(() => {
    if (currentStep === 2 && projects && projects.length > 0) {
      // Mark step 2 as completed when a project is created
      updateStepMutation.mutate({ stepName: 'createProject', status: 'completed' });
      setCurrentStep(3);
    }
  }, [currentStep, projects]);

  const nextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS) {
      // Mark current step as completed
      const stepName = STEP_NUMBER_TO_NAME[currentStep];
      if (stepName) {
        updateStepMutation.mutate({ stepName, status: 'completed' });
      }
      setCurrentStep(currentStep + 1);
    } else {
      // Mark final step as completed and finish the tour
      const stepName = STEP_NUMBER_TO_NAME[currentStep];
      if (stepName) {
        updateStepMutation.mutate({ stepName, status: 'completed' });
      }
      completeOnboardingMutation.mutate();
      setIsActive(false);
      localStorage.removeItem(ONBOARDING_STEP_KEY);
    }
  }, [currentStep, updateStepMutation, completeOnboardingMutation]);

  const skipTour = useCallback(() => {
    // Mark current step as skipped
    const stepName = STEP_NUMBER_TO_NAME[currentStep];
    if (stepName) {
      updateStepMutation.mutate({ stepName, status: 'skipped' });
    }
    completeOnboardingMutation.mutate();
    setIsActive(false);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
  }, [currentStep, updateStepMutation, completeOnboardingMutation]);

  const completeTour = useCallback(() => {
    // Mark final step as completed
    const stepName = STEP_NUMBER_TO_NAME[currentStep];
    if (stepName) {
      updateStepMutation.mutate({ stepName, status: 'completed' });
    }
    completeOnboardingMutation.mutate();
    setIsActive(false);
    localStorage.removeItem(ONBOARDING_STEP_KEY);
  }, [currentStep, updateStepMutation, completeOnboardingMutation]);

  const goToStep = useCallback((step: number) => {
    if (step >= 1 && step <= TOTAL_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  return {
    isActive,
    currentStep,
    totalSteps: TOTAL_STEPS,
    isLoading: projectsLoading || stepsLoading || completeOnboardingMutation.isPending || updateStepMutation.isPending,
    steps: onboardingData?.steps || null,
    nextStep,
    skipTour,
    completeTour,
    goToStep,
  };
}
