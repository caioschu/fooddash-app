/*
  # Fix users table RLS policy for registration

  1. Security
    - Add policy to allow users to insert their own profile during registration
    - This allows the registration process to create user profiles properly
*/

-- Allow users to insert their own profile during registration
CREATE POLICY "Users can insert own profile during registration"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);