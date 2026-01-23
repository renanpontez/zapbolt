-- Migration: Add project members for multi-user project management
-- This migration adds support for multiple users per project with admin/read-only roles

-- Create project member role enum
CREATE TYPE project_member_role AS ENUM ('user', 'admin');

-- Add work_email column to users table (optional, for team collaboration)
ALTER TABLE users ADD COLUMN work_email TEXT;

-- Rename user_id to created_by in projects table (for audit trail)
-- The actual ownership is now managed through project_members
ALTER TABLE projects RENAME COLUMN user_id TO created_by;

-- Update index name to match new column name
DROP INDEX IF EXISTS idx_projects_user_id;
CREATE INDEX idx_projects_created_by ON projects(created_by);

-- Create project_members join table
CREATE TABLE project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role project_member_role NOT NULL DEFAULT 'user',
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  invited_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  accepted_at TIMESTAMPTZ DEFAULT NOW(), -- NULL if pending invite (future feature)
  UNIQUE(project_id, user_id)
);

-- Indexes for project_members
CREATE INDEX idx_project_members_project_id ON project_members(project_id);
CREATE INDEX idx_project_members_user_id ON project_members(user_id);

-- Enable RLS on project_members
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Function to check if user is admin of a project
CREATE OR REPLACE FUNCTION is_project_admin(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = p_user_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user is member of a project
CREATE OR REPLACE FUNCTION is_project_member(p_project_id UUID, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM project_members
    WHERE project_id = p_project_id
    AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to count admins in a project
CREATE OR REPLACE FUNCTION count_project_admins(p_project_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER FROM project_members
    WHERE project_id = p_project_id
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function to prevent removing the last admin
CREATE OR REPLACE FUNCTION prevent_last_admin_removal()
RETURNS TRIGGER AS $$
BEGIN
  -- On DELETE or role change from admin
  IF TG_OP = 'DELETE' THEN
    IF OLD.role = 'admin' THEN
      IF count_project_admins(OLD.project_id) <= 1 THEN
        RAISE EXCEPTION 'Cannot remove the last admin from a project';
      END IF;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- If changing role from admin to user
    IF OLD.role = 'admin' AND NEW.role = 'user' THEN
      IF count_project_admins(OLD.project_id) <= 1 THEN
        RAISE EXCEPTION 'Cannot demote the last admin of a project';
      END IF;
    END IF;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER check_last_admin
  BEFORE DELETE OR UPDATE ON project_members
  FOR EACH ROW EXECUTE FUNCTION prevent_last_admin_removal();

-- Migrate existing projects: create admin membership for current created_by user
INSERT INTO project_members (project_id, user_id, role, invited_by, invited_at, accepted_at)
SELECT id, created_by, 'admin', created_by, created_at, created_at
FROM projects
WHERE created_by IS NOT NULL
ON CONFLICT (project_id, user_id) DO NOTHING;

-- ================================
-- RLS Policies for project_members
-- ================================

-- Users can view memberships for projects they belong to
CREATE POLICY "Members can view project memberships"
  ON project_members FOR SELECT
  USING (is_project_member(project_id, auth.uid()));

-- Only admins can add new members
CREATE POLICY "Admins can add project members"
  ON project_members FOR INSERT
  WITH CHECK (is_project_admin(project_id, auth.uid()));

-- Only admins can update member roles
CREATE POLICY "Admins can update project members"
  ON project_members FOR UPDATE
  USING (is_project_admin(project_id, auth.uid()));

-- Admins can remove members, OR users can remove themselves (leave project)
CREATE POLICY "Admins can remove members or users can leave"
  ON project_members FOR DELETE
  USING (
    is_project_admin(project_id, auth.uid())
    OR user_id = auth.uid()
  );

-- ================================
-- Update existing RLS policies
-- ================================

-- Drop old project policies that use user_id
DROP POLICY IF EXISTS "Users can read own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;

-- New project policies using project_members
CREATE POLICY "Members can read their projects"
  ON projects FOR SELECT
  USING (is_project_member(id, auth.uid()));

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Admins can update their projects"
  ON projects FOR UPDATE
  USING (is_project_admin(id, auth.uid()));

CREATE POLICY "Admins can delete their projects"
  ON projects FOR DELETE
  USING (is_project_admin(id, auth.uid()));

-- Update URL patterns policies
DROP POLICY IF EXISTS "Users can read patterns of own projects" ON url_patterns;
DROP POLICY IF EXISTS "Users can create patterns for own projects" ON url_patterns;
DROP POLICY IF EXISTS "Users can delete patterns of own projects" ON url_patterns;

CREATE POLICY "Members can read patterns of their projects"
  ON url_patterns FOR SELECT
  USING (is_project_member(project_id, auth.uid()));

CREATE POLICY "Admins can create patterns for their projects"
  ON url_patterns FOR INSERT
  WITH CHECK (is_project_admin(project_id, auth.uid()));

CREATE POLICY "Admins can delete patterns of their projects"
  ON url_patterns FOR DELETE
  USING (is_project_admin(project_id, auth.uid()));

-- Update feedback policies
DROP POLICY IF EXISTS "Users can read feedback of own projects" ON feedback;
DROP POLICY IF EXISTS "Users can update feedback of own projects" ON feedback;
DROP POLICY IF EXISTS "Users can delete feedback of own projects" ON feedback;

CREATE POLICY "Members can read feedback of their projects"
  ON feedback FOR SELECT
  USING (is_project_member(project_id, auth.uid()));

CREATE POLICY "Admins can update feedback of their projects"
  ON feedback FOR UPDATE
  USING (is_project_admin(project_id, auth.uid()));

CREATE POLICY "Admins can delete feedback of their projects"
  ON feedback FOR DELETE
  USING (is_project_admin(project_id, auth.uid()));

-- Update feedback_replies policies
DROP POLICY IF EXISTS "Users can read replies for their project feedback" ON feedback_replies;
DROP POLICY IF EXISTS "Users can create replies for their project feedback" ON feedback_replies;

CREATE POLICY "Members can read replies for their project feedback"
  ON feedback_replies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM feedback f
    WHERE f.id = feedback_replies.feedback_id
    AND is_project_member(f.project_id, auth.uid())
  ));

CREATE POLICY "Admins can create replies for their project feedback"
  ON feedback_replies FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM feedback f
    WHERE f.id = feedback_replies.feedback_id
    AND is_project_admin(f.project_id, auth.uid())
  ));

-- Update internal_notes policies
DROP POLICY IF EXISTS "Users can read notes for their project feedback" ON internal_notes;
DROP POLICY IF EXISTS "Users can create notes for their project feedback" ON internal_notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON internal_notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON internal_notes;

CREATE POLICY "Members can read notes for their project feedback"
  ON internal_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM feedback f
    WHERE f.id = internal_notes.feedback_id
    AND is_project_member(f.project_id, auth.uid())
  ));

CREATE POLICY "Members can create notes for their project feedback"
  ON internal_notes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM feedback f
      WHERE f.id = internal_notes.feedback_id
      AND is_project_member(f.project_id, auth.uid())
    )
  );

CREATE POLICY "Members can update their own notes"
  ON internal_notes FOR UPDATE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM feedback f
      WHERE f.id = internal_notes.feedback_id
      AND is_project_member(f.project_id, auth.uid())
    )
  );

CREATE POLICY "Members can delete their own notes"
  ON internal_notes FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM feedback f
      WHERE f.id = internal_notes.feedback_id
      AND is_project_member(f.project_id, auth.uid())
    )
  );

-- Update handle_new_user trigger to include work_email
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url, work_email)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture'),
    NEW.raw_user_meta_data->>'work_email'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
