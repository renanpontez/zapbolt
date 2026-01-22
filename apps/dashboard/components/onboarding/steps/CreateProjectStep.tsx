'use client';

import { Spotlight } from '../Spotlight';
import { Tooltip } from '../Tooltip';

export interface CreateProjectStepProps {
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

export function CreateProjectStep({
  onSkip,
  currentStep,
  totalSteps,
}: CreateProjectStepProps) {
  return (
    <>
      <Spotlight targetSelector='[data-tour="projects"]' padding={4} />
      <Tooltip
        targetSelector='[data-tour="projects"]'
        position="right"
        title="Create your first project"
        description="Start by creating your first project. This is where you'll collect feedback from your users."
        primaryAction={{
          label: 'Got it',
          onClick: () => {
            // User needs to click the Projects link themselves
            // This just dismisses the tooltip explanation
          },
        }}
        secondaryAction={{
          label: 'Skip tour',
          onClick: onSkip,
        }}
        showProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
      />
    </>
  );
}
