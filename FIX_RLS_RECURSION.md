# 🔧 Solución: Error de Recursión Infinita en RLS

## ❌ Problema

Error al autenticarse:
```
infinite recursion detected in policy for relation "users"
```

**Causa**: Las políticas RLS estaban causando recursión infinita porque:
1. La política "Admins can view all users" intenta verificar si el usuario es admin
2. Para verificar esto, necesita hacer SELECT en la tabla `users`
3. Ese SELECT también pasa por las políticas RLS
4. Esto causa recursión infinita

## ✅ Solución

Se creó una función helper `get_user_role()` que:
- Usa `SECURITY DEFINER` para leer directamente sin pasar por RLS
- Evita la recursión infinita
- Se usa en todas las políticas que necesitan verificar roles

## 📋 Pasos para Aplicar la Solución

### Paso 1: Ejecutar el Script SQL Actualizado

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **SQL Editor**
3. Abre el archivo `supabase-triggers.sql` actualizado
4. **Copia TODO el contenido** del archivo
5. Pega en el SQL Editor de Supabase
6. Haz clic en **Run** (o presiona F5)

### Paso 2: Verificar que se Aplicaron los Cambios

1. Ve a **Database** → **Functions**
2. Deberías ver la función `get_user_role`
3. Ve a **Database** → **Tables** → **users** → **Policies**
4. Deberías ver las políticas actualizadas:
   - ✅ Users can view their own profile
   - ✅ Users can update their own profile
   - ✅ Admins can view all users
   - ✅ Admins can update all users
   - ✅ Consultants can view all users
   - ✅ Users can insert their own profile

### Paso 3: Probar la Autenticación

1. Ve a tu aplicación
2. Intenta iniciar sesión
3. Abre la consola del navegador (F12)
4. Deberías ver:
   - ✅ No más errores de recursión
   - ✅ "✅ Perfil de usuario encontrado/creado"
   - ✅ Autenticación exitosa

## 🔍 Verificación

### Verificar la Función Helper

Ejecuta en SQL Editor:
```sql
SELECT public.get_user_role(auth.uid());
```

Debería retornar el rol del usuario actual (o 'customer' si no existe).

### Verificar las Políticas

1. Ve a **Database** → **Tables** → **users**
2. Haz clic en **Policies**
3. Verifica que todas las políticas estén presentes
4. Las políticas de admin/consultant deberían usar `public.get_user_role(auth.uid())`

## 🐛 Si Aún Hay Problemas

### Error: "function get_user_role does not exist"

**Solución**: Asegúrate de ejecutar TODO el script SQL, incluyendo la creación de la función.

### Error: "permission denied for function get_user_role"

**Solución**: Verifica que se hayan ejecutado los GRANT statements:
```sql
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role(UUID) TO anon;
```

### Error: Sigue habiendo recursión

**Solución**: 
1. Elimina todas las políticas de la tabla users:
   ```sql
   DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
   DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
   DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
   DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
   DROP POLICY IF EXISTS "Consultants can view all users" ON public.users;
   DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
   ```

2. Vuelve a ejecutar el script completo `supabase-triggers.sql`

## 📝 Cambios Realizados

1. **Nueva función helper**: `get_user_role(UUID)` que lee roles sin pasar por RLS
2. **Políticas actualizadas**: Todas las políticas que verifican roles ahora usan la función helper
3. **Política de INSERT agregada**: Permite que los usuarios inserten su propio perfil
4. **Permisos actualizados**: Se agregaron permisos para ejecutar la función helper

## ✅ Checklist

- [ ] Script SQL ejecutado completamente
- [ ] Función `get_user_role` creada
- [ ] Todas las políticas actualizadas
- [ ] Permisos GRANT ejecutados
- [ ] Autenticación funciona sin errores
- [ ] No hay errores de recursión en la consola

---

**Importante**: Después de ejecutar el script, prueba la autenticación inmediatamente. Si hay algún error, revisa los logs en Supabase Dashboard → **Logs**.
