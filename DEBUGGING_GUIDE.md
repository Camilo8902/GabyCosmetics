# 🐛 Guía de Debugging - Problemas de Autenticación y Páginas en Blanco

## Problemas Reportados

1. ❌ Error `AuthSessionMissingError` en consola
2. ❌ Páginas del admin se muestran en blanco (solo título)

---

## Soluciones Implementadas

### 1. Manejo de Errores en Servicios

Todos los servicios ahora:
- ✅ Retornan arrays vacíos en lugar de lanzar errores de autenticación
- ✅ Manejan errores de Supabase silenciosamente
- ✅ No lanzan excepciones para errores de "no hay sesión"

### 2. Manejo de Errores en Hooks

Todos los hooks ahora:
- ✅ Envuelven las llamadas a servicios en try-catch
- ✅ Retornan datos vacíos en caso de error
- ✅ No reintentan en errores de autenticación

### 3. Estados de Loading Mejorados

Todas las listas ahora:
- ✅ Muestran spinner de loading mientras cargan
- ✅ Muestran mensaje cuando no hay datos
- ✅ Muestran error solo para errores reales (no de auth)

### 4. Función getSession() Segura

- ✅ No lanza errores cuando no hay sesión
- ✅ Retorna `{ session: null, error: null }` cuando es normal

---

## Cómo Verificar que Funciona

### Paso 1: Limpiar Todo

```javascript
// En la consola del navegador (F12)
localStorage.clear();
sessionStorage.clear();
// Luego recarga la página (F5)
```

### Paso 2: Verificar Sin Autenticar

1. Abre la página principal sin autenticar
2. Abre la consola (F12)
3. **Deberías ver:** Solo logs informativos, NO errores rojos
4. **NO deberías ver:** `AuthSessionMissingError`

### Paso 3: Autenticarte

1. Inicia sesión normalmente
2. Verifica que funcione sin errores

### Paso 4: Navegar al Admin

1. Ve a `/admin`
2. **Deberías ver:** Dashboard con datos o "0" si no hay datos
3. **NO deberías ver:** Página en blanco

### Paso 5: Navegar a las Listas

1. Ve a `/admin/products`
2. **Deberías ver:**
   - Spinner mientras carga
   - Tabla con productos (o mensaje "No se encontraron productos")
3. **NO deberías ver:** Página completamente en blanco

---

## Si Aún Ves el Error

### Opción 1: Verificar Variables de Entorno

Asegúrate de que en Vercel tengas:
- `VITE_SUPABASE_URL` - URL completa de tu proyecto
- `VITE_SUPABASE_ANON_KEY` - Clave anónima de Supabase

### Opción 2: Verificar RLS Policies

El error puede venir de políticas RLS que bloquean el acceso. Verifica en Supabase:
- Las políticas RLS están configuradas correctamente
- El usuario admin tiene permisos para leer todas las tablas

### Opción 3: Revisar Logs de Supabase

1. Ve a Supabase Dashboard
2. Revisa los logs de autenticación
3. Verifica que las queries se estén ejecutando correctamente

---

## Debugging Avanzado

### Ver Estado de Autenticación

```javascript
// En la consola del navegador
const authStore = useAuthStore.getState();
console.log('Usuario:', authStore.user);
console.log('Autenticado:', authStore.isAuthenticated);
console.log('Cargando:', authStore.isLoading);
```

### Ver Sesión de Supabase

```javascript
// En la consola del navegador
const { data: { session } } = await supabase.auth.getSession();
console.log('Sesión:', session);
```

### Verificar Queries

Abre la pestaña "Network" en DevTools:
- Busca requests a `supabase.co`
- Verifica los códigos de respuesta
- Si ves 401 o 403, hay un problema de autenticación/autorización

---

## Posibles Causas del Error Persistente

1. **Supabase está llamando a `getUser()` internamente**
   - Esto puede pasar en algunas versiones de Supabase
   - La solución es usar `getSession()` siempre

2. **Las queries se ejecutan antes de que el usuario esté autenticado**
   - Verifica que `ProtectedRoute` esté funcionando
   - Las queries solo deberían ejecutarse dentro de rutas protegidas

3. **Problema con RLS Policies**
   - Las políticas pueden estar bloqueando el acceso
   - Verifica que el usuario admin tenga permisos

---

## Si las Páginas Siguen en Blanco

### Verificar:

1. **¿Hay errores en la consola?**
   - Abre DevTools (F12)
   - Ve a la pestaña "Console"
   - Busca errores en rojo

2. **¿Las queries se están ejecutando?**
   - Ve a la pestaña "Network"
   - Busca requests a Supabase
   - Verifica que se completen (código 200)

3. **¿El componente se está renderizando?**
   - Agrega un `console.log` al inicio del componente
   - Si no ves el log, el componente no se está montando

4. **¿Hay datos pero no se muestran?**
   - Agrega `console.log(data)` después de `useProducts()`
   - Verifica que `data` tenga el formato correcto

---

## Código de Debugging Temporal

Si necesitas más información, agrega esto temporalmente:

```typescript
// En ProductsList.tsx, después de useProducts
console.log('🔍 Debug ProductsList:', {
  isLoading,
  error,
  data,
  products,
  total,
});
```

Esto te ayudará a ver exactamente qué está pasando.

---

## Contacto

Si después de seguir esta guía sigues teniendo problemas, comparte:
1. Logs completos de la consola
2. Screenshot de la pestaña Network
3. Estado del usuario (del código de debugging arriba)
