-- ==========================================
-- Fix RLS for Storage bucket: product-images
-- Created: 2024-02-08
-- ==========================================

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies that might be blocking
DROP POLICY IF EXISTS "Allow authenticated users to upload to product-images" ON storage.objects;
DROP POLICY IF EXISTS "Product images bucket policy" ON storage.objects;

-- Create policy to allow authenticated users to upload to product-images bucket
-- Using bucket_id check to target only the product-images bucket
CREATE POLICY "Allow authenticated upload to product-images" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );

-- Create policy to allow authenticated users to view product-images
CREATE POLICY "Allow authenticated view product-images" ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated'
  );

-- Create policy to allow authenticated users to update/delete their own images
-- This allows managing images if the user owns them
CREATE POLICY "Allow authenticated manage product-images" ON storage.objects
  FOR ALL
  USING (
    bucket_id = 'product-images' AND
    auth.role() = 'authenticated' AND (
      owner = auth.uid() OR
      -- For service role or admin, allow all
      EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND email = 'admin@ gabyshop.com')
    )
  );

SELECT 'Storage bucket policies fixed successfully!' as status;
