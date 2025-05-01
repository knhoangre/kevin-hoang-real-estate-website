-- Function to enable RLS on a table
CREATE OR REPLACE FUNCTION enable_rls(table_name text)
RETURNS void AS $$
BEGIN
  EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a policy
CREATE OR REPLACE FUNCTION create_policy(
  table_name text,
  policy_name text,
  operation text,
  role text,
  using_expr text,
  check_expr text DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  IF check_expr IS NULL THEN
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR %s TO %I USING (%s)',
      policy_name, table_name, operation, role, using_expr
    );
  ELSE
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR %s TO %I USING (%s) WITH CHECK (%s)',
      policy_name, table_name, operation, role, using_expr, check_expr
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;