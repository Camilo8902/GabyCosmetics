# 🔧 Correcciones de Autenticación

## Problemas Identificados y Solucionados

### 1. Error "Auth session missing!"

**Problema:** `supabase.auth.getUser()` fallaba cuando no había sesión activa.

**Solución:**
- Cambiado a usar `supabase.auth.getSession()` primero, que es más confiable
- Mejor manejo de errores cuando no hay sesión
- No se lanza error, solo se marca como no autenticado

### 2. Páginas en Blanco al Cambiar de Pestaña

**Problema:** React Query estaba intentando refetch cuando la pestaña volvía a estar activa, causando problemas.

**Solución:**
- Deshabilitado `refetchOnWindowFocus` en React Query
- Agregado listener de `visibilitychange` para verificar autenticación cuando la pestaña vuelve a estar activa
- Mejorado el manejo de errores en queries

### 3. Queries Fallando por Autenticación

**Problema:** Las queries fallaban silenciosamente cuando había problemas de autenticación.

**Solución:**
- Agregado `onError` handlers en React Query
- No se reintenta en errores de autenticación
- Mejor logging de errores

---

## Cambios Realizados

### `src/store/authStore.ts`
- ✅ Cambiado `getUser()` por `getSession()` primero
- ✅ Mejor manejo cuando no hay sesión

### `src/App.tsx`
- ✅ Agregado listener de `visibilitychange`
- ✅ Mejorado el manejo de auth state changes
- ✅ Agregado cleanup apropiado

### `src/App.tsx` - QueryClient
- ✅ Deshabilitado `refetchOnWindowFocus`
- ✅ Agregado `onError` handlers
- ✅ No retry en errores de autenticación

---

## Cómo Verificar que Funciona

1. **Inicia sesión** normalmente
2. **Navega al panel admin** (`/admin`)
3. **Cambia a otra pestaña** y vuelve
4. **Verifica** que las páginas cargan correctamente
5. **Revisa la consola** - no debería haber errores de "Auth session missing!"

---

## Si Aún Tienes Problemas

1. **Limpia el localStorage:**
   ```javascript
   localStorage.removeItem('gaby-auth-storage');
   localStorage.removeItem('sb-*'); // Supabase session
   ```

2. **Cierra sesión y vuelve a iniciar sesión**

3. **Verifica las variables de entorno en Vercel:**
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

4. **Revisa la consola del navegador** para ver logs específicos

---

## Notas Técnicas

- `getSession()` es más confiable que `getUser()` porque verifica la sesión almacenada localmente primero
- `refetchOnWindowFocus: false` previene que React Query intente refetch cuando la pestaña vuelve a estar activa, lo cual causaba problemas
- El listener de `visibilitychange` verifica la autenticación cuando la pestaña vuelve a estar activa, pero sin forzar refetch de queries
