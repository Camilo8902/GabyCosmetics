# 🎯 Plan de Implementación - Panel de Administración

## 📋 Resumen Ejecutivo

**Objetivo:** Implementar un panel de administración completo y funcional para Gaby Cosmetics.

**Duración Estimada:** 4-5 semanas (dividido en 5 sub-fases)

**Estado Actual:**
- ✅ Layout y navegación básicos implementados
- ✅ Dashboard con datos mock
- ✅ Servicios y hooks creados (Fase 0)
- ✅ Rutas configuradas (con placeholders)
- ⚠️ Falta implementar funcionalidades CRUD
- ⚠️ Falta conectar con datos reales

---

## 🗓️ Estructura del Plan

### **Sub-Fase 5.1: Dashboard y Métricas** (3-4 días)
### **Sub-Fase 5.2: Gestión de Productos** (1 semana)
### **Sub-Fase 5.3: Gestión de Pedidos** (1 semana)
### **Sub-Fase 5.4: Gestión de Usuarios y Empresas** (1 semana)
### **Sub-Fase 5.5: Categorías, Reportes y Configuración** (1 semana)

---

## 📦 SUB-FASE 5.1: Dashboard y Métricas (3-4 días)

### Objetivo
Conectar el dashboard con datos reales y mostrar métricas actualizadas.

### Tareas Detalladas

#### 1.1 Actualizar Dashboard Principal
**Archivo:** `src/pages/admin/AdminDashboard.tsx`

**Tareas:**
- [ ] Reemplazar datos mock con hooks reales
- [ ] Implementar `useProducts()` para contar productos
- [ ] Implementar `useOrders()` para métricas de pedidos
- [ ] Implementar `useUsers()` para contar usuarios
- [ ] Calcular ingresos reales desde pedidos
- [ ] Agregar loading states
- [ ] Agregar error handling
- [ ] Implementar comparación con período anterior (tendencias)

**Código de ejemplo:**
```typescript
const { data: products } = useProducts({ is_active: true });
const { data: orders } = useOrders({ 
  status: ['pending', 'processing', 'shipped', 'delivered'],
  date_from: startOfMonth,
  date_to: endOfMonth
});
const { data: users } = useUsers({ is_active: true });
```

#### 1.2 Crear Hook de Métricas
**Archivo:** `src/hooks/useAdminMetrics.ts` (NUEVO)

**Funcionalidades:**
- [ ] Hook `useAdminMetrics()` que agrupa todas las métricas
- [ ] Cálculo de tendencias (comparación con mes anterior)
- [ ] Cálculo de ingresos totales
- [ ] Cálculo de pedidos por estado
- [ ] Cálculo de productos por categoría
- [ ] Caché inteligente (5 minutos)

**Estructura:**
```typescript
interface AdminMetrics {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  ordersByStatus: Record<string, number>;
  revenueTrend: number; // % cambio
  ordersTrend: number;
  productsTrend: number;
  usersTrend: number;
}
```

#### 1.3 Mejorar Pedidos Recientes
**Archivo:** `src/pages/admin/AdminDashboard.tsx`

**Tareas:**
- [ ] Conectar con `useOrders()` con límite de 5
- [ ] Ordenar por fecha más reciente
- [ ] Mostrar información real del cliente
- [ ] Agregar link al detalle del pedido
- [ ] Agregar loading skeleton

#### 1.4 Mejorar Productos Más Vendidos
**Archivo:** `src/pages/admin/AdminDashboard.tsx`

**Tareas:**
- [ ] Crear query para productos más vendidos
- [ ] Agregar campo `sales_count` o calcular desde `order_items`
- [ ] Mostrar imagen del producto
- [ ] Mostrar ingresos generados
- [ ] Agregar link al producto

**Query SQL necesario:**
```sql
SELECT 
  p.*,
  COUNT(oi.id) as sales_count,
  SUM(oi.quantity * oi.price) as revenue
FROM products p
LEFT JOIN order_items oi ON p.id = oi.product_id
WHERE oi.order_id IN (
  SELECT id FROM orders WHERE status IN ('delivered', 'shipped')
)
GROUP BY p.id
ORDER BY sales_count DESC
LIMIT 5;
```

#### 1.5 Agregar Gráficos (Opcional pero Recomendado)
**Dependencia:** `recharts` o `chart.js`

**Tareas:**
- [ ] Instalar librería de gráficos
- [ ] Crear componente `SalesChart`
- [ ] Mostrar ventas por día/semana/mes
- [ ] Mostrar productos más vendidos (gráfico de barras)
- [ ] Mostrar distribución de pedidos por estado (pie chart)

### Entregables
- ✅ Dashboard conectado con datos reales
- ✅ Métricas actualizadas en tiempo real
- ✅ Tendencias calculadas
- ✅ Pedidos recientes funcionales
- ✅ Productos más vendidos reales

---

## 📦 SUB-FASE 5.2: Gestión de Productos (1 semana)

### Objetivo
Implementar CRUD completo de productos con funcionalidades avanzadas.

### Tareas Detalladas

#### 2.1 Lista de Productos
**Archivo:** `src/pages/admin/products/ProductsList.tsx` (NUEVO)

**Funcionalidades:**
- [ ] Tabla con paginación usando `DataTable` component
- [ ] Columnas: Imagen, Nombre, Precio, Stock, Estado, Categoría, Acciones
- [ ] Filtros: Estado (activo/inactivo), Categoría, Búsqueda por nombre
- [ ] Ordenamiento: Por nombre, precio, fecha de creación
- [ ] Bulk actions: Activar/desactivar múltiples, Eliminar múltiples
- [ ] Botón "Nuevo Producto"
- [ ] Loading states
- [ ] Empty states

**Columnas de la tabla:**
```typescript
const columns = [
  { key: 'image', label: 'Imagen', sortable: false },
  { key: 'name', label: 'Nombre', sortable: true },
  { key: 'price', label: 'Precio', sortable: true },
  { key: 'stock', label: 'Stock', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'category', label: 'Categoría', sortable: true },
  { key: 'actions', label: 'Acciones', sortable: false },
];
```

#### 2.2 Formulario de Crear/Editar Producto
**Archivo:** `src/pages/admin/products/ProductForm.tsx` (NUEVO)

**Campos del formulario:**
- [ ] **Información Básica:**
  - Nombre (ES/EN) - requerido
  - Slug (auto-generado desde nombre)
  - Descripción (ES/EN) - textarea con markdown
  - Precio - requerido
  - Precio comparado (opcional)
  - SKU (opcional)

- [ ] **Categorías:**
  - Selector múltiple de categorías
  - Usar `useCategories()` hook

- [ ] **Imágenes:**
  - Subida múltiple usando `ImageUploader` component
  - Preview de imágenes
  - Ordenar imágenes (drag & drop)
  - Imagen principal

- [ ] **Inventario:**
  - Stock disponible
  - Stock mínimo (para alertas)
  - Ubicación (si aplica)
  - Permitir backorders (sí/no)

- [ ] **Variantes (Avanzado):**
  - Toggle "Tiene variantes"
  - Si tiene variantes, mostrar tabla de variantes
  - Agregar/editar/eliminar variantes
  - Atributos: Tamaño, Color, etc.

- [ ] **SEO:**
  - Meta title
  - Meta description
  - Meta keywords

- [ ] **Configuración:**
  - Activo/Inactivo
  - Visible en tienda
  - Destacado
  - Empresa (si aplica)

**Validación:**
- [ ] Usar `productFormSchema` de `validators.ts`
- [ ] Validación en tiempo real
- [ ] Mensajes de error claros

**Funcionalidades:**
- [ ] Guardar como borrador
- [ ] Preview del producto
- [ ] Duplicar producto existente

#### 2.3 Página de Detalle de Producto
**Archivo:** `src/pages/admin/products/ProductDetail.tsx` (NUEVO)

**Funcionalidades:**
- [ ] Ver información completa del producto
- [ ] Ver imágenes en galería
- [ ] Ver variantes (si tiene)
- [ ] Ver inventario
- [ ] Ver historial de cambios (si implementamos auditoría)
- [ ] Botones: Editar, Duplicar, Eliminar
- [ ] Mostrar estadísticas: Ventas, Ingresos, Rating promedio

#### 2.4 Funcionalidades Adicionales
**Archivos varios:**

- [ ] **Duplicar Producto:**
  - Función `duplicateProduct(id)` en `productService.ts`
  - Copiar todos los campos excepto slug
  - Agregar "-copia" al nombre

- [ ] **Eliminar Producto (Soft Delete):**
  - Usar `useDeleteProduct()` hook
  - Confirmación con `ConfirmDialog`
  - Actualizar lista automáticamente

- [ ] **Bulk Actions:**
  - Selección múltiple en tabla
  - Botones: Activar, Desactivar, Eliminar
  - Confirmación para acciones masivas

- [ ] **Subida de Imágenes:**
  - Usar `ImageUploader` component
  - Subida a Supabase Storage
  - Optimización de imágenes (opcional)
  - Generar thumbnails (opcional)

#### 2.5 Rutas
**Archivo:** `src/App.tsx`

**Actualizar rutas:**
```typescript
<Route path="products" element={<ProductsList />} />
<Route path="products/new" element={<ProductForm />} />
<Route path="products/:id" element={<ProductDetail />} />
<Route path="products/:id/edit" element={<ProductForm />} />
```

### Entregables
- ✅ Lista de productos funcional con filtros
- ✅ Formulario completo de crear/editar
- ✅ Subida de imágenes múltiple
- ✅ Gestión de variantes
- ✅ Duplicar producto
- ✅ Bulk actions
- ✅ Soft delete

---

## 📦 SUB-FASE 5.3: Gestión de Pedidos (1 semana)

### Objetivo
Implementar gestión completa de pedidos con actualización de estados.

### Tareas Detalladas

#### 3.1 Lista de Pedidos
**Archivo:** `src/pages/admin/orders/OrdersList.tsx` (NUEVO)

**Funcionalidades:**
- [ ] Tabla con paginación
- [ ] Columnas: Número, Cliente, Fecha, Total, Estado, Empresa, Acciones
- [ ] Filtros:
  - Estado (pending, processing, shipped, delivered, cancelled)
  - Fecha (rango)
  - Cliente (búsqueda)
  - Empresa
  - Rango de precio
- [ ] Búsqueda por número de pedido
- [ ] Ordenamiento: Por fecha, total, estado
- [ ] Exportar a CSV/Excel
- [ ] Bulk actions: Cambiar estado múltiple

**Columnas:**
```typescript
const columns = [
  { key: 'order_number', label: 'Número', sortable: true },
  { key: 'customer', label: 'Cliente', sortable: true },
  { key: 'date', label: 'Fecha', sortable: true },
  { key: 'total', label: 'Total', sortable: true },
  { key: 'status', label: 'Estado', sortable: true },
  { key: 'company', label: 'Empresa', sortable: true },
  { key: 'actions', label: 'Acciones', sortable: false },
];
```

#### 3.2 Detalle de Pedido
**Archivo:** `src/pages/admin/orders/OrderDetail.tsx` (NUEVO)

**Secciones:**

**3.2.1 Información del Pedido:**
- [ ] Número de pedido
- [ ] Fecha y hora
- [ ] Estado actual (con selector para cambiar)
- [ ] Total del pedido (desglosado)
- [ ] Método de pago
- [ ] Estado del pago

**3.2.2 Información del Cliente:**
- [ ] Nombre completo
- [ ] Email
- [ ] Teléfono
- [ ] Dirección de envío
- [ ] Link al perfil del usuario

**3.2.3 Items del Pedido:**
- [ ] Tabla con: Imagen, Producto, Variante, Cantidad, Precio, Subtotal
- [ ] Mostrar variantes si aplica
- [ ] Mostrar empresa de cada producto

**3.2.4 Resumen Financiero:**
- [ ] Subtotal
- [ ] Descuentos
- [ ] Envío
- [ ] Impuestos
- [ ] Total

**3.2.5 Historial de Estados:**
- [ ] Timeline de cambios de estado
- [ ] Fecha y hora de cada cambio
- [ ] Usuario que hizo el cambio

**3.2.6 Notas:**
- [ ] Notas internas (solo admin)
- [ ] Notas para el cliente
- [ ] Agregar/editar notas

**3.2.7 Acciones:**
- [ ] Cambiar estado
- [ ] Enviar notificación al cliente
- [ ] Generar factura (PDF)
- [ ] Generar etiqueta de envío
- [ ] Procesar reembolso (si aplica)
- [ ] Cancelar pedido

#### 3.3 Actualizar Estado de Pedido
**Archivo:** `src/pages/admin/orders/OrderStatusUpdate.tsx` (NUEVO - Componente)

**Funcionalidades:**
- [ ] Selector de nuevo estado
- [ ] Validación de transiciones válidas
- [ ] Nota opcional del cambio
- [ ] Enviar email al cliente (opcional)
- [ ] Confirmación antes de cambiar

**Estados válidos:**
```typescript
const statusFlow = {
  pending: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [], // Estado final
  cancelled: [], // Estado final
};
```

#### 3.4 Generar Factura PDF
**Archivo:** `src/utils/pdfGenerator.ts` (NUEVO)

**Dependencia:** `jspdf` o `react-pdf`

**Funcionalidades:**
- [ ] Generar PDF con información del pedido
- [ ] Incluir logo de la empresa
- [ ] Incluir items, totales, dirección
- [ ] Descargar PDF
- [ ] Enviar por email (opcional)

#### 3.5 Notificaciones de Pedido
**Archivo:** `src/services/notificationService.ts` (NUEVO)

**Funcionalidades:**
- [ ] Enviar email cuando cambia estado
- [ ] Templates de email por estado
- [ ] Notificaciones en la app (opcional)

#### 3.6 Rutas
**Archivo:** `src/App.tsx`

```typescript
<Route path="orders" element={<OrdersList />} />
<Route path="orders/:id" element={<OrderDetail />} />
```

### Entregables
- ✅ Lista de pedidos con filtros avanzados
- ✅ Detalle completo de pedido
- ✅ Actualización de estados
- ✅ Generación de facturas PDF
- ✅ Notificaciones por email
- ✅ Exportación de datos

---

## 📦 SUB-FASE 5.4: Gestión de Usuarios y Empresas (1 semana)

### Objetivo
Implementar gestión completa de usuarios y empresas.

### Tareas Detalladas

#### 4.1 Gestión de Usuarios

**4.1.1 Lista de Usuarios**
**Archivo:** `src/pages/admin/users/UsersList.tsx` (NUEVO)

**Funcionalidades:**
- [ ] Tabla con paginación
- [ ] Columnas: Avatar, Nombre, Email, Rol, Estado, Fecha registro, Acciones
- [ ] Filtros:
  - Rol (admin, company, consultant, customer)
  - Estado (activo/inactivo)
  - Búsqueda por nombre/email
- [ ] Ordenamiento
- [ ] Bulk actions: Activar/desactivar, Cambiar rol

**4.1.2 Detalle/Edición de Usuario**
**Archivo:** `src/pages/admin/users/UserDetail.tsx` (NUEVO)

**Secciones:**
- [ ] **Información Personal:**
  - Nombre completo
  - Email (no editable, solo ver)
  - Teléfono
  - Avatar (subir/cambiar)
  - Fecha de registro
  - Último acceso

- [ ] **Configuración:**
  - Rol (selector)
  - Estado (activo/inactivo)
  - Email verificado

- [ ] **Historial:**
  - Pedidos del usuario (tabla)
  - Actividad reciente
  - Cambios de rol (si implementamos auditoría)

- [ ] **Acciones:**
  - Guardar cambios
  - Enviar email de bienvenida
  - Resetear contraseña
  - Eliminar usuario (con confirmación)

#### 4.2 Gestión de Empresas

**4.2.1 Lista de Empresas**
**Archivo:** `src/pages/admin/companies/CompaniesList.tsx` (NUEVO)

**Funcionalidades:**
- [ ] Tabla con paginación
- [ ] Columnas: Logo, Nombre, Email, Estado, Verificada, Productos, Acciones
- [ ] Filtros:
  - Estado (activa/inactiva)
  - Verificada (sí/no)
  - Búsqueda por nombre
- [ ] Ordenamiento
- [ ] Bulk actions: Activar/desactivar, Verificar

**4.2.2 Detalle/Edición de Empresa**
**Archivo:** `src/pages/admin/companies/CompanyDetail.tsx` (NUEVO)

**Secciones:**
- [ ] **Información de la Empresa:**
  - Nombre
  - Logo (subir/cambiar)
  - Descripción
  - Email
  - Teléfono
  - Dirección
  - Sitio web
  - Redes sociales

- [ ] **Configuración:**
  - Estado (activa/inactiva)
  - Verificada (toggle)
  - Usuario asociado (link)

- [ ] **Productos de la Empresa:**
  - Tabla de productos
  - Link a cada producto
  - Estadísticas: Total productos, Activos, Inactivos

- [ ] **Pedidos de la Empresa:**
  - Tabla de pedidos
  - Filtros por estado
  - Total de ingresos

- [ ] **Comisiones (Futuro):**
  - Configurar porcentaje de comisión
  - Ver historial de comisiones

- [ ] **Acciones:**
  - Guardar cambios
  - Verificar empresa
  - Activar/desactivar
  - Eliminar empresa (con confirmación)

#### 4.3 Rutas
**Archivo:** `src/App.tsx`

```typescript
<Route path="users" element={<UsersList />} />
<Route path="users/:id" element={<UserDetail />} />
<Route path="companies" element={<CompaniesList />} />
<Route path="companies/:id" element={<CompanyDetail />} />
```

### Entregables
- ✅ Lista de usuarios con filtros
- ✅ Detalle/edición de usuario
- ✅ Cambio de roles
- ✅ Lista de empresas
- ✅ Detalle/edición de empresa
- ✅ Verificación de empresas
- ✅ Gestión de productos por empresa

---

## 📦 SUB-FASE 5.5: Categorías, Reportes y Configuración (1 semana)

### Objetivo
Completar funcionalidades restantes del panel admin.

### Tareas Detalladas

#### 5.1 Gestión de Categorías

**5.1.1 Lista de Categorías**
**Archivo:** `src/pages/admin/categories/CategoriesList.tsx` (NUEVO)

**Funcionalidades:**
- [ ] Vista de árbol (jerarquía)
- [ ] Expandir/colapsar
- [ ] Drag & drop para reordenar (opcional)
- [ ] Columnas: Nombre, Slug, Productos, Estado, Acciones
- [ ] Filtros: Estado, Búsqueda
- [ ] Botón "Nueva Categoría"

**5.1.2 Formulario de Categoría**
**Archivo:** `src/pages/admin/categories/CategoryForm.tsx` (NUEVO)

**Campos:**
- [ ] Nombre (ES/EN)
- [ ] Slug (auto-generado)
- [ ] Descripción (ES/EN)
- [ ] Categoría padre (selector)
- [ ] Imagen (opcional)
- [ ] Estado (activa/inactiva)
- [ ] SEO: Meta title, Meta description

**5.1.3 Eliminar Categoría**
- [ ] Validar que no tenga productos
- [ ] Validar que no tenga subcategorías
- [ ] Confirmación
- [ ] Mover productos a otra categoría (opcional)

#### 5.2 Reportes

**5.2.1 Dashboard de Reportes**
**Archivo:** `src/pages/admin/reports/ReportsDashboard.tsx` (NUEVO)

**Gráficos:**
- [ ] Ventas por período (línea)
- [ ] Productos más vendidos (barras)
- [ ] Distribución de pedidos por estado (pie)
- [ ] Ingresos por mes (área)
- [ ] Clientes nuevos (línea)
- [ ] Top empresas por ventas (barras horizontales)

**Filtros:**
- [ ] Rango de fechas
- [ ] Categoría de productos
- [ ] Empresa
- [ ] Estado de pedidos

**5.2.2 Reportes Descargables**
**Archivo:** `src/pages/admin/reports/ReportsExport.tsx` (NUEVO)

**Tipos de reportes:**
- [ ] Reporte de ventas (PDF/Excel)
- [ ] Reporte de productos (PDF/Excel)
- [ ] Reporte de usuarios (PDF/Excel)
- [ ] Reporte de empresas (PDF/Excel)
- [ ] Reporte personalizado (con filtros)

**Dependencias:**
- `jspdf` para PDF
- `xlsx` para Excel

#### 5.3 Configuración

**5.3.1 Página de Configuración**
**Archivo:** `src/pages/admin/settings/SettingsPage.tsx` (NUEVO)

**Secciones:**

**5.3.1.1 Información General:**
- [ ] Nombre de la tienda
- [ ] Logo
- [ ] Descripción
- [ ] Email de contacto
- [ ] Teléfono
- [ ] Dirección
- [ ] Redes sociales

**5.3.1.2 Configuración de Envíos:**
- [ ] Costo de envío estándar
- [ ] Envío gratis sobre X monto
- [ ] Zonas de envío
- [ ] Tiempos de entrega

**5.3.1.3 Configuración de Pagos:**
- [ ] Integración Stripe (API keys)
- [ ] Métodos de pago habilitados
- [ ] Moneda

**5.3.1.4 Configuración de Emails:**
- [ ] SMTP settings
- [ ] Templates de email
- [ ] Notificaciones automáticas

**5.3.1.5 Configuración de Notificaciones:**
- [ ] Notificaciones por email
- [ ] Notificaciones en app
- [ ] Alertas de stock bajo

**5.3.1.6 Configuración de Cupones:**
- [ ] Habilitar sistema de cupones
- [ ] Descuentos por defecto

**Nota:** La configuración puede guardarse en:
- Tabla `settings` en Supabase
- O variables de entorno (para datos sensibles)

#### 5.4 Rutas
**Archivo:** `src/App.tsx`

```typescript
<Route path="categories" element={<CategoriesList />} />
<Route path="categories/new" element={<CategoryForm />} />
<Route path="categories/:id/edit" element={<CategoryForm />} />
<Route path="reports" element={<ReportsDashboard />} />
<Route path="settings" element={<SettingsPage />} />
```

### Entregables
- ✅ Gestión completa de categorías
- ✅ Vista jerárquica de categorías
- ✅ Dashboard de reportes con gráficos
- ✅ Exportación de reportes (PDF/Excel)
- ✅ Página de configuración completa
- ✅ Guardado de configuraciones

---

## 🛠️ Componentes y Utilidades Necesarios

### Componentes Nuevos a Crear

1. **`src/pages/admin/products/ProductsList.tsx`**
2. **`src/pages/admin/products/ProductForm.tsx`**
3. **`src/pages/admin/products/ProductDetail.tsx`**
4. **`src/pages/admin/orders/OrdersList.tsx`**
5. **`src/pages/admin/orders/OrderDetail.tsx`**
6. **`src/pages/admin/orders/OrderStatusUpdate.tsx`**
7. **`src/pages/admin/users/UsersList.tsx`**
8. **`src/pages/admin/users/UserDetail.tsx`**
9. **`src/pages/admin/companies/CompaniesList.tsx`**
10. **`src/pages/admin/companies/CompanyDetail.tsx`**
11. **`src/pages/admin/categories/CategoriesList.tsx`**
12. **`src/pages/admin/categories/CategoryForm.tsx`**
13. **`src/pages/admin/reports/ReportsDashboard.tsx`**
14. **`src/pages/admin/reports/ReportsExport.tsx`**
15. **`src/pages/admin/settings/SettingsPage.tsx`**

### Hooks Nuevos a Crear

1. **`src/hooks/useAdminMetrics.ts`** - Métricas del dashboard
2. **`src/hooks/useProductVariants.ts`** - Gestión de variantes
3. **`src/hooks/useOrderStatus.ts`** - Actualización de estados

### Servicios Nuevos a Crear

1. **`src/services/notificationService.ts`** - Envío de emails
2. **`src/services/pdfService.ts`** - Generación de PDFs
3. **`src/services/reportService.ts`** - Generación de reportes
4. **`src/services/settingsService.ts`** - Gestión de configuración

### Utilidades Nuevas

1. **`src/utils/pdfGenerator.ts`** - Generar PDFs
2. **`src/utils/excelExporter.ts`** - Exportar a Excel
3. **`src/utils/statusFlow.ts`** - Validar transiciones de estado

---

## 📦 Dependencias Adicionales Necesarias

```json
{
  "dependencies": {
    "recharts": "^2.10.0",           // Gráficos
    "jspdf": "^2.5.1",                // PDFs
    "xlsx": "^0.18.5",                // Excel
    "react-markdown": "^9.0.0",        // Markdown en descripciones
    "react-dropzone": "^14.2.3",      // Drag & drop para imágenes
    "date-fns": "^2.30.0"             // Manejo de fechas
  }
}
```

---

## 🎨 Consideraciones de Diseño

### Consistencia
- Usar componentes UI ya creados (`DataTable`, `FormField`, `StatusBadge`, etc.)
- Mantener el mismo estilo del `AdminLayout`
- Colores: `rose-600` para acciones principales, `gray-900` para fondo sidebar

### UX
- Loading states en todas las operaciones
- Confirmaciones para acciones destructivas
- Toast notifications para feedback
- Empty states informativos
- Error boundaries

### Responsive
- Tablas con scroll horizontal en móvil
- Formularios adaptativos
- Sidebar colapsable en móvil (ya implementado)

---

## ✅ Checklist de Implementación

### Prioridad Alta (MVP)
- [ ] Dashboard con datos reales
- [ ] CRUD de productos básico
- [ ] Lista y detalle de pedidos
- [ ] Actualizar estado de pedidos
- [ ] Lista y edición de usuarios
- [ ] Lista y edición de empresas

### Prioridad Media
- [ ] Gestión de categorías
- [ ] Reportes básicos
- [ ] Subida de imágenes múltiple
- [ ] Generación de facturas PDF

### Prioridad Baja (Nice to Have)
- [ ] Gráficos avanzados
- [ ] Exportación a Excel
- [ ] Drag & drop en categorías
- [ ] Auditoría de cambios
- [ ] Notificaciones en tiempo real

---

## 📊 Métricas de Éxito

- ✅ Todas las operaciones CRUD funcionando
- ✅ Dashboard mostrando datos reales
- ✅ Tiempo de carga < 2 segundos
- ✅ Sin errores en consola
- ✅ Responsive en móvil y desktop
- ✅ Accesibilidad básica (ARIA labels)

---

## 🚀 Orden de Implementación Recomendado

1. **Semana 1:** Sub-Fase 5.1 (Dashboard) + Sub-Fase 5.2 (Productos)
2. **Semana 2:** Sub-Fase 5.3 (Pedidos)
3. **Semana 3:** Sub-Fase 5.4 (Usuarios y Empresas)
4. **Semana 4:** Sub-Fase 5.5 (Categorías, Reportes, Configuración)
5. **Semana 5:** Testing, ajustes y optimizaciones

---

## 💡 Notas Finales

- **Reutilizar:** Aprovechar servicios y hooks ya creados en Fase 0
- **Validación:** Usar schemas de Zod ya definidos
- **Errores:** Manejar todos los casos de error
- **Testing:** Probar cada funcionalidad antes de continuar
- **Documentación:** Comentar código complejo

---

¿Quieres que empecemos con la Sub-Fase 5.1 (Dashboard y Métricas)?
