import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/database.types';

// CORS headers for widget cross-origin requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// OPTIONS /api/widget/init - Handle CORS preflight
export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

// GET /api/widget/init - Initialize widget configuration (public endpoint)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    if (!projectId) {
      return NextResponse.json(
        { error: { code: 'MISSING_PROJECT_ID', message: 'Project ID is required' } },
        { status: 400, headers: corsHeaders }
      );
    }

    const supabase = await createServerClient();

    const { data: projectData, error } = await supabase
      .from('projects')
      .select(`
        id,
        widget_config,
        is_active,
        url_patterns (*),
        users!inner (tier)
      `)
      .eq('id', projectId)
      .single();

    if (error || !projectData) {
      return NextResponse.json(
        { error: { code: 'PROJECT_NOT_FOUND', message: 'Project not found' } },
        { status: 404, headers: corsHeaders }
      );
    }

    type ProjectResult = {
      id: string;
      widget_config: Record<string, unknown>;
      is_active: boolean;
      url_patterns: Tables<'url_patterns'>[] | null;
      users: { tier: string };
    };
    const project = projectData as unknown as ProjectResult;

    if (!project.is_active) {
      return NextResponse.json(
        { error: { code: 'PROJECT_INACTIVE', message: 'This project is currently inactive' } },
        { status: 403, headers: corsHeaders }
      );
    }

    const config = project.widget_config as Record<string, unknown>;
    const tier = project.users?.tier || 'free';

    // Disable Pro features for free tier
    if (tier === 'free') {
      config.enableSessionReplay = false;
      config.showBranding = true;
    }

    return NextResponse.json({
      config: {
        position: config.position || 'bottom-right',
        primaryColor: config.primaryColor || '#3b82f6',
        textColor: config.textColor || '#ffffff',
        buttonText: config.buttonText || 'Feedback',
        showBranding: config.showBranding ?? true,
        categories: config.categories || ['Bug', 'Feature', 'Improvement', 'Question', 'Other'],
        collectEmail: config.collectEmail || 'optional',
        enableScreenshot: config.enableScreenshot ?? true,
        enableSessionReplay: config.enableSessionReplay ?? false,
      },
      urlPatterns: project.url_patterns?.map((p: Tables<'url_patterns'>) => ({
        pattern: p.pattern,
        type: p.type,
      })) || [],
      tier,
    }, { headers: corsHeaders });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500, headers: corsHeaders }
    );
  }
}
