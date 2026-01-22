export type Tier = 'free' | 'pro' | 'enterprise';

export interface TierLimits {
  maxProjects: number;
  maxFeedbackPerMonth: number;
  maxScreenshotSize: number; // in bytes
  sessionReplayEnabled: boolean;
  sessionReplayDuration: number; // in seconds
  customBranding: boolean;
  prioritySupport: boolean;
  webhooksEnabled: boolean;
  apiAccessEnabled: boolean;
  dataRetentionDays: number;
}

export const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    maxProjects: 1,
    maxFeedbackPerMonth: 50,
    maxScreenshotSize: 2 * 1024 * 1024, // 2MB
    sessionReplayEnabled: false,
    sessionReplayDuration: 0,
    customBranding: false,
    prioritySupport: false,
    webhooksEnabled: false,
    apiAccessEnabled: false,
    dataRetentionDays: 30,
  },
  pro: {
    maxProjects: 10,
    maxFeedbackPerMonth: 1000,
    maxScreenshotSize: 5 * 1024 * 1024, // 5MB
    sessionReplayEnabled: true,
    sessionReplayDuration: 60, // 60 seconds
    customBranding: true,
    prioritySupport: true,
    webhooksEnabled: true,
    apiAccessEnabled: true,
    dataRetentionDays: 365,
  },
  enterprise: {
    maxProjects: -1, // unlimited
    maxFeedbackPerMonth: -1, // unlimited
    maxScreenshotSize: 10 * 1024 * 1024, // 10MB
    sessionReplayEnabled: true,
    sessionReplayDuration: 300, // 5 minutes
    customBranding: true,
    prioritySupport: true,
    webhooksEnabled: true,
    apiAccessEnabled: true,
    dataRetentionDays: -1, // unlimited
  },
};

export const TIER_PRICES = {
  free: { monthly: 0, yearly: 0 },
  pro: { monthly: 29, yearly: 290 },
  enterprise: { monthly: 99, yearly: 990 },
} as const;

export function getTierLimits(tier: Tier): TierLimits {
  return TIER_LIMITS[tier];
}

export function isFeatureAvailable(tier: Tier, feature: keyof TierLimits): boolean {
  const limits = TIER_LIMITS[tier];
  const value = limits[feature];
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value !== 0;
  return false;
}

export function isWithinLimit(tier: Tier, feature: 'maxProjects' | 'maxFeedbackPerMonth', current: number): boolean {
  const limit = TIER_LIMITS[tier][feature];
  if (limit === -1) return true; // unlimited
  return current < limit;
}
