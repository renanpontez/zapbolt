-- Add onboarding_steps column to users table
-- Tracks individual onboarding step progress for cross-device sync

ALTER TABLE users
ADD COLUMN onboarding_steps JSONB DEFAULT NULL;

COMMENT ON COLUMN users.onboarding_steps IS
  'Tracks onboarding step progress: { stepName: { status, completedAt } }';
