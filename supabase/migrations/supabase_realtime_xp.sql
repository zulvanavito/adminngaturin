-- 1. Enable Realtime for gamification_profiles
ALTER TABLE public.gamification_profiles REPLICA IDENTITY FULL;

-- Check if table is already in publication, if not add it
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'gamification_profiles'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.gamification_profiles;
    END IF;
END $$;

-- 2. Improve the XP function to handle additions and reductions correctly
CREATE OR REPLACE FUNCTION increment_gamification_xp(p_user_id UUID, p_xp_amount INT)
RETURNS VOID AS $$
DECLARE
    current_xp INT;
    current_level INT;
    total_xp_value INT;
BEGIN
    -- Get current values or default to 0/1
    SELECT xp, level INTO current_xp, current_level 
    FROM public.gamification_profiles 
    WHERE user_id = p_user_id;
    
    IF NOT FOUND THEN
        current_xp := 0;
        current_level := 1;
    END IF;

    -- Calculate new total XP relative to levels (assuming 100 XP per level)
    total_xp_value := (current_level * 100) + current_xp + p_xp_amount;
    
    -- Prevent dropping below Level 1
    IF total_xp_value < 100 THEN
        total_xp_value := 100;
    END IF;

    -- Update with new calculated level and remainder XP
    INSERT INTO public.gamification_profiles (user_id, xp, level, updated_at)
    VALUES (
        p_user_id, 
        total_xp_value % 100, 
        floor(total_xp_value / 100), 
        NOW()
    )
    ON CONFLICT (user_id) DO UPDATE
    SET 
        xp = excluded.xp,
        level = excluded.level,
        updated_at = NOW();

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
