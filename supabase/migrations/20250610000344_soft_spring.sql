/*
  # Fix user registration policies

  1. Security
    - Update RLS policies to allow user registration
    - Fix authentication flow for new users
    - Allow users to create their own profile during registration

  2. Changes
    - Update users table policies to allow INSERT during registration
    - Fix the user creation flow
*/

-- Drop existing policies that might be blocking registration
DROP POLICY IF EXISTS "Users can insert own profile during registration" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new policies that allow proper user registration
CREATE POLICY "Enable insert for authenticated users during registration" ON users
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can read own data" ON users
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Also allow public registration (for the registration process)
CREATE POLICY "Enable insert for registration" ON users
  FOR INSERT 
  TO anon 
  WITH CHECK (true);

-- Create a function to handle user registration
CREATE OR REPLACE FUNCTION handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, tipo_usuario)
  VALUES (new.id, new.email, 'restaurante');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();