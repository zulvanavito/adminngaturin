-- Helper function to get emails from auth.users (to be run as admin)
CREATE OR REPLACE FUNCTION public.get_auth_users_data()
RETURNS TABLE (id UUID, email TEXT, full_name TEXT) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY 
  SELECT u.id, u.email::TEXT, (u.raw_user_meta_data->>'full_name')::TEXT
  FROM auth.users u;
END;
$$ LANGUAGE plpgsql;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.get_auth_users_data() TO authenticated;
