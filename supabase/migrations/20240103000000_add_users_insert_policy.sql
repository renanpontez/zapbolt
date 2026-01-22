-- Add INSERT policy for users table
-- This allows users to create their own profile when the trigger doesn't fire

CREATE POLICY "Users can insert own profile"
  ON users FOR INSERT
  WITH CHECK (auth.uid() = id);
