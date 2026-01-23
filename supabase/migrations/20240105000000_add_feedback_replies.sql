-- Create feedback_reply_sender enum
CREATE TYPE feedback_reply_sender AS ENUM ('admin', 'user');

-- Feedback replies table
CREATE TABLE feedback_replies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  sent_by feedback_reply_sender NOT NULL DEFAULT 'admin',
  sent_by_email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_feedback_replies_feedback_id ON feedback_replies(feedback_id);
CREATE INDEX idx_feedback_replies_created_at ON feedback_replies(created_at);

-- Enable RLS
ALTER TABLE feedback_replies ENABLE ROW LEVEL SECURITY;

-- RLS Policies for feedback_replies

-- Users can read replies of feedback from their own projects
CREATE POLICY "Users can read replies of own project feedback"
  ON feedback_replies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM feedback
    JOIN projects ON projects.id = feedback.project_id
    WHERE feedback.id = feedback_replies.feedback_id
    AND projects.user_id = auth.uid()
  ));

-- Users can create replies for feedback from their own projects
CREATE POLICY "Users can create replies for own project feedback"
  ON feedback_replies FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM feedback
    JOIN projects ON projects.id = feedback.project_id
    WHERE feedback.id = feedback_replies.feedback_id
    AND projects.user_id = auth.uid()
  ));

-- Users can delete replies of feedback from their own projects
CREATE POLICY "Users can delete replies of own project feedback"
  ON feedback_replies FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM feedback
    JOIN projects ON projects.id = feedback.project_id
    WHERE feedback.id = feedback_replies.feedback_id
    AND projects.user_id = auth.uid()
  ));
