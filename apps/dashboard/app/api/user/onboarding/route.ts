import { NextRequest, NextResponse } from 'next/server';
import { createAuthClient, createServerClient } from '@/lib/supabase/server';
import type { OnboardingSteps, OnboardingStepName, OnboardingStepStatus, ONBOARDING_STEP_NAMES } from '@zapbolt/shared';

const VALID_STEP_NAMES: readonly OnboardingStepName[] = ['welcome', 'createProject', 'installWidget'];
const VALID_STATUSES: readonly OnboardingStepStatus[] = ['completed', 'skipped'];

// GET /api/user/onboarding - Fetch current onboarding steps
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('users')
      .select('onboarding_steps, onboarding_completed_at')
      .eq('id', user.id)
      .single();

    if (error) {
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: 'Failed to fetch onboarding status' } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      steps: data.onboarding_steps as OnboardingSteps | null,
      completedAt: data.onboarding_completed_at,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// PATCH /api/user/onboarding - Update a single step
export async function PATCH(request: NextRequest) {
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
    const { stepName, status } = body as { stepName: string; status: string };

    // Validate input
    if (!stepName || !status) {
      return NextResponse.json(
        { error: { code: 'INVALID_INPUT', message: 'stepName and status are required' } },
        { status: 400 }
      );
    }

    if (!VALID_STEP_NAMES.includes(stepName as OnboardingStepName)) {
      return NextResponse.json(
        { error: { code: 'INVALID_STEP', message: `Invalid step name: ${stepName}` } },
        { status: 400 }
      );
    }

    if (!VALID_STATUSES.includes(status as OnboardingStepStatus)) {
      return NextResponse.json(
        { error: { code: 'INVALID_STATUS', message: `Invalid status: ${status}` } },
        { status: 400 }
      );
    }

    const supabase = await createServerClient();

    // First, fetch current steps
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: currentData, error: fetchError } = await (supabase as any)
      .from('users')
      .select('onboarding_steps')
      .eq('id', user.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        { error: { code: 'FETCH_FAILED', message: 'Failed to fetch current onboarding status' } },
        { status: 500 }
      );
    }

    // Merge the new step with existing steps
    const currentSteps = (currentData.onboarding_steps as OnboardingSteps) || {};
    const updatedSteps: OnboardingSteps = {
      ...currentSteps,
      [stepName]: {
        status: status as OnboardingStepStatus,
        completedAt: new Date().toISOString(),
      },
    };

    // Update the database
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (supabase as any)
      .from('users')
      .update({ onboarding_steps: updatedSteps })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json(
        { error: { code: 'UPDATE_FAILED', message: 'Failed to update onboarding step' } },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, steps: updatedSteps });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/user/onboarding - Mark onboarding as complete
export async function POST() {
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('users')
      .update({ onboarding_completed_at: new Date().toISOString() })
      .eq('id', user.id);

    if (error) {
      return NextResponse.json(
        { error: { code: 'UPDATE_FAILED', message: 'Failed to update onboarding status' } },
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
