import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import { checkProjectMembership, requireProjectAdmin } from '@/lib/supabase/membership';
import { z } from 'zod';
import type { Tables } from '@/lib/supabase/database.types';

const updateFeedbackSchema = z.object({
  status: z.enum(['new', 'in_progress', 'resolved', 'closed', 'archived']).optional(),
  category: z.enum(['bug', 'feature', 'improvement', 'question', 'other']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  internalNotes: z.string().optional(),
});

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

    // Get feedback with project info
    const { data, error } = await supabase
      .from('feedback')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    const feedback = data as Tables<'feedback'>;

    // Verify membership
    const membership = await checkProjectMembership(user.id, feedback.project_id);
    if (!membership.isMember) {
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

// PATCH /api/feedback/[id] - Update a feedback item (admin only)
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

    // Get current feedback to check project membership and capture old values for change log
    const { data: patchFeedbackData } = await supabase
      .from('feedback')
      .select('id, project_id, status, category, priority')
      .eq('id', id)
      .single();

    if (!patchFeedbackData) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    const currentFeedback = patchFeedbackData as {
      id: string;
      project_id: string;
      status: string;
      category: string;
      priority: string;
    };

    // Verify admin access
    const isAdmin = await requireProjectAdmin(user.id, currentFeedback.project_id);
    if (!isAdmin) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only project admins can update feedback' } },
        { status: 403 }
      );
    }

    // Build update object and track changes for logging
    const updateData: Record<string, unknown> = {};
    const changeLogs: { field: 'status' | 'category' | 'priority'; old_value: string; new_value: string }[] = [];

    if (updates.status !== undefined && updates.status !== currentFeedback.status) {
      updateData.status = updates.status;
      changeLogs.push({ field: 'status', old_value: currentFeedback.status, new_value: updates.status });
    }
    if (updates.category !== undefined && updates.category !== currentFeedback.category) {
      updateData.category = updates.category;
      changeLogs.push({ field: 'category', old_value: currentFeedback.category, new_value: updates.category });
    }
    if (updates.priority !== undefined && updates.priority !== currentFeedback.priority) {
      updateData.priority = updates.priority;
      changeLogs.push({ field: 'priority', old_value: currentFeedback.priority, new_value: updates.priority });
    }
    if (updates.internalNotes !== undefined) {
      updateData.internal_notes = updates.internalNotes;
    }

    // Only update if there are changes
    if (Object.keys(updateData).length === 0) {
      // No changes, return current feedback
      const { data: noChangesFeedbackData } = await supabase
        .from('feedback')
        .select('*')
        .eq('id', id)
        .single();

      if (!noChangesFeedbackData) {
        return NextResponse.json(
          { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
          { status: 404 }
        );
      }

      const noChangesFeedback = noChangesFeedbackData as Tables<'feedback'>;
      return NextResponse.json({
        id: noChangesFeedback.id,
        projectId: noChangesFeedback.project_id,
        category: noChangesFeedback.category,
        message: noChangesFeedback.message,
        email: noChangesFeedback.email,
        priority: noChangesFeedback.priority,
        status: noChangesFeedback.status,
        screenshotUrl: noChangesFeedback.screenshot_url,
        sessionReplayUrl: noChangesFeedback.session_replay_url,
        metadata: noChangesFeedback.metadata,
        internalNotes: noChangesFeedback.internal_notes,
        createdAt: noChangesFeedback.created_at,
        updatedAt: noChangesFeedback.updated_at,
      });
    }

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

    // Log changes to feedback_change_logs
    if (changeLogs.length > 0) {
      const changeLogEntries = changeLogs.map(log => ({
        feedback_id: id,
        field: log.field,
        old_value: log.old_value,
        new_value: log.new_value,
        changed_by: user.id,
      }));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from('feedback_change_logs')
        .insert(changeLogEntries);
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

// DELETE /api/feedback/[id] - Delete a feedback item (admin only)
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

    // Get feedback to check project membership
    const { data: deleteFeedbackData } = await supabase
      .from('feedback')
      .select('id, project_id')
      .eq('id', id)
      .single();

    if (!deleteFeedbackData) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    const deleteFeedback = deleteFeedbackData as { id: string; project_id: string };

    // Verify admin access
    const isAdminForDelete = await requireProjectAdmin(user.id, deleteFeedback.project_id);
    if (!isAdminForDelete) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only project admins can delete feedback' } },
        { status: 403 }
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
