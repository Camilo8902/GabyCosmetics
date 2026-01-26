# 📂 Gestión de Categorías - DELETE Real + Toggle Status

## 🎯 Cambios Implementados

### 1. **DELETE Real para Categorías**
**Archivo**: `categoryService.ts`

Cambió de:
```typescript
// ❌ ANTES - Solo desactivaba
async deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ is_active: false })
    .eq('id', id);
}
```

A:
```typescript
// ✅ DESPUÉS - DELETE real
async deleteCategory(id: string): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);
}
```

### 2. **Función Nueva: updateCategoryStatus**
**Archivo**: `categoryService.ts`

```typescript
async updateCategoryStatus(id: string, is_active: boolean): Promise<void> {
  const { error } = await supabase
    .from('categories')
    .update({ is_active })
    .eq('id', id);
}
```

Esta función permite **activar/desactivar categorías sin eliminarlas**.

### 3. **Hook Nueva: useUpdateCategoryStatus**
**Archivo**: `useCategories.ts`

```typescript
export function useUpdateCategoryStatus() {
  return useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      categoryService.updateCategoryStatus(id, is_active),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success(variables.is_active ? 'Categoría activada' : 'Categoría desactivada');
    },
  });
}
```

### 4. **UI Mejorada en CategoriesList**
**Archivo**: `CategoriesList.tsx`

Ahora hay **3 botones por categoría**:

1. **Editar** (✏️) - Edita la categoría
2. **Toggle Status** (🔘) - Activa/Desactiva (NO elimina)
3. **Eliminar** (🗑️) - DELETE real (solo si NO tiene productos)

#### Código del Toggle Status Button:
```tsx
<motion.button
  onClick={() => handleToggleStatus(category)}
  disabled={isUpdatingStatus}
  className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
  title={category.is_active ? 'Desactivar' : 'Activar'}
>
  {category.is_active ? (
    <ToggleRight className="w-5 h-5" />
  ) : (
    <ToggleLeft className="w-5 h-5" />
  )}
</motion.button>
```

## 📊 Flujo de Acciones

### Activar/Desactivar Categoría
```
Usuario click en botón Toggle (🔘)
    ↓
🔄 updateCategoryStatus(id, !is_active)
    ↓
UPDATE categories SET is_active = true/false
    ↓
✅ Categoría actualizada (visible o no en tienda)
    ↓
Toast: "Categoría activada" o "Categoría desactivada"
```

### Eliminar Categoría
```
Usuario click en botón Delete (🗑️)
    ↓
¿Tiene productos? 
    ├─ SÍ: Toast error + botón deshabilitado
    └─ NO: Mostrar confirmación
        ↓
    Usuario confirma
        ↓
    🗑️ deleteCategory(id)
        ↓
    DELETE FROM categories WHERE id = ?
        ↓
    ✅ Categoría eliminada completamente
        ↓
    Toast: "Categoría eliminada exitosamente"
```

## ✅ Restricciones Implementadas

### ❌ No Puedes Eliminar Si:
- La categoría tiene productos asociados
- El botón está deshabilitado con tooltip explicativo

### ✅ Puedes Activar/Desactivar:
- **Incluso si tiene productos**
- Solo cambia la visibilidad en la tienda
- Los productos siguen existiendo

## 🎨 Cambios Visuales

| Antes | Ahora |
|-------|-------|
| Solo botón de Eliminar (que solo desactivaba) | 3 botones: Editar, Toggle, Eliminar |
| No había forma de desactivar sin eliminar | Botón Toggle específico (🔘) |
| Toggle button deshabilitado si hay productos | Toggle siempre habilitado, Delete deshabilitado si hay productos |

## 🚀 Procedimiento

### Deploy
```bash
git add .
git commit -m "feat: Add DELETE real for categories + toggle status button"
git push origin main
```

### Test
1. Ve a `/admin/categories`
2. Intenta hacer click en el botón Toggle (🔘) - debe cambiar estado
3. Intenta eliminar una categoría:
   - Con productos: Botón deshabilitado con tooltip
   - Sin productos: Mostrar confirmación y eliminar

## 📝 Archivos Modificados

| Archivo | Cambio |
|---------|--------|
| categoryService.ts | - Cambiar deleteCategory a DELETE real<br>- Agregar updateCategoryStatus |
| useCategories.ts | - Agregar hook useUpdateCategoryStatus |
| CategoriesList.tsx | - Importar nuevo hook<br>- Agregar función handleToggleStatus<br>- Agregar botón Toggle (🔘)<br>- Mejorar botón Delete con tooltip |

## 🎯 Resultado Final

✅ **Eliminar**: DELETE real (solo si no tiene productos)
✅ **Desactivar/Activar**: Toggle status (siempre disponible)
✅ **Logs**: Mejora de debugging en consola
✅ **UX**: Botones claros con tooltips explicativos

---

**Status**: Ready for Deployment

Próximo paso: `git push` y test en `/admin/categories`
