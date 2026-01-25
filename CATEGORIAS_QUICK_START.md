# 🚀 QUICK START - CATEGORÍAS

**¿Empezando? Lee esto primero.**

---

## ⚡ 30 Segundos - Lo Básico

### Para Usuario Normal (Tienda)
1. Abre `http://localhost:5173/`
2. Scroll a "Categorías" en landing page
3. Ve categorías reales desde Supabase
4. Click en categoría → FilÍtra ShopPage

### Para Admin (Gestión)
1. Abre `http://localhost:5173/admin`
2. Click "Categorías" en sidebar (izquierda)
3. `[+ Nueva Categoría]` para crear
4. ✏️ botón para editar
5. 🗑️ botón para eliminar

---

## 📝 Crear tu Primera Categoría

### Paso 1: Ir a Admin
```
http://localhost:5173/admin/categories
```

### Paso 2: Hacer Click "+ Nueva Categoría"

### Paso 3: Llenar Formulario
```
Nombre (ES):      Piel y Belleza
Nombre (EN):      Skin & Beauty
Slug:             piel-belleza (auto-generado)
Descripción (ES): Productos para cuidado de la piel
Descripción (EN): Skincare products for all types
```

### Paso 4: Click "Crear Categoría"

### ✅ Listo!
- Aparece en tabla
- Aparece en landing page
- Ya la puedes asignar a productos

---

## 🏪 Asignar Productos a Categoría

### Cuando Creas un Producto
```
1. Va a /admin/products/new
2. Completa datos del producto
3. Encontrarás selector "Categorías"
4. Selecciona "Piel y Belleza"
5. Guardar producto
6. ✅ Producto aparece en categoría
```

### Cuando Editas un Producto
```
1. Va a /admin/products
2. Click ✏️ en producto
3. Modifica categoría si quieres
4. Guardar cambios
5. ✅ Actualizaciones reflejadas
```

---

## 🔍 Ver Categorías en Vivo

### Landing Page
```
http://localhost:5173/
↓
Scroll a "CATEGORÍAS"
↓
Ver todas las categorías
Contador: X productos en cada una
Click → ShopPage filtrada
```

### ShopPage Filtrada
```
http://localhost:5173/shop?category=piel-belleza
↓
Muestra solo productos de esa categoría
↓
Puedes seguir usando filtros normales
```

### Admin
```
http://localhost:5173/admin/categories
↓
Tabla con todas
Estado: Activa/Inactiva
Contador de productos
Acciones: Editar/Eliminar
```

---

## ⚙️ Funcionalidades Detalladas

### CREATE (Crear)
```
RUTA:     /admin/categories/new
BOTÓN:    [+ Nueva Categoría]
CAMPOS:   
  - Nombre (ES) ← Requerido
  - Nombre (EN) ← Requerido
  - Slug       ← Auto-generado
  - Descripción (ES/EN) ← Opcional
  - Imagen URL ← Opcional
VALIDACIÓN: Zod schema
RESULTADO:  Toast "Categoría creada exitosamente"
```

### READ (Leer)
```
RUTA:    /admin/categories
QUERY:   useCategories() hook
CACHING: 15 minutos
MUESTRA: Tabla con:
  - Nombre (ES/EN)
  - Slug
  - Cantidad de productos
  - Estado (Activa/Inactiva)
```

### UPDATE (Editar)
```
RUTA:     /admin/categories/:id/edit
BOTÓN:    ✏️ en tabla
CAMPOS:   Todos editables excepto ID
VALIDACIÓN: Zod schema
SLUG:     Puede cambiar (único)
RESULTADO: Toast "Categoría actualizada"
```

### DELETE (Eliminar)
```
RUTA:       /admin/categories/:id
BOTÓN:      🗑️ en tabla
PROTECCIÓN: No permite si tiene productos
CONFIRMACIÓN: Dialog de "¿Estás seguro?"
RESULTADO:   Soft delete (is_active = false)
             Toast "Categoría eliminada"
ERROR:       Toast "No se puede eliminar con X productos"
```

---

## 🎨 Customización Rápida

### Cambiar Colores de Categorías (Landing)
Edita `CategoriesSection.tsx`:
```typescript
color: index % 2 === 0 ? 'from-rose-400 to-pink-500' : 'from-amber-400 to-orange-500'
// Cambia a tus colores preferidos
```

### Cambiar Imágenes de Categorías
En Supabase table `categories`:
```
Completa columna `image_url` con URL válida
O deja vacío para usar imagen por defecto
```

### Cambiar Textos
Edita `i18n/locales/es.json`:
```json
{
  "categories": {
    "title": "Explora Nuestras Categorías",
    "subtitle": "POR CATEGORÍA",
    "view_all": "Ver Todas",
    "no_categories": "No hay categorías disponibles"
  }
}
```

---

## 🐛 Troubleshooting

### Error: "Slug already exists"
```
El slug que elegiste ya existe
SOLUCIÓN: Usa otro slug o cambia el nombre
```

### Error: "Cannot delete category"
```
La categoría tiene productos asignados
SOLUCIÓN: Desasigna productos primero
```

### No se ven los cambios
```
React Query cache puede estar viejo
SOLUCIÓN: F5 para refresh, o espera 15 min
```

### Landing page dice "No hay categorías"
```
No hay categorías en BD o error en query
SOLUCIÓN:
1. Verifica que categorías existen en Supabase
2. Check console para errores
3. Verifica RLS policies
```

---

## 📊 Datos de Ejemplo

Para probar, crea estas categorías:

| Nombre (ES) | Nombre (EN) | Slug |
|------------|------------|------|
| Cuidado Cabello | Hair Care | cuidado-cabello |
| Aseo Personal | Personal Care | aseo-personal |
| Maquillaje | Makeup | maquillaje |
| Piel y Belleza | Skin & Beauty | piel-belleza |
| Accesorios | Accessories | accesorios |

---

## 🔗 Links Importantes

### Páginas
- Home: `http://localhost:5173/`
- Shop: `http://localhost:5173/shop`
- Admin: `http://localhost:5173/admin`
- Categorías Admin: `http://localhost:5173/admin/categories`

### Documentación
- [Implementación Completa](./CATEGORIAS_IMPLEMENTACION_COMPLETA.md)
- [Plan Detallado](./PLAN_CATEGORIAS_DETALLADO.md)
- [Resumen Sesión](./RESUMEN_SESION_CATEGORIAS.md)

### Código
- Services: `src/services/categoryService.ts`
- Hooks: `src/hooks/useCategories.ts`
- Components: `src/components/landing/CategoriesSection.tsx`
- Admin: `src/pages/admin/categories/`

---

## ✅ Checklist de Bienvenida

Cuando hagas deploy:

- [ ] Crear 3-5 categorías de prueba
- [ ] Asignar productos a categorías
- [ ] Verificar landing page
- [ ] Verificar filtros en ShopPage
- [ ] Verificar admin panel
- [ ] Editar una categoría
- [ ] Intentar eliminar sin productos
- [ ] Intentar eliminar con productos (debe fallar)

---

## 🆘 Necesitas Ayuda?

### Revisa estos archivos:
1. `CATEGORIAS_IMPLEMENTACION_COMPLETA.md` - Todo técnico
2. `PLAN_CATEGORIAS_DETALLADO.md` - Paso a paso
3. Código con comentarios en componentes

### Check Console Browser:
```
F12 → Console → Busca errors
```

### Check Server Logs:
```
Supabase Dashboard → Logs
PostgreSQL logs
RLS policy issues
```

---

**¡Listo! Ya conoces cómo funcionan las categorías. ¡A vender! 🚀**

---

*Last updated: 2026-01-25*  
*Version: Quick Start v1.0*
