-- Add onboarding_completed_at column to users table
-- This tracks when a user completed the onboarding tour (null = not completed)

ALTER TABLE users
ADD COLUMN onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN users.onboarding_completed_at IS 'Timestamp when user completed onboarding tour, null if not completed';
