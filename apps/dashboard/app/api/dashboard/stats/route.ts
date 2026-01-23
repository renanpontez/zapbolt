import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';

interface ProjectRow {
  id: string;
  is_active: boolean;
  feedback_count: number;
  monthly_feedback_count: number;
}

interface MembershipWithProject {
  project: ProjectRow | null;
}

interface FeedbackRow {
  status: string;
  category: string;
  priority: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  totalFeedback: number;
  newFeedback: number;
  feedbackByStatus: Record<string, number>;
  feedbackByCategory: Record<string, number>;
  feedbackByPriority: Record<string, number>;
  recentTrend: number;
}

// GET /api/dashboard/stats - Get aggregated dashboard statistics
export async function GET() {
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

    const supabase = await createServerClient();

    // Get all projects for the user via membership
    const { data: projects, error: projectsError } = await supabase
      .from('project_members')
      .select(`
        project:projects (
          id,
          is_active,
          feedback_count,
          monthly_feedback_count
        )
      `)
      .eq('user_id', user.id);

    if (projectsError) {
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: projectsError.message } },
        { status: 500 }
      );
    }

    // Extract projects from membership query result
    const memberships = projects as unknown as MembershipWithProject[] | null;
    const typedProjects = memberships
      ?.map((m) => m.project)
      .filter((p): p is ProjectRow => p !== null) || [];

    const projectIds = typedProjects.map((p) => p.id);
    const totalProjects = typedProjects.length;
    const activeProjects = typedProjects.filter((p) => p.is_active).length;

    // If no projects, return zero stats
    if (projectIds.length === 0) {
      return NextResponse.json({
        totalProjects: 0,
        activeProjects: 0,
        totalFeedback: 0,
        newFeedback: 0,
        feedbackByStatus: {},
        feedbackByCategory: {},
        feedbackByPriority: {},
        recentTrend: 0,
      } satisfies DashboardStats);
    }

    // Calculate total feedback from all projects
    const totalFeedback = typedProjects?.reduce(
      (sum, p) => sum + (p.feedback_count || 0),
      0
    ) || 0;

    // Get new feedback (status = 'new') count
    const { count: newFeedbackCount } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('status', 'new');

    // Get all feedback for breakdown by status, category, priority
    const { data: allFeedback } = await supabase
      .from('feedback')
      .select('status, category, priority')
      .in('project_id', projectIds);

    const feedbackByStatus: Record<string, number> = {};
    const feedbackByCategory: Record<string, number> = {};
    const feedbackByPriority: Record<string, number> = {};

    (allFeedback as FeedbackRow[] | null)?.forEach((f) => {
      if (f.status) {
        feedbackByStatus[f.status] = (feedbackByStatus[f.status] || 0) + 1;
      }
      if (f.category) {
        feedbackByCategory[f.category] = (feedbackByCategory[f.category] || 0) + 1;
      }
      if (f.priority) {
        feedbackByPriority[f.priority] = (feedbackByPriority[f.priority] || 0) + 1;
      }
    });

    // Calculate recent trend (last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const { count: recentCount } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .gte('created_at', sevenDaysAgo.toISOString());

    const { count: previousCount } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString());

    const recentTrend =
      previousCount && previousCount > 0
        ? Math.round(((recentCount || 0) - previousCount) / previousCount * 100)
        : 0;

    return NextResponse.json({
      totalProjects,
      activeProjects,
      totalFeedback,
      newFeedback: newFeedbackCount || 0,
      feedbackByStatus,
      feedbackByCategory,
      feedbackByPriority,
      recentTrend,
    } satisfies DashboardStats);
  } catch {
    return NextResponse.json(
      {
        error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    );
  }
}
