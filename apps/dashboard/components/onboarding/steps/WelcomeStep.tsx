'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Spotlight } from '../Spotlight';
import { TourProgress } from '../TourProgress';

export interface WelcomeStepProps {
  onNext: () => void;
  onSkip: () => void;
  currentStep: number;
  totalSteps: number;
}

export function WelcomeStep({
  onNext,
  onSkip,
  currentStep,
  totalSteps,
}: WelcomeStepProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <>
      <Spotlight centered />
      {createPortal(
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="welcome-title"
          aria-describedby="welcome-description"
        >
          <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-2xl animate-in fade-in-0 zoom-in-95 duration-300">
            {/* Logo */}
            <div className="mb-6 flex justify-center">
              <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center">
                <Zap className="h-8 w-8 text-primary-foreground" />
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4 flex justify-center">
              <TourProgress currentStep={currentStep} totalSteps={totalSteps} />
            </div>

            {/* Content */}
            <div className="text-center">
              <h2
                id="welcome-title"
                className="text-2xl font-bold text-foreground"
              >
                Welcome to Zapbolt!
              </h2>
              <p
                id="welcome-description"
                className="mt-2 text-muted-foreground"
              >
                Let&apos;s get you set up in under 2 minutes.
              </p>
            </div>

            {/* Actions */}
            <div className="mt-8 flex flex-col gap-3">
              <Button size="lg" onClick={onNext} className="w-full">
                Let&apos;s Go
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSkip}
                className="text-muted-foreground hover:text-foreground"
              >
                Skip tour
              </Button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
