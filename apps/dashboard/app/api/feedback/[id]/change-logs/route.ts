import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import { checkProjectMembership } from '@/lib/supabase/membership';
import type { Tables } from '@/lib/supabase/database.types';

interface ChangeLogWithUser {
  id: string;
  feedback_id: string;
  field: 'status' | 'category' | 'priority';
  old_value: string;
  new_value: string;
  changed_by: string;
  created_at: string;
  users: {
    id: string;
    email: string;
    name: string | null;
  };
}

// GET /api/feedback/[id]/change-logs - Get change logs for a feedback item
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

    // Get feedback to verify access
    const { data: feedbackData } = await supabase
      .from('feedback')
      .select('id, project_id')
      .eq('id', id)
      .single();

    if (!feedbackData) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Feedback not found' } },
        { status: 404 }
      );
    }

    const feedback = feedbackData as { id: string; project_id: string };

    // Verify membership
    const membership = await checkProjectMembership(user.id, feedback.project_id);
    if (!membership.isMember) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      );
    }

    // Get change logs with user info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: logsData, error: logsError } = await (supabase as any)
      .from('feedback_change_logs')
      .select(`
        id,
        feedback_id,
        field,
        old_value,
        new_value,
        changed_by,
        created_at,
        users:changed_by (
          id,
          email,
          name
        )
      `)
      .eq('feedback_id', id)
      .order('created_at', { ascending: false });

    if (logsError) {
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: 'Failed to fetch change logs' } },
        { status: 500 }
      );
    }

    const logs = (logsData || []) as ChangeLogWithUser[];

    return NextResponse.json({
      logs: logs.map(log => ({
        id: log.id,
        feedbackId: log.feedback_id,
        field: log.field,
        oldValue: log.old_value,
        newValue: log.new_value,
        changedBy: log.changed_by,
        changedByEmail: log.users?.email || '',
        changedByName: log.users?.name || null,
        createdAt: log.created_at,
      })),
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
