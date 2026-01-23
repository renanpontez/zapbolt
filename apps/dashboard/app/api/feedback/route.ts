import { NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';

// Valid sort columns for feedback
const VALID_SORT_COLUMNS = ['created_at', 'status', 'priority', 'category'] as const;
type SortColumn = (typeof VALID_SORT_COLUMNS)[number];

// Valid sort orders
const VALID_SORT_ORDERS = ['asc', 'desc'] as const;
type SortOrder = (typeof VALID_SORT_ORDERS)[number];

function isValidSortColumn(value: string): value is SortColumn {
  return VALID_SORT_COLUMNS.includes(value as SortColumn);
}

function isValidSortOrder(value: string): value is SortOrder {
  return VALID_SORT_ORDERS.includes(value as SortOrder);
}

type FeedbackWithProject = Tables<'feedback'> & {
  projects: { id: string; name: string };
};

// GET /api/feedback - List all feedback across all user's projects
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

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

    // Parse filters
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '20');
    const status = searchParams.get('status')?.split(',').filter(Boolean);
    const category = searchParams.get('category')?.split(',').filter(Boolean);
    const priority = searchParams.get('priority')?.split(',').filter(Boolean);
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const projectId = searchParams.get('projectId');

    // Parse sort params with validation
    const sortByParam = searchParams.get('sortBy') || 'created_at';
    const sortOrderParam = searchParams.get('sortOrder') || 'desc';

    const sortBy: SortColumn = isValidSortColumn(sortByParam)
      ? sortByParam
      : 'created_at';
    const sortOrder: SortOrder = isValidSortOrder(sortOrderParam)
      ? sortOrderParam
      : 'desc';

    // Get all project IDs where user is a member
    const { data: userMemberships, error: membershipsError } = await supabase
      .from('project_members')
      .select('project_id')
      .eq('user_id', user.id);

    if (membershipsError) {
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: membershipsError.message } },
        { status: 500 }
      );
    }

    const userProjectIds = (userMemberships as { project_id: string }[])?.map((m) => m.project_id) || [];

    if (userProjectIds.length === 0) {
      // User has no projects, return empty result
      return NextResponse.json({
        items: [],
        total: 0,
        page,
        pageSize,
        totalPages: 0,
        hasMore: false,
      });
    }

    // Build query for feedback with project info
    let query = supabase
      .from('feedback')
      .select(
        `
        *,
        projects!inner (id, name)
      `,
        { count: 'exact' }
      )
      .in('project_id', userProjectIds);

    // Filter by specific project if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    if (status?.length) {
      query = query.in('status', status);
    }
    if (category?.length) {
      query = query.in('category', category);
    }
    if (priority?.length) {
      query = query.in('priority', priority);
    }
    if (search) {
      query = query.ilike('message', `%${search}%`);
    }

    // Date range filters
    if (startDate) {
      query = query.gte('created_at', `${startDate}T00:00:00.000Z`);
    }
    if (endDate) {
      query = query.lte('created_at', `${endDate}T23:59:59.999Z`);
    }

    // Pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    const {
      data: feedback,
      error,
      count,
    } = await query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    if (error) {
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: error.message } },
        { status: 500 }
      );
    }

    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);

    // Transform to match expected format, including project info
    const items = (feedback as unknown as FeedbackWithProject[]).map((f) => ({
      id: f.id,
      projectId: f.project_id,
      projectName: f.projects.name,
      category: f.category,
      message: f.message,
      email: f.email,
      priority: f.priority,
      status: f.status,
      screenshotUrl: f.screenshot_url,
      sessionReplayUrl: f.session_replay_url,
      metadata: f.metadata,
      internalNotes: f.internal_notes,
      createdAt: f.created_at,
      updatedAt: f.updated_at,
    }));

    return NextResponse.json({
      items,
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    });
  } catch {
    return NextResponse.json(
      {
        error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' },
      },
      { status: 500 }
    );
  }
}
