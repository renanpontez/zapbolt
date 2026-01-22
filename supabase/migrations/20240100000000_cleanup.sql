-- Cleanup any partially created objects from failed migration
DROP TYPE IF EXISTS user_tier CASCADE;
DROP TYPE IF EXISTS feedback_category CASCADE;
DROP TYPE IF EXISTS feedback_priority CASCADE;
DROP TYPE IF EXISTS feedback_status CASCADE;
DROP TYPE IF EXISTS url_pattern_type CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS url_patterns CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP FUNCTION IF EXISTS handle_new_user CASCADE;
DROP FUNCTION IF EXISTS update_updated_at CASCADE;
DROP FUNCTION IF EXISTS increment_feedback_count CASCADE;
