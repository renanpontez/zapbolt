'use client';

import { createContext, useContext, ReactNode } from 'react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingWizard } from './OnboardingWizard';

interface OnboardingContextType {
  showWizard: boolean;
  closeWizard: () => void;
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
        showWizard: onboarding.showWizard,
        closeWizard: onboarding.closeWizard,
      }}
    >
      {children}
      <OnboardingWizard
        open={onboarding.showWizard}
        onComplete={onboarding.closeWizard}
      />
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
