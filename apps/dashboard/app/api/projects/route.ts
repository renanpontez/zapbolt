import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient, ensureUserProfile } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Tables } from '@/lib/supabase/database.types';

type ProjectWithPatterns = Tables<'projects'> & { url_patterns: Tables<'url_patterns'>[] | null };

const createProjectSchema = z.object({
  name: z.string().min(2).max(50),
  domain: z.string().min(1),
});

// GET /api/projects - List all projects
export async function GET() {
  try {
    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const supabase = await createServerClient();
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        url_patterns (*)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: error.message } },
        { status: 500 }
      );
    }

    // Transform to match expected format
    const formattedProjects = projects.map((p: ProjectWithPatterns) => ({
      id: p.id,
      userId: p.user_id,
      name: p.name,
      domain: p.domain,
      apiKey: p.api_key,
      widgetConfig: p.widget_config,
      urlPatterns: p.url_patterns,
      tier: 'free', // TODO: Get from user
      feedbackCount: p.feedback_count,
      monthlyFeedbackCount: p.monthly_feedback_count,
      isActive: p.is_active,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
    }));

    return NextResponse.json(formattedProjects);
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: Request) {
  try {
    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, domain } = createProjectSchema.parse(body);

    // Ensure user profile exists (handles case where trigger didn't fire)
    await ensureUserProfile(user);

    const supabase = await createServerClient();

    // Check project limit based on tier
    const { count } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // TODO: Get actual tier from user profile
    const maxProjects = 1; // Free tier
    if (count && count >= maxProjects) {
      return NextResponse.json(
        { error: { code: 'LIMIT_REACHED', message: 'Project limit reached. Upgrade to create more projects.' } },
        { status: 403 }
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error } = await (supabase as any)
      .from('projects')
      .insert({
        user_id: user.id,
        name,
        domain,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 'CREATE_FAILED', message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: project.id,
      userId: project.user_id,
      name: project.name,
      domain: project.domain,
      apiKey: project.api_key,
      widgetConfig: project.widget_config,
      urlPatterns: [],
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
