import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import {
  checkProjectMembership,
  requireProjectAdmin,
  getProjectMembers,
  addProjectMemberByEmail,
} from '@/lib/supabase/membership';
import { z } from 'zod';
import type { ProjectMemberRole } from '@zapbolt/shared';

const addMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['user', 'admin']).default('user'),
});

// GET /api/projects/[id]/members - List project members
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

    // Verify membership
    const membership = await checkProjectMembership(user.id, projectId);
    if (!membership.isMember) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Project not found' } },
        { status: 404 }
      );
    }

    // Get project members
    const members = await getProjectMembers(projectId);

    // Transform to expected format
    const formattedMembers = members.map((m) => {
      const member = m as {
        id: string;
        role: ProjectMemberRole;
        invited_at: string;
        accepted_at: string | null;
        user: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          work_email: string | null;
        } | null;
        invited_by_user: {
          id: string;
          email: string;
          name: string | null;
        } | null;
      };
      return {
        id: member.id,
        projectId,
        userId: member.user?.id || '',
        role: member.role,
        invitedAt: member.invited_at,
        acceptedAt: member.accepted_at,
        user: member.user ? {
          id: member.user.id,
          email: member.user.email,
          name: member.user.name || undefined,
          avatarUrl: member.user.avatar_url || undefined,
          workEmail: member.user.work_email || undefined,
        } : undefined,
        invitedByUser: member.invited_by_user ? {
          id: member.invited_by_user.id,
          email: member.invited_by_user.email,
          name: member.invited_by_user.name || undefined,
        } : undefined,
      };
    });

    return NextResponse.json({
      members: formattedMembers,
      currentUserRole: membership.role,
    });
  } catch {
    return NextResponse.json(
      { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
      { status: 500 }
    );
  }
}

// POST /api/projects/[id]/members - Add member by email (admin only)
export async function POST(
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

    // Verify admin access
    const isAdmin = await requireProjectAdmin(user.id, projectId);
    if (!isAdmin) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only project admins can add members' } },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { email, role } = addMemberSchema.parse(body);

    // Add the member
    const result = await addProjectMemberByEmail(projectId, email, role, user.id);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'ADD_MEMBER_FAILED', message: result.error } },
        { status: 400 }
      );
    }

    // Return updated member list
    const members = await getProjectMembers(projectId);
    const formattedMembers = members.map((m) => {
      const member = m as {
        id: string;
        role: ProjectMemberRole;
        invited_at: string;
        accepted_at: string | null;
        user: {
          id: string;
          email: string;
          name: string | null;
          avatar_url: string | null;
          work_email: string | null;
        } | null;
        invited_by_user: {
          id: string;
          email: string;
          name: string | null;
        } | null;
      };
      return {
        id: member.id,
        projectId,
        userId: member.user?.id || '',
        role: member.role,
        invitedAt: member.invited_at,
        acceptedAt: member.accepted_at,
        user: member.user ? {
          id: member.user.id,
          email: member.user.email,
          name: member.user.name || undefined,
          avatarUrl: member.user.avatar_url || undefined,
          workEmail: member.user.work_email || undefined,
        } : undefined,
        invitedByUser: member.invited_by_user ? {
          id: member.invited_by_user.id,
          email: member.invited_by_user.email,
          name: member.invited_by_user.name || undefined,
        } : undefined,
      };
    });

    return NextResponse.json({
      success: true,
      memberId: result.memberId,
      members: formattedMembers,
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
