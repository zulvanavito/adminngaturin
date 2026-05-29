ALTER TABLE public.user_profiles 
ADD COLUMN IF NOT EXISTS last_email_change_at timestamp with time zone;

COMMENT ON COLUMN public.user_profiles.last_email_change_at IS 'Timestamp of the last successful email change to enforce monthly limits.';;
