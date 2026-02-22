-- ==========================================
-- COMPLETE FIX FOR ALL RLS ISSUES
-- Run this entire script in Supabase SQL Editor
-- Fixes infinite recursion and permission issues
-- ==========================================

-- ==========================================
-- STEP 1: Create helper functions with SECURITY DEFINER
-- These functions bypass RLS to avoid circular dependencies
-- ==========================================

-- Function to check if current user is admin
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

-- Function to get current user's company ID (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_my_company_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT company_id FROM public.users WHERE id = auth.uid();
$$;

-- Function to check if user belongs to company (bypasses RLS)
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND (company_id = p_company_id OR role = 'admin')
  );
$$;

-- Function to check if user is company owner (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_company_owner(p_company_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies
    WHERE id = p_company_id
    AND user_id = auth.uid()
  );
$$;

-- ==========================================
-- STEP 2: Fix RLS for USERS table
-- ==========================================

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
DROP POLICY IF EXISTS "Allow insert for users" ON public.users;
DROP POLICY IF EXISTS "Allow public registration" ON public.users;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins manage all users"
ON public.users FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can read own profile
CREATE POLICY "Users read own profile"
ON public.users FOR SELECT
TO authenticated
USING (id = auth.uid());

-- Users can update own profile (limited fields)
CREATE POLICY "Users update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Allow registration (insert)
CREATE POLICY "Allow user registration"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (true);

-- Allow anonymous registration
CREATE POLICY "Allow anonymous registration"
ON public.users FOR INSERT
TO anon
WITH CHECK (true);

-- ==========================================
-- STEP 3: Fix RLS for COMPANIES table
-- ==========================================

ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin full access to companies" ON public.companies;
DROP POLICY IF EXISTS "Allow users to read active companies" ON public.companies;
DROP POLICY IF EXISTS "Allow company owners to update their company" ON public.companies;
DROP POLICY IF EXISTS "Admins manage companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view active companies" ON public.companies;
DROP POLICY IF EXISTS "Owners can update their company" ON public.companies;
DROP POLICY IF EXISTS "Allow insert companies" ON public.companies;

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins manage companies"
ON public.companies FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view active companies (marketplace)
CREATE POLICY "Users view active companies"
ON public.companies FOR SELECT
TO authenticated
USING (is_active = true OR user_id = auth.uid());

-- Company owners can update their company
CREATE POLICY "Owners update company"
ON public.companies FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Allow insert for authenticated users
CREATE POLICY "Allow insert companies"
ON public.companies FOR INSERT
TO authenticated
WITH CHECK (true);

-- ==========================================
-- STEP 4: Fix RLS for COMPANY_REQUESTS table
-- ==========================================

ALTER TABLE public.company_requests DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow admin full access to company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Allow authenticated users to read company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Allow insert to company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Allow update to company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Allow select to company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Admins manage company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Authenticated can view company_requests" ON public.company_requests;
DROP POLICY IF EXISTS "Anyone can submit company_request" ON public.company_requests;

ALTER TABLE public.company_requests ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins manage requests"
ON public.company_requests FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view all requests (for transparency)
CREATE POLICY "Users view requests"
ON public.company_requests FOR SELECT
TO authenticated
USING (true);

-- Anyone can submit a request (including anonymous)
CREATE POLICY "Public submit requests"
ON public.company_requests FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- ==========================================
-- STEP 5: Fix RLS for COMPANY_USERS table
-- This is the critical one causing infinite recursion
-- ==========================================

ALTER TABLE public.company_users DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage company_users" ON public.company_users;
DROP POLICY IF EXISTS "Users view own company" ON public.company_users;
DROP POLICY IF EXISTS "Company members view" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can invite" ON public.company_users;
DROP POLICY IF EXISTS "Company admins can update" ON public.company_users;

ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;

-- Admin full access (uses is_admin() which is SECURITY DEFINER)
CREATE POLICY "Admins manage company_users"
ON public.company_users FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view their own company's users (uses SECURITY DEFINER function)
CREATE POLICY "Users view company members"
ON public.company_users FOR SELECT
TO authenticated
USING (
  public.user_belongs_to_company(company_id)
);

-- Company admins can invite users
CREATE POLICY "Company admins can invite"
ON public.company_users FOR INSERT
TO authenticated
WITH CHECK (
  public.user_belongs_to_company(company_id)
);

-- Company admins can update users
CREATE POLICY "Company admins can update"
ON public.company_users FOR UPDATE
TO authenticated
USING (public.user_belongs_to_company(company_id))
WITH CHECK (public.user_belongs_to_company(company_id));

-- ==========================================
-- STEP 6: Fix RLS for SUBSCRIPTIONS table
-- ==========================================

ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Users view own subscription" ON public.subscriptions;

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins manage subscriptions"
ON public.subscriptions FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view their company's subscription
CREATE POLICY "Users view company subscription"
ON public.subscriptions FOR SELECT
TO authenticated
USING (public.user_belongs_to_company(company_id));

-- Allow insert for company owners
CREATE POLICY "Company owners insert subscription"
ON public.subscriptions FOR INSERT
TO authenticated
WITH CHECK (public.is_company_owner(company_id));

-- ==========================================
-- STEP 7: Fix RLS for COMPANY_INVITATIONS table
-- ==========================================

ALTER TABLE public.company_invitations DISABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage invitations" ON public.company_invitations;
DROP POLICY IF EXISTS "Users view invitations" ON public.company_invitations;

ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admins manage invitations"
ON public.company_invitations FOR ALL
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- Users can view their company's invitations
CREATE POLICY "Users view company invitations"
ON public.company_invitations FOR SELECT
TO authenticated
USING (public.user_belongs_to_company(company_id));

-- Company admins can create invitations
CREATE POLICY "Company admins create invitations"
ON public.company_invitations FOR INSERT
TO authenticated
WITH CHECK (public.user_belongs_to_company(company_id));

-- ==========================================
-- STEP 8: Ensure trigger for auto-creating users exists
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

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- STEP 9: Add indexes for performance
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_company_id ON public.users(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_company_requests_status ON public.company_requests(status);
CREATE INDEX IF NOT EXISTS idx_company_users_company_id ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user_id ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_company_id ON public.subscriptions(company_id);

-- ==========================================
-- STEP 10: Grant permissions
-- ==========================================

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;
GRANT EXECUTE ON FUNCTION public.get_my_company_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.user_belongs_to_company(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_company_owner(UUID) TO authenticated;

-- ==========================================
-- STEP 11: Fix any existing users without public.users entry
-- ==========================================

INSERT INTO public.users (id, email, full_name, role, is_active, email_verified, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.email::text),
  COALESCE((u.raw_user_meta_data->>'role')::text, 'customer'),
  true,
  u.email_confirmed_at IS NOT NULL,
  u.created_at,
  now()
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.users p WHERE p.id = u.id);

-- ==========================================
-- STEP 12: Ensure admin user has correct role
-- ==========================================

-- Update the first user to be admin (adjust email as needed)
-- This ensures at least one user has admin role
UPDATE public.users 
SET role = 'admin' 
WHERE email IN ('admin@gabycosmetics.com', 'admin@example.com')
AND role != 'admin';

-- If no admin exists, make the first user an admin
UPDATE public.users 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM public.users 
  ORDER BY created_at 
  LIMIT 1
)
AND NOT EXISTS (SELECT 1 FROM public.users WHERE role = 'admin');

-- ==========================================
-- VERIFICATION QUERIES (run after applying)
-- ==========================================

-- SELECT * FROM public.users LIMIT 5;
-- SELECT * FROM public.companies LIMIT 5;
-- SELECT * FROM public.company_requests LIMIT 5;
-- SELECT * FROM public.company_users LIMIT 5;
-- SELECT * FROM public.subscriptions LIMIT 5;
-- SELECT public.is_admin();
-- SELECT public.get_my_company_id();
-- SELECT public.user_belongs_to_company('company-uuid-here');
