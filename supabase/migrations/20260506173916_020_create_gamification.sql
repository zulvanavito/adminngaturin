-- Create gamification_profiles table
CREATE TABLE IF NOT EXISTS public.gamification_profiles (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  xp              INTEGER DEFAULT 0,
  level           INTEGER DEFAULT 1,
  current_streak  INTEGER DEFAULT 0,
  longest_streak  INTEGER DEFAULT 0,
  last_activity_date DATE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.gamification_profiles ENABLE ROW LEVEL SECURITY;

-- Policies for gamification_profiles
CREATE POLICY "Users can view their own gamification profile"
  ON public.gamification_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own gamification profile"
  ON public.gamification_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own gamification profile"
  ON public.gamification_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create badges table
CREATE TABLE IF NOT EXISTS public.badges (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT NOT NULL,
  icon_name       TEXT NOT NULL,
  xp_reward       INTEGER DEFAULT 0,
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for badges
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

-- Everyone can view badges
CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  TO authenticated
  USING (true);

-- Create user_badges table
CREATE TABLE IF NOT EXISTS public.user_badges (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id        UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, badge_id)
);

-- Enable RLS for user_badges
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- Users can view their own earned badges
CREATE POLICY "Users can view their own earned badges"
  ON public.user_badges FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own earned badges"
  ON public.user_badges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at on gamification_profiles
CREATE TRIGGER update_gamification_profiles_updated_at
  BEFORE UPDATE ON public.gamification_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed initial badges
INSERT INTO public.badges (name, description, icon_name, xp_reward, requirement_type, requirement_value)
VALUES 
  ('Langkah Pertama', 'Catat transaksi pertamamu!', 'Zap', 50, 'TRANSACTION_COUNT', 1),
  ('Disiplin Keuangan', 'Catat 10 transaksi.', 'Award', 100, 'TRANSACTION_COUNT', 10),
  ('Ahli Anggaran', 'Catat 50 transaksi.', 'Trophy', 250, 'TRANSACTION_COUNT', 50),
  ('Mulai Membara', 'Pertahankan streak selama 3 hari.', 'Flame', 100, 'STREAK_DAYS', 3),
  ('Tak Terhentikan', 'Pertahankan streak selama 7 hari.', 'Zap', 200, 'STREAK_DAYS', 7),
  ('Legenda Keuangan', 'Pertahankan streak selama 30 hari.', 'Crown', 1000, 'STREAK_DAYS', 30);
;
