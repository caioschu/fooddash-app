/*
  # Sistema de Gestão de Acessos

  1. New Tables
    - `user_accesses`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key)
      - `created_by` (uuid, foreign key to users)
      - `name` (text)
      - `email` (text, unique)
      - `password_hash` (text)
      - `permissions` (jsonb)
      - `active` (boolean)
      - `last_login` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_accesses` table
    - Add policies for restaurant owners to manage their access accounts
*/

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS user_accesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  permissions jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_accesses ENABLE ROW LEVEL SECURITY;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_user_accesses_updated_at ON user_accesses;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION update_user_accesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER update_user_accesses_updated_at
  BEFORE UPDATE ON user_accesses
  FOR EACH ROW
  EXECUTE FUNCTION update_user_accesses_updated_at();

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Restaurant owners can manage their access accounts" ON user_accesses;

-- Create security policy
CREATE POLICY "Restaurant owners can manage their access accounts"
  ON user_accesses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = user_accesses.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = user_accesses.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );