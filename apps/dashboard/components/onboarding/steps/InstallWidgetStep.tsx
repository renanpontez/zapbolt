'use client';

import { Spotlight } from '../Spotlight';
import { Tooltip } from '../Tooltip';

export interface InstallWidgetStepProps {
  onComplete: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

export function InstallWidgetStep({
  onComplete,
  onSkip,
  currentStep,
  totalSteps,
}: InstallWidgetStepProps) {
  return (
    <>
      <Spotlight targetSelector='[data-tour="install-widget"]' padding={8} />
      <Tooltip
        targetSelector='[data-tour="install-widget"]'
        position="top"
        title="Install the widget"
        description="Copy this script tag and add it to your website. That's it - you're ready to collect feedback!"
        primaryAction={{
          label: 'Got it!',
          onClick: onComplete,
        }}
        secondaryAction={{
          label: "I'll do this later",
          onClick: onSkip,
        }}
        showProgress
        currentStep={currentStep}
        totalSteps={totalSteps}
      />
    </>
  );
}
