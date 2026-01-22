import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Tables } from '@/lib/supabase/database.types';

const bulkUpdateSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
  status: z.enum(['new', 'in_progress', 'resolved', 'closed', 'archived']),
});

const bulkDeleteSchema = z.object({
  ids: z.array(z.string().uuid()).min(1, 'At least one ID is required'),
});

type FeedbackWithProject = Tables<'feedback'> & {
  projects: { user_id: string };
};

// PATCH /api/feedback/bulk - Bulk update status
export async function PATCH(request: Request) {
  try {
    const authClient = await createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ids, status } = bulkUpdateSchema.parse(body);

    const supabase = await createServerClient();

    // Verify ownership of all feedback items
    const { data: feedbackItems, error: fetchError } = await supabase
      .from('feedback')
      .select(
        `
        id,
        projects!inner (user_id)
      `
      )
      .in('id', ids);

    if (fetchError) {
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: 'Failed to fetch feedback items' } },
        { status: 500 }
      );
    }

    const items = feedbackItems as unknown as Array<{
      id: string;
      projects: { user_id: string };
    }>;

    // Check that all items belong to the user
    const unauthorizedItems = items.filter((item) => item.projects.user_id !== user.id);
    if (unauthorizedItems.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to update some of these feedback items',
          },
        },
        { status: 403 }
      );
    }

    // Check if all requested items were found
    const foundIds = new Set(items.map((item) => item.id));
    const missingIds = ids.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Some feedback items were not found: ${missingIds.join(', ')}`,
          },
        },
        { status: 404 }
      );
    }

    // Perform bulk update
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError, count } = await (supabase as any)
      .from('feedback')
      .update({ status, updated_at: new Date().toISOString() })
      .in('id', ids);

    if (updateError) {
      return NextResponse.json(
        { error: { code: 'UPDATE_FAILED', message: 'Failed to update feedback items' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ updated: count ?? ids.length });
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

// DELETE /api/feedback/bulk - Bulk delete
export async function DELETE(request: Request) {
  try {
    const authClient = await createAuthClient();
    const {
      data: { user },
      error: authError,
    } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { ids } = bulkDeleteSchema.parse(body);

    const supabase = await createServerClient();

    // Verify ownership of all feedback items
    const { data: feedbackItems, error: fetchError } = await supabase
      .from('feedback')
      .select(
        `
        id,
        projects!inner (user_id)
      `
      )
      .in('id', ids);

    if (fetchError) {
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: 'Failed to fetch feedback items' } },
        { status: 500 }
      );
    }

    const items = feedbackItems as unknown as Array<{
      id: string;
      projects: { user_id: string };
    }>;

    // Check that all items belong to the user
    const unauthorizedItems = items.filter((item) => item.projects.user_id !== user.id);
    if (unauthorizedItems.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'FORBIDDEN',
            message: 'You do not have permission to delete some of these feedback items',
          },
        },
        { status: 403 }
      );
    }

    // Check if all requested items were found
    const foundIds = new Set(items.map((item) => item.id));
    const missingIds = ids.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        {
          error: {
            code: 'NOT_FOUND',
            message: `Some feedback items were not found: ${missingIds.join(', ')}`,
          },
        },
        { status: 404 }
      );
    }

    // Perform bulk delete
    const { error: deleteError, count } = await supabase
      .from('feedback')
      .delete()
      .in('id', ids);

    if (deleteError) {
      return NextResponse.json(
        { error: { code: 'DELETE_FAILED', message: 'Failed to delete feedback items' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ deleted: count ?? ids.length });
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
