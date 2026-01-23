-- Create enum for change log field types
CREATE TYPE feedback_change_field AS ENUM ('status', 'category', 'priority');

-- Feedback change logs table to track history of changes
CREATE TABLE feedback_change_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  field feedback_change_field NOT NULL,
  old_value TEXT NOT NULL,
  new_value TEXT NOT NULL,
  changed_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_feedback_change_logs_feedback_id ON feedback_change_logs(feedback_id);
CREATE INDEX idx_feedback_change_logs_changed_by ON feedback_change_logs(changed_by);
CREATE INDEX idx_feedback_change_logs_created_at ON feedback_change_logs(created_at DESC);

-- Enable RLS
ALTER TABLE feedback_change_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_change_logs

-- Users can read change logs of feedback from projects they have access to
CREATE POLICY "Users can read change logs of accessible feedback"
  ON feedback_change_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM feedback
    JOIN project_members ON project_members.project_id = feedback.project_id
    WHERE feedback.id = feedback_change_logs.feedback_id
    AND project_members.user_id = auth.uid()
  ));

-- Users can create change logs for feedback from projects they are admin of
CREATE POLICY "Admins can create change logs for project feedback"
  ON feedback_change_logs FOR INSERT
  WITH CHECK (
    auth.uid() = changed_by
    AND EXISTS (
      SELECT 1 FROM feedback
      JOIN project_members ON project_members.project_id = feedback.project_id
      WHERE feedback.id = feedback_change_logs.feedback_id
      AND project_members.user_id = auth.uid()
      AND project_members.role = 'admin'
    )
  );
