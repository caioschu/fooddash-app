/*
  # Fix User Registration Process

  1. Changes
    - Add updated_at column to users table
    - Create proper trigger for user creation from auth.users
    - Fix function to handle user metadata
    - Ensure existing users have updated_at values

  2. Security
    - Maintain existing RLS policies
    - Ensure proper user creation on registration
*/

-- First, add updated_at column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE users ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Update existing rows to have updated_at = created_at (without referencing updated_at in WHERE clause)
UPDATE users SET updated_at = created_at;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create improved function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
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
  );
  
  RETURN new;
EXCEPTION
  WHEN others THEN
    -- Log error but don't fail the auth process
    RAISE LOG 'Error creating user profile: %', SQLERRM;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Ensure the trigger function for updated_at exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for users table if it doesn't exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;