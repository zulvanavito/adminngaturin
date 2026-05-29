-- Add premium preferences to user_profiles
ALTER TABLE public.user_profiles 
  ADD COLUMN IF NOT EXISTS show_decimals BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT 'wise-green';

-- Comment for documentation
COMMENT ON COLUMN public.user_profiles.show_decimals IS 'Whether to show decimal places in currency formatting';
COMMENT ON COLUMN public.user_profiles.accent_color IS 'Selected primary color accent for the UI';
;
