-- ==========================================
-- CONFIGURACIÓN DE AUTENTICACIÓN DE SUPABASE
-- Ejecutar en SQL Editor para ajustar tiempos de expiración
-- ==========================================

-- NOTA: Estos ajustes deben configurarse en el Dashboard de Supabase:
-- Authentication → URL Configuration

-- 1. Ver la configuración actual de auth
SELECT * FROM auth.config;

-- 2. Los ajustes de expiración se configuran en:
-- Supabase Dashboard → Authentication → URL Configuration
-- 
-- Ajustes recomendados:
-- - Site URL: https://tu-dominio.com
-- - Redirect URLs: 
--   - https://tu-dominio.com/auth/callback
--   - https://tu-dominio.com/auth/reset-password
-- - Email Auth:
--   - Enable Email Confirmations: ON
--   - Secure Email Change: ON
--   - Secure Password Change: ON

-- 3. Para extender el tiempo de expiración de los tokens:
-- Ve a Authentication → Settings → Email
-- - JWT expiry: 3600 (1 hora) o más
-- - Refresh token expiry: 86400 (1 día) o más

-- 4. Verificar usuarios pendientes de verificación
SELECT 
  id, 
  email, 
  email_confirmed_at,
  created_at,
  confirmation_sent_at,
  last_sign_in_at
FROM auth.users 
WHERE email_confirmed_at IS NULL
ORDER BY created_at DESC;

-- 5. Confirmar email manualmente para un usuario específico
-- Útil si el usuario no recibe el email
UPDATE auth.users 
SET email_confirmed_at = now(),
    confirmation_token = null,
    confirmation_sent_at = null
WHERE email = 'EMAIL_DEL_USUARIO_AQUI';

-- 6. También actualizar en public.users
UPDATE public.users 
SET email_verified = true 
WHERE email = 'EMAIL_DEL_USUARIO_AQUI';

-- 7. Generar un nuevo enlace de verificación (usando función admin)
-- Esto requiere service_role key, no funciona desde el cliente
-- SELECT auth.admin.generate_link('email', 'signup');

-- ==========================================
-- SOLUCIÓN ALTERNATIVA: Desactivar verificación de email
-- Solo para desarrollo/testing
-- ==========================================

-- ADVERTENCIA: Esto permite registro sin verificación de email
-- No recomendado para producción

-- UPDATE auth.config SET value = 'false' WHERE key = 'enable_signup_email_verify';
