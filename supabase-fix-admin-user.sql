-- ==========================================
-- FIX ADMIN USER ROLE
-- Ejecutar esto para asegurar que el usuario admin tenga rol 'admin'
-- ==========================================

-- 1. Ver todos los usuarios y sus roles
SELECT id, email, role, is_active FROM public.users ORDER BY created_at;

-- 2. Ver el usuario actualmente autenticado (ejecutar desde la app)
-- SELECT auth.uid();

-- 3. Actualizar el rol del usuario admin
-- REEMPLAZA 'admin@example.com' con el email de tu usuario admin
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@gabycosmetics.com';

-- Si no sabes el email, puedes actualizar por ID:
-- UPDATE public.users SET role = 'admin' WHERE id = 'uuid-del-usuario';

-- 4. Verificar que el rol se actualizó
SELECT id, email, role, is_active FROM public.users WHERE role = 'admin';

-- 5. Si el usuario admin no existe en public.users, crearlo
-- Primero obtener el ID del usuario de auth.users:
-- SELECT id, email FROM auth.users WHERE email LIKE '%admin%';

-- Luego insertar en public.users si no existe:
INSERT INTO public.users (id, email, full_name, role, is_active, email_verified, created_at, updated_at)
SELECT 
  id,
  email,
  COALESCE(raw_user_meta_data->>'full_name', email),
  'admin',
  true,
  email_confirmed_at IS NOT NULL,
  created_at,
  now()
FROM auth.users 
WHERE email = 'admin@gabycosmetics.com'
AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.users.id);

-- 6. Verificar la función is_admin()
SELECT public.is_admin();

-- 7. Si is_admin() devuelve false, verificar que el usuario tiene role = 'admin'
SELECT 
  u.id, 
  u.email, 
  u.role,
  auth.uid() as current_auth_uid,
  CASE WHEN u.id = auth.uid() THEN 'YES' ELSE 'NO' END as is_current_user
FROM public.users u
WHERE u.id = auth.uid();
