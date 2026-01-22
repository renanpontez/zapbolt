export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

export interface PaginationParams {
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
}

// Widget API types
export interface WidgetInitConfig {
  projectId: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  primaryColor?: string;
  onSubmit?: (feedback: { id: string }) => void;
  onError?: (error: Error) => void;
}

// Simplified URL pattern for widget (without database fields)
export interface WidgetUrlPattern {
  pattern: string;
  type: 'include' | 'exclude';
}

export interface WidgetInitResponse {
  config: {
    position: string;
    primaryColor: string;
    textColor: string;
    buttonText: string;
    showBranding: boolean;
    categories: string[];
    collectEmail: string;
    enableScreenshot: boolean;
    enableSessionReplay: boolean;
  };
  urlPatterns: WidgetUrlPattern[];
  tier: string;
}
