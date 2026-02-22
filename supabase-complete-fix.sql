-- ==========================================
-- COMPLETE FIX FOR ALL RLS ISSUES
-- Run this entire script in Supabase SQL Editor
-- ==========================================

-- ==========================================
-- STEP 1: Create helper function to check admin role
-- ==========================================

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- ==========================================
-- STEP 2: Fix RLS for USERS table
-- ==========================================

-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.users;
DROP POLICY IF EXISTS "Consultants can view all users" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Allow insert during registration" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Admin full access to users
CREATE POLICY "Admins have full access to users"
ON public.users
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow insert for authenticated users (for registration)
CREATE POLICY "Allow insert for users"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow anon to insert (for public registration)
CREATE POLICY "Allow public registration"
ON public.users
FOR INSERT
TO anon
WITH CHECK (true);

-- ==========================================
-- STEP 3: Fix RLS for COMPANIES table
-- ==========================================

-- Disable RLS temporarily
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow admin full access to companies" ON public.companies;
DROP POLICY IF EXISTS "Allow users to read active companies" ON public.companies;
DROP POLICY IF EXISTS "Allow company owners to update their company" ON public.companies;
DROP POLICY IF EXISTS "Admins manage companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view active companies" ON public.companies;
DROP POLICY IF EXISTS "Owners can update their company" ON public.companies;
DROP POLICY IF EXISTS "Allow insert companies" ON public.companies;

-- Re-enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Admin full access to companies
CREATE POLICY "Admins manage companies"
ON public.companies
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can read active companies
CREATE POLICY "Users can view active companies"
ON public.companies
FOR SELECT
TO authenticated
USING (is_active = true OR user_id = auth.uid());

-- Company owners can update their company
CREATE POLICY "Owners can update their company"
ON public.companies
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow insert for authenticated users
CREATE POLICY "Allow insert companies"
ON public.companies
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ==========================================
-- STEP 4: Fix RLS for COMPANY_REQUESTS table
-- ==========================================

-- Disable RLS temporarily
ALTER TABLE public.company_requests DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow admin full access to company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Allow authenticated users to read company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Allow insert to company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Allow update to company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Allow select to company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Admins manage company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Authenticated can view company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Anyone can submit company_request" ON public.company_requests;

-- Re-enable RLS
ALTER TABLE public.company_requests ENABLE ROW LEVEL SECURITY;

-- Admin full access to company_requests
CREATE POLICY "Admins manage company_requests"
ON public.company_requests
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Anyone can read
CREATE POLICY "Authenticated can view company_requests"
ON public.company_requests
FOR SELECT
TO authenticated
USING (true);

-- Public can insert (registration form)
CREATE POLICY "Anyone can submit company_request"
ON public.company_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ==========================================
-- STEP 5: Ensure trigger for auto-creating users exists
-- ==========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    email,
    full_name,
    avatar_url,
    role,
    email_verified,
    is_active,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email::text),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'customer'),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    true,
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- STEP 6: Add indexes for performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_company_requests_status ON public.company_requests(status);
CREATE INDEX IF NOT EXISTS idx_company_requests_created_at ON public.company_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);

-- ==========================================
-- STEP 7: Grant permissions
-- ==========================================

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- ==========================================
-- STEP 8: Verify the setup
-- ==========================================

-- Run these queries to verify (they should return results without errors)
-- SELECT * FROM public.users LIMIT 5;
-- SELECT * FROM public.companies LIMIT 5;
-- SELECT * FROM public.company_requests LIMIT 5;
-- SELECT public.is_admin();
