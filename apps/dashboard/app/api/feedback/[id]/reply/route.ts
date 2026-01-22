import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Tables } from '@/lib/supabase/database.types';

const createReplySchema = z.object({
  message: z.string().min(1, 'Message is required').max(5000, 'Message is too long'),
});

type FeedbackWithProject = Tables<'feedback'> & {
  projects: { user_id: string };
};

type FeedbackReplyRow = Tables<'feedback_replies'>;

// GET /api/feedback/[id]/reply - Get all replies for a feedback
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();

    // Verify ownership of the feedback
    const { data: feedbackData } = await supabase
      .from('feedback')
      .select(`
        id,
        projects!inner (user_id)
      `)
      .eq('id', id)
      .single();

    const feedback = feedbackData as unknown as { id: string; projects: { user_id: string } } | null;

    if (!feedback || feedback.projects.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    // Get all replies for this feedback
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: repliesData, error: repliesError } = await (supabase as any)
      .from('feedback_replies')
      .select('*')
      .eq('feedback_id', id)
      .order('created_at', { ascending: true });

    if (repliesError) {
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: 'Failed to fetch replies' } },
        { status: 500 }
      );
    }

    const replies = (repliesData || []) as FeedbackReplyRow[];

    return NextResponse.json({
      replies: replies.map((reply) => ({
        id: reply.id,
        feedbackId: reply.feedback_id,
        message: reply.message,
        sentBy: reply.sent_by,
        sentByEmail: reply.sent_by_email,
        createdAt: reply.created_at,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/feedback/[id]/reply - Send a reply to feedback
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { message } = createReplySchema.parse(body);

    const supabase = await createServerClient();

    // Get feedback with project info to verify ownership and check for email
    const { data: feedbackData, error: feedbackError } = await supabase
      .from('feedback')
      .select(`
        *,
        projects!inner (user_id)
      `)
      .eq('id', id)
      .single();

    if (feedbackError || !feedbackData) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    const feedback = feedbackData as unknown as FeedbackWithProject;

    // Verify ownership
    if (feedback.projects.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Check if feedback has an email to reply to
    if (!feedback.email) {
      return NextResponse.json(
        { error: { code: 'NO_EMAIL', message: 'This feedback does not have an email address to reply to' } },
        { status: 400 }
      );
    }

    // Insert the reply
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: reply, error: insertError } = await (supabase as any)
      .from('feedback_replies')
      .insert({
        feedback_id: id,
        message,
        sent_by: 'admin',
        sent_by_email: user.email || 'admin@example.com',
      })
      .select()
      .single();

    if (insertError || !reply) {
      return NextResponse.json(
        { error: { code: 'INSERT_FAILED', message: 'Failed to send reply' } },
        { status: 500 }
      );
    }

    // TODO: Actual email sending would go here
    // For now, we just log the email that would be sent
    console.log(`[Email Mock] Reply sent to ${feedback.email}:`, {
      from: user.email,
      to: feedback.email,
      subject: `Re: Your feedback`,
      body: message,
    });

    return NextResponse.json({
      id: reply.id,
      message: reply.message,
      createdAt: reply.created_at,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: error.errors[0].message } },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
