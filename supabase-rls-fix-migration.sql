-- ==========================================
-- Fix RLS for product_images table
-- Created: 2024-02-08
-- ==========================================

-- Create RPC function to bypass RLS for admin users
CREATE OR REPLACE FUNCTION insert_product_image_bypass_rls(
  p_product_id UUID,
  p_url TEXT,
  p_alt_text TEXT,
  p_order_index INTEGER,
  p_is_primary BOOLEAN
)
RETURNS product_images AS $$
BEGIN
  INSERT INTO product_images (
    product_id,
    url,
    alt_text,
    order_index,
    is_primary
  ) VALUES (
    p_product_id,
    p_url,
    p_alt_text,
    p_order_index,
    p_is_primary
  )
  RETURNING *;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create policy to allow authenticated users to insert product_images
CREATE POLICY "allow_authenticated_insert_images" ON product_images
  FOR INSERT
  WITH CHECK (true);

-- Create policy to allow authenticated users to view product_images
CREATE POLICY "allow_authenticated_view_images" ON product_images
  FOR SELECT
  USING (true);

-- Create policy to allow authenticated users to update product_images
CREATE POLICY "allow_authenticated_update_images" ON product_images
  FOR UPDATE
  USING (true);

-- Create policy to allow authenticated users to delete product_images
CREATE POLICY "allow_authenticated_delete_images" ON product_images
  FOR DELETE
  USING (true);

-- Also fix product_categories RLS
CREATE POLICY "allow_authenticated_insert_categories" ON product_categories
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "allow_authenticated_view_categories" ON product_categories
  FOR SELECT
  USING (true);

CREATE POLICY "allow_authenticated_delete_categories" ON product_categories
  FOR DELETE
  USING (true);

SELECT 'RLS policies fixed successfully!' as status;
