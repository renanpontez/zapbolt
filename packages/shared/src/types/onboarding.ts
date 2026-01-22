export const ONBOARDING_STEP_NAMES = ['welcome', 'createProject', 'installWidget'] as const;
export type OnboardingStepName = typeof ONBOARDING_STEP_NAMES[number];
export type OnboardingStepStatus = 'completed' | 'skipped';

export interface OnboardingStepRecord {
  status: OnboardingStepStatus;
  completedAt: string;
}

export type OnboardingSteps = Partial<Record<OnboardingStepName, OnboardingStepRecord>>;
