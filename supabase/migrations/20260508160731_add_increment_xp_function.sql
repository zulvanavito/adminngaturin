CREATE OR REPLACE FUNCTION increment_gamification_xp(p_user_id UUID, p_xp_amount INT)
RETURNS VOID AS $$
BEGIN
  INSERT INTO public.gamification_profiles (user_id, xp, level, updated_at)
  VALUES (p_user_id, p_xp_amount, 1, NOW())
  ON CONFLICT (user_id) DO UPDATE
  SET 
    xp = public.gamification_profiles.xp + p_xp_amount,
    updated_at = NOW();
    
  -- Trigger level up check
  -- level = level + (xp / 100), xp = xp % 100
  UPDATE public.gamification_profiles
  SET 
    level = level + (xp / 100),
    xp = xp % 100
  WHERE user_id = p_user_id AND xp >= 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;;
