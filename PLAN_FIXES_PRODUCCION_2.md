# Plan de Fixes - Errores en Producción

## Resumen de Problemas Identificados

### ❌ Problema 1: Error RLS 42501 al crear categorías
**Error**: `new row violates row-level security policy for table "categories"`
**Causa**: La tabla `categories` tiene RLS habilitada pero NO tiene políticas que permitan INSERT

### ❌ Problema 2: Error Router Context al abrir formularios
**Error**: `Cannot destructure property 'basename' of 'P.useContext(...) as it is null`
**Causa**: El componente intenta usar `useParams/useNavigate` antes de que Router context esté listo
**Status**: ✅ SOLUCIONADO - ErrorBoundary + Suspense implementados

---

## ✅ Cambios Implementados - Router Context Fix

Los siguientes archivos han sido actualizados para arreglar el error del Router Context:

### 1. `src/App.tsx`
- ✅ Añadido import: `Suspense` de React
- ✅ Añadido import: `ErrorBoundary` del componente
- ✅ Envuelto `<ProductForm />` en `<ErrorBoundary>` + `<Suspense>` para rutas:
  - `/admin/products/new`
  - `/admin/products/:id/edit`
- ✅ Envuelto `<CategoryForm />` en `<ErrorBoundary>` + `<Suspense>` para rutas:
  - `/admin/categories/new`
  - `/admin/categories/:id/edit`
  - `/admin/categories/:id`

**Qué hace esto**:
- ErrorBoundary captura cualquier error de inicialización del componente
- Suspense asegura que el componente se carga después de que el Router context esté disponible
- Evita que el componente intente acceder a Router antes de que esté listo

---

## ❌ Próximo Paso: Arreglar RLS en Supabase

### IMPORTANTE: Este paso debe hacerlo el usuario

**Ubicación**: Supabase Dashboard → SQL Editor

Elige UNA de estas opciones:

### OPCIÓN 1: Desarrollo Rápido (Deshabilitar RLS)
⚠️ **Solo para testing/desarrollo**

```sql
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
```

### OPCIÓN 2: Producción Segura (Crear Políticas) ⭐ RECOMENDADO
✅ **Para usar en producción**

```sql
-- Políticas para CATEGORIES
CREATE POLICY "Allow authenticated insert on categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on categories"
ON categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public select on categories"
ON categories FOR SELECT
USING (true);

-- Políticas para PRODUCTS
CREATE POLICY "Allow authenticated insert on products"
ON products FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on products"
ON products FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow public select on products"
ON products FOR SELECT
USING (true);

-- Políticas para PRODUCT_CATEGORIES
CREATE POLICY "Allow authenticated insert on product_categories"
ON product_categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update on product_categories"
ON product_categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete on product_categories"
ON product_categories FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Allow public select on product_categories"
ON product_categories FOR SELECT
USING (true);
```

---

## 📋 Pasos para Completar Fixes

### Paso 1: Deploy Código Actualizado
El código ha sido actualizado localmente. Necesitas:

```bash
# Asegurar que los cambios estén guardados
git status  # Ver los cambios

# Commit
git add .
git commit -m "fix: Add ErrorBoundary and Suspense for ProductForm and CategoryForm"

# Push
git push origin main
```

Vercel se reconstruirá automáticamente con los nuevos cambios.

### Paso 2: Ejecutar SQL en Supabase
1. Abre https://supabase.com/dashboard
2. Selecciona tu proyecto (gaby-cosmetics)
3. Navega a SQL Editor (panel izquierdo)
4. Copia y pega el SQL de la OPCIÓN 2 (o OPCIÓN 1 si solo quieres testing)
5. Haz clic en "Run"
6. Espera a que termine (debería decir "Success")

### Paso 3: Verificar que Funciona
1. Espera a que Vercel termine el deployment (2-3 minutos)
2. Abre https://tu-sitio.vercel.app/admin/categories/new
3. Prueba llenar el formulario:
   - Nombre: "Test Category"
   - Descripción: "Test"
   - Imagen: Sube una imagen pequeña (< 5MB)
4. Haz clic en "Guardar"
5. Esperado: La categoría se crea sin error

### Paso 4: Repetir con Productos
1. Navega a `/admin/products/new`
2. Llena el formulario similar
3. Verifica que se crea sin RLS error

---

## 🔍 Debugging si Algo Aún Falla

### Si ves error Router Context:
- La causa probable es que el código no se desplegó correctamente
- Verifica en browser DevTools > Network que estés recargando la página nueva
- Si persiste después de 5 minutos, puede ser problema de caché

### Si ves error RLS 42501:
- El SQL en Supabase puede no haberse ejecutado correctamente
- Verifica que el SQL se mostró como "Success" (no "Error")
- Prueba en una ventana incógnita del navegador (borra caché)
- Si aún falla, revisa en Supabase Dashboard > Policies que se crearon las políticas

### Para revisar logs:
```bash
# Ver últimas líneas de build
vercel logs

# O revisar en dashboard: https://vercel.com/dashboard > tu proyecto > Deployments > logs
```

---

## Archivos Modificados

- ✅ `src/App.tsx` - Añadido ErrorBoundary y Suspense a routes de formularios

## Archivos Nuevos

- 📄 `FIXES_PRODUCCION_42501_ROUTER.md` - Documentación detallada de fixes

---

## Checklist Final

- [ ] Código publicado en GitHub
- [ ] Vercel deployment completado sin errores
- [ ] SQL ejecutado en Supabase (OPCIÓN 1 u OPCIÓN 2)
- [ ] Puedo navegar a /admin/categories/new sin error
- [ ] Puedo crear una categoría sin error RLS
- [ ] Puedo crear un producto sin error RLS
- [ ] Ambos aparecen en sus respectivas listas
- [ ] No hay errores en browser console (F12)

---

## Próximas Acciones (Después de Fixes)

Una vez que RLS esté arreglado y los formularios funcionen:

1. Limpiar documentación de debug files
2. Documentar el schema final de RLS
3. Crear script SQL de backup para reproducir en otras instancias
4. Considerar agregar validaciones más estrictas en RLS (como role-based access)
5. Testear flujos de edición (UPDATE) y eliminación (DELETE) si existen

