# Solución: Error "Bucket not found"

## Problema

Cuando intentas crear un producto con imagen, obtienes el error:
```
StorageApiError: Bucket not found
```

Esto significa que el bucket `product-images` no existe en Supabase Storage.

---

## Solución

### Opción 1: Crear el Bucket en Supabase (RECOMENDADO)

#### Paso 1: Ir a Supabase Dashboard
1. Abre [Supabase](https://app.supabase.com)
2. Selecciona tu proyecto
3. En el menú lateral, ve a **Storage**

#### Paso 2: Crear Nuevo Bucket
1. Click en **"Create Bucket"** (botón azul arriba a la derecha)
2. Nombre del bucket: `product-images`
3. **IMPORTANTE**: Marca ✓ "Public bucket"
4. Click en **"Create bucket"**

#### Paso 3: Configurar Políticas de Seguridad (RLS)

1. Dentro del bucket `product-images`, ve a **Policies**
2. Click en **"New Policy"**
3. Elige template: **"For public access"**
4. Revisa que dice:
   ```
   SELECT
   ```
5. Click en **"Review"** y luego **"Save policy"**

#### Paso 4: Crear Política para Upload

1. De nuevo en Policies, click en **"New Policy"**
2. Elige template: **"Give AUTHENTICATED users full access"**
3. Asegúrate que dice:
   ```
   SELECT, INSERT, UPDATE, DELETE
   ```
4. Click en **"Review"** y luego **"Save policy"**

#### Paso 5: Crear Política para Lectura Pública

1. De nuevo en Policies, click en **"New Policy"**
2. Elige template: **"Give ANONYMOUS users full read access"**
3. Asegúrate que dice:
   ```
   SELECT
   ```
4. Click en **"Review"** y luego **"Save policy"**

**Listo!** Ahora ya puedes crear productos con imágenes.

---

### Opción 2: Usar Fallback a Data URL (TEMPORAL)

Si no quieres crear el bucket ahora, el sistema automáticamente:
1. Intenta subir a Supabase Storage
2. Si falla, guarda la imagen como **data URL** en la base de datos
3. El producto se crea exitosamente aunque la imagen falle

**Ventaja**: Funciona sin configuración
**Desventaja**: Las imágenes data URL son más grandes y lentas

---

## Verificar que el Bucket Funciona

### Paso 1: Crear un Producto
1. Ve a `/admin/products`
2. Click "Nuevo Producto"
3. Completa el formulario
4. Selecciona una imagen
5. Click "Crear Producto"

### Paso 2: Verificar en Storage
1. Ve a Supabase Dashboard → **Storage** → **product-images**
2. Deberías ver una carpeta con el ID del producto
3. Dentro, deberías ver un archivo con la imagen

### Paso 3: Verificar en Base de Datos
1. Ve a Supabase Dashboard → **SQL Editor**
2. Ejecuta:
```sql
SELECT * FROM product_images LIMIT 1;
```
3. Deberías ver una fila con:
   - `product_id`: ID del producto
   - `url`: La URL de la imagen en Storage
   - `is_primary`: true

---

## Error: "Categories not assigned"

Si al crear producto SIN imagen obtienes error de categorías, es probablemente porque:

### Causa 1: La tabla product_categories tiene constraint pero las categorías no existen

**Solución**:
1. Ve a Supabase → **SQL Editor**
2. Verifica que hay categorías en la tabla `categories`:
```sql
SELECT * FROM categories;
```
3. Si está vacía, agrégalas:
```sql
INSERT INTO categories (name, name_en, slug) VALUES
('Cuidado del Cabello', 'Hair Care', 'cuidado-cabello'),
('Aseo Personal', 'Personal Care', 'aseo-personal'),
('Maquillaje', 'Makeup', 'maquillaje');
```

### Causa 2: RLS policies están bloqueando inserts

**Solución**:
1. Ve a Supabase → **Authentication** → **Policies**
2. En tabla `product_categories`, verifica que la política permite INSERT
3. O deshabilita temporalmente RLS para desarrollo:
   - Ve a **product_categories** → **RLS** → Deshabilita

---

## Solucionar Específicamente

### Error: "StorageApiError: Bucket not found"
**Solución**: Crear bucket `product-images` (ver Opción 1 arriba)

### Error: "Error setting product categories: Object"
Posibles causas:
1. Categorías no existen en la tabla
2. RLS policies bloquean inserts
3. product_categories table corrupted

**Para cada una**:
```sql
-- 1. Verificar categorías existen
SELECT * FROM categories;

-- 2. Verificar RLS policies
SELECT * FROM pg_policies WHERE tablename = 'product_categories';

-- 3. Recrear tabla si necesario
-- (Contactar soporte si needed)
```

---

## Teste Completo

Después de seguir estos pasos, prueba así:

### Test 1: Crear con Imagen
```
1. Va a /admin/products → Nuevo
2. Nombre: "Test Product"
3. Precio: 100
4. Selecciona imagen
5. Selecciona categoría
6. Click Crear
```

**Resultado esperado**: 
- ✅ Producto creado
- ✅ Imagen en Storage
- ✅ Categoría asignada
- ✅ Redirige a edición

### Test 2: Crear sin Imagen
```
1. Va a /admin/products → Nuevo
2. Nombre: "Test Product 2"
3. Precio: 200
4. Selecciona categoría (sin imagen)
5. Click Crear
```

**Resultado esperado**:
- ✅ Producto creado
- ✅ Categoría asignada
- ✅ Sin image (fallback)

### Test 3: Editar Producto
```
1. Ve a producto creado
2. Cambia nombre
3. Carga nueva imagen
4. Selecciona diferentes categorías
5. Click Guardar Cambios
```

**Resultado esperado**:
- ✅ Todo se actualiza
- ✅ Imagen antigua se reemplaza
- ✅ Categorías se actualizan

---

## Notas Importantes

1. **El bucket DEBE ser público** para que las imágenes se vean en el sitio
2. **Las políticas RLS son opcionales** pero recomendadas para seguridad
3. **Los datos URL funcionan pero son lentos** - mejor usar Storage
4. **Siempre verifica en Supabase Dashboard** después de crear

---

## Si Sigue Sin Funcionar

Ejecuta este SQL en Supabase para verificar todo:

```sql
-- 1. Verificar bucket existe
SELECT * FROM storage.buckets WHERE name = 'product-images';

-- 2. Verificar tabla product_categories existe
SELECT * FROM product_categories LIMIT 1;

-- 3. Verificar RLS está deshabilitado (development)
SELECT * FROM pg_tables 
WHERE tablename = 'product_categories';

-- 4. Verificar categorías existen
SELECT count(*) FROM categories;

-- 5. Verificar últimas imágenes guardadas
SELECT * FROM product_images ORDER BY created_at DESC LIMIT 5;

-- 6. Verificar últimas categorías asignadas
SELECT * FROM product_categories ORDER BY created_at DESC LIMIT 5;
```

Si algo falta, el sistema te dará errores específicos.

---

## Contacto

Si necesitas más ayuda:
1. Revisa los logs en Supabase Dashboard → **Logs**
2. Revisa la consola del navegador (F12)
3. Verifica las variables de entorno en `.env.local`

**Última actualización**: 25 Enero 2026
