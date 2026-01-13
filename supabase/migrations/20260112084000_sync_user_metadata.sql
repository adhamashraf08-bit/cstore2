-- Ensure profiles table uses the auth user id correctly
-- First, let's make sure the profiles table is structured efficiently
-- We'll use the auth.users id as our primary key directly for simplicity in synchronization

-- Add new columns if they don't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_sign_in_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS login_methods TEXT[];

-- Update handle_new_user to use NEW.id for both id and user_id
-- This ensures the profil entry has the same ID as the auth account
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, user_id, email, last_sign_in_at, login_methods)
  VALUES (
    NEW.id,
    NEW.id, 
    NEW.email, 
    NEW.last_sign_in_at,
    CASE 
      WHEN NEW.raw_app_meta_data->>'provider' IS NOT NULL 
      THEN ARRAY[NEW.raw_app_meta_data->>'provider'] 
      ELSE ARRAY['email'] 
    END
  )
  ON CONFLICT (user_id) DO UPDATE
  SET 
    email = EXCLUDED.email,
    last_sign_in_at = EXCLUDED.last_sign_in_at,
    login_methods = EXCLUDED.login_methods;
  RETURN NEW;
END;
$$;

-- Function to sync metadata on update (login)
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET 
    last_sign_in_at = NEW.last_sign_in_at,
    login_methods = CASE 
      WHEN NEW.raw_app_meta_data->>'provider' IS NOT NULL 
      THEN ARRAY[NEW.raw_app_meta_data->>'provider'] 
      ELSE ARRAY['email'] 
    END
  WHERE user_id = NEW.id;
  RETURN NEW;
END;
$$;

-- Trigger to sync metadata on update
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();
