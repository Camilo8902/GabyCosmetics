# Debugging: Error "Error setting product categories"

## El Problema

Cuando creas un producto sin imagen, obtienes este error:
```
Error setting product categories: 
Object
```

El error no es específico, lo que significa que hay varias causas posibles.

---

## Diagnóstico Step-by-Step

### Paso 1: Verificar que las Categorías Existen

En Supabase Dashboard → **SQL Editor**, ejecuta:

```sql
SELECT id, name, name_en, slug FROM categories;
```

**Resultado esperado**:
```
id                 | name              | name_en         | slug
───────────────────┼──────────────────┼─────────────────┼─────────────
uuid-123...       | Cuidado Cabello   | Hair Care       | cuidado-cabello
uuid-456...       | Aseo Personal     | Personal Care   | aseo-personal
```

**Si está vacío**:
Necesitas agregar categorías primero:

```sql
INSERT INTO categories (name, name_en, slug) VALUES
('Cuidado del Cabello', 'Hair Care', 'cuidado-cabello'),
('Aseo Personal', 'Personal Care', 'aseo-personal'),
('Maquillaje', 'Makeup', 'maquillaje'),
('Fragancia', 'Fragrance', 'fragancia');
```

---

### Paso 2: Verificar la Tabla product_categories

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'product_categories'
ORDER BY ordinal_position;
```

**Resultado esperado**:
```
column_name      | data_type | is_nullable | column_default
─────────────────┼───────────┼─────────────┼────────────────
id               | uuid      | no          | gen_random_uuid()
product_id       | uuid      | no          | (null)
category_id      | uuid      | no          | (null)
created_at       | timestamp | no          | now()
```

---

### Paso 3: Verificar RLS Policies

En Supabase Dashboard, ve a **product_categories** → **RLS** (arriba a la derecha).

**Si RLS está HABILITADO**:
Necesitas políticas que permitan INSERT. Ejecuta:

```sql
-- Ver políticas actuales
SELECT policyname, qual, with_check 
FROM pg_policies 
WHERE tablename = 'product_categories';

-- Si no hay políticas, deshabilita RLS temporalmente
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;

-- O crea una política permisiva para autenticados
CREATE POLICY "Allow authenticated users to insert categories"
ON product_categories
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Y para SELECT
CREATE POLICY "Allow all to select categories"
ON product_categories
FOR SELECT
TO public
USING (true);
```

---

### Paso 4: Verificar Foreign Key Constraints

```sql
SELECT
  constraint_name,
  table_name,
  column_name,
  referenced_table_name,
  referenced_column_name
FROM information_schema.referential_constraints
WHERE table_name = 'product_categories'
OR referenced_table_name = 'product_categories';
```

**Resultado esperado**:
```
constraint_name              | table_name         | column_name  | referenced_table
─────────────────────────────┼────────────────────┼──────────────┼──────────────────
product_categories_product   | product_categories | product_id   | products
product_categories_category  | product_categories | category_id  | categories
```

Si hay un error diciendo que falta una foreign key, significa que:
1. El producto no existe (pero deberías haber creado el producto primero)
2. La categoría no existe (verify Paso 1)

---

### Paso 5: Test Manual de Inserción

1. Obtén un ID de producto:
```sql
SELECT id FROM products LIMIT 1;
```

2. Obtén un ID de categoría:
```sql
SELECT id FROM categories LIMIT 1;
```

3. Intenta insertar manualmente:
```sql
INSERT INTO product_categories (product_id, category_id) 
VALUES ('PRODUCT_ID_HERE', 'CATEGORY_ID_HERE');
```

**Si da error de foreign key**:
Las categorías o el producto no existen.

**Si da error de RLS**:
Necesitas policies.

**Si funciona**:
El problema está en el código de la aplicación.

---

## Soluciones por Error

### Error 1: "Foreign key violation (23503)"
```
DETAIL: Key (category_id)=(xxx) is not present in table "categories".
```

**Causa**: La categoría seleccionada no existe

**Solución**:
```sql
-- 1. Verificar qué categorías existen
SELECT id, name FROM categories;

-- 2. Asegúrate de seleccionar IDs válidos
-- 3. Si necesitas agregar categorías:
INSERT INTO categories (name, name_en, slug) 
VALUES ('Nueva Categoría', 'New Category', 'nueva-categoria');
```

### Error 2: "RLS policy violation"
```
new row violates row-level security policy
```

**Causa**: Las políticas RLS no permiten INSERT

**Solución**:
```sql
-- Opción A: Deshabilitar RLS (solo desarrollo)
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;

-- Opción B: Crear políticas (producción)
CREATE POLICY "Allow authenticated inserts"
ON product_categories FOR INSERT
TO authenticated
WITH CHECK (true);
```

### Error 3: "Column does not exist"
```
column "xxx" of relation "product_categories" does not exist
```

**Causa**: El nombre de la columna es incorrecto

**Solución**:
```sql
-- Verificar nombres correctos
SELECT column_name FROM information_schema.columns
WHERE table_name = 'product_categories';
```

---

## Solución Rápida (Desarrollo)

Si estás en desarrollo y quieres que funcione rápido:

```sql
-- 1. Deshabilitar RLS
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE categories DISABLE ROW LEVEL SECURITY;

-- 2. Agregar categorías si no existen
INSERT INTO categories (name, name_en, slug) VALUES
('Cuidado del Cabello', 'Hair Care', 'cuidado-cabello'),
('Aseo Personal', 'Personal Care', 'aseo-personal'),
('Maquillaje', 'Makeup', 'maquillaje')
ON CONFLICT (slug) DO NOTHING;

-- 3. Verificar que todo existe
SELECT COUNT(*) FROM categories;
SELECT COUNT(*) FROM products;
```

---

## Solución Robusta (Producción)

```sql
-- 1. Crear tabla si no existe
CREATE TABLE IF NOT EXISTS product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, category_id)
);

-- 2. Habilitar RLS
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

-- 3. Crear políticas
CREATE POLICY "Allow authenticated insert"
ON product_categories FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated update"
ON product_categories FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow authenticated delete"
ON product_categories FOR DELETE
TO authenticated
USING (true);

CREATE POLICY "Allow all select"
ON product_categories FOR SELECT
USING (true);

-- 4. Agregar categorías
INSERT INTO categories (name, name_en, slug) 
VALUES 
  ('Cuidado del Cabello', 'Hair Care', 'cuidado-cabello'),
  ('Aseo Personal', 'Personal Care', 'aseo-personal')
ON CONFLICT (slug) DO NOTHING;
```

---

## Verificar Después de Arreglarlo

```sql
-- 1. Verificar categorías
SELECT COUNT(*) as categories_count FROM categories;

-- 2. Crear producto de test
INSERT INTO products (
  name, name_en, slug, price, 
  is_active, is_featured, is_visible, company_id
) VALUES (
  'Test Product', 'Test Product', 'test-product', 99.99,
  true, true, true, (SELECT id FROM companies LIMIT 1)
) RETURNING id;

-- 3. Copiar el ID devuelto y usarlo aquí:
INSERT INTO product_categories (
  product_id, 
  category_id
) VALUES (
  'PRODUCT_ID_AQUI',
  (SELECT id FROM categories LIMIT 1)
);

-- 4. Verificar que se guardó
SELECT * FROM product_categories WHERE product_id = 'PRODUCT_ID_AQUI';
```

---

## Si Aún No Funciona

1. **Revisa el navegador**:
   - Abre DevTools (F12)
   - Ve a **Console**
   - Crea un producto de nuevo
   - Busca el error exacto

2. **Revisa Supabase Logs**:
   - Ve a Supabase Dashboard → **Logs**
   - Filtra por tu usuario
   - Busca errores SQL

3. **Copia el error exacto**:
   - Incluye el error completo en el chat
   - Incluye el resultado de los comandos SQL arriba
   - Incluye la versión de Supabase

---

**Última actualización**: 25 Enero 2026
