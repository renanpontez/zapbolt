import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Tables } from '@/lib/supabase/database.types';

const updateFeedbackSchema = z.object({
  status: z.enum(['new', 'in_progress', 'resolved', 'closed', 'archived']).optional(),
  internalNotes: z.string().optional(),
});

type FeedbackWithProject = Tables<'feedback'> & {
  projects: { user_id: string };
};

// GET /api/feedback/[id] - Get a single feedback item
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

    // Get feedback with project info to verify ownership
    const { data, error } = await supabase
      .from('feedback')
      .select(`
        *,
        projects!inner (user_id)
      `)
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    const feedback = data as unknown as FeedbackWithProject;

    // Verify ownership
    if (feedback.projects.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    return NextResponse.json({
      id: feedback.id,
      projectId: feedback.project_id,
      category: feedback.category,
      message: feedback.message,
      email: feedback.email,
      priority: feedback.priority,
      status: feedback.status,
      screenshotUrl: feedback.screenshot_url,
      sessionReplayUrl: feedback.session_replay_url,
      metadata: feedback.metadata,
      internalNotes: feedback.internal_notes,
      createdAt: feedback.created_at,
      updatedAt: feedback.updated_at,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// PATCH /api/feedback/[id] - Update a feedback item
export async function PATCH(
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
    const updates = updateFeedbackSchema.parse(body);

    const supabase = await createServerClient();

    // Verify ownership first
    const { data: existingData } = await supabase
      .from('feedback')
      .select(`
        id,
        projects!inner (user_id)
      `)
      .eq('id', id)
      .single();

    const existing = existingData as unknown as { id: string; projects: { user_id: string } } | null;

    if (!existing || existing.projects.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.internalNotes !== undefined) updateData.internal_notes = updates.internalNotes;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: feedbackData, error } = await (supabase as any)
      .from('feedback')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error || !feedbackData) {
      return NextResponse.json(
        { error: { code: 'UPDATE_FAILED', message: 'Failed to update feedback' } },
        { status: 500 }
      );
    }

    const feedback = feedbackData as Tables<'feedback'>;

    return NextResponse.json({
      id: feedback.id,
      projectId: feedback.project_id,
      category: feedback.category,
      message: feedback.message,
      email: feedback.email,
      priority: feedback.priority,
      status: feedback.status,
      screenshotUrl: feedback.screenshot_url,
      sessionReplayUrl: feedback.session_replay_url,
      metadata: feedback.metadata,
      internalNotes: feedback.internal_notes,
      createdAt: feedback.created_at,
      updatedAt: feedback.updated_at,
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

// DELETE /api/feedback/[id] - Delete a feedback item
export async function DELETE(
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

    // Verify ownership first
    const { data: existingData } = await supabase
      .from('feedback')
      .select(`
        id,
        projects!inner (user_id)
      `)
      .eq('id', id)
      .single();

    const existing = existingData as unknown as { id: string; projects: { user_id: string } } | null;

    if (!existing || existing.projects.user_id !== user.id) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    const { error } = await supabase
      .from('feedback')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: { code: 'DELETE_FAILED', message: 'Failed to delete feedback' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
