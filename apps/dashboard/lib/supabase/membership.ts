import { createServerClient } from './server';
import type { ProjectMemberRole } from '@zapbolt/shared';

export interface MembershipInfo {
  isMember: boolean;
  role: ProjectMemberRole | null;
  isAdmin: boolean;
}

/**
 * Check if a user is a member of a project and get their role
 */
export async function checkProjectMembership(
  userId: string,
  projectId: string
): Promise<MembershipInfo> {
  const supabase = await createServerClient();

  const { data: membership, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .single();

  if (error || !membership) {
    return {
      isMember: false,
      role: null,
      isAdmin: false,
    };
  }

  const membershipData = membership as { role: 'user' | 'admin' };

  return {
    isMember: true,
    role: membershipData.role as ProjectMemberRole,
    isAdmin: membershipData.role === 'admin',
  };
}

/**
 * Require that a user is an admin of a project
 * Returns true if admin, throws or returns false if not
 */
export async function requireProjectAdmin(
  userId: string,
  projectId: string
): Promise<boolean> {
  const { isAdmin } = await checkProjectMembership(userId, projectId);
  return isAdmin;
}

/**
 * Require that a user is a member of a project
 * Returns membership info if member, throws or returns null if not
 */
export async function requireProjectMember(
  userId: string,
  projectId: string
): Promise<MembershipInfo | null> {
  const membership = await checkProjectMembership(userId, projectId);
  if (!membership.isMember) {
    return null;
  }
  return membership;
}

/**
 * Get all members of a project
 */
export async function getProjectMembers(projectId: string) {
  const supabase = await createServerClient();

  const { data: members, error } = await supabase
    .from('project_members')
    .select(`
      id,
      role,
      invited_at,
      accepted_at,
      user:users!project_members_user_id_fkey (
        id,
        email,
        name,
        avatar_url,
        work_email
      ),
      invited_by_user:users!project_members_invited_by_fkey (
        id,
        email,
        name
      )
    `)
    .eq('project_id', projectId)
    .order('invited_at', { ascending: true });

  if (error) {
    console.error('Failed to get project members:', error);
    return [];
  }

  return members;
}

/**
 * Add a member to a project by email
 * Returns the user if found, null if not registered
 */
export async function addProjectMemberByEmail(
  projectId: string,
  email: string,
  role: ProjectMemberRole,
  invitedBy: string
): Promise<{ success: boolean; error?: string; memberId?: string }> {
  const supabase = await createServerClient();

  // First, find the user by email or work_email
  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, email, name')
    .or(`email.eq.${email},work_email.eq.${email}`)
    .single();

  if (userError || !user) {
    return {
      success: false,
      error: 'User not registered. They need to create an account first.',
    };
  }

  const userData = user as { id: string; email: string; name: string | null };

  // Check if already a member
  const { data: existingMember } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userData.id)
    .single();

  if (existingMember) {
    return {
      success: false,
      error: 'User is already a member of this project.',
    };
  }

  // Add the member
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member, error: insertError } = await (supabase as any)
    .from('project_members')
    .insert({
      project_id: projectId,
      user_id: userData.id,
      role,
      invited_by: invitedBy,
      accepted_at: new Date().toISOString(), // Auto-accept for now
    })
    .select('id')
    .single();

  if (insertError) {
    console.error('Failed to add project member:', insertError);
    return {
      success: false,
      error: 'Failed to add member to project.',
    };
  }

  return {
    success: true,
    memberId: member.id,
  };
}

/**
 * Update a project member's role
 */
export async function updateProjectMemberRole(
  memberId: string,
  newRole: ProjectMemberRole
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('project_members')
    .update({ role: newRole })
    .eq('id', memberId);

  if (error) {
    // Check if it's the "last admin" error
    if (error.message?.includes('last admin')) {
      return {
        success: false,
        error: 'Cannot demote the last admin of a project.',
      };
    }
    console.error('Failed to update project member role:', error);
    return {
      success: false,
      error: 'Failed to update member role.',
    };
  }

  return { success: true };
}

/**
 * Remove a project member
 */
export async function removeProjectMember(
  memberId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerClient();

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('id', memberId);

  if (error) {
    // Check if it's the "last admin" error
    if (error.message?.includes('last admin')) {
      return {
        success: false,
        error: 'Cannot remove the last admin from a project.',
      };
    }
    console.error('Failed to remove project member:', error);
    return {
      success: false,
      error: 'Failed to remove member from project.',
    };
  }

  return { success: true };
}

interface ProjectMemberInfo {
  id: string;
  project_id: string;
  user_id: string;
  role: 'user' | 'admin';
  invited_at: string;
  accepted_at: string | null;
}

/**
 * Get membership info for a specific member
 */
export async function getProjectMember(memberId: string): Promise<ProjectMemberInfo | null> {
  const supabase = await createServerClient();

  const { data: member, error } = await supabase
    .from('project_members')
    .select(`
      id,
      project_id,
      user_id,
      role,
      invited_at,
      accepted_at
    `)
    .eq('id', memberId)
    .single();

  if (error || !member) {
    return null;
  }

  return member as ProjectMemberInfo;
}
