/*
  # Add updated_at column to users table

  1. Changes
    - Add missing updated_at column to users table
    - Set up trigger for automatic updates
    - Fix schema cache issues
*/

-- Add updated_at column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'updated_at'
  ) THEN
    -- Add the column first
    ALTER TABLE users ADD COLUMN updated_at timestamptz DEFAULT now();
    
    -- Then update existing rows (now that the column exists)
    UPDATE users SET updated_at = created_at;
  END IF;
END $$;

-- Create or replace the trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();