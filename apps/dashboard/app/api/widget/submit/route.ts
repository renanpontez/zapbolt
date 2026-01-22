import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';

// CORS headers for widget cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS /api/widget/submit - Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

const submitFeedbackSchema = z.object({
  projectId: z.string().uuid(),
  category: z.enum(['bug', 'feature', 'improvement', 'question', 'other']),
  message: z.string().min(10).max(2000),
  email: z.string().email().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  screenshotBase64: z.string().optional(),
  sessionReplayData: z.string().optional(),
  metadata: z.object({
    url: z.string(),
    userAgent: z.string(),
    screenWidth: z.number(),
    screenHeight: z.number(),
    devicePixelRatio: z.number(),
    timestamp: z.string(),
    sessionId: z.string().optional(),
    customData: z.record(z.unknown()).optional(),
  }),
});

// Simple in-memory rate limiting (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || record.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return { allowed: true };
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return {
      allowed: false,
      retryAfter: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  record.count++;
  return { allowed: true };
}

// POST /api/widget/submit - Submit feedback from widget (public endpoint)
export async function POST(request: Request) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') ||
               request.headers.get('x-real-ip') ||
               'unknown';
    const rateLimit = checkRateLimit(ip);

    if (!rateLimit.allowed) {
      const response = NextResponse.json(
        { error: { code: 'RATE_LIMITED', message: 'Too many requests. Please try again later.' } },
        { status: 429, headers: corsHeaders }
      );
      response.headers.set('Retry-After', String(rateLimit.retryAfter));
      return response;
    }

    const body = await request.json();
    const data = submitFeedbackSchema.parse(body);

    const supabase = await createServerClient();

    // Verify project exists and is active
    const { data: projectData, error: projectError } = await supabase
      .from('projects')
      .select('id, is_active, monthly_feedback_count, users!inner (tier)')
      .eq('id', data.projectId)
      .single();

    if (projectError || !projectData) {
      return NextResponse.json(
        { error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } },
        { status: 404, headers: corsHeaders }
      );
    }

    // Type assertion for joined query result
    type ProjectWithUser = {
      id: string;
      is_active: boolean;
      monthly_feedback_count: number;
      users: { tier: string };
    };
    const project = projectData as unknown as ProjectWithUser;

    if (!project.is_active) {
      return NextResponse.json(
        { error: { code: 'PROJECT_INACTIVE', message: 'This project is not accepting feedback' } },
        { status: 403, headers: corsHeaders }
      );
    }

    // Check monthly feedback limit based on tier
    const tier = project.users?.tier || 'free';
    const limits: Record<string, number> = {
      free: 50,
      pro: 1000,
      enterprise: -1, // unlimited
    };
    const limit = limits[tier] ?? 50;

    if (limit !== -1 && project.monthly_feedback_count >= limit) {
      return NextResponse.json(
        { error: { code: 'LIMIT_REACHED', message: 'Monthly feedback limit reached' } },
        { status: 403, headers: corsHeaders }
      );
    }

    // TODO: Upload screenshot to storage if provided
    let screenshotUrl: string | null = null;
    if (data.screenshotBase64) {
      // For now, we'll store the base64 directly (not recommended for production)
      // In production, upload to Supabase Storage or S3
      // screenshotUrl = await uploadScreenshot(data.projectId, data.screenshotBase64);
    }

    // TODO: Upload session replay data if provided
    let sessionReplayUrl: string | null = null;
    if (data.sessionReplayData && tier !== 'free') {
      // In production, upload to storage
      // sessionReplayUrl = await uploadSessionReplay(data.projectId, data.sessionReplayData);
    }

    // Insert feedback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: feedbackData, error } = await (supabase as any)
      .from('feedback')
      .insert({
        project_id: data.projectId,
        category: data.category,
        message: data.message,
        email: data.email,
        priority: data.priority || 'medium',
        screenshot_url: screenshotUrl,
        session_replay_url: sessionReplayUrl,
        metadata: data.metadata,
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to insert feedback:', error);
      return NextResponse.json(
        { error: { code: 'SUBMISSION_FAILED', message: 'Failed to submit feedback' } },
        { status: 500, headers: corsHeaders }
      );
    }

    const feedback = feedbackData as { id: string; status: string };

    return NextResponse.json({
      id: feedback.id,
      status: feedback.status,
    }, { headers: corsHeaders });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400, headers: corsHeaders }
      );
    }
    console.error('Widget submit error:', error);
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500, headers: corsHeaders }
    );
  }
}
