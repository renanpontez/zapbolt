'use client';

import { ReactNode } from 'react';
import { OnboardingProvider } from '@/components/onboarding/OnboardingProvider';
import { SidebarProvider } from './sidebar-context';

interface DashboardClientWrapperProps {
  children: ReactNode;
}

export function DashboardClientWrapper({ children }: DashboardClientWrapperProps) {
  return (
    <SidebarProvider>
      <OnboardingProvider>{children}</OnboardingProvider>
    </SidebarProvider>
  );
}
