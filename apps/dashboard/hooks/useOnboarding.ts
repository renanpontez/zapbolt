'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useProjects } from './useProjects';

export interface OnboardingState {
  showWizard: boolean;
  isLoading: boolean;
}

export function useOnboarding() {
  const { user } = useAuth();
  const { data: projects, isLoading: projectsLoading } = useProjects();

  const [showWizard, setShowWizard] = useState(false);

  // Determine if wizard should show (new users with no projects)
  useEffect(() => {
    if (projectsLoading || !user) {
      setShowWizard(false);
      return;
    }

    // Show wizard for users with no projects
    const hasNoProjects = !projects || projects.length === 0;
    setShowWizard(hasNoProjects);
  }, [user, projects, projectsLoading]);

  const closeWizard = useCallback(() => {
    setShowWizard(false);
  }, []);

  return {
    showWizard,
    isLoading: projectsLoading,
    closeWizard,
  };
}
