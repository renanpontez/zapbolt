'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { WelcomeStep } from './steps/WelcomeStep';
import { CreateProjectStep } from './steps/CreateProjectStep';
import { InstallWidgetStep } from './steps/InstallWidgetStep';
import { useOnboarding } from '@/hooks/useOnboarding';

export function OnboardingTour() {
  const pathname = usePathname();
  const {
    isActive,
    currentStep,
    totalSteps,
    nextStep,
    skipTour,
    completeTour,
    goToStep,
  } = useOnboarding();

  // Handle keyboard navigation
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        skipTour();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, skipTour]);

  // Auto-advance to step 3 when on a project page with install widget visible
  useEffect(() => {
    if (!isActive || currentStep !== 2) return;

    // Check if we're on a project detail page
    const isOnProjectPage = pathname.startsWith('/projects/') && pathname !== '/projects';

    if (isOnProjectPage) {
      // Wait for the install widget to be rendered
      const checkForWidget = setInterval(() => {
        const widget = document.querySelector('[data-tour="install-widget"]');
        if (widget) {
          clearInterval(checkForWidget);
          goToStep(3);
        }
      }, 100);

      // Clean up after 5 seconds if widget never appears
      const timeout = setTimeout(() => clearInterval(checkForWidget), 5000);

      return () => {
        clearInterval(checkForWidget);
        clearTimeout(timeout);
      };
    }
  }, [isActive, currentStep, pathname, goToStep]);

  if (!isActive) return null;

  // Don't show step 3 unless we're on a project page
  if (currentStep === 3) {
    const isOnProjectPage = pathname.startsWith('/projects/') && pathname !== '/projects';
    if (!isOnProjectPage) {
      return (
        <CreateProjectStep
          onSkip={skipTour}
          currentStep={2}
          totalSteps={totalSteps}
        />
      );
    }
  }

  switch (currentStep) {
    case 1:
      return (
        <WelcomeStep
          onNext={nextStep}
          onSkip={skipTour}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      );
    case 2:
      return (
        <CreateProjectStep
          onSkip={skipTour}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      );
    case 3:
      return (
        <InstallWidgetStep
          onComplete={completeTour}
          onSkip={skipTour}
          currentStep={currentStep}
          totalSteps={totalSteps}
        />
      );
    default:
      return null;
  }
}
