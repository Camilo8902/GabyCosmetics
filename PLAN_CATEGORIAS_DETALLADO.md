# 📚 PLAN DETALLADO: Desarrollar Categorías

**Objetivo**: Implementar sistema completo de categorías en landing page y admin panel

---

## 🎯 Funcionalidades a Implementar

### 1. Landing Page - Sección de Categorías
```
┌─────────────────────────────────────────┐
│ CATEGORÍAS                              │
│                                         │
│  [Cuidado del Cabello]  [Aseo Personal] │
│   12 productos          8 productos     │
│                                         │
└─────────────────────────────────────────┘
```

**Comportamiento**:
- Mostrar todas las categorías
- Click en categoría → Filtra ShopPage
- Muestra cantidad de productos

### 2. Admin Panel - Gestión de Categorías
```
┌──────────────────────────────────────┐
│ ADMINISTRAR CATEGORÍAS               │
├──────────────────────────────────────┤
│ [+ Nueva Categoría]                  │
├──────────────────────────────────────┤
│ Nombre (ES) | Nombre (EN) | Acciones│
├──────────────────────────────────────┤
│ Cuidado...  | Hair Care   | ✏️ 🗑️  │
│ Aseo...     | Personal... | ✏️ 🗑️  │
└──────────────────────────────────────┘
```

**Funcionalidades**:
- Listar todas las categorías
- Crear nueva categoría
- Editar categoría
- Eliminar categoría
- Ver cantidad de productos por categoría

---

## 📊 Estructura de Datos

### Tabla: categories (Ya existe en Supabase)
```sql
id          UUID PRIMARY KEY
name        VARCHAR - Nombre en español
name_en     VARCHAR - Nombre en inglés
slug        VARCHAR UNIQUE - URL-friendly
created_at  TIMESTAMP
updated_at  TIMESTAMP
```

### Tabla: product_categories (Ya existe)
```sql
id            UUID PRIMARY KEY
product_id    UUID (FK → products)
category_id   UUID (FK → categories)
created_at    TIMESTAMP
```

---

## 🔧 Servicios a Crear/Mejorar

### categoryService.ts
```typescript
// Leer
getCategories(): Promise<Category[]>
getCategoryById(id: string): Promise<Category | null>
getCategoryBySlug(slug: string): Promise<Category | null>
getProductCountByCategory(): Promise<{[categoryId]: number}>

// Crear
createCategory(name: string, name_en: string): Promise<Category>

// Actualizar
updateCategory(id: string, name: string, name_en: string): Promise<Category>

// Eliminar
deleteCategory(id: string): Promise<void>
```

---

## ⚙️ Hooks a Crear/Mejorar

### useCategories.ts (Ya existe, mejorar)

**Agregar**:
```typescript
// Mutaciones
useCreateCategory()
useUpdateCategory()
useDeleteCategory()

// Queries mejoradas
useCategoryWithProducts(slug: string)
getCategoryProductCount(categoryId: string)
```

---

## 📱 Componentes a Crear

### 1. CategoriesSection.tsx (Mejorar)
```
Ubicación: src/components/landing/CategoriesSection.tsx

Props: (none)

Funcionalidad:
- Obtener categorías con useCategories()
- Contar productos por categoría
- Mostrar como grid
- Link a ShopPage filtrada

Ejemplo:
┌─────────────────────┐
│ Cuidado Cabello     │
│ 12 productos →      │
└─────────────────────┘
```

### 2. CategoriesList.tsx (Admin)
```
Ubicación: src/pages/admin/categories/CategoriesList.tsx

Mostrar:
- Tabla de categorías
- Botón "Nueva Categoría"
- Botones editar/eliminar por fila
- Contador de productos

Acciones:
- Click "Nueva" → CategoryForm (create mode)
- Click "Editar" → CategoryForm (edit mode)
- Click "Eliminar" → Confirmar → Delete
```

### 3. CategoryForm.tsx (Admin)
```
Ubicación: src/pages/admin/categories/CategoryForm.tsx

Campos:
- Nombre (ES) - Requerido
- Nombre (EN) - Requerido
- Slug - Auto-generado, editable

Validaciones:
- Slug único
- Nombres no vacíos
- No permitir duplicados

Botones:
- Guardar
- Cancelar
```

### 4. CategoryCard.tsx (Landing)
```
Ubicación: src/components/landing/CategoryCard.tsx

Mostrar:
- Ícono o imagen de categoría
- Nombre
- Contador de productos
- Hover effect
- Link a ShopPage filtrada
```

---

## 🔗 Rutas a Agregar

### Frontend Routes
```typescript
// Landing
/categories - List de categorías (landing page section)
/shop?category=slug - ShopPage filtrada (ya existe)

// Admin
/admin/categories - List de categorías
/admin/categories/new - Crear nueva
/admin/categories/:id/edit - Editar

// Detalle
/category/:slug - Página detalle de categoría (opcional)
```

---

## 📋 Checklist de Implementación

### Fase 1: Servicios (2-3 horas)
- [ ] Crear `categoryService.ts` con todas las funciones
- [ ] Mejorar `useCategories.ts` con mutaciones
- [ ] Agregar hooks: useCreateCategory, useUpdateCategory, useDeleteCategory
- [ ] Probar en console

### Fase 2: Landing Page (2 horas)
- [ ] Mejorar `CategoriesSection.tsx`
- [ ] Crear `CategoryCard.tsx`
- [ ] Usar datos reales en lugar de demo
- [ ] Agregar contador de productos
- [ ] Probar que links funcionen

### Fase 3: Admin Panel (3-4 horas)
- [ ] Crear `CategoriesList.tsx`
- [ ] Crear `CategoryForm.tsx`
- [ ] Agregar rutas en router
- [ ] Agregar navegación en admin sidebar
- [ ] Validaciones
- [ ] Probar CRUD completo

### Fase 4: Refinamientos (1-2 horas)
- [ ] Validar slug único
- [ ] Prevenir eliminar si tiene productos
- [ ] Mejorar UX (loading states, confirmaciones)
- [ ] Testing manual completo

---

## 💾 SQL Necesario (Si aplica)

### Verificar que tabla existe
```sql
SELECT * FROM categories LIMIT 1;
```

### Si no existe, crear:
```sql
CREATE TABLE categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar NOT NULL,
  name_en varchar NOT NULL,
  slug varchar UNIQUE NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE product_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(product_id, category_id)
);
```

---

## 🎨 UX Recomendado

### Landing Page
```
[SECTION: CATEGORÍAS]

┌─────────────────────────────────────┐
│ Explora por Categoría               │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ 💇 Hair   │  │ 🧴 Care  │       │
│  │ Care      │  │ Personal │       │
│  │ 12 items  │  │ 8 items  │       │
│  └──────────┘  └──────────┘       │
│                                     │
│  ┌──────────┐  ┌──────────┐       │
│  │ 💄 Makeup │  │ 🌸 Otros │       │
│  │           │  │          │       │
│  │ 5 items  │  │ 3 items  │       │
│  └──────────┘  └──────────┘       │
│                                     │
└─────────────────────────────────────┘
```

### Admin Panel
```
[CATEGORIES]

[+ Nueva Categoría]

Tabla:
┌─────────────────────────────────────┐
│ Nombre | Nombre EN | Productos | ⚙️ │
├─────────────────────────────────────┤
│ Cuidado| Hair Care | 12        | ✏️🗑║
│ Aseo   | Personal  | 8         | ✏️🗑║
└─────────────────────────────────────┘
```

---

## 🧪 Testing Manual

### Test 1: Crear Categoría
```
1. Ve a /admin/categories
2. Click "+ Nueva Categoría"
3. Ingresa:
   - Nombre: "Fragancia"
   - Nombre EN: "Fragrance"
4. Click Guardar
5. Debería aparecer en la tabla
6. Verificar en BD: SELECT * FROM categories WHERE slug = 'fragancia';
```

### Test 2: Editar Categoría
```
1. Click Editar en una categoría
2. Cambia el nombre
3. Click Guardar
4. Debería reflejarse en tabla
5. Verificar en BD
```

### Test 3: Eliminar Categoría
```
1. Click Eliminar en una categoría
2. Confirmar
3. Debería desaparecer de tabla
4. Verificar en BD: SELECT * FROM categories;
```

### Test 4: Landing Page
```
1. Ve a home
2. Scroll a sección de categorías
3. Debería mostrar todas con contador
4. Click en categoría
5. Debería ir a /shop?category=slug
6. Debería filtrar productos
```

---

## 📚 Documentación por Completar

Después de implementar, actualizar:
- [ ] README.md con categorías
- [ ] API docs si existe
- [ ] Guía de admin
- [ ] Este mismo documento (completar secciones)

---

## 🚀 Timeline Estimado

| Fase | Tareas | Tiempo |
|------|--------|--------|
| 1 | Servicios + Hooks | 2-3h |
| 2 | Landing Page | 2h |
| 3 | Admin Panel | 3-4h |
| 4 | Refinamientos | 1-2h |
| **TOTAL** | | **8-11h** |

---

## 🎯 Prioridad por MVP

### MVP Mínimo (4h)
- [x] Tabla categories existe
- [ ] CategoriesSection mejorada en landing
- [ ] ShopPage filtra por categoría (ya funciona)

### MVP Completo (8h)
- + Admin panel para categorías
- + Validaciones robustas

### Versión Final (11h)
- + Página detalle de categoría
- + Analítica de categorías
- + Recomendaciones por categoría

---

**¿Por dónde empezamos?**

Sugiero empezar por **Fase 1 (Servicios)** para tener la base lista, luego **Fase 2 (Landing)** para que se vea bien, y finalmente **Fase 3 (Admin)** para gestión completa.

¿Quieres que comience a implementarlo?
