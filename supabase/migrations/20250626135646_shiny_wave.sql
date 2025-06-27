/*
  # Fix user registration process

  1. Changes
    - Create a proper trigger to handle new user registration
    - Ensure users are properly created in the public.users table
    - Fix the user creation flow for new signups
*/

-- First, ensure the updated_at column exists
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Create or replace the function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
DECLARE
  user_type text;
BEGIN
  -- Get user type from metadata, default to 'restaurante'
  user_type := COALESCE(new.raw_user_meta_data->>'tipo_usuario', 'restaurante');
  
  -- Insert into users table
  INSERT INTO public.users (id, email, tipo_usuario, created_at, updated_at)
  VALUES (
    new.id, 
    new.email, 
    user_type,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger to run after new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Ensure the trigger for updating updated_at exists
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();