# GUÍA DE PRUEBA: Creación de Productos

## Requisitos Previos

1. Estar autenticado como administrador en la aplicación
2. Tener acceso a `/admin/products`
3. Supabase bucket `product-images` debe existir y ser público
4. Navegador moderno (Chrome, Firefox, Safari, Edge)

## Paso a Paso para Crear un Producto

### 1. Navegar al Formulario de Creación

```
Home → Admin Dashboard → Productos → Nuevo Producto
O directamente: /admin/products/new
```

### 2. Rellenar Información Básica

**Nombre (Español)** (Requerido)
```
Ej: Shampoo Profesional de Keratin
```

**Nombre (Inglés)** (Requerido)
```
Ej: Professional Keratin Shampoo
```

**Slug** (Auto-generado)
- Se genera automáticamente del nombre español
- Puedes editarlo manualmente
- Usado en la URL del producto

### 3. Rellenar Descripciones

**Descripción Corta (Español)**
```
Ej: Shampoo profesional que restaura y fortalece cabello dañado
```

**Descripción Corta (Inglés)**
```
Ej: Professional shampoo that restores and strengthens damaged hair
```

**Descripción Larga (Español)** (Textarea)
```
Ej: Nuestro shampoo profesional de keratin está formulado con 
ingredientes premium para restaurar la estructura del cabello. 
Ideal para cabello dañado, teñido o procesado.

Beneficios:
- Restaura estructura capilar
- Proporciona brillo intenso
- Protege contra daño térmico
- Deja cabello suave y manejable
```

**Descripción Larga (Inglés)**
```
Traducción similar al inglés
```

### 4. Configurar Precios

**Precio de Venta** (Requerido)
```
Ej: 299.99
```

**Precio de Comparación** (Opcional)
```
Ej: 399.99
Se muestra tachado para mostrar descuento
```

**Precio de Costo** (Opcional)
```
Ej: 150.00
Se usa para calcular margen de ganancia
```

### 5. Información de Inventario

**SKU** (Código único)
```
Ej: KERATIN-SHAMPOO-500ML
```

**Código de Barras** (Opcional)
```
Ej: 8901234567890
```

**Peso** (Opcional)
```
Ej: 0.5 (en kg)
```

### 6. Cargar Imagen Principal ⭐ IMPORTANTE

**En el panel derecho:**

1. Click en el área de **"Imagen Principal"**
2. Seleccionar archivo de tu computadora
3. La imagen se subirá automáticamente a Supabase Storage
4. Debes ver una vista previa

**Requisitos de imagen:**
- Formato: JPG, PNG, WebP
- Tamaño: Máximo 10MB recomendado
- Dimensiones: Preferiblemente cuadrada (1:1)
- Resolución: Mínimo 400x400px

### 7. Seleccionar Categorías ⭐ IMPORTANTE

**En el panel derecho:**

1. Ver lista de **categorías disponibles**
2. Click en checkbox para seleccionar
3. Puedes seleccionar múltiples categorías
4. Las seleccionadas se verán con ✓

**Ejemplo:**
```
✓ Cuidado del Cabello
  ├─ Shampoos
  ├─ Acondicionadores
  └─ Tratamientos

Aseo Personal
  ├─ Jabones
  └─ Cremas Corporales
```

### 8. Configurar Opciones

**En el panel derecho:**

**Activo** ☑️
- ☑️ Activo: Producto visible en tienda
- ☐ Inactivo: Producto no disponible (pero existe en BD)

**Visible en Tienda** ☑️
- ☑️ Visible: Aparece en búsqueda y categorías
- ☐ Oculto: Solo accesible por link directo

**Destacado** ☐
- ☑️ Destacado: Aparece en sección "Productos Destacados"
- ☐ Normal: No aparece en destacados

### 9. Guardar el Producto

**Click en botón "Crear Producto"**

El sistema hará lo siguiente automáticamente:
1. ✅ Crear registro en tabla `products`
2. ✅ Subir imagen a Supabase Storage (`product-images/`)
3. ✅ Crear registro en tabla `product_images` con URL
4. ✅ Crear relaciones en tabla `product_categories`
5. ✅ Redirigir a página de edición del producto

---

## Verificar que Se Guardó Correctamente

### 1. En la Interfaz
- [ ] Redirige a página de edición `/admin/products/{id}/edit`
- [ ] Todos los campos están pre-rellenados
- [ ] La imagen se muestra en el preview

### 2. En la Landing Page
- [ ] Si marcó **"Destacado"**, aparece en "Productos Destacados"
- [ ] La imagen se carga correctamente
- [ ] El nombre y precio se muestran
- [ ] El producto tiene el descuento calculado

### 3. En Supabase (Dashboard)

**Tabla: products**
```
- Verificar que existe el producto
- name, name_en, price, etc. están correctos
- is_featured, is_visible, is_active tienen los valores correctos
```

**Tabla: product_images**
```
- product_id apunta al producto correcto
- url contiene la URL de Supabase Storage
- is_primary = true
```

**Tabla: product_categories**
```
- Debe tener N registros (uno por cada categoría seleccionada)
- product_id apunta al producto correcto
- category_id apunta a las categorías correctas
```

**Storage: product-images**
```
- Ir a Storage → product-images
- Ver carpeta del producto_id
- Archivo imagen debe estar presente
- Debe ser accesible (URL pública)
```

---

## Casos de Prueba

### Caso 1: Crear Producto Completo ✅

**Datos:**
- Nombre: "Acondicionador de Argán"
- Precio: $249.99
- Imagen: Seleccionar archivo
- Categorías: "Cuidado del Cabello", "Tratamientos"
- Activo: ✓
- Visible: ✓
- Destacado: ✓

**Resultado esperado:**
- Producto aparece en admin
- Imagen se ve en preview
- Aparece en "Productos Destacados" en landing
- Verificar BD: todos los registros existen

### Caso 2: Crear Producto Sin Imagen

**Datos:**
- Nombre: "Jabón Artesanal"
- Precio: $89.99
- Imagen: Sin cargar
- Categorías: "Aseo Personal"

**Resultado esperado:**
- Producto se crea sin imagen
- En product_images NO hay registro
- En landing se muestra imagen default
- No hay error

### Caso 3: Editar Producto Existente

**Pasos:**
1. Ir a producto existente
2. Cambiar nombre
3. Cambiar imagen
4. Cambiar categorías
5. Click "Guardar Cambios"

**Resultado esperado:**
- Todos los cambios se reflejan
- Imagen antigua se reemplaza
- Categorías se actualizan
- No hay duplicados en product_categories

### Caso 4: Crear Producto Sin Categorías

**Datos:**
- Nombre: "Producto Test"
- Precio: $99.99
- Imagen: Seleccionar
- Categorías: Sin seleccionar

**Resultado esperado:**
- Producto se crea correctamente
- NO hay registros en product_categories
- Se puede agregar categorías después editando

---

## Solucionar Problemas

### Problema: "Error al guardar la imagen"

**Causas:**
- Bucket `product-images` no existe
- Bucket no tiene permisos públicos
- Archivo muy grande (>10MB)
- Formato no soportado

**Solución:**
1. Verificar bucket en Supabase
2. Hacer bucket público (Settings → Policies)
3. Reducir tamaño de imagen
4. Usar formato JPG/PNG

### Problema: "Categorías no se guardan"

**Causas:**
- Tabla `product_categories` no existe
- RLS policies bloquean inserts
- Ids de categoría inválidos

**Solución:**
1. Verificar tabla en Supabase
2. Revisar RLS policies en Supabase
3. Verificar que ids de categoría existen

### Problema: "Producto no aparece en landing"

**Causas:**
- is_featured = false
- is_visible = false
- Producto aún no está cached

**Solución:**
1. Verificar flags en product
2. Esperar 5 segundos (cache React Query)
3. Refrescar la página F5
4. Limpiar cache del navegador Ctrl+Shift+Delete

### Problema: "Redirige a login después de crear"

**Causas:**
- Token de autenticación expiró
- Permisos de admin insuficientes

**Solución:**
1. Logout y login de nuevo
2. Verificar que usuario es admin en tabla users
3. Verificar role en Supabase RLS

---

## Checklist Final

Antes de marcar Fase 1 como "COMPLETA":

- [ ] ✅ Crear producto funciona sin errores
- [ ] ✅ Imagen se carga a Supabase Storage
- [ ] ✅ Categorías se crean en BD
- [ ] ✅ Producto aparece en landing (si es featured)
- [ ] ✅ Editar producto funciona
- [ ] ✅ Cambiar imagen funciona
- [ ] ✅ Cambiar categorías funciona
- [ ] ✅ Eliminar producto funciona (soft delete)
- [ ] ✅ Sin errores en consola del navegador
- [ ] ✅ Sin errores en logs de Supabase

---

**Última actualización**: 26 Enero 2025  
**Status**: Listo para pruebas de Fase 1 ✅
