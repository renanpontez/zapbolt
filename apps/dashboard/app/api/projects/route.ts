import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient, ensureUserProfile } from '@/lib/supabase/server';
import { z } from 'zod';
import type { Tables } from '@/lib/supabase/database.types';
import type { ProjectMemberRole } from '@zapbolt/shared';

type ProjectWithPatterns = Tables<'projects'> & {
  url_patterns: Tables<'url_patterns'>[] | null;
  project_members?: { role: ProjectMemberRole }[];
};

const createProjectSchema = z.object({
  name: z.string().min(2).max(50),
  domain: z.string().min(1),
});

// GET /api/projects - List all projects the user is a member of
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

    // Get all projects where user is a member (RLS will filter automatically)
    const { data: projects, error } = await supabase
      .from('projects')
      .select(`
        *,
        url_patterns (*),
        project_members!inner (role)
      `)
      .eq('project_members.user_id', user.id)
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
      userId: p.created_by,
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
      currentUserRole: p.project_members?.[0]?.role || 'user',
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

    // Check project limit based on tier - count projects where user is admin
    const { count } = await supabase
      .from('project_members')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('role', 'admin');

    // TODO: Get actual tier from user profile
    const maxProjects = 1; // Free tier
    if (count && count >= maxProjects) {
      return NextResponse.json(
        { error: { code: 'LIMIT_REACHED', message: 'Project limit reached. Upgrade to create more projects.' } },
        { status: 403 }
      );
    }

    // Create the project
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: project, error } = await (supabase as any)
      .from('projects')
      .insert({
        created_by: user.id,
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

    // Create project_member entry with admin role
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: memberError } = await (supabase as any)
      .from('project_members')
      .insert({
        project_id: project.id,
        user_id: user.id,
        role: 'admin',
        invited_by: user.id,
        accepted_at: new Date().toISOString(),
      });

    if (memberError) {
      // If member creation fails, delete the project to maintain consistency
      await supabase.from('projects').delete().eq('id', project.id);
      return NextResponse.json(
        { error: { code: 'CREATE_FAILED', message: 'Failed to set up project membership' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      id: project.id,
      userId: project.created_by,
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
      currentUserRole: 'admin',
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
