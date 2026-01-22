-- Enable pgcrypto extension for gen_random_bytes
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Create enums
CREATE TYPE user_tier AS ENUM ('free', 'pro', 'enterprise');
CREATE TYPE feedback_category AS ENUM ('bug', 'feature', 'improvement', 'question', 'other');
CREATE TYPE feedback_priority AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE feedback_status AS ENUM ('new', 'in_progress', 'resolved', 'closed', 'archived');
CREATE TYPE url_pattern_type AS ENUM ('include', 'exclude');

-- Users table (extends auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  avatar_url TEXT,
  tier user_tier NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  domain TEXT NOT NULL,
  api_key TEXT NOT NULL DEFAULT encode(extensions.gen_random_bytes(32), 'hex'),
  widget_config JSONB NOT NULL DEFAULT '{
    "position": "bottom-right",
    "primaryColor": "#3b82f6",
    "textColor": "#ffffff",
    "buttonText": "Feedback",
    "showBranding": true,
    "categories": ["Bug", "Feature", "Improvement", "Question", "Other"],
    "collectEmail": "optional",
    "enableScreenshot": true,
    "enableSessionReplay": false
  }'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  monthly_feedback_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- URL patterns table
CREATE TABLE url_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  type url_pattern_type NOT NULL DEFAULT 'include',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Feedback table
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category feedback_category NOT NULL,
  message TEXT NOT NULL,
  email TEXT,
  priority feedback_priority NOT NULL DEFAULT 'medium',
  status feedback_status NOT NULL DEFAULT 'new',
  screenshot_url TEXT,
  session_replay_url TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_projects_api_key ON projects(api_key);
CREATE INDEX idx_url_patterns_project_id ON url_patterns(project_id);
CREATE INDEX idx_feedback_project_id ON feedback(project_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- Trigger to auto-create user profile on auth signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Trigger to increment feedback count
CREATE OR REPLACE FUNCTION increment_feedback_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects
  SET
    feedback_count = feedback_count + 1,
    monthly_feedback_count = monthly_feedback_count + 1
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_feedback_created
  AFTER INSERT ON feedback
  FOR EACH ROW EXECUTE FUNCTION increment_feedback_count();

-- RLS Policies

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE url_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can read own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);

-- URL patterns policies
CREATE POLICY "Users can read patterns of own projects"
  ON url_patterns FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = url_patterns.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can create patterns for own projects"
  ON url_patterns FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = url_patterns.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete patterns of own projects"
  ON url_patterns FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = url_patterns.project_id AND projects.user_id = auth.uid()
  ));

-- Feedback policies
CREATE POLICY "Users can read feedback of own projects"
  ON feedback FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = feedback.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can update feedback of own projects"
  ON feedback FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = feedback.project_id AND projects.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete feedback of own projects"
  ON feedback FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM projects WHERE projects.id = feedback.project_id AND projects.user_id = auth.uid()
  ));

-- Public policy for widget to submit feedback (using service role key)
-- Widget submissions bypass RLS via service role key
