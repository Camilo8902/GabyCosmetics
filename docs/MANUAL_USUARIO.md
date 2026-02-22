# Manual de Usuario - GabyCosmetics Marketplace

## 📋 Tabla de Contenidos
1. [Registro de Empresas](#1-registro-de-empresas)
2. [Dashboard de Empresa](#2-dashboard-de-empresa)
3. [Gestión de Productos](#3-gestión-de-productos)
4. [Gestión de Categorías](#4-gestión-de-categorías)
5. [Sistema de Roles y Permisos](#5-sistema-de-roles-y-permisos)
6. [Planes de Suscripción](#6-planes-de-suscripción)

---

## 1. Registro de Empresas

### 1.1 Acceso al Registro
1. Inicia sesión en GabyCosmetics
2. Navega a `/company/register` o busca "Registrar Empresa" en el menú
3. Completa el formulario de 3 pasos

### 1.2 Paso 1: Información de la Empresa
| Campo | Descripción | Requerido |
|-------|-------------|-----------|
| Nombre de la Empresa | Nombre comercial | ✅ |
| Email de la Empresa | Email de contacto | ✅ |
| Teléfono | Teléfono de contacto | ❌ |
| ID Fiscal | Número fiscal/tributario | ✅ |
| Tipo de Negocio | Retail, Mayorista, etc. | ❌ |
| Sitio Web | URL del sitio web | ❌ |
| Descripción | Descripción del negocio | ❌ |

### 1.3 Paso 2: Selección de Plan
| Plan | Precio/Mes | Productos | Usuarios |
|------|------------|-----------|----------|
| Básico | $29 | 100 | 1 |
| Premium | $79 | 1,000 | 5 |
| Enterprise | $199 | Ilimitados | Ilimitados |

### 1.4 Paso 3: Confirmación
Revisa los datos ingresados y completa el registro.

---

## 2. Dashboard de Empresa

### 2.1 Acceso
- URL: `/company/dashboard`
- Requiere rol: `company` o superior

### 2.2 Métricas Principales
```
┌─────────────────────────────────────────────────┐
│  Total Ventas    │  Pedidos    │  Productos   │
│  $12,450        │  156        │  48          │
│  +12% vs mes    │  +8% vs mes │  3 bajo stock│
└─────────────────────────────────────────────────┘
```

### 2.3 Menú de Navegación
- 📊 Dashboard - Vista general
- 📦 Productos - Gestión de productos
- 🛒 Pedidos - Órdenes recibidas
- 📋 Inventario - Control de stock
- 📈 Analíticas - Reportes
- ⚙️ Configuración - Ajustes
- 👥 Equipo - Usuarios de la empresa

---

## 3. Gestión de Productos

### 3.1 Crear Nuevo Producto
1. Ve a **Productos** → **Nuevo Producto**
2. Completa la información:

#### Información Basic
- **Nombre**: Título del producto
- **Descripción**: Descripción detallada
- **Marca**: Fabricante
- **SKU**: Código único (opcional)
- **Código de Barras**: UPC/EAN (opcional)

#### Precios
- **Precio Base**: Precio regular
- **Precio Compare**: Precio anterior (para descuentos)
- **Precio de Costo**: Costo de adquisición

#### Inventario
- **Stock Total**: Cantidad disponible
- **Umbral Stock Bajo**: Alerta de stock mínimo
- **Permitir Backorder**: Venta sin stock

#### Visibilidad
- **Estado**: Borrador / Activo / Inactivo / Archivado
- **Destacado**: Mostrar en página principal
- **Visible**: Visible en la tienda

### 3.2 Gestión de Variantes
```
Ejemplo de variantes para una cremas:
├── Tamaño: 50ml, 100ml, 200ml
├── Color: Blanco, Rosa, Azul
└── Presentación: Tubo, Frasco, Sachet
```

Para crear variantes:
1. Activa "Producto con variantes"
2. Define los atributos (tamaño, color, etc.)
3. Genera combinaciones automáticamente
4. Configura precio y stock por variante

### 3.3 Imágenes
- Arrastra y suelta para subir imágenes
- Define imagen principal
- Reordena con arrastrar y soltar
- Formatos: JPG, PNG, WebP (max 5MB)

### 3.4 Videos
- YouTube/Vimeo URLs
- Videos propios (próximamente)
- Miniaturas automáticas

### 3.5 Documentos
- Manual de usuario
- Ficha técnica
- Garantía
- Certificados

---

## 4. Gestión de Categorías

### 4.1 Estructura Jerárquica
```
Belleza
├── Cuidado Facial
│   ├── Limpieza
│   ├── Hidratación
│   └── Tratamientos
├── Cuidado Corporal
│   ├── Cremas
│   ├── Aceites
│   └── Exfoliantes
└── Maquillaje
    ├── Labios
    ├── Ojos
    └── Rostro
```

### 4.2 Crear Categoría
1. Ve a **Configuración** → **Categorías**
2. Clic en **Nueva Categoría**
3. Completa:
   - Nombre
   - Categoría padre (para subcategorías)
   - Descripción
   - Imagen
   - Icono
   - Atributos (color, tamaño, etc.)

### 4.3 Atributos por Categoría
Cada categoría puede tener atributos específicos:
- **Texto**: Descripción corta
- **Número**: Peso, volumen
- **Selección**: Opciones predefinidas
- **Color**: Selector de colores
- **Talla**: S, M, L, XL

---

## 5. Sistema de Roles y Permisos

### 5.1 Roles Disponibles

| Rol | Descripción | Permisos Clave |
|-----|-------------|----------------|
| Propietario | Dueño de la empresa | Todos |
| Admin | Administrador general | Todos excepto eliminar empresa |
| Gestor de Productos | Maneja catálogo | CRUD productos, leer inventario |
| Gestor de Inventario | Controla stock | CRUD inventario, leer productos |
| Soporte | Atención al cliente | CRUD pedidos, leer clientes |
| Marketing | Promociones | Leer todo, exportar reportes |
| Ventas | Seguimiento | Leer pedidos y clientes |
| Viewer | Solo lectura | Ver productos y pedidos |

### 5.2 Invitar Usuarios
1. Ve a **Equipo** → **Invitar**
2. Ingresa email del usuario
3. Selecciona rol
4. Envía invitación

### 5.3 Permisos Granulares
```
products:read    - Ver productos
products:write   - Crear/editar productos
products:delete  - Eliminar productos
orders:read      - Ver pedidos
orders:write     - Editar pedidos
orders:process   - Cambiar estado
inventory:read   - Ver inventario
inventory:write  - Actualizar stock
customers:read    - Ver clientes
customers:write   - Editar clientes
analytics:read   - Ver estadísticas
settings:read    - Ver configuración
settings:write   - Editar configuración
users:read       - Ver usuarios del equipo
users:write      - Gestionar usuarios
users:invite     - Invitar usuarios
billing:read     - Ver facturación
billing:write     - Gestionar pagos
reports:read      - Ver reportes
reports:export   - Exportar datos
```

---

## 6. Planes de Suscripción

### 6.1 Comparación de Planes

| Característica | Básico | Premium | Enterprise |
|----------------|--------|---------|------------|
| **Precio** | $29/mes | $79/mes | $199/mes |
| **Productos** | 100 | 1,000 | Ilimitados |
| **Usuarios** | 1 | 5 | Ilimitados |
| **Almacenamiento** | 5 GB | 50 GB | 1 TB |
| **Órdenes/mes** | 500 | 5,000 | Ilimitadas |
| **API Access** | ❌ | ✅ | ✅ |
| **White-label** | ❌ | ✅ | ✅ |
| **Soporte** | Email | Prioritario | 24/7 + Account Manager |

### 6.2 Upgrade de Plan
1. Ve a **Configuración** → **Suscripción**
2. Clic en **Cambiar Plan**
3. Selecciona el nuevo plan
4. Confirma el cambio

### 6.3 Límites y Uso
```
┌──────────────────────────────────────────┐
│  Uso Actual                               │
├──────────────────────────────────────────┤
│  Productos: 45/100  ████████░░░░░░░░░░  │
│  Usuarios:   2/5     ████░░░░░░░░░░░░░░  │
│  Storage:    2.5/5GB █████░░░░░░░░░░░░░░  │
│  Órdenes:   123/500 ███░░░░░░░░░░░░░░░░  │
└──────────────────────────────────────────┘
```

---

## 📝 Glosario

| Término | Definición |
|---------|------------|
| **SKU** | Código de identificación único del producto |
| **Variant** | Versión diferente del mismo producto (tamaño, color) |
| **Stock** | Cantidad disponible en inventario |
| **Backorder** | Pedido de producto sin stock disponible |
| **RLS** | Row Level Security - Seguridad a nivel de fila |
| **Slug** | URL amigable del producto (ej: "crema-hidratante") |

---

## 🔗 Atajos de Teclado

| Atajo | Acción |
|-------|--------|
| `Ctrl+N` | Nuevo producto |
| `Ctrl+S` | Guardar |
| `Ctrl+F` | Buscar |
| `Esc` | Cancelar/Cerrar |

---

## 📞 Soporte

¿Necesitas ayuda?
- Email: soporte@gabycosmetics.com
- Documentación: `/docs`
- Dashboard: `/company/dashboard/support`
