export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api.zapbolt.io';

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  LOGOUT: '/auth/logout',
  REFRESH: '/auth/refresh',
  ME: '/auth/me',

  // Projects
  PROJECTS: '/projects',
  PROJECT: (id: string) => `/projects/${id}`,
  PROJECT_STATS: (id: string) => `/projects/${id}/stats`,
  PROJECT_REGENERATE_KEY: (id: string) => `/projects/${id}/regenerate-key`,

  // Feedback
  FEEDBACK: '/feedback',
  FEEDBACK_ITEM: (id: string) => `/feedback/${id}`,
  FEEDBACK_BY_PROJECT: (projectId: string) => `/projects/${projectId}/feedback`,

  // Widget
  WIDGET_INIT: '/widget/init',
  WIDGET_SUBMIT: '/widget/submit',

  // Billing
  BILLING_PORTAL: '/billing/portal',
  BILLING_CHECKOUT: '/billing/checkout',
  BILLING_STATUS: '/billing/status',

  // User
  USER_PROFILE: '/user/profile',
  USER_PASSWORD: '/user/password',
} as const;

export const RATE_LIMITS = {
  WIDGET_SUBMIT: {
    maxRequests: 5,
    windowMs: 60 * 1000, // 1 minute
  },
  API: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
  },
} as const;
