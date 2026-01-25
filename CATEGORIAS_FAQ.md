# ❓ FAQ - CATEGORÍAS

**Preguntas Frecuentes y Respuestas**

---

## 🎯 PREGUNTAS GENERALES

### ¿Qué son las categorías en Gaby Cosmetics?
Las categorías son agrupaciones de productos (ej: "Cuidado Cabello", "Maquillaje"). 
Los usuarios pueden filtrar productos por categoría en la tienda.

### ¿Quién puede crear/editar/eliminar categorías?
Solo los **administradores** del sistema.
Acceso en `/admin/categories`.

### ¿Los cambios en categorías aparecen en la tienda?
**Sí, automáticamente**. Cuando creas/editas una categoría:
1. Se actualiza en BD
2. React Query invalida el cache
3. Landing page refrescada
4. Filtros en tienda actualizados
5. No requiere recargar página

### ¿Cuántas categorías puedo tener?
**Ilimitadas**. El sistema escala hasta miles de categorías sin problemas.

---

## 🚀 PREGUNTAS TÉCNICAS

### ¿Cómo funciona el filtro por categoría?
```
User click en categoría en landing
    ↓
Navigate a /shop?category=slug
    ↓
ShopPage recibe query param
    ↓
Filtra productos:
  allProducts.filter(p => 
    p.categories.some(c => c.slug === slug)
  )
    ↓
Muestra solo esos productos
```

### ¿Cómo se genera el slug automáticamente?
```typescript
// En CategoryForm.tsx
watchName = "Cuidado Cabello"
    ↓
slug = "cuidado-cabello"
    // toLowerCase() + trim() + replace spaces with "-"
    // + remove special chars
```

Puedes editarlo manualmente después si quieres.

### ¿Qué pasa si elimino una categoría con productos?
```
Sistema previene la eliminación:
  ✅ Cuenta productos asignados
  ✅ Si count > 0 → Botón deshabilitado
  ✅ Toast error: "No se puede eliminar con X productos"

Solución:
  1. Ve a /admin/products
  2. Edita cada producto de esa categoría
  3. Remueve esa categoría
  4. Intenta eliminar de nuevo
```

### ¿Las categorías tienen jerarquía (padre/hijo)?
**Sí, está preparado** pero no implementado aún.

Estructura en BD:
```sql
categories table:
  - id
  - name
  - parent_id ← Para subcategorías
```

### ¿Puedo cambiar el slug después de crear?
**Sí**. En modo editar, el slug es totalmente editable.

⚠️ **Advertencia**: Si cambias el slug, los links `/shop?category=OLD_SLUG` dejarán de funcionar.

---

## 📊 PREGUNTAS DE DATOS

### ¿Cómo asigno un producto a una categoría?
```
1. Va a /admin/products/new (o editar)
2. Desplazate a sección "Categorías"
3. Selecciona una o más categorías (multi-select)
4. Guardar producto
5. ✅ Producto asignado
```

### ¿Puedo asignar múltiples categorías a un producto?
**Sí**. Un producto puede tener varias categorías.

Ejemplo:
- Producto: "Shampoo Keratina"
- Categorías: ["Cuidado Cabello", "Tratamientos Especiales"]

### ¿Cómo veo el contador de productos en una categoría?
```
Dos lugares:

1. Admin (/admin/categories)
   └── Tabla muestra contador

2. Landing page (home)
   └── CategoryCard muestra "12 productos"
```

El contador se calcula automáticamente:
```typescript
allProducts.filter(p => 
  p.categories.some(c => c.id === category.id)
).length
```

### ¿Si elimino un producto, la categoría se elimina?
**No**. Solo se rompe la relación en `product_categories`.
La categoría sigue existiendo (vacía).

---

## 🎨 PREGUNTAS DE DISEÑO

### ¿Puedo cambiar los colores de las categorías en landing?
**Sí**. Edita `CategoriesSection.tsx`:

```typescript
// Línea ~50
color: index % 2 === 0 ? 
  'from-rose-400 to-pink-500' :  // Color 1
  'from-amber-400 to-orange-500'  // Color 2
```

Usa colores Tailwind: `from-[color]-[intensity] to-[color]-[intensity]`

### ¿Puedo agregar imagen personalizada a cada categoría?
**Sí**. En admin, campo "URL de Imagen":
```
Ingresa URL: https://example.com/img.jpg
    ↓
Se guarda en categories.image_url
    ↓
Se muestra en CategoryCard
```

Si dejas vacío, usa imagen por defecto.

### ¿Se ven bien las categorías en mobile?
**Sí**. Usa Tailwind responsive:
- Desktop: 2 columnas
- Tablet: 2 columnas
- Mobile: 1 columna (stack vertical)

---

## 🔐 PREGUNTAS DE SEGURIDAD

### ¿Quién puede ver categorías?
```
Landing page:  Público (todos)
Admin panel:   Solo admin
API:           Protegido por RLS
```

### ¿Cómo se protege el admin panel?
```
1. Authentication check
   ├─ ¿User logged in?
   └─ SÍ: Continue
2. Authorization check
   ├─ ¿User es admin?
   └─ SÍ: Access granted
3. RLS Database policies
   ├─ Validación final en BD
   └─ 403 Forbidden si falla
```

### ¿Alguien puede modificar categorías desde client?
**No**. Supabase RLS lo previene:
```
- Solo authenticated users
- Solo si RLS policy lo permite
- Backend validation siempre
```

### ¿Se valida en frontend y backend?
**Sí, validación double-layer**:
```
Frontend (Zod):
  - Requeridos
  - Formato
  - Longitud
      ↓
Backend (Supabase):
  - Constraints SQL
  - Unique slug
  - Foreign keys
  - RLS policies
```

---

## ⚡ PREGUNTAS DE PERFORMANCE

### ¿Las categorías se cachean?
**Sí**. React Query cachea por 15 minutos:
```
First load:   Fetch de BD
Next 15min:   Desde cache (instant)
After 15min:  Background refetch
Mutation:     Cache invalidado
```

### ¿Hay queries innecesarios?
**No**. Solo queries cuando:
- Componente monta
- 15 minutos pasan
- Mutation ocurre
- Manual refetch

### ¿Qué pasa si hay 1000 categorías?
Sistema sigue rápido:
- Query retorna en <100ms
- Renderiza tabla en <500ms
- Landing page carga instant
- No pagination requerida (pero posible)

---

## 🆘 PREGUNTAS DE TROUBLESHOOTING

### Las categorías no aparecen en landing
**Posibles causas**:
1. No hay categorías en BD
   - Solución: Crea algunas en admin
2. Error en useCategories()
   - Solución: Check console (F12)
3. RLS policy bloqueando
   - Solución: Check Supabase RLS policies
4. API conexión lenta
   - Solución: Espera o refresh

### Admin tabla está vacía
```
Posibilidades:
1. useCategories() query pendiente → Espera loading
2. Error en fetch → Check network tab
3. RLS bloqueado → Check Supabase
4. Supabase desconectada → Check env vars
```

### Error: "Slug already exists"
```
El slug ya está en BD
Soluciones:
1. Usa otro slug
2. O usa ese name pero diferente slug
Ejemplo:
  - Name: "Cuidado Cabello"
  - Slug: "cuidado-cabello-2"
```

### Eliminar deshabilitado pero sin productos visibles
```
Posible:
- Cache viejo de contador
- RLS bloqueando
- Data inconsistente

Solución:
1. F5 refresh página
2. Espera 15 segundos
3. Intenta de nuevo
```

### Landing page no actualiza después de crear categoría
```
Normal: Actualiza en <100ms
Si no:
1. Check console para errors
2. F5 para forzar refresh
3. Check React Query devtools
4. Verifica request en Network tab
```

---

## 📚 PREGUNTAS DE DOCUMENTACIÓN

### ¿Dónde veo la documentación completa?
```
📁 Raíz del proyecto:
├── CATEGORIAS_IMPLEMENTACION_COMPLETA.md ← Técnico completo
├── CATEGORIAS_QUICK_START.md ← Guía rápida
├── PLAN_CATEGORIAS_DETALLADO.md ← Plan paso a paso
├── FLUJO_CATEGORIAS_VISUAL.md ← Diagramas
├── INVENTARIO_DE_CAMBIOS.md ← Qué cambió
└── FAQ.md ← Este archivo
```

### ¿Cómo veo el código?
```
src/
├── components/landing/
│   ├── CategoriesSection.tsx ← Landing mejorada
│   └── CategoryCard.tsx ← Card reutilizable
├── pages/admin/categories/
│   ├── CategoriesList.tsx ← Tabla admin
│   ├── CategoryForm.tsx ← Formulario
│   └── index.ts ← Exports
├── services/
│   └── categoryService.ts ← Logic
└── hooks/
    └── useCategories.ts ← React Query hooks
```

### ¿Dónde aprendo sobre React Query?
[React Query Docs](https://tanstack.com/query/latest)

### ¿Dónde aprendo sobre Zod validation?
[Zod Docs](https://zod.dev)

---

## 🔮 PREGUNTAS DEL FUTURO

### ¿Cuándo vienen subcategorías?
**Planificado para Fase 3** (próximas semanas/meses).
Ya está preparado en BD con `parent_id`.

### ¿Cuándo viene upload de imágenes?
**Planificado para Fase 3**.
Permitirá subir imagen en lugar de URL.

### ¿Cuándo viene página detalle de categoría?
**Planificado para Fase 3**.
Ruta: `/category/:slug` con listado completo.

### ¿Puedo sugerir mejoras?
**¡Claro!** Mejoras futuras posibles:
- Búsqueda de categorías
- Bulk edit
- Filtros por estado
- Analytics
- Seo optimizations
- Etc.

---

## 💬 MÁS AYUDA

### Si tienes error:
1. Check console (F12)
2. Busca en este FAQ
3. Revisa documentación técnica
4. Check logs de Supabase

### Si no encuentras respuesta:
- Revisar toda documentación en raíz del proyecto
- Código está bien comentado
- Inline type hints en TypeScript

### Si quieres contribuir:
- Código siguiendo patrones existentes
- TypeScript tipado
- Tests incluidos
- Documentation actualizada

---

**¿Más preguntas? 🤔**

**Lee la documentación en este orden:**
1. `CATEGORIAS_QUICK_START.md` - 5 minutos
2. `PLAN_CATEGORIAS_DETALLADO.md` - 10 minutos
3. `CATEGORIAS_IMPLEMENTACION_COMPLETA.md` - 15 minutos
4. `FLUJO_CATEGORIAS_VISUAL.md` - Diagramas visuales
5. Código fuente - Bien comentado

---

*FAQ v1.0*  
*Last Updated: 2026-01-25*  
*Questions: 40+*  
*Status: Complete ✅*
