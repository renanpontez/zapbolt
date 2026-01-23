'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2, UserPlus, MoreVertical, Shield, User, Trash2 } from 'lucide-react';
import type { ProjectMember, ProjectMemberRole } from '@zapbolt/shared';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const addMemberSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  role: z.enum(['user', 'admin']),
});

type AddMemberFormData = z.infer<typeof addMemberSchema>;

interface MembersResponse {
  members: ProjectMember[];
  currentUserRole: ProjectMemberRole;
}

interface ProjectMembersProps {
  projectId: string;
}

async function fetchMembers(projectId: string): Promise<MembersResponse> {
  const response = await fetch(`/api/projects/${projectId}/members`);
  if (!response.ok) {
    throw new Error('Failed to fetch members');
  }
  return response.json();
}

async function addMember(projectId: string, data: AddMemberFormData) {
  const response = await fetch(`/api/projects/${projectId}/members`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to add member');
  }
  return result;
}

async function updateMemberRole(projectId: string, memberId: string, role: ProjectMemberRole) {
  const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ role }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to update member role');
  }
  return result;
}

async function removeMember(projectId: string, memberId: string) {
  const response = await fetch(`/api/projects/${projectId}/members/${memberId}`, {
    method: 'DELETE',
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(result.error?.message || 'Failed to remove member');
  }
  return result;
}

function getInitials(name?: string, email?: string): string {
  if (name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  }
  if (email) {
    return email[0].toUpperCase();
  }
  return '?';
}

export function ProjectMembers({ projectId }: ProjectMembersProps) {
  const queryClient = useQueryClient();
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<ProjectMember | null>(null);
  const [addError, setAddError] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => fetchMembers(projectId),
  });

  const addMemberMutation = useMutation({
    mutationFn: (formData: AddMemberFormData) => addMember(projectId, formData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      setAddDialogOpen(false);
      setAddError(null);
      form.reset();
    },
    onError: (error: Error) => {
      setAddError(error.message);
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ memberId, role }: { memberId: string; role: ProjectMemberRole }) =>
      updateMemberRole(projectId, memberId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (memberId: string) => removeMember(projectId, memberId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project-members', projectId] });
      setRemoveDialogOpen(false);
      setSelectedMember(null);
    },
  });

  const form = useForm<AddMemberFormData>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      email: '',
      role: 'user',
    },
  });

  const handleAddMember = (formData: AddMemberFormData) => {
    setAddError(null);
    addMemberMutation.mutate(formData);
  };

  const handleRoleChange = (memberId: string, role: ProjectMemberRole) => {
    updateRoleMutation.mutate({ memberId, role });
  };

  const handleRemoveMember = () => {
    if (selectedMember) {
      removeMemberMutation.mutate(selectedMember.id);
    }
  };

  const isAdmin = data?.currentUserRole === 'admin';

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Team Members
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load team members</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Team Members
              </CardTitle>
              <CardDescription>
                Manage who has access to this project
              </CardDescription>
            </div>
            {isAdmin && (
              <Button onClick={() => setAddDialogOpen(true)} size="sm">
                <UserPlus className="h-4 w-4 mr-2" />
                Add Member
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data?.members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between py-2"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={member.user?.avatarUrl} />
                    <AvatarFallback>
                      {getInitials(member.user?.name, member.user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {member.user?.name || member.user?.email || 'Unknown'}
                      </span>
                      <Badge
                        variant={member.role === 'admin' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {member.role === 'admin' ? (
                          <><Shield className="h-3 w-3 mr-1" /> Admin</>
                        ) : (
                          'Read-only'
                        )}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {member.user?.email}
                    </p>
                  </div>
                </div>

                {isAdmin && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {member.role === 'user' ? (
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(member.id, 'admin')}
                          disabled={updateRoleMutation.isPending}
                        >
                          <Shield className="h-4 w-4 mr-2" />
                          Make Admin
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => handleRoleChange(member.id, 'user')}
                          disabled={updateRoleMutation.isPending}
                        >
                          <User className="h-4 w-4 mr-2" />
                          Make Read-only
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          setSelectedMember(member);
                          setRemoveDialogOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            ))}

            {data?.members.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No team members yet
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Add Member Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a user to this project. They must have a Zapbolt account.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleAddMember)}>
            <div className="space-y-4 py-4">
              {addError && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                  {addError}
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="colleague@company.com"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <Select
                  value={form.watch('role')}
                  onValueChange={(value) => form.setValue('role', value as ProjectMemberRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span>Read-only</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="admin">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Admin</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {form.watch('role') === 'admin'
                    ? 'Admins can manage settings, team members, and feedback'
                    : 'Read-only users can view feedback but cannot make changes'}
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={addMemberMutation.isPending}>
                {addMemberMutation.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Add Member
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Remove Member Confirmation */}
      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {selectedMember?.user?.name || selectedMember?.user?.email} from this project?
              They will lose access immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={removeMemberMutation.isPending}
            >
              {removeMemberMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
