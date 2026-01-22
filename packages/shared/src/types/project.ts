import type { Tier } from '../constants/tier-limits';

export interface WidgetConfig {
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor: string;
  textColor: string;
  buttonText: string;
  showBranding: boolean;
  categories: string[];
  collectEmail: 'required' | 'optional' | 'hidden';
  enableScreenshot: boolean;
  enableSessionReplay: boolean;
  customCss?: string;
}

export interface UrlPattern {
  id: string;
  pattern: string;
  type: 'include' | 'exclude';
  createdAt: string;
}

export interface Project {
  id: string;
  userId: string;
  name: string;
  domain: string;
  apiKey: string;
  widgetConfig: WidgetConfig;
  urlPatterns: UrlPattern[];
  tier: Tier;
  feedbackCount: number;
  monthlyFeedbackCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectCreateInput {
  name: string;
  domain: string;
}

export interface ProjectUpdateInput {
  name?: string;
  domain?: string;
  widgetConfig?: Partial<WidgetConfig>;
  urlPatterns?: UrlPattern[];
  isActive?: boolean;
}

export interface ProjectStats {
  totalFeedback: number;
  newFeedback: number;
  inProgressFeedback: number;
  resolvedFeedback: number;
  feedbackByCategory: Record<string, number>;
  feedbackByPriority: Record<string, number>;
  feedbackTrend: { date: string; count: number }[];
}
