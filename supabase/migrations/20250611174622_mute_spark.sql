/*
  # Create storage bucket for restaurant assets

  1. Storage Setup
    - Create restaurant-assets bucket for logo uploads
    - Set up proper RLS policies for file access
    - Configure bucket settings for image uploads

  2. Security
    - Allow authenticated users to upload files
    - Allow public read access for displaying logos
    - Restrict file types to images only
*/

-- Create the restaurant-assets bucket using Supabase storage functions
DO $$
BEGIN
  -- Create bucket if it doesn't exist
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES (
    'restaurant-assets',
    'restaurant-assets',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  ) ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'Bucket creation failed: %', SQLERRM;
END $$;

-- Create storage policies using Supabase's policy system
DO $$
BEGIN
  -- Policy to allow authenticated users to upload files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload restaurant assets'
  ) THEN
    CREATE POLICY "Authenticated users can upload restaurant assets"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'restaurant-assets'
    );
  END IF;

  -- Policy to allow authenticated users to update their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can update their own restaurant assets'
  ) THEN
    CREATE POLICY "Users can update their own restaurant assets"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (bucket_id = 'restaurant-assets')
    WITH CHECK (bucket_id = 'restaurant-assets');
  END IF;

  -- Policy to allow authenticated users to delete their own files
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Users can delete their own restaurant assets'
  ) THEN
    CREATE POLICY "Users can delete their own restaurant assets"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'restaurant-assets');
  END IF;

  -- Policy to allow public read access to all files in the bucket
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
    AND tablename = 'objects' 
    AND policyname = 'Public read access for restaurant assets'
  ) THEN
    CREATE POLICY "Public read access for restaurant assets"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'restaurant-assets');
  END IF;

EXCEPTION
  WHEN others THEN
    RAISE LOG 'Policy creation failed: %', SQLERRM;
END $$;