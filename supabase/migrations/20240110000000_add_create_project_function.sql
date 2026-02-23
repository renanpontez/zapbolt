CREATE OR REPLACE FUNCTION create_project_with_admin(
  p_name TEXT,
  p_domain TEXT
)
RETURNS SETOF projects
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_project projects%ROWTYPE;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO projects (created_by, name, domain)
  VALUES (v_user_id, p_name, p_domain)
  RETURNING * INTO v_project;

  INSERT INTO project_members (project_id, user_id, role, invited_by, accepted_at)
  VALUES (v_project.id, v_user_id, 'admin', v_user_id, NOW());

  RETURN NEXT v_project;
END;
$$;

REVOKE ALL ON FUNCTION create_project_with_admin(TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION create_project_with_admin(TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION create_project_with_admin(TEXT, TEXT) TO authenticated;
