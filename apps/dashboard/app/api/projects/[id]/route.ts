import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Tables } from '@/lib/supabase/database.types';

const updateProjectSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  domain: z.string().min(1).optional(),
  widgetConfig: z.record(z.unknown()).optional(),
  isActive: z.boolean().optional(),
});

type ProjectWithPatterns = Tables<'projects'> & {
  url_patterns: Tables<'url_patterns'>[] | null;
};

// GET /api/projects/[id] - Get a single project
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
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        url_patterns (*)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    const project = data as unknown as ProjectWithPatterns;

    return NextResponse.json({
      id: project.id,
      userId: project.user_id,
      name: project.name,
      domain: project.domain,
      apiKey: project.api_key,
      widgetConfig: project.widget_config,
      urlPatterns: project.url_patterns,
      tier: 'free',
      feedbackCount: project.feedback_count,
      monthlyFeedbackCount: project.monthly_feedback_count,
      isActive: project.is_active,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// PATCH /api/projects/[id] - Update a project
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
    const updates = updateProjectSchema.parse(body);

    const supabase = await createServerClient();

    // Build update object
    const updateData: Record<string, unknown> = {};
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.domain !== undefined) updateData.domain = updates.domain;
    if (updates.widgetConfig !== undefined) updateData.widget_config = updates.widgetConfig;
    if (updates.isActive !== undefined) updateData.is_active = updates.isActive;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('projects')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select(`
        *,
        url_patterns (*)
      `)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: 'UPDATE_FAILED', message: 'Failed to update project' } },
        { status: 500 }
      );
    }

    const project = data as unknown as ProjectWithPatterns;

    return NextResponse.json({
      id: project.id,
      userId: project.user_id,
      name: project.name,
      domain: project.domain,
      apiKey: project.api_key,
      widgetConfig: project.widget_config,
      urlPatterns: project.url_patterns,
      tier: 'free',
      feedbackCount: project.feedback_count,
      monthlyFeedbackCount: project.monthly_feedback_count,
      isActive: project.is_active,
      createdAt: project.created_at,
      updatedAt: project.updated_at,
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

// DELETE /api/projects/[id] - Delete a project
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
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: { code: 'DELETE_FAILED', message: 'Failed to delete project' } },
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
