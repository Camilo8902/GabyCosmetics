-- ==========================================
-- Add image_url column to products table
-- This enables storing product images as base64 directly in the product record
-- Created: 2024-02-08
-- ==========================================

-- Add image_url column if it doesn't exist
ALTER TABLE products
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_products_image_url ON products(image_url);

SELECT 'image_url column added to products table' as status;
