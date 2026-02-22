-- ==========================================
-- FIX RLS POLICIES FOR COMPANY_MANAGEMENT
-- Solves infinite recursion and permission issues
-- ==========================================

-- ==========================================
-- STEP 1: Create helper function to check admin role
-- This function breaks the circular dependency
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
-- STEP 2: Fix RLS POLICIES FOR USERS TABLE
-- Must be done first to avoid recursion
-- ==========================================

-- Disable RLS temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow admin full access to users" ON public.users;
DROP POLICY IF EXISTS "Allow users to read their own data" ON public.users;
DROP POLICY IF EXISTS "Allow users to update their own data" ON public.users;
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
DROP POLICY IF EXISTS "Admins have full access to users" ON public.users;

-- Re-enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Admin full access to users (using helper function)
CREATE POLICY "Admins have full access to users"
ON public.users
FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can read their own data
CREATE POLICY "Users can read own profile"
ON public.users
FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update their own data
CREATE POLICY "Users can update own profile"
ON public.users
FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow insert during registration (trigger handles this)
CREATE POLICY "Allow insert during registration"
ON public.users
FOR INSERT
TO authenticated
WITH CHECK (true);

-- ==========================================
-- STEP 3: Fix RLS POLICIES FOR COMPANY_REQUESTS
-- ==========================================

-- Disable RLS temporarily
ALTER TABLE public.company_requests DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
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

-- Anyone can read (for transparency)
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
-- STEP 4: Fix RLS POLICIES FOR COMPANIES TABLE
-- ==========================================

-- Disable RLS temporarily
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow admin full access to companies" ON public.companies;
DROP POLICY IF EXISTS "Allow users to read active companies" ON public.companies;
DROP POLICY IF EXISTS "Allow company owners to update their company" ON public.companies;
DROP POLICY IF EXISTS "Admins manage companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view active companies" ON public.companies;
DROP POLICY IF EXISTS "Owners can update their company" ON public.companies;

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
-- STEP 5: ADD INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_company_requests_status ON public.company_requests(status);
CREATE INDEX IF NOT EXISTS idx_company_requests_created_at ON public.company_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ==========================================
-- STEP 6: Grant permissions
-- ==========================================

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- ==========================================
-- STEP 7: Verify RLS is working
-- ==========================================

-- Test query (run as authenticated user)
-- SELECT * FROM company_requests LIMIT 1;
-- SELECT * FROM companies LIMIT 1;
-- SELECT * FROM users LIMIT 1;
