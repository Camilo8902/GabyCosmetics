-- ==========================================
-- Fix RLS policies for product_categories table
-- This ensures categories can be saved and retrieved properly
-- ==========================================

-- First, check if RLS is enabled on the table
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "allow_authenticated_insert_categories" ON public.product_categories;
DROP POLICY IF EXISTS "allow_authenticated_view_categories" ON public.product_categories;
DROP POLICY IF EXISTS "allow_authenticated_delete_categories" ON public.product_categories;
DROP POLICY IF EXISTS "allow_all_product_categories" ON public.product_categories;

-- Create comprehensive policies for product_categories

-- Policy for SELECT (viewing) - Allow all users to view product categories
CREATE POLICY "allow_select_product_categories" ON public.product_categories
  FOR SELECT
  USING (true);

-- Policy for INSERT - Allow authenticated users to insert product categories
CREATE POLICY "allow_insert_product_categories" ON public.product_categories
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Policy for DELETE - Allow authenticated users to delete product categories
CREATE POLICY "allow_delete_product_categories" ON public.product_categories
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- Policy for UPDATE - Allow authenticated users to update product categories (if needed)
CREATE POLICY "allow_update_product_categories" ON public.product_categories
  FOR UPDATE
  USING (auth.role() = 'authenticated');

-- ==========================================
-- Also ensure products table has proper RLS policies
-- ==========================================

-- Make sure RLS is enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "allow_select_products" ON public.products;
DROP POLICY IF EXISTS "allow_insert_products" ON public.products;
DROP POLICY IF EXISTS "allow_update_products" ON public.products;
DROP POLICY IF EXISTS "allow_delete_products" ON public.products;

-- Create policies for products
CREATE POLICY "allow_select_products" ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY "allow_insert_products" ON public.products
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "allow_update_products" ON public.products
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "allow_delete_products" ON public.products
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ==========================================
-- Ensure categories table has proper RLS policies
-- ==========================================

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "allow_select_categories" ON public.categories;
DROP POLICY IF EXISTS "allow_insert_categories" ON public.categories;
DROP POLICY IF EXISTS "allow_update_categories" ON public.categories;
DROP POLICY IF EXISTS "allow_delete_categories" ON public.categories;

CREATE POLICY "allow_select_categories" ON public.categories
  FOR SELECT
  USING (true);

CREATE POLICY "allow_insert_categories" ON public.categories
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "allow_update_categories" ON public.categories
  FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "allow_delete_categories" ON public.categories
  FOR DELETE
  USING (auth.role() = 'authenticated');

-- ==========================================
-- Grant necessary permissions
-- ==========================================

-- Grant permissions on product_categories
GRANT ALL ON public.product_categories TO authenticated;
GRANT SELECT ON public.product_categories TO anon;

-- Grant permissions on products
GRANT ALL ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;

-- Grant permissions on categories
GRANT ALL ON public.categories TO authenticated;
GRANT SELECT ON public.categories TO anon;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

SELECT 'RLS policies and permissions fixed successfully!' as status;
