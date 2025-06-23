/*
  # Fix authentication and user registration

  1. Security
    - Drop and recreate all RLS policies properly
    - Create proper trigger for user creation
    - Fix function to handle user metadata

  2. Changes
    - Allow anonymous users to register
    - Automatically create user profile on auth.users insert
    - Handle user type from metadata
*/

-- First, disable RLS temporarily to clean up
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Enable insert for authenticated users during registration" ON users;
DROP POLICY IF EXISTS "Enable insert for registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Drop existing trigger and function
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

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create new, simpler policies
CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow the trigger function to insert
CREATE POLICY "Enable insert via trigger" ON users
  FOR INSERT 
  WITH CHECK (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.restaurants TO authenticated;
GRANT ALL ON public.sales_channels TO authenticated;
GRANT ALL ON public.payment_methods TO authenticated;