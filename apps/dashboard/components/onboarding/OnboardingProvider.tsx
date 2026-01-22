'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingTour } from './OnboardingTour';

interface OnboardingContextType {
  isActive: boolean;
  currentStep: number;
  totalSteps: number;
  nextStep: () => void;
  skipTour: () => void;
  completeTour: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const onboarding = useOnboarding();

  return (
    <OnboardingContext.Provider
      value={{
        isActive: onboarding.isActive,
        currentStep: onboarding.currentStep,
        totalSteps: onboarding.totalSteps,
        nextStep: onboarding.nextStep,
        skipTour: onboarding.skipTour,
        completeTour: onboarding.completeTour,
      }}
    >
      {children}
      <OnboardingTour />
    </OnboardingContext.Provider>
  );
}

export function useOnboardingContext() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error(
      'useOnboardingContext must be used within an OnboardingProvider'
    );
  }
  return context;
}
