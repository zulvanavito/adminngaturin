-- 1. Create the function that will run when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert into user_profiles with default role and status
  INSERT INTO public.user_profiles (user_id, role, status, created_at, updated_at)
  VALUES (new.id, 'user', 'active', NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING; -- Prevent errors if row already exists
  
  -- Insert default gamification profile
  INSERT INTO public.gamification_profiles (user_id, xp, level, created_at, updated_at)
  VALUES (new.id, 0, 1, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Bind the function to the auth.users table via trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
