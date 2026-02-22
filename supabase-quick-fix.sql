-- ==========================================
-- QUICK FIX - EJECUTAR ESTO PRIMERO
-- ==========================================

-- 1. Ver todos los usuarios actuales
SELECT id, email, role, is_active, created_at FROM public.users ORDER BY created_at;

-- 2. Ver qué usuario está autenticado ahora (debería mostrar tu ID)
SELECT auth.uid() as my_id;

-- 3. Asegurar que el usuario actual tiene rol admin
-- Esto actualiza el usuario actualmente autenticado a rol admin
UPDATE public.users 
SET role = 'admin' 
WHERE id = auth.uid();

-- 4. Verificar que el cambio se aplicó
SELECT id, email, role FROM public.users WHERE id = auth.uid();

-- 5. Probar la función is_admin() - debe devolver true
SELECT public.is_admin() as soy_admin;

-- ==========================================
-- Si el paso 3 no funcionó (0 rows affected),
-- ejecuta esto con tu email específico:
-- ==========================================

-- UPDATE public.users SET role = 'admin' WHERE email = 'TU_EMAIL_AQUI';

-- ==========================================
-- Si el usuario no existe en public.users,
-- crearlo desde auth.users:
-- ==========================================

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
WHERE id = auth.uid()
AND NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.users.id);
