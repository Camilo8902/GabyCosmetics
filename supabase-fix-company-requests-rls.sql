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
DROP POLICY IF EXISTS "Allow insert during registration" ON public.users;

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
-- STEP 5: ADD INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_company_requests_status ON public.company_requests(status);
CREATE INDEX IF NOT EXISTS idx_company_requests_created_at ON public.company_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_companies_status ON public.companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_is_active ON public.companies(is_active);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ==========================================
-- STEP 6: Grant permissions
-- ==========================================

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon;

-- ==========================================
-- STEP 7: Create function to approve company request
-- This creates user, company and updates request
-- ==========================================

CREATE OR REPLACE FUNCTION public.approve_company_request(
  p_request_id UUID,
  p_reviewer_notes TEXT DEFAULT NULL,
  p_temp_password TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
  v_user_id UUID;
  v_company_id UUID;
  v_base_slug TEXT;
  v_slug TEXT;
  v_counter INT := 0;
BEGIN
  -- Get the request
  SELECT * INTO v_request
  FROM public.company_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Solicitud no encontrada');
  END IF;
  
  IF v_request.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'La solicitud ya fue procesada');
  END IF;
  
  -- Check if user already exists
  SELECT id INTO v_user_id 
  FROM public.users 
  WHERE email = v_request.email;
  
  -- If user doesn't exist, create them
  IF v_user_id IS NULL THEN
    -- Create auth user using admin API (requires service role)
    -- For now, we'll create just the public.users record
    -- The auth user should be created via Edge Function or admin API
    
    -- Generate a UUID for the new user
    v_user_id := gen_random_uuid();
    
    -- Insert into public.users
    INSERT INTO public.users (
      id,
      email,
      full_name,
      role,
      is_active,
      email_verified,
      created_at,
      updated_at
    ) VALUES (
      v_user_id,
      v_request.email,
      v_request.owner_name,
      'company',
      true,
      false,
      now(),
      now()
    );
  END IF;
  
  -- Generate unique slug
  v_base_slug := lower(regexp_replace(
    regexp_replace(v_request.business_name, '[^a-zA-Z0-9\s]', '', 'g'),
    '\s+', '-', 'g'
  ));
  v_base_slug := regexp_replace(v_base_slug, '(^-|-$)', '', 'g');
  v_slug := v_base_slug;
  
  -- Ensure unique slug
  WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = v_slug) LOOP
    v_counter := v_counter + 1;
    v_slug := v_base_slug || '-' || v_counter;
  END LOOP;
  
  -- Create the company
  INSERT INTO public.companies (
    user_id,
    company_name,
    slug,
    email,
    phone,
    business_type,
    status,
    is_active,
    is_verified,
    plan,
    approved_by,
    approved_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_request.business_name,
    v_slug,
    v_request.email,
    v_request.phone,
    v_request.business_type,
    'active',
    true,
    true,
    'basic',
    auth.uid(),
    now(),
    now(),
    now()
  ) RETURNING id INTO v_company_id;
  
  -- Update the request
  UPDATE public.company_requests
  SET 
    status = 'approved',
    notes = COALESCE(p_reviewer_notes, notes),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_request_id;
  
  RETURN json_build_object(
    'success', true,
    'company_id', v_company_id,
    'user_id', v_user_id,
    'company_name', v_request.business_name,
    'slug', v_slug
  );
END;
$$;

-- ==========================================
-- STEP 8: Create function to reject company request
-- ==========================================

CREATE OR REPLACE FUNCTION public.reject_company_request(
  p_request_id UUID,
  p_reviewer_notes TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_request RECORD;
BEGIN
  -- Get the request
  SELECT * INTO v_request
  FROM public.company_requests
  WHERE id = p_request_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Solicitud no encontrada');
  END IF;
  
  IF v_request.status != 'pending' THEN
    RETURN json_build_object('success', false, 'error', 'La solicitud ya fue procesada');
  END IF;
  
  -- Update the request
  UPDATE public.company_requests
  SET 
    status = 'rejected',
    notes = COALESCE(p_reviewer_notes, notes),
    reviewed_by = auth.uid(),
    reviewed_at = now(),
    updated_at = now()
  WHERE id = p_request_id;
  
  RETURN json_build_object(
    'success', true,
    'request_id', p_request_id
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.approve_company_request(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_company_request(UUID, TEXT) TO authenticated;

-- ==========================================
-- VERIFICATION QUERIES (run after applying)
-- ==========================================

-- Test: SELECT * FROM company_requests LIMIT 5;
-- Test: SELECT * FROM companies LIMIT 5;
-- Test: SELECT * FROM users LIMIT 5;
-- Test: SELECT public.is_admin();
