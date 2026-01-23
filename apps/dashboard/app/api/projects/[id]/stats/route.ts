import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import { checkProjectMembership } from '@/lib/supabase/membership';

interface FeedbackStatus {
  status: string;
}

interface FeedbackCategory {
  category: string;
}

interface FeedbackPriority {
  priority: string;
}

// GET /api/projects/[id]/stats - Get project statistics
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params;

    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Verify project membership
    const membership = await checkProjectMembership(user.id, projectId);
    if (!membership.isMember) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    const supabase = await createServerClient();

    // Get project info
    const { data: projectData } = await supabase
      .from('projects')
      .select('id, feedback_count, monthly_feedback_count')
      .eq('id', projectId)
      .single();

    if (!projectData) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    const project = projectData as unknown as { id: string; feedback_count: number; monthly_feedback_count: number };

    // Get feedback counts by status
    const { data: statusCounts } = await supabase
      .from('feedback')
      .select('status')
      .eq('project_id', projectId);

    const byStatus: Record<string, number> = {};
    statusCounts?.forEach((f: FeedbackStatus) => {
      byStatus[f.status] = (byStatus[f.status] || 0) + 1;
    });

    // Get feedback counts by category
    const { data: categoryCounts } = await supabase
      .from('feedback')
      .select('category')
      .eq('project_id', projectId);

    const byCategory: Record<string, number> = {};
    categoryCounts?.forEach((f: FeedbackCategory) => {
      byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    });

    // Get feedback counts by priority
    const { data: priorityCounts } = await supabase
      .from('feedback')
      .select('priority')
      .eq('project_id', projectId);

    const byPriority: Record<string, number> = {};
    priorityCounts?.forEach((f: FeedbackPriority) => {
      byPriority[f.priority] = (byPriority[f.priority] || 0) + 1;
    });

    // Calculate recent trend (last 7 days vs previous 7 days)
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const { count: recentCount } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .gte('created_at', sevenDaysAgo.toISOString());

    const { count: previousCount } = await supabase
      .from('feedback')
      .select('*', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .gte('created_at', fourteenDaysAgo.toISOString())
      .lt('created_at', sevenDaysAgo.toISOString());

    const recentTrend = previousCount && previousCount > 0
      ? Math.round(((recentCount || 0) - previousCount) / previousCount * 100)
      : 0;

    return NextResponse.json({
      totalFeedback: project.feedback_count,
      monthlyFeedback: project.monthly_feedback_count,
      byStatus,
      byCategory,
      byPriority,
      recentTrend,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}
