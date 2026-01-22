import { API_BASE_URL, API_ENDPOINTS } from '@zapbolt/shared';
import type {
  ApiResponse,
  PaginatedResponse,
  Feedback,
  FeedbackFilters,
  Project,
  ProjectCreateInput,
  ProjectUpdateInput,
  ProjectStats,
  User,
  UserUpdateInput,
  AuthCredentials,
  SignUpInput,
  AuthResponse,
} from '@zapbolt/shared';

type FetchOptions = RequestInit & {
  params?: Record<string, string | number | boolean | undefined>;
};

class ApiClient {
  private baseUrl: string;
  private accessToken: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  setAccessToken(token: string | null) {
    this.accessToken = token;
  }

  private async request<T>(
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const { params, ...fetchOptions } = options;

    let url = `${this.baseUrl}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...fetchOptions.headers,
    };

    if (this.accessToken) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${this.accessToken}`;
    }

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: {
            code: data.error?.code || 'REQUEST_FAILED',
            message: data.error?.message || 'Request failed',
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to server',
        },
      };
    }
  }

  // Auth
  async login(credentials: AuthCredentials): Promise<ApiResponse<AuthResponse>> {
    return this.request(API_ENDPOINTS.LOGIN, {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async signup(data: SignUpInput): Promise<ApiResponse<AuthResponse>> {
    return this.request(API_ENDPOINTS.SIGNUP, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async logout(): Promise<ApiResponse<void>> {
    return this.request(API_ENDPOINTS.LOGOUT, { method: 'POST' });
  }

  async getMe(): Promise<ApiResponse<User>> {
    return this.request(API_ENDPOINTS.ME);
  }

  // Projects
  async getProjects(): Promise<ApiResponse<Project[]>> {
    return this.request(API_ENDPOINTS.PROJECTS);
  }

  async getProject(id: string): Promise<ApiResponse<Project>> {
    return this.request(API_ENDPOINTS.PROJECT(id));
  }

  async createProject(data: ProjectCreateInput): Promise<ApiResponse<Project>> {
    return this.request(API_ENDPOINTS.PROJECTS, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProject(id: string, data: ProjectUpdateInput): Promise<ApiResponse<Project>> {
    return this.request(API_ENDPOINTS.PROJECT(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProject(id: string): Promise<ApiResponse<void>> {
    return this.request(API_ENDPOINTS.PROJECT(id), { method: 'DELETE' });
  }

  async getProjectStats(id: string): Promise<ApiResponse<ProjectStats>> {
    return this.request(API_ENDPOINTS.PROJECT_STATS(id));
  }

  async regenerateApiKey(projectId: string): Promise<ApiResponse<{ apiKey: string }>> {
    return this.request(API_ENDPOINTS.PROJECT_REGENERATE_KEY(projectId), {
      method: 'POST',
    });
  }

  // Feedback
  async getFeedback(
    projectId: string,
    filters?: FeedbackFilters & { page?: number; pageSize?: number }
  ): Promise<ApiResponse<PaginatedResponse<Feedback>>> {
    return this.request(API_ENDPOINTS.FEEDBACK_BY_PROJECT(projectId), {
      params: {
        ...filters,
        status: filters?.status?.join(','),
        category: filters?.category?.join(','),
        priority: filters?.priority?.join(','),
      },
    });
  }

  async getFeedbackItem(id: string): Promise<ApiResponse<Feedback>> {
    return this.request(API_ENDPOINTS.FEEDBACK_ITEM(id));
  }

  async updateFeedback(
    id: string,
    data: { status?: string; internalNotes?: string }
  ): Promise<ApiResponse<Feedback>> {
    return this.request(API_ENDPOINTS.FEEDBACK_ITEM(id), {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteFeedback(id: string): Promise<ApiResponse<void>> {
    return this.request(API_ENDPOINTS.FEEDBACK_ITEM(id), { method: 'DELETE' });
  }

  // User
  async updateProfile(data: UserUpdateInput): Promise<ApiResponse<User>> {
    return this.request(API_ENDPOINTS.USER_PROFILE, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async updatePassword(data: {
    currentPassword: string;
    newPassword: string;
  }): Promise<ApiResponse<void>> {
    return this.request(API_ENDPOINTS.USER_PASSWORD, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Billing
  async createCheckoutSession(
    tier: 'pro' | 'enterprise',
    interval: 'monthly' | 'yearly'
  ): Promise<ApiResponse<{ url: string }>> {
    return this.request(API_ENDPOINTS.BILLING_CHECKOUT, {
      method: 'POST',
      body: JSON.stringify({ tier, interval }),
    });
  }

  async createPortalSession(): Promise<ApiResponse<{ url: string }>> {
    return this.request(API_ENDPOINTS.BILLING_PORTAL, { method: 'POST' });
  }
}

export const apiClient = new ApiClient();
export default apiClient;
