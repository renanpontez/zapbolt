import { getConfig } from '../core/config';
import type { FeedbackSubmission, FeedbackMetadata, ApiResponse } from '@zapbolt/shared';

interface SubmitFeedbackParams {
  category: string;
  message: string;
  email?: string;
  priority?: string;
  screenshotBase64?: string;
  sessionReplayData?: string;
}

interface SubmitFeedbackResponse {
  id: string;
  status: string;
}

/**
 * Collect metadata about the current page/session
 */
function collectMetadata(): FeedbackMetadata {
  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    devicePixelRatio: window.devicePixelRatio || 1,
    timestamp: new Date().toISOString(),
    sessionId: getSessionId(),
  };
}

/**
 * Get or create a session ID
 */
function getSessionId(): string {
  const key = 'zapbolt_session_id';
  let sessionId = sessionStorage.getItem(key);

  if (!sessionId) {
    sessionId = generateId();
    sessionStorage.setItem(key, sessionId);
  }

  return sessionId;
}

/**
 * Generate a random ID
 */
function generateId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Submit feedback to the API
 */
export async function submitFeedback(
  params: SubmitFeedbackParams
): Promise<ApiResponse<SubmitFeedbackResponse>> {
  const config = getConfig();

  const payload: FeedbackSubmission = {
    projectId: config.projectId,
    category: params.category as FeedbackSubmission['category'],
    message: params.message,
    email: params.email,
    priority: params.priority as FeedbackSubmission['priority'],
    screenshotBase64: params.screenshotBase64,
    sessionReplayData: params.sessionReplayData,
    metadata: collectMetadata(),
  };

  try {
    const response = await fetch(`${config.apiUrl}/api/widget/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      // Check for rate limit
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        return {
          success: false,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please try again later.',
            details: {
              retryAfter: retryAfter ? parseInt(retryAfter, 10) : 60,
            },
          },
        };
      }

      return {
        success: false,
        error: {
          code: data.error?.code || 'SUBMISSION_FAILED',
          message: data.error?.message || 'Failed to submit feedback',
        },
      };
    }

    return {
      success: true,
      data: {
        id: data.id,
        status: data.status,
      },
    };
  } catch (error) {
    console.error('[Zapbolt] Failed to submit feedback:', error);

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to server. Please check your internet connection.',
      },
    };
  }
}

/**
 * Initialize widget and fetch remote config
 */
export async function initWidget(
  projectId: string
): Promise<ApiResponse<{ config: Record<string, unknown>; tier: string }>> {
  const config = getConfig();

  try {
    const response = await fetch(`${config.apiUrl}/api/widget/init?projectId=${projectId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const data = await response.json();
      return {
        success: false,
        error: {
          code: data.error?.code || 'INIT_FAILED',
          message: data.error?.message || 'Failed to initialize widget',
        },
      };
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('[Zapbolt] Failed to initialize widget:', error);

    return {
      success: false,
      error: {
        code: 'NETWORK_ERROR',
        message: 'Failed to connect to server',
      },
    };
  }
}
