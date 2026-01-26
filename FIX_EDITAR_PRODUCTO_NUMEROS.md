# Fix: Edición de Productos - Validación de Números al Cargar

## Problema Identificado

**Síntoma**: Crear producto funciona ✅, pero editar producto falla ❌

**Error**: El mismo "Expected number, received string" cuando intentas editar un producto

### Causa

Cuando se carga un producto existente para editar:
1. Los datos vienen de Supabase (pueden estar como strings o números)
2. Se usa `setValue()` para llenar los campos del formulario
3. Si los valores vienen como strings, FormField los recibe como strings
4. Aunque FormField tiene `valueAsNumber: true`, esto NO se aplica a valores precargados
5. ❌ Validación falla cuando intentas guardar

### La Diferencia

**Crear (✅ Funciona)**:
```
Usuario escribe "99.99" → FormField captura → valueAsNumber: true → 99.99 → OK
```

**Editar (❌ Falla)**:
```
Supabase devuelve "99.99" (string) → setValue() lo pone en el campo → 
FormField ve "99.99" (precargado) → valueAsNumber no aplica a valores iniciales → 
Usuario hace cambios → Intenta guardar → ERROR
```

---

## Solución Implementada

**En el `useEffect` que carga datos del producto (edición)**:

```typescript
// ANTES (❌ Incorrecto - causa error al editar)
setValue('price', product.price);  // Si es string, se queda como string
setValue('weight', product.weight);

// AHORA (✅ Correcto - convierte a número)
setValue('price', typeof product.price === 'string' ? parseFloat(product.price) : product.price);
setValue('weight', product.weight ? (typeof product.weight === 'string' ? parseFloat(product.weight) : product.weight) : undefined);
```

**Qué hace:**
1. Detecta si el valor es string o número
2. Si es string, lo convierte a número con `parseFloat()`
3. Si ya es número, lo deja como está
4. Si es null/undefined, lo mantiene

---

## Campos Corregidos

Todos los campos numéricos ahora se convierten al cargar:
- ✅ `price` (Precio)
- ✅ `compare_at_price` (Precio Comparado)
- ✅ `cost_price` (Precio de Costo)
- ✅ `weight` (Peso)

---

## 🧪 Cómo Probar

### Prueba 1: Editar Producto Existente
1. Navega a `/admin/products`
2. Selecciona un producto para editar
3. Verifica que los precios se cargan correctamente
4. Cambia uno de los precios
5. Haz clic en **"Guardar"**

**Resultado esperado**: ✅ Producto actualizado SIN error de validación

### Prueba 2: Editar Sin Cambios
1. Abre un producto para editar
2. No hagas cambios en los precios
3. Solo cambia algo como el nombre
4. Haz clic en **"Guardar"**

**Resultado esperado**: ✅ Se guarda sin error

### Prueba 3: Cambiar Número Decimal
1. Abre un producto existente
2. Cambia el precio de `99.99` a `199.99`
3. Haz clic en **"Guardar"**

**Resultado esperado**: ✅ Se actualiza correctamente a 199.99 (número, no string)

---

## 📁 Archivos Modificados

### `src/pages/admin/products/ProductForm.tsx`
✅ Actualizado `useEffect` de carga de producto (líneas ~98-120):
- Conversión de números al cargar datos
- Manejo de valores null/undefined
- ParseFloat para conversión segura

---

## 🔄 Flujo Completo (Ahora Correcto)

```
CREAR PRODUCTO:
1. Usuario digita "99.99" en input price
2. FormField captura (valueAsNumber: true)
3. Convierte a número: 99.99
4. Zod valida: OK ✅
5. Se guarda en BD

EDITAR PRODUCTO:
1. Se carga desde BD (puede ser string "99.99")
2. setValue() lo pone en el campo → parseFloat() lo convierte a 99.99
3. FormField muestra 99.99 como número
4. Usuario cambia a "199.99"
5. FormField captura (valueAsNumber: true)
6. Convierte a número: 199.99
7. Zod valida: OK ✅
8. Se actualiza en BD
```

---

## 🚀 Deploy

```bash
cd d:\GabyCosmetics
git add .
git commit -m "fix: Convert numeric values to numbers when loading product data for editing"
git push origin main
```

Vercel se reconstruirá en **2-3 minutos**.

---

## 📋 Checklist Final

- [ ] Puedo crear un producto con números (99.99)
- [ ] Puedo editar un producto existente
- [ ] Puedo cambiar precios al editar sin error
- [ ] NO hay error "Expected number, received string" ni al crear ni al editar
- [ ] Los números se guardan como números (no strings) en la BD

---

## Resumen de Cambios

| Situación | Antes | Ahora |
|-----------|-------|-------|
| **Crear** | ✅ Funciona | ✅ Sigue funcionando |
| **Editar** | ❌ Error 42501 / validación | ✅ Funciona |
| **Cargar valores** | ❌ Valores precargados con error | ✅ Se convierten a números |
| **Validación Zod** | ❌ Rechaza strings | ✅ Acepta números |

