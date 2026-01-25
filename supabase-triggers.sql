-- ==========================================
-- GABY COSMETICS - SUPABASE TRIGGERS
-- Auto-create user profile when user signs up
-- ==========================================

-- Function to handle new user creation
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
    is_active
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email::text),
    NEW.raw_user_meta_data->>'avatar_url',
    COALESCE((NEW.raw_user_meta_data->>'role')::text, 'customer'),
    COALESCE(NEW.email_confirmed_at IS NOT NULL, false),
    true
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ==========================================
-- HELPER FUNCTION TO CHECK USER ROLE (AVOIDS RLS RECURSION)
-- ==========================================

-- Function to get user role without RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Use SECURITY DEFINER to bypass RLS
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;
  
  RETURN COALESCE(user_role, 'customer');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ==========================================
-- UPDATE RLS POLICIES FOR USERS TABLE
-- ==========================================

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.users;
DROP POLICY IF EXISTS "Consultants can view all users" ON public.users;
DROP POLICY IF EXISTS "Service role can insert users" ON public.users;

-- Allow users to view their own profile
CREATE POLICY "Users can view their own profile" 
ON public.users FOR SELECT 
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" 
ON public.users FOR UPDATE 
USING (auth.uid() = id);

-- Allow admins to view all users (using helper function to avoid recursion)
CREATE POLICY "Admins can view all users" 
ON public.users FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Allow admins to update all users (using helper function to avoid recursion)
CREATE POLICY "Admins can update all users" 
ON public.users FOR UPDATE 
USING (public.get_user_role(auth.uid()) = 'admin');

-- Allow consultants to view all users (read-only, using helper function)
CREATE POLICY "Consultants can view all users" 
ON public.users FOR SELECT 
USING (public.get_user_role(auth.uid()) = 'consultant');

-- Allow authenticated users to insert their own profile
-- This is needed when the trigger fails or for manual inserts
CREATE POLICY "Users can insert their own profile" 
ON public.users FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Allow the trigger function to insert users (SECURITY DEFINER handles this)
-- But we also need a policy for when the app tries to insert directly

-- ==========================================
-- GRANT PERMISSIONS
-- ==========================================

-- Grant necessary permissions to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.users TO authenticated;

-- Grant execute permission on helper function
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;

-- Grant insert permission to the trigger function (via SECURITY DEFINER)
-- The function runs with the privileges of the function owner (postgres)
