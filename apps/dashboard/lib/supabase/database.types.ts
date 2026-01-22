export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          tier: 'free' | 'pro' | 'enterprise';
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          onboarding_completed_at: string | null;
          onboarding_steps: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          avatar_url?: string | null;
          tier?: 'free' | 'pro' | 'enterprise';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          onboarding_completed_at?: string | null;
          onboarding_steps?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          avatar_url?: string | null;
          tier?: 'free' | 'pro' | 'enterprise';
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          onboarding_completed_at?: string | null;
          onboarding_steps?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          domain: string;
          api_key: string;
          widget_config: Json;
          is_active: boolean;
          feedback_count: number;
          monthly_feedback_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          domain: string;
          api_key?: string;
          widget_config?: Json;
          is_active?: boolean;
          feedback_count?: number;
          monthly_feedback_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          domain?: string;
          api_key?: string;
          widget_config?: Json;
          is_active?: boolean;
          feedback_count?: number;
          monthly_feedback_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      url_patterns: {
        Row: {
          id: string;
          project_id: string;
          pattern: string;
          type: 'include' | 'exclude';
          created_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          pattern: string;
          type: 'include' | 'exclude';
          created_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          pattern?: string;
          type?: 'include' | 'exclude';
          created_at?: string;
        };
      };
      feedback: {
        Row: {
          id: string;
          project_id: string;
          category: 'bug' | 'feature' | 'improvement' | 'question' | 'other';
          message: string;
          email: string | null;
          priority: 'low' | 'medium' | 'high' | 'critical';
          status: 'new' | 'in_progress' | 'resolved' | 'closed' | 'archived';
          screenshot_url: string | null;
          session_replay_url: string | null;
          metadata: Json;
          internal_notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          category: 'bug' | 'feature' | 'improvement' | 'question' | 'other';
          message: string;
          email?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'new' | 'in_progress' | 'resolved' | 'closed' | 'archived';
          screenshot_url?: string | null;
          session_replay_url?: string | null;
          metadata?: Json;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          category?: 'bug' | 'feature' | 'improvement' | 'question' | 'other';
          message?: string;
          email?: string | null;
          priority?: 'low' | 'medium' | 'high' | 'critical';
          status?: 'new' | 'in_progress' | 'resolved' | 'closed' | 'archived';
          screenshot_url?: string | null;
          session_replay_url?: string | null;
          metadata?: Json;
          internal_notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      feedback_replies: {
        Row: {
          id: string;
          feedback_id: string;
          message: string;
          sent_by: 'admin' | 'user';
          sent_by_email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          feedback_id: string;
          message: string;
          sent_by?: 'admin' | 'user';
          sent_by_email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          feedback_id?: string;
          message?: string;
          sent_by?: 'admin' | 'user';
          sent_by_email?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      feedback_category: 'bug' | 'feature' | 'improvement' | 'question' | 'other';
      feedback_priority: 'low' | 'medium' | 'high' | 'critical';
      feedback_reply_sender: 'admin' | 'user';
      feedback_status: 'new' | 'in_progress' | 'resolved' | 'closed' | 'archived';
      url_pattern_type: 'include' | 'exclude';
      user_tier: 'free' | 'pro' | 'enterprise';
    };
  };
};

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
