export type FeedbackCategory = 'bug' | 'feature' | 'improvement' | 'question' | 'other';

export type FeedbackPriority = 'low' | 'medium' | 'high' | 'critical';

export type FeedbackStatus = 'new' | 'in_progress' | 'resolved' | 'closed' | 'archived';

export interface FeedbackMetadata {
  url: string;
  userAgent: string;
  screenWidth: number;
  screenHeight: number;
  devicePixelRatio: number;
  timestamp: string;
  sessionId?: string;
  customData?: Record<string, unknown>;
}

export interface FeedbackSubmission {
  projectId: string;
  category: FeedbackCategory;
  message: string;
  email?: string;
  priority?: FeedbackPriority;
  screenshotBase64?: string;
  sessionReplayData?: string;
  metadata: FeedbackMetadata;
}

export interface Feedback {
  id: string;
  projectId: string;
  category: FeedbackCategory;
  message: string;
  email?: string;
  priority: FeedbackPriority;
  status: FeedbackStatus;
  screenshotUrl?: string;
  sessionReplayUrl?: string;
  metadata: FeedbackMetadata;
  internalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackFilters {
  status?: FeedbackStatus[];
  category?: FeedbackCategory[];
  priority?: FeedbackPriority[];
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface FeedbackListResponse {
  items: Feedback[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export type FeedbackReplySender = 'admin' | 'user';

export interface FeedbackReply {
  id: string;
  feedbackId: string;
  message: string;
  sentBy: FeedbackReplySender;
  sentByEmail: string;
  createdAt: string;
}

export interface FeedbackReplyListResponse {
  replies: FeedbackReply[];
}

export interface CreateFeedbackReplyRequest {
  message: string;
}

export interface CreateFeedbackReplyResponse {
  id: string;
  message: string;
  createdAt: string;
}
