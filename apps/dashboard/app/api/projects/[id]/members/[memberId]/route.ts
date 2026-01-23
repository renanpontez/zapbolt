import { NextResponse } from 'next/server';
import { createAuthClient } from '@/lib/supabase/server';
import {
  requireProjectAdmin,
  checkProjectMembership,
  updateProjectMemberRole,
  removeProjectMember,
  getProjectMember,
} from '@/lib/supabase/membership';
import { z } from 'zod';

const updateMemberSchema = z.object({
  role: z.enum(['user', 'admin']),
});

// PATCH /api/projects/[id]/members/[memberId] - Update member role (admin only)
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: projectId, memberId } = await params;

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
        { error: { code: 'FORBIDDEN', message: 'Only project admins can update member roles' } },
        { status: 403 }
      );
    }

    // Verify the member belongs to this project
    const member = await getProjectMember(memberId);
    if (!member || member.project_id !== projectId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { role } = updateMemberSchema.parse(body);

    // Update the role
    const result = await updateProjectMemberRole(memberId, role);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'UPDATE_FAILED', message: result.error } },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
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

// DELETE /api/projects/[id]/members/[memberId] - Remove member
// Admins can remove any member, or users can remove themselves (leave project)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { id: projectId, memberId } = await params;

    const authClient = await createAuthClient();
    const { data: { user }, error: authError } = await authClient.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      );
    }

    // Verify the member belongs to this project
    const member = await getProjectMember(memberId);
    if (!member || member.project_id !== projectId) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Member not found' } },
        { status: 404 }
      );
    }

    // Check if user is trying to leave themselves OR is an admin
    const membership = await checkProjectMembership(user.id, projectId);
    const isLeavingSelf = member.user_id === user.id;
    const isAdmin = membership.isAdmin;

    if (!isLeavingSelf && !isAdmin) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Only project admins can remove other members' } },
        { status: 403 }
      );
    }

    // Remove the member
    const result = await removeProjectMember(memberId);

    if (!result.success) {
      return NextResponse.json(
        { error: { code: 'REMOVE_FAILED', message: result.error } },
        { status: 400 }
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
