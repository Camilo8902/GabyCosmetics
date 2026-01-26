# Fixes para Errores en Producción

## Error 1: RLS Policy 42501 - "new row violates row-level security policy"

### Situación
Cuando intentas crear una categoría, recibes error:
```
Error creating category: {
  code: '42501',
  message: 'new row violates row-level security policy for table "categories"'
}
```

### Causa
La tabla `categories` en Supabase tiene **Row Level Security (RLS)** habilitada, pero **NO tiene políticas que permitan INSERT a usuarios autenticados**.

### Solución

#### OPCIÓN 1: Desarrollo Rápido (Deshabilitar RLS)
⚠️ **Solo para desarrollo/testing, NO para producción**

1. Abre Supabase Dashboard
2. Navega a **SQL Editor**
3. Copia y ejecuta:

```sql
-- Deshabilitar RLS en las tablas problemáticas
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
```

4. Recarga tu aplicación e intenta crear una categoría nuevamente

#### OPCIÓN 2: Producción Segura (Crear Políticas RLS)
✅ **Recomendado para producción**

1. Abre Supabase Dashboard  
2. Navega a **SQL Editor**
3. Ejecuta las siguientes políticas:

```sql
-- Políticas para tabla CATEGORIES
-- Permitir que usuarios autenticados creen categorías
CREATE POLICY "Allow authenticated insert on categories"
ON categories FOR INSERT
TO authenticated
WITH CHECK (true);

-- Permitir que usuarios autenticados actualicen categorías
CREATE POLICY "Allow authenticated update on categories"
ON categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Permitir que todos vean categorías
CREATE POLICY "Allow public select on categories"
ON categories FOR SELECT
USING (true);

-- Políticas para tabla PRODUCTS
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

-- Políticas para tabla PRODUCT_CATEGORIES
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

4. Recarga tu aplicación e intenta crear una categoría

### Verificación
Después de ejecutar el SQL, verifica que funcione:

```sql
-- Verificar que las tablas tienen las políticas correctas
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('categories', 'products', 'product_categories');

-- Debería mostrar rowsecurity = 't' (true)
```

---

## Error 2: Router Context - "Cannot destructure property 'basename'"

### Situación
Cuando navegas a `/admin/products/new` o `/admin/categories/new`, ves:
```
TypeError: Cannot destructure property 'basename' of 'P.useContext(...)' as it is null
```

### Causa
El componente `ProductForm` o `CategoryForm` está intentando usar hooks de React Router (`useParams`, `useNavigate`) pero el **contexto del Router no está disponible** en ese momento.

Esto sucede típicamente cuando:
1. El componente intenta acceder al Router context antes de que React Router se haya inicializado completamente
2. El componente está siendo renderizado fuera del contexto del BrowserRouter
3. En producción, hay un problema de ordenamiento de inicialización

### Solución

#### Paso 1: Añadir Error Boundary
Crea un archivo `src/components/ErrorBoundary.tsx` si no existe con:

```tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class FormErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('Form Error Boundary caught:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Error en el formulario</h1>
            <p className="text-gray-700 mb-4">{this.state.error?.message}</p>
            <button
              onClick={() => window.location.href = '/admin'}
              className="px-4 py-2 bg-rose-600 text-white rounded hover:bg-rose-700"
            >
              Volver al Dashboard
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

#### Paso 2: Actualizar App.tsx
Abre `src/App.tsx` y reemplaza la ruta del ProductForm:

```tsx
// CAMBIO EN: <Route path="products/new" element={<ProductForm />} />
// A:
<Route path="products/new" element={
  <Suspense fallback={<div>Cargando formulario...</div>}>
    <FormErrorBoundary>
      <ProductForm />
    </FormErrorBoundary>
  </Suspense>
} />

// Lo mismo para otras rutas de formulario:
<Route path="products/:id/edit" element={
  <Suspense fallback={<div>Cargando formulario...</div>}>
    <FormErrorBoundary>
      <ProductForm />
    </FormErrorBoundary>
  </Suspense>
} />

<Route path="categories/new" element={
  <Suspense fallback={<div>Cargando formulario...</div>}>
    <FormErrorBoundary>
      <CategoryForm />
    </FormErrorBoundary>
  </Suspense>
} />

<Route path="categories/:id/edit" element={
  <Suspense fallback={<div>Cargando formulario...</div>}>
    <FormErrorBoundary>
      <CategoryForm />
    </FormErrorBoundary>
  </Suspense>
} />
```

Y añade el import al principio del archivo:
```tsx
import { Suspense } from 'react';
import { FormErrorBoundary } from '@/components/ErrorBoundary';
```

#### Paso 3: Alternativamente, Usa Lazy Loading
Si el Error Boundary no funciona, prueba con lazy loading (este es un fix más agresivo):

Crea `src/pages/admin/products/ProductFormLazy.tsx`:
```tsx
import { lazy, Suspense } from 'react';

const ProductFormComponent = lazy(() => 
  import('./ProductForm').then(m => ({ default: m.ProductForm }))
);

export function ProductFormLazy() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando...</div>}>
      <ProductFormComponent />
    </Suspense>
  );
}
```

Luego en App.tsx:
```tsx
import { ProductFormLazy } from '@/pages/admin/products/ProductFormLazy';

// En las rutas:
<Route path="products/new" element={<ProductFormLazy />} />
<Route path="products/:id/edit" element={<ProductFormLazy />} />
```

---

## Orden Recomendado de Fixes

1. **Primero**: Arregla el error RLS (es lo que bloquea las creaciones)
   - Elige OPCIÓN 1 (rápido) u OPCIÓN 2 (seguro)
   - Ejecuta el SQL en Supabase

2. **Después**: Prueba crear una categoría
   - Si funciona → RLS está arreglado ✅
   - Si falla con otro error → Investiga más

3. **Luego**: Arregla el Router Context si persiste
   - Añade FormErrorBoundary
   - Recarga la página
   - Si aún falla, usa Lazy Loading

4. **Finalmente**: Deploy a producción
   - Commit y push los cambios
   - Vercel se reconstruirá automáticamente

---

## Testing Checklist

- [ ] RLS SQL ejecutado sin errores en Supabase
- [ ] FormErrorBoundary añadido a App.tsx (si fue necesario)
- [ ] Puedes navegar a `/admin/categories/new` sin error
- [ ] Puedes llenar el formulario de categoría sin error
- [ ] Puedo hacer clic en "Guardar" sin error
- [ ] La categoría se crea en Supabase
- [ ] Puedo verla en la lista de categorías

---

## Debugging Adicional

Si aún tienes problemas, abre la consola de browser (F12) y mira los logs:

```javascript
// En la consola del navegador:
// Busca logs que digan qué error específico está ocurriendo

// Si ves "RLS" o "42501" → Aún hay problema con RLS
// Si ves "Router" o "basename" → Aún hay problema con Router context
```

También revisa el Network tab en DevTools para ver qué respuesta da Supabase cuando haces una creación.
