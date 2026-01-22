'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { TourProgress } from './TourProgress';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  targetSelector: string;
  position: TooltipPosition;
  title: string;
  description: string;
  primaryAction: { label: string; onClick: () => void };
  secondaryAction?: { label: string; onClick: () => void };
  showProgress?: boolean;
  currentStep?: number;
  totalSteps?: number;
}

interface Position {
  top: number;
  left: number;
  arrowTop?: number;
  arrowLeft?: number;
}

const TOOLTIP_OFFSET = 12;
const ARROW_SIZE = 8;

export function Tooltip({
  targetSelector,
  position,
  title,
  description,
  primaryAction,
  secondaryAction,
  showProgress = false,
  currentStep,
  totalSteps,
}: TooltipProps) {
  const [tooltipPosition, setTooltipPosition] = useState<Position | null>(null);
  const [mounted, setMounted] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    const target = document.querySelector(targetSelector);
    const tooltip = tooltipRef.current;

    if (!target || !tooltip) return null;

    const targetRect = target.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();

    let top = 0;
    let left = 0;
    let arrowTop: number | undefined;
    let arrowLeft: number | undefined;

    switch (position) {
      case 'top':
        top = targetRect.top - tooltipRect.height - TOOLTIP_OFFSET;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        arrowLeft = tooltipRect.width / 2 - ARROW_SIZE;
        break;
      case 'bottom':
        top = targetRect.bottom + TOOLTIP_OFFSET;
        left = targetRect.left + (targetRect.width - tooltipRect.width) / 2;
        arrowLeft = tooltipRect.width / 2 - ARROW_SIZE;
        break;
      case 'left':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.left - tooltipRect.width - TOOLTIP_OFFSET;
        arrowTop = tooltipRect.height / 2 - ARROW_SIZE;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height - tooltipRect.height) / 2;
        left = targetRect.right + TOOLTIP_OFFSET;
        arrowTop = tooltipRect.height / 2 - ARROW_SIZE;
        break;
    }

    // Ensure tooltip stays within viewport
    const padding = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewportWidth - padding) {
      left = viewportWidth - tooltipRect.width - padding;
    }
    if (top < padding) top = padding;
    if (top + tooltipRect.height > viewportHeight - padding) {
      top = viewportHeight - tooltipRect.height - padding;
    }

    return { top, left, arrowTop, arrowLeft };
  }, [targetSelector, position]);

  const updatePosition = useCallback(() => {
    const newPosition = calculatePosition();
    if (newPosition) {
      setTooltipPosition(newPosition);
    }
  }, [calculatePosition]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Initial position calculation with a small delay to ensure DOM is ready
    const timer = setTimeout(updatePosition, 50);

    // Update position on resize and scroll
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [mounted, updatePosition]);

  // Scroll target into view if needed
  useEffect(() => {
    if (!mounted) return;

    const target = document.querySelector(targetSelector);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [mounted, targetSelector]);

  if (!mounted) return null;

  const arrowClasses = cn(
    'absolute w-0 h-0 border-solid',
    position === 'top' && 'bottom-0 translate-y-full border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white',
    position === 'bottom' && 'top-0 -translate-y-full border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-b-[8px] border-b-white',
    position === 'left' && 'right-0 translate-x-full border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-l-[8px] border-l-white',
    position === 'right' && 'left-0 -translate-x-full border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[8px] border-r-white'
  );

  const arrowStyle = {
    ...(tooltipPosition?.arrowLeft !== undefined && { left: tooltipPosition.arrowLeft }),
    ...(tooltipPosition?.arrowTop !== undefined && { top: tooltipPosition.arrowTop }),
  };

  return createPortal(
    <div
      ref={tooltipRef}
      className={cn(
        'fixed z-[10001] w-80 rounded-lg bg-white p-4 shadow-lg border border-primary/20',
        'animate-in fade-in-0 zoom-in-95 duration-200'
      )}
      style={{
        top: tooltipPosition?.top ?? -9999,
        left: tooltipPosition?.left ?? -9999,
        visibility: tooltipPosition ? 'visible' : 'hidden',
      }}
      role="tooltip"
      aria-live="polite"
    >
      {/* Arrow */}
      <div className={arrowClasses} style={arrowStyle} />

      {/* Content */}
      <div className="space-y-3">
        {showProgress && currentStep !== undefined && totalSteps !== undefined && (
          <TourProgress currentStep={currentStep} totalSteps={totalSteps} />
        )}

        <div>
          <h3 className="font-semibold text-foreground">{title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <div className="flex items-center justify-between gap-2">
          {secondaryAction && (
            <Button
              variant="ghost"
              size="sm"
              onClick={secondaryAction.onClick}
              className="text-muted-foreground hover:text-foreground"
            >
              {secondaryAction.label}
            </Button>
          )}
          <Button
            size="sm"
            onClick={primaryAction.onClick}
            className={cn(!secondaryAction && 'ml-auto')}
          >
            {primaryAction.label}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  );
}
