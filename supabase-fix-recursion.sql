-- ==========================================
-- EMERGENCY FIX - Database error querying schema
-- This fixes RLS policies that are blocking auth operations
-- Execute this in Supabase SQL Editor
-- ==========================================

-- STEP 1: Disable RLS on all tables temporarily
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_requests DISABLE ROW LEVEL SECURITY;

-- STEP 2: Drop ALL existing policies from all tables
DO $$ 
DECLARE
    pol record;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
        AND tablename IN ('users', 'companies', 'company_users', 'company_requests')
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- STEP 3: Create helper function for admin check
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
$$;

-- STEP 4: Enable RLS and create permissive policies

-- ==========================================
-- USERS TABLE - Permissive policies
-- ==========================================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read users (needed for auth)
CREATE POLICY "users_select_all"
ON public.users FOR SELECT
TO authenticated
USING (true);

-- Allow users to update their own record
CREATE POLICY "users_update_own"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow insert (for auth trigger)
CREATE POLICY "users_insert_all"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Admins can do everything
CREATE POLICY "users_admin_all"
ON public.users FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==========================================
-- COMPANIES TABLE - Permissive policies
-- ==========================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read companies
CREATE POLICY "companies_select_all"
ON public.companies FOR SELECT
TO authenticated
USING (true);

-- Allow company owners to update their company
CREATE POLICY "companies_update_owner"
ON public.companies FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow insert for company owners
CREATE POLICY "companies_insert_owner"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins can do everything
CREATE POLICY "companies_admin_all"
ON public.companies FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ==========================================
-- COMPANY_USERS TABLE - Permissive policies
-- ==========================================
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read company_users
CREATE POLICY "company_users_select_all"
ON public.company_users FOR SELECT
TO authenticated
USING (true);

-- Allow insert for company owners and admins
CREATE POLICY "company_users_insert"
ON public.company_users FOR INSERT
TO authenticated
WITH CHECK (
    company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    OR public.is_admin()
);

-- Allow update for company owners and admins
CREATE POLICY "company_users_update"
ON public.company_users FOR UPDATE
TO authenticated
USING (
    company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    OR public.is_admin()
)
WITH CHECK (
    company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    OR public.is_admin()
);

-- Allow delete for company owners and admins
CREATE POLICY "company_users_delete"
ON public.company_users FOR DELETE
TO authenticated
USING (
    company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    OR public.is_admin()
);

-- ==========================================
-- COMPANY_REQUESTS TABLE - Permissive policies
-- ==========================================
ALTER TABLE public.company_requests ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read requests
CREATE POLICY "requests_select_all"
ON public.company_requests FOR SELECT
TO authenticated
USING (true);

-- Allow anyone to insert requests
CREATE POLICY "requests_insert_all"
ON public.company_requests FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow admins to update requests
CREATE POLICY "requests_update_admin"
ON public.company_requests FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Allow admins to delete requests
CREATE POLICY "requests_delete_admin"
ON public.company_requests FOR DELETE
TO authenticated
USING (public.is_admin());

-- ==========================================
-- VERIFICATION - Show all policies
-- ==========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    cmd
FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'companies', 'company_users', 'company_requests')
ORDER BY tablename, policyname;
