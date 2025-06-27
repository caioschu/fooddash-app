/*
  # Add foreign key relationship between users and restaurants

  1. Changes
    - Add foreign key constraint on restaurants.user_id referencing users.id
    - This will enable proper joins between users and restaurants tables
    - Allows Supabase queries to fetch related restaurant data for users

  2. Security
    - No RLS changes needed as existing policies are sufficient
    - Foreign key constraint ensures data integrity
*/

-- Add foreign key constraint to link restaurants.user_id to users.id
DO $$
BEGIN
  -- Check if the foreign key constraint doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'restaurants_user_id_fkey' 
    AND table_name = 'restaurants'
  ) THEN
    ALTER TABLE restaurants 
    ADD CONSTRAINT restaurants_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
  END IF;
END $$;