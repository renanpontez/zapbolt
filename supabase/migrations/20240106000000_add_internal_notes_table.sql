-- Internal notes table (replaces the text field approach)
CREATE TABLE internal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  feedback_id UUID NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_internal_notes_feedback_id ON internal_notes(feedback_id);
CREATE INDEX idx_internal_notes_user_id ON internal_notes(user_id);
CREATE INDEX idx_internal_notes_created_at ON internal_notes(created_at);

-- Enable RLS
ALTER TABLE internal_notes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for internal_notes

-- Users can read notes of feedback from their own projects
CREATE POLICY "Users can read notes of own project feedback"
  ON internal_notes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM feedback
    JOIN projects ON projects.id = feedback.project_id
    WHERE feedback.id = internal_notes.feedback_id
    AND projects.user_id = auth.uid()
  ));

-- Users can create notes for feedback from their own projects
CREATE POLICY "Users can create notes for own project feedback"
  ON internal_notes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM feedback
      JOIN projects ON projects.id = feedback.project_id
      WHERE feedback.id = internal_notes.feedback_id
      AND projects.user_id = auth.uid()
    )
  );

-- Users can delete their own notes
CREATE POLICY "Users can delete own notes"
  ON internal_notes FOR DELETE
  USING (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM feedback
      JOIN projects ON projects.id = feedback.project_id
      WHERE feedback.id = internal_notes.feedback_id
      AND projects.user_id = auth.uid()
    )
  );

-- Add attachment_url to feedback_replies for file attachments
ALTER TABLE feedback_replies ADD COLUMN attachment_url TEXT;
