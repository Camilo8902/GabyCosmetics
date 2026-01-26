# Fixes: Validación de Números y SKU Aleatorio

## Problemas Solucionados

### ❌ Problema 1: "Expected number, received string"
**Error al guardar productos:**
```
Expected number, received string
```

**Causa**: Los inputs HTML `type="number"` en el formulario a veces envían valores como strings. Cuando React Hook Form intenta validar con Zod, espera números reales y rechaza strings.

**Campos afectados**:
- `price` (Precio)
- `compare_at_price` (Precio Comparado)
- `cost_price` (Precio de Costo)
- `weight` (Peso)

### ✅ Solución Implementada

**En ProductForm.tsx**:

```typescript
// 1. Función para generar SKU aleatorio
function generateRandomSKU(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substr(2, 9).toUpperCase();
  return `SKU-${timestamp}-${random}`;
}

// 2. En la función onSubmit, convertir strings a números:
const processedData = {
  ...data,
  price: Number(data.price),
  compare_at_price: data.compare_at_price ? Number(data.compare_at_price) : undefined,
  cost_price: data.cost_price ? Number(data.cost_price) : undefined,
  weight: data.weight ? Number(data.weight) : undefined,
  // Generar SKU automáticamente si no existe
  sku: !isEditing && !data.sku ? generateRandomSKU() : data.sku,
};

// 3. Enviar processedData en lugar de data
await createProduct.mutateAsync(processedData);
```

---

## ✅ Cambio 2: SKU Aleatorio Automático

### Nueva Funcionalidad

**Antes**: El campo SKU era opcional y vacío
**Ahora**: Se genera automáticamente al crear un nuevo producto

**Ejemplo de SKU generado**:
```
SKU-S5K3W-2B4C6D7E8F
```

### Cómo Funciona

1. **Al crear un producto nuevo**:
   - Si no ingresas SKU → Se genera automáticamente
   - Si ingresas SKU → Se usa tu valor

2. **Al editar un producto**:
   - Se mantiene el SKU existente
   - Puedes regenerar con el botón 🔄

3. **Botón para regenerar SKU**:
   - Se muestra junto al campo SKU
   - Hace clic en el botón 🔄 para generar nuevo SKU
   - Solo activo mientras creas el producto

---

## 📁 Archivos Modificados

### `src/pages/admin/products/ProductForm.tsx`
✅ Agregado:
- Función `generateRandomSKU()`
- Conversión de strings a números en `onSubmit`
- SKU auto-generado para nuevos productos
- Botón para regenerar SKU con icono 🔄

---

## 🧪 Cómo Probar

### Prueba 1: Crear Producto con Números
1. Navega a `/admin/products/new`
2. Llena el formulario:
   - **Nombre**: "Test Product"
   - **Precio**: `99.99` (como número)
   - **Precio de Costo**: `50.00`
   - **Precio Comparado**: `120.00`
   - **Peso**: `0.5`
3. Observa:
   - SKU se genera automáticamente
   - Los números se aceptan correctamente
4. Haz clic en "Guardar"

**Resultado esperado**: Producto se crea sin error "Expected number, received string"

### Prueba 2: Regenerar SKU
1. Mientras estés creando el producto (antes de guardar)
2. Haz clic en el botón 🔄 junto al campo SKU
3. El SKU se cambia a un nuevo valor aleatorio

### Prueba 3: Editar Producto
1. Navega a `/admin/products` 
2. Abre un producto existente
3. Nota que el botón 🔄 sigue disponible para regenerar el SKU
4. Cambia los precios y guarda

**Resultado esperado**: Actualización sin error de validación

---

## 🔍 Detalles Técnicos

### Conversión de Números

El código convierte valores de string a number ANTES de enviar a Zod:

```typescript
// Entrada (string del formulario):
{ price: "99.99", weight: "0.5" }

// Salida (números convertidos):
{ price: 99.99, weight: 0.5 }
```

### Generación de SKU

Formula para SKU único:
```
SKU-{timestamp_en_base36}-{random_alphanumeric}
```

Ejemplo:
```
SKU-S5K3W-2B4C6D7E8F
 ↑   ↑      ↑
 |   |      └─ Números aleatorios
 |   └────────── Timestamp convertido
 └────────────── Prefijo "SKU-"
```

Cada SKU es único porque:
- El timestamp cambia en cada generación
- Los números aleatorios son diferentes cada vez
- Formato alphanumético para legibilidad

---

## 📋 Checklist de Validación

- [ ] Puedo crear un producto con precio decimal (99.99)
- [ ] Puedo crear un producto sin ingresar SKU (se genera automáticamente)
- [ ] El SKU generado tiene formato `SKU-XXXXX-YYYYYYYYY`
- [ ] Puedo hacer clic en 🔄 para regenerar SKU
- [ ] Puedo editar un producto sin perder el SKU
- [ ] No hay error "Expected number, received string"
- [ ] Los precios se guardan correctamente en la base de datos

---

## 🚀 Próximos Pasos

### 1. Deploy
```bash
git add .
git commit -m "feat: Add number conversion and auto-generate SKU for products"
git push origin main
```

### 2. Verificar en Producción
- Espera a que Vercel termine el deployment (2-3 minutos)
- Abre https://tu-proyecto.vercel.app/admin/products/new
- Crea un producto de prueba

### 3. Alternativas Futuras
- Agregar formato de SKU personalizable
- Agregar código de barras automático
- Validar que el SKU sea único (agregar CHECK en BD)
- Historial de cambios de SKU

