'use client';

import { useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

export interface SpotlightProps {
  targetSelector?: string;
  padding?: number;
  onClick?: () => void;
  centered?: boolean;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function Spotlight({
  targetSelector,
  padding = 8,
  onClick,
  centered = false,
}: SpotlightProps) {
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [mounted, setMounted] = useState(false);

  const updateTargetRect = useCallback(() => {
    if (centered || !targetSelector) {
      // For centered spotlight (welcome screen), no target to highlight
      setTargetRect(null);
      return;
    }

    const target = document.querySelector(targetSelector);
    if (!target) {
      setTargetRect(null);
      return;
    }

    const rect = target.getBoundingClientRect();
    setTargetRect({
      top: rect.top - padding,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });
  }, [targetSelector, padding, centered]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    updateTargetRect();

    window.addEventListener('resize', updateTargetRect);
    window.addEventListener('scroll', updateTargetRect, true);

    return () => {
      window.removeEventListener('resize', updateTargetRect);
      window.removeEventListener('scroll', updateTargetRect, true);
    };
  }, [mounted, updateTargetRect]);

  if (!mounted) return null;

  // Generate clip-path for spotlight effect
  const getClipPath = () => {
    if (centered || !targetRect) {
      // Full overlay for centered content
      return 'none';
    }

    // Create a hole in the overlay where the target element is
    const { top, left, width, height } = targetRect;
    const borderRadius = 8;

    return `polygon(
      0% 0%,
      0% 100%,
      ${left}px 100%,
      ${left}px ${top + borderRadius}px,
      ${left + borderRadius}px ${top}px,
      ${left + width - borderRadius}px ${top}px,
      ${left + width}px ${top + borderRadius}px,
      ${left + width}px ${top + height - borderRadius}px,
      ${left + width - borderRadius}px ${top + height}px,
      ${left + borderRadius}px ${top + height}px,
      ${left}px ${top + height - borderRadius}px,
      ${left}px 100%,
      100% 100%,
      100% 0%
    )`;
  };

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 z-[10000] transition-opacity duration-300',
        centered ? 'bg-black/60' : 'bg-black/50'
      )}
      style={{
        clipPath: getClipPath(),
      }}
      onClick={onClick}
      aria-hidden="true"
    >
      {/* Highlight border around target */}
      {targetRect && !centered && (
        <div
          className="absolute rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-transparent pointer-events-none animate-pulse"
          style={{
            top: targetRect.top,
            left: targetRect.left,
            width: targetRect.width,
            height: targetRect.height,
          }}
        />
      )}
    </div>,
    document.body
  );
}
