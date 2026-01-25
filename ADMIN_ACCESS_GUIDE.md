# 🔐 Guía de Acceso al Panel de Administración

## ✅ Problema Resuelto

Se ha corregido el problema de navegación al panel de administración. Ahora los usuarios con rol `admin` pueden acceder correctamente.

---

## 🚀 Cómo Acceder al Panel de Administración

### Opción 1: Desde el Menú de Usuario (Recomendado)

1. **Inicia sesión** con tu cuenta de administrador
2. Haz clic en el **ícono de usuario** (arriba a la derecha)
3. En el menú desplegable, haz clic en **"Panel Admin"**
4. Serás redirigido a `/admin`

### Opción 2: Acceso Directo por URL

1. Asegúrate de estar **autenticado** como administrador
2. Navega directamente a: `https://tu-dominio.com/admin`
3. Si no tienes el rol correcto, serás redirigido a la página principal

---

## 🔍 Verificación de Rol

Para verificar que tu usuario tiene el rol de administrador:

1. **En la base de datos Supabase:**
   ```sql
   SELECT id, email, role, is_active 
   FROM public.users 
   WHERE email = 'tu-email@ejemplo.com';
   ```
   
   El campo `role` debe ser `'admin'`

2. **En la consola del navegador:**
   - Abre las DevTools (F12)
   - Ve a la pestaña "Console"
   - Deberías ver logs como:
     ```
     ✅ ProtectedRoute - Acceso permitido para: admin
     ```

---

## 🛠️ Solución de Problemas

### Problema: "Se queda cargando"

**Causas posibles:**
1. El usuario no tiene el rol `admin` en la base de datos
2. El estado de autenticación no se está cargando correctamente
3. Hay un error en la verificación del rol

**Solución:**
1. Verifica el rol en Supabase (ver arriba)
2. Limpia el localStorage:
   ```javascript
   localStorage.removeItem('gaby-auth-storage');
   ```
3. Cierra sesión y vuelve a iniciar sesión
4. Revisa la consola del navegador para errores

### Problema: "Acceso Denegado"

**Causa:** Tu rol no es `admin`

**Solución:**
1. Actualiza tu rol en Supabase:
   ```sql
   UPDATE public.users 
   SET role = 'admin' 
   WHERE email = 'tu-email@ejemplo.com';
   ```
2. Cierra sesión y vuelve a iniciar sesión

### Problema: Redirige a Login

**Causa:** No estás autenticado

**Solución:**
1. Inicia sesión primero
2. Verifica que la sesión de Supabase esté activa

---

## 📊 Estado Actual del Panel

### ✅ Implementado (Sub-Fase 5.1)

1. **Dashboard Principal:**
   - ✅ Métricas en tiempo real (Productos, Pedidos, Usuarios, Ingresos)
   - ✅ Tendencias comparativas (mes anterior)
   - ✅ Pedidos recientes (últimos 5)
   - ✅ Productos destacados
   - ✅ Acciones rápidas

2. **Navegación:**
   - ✅ Sidebar funcional
   - ✅ Rutas protegidas por rol
   - ✅ Menú responsive

3. **Datos Reales:**
   - ✅ Conectado con Supabase
   - ✅ Usa hooks de React Query
   - ✅ Loading states
   - ✅ Error handling

### ⚠️ Pendiente (Próximas Fases)

- Gestión de Productos (CRUD completo)
- Gestión de Pedidos (detalle y actualización de estados)
- Gestión de Usuarios
- Gestión de Empresas
- Gestión de Categorías
- Reportes y gráficos
- Configuración del sistema

---

## 🎯 Próximos Pasos

Según el plan (`ADMIN_PHASE_PLAN.md`), las siguientes implementaciones serán:

1. **Sub-Fase 5.2:** Gestión completa de productos (CRUD)
2. **Sub-Fase 5.3:** Gestión completa de pedidos
3. **Sub-Fase 5.4:** Gestión de usuarios y empresas
4. **Sub-Fase 5.5:** Categorías, reportes y configuración

---

## 💡 Notas Importantes

1. **Seguridad:** El panel está protegido por `ProtectedRoute` que verifica el rol antes de permitir el acceso
2. **Datos:** El dashboard ahora muestra datos reales de tu base de datos
3. **Performance:** Los datos se cachean durante 5 minutos para mejor rendimiento
4. **Responsive:** El panel es completamente responsive y funciona en móvil

---

## 🐛 Debugging

Si encuentras problemas, revisa:

1. **Consola del navegador:**
   - Busca logs que empiecen con `🔒`, `✅`, `❌`
   - Estos te dirán exactamente qué está pasando

2. **Red (Network tab):**
   - Verifica que las peticiones a Supabase se completen
   - Revisa los códigos de respuesta (deben ser 200)

3. **Estado de autenticación:**
   ```javascript
   // En la consola del navegador
   const authStore = useAuthStore.getState();
   console.log('Usuario:', authStore.user);
   console.log('Autenticado:', authStore.isAuthenticated);
   console.log('Rol:', authStore.user?.role);
   ```

---

## ✅ Checklist de Verificación

- [ ] Usuario tiene rol `admin` en Supabase
- [ ] Usuario está autenticado
- [ ] Puedo ver el menú de usuario en el header
- [ ] El link "Panel Admin" aparece en el menú
- [ ] Al hacer clic, navega a `/admin`
- [ ] El dashboard se carga correctamente
- [ ] Las métricas muestran datos (o 0 si no hay datos)
- [ ] No hay errores en la consola

---

¿Necesitas ayuda? Revisa los logs en la consola del navegador para más información.
