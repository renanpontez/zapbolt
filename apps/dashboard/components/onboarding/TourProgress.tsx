'use client';

import { cn } from '@/lib/utils';

export interface TourProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function TourProgress({ currentStep, totalSteps }: TourProgressProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-1.5">
        {Array.from({ length: totalSteps }, (_, i) => (
          <div
            key={i}
            className={cn(
              'h-1.5 w-1.5 rounded-full transition-colors duration-200',
              i + 1 === currentStep
                ? 'bg-primary'
                : i + 1 < currentStep
                ? 'bg-primary/60'
                : 'bg-muted-foreground/30'
            )}
            aria-hidden="true"
          />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">
        {currentStep} of {totalSteps}
      </span>
    </div>
  );
}
