-- ==========================================
-- FIX ADMIN - SIN USAR auth.uid()
-- Ejecutar esto en el SQL Editor de Supabase
-- ==========================================

-- 1. Ver TODOS los usuarios en auth.users
SELECT id, email, email_confirmed_at, created_at 
FROM auth.users 
ORDER BY created_at;

-- 2. Ver TODOS los usuarios en public.users
SELECT id, email, role, is_active, created_at 
FROM public.users 
ORDER BY created_at;

-- 3. Ver qué usuarios están en auth.users pero NO en public.users
SELECT 
  au.id, 
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.email_confirmed_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 4. Crear usuarios faltantes en public.users
INSERT INTO public.users (id, email, full_name, role, is_active, email_verified, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  COALESCE((au.raw_user_meta_data->>'role')::text, 'customer'),
  true,
  au.email_confirmed_at IS NOT NULL,
  au.created_at,
  now()
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE pu.id IS NULL;

-- 5. Ahora actualiza el rol del usuario admin
-- REEMPLAZA 'admin@gabycosmetics.com' con tu email real
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'admin@gabycosmetics.com';

-- Si no sabes el email, puedes usar el primer usuario:
-- UPDATE public.users SET role = 'admin' WHERE id = (SELECT id FROM public.users ORDER BY created_at LIMIT 1);

-- 6. Verificar que el admin tiene el rol correcto
SELECT id, email, role FROM public.users WHERE role = 'admin';

-- 7. Verificar que la función is_admin funciona
-- Nota: Esto devolverá false en el SQL Editor porque no hay usuario autenticado
-- Pero debería funcionar en la aplicación
SELECT public.is_admin();
