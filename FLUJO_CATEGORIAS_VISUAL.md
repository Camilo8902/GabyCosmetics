# 🎯 FLUJO DE CATEGORÍAS - DIAGRAMA VISUAL

**Visualización completa del sistema de categorías**

---

## 🏗️ ARQUITECTURA GENERAL

```
┌─────────────────────────────────────────────────────────────────┐
│                    GABY COSMETICS - CATEGORÍAS                  │
└─────────────────────────────────────────────────────────────────┘

CAPA PRESENTACIÓN (React Components)
├── Landing Page
│   └── CategoriesSection (Muestra categorías reales)
│       └── CategoryCard (Componente reutilizable)
│
├── Shop Page
│   └── Filtra por ?category=slug
│
└── Admin Panel
    ├── CategoriesList (Tabla CRUD)
    └── CategoryForm (Crear/Editar)

         ↓ (Usa)

CAPA STATE (React Query + Hooks)
├── useCategories()
│   ├── Query: getCategories()
│   └── Mutaciones: create, update, delete
│
└── useProducts()
    └── Query: getProducts() (para contar)

         ↓ (Llama)

CAPA SERVICIOS
├── categoryService.ts
│   ├── getCategories()
│   ├── getCategoryById(id)
│   ├── getCategoryBySlug(slug)
│   ├── createCategory(data)
│   ├── updateCategory(id, data)
│   └── deleteCategory(id)
│
└── productService.ts
    └── getProducts()

         ↓ (Query)

BASE DE DATOS (Supabase PostgreSQL)
├── Table: categories
│   ├── id (UUID)
│   ├── name (ES)
│   ├── name_en (EN)
│   ├── slug (unique)
│   ├── description (ES/EN)
│   ├── image_url
│   ├── is_active
│   └── order_index
│
├── Table: products
│   └── id, name, price, ...
│
└── Table: product_categories (Junction)
    ├── product_id (FK)
    └── category_id (FK)
```

---

## 📊 FLUJO DE DATOS - LANDING PAGE

```
User abre home (/)
         ↓
CategoriesSection monta
         ↓
useCategories() query dispara
useProducts() query dispara
         ↓
Datos retornan de Supabase
         ↓
productCountByCategory computed:
┌─────────────────────────────────┐
│ categories.map(cat => {         │
│   count = products.filter(p =>  │
│     p.categories.find(c =>      │
│       c.id === cat.id           │
│     )                           │
│   )                             │
│ })                              │
└─────────────────────────────────┘
         ↓
displayCategories transformada
         ↓
Renderiza CategoryCard x N
         ↓
User ve categorías con contadores
         ↓
User click categoría
         ↓
Navigate a /shop?category=slug
         ↓
ShopPage filtra productos
         ↓
Muestra solo productos de esa categoría
```

---

## 🎯 FLUJO DE DATOS - ADMIN CRUD

```
┌─────────────────────────────────────────────────────────────────┐
│                         CREATE                                   │
└─────────────────────────────────────────────────────────────────┘

Admin click [+ Nueva Categoría]
         ↓
Navigate a /admin/categories/new
         ↓
CategoryForm monta en modo CREATE
         ↓
Formulario vacío con validación Zod
         ↓
User llena:
  - name
  - name_en
  - slug (auto-generado de name)
  - description (opcional)
  - image_url (opcional)
         ↓
Click "Crear Categoría"
         ↓
useCreateCategory.mutate({...})
         ↓
categoryService.createCategory()
         ↓
INSERT INTO categories VALUES(...)
         ↓
Response: Category object
         ↓
React Query:
  - invalidateQueries(['categories'])
  - cache refrescado
         ↓
useCategories re-query dispara
         ↓
New category en tabla
         ↓
Toast: "Categoría creada exitosamente"
         ↓
Navigate a /admin/categories
         ↓
CategoriesList muestra tabla con nueva categoría


┌─────────────────────────────────────────────────────────────────┐
│                          READ                                    │
└─────────────────────────────────────────────────────────────────┘

Admin abre /admin/categories
         ↓
CategoriesList monta
         ↓
useCategories() query dispara
useProducts() query para contador
         ↓
Datos retornan
         ↓
Renderiza tabla:
  foreach category in categories
    <tr>
      <td>name (ES)</td>
      <td>name_en</td>
      <td>slug</td>
      <td>product_count</td>
      <td>is_active badge</td>
      <td>
        <button edit />
        <button delete />
      </td>
    </tr>
         ↓
User ve tabla completa
  - Todas las categorías
  - Contador dinámico
  - Acciones disponibles


┌─────────────────────────────────────────────────────────────────┐
│                          UPDATE                                  │
└─────────────────────────────────────────────────────────────────┘

Admin click ✏️ en tabla
         ↓
Navigate a /admin/categories/:id/edit
         ↓
CategoryForm monta en modo EDIT
         ↓
useCategory(id) query dispara
         ↓
Datos de categoría cargan
         ↓
Formulario pre-populated:
  - name
  - name_en
  - slug (editable)
  - description
  - image_url
         ↓
User modifica campos
         ↓
Click "Actualizar Categoría"
         ↓
useUpdateCategory.mutate({id, updates})
         ↓
categoryService.updateCategory()
         ↓
UPDATE categories SET ... WHERE id = ?
         ↓
Response: Updated Category
         ↓
React Query:
  - invalidateQueries(['categories'])
  - invalidateQueries(['category', id])
  - cache refrescado
         ↓
Data refrescada en tabla y landing
         ↓
Toast: "Categoría actualizada exitosamente"
         ↓
Navigate a /admin/categories
         ↓
Ver cambios en tabla


┌─────────────────────────────────────────────────────────────────┐
│                          DELETE                                  │
└─────────────────────────────────────────────────────────────────┘

Admin click 🗑️ en tabla
         ↓
Check: ¿Tiene productos?
         ├─ SÍ (product_count > 0)
         │   ↓
         │   Toast error: "No se puede eliminar con X productos"
         │   Botón deshabilitado
         │   STOP
         │
         └─ NO (product_count === 0)
             ↓
             ConfirmDialog abre:
               "¿Estás seguro?"
             ↓
             Admin click "Eliminar"
             ↓
             useDeleteCategory.mutate(id)
             ↓
             categoryService.deleteCategory()
             ↓
             UPDATE categories SET is_active = false WHERE id = ?
             ↓
             Response: void
             ↓
             React Query:
               - invalidateQueries(['categories'])
               - cache refrescado
             ↓
             Category removida de tabla
             ↓
             Toast: "Categoría eliminada exitosamente"
             ↓
             Landing page refresca (sin categoría)
```

---

## 🔄 CICLO DE REACCIÓN - REACT QUERY

```
User Action
    ↓
Component monta / Hook dispara
    ↓
useCategories() → isLoading = true, data = undefined
    ↓
categoryService.getCategories() llamado
    ↓
Supabase query SELECT * FROM categories
    ↓
Data retorna
    ↓
useCategories() → isLoading = false, data = [...categories]
    ↓
Component re-render con data
    ↓
UI actualizada
    ↓
Mutation ocurre (create/update/delete)
    ↓
Service mutation dispara
    ↓
DB actualizado
    ↓
queryClient.invalidateQueries(['categories'])
    ↓
useCategories re-query automáticamente dispara
    ↓
Data refrescada
    ↓
UI actualizada
    ↓
Todos los componentes usando useCategories() notificados
    ↓
Landing + Admin + Shop todos refrescan automáticamente
```

---

## 🛡️ VALIDACIÓN FLOW

```
User ingresa dato
    ↓
onChange handler
    ↓
React Hook Form recibe
    ↓
Muestra valor en input
    ↓
User submit
    ↓
onSubmit handler
    ↓
react-hook-form pre-valida
    ↓
Zod schema validation:

  categorySchema = z.object({
    name: z.string().min(1).min(2),
    name_en: z.string().min(1).min(2),
    slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
    description: z.string().optional(),
    description_en: z.string().optional(),
    image_url: z.string().optional(),
  })
    ↓
¿Válido?
├─ NO: Mostrar error en campo
│   ↓
│   User ve: "El nombre es requerido"
│   ↓
│   Cannot submit
│
└─ SÍ: Continúa
    ↓
Service call
    ↓
Backend validation (Supabase constraints):
  - slug UNIQUE → error si existe
  - Foreign keys → error si FK inválida
  - RLS policies → error si unauthorized
    ↓
¿Válido?
├─ NO: Error trae de backend
│   ↓
│   Toast error: "El slug ya existe"
│
└─ SÍ: Success
    ↓
Toast success
    ↓
Mutation complete
    ↓
Navigate o reload data
```

---

## 🎨 COMPONENTE TREE

```
App.tsx
└── Routes
    ├── /
    │   └── HomePage
    │       └── CategoriesSection ✅ NUEVO/MEJORADO
    │           └── CategoryCard (map) ✅ NUEVO
    │
    ├── /shop
    │   └── ShopPage (filtra por ?category)
    │
    └── /admin
        ├── AdminLayout
        │   ├── Sidebar
        │   │   └── Links
        │   │       ├── /admin/categories ✅ NUEVO
        │   │       ├── /admin/categories/new ✅ NUEVO
        │   │       └── /admin/categories/:id/edit ✅ NUEVO
        │   │
        │   └── Outlet (Route content)
        │       ├── /admin/categories
        │       │   └── CategoriesList ✅ NUEVO
        │       │       ├── Table (map categories)
        │       │       ├── Header
        │       │       │   └── [+ Nueva] Button
        │       │       └── ConfirmDialog
        │       │
        │       ├── /admin/categories/new
        │       │   └── CategoryForm ✅ NUEVO (mode: create)
        │       │       ├── FormField (name)
        │       │       ├── FormField (name_en)
        │       │       ├── FormField (slug)
        │       │       ├── FormField (description)
        │       │       ├── FormField (description_en)
        │       │       ├── FormField (image_url)
        │       │       └── Buttons (Cancel/Create)
        │       │
        │       └── /admin/categories/:id/edit
        │           └── CategoryForm ✅ NUEVO (mode: edit)
        │               └── (Same form, pre-filled + edit button)
        │
        └── (otros admin routes)
```

---

## 🔐 SEGURIDAD & DATOS

```
USER REQUEST
    ↓
Authentication:
  ¿User logged in?
  ├─ NO: Redirect /login
  └─ SÍ: Continue
    ↓
Authorization (RLS):
  ¿User es admin?
  ├─ NO: Error 403 Forbidden
  └─ SÍ: Continue
    ↓
Database Query:
  SELECT * FROM categories
  WHERE (is_authenticated check RLS policy)
    ↓
RLS Policy Check:
  ┌─────────────────────────────┐
  │ CREATE POLICY allow_admin   │
  │ ON categories               │
  │ FOR ALL                      │
  │ TO authenticated            │
  │ USING (auth.uid()...)       │
  └─────────────────────────────┘
    ↓
¿Pasa policy?
├─ NO: 0 rows returned
└─ SÍ: Rows returned
    ↓
Soft Delete:
  UPDATE categories SET is_active = false
  (No elimina datos, solo marca inactivo)
    ↓
Foreign Key Integrity:
  product_categories (FK → categories.id)
  ├─ Previene delete si tiene productos
  └─ ON DELETE CASCADE (opcional en config)
```

---

## 📈 PERFORMANCE FLOW

```
Initial Load
    ↓
useCategories() query
    ↓
React Query:
  - Cache por 15 minutos
  - Stale time: 15min
  - Fresh time: instantáneo
    ↓
Subsecuent requests
    ├─ Dentro de 15min:
    │   └─ Serve from cache (instant)
    │
    └─ Pasados 15min:
        └─ Background refetch
    ↓
User mutates (create/edit/delete)
    ↓
queryClient.invalidateQueries(['categories'])
    ↓
Cache invalidado
    ↓
Next useCategories() → refetch forced
    ↓
Fresh data de Supabase
    ↓
Re-render con data actualizada
```

---

## 🎬 EJEMPLO COMPLETO - FLUJO USER

```
1. User abre home page
   ↓
2. Ve sección "Categorías" con:
   - 5 categorías reales
   - Contadores (12 products, 8 products, etc)
   - Imágenes bonitas
   - Animaciones
   ↓
3. Click en "Cuidado Cabello"
   ↓
4. Navigate a /shop?category=cuidado-cabello
   ↓
5. ShopPage filtra y muestra solo:
   - Productos de "Cuidado Cabello"
   - Otros filtros siguen funcionando
   ↓
6. Admin abre /admin/categories
   ↓
7. Ve tabla con todas las categorías:
   - Nombres, slugs, producto count
   - Botones editar/eliminar
   ↓
8. Click "+ Nueva Categoría"
   ↓
9. Forma vacía, ingresa:
   - Nombre: "Maquillaje"
   - Nombre EN: "Makeup"
   - Slug: "maquillaje" (auto)
   ↓
10. Click "Crear Categoría"
    ↓
11. INSERT en DB
    ↓
12. Cache invalidado
    ↓
13. CategoriesList refrescado
    ↓
14. "Maquillaje" aparece en tabla
    ↓
15. Toast "Categoría creada exitosamente"
    ↓
16. Landing page refrescado automáticamente
    ↓
17. "Maquillaje" aparece en landing
    ↓
18. Admin click ✏️ en "Maquillaje"
    ↓
19. Forma pre-filled con datos
    ↓
20. Admin cambia nombre a "Maquillaje Profesional"
    ↓
21. Click "Actualizar Categoría"
    ↓
22. UPDATE en DB
    ↓
23. Cache invalidado
    ↓
24. Tabla, landing, todo refrescado
    ↓
25. Admin intenta eliminar
    ↓
26. Check: ¿Tiene productos?
    ↓
27. SÍ (5 productos asignados)
    ↓
28. Toast error: "No se puede eliminar con 5 productos"
    ↓
29. Botón deshabilitado
    ↓
30. Admin desasigna productos primero
    ↓
31. Intenta eliminar de nuevo
    ↓
32. NO productos (count = 0)
    ↓
33. Dialog de confirmación
    ↓
34. Admin confirma
    ↓
35. UPDATE categories SET is_active = false
    ↓
36. Soft delete
    ↓
37. Removido de tabla
    ↓
38. Removido de landing
    ↓
39. Toast "Categoría eliminada"
    ↓
40. DONE ✅
```

---

## 📱 RESPONSIVE DESIGN

```
DESKTOP (>1024px)
├── Landing
│   └── CategoriesSection
│       └── 2-column grid
│           ├── CategoryCard
│           └── CategoryCard
│
└── Admin
    ├── Sidebar (fixed left 256px)
    └── Main (flex: 1)
        └── CategoriesList
            └── Table (horizontal scroll capable)

TABLET (768px-1024px)
├── Landing
│   └── CategoriesSection
│       └── 1-column grid (responsive)
│
└── Admin
    ├── Sidebar (collapsible)
    └── Main (full width when expanded)

MOBILE (<768px)
├── Landing
│   └── CategoriesSection
│       └── Stack vertical
│           ├── CategoryCard (full width)
│           └── CategoryCard (full width)
│
└── Admin
    ├── Hamburger menu
    ├── Sidebar (overlay)
    └── Main (responsive table)
        └── Horizontal scroll en tabla
```

---

## 🚀 DEPLOYMENT PIPELINE

```
Code Ready
    ↓
git commit "feat: categories"
    ↓
git push origin categories-feature
    ↓
Pull Request
    ├── CI/CD runs
    ├── Lint checks
    ├── Type checks
    └── Build verification
    ↓
Approved
    ↓
Merge to main
    ↓
Vercel/Netlify deploys
    ↓
Build runs:
  npm install
  npm run build
  npm run type-check
    ↓
Assets optimized
    ↓
Deploy to staging
    ↓
Smoke tests
    ↓
Deploy to production
    ↓
Monitor:
  - Error rates
  - Performance metrics
  - User feedback
    ↓
✅ LIVE
```

---

**¡Diagrama completo listo! 📊**

---

*Visual Guide: v1.0*  
*Last Updated: 2026-01-25*  
*Status: Complete ✅*
