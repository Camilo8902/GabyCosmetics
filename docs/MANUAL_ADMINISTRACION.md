# Manual de Usuario - Plataforma de Administración GabyCosmetics

## Índice
1. [Introducción](#introducción)
2. [Roles del Sistema](#roles-del-sistema)
3. [Módulo de Administración](#módulo-de-administración)
4. [Módulo de Empresas](#módulo-de-empresas)
5. [Módulo de Usuarios](#módulo-de-usuarios)
6. [Módulo de Productos](#módulo-de-productos)
7. [Módulo de Pedidos](#módulo-de-pedidos)
8. [Módulo de Reportes](#módulo-de-reportes)

---

## Introducción

GabyCosmetics es una plataforma de marketplace que permite la gestión de múltiples empresas vendedoras de productos cosméticos. Este manual describe las funcionalidades disponibles para cada rol de usuario.

---

## Roles del Sistema

### 1. Administrador (admin)
**Acceso completo a todas las funcionalidades del sistema.**

| Funcionalidad | Descripción |
|--------------|-------------|
| Dashboard | Métricas globales del marketplace |
| Empresas | Gestión completa de empresas afiliadas |
| Solicitudes | Aprobación/rechazo de nuevas empresas |
| Usuarios | CRUD completo de usuarios |
| Productos | Gestión de todos los productos |
| Pedidos | Visualización de todos los pedidos |
| Reportes | Métricas y estadísticas globales |
| Categorías | Gestión de categorías de productos |
| Contenido | Editor de contenido estático |

### 2. Empresa (company)
**Acceso al panel de empresa para gestionar su negocio.**

| Funcionalidad | Descripción |
|--------------|-------------|
| Dashboard | Métricas de su empresa |
| Productos | Gestión de sus productos |
| Pedidos | Gestión de pedidos de su empresa |
| Inventario | Control de stock |
| Facturación | Estado de suscripción |

### 3. Consultor (consultant)
**Acceso de solo lectura a reportes y datos.**

| Funcionalidad | Descripción |
|--------------|-------------|
| Dashboard | Visualización de métricas |
| Reportes | Consulta de reportes |

### 4. Cliente (customer)
**Usuario final que realiza compras.**

| Funcionalidad | Descripción |
|--------------|-------------|
| Tienda | Navegación y compras |
| Carrito | Gestión del carrito |
| Pedidos | Historial de pedidos propios |

---

## Módulo de Administración

### Acceso
Ruta: `/admin`

### Dashboard Principal
El dashboard muestra:
- **Tarjetas de estadísticas**:
  - Total de productos activos
  - Pedidos totales y pendientes
  - Ingresos totales
  - Empresas activas
  - Solicitudes pendientes
  - Usuarios registrados

### Navegación
El menú lateral incluye:
1. **Dashboard** - Vista general
2. **Productos** - Gestión de productos
3. **Pedidos** - Gestión de pedidos
4. **Usuarios** - Gestión de usuarios
5. **Empresas** - Gestión de empresas
6. **Categorías** - Gestión de categorías
7. **Reportes** - Métricas globales
8. **Contenido** - Editor de contenido
9. **Configuración** - Ajustes del sistema

---

## Módulo de Empresas

### Acceso
Ruta: `/admin/companies`

### Descripción General
Este módulo permite la administración completa de las empresas afiliadas al marketplace, incluyendo la gestión de solicitudes de registro.

### Pestañas Principales

#### 1. Empresas
Lista todas las empresas registradas con:
- Logo y nombre de la empresa
- Información de contacto
- Estado (Activa/Inactiva, Verificada)
- Fecha de registro

**Acciones disponibles:**
| Acción | Descripción |
|--------|-------------|
| 👁️ Ver detalle | Muestra información completa de la empresa |
| ✏️ Editar | Modifica datos de la empresa |
| ✓ Activar/Suspender | Cambia el estado de la empresa |
| 🗑️ Eliminar | Desactiva la empresa del sistema |

#### 2. Solicitudes
Gestiona las solicitudes de nuevas empresas:

**Filtros disponibles:**
- Todas
- Pendientes
- Aprobadas
- Rechazadas

**Acciones por solicitud:**
| Acción | Descripción |
|--------|-------------|
| 👁️ Ver detalle | Muestra información completa del solicitante |
| ✓ Aprobar | Aprueba la solicitud y crea la empresa |
| ✗ Rechazar | Rechaza la solicitud con notas |

**Información mostrada:**
- Nombre de la empresa
- Nombre del propietario
- Email y teléfono
- Tipo de negocio
- Cantidad de productos proyectada
- Mensaje adicional
- Fecha de solicitud

### Formulario de Edición de Empresa
Ruta: `/admin/companies/:id/edit`

**Campos disponibles:**
| Campo | Descripción |
|-------|-------------|
| Nombre | Nombre de la empresa |
| Descripción | Descripción breve |
| Teléfono | Número de contacto |
| Sitio Web | URL del sitio web |
| Dirección | Ubicación física |
| URL del Logo | Enlace al logo |
| Estado Activo | Activa/Inactiva |
| Estado Verificado | Verificada/No verificada |
| Plan | Básico, Premium, Enterprise |

**Estadísticas mostradas (solo lectura):**
- Total de productos
- Productos activos
- Total de pedidos
- Ingresos generados
- Usuarios asociados

### Estadísticas del Módulo
Tarjetas superiores:
- **Total**: Total de empresas registradas
- **Solicitudes**: Solicitudes pendientes de aprobación
- **Activas**: Empresas actualmente operativas
- **Suspendidas**: Empresas inactivas
- **Usuarios**: Total de usuarios del sistema

---

## Módulo de Usuarios

### Acceso
Ruta: `/admin/users`

### Descripción General
Administración completa de usuarios del sistema con asignación de roles y empresas.

### Lista de Usuarios
Muestra:
- Avatar y nombre
- Email
- Rol (Administrador, Empresa, Consultor, Cliente)
- Empresa asignada (si aplica)
- Estado (Activo/Inactivo)
- Verificación de email
- Fecha de registro

**Acciones disponibles:**
| Acción | Descripción |
|--------|-------------|
| ➕ Nuevo Usuario | Crear un nuevo usuario |
| 👁️ Ver detalle | Ver información completa |
| ✏️ Editar | Modificar datos del usuario |
| ✓ Activar/Desactivar | Cambiar estado del usuario |
| 🗑️ Eliminar | Desactivar o eliminar permanentemente |

### Crear/Editar Usuario
Ruta: `/admin/users/new` o `/admin/users/:id/edit`

**Campos del formulario:**
| Campo | Requerido | Descripción |
|-------|-----------|-------------|
| Email | ✓ | Email del usuario (único) |
| Nombre Completo | ✓ | Nombre del usuario |
| Teléfono | - | Número de contacto |
| Contraseña | ✓ (crear) | Mínimo 6 caracteres |
| Confirmar Contraseña | ✓ (crear) | Debe coincidir |
| Rol | ✓ | Admin, Empresa, Consultor, Cliente |
| Empresa | Si rol=Empresa | Empresa a asignar |
| Estado Activo | - | Activo/Inactivo |

**Roles disponibles:**
| Rol | Descripción |
|-----|-------------|
| Administrador | Acceso completo al panel de administración |
| Empresa | Acceso al panel de empresa para gestionar productos y pedidos |
| Consultor | Acceso de solo lectura a reportes y datos |
| Cliente | Usuario cliente con acceso a compras |

### Detalle de Usuario
Ruta: `/admin/users/:id`

**Información mostrada:**
- Datos personales
- Estado de la cuenta
- Rol asignado
- Empresa asignada (si aplica)
- Fecha de registro y última actualización

**Acciones rápidas:**
- Editar información
- Cambiar rol
- Asignar/remover de empresa
- Activar/desactivar
- Eliminar

### Asignación a Empresa
Para usuarios con rol "Empresa":
1. Ir al detalle del usuario
2. En la sección "Rol y Asignación"
3. Seleccionar la empresa del dropdown
4. El cambio se aplica automáticamente

---

## Módulo de Productos

### Acceso
Ruta: `/admin/products`

### Funcionalidades
- Lista de todos los productos del marketplace
- Crear, editar, activar/desactivar productos
- Gestión de variantes
- Gestión de inventario
- Asignación de categorías

---

## Módulo de Pedidos

### Acceso
Ruta: `/admin/orders`

### Funcionalidades
- Lista de todos los pedidos
- Filtrado por estado
- Detalle de pedido
- Cambio de estado
- Gestión de pagos

---

## Módulo de Reportes

### Acceso
Ruta: `/admin/reports`

### Métricas Disponibles
- Empresas activas
- Productos activos
- Pedidos totales y pendientes
- Ingresos totales
- Solicitudes pendientes
- Usuarios registrados
- Ingresos del mes

### Gráficos
- Ingresos por empresa (Top 5)
- Productos más vendidos (Top 5)
- Actividad reciente

---

## Flujos de Trabajo Comunes

### Aprobar una Nueva Empresa
1. Ir a **Empresas** → Pestaña **Solicitudes**
2. Filtrar por **Pendientes**
3. Click en 👁️ para ver detalles
4. Revisar información del solicitante
5. Click en **Aprobar** o **Rechazar**
6. Agregar notas (opcional)
7. Confirmar acción

### Crear un Usuario de Empresa
1. Ir a **Usuarios**
2. Click en **Nuevo Usuario**
3. Completar datos personales
4. Seleccionar rol **Empresa**
5. Seleccionar la empresa del dropdown
6. Click en **Crear Usuario**

### Suspender una Empresa
1. Ir a **Empresas**
2. Localizar la empresa
3. Click en el botón de **Suspender** (círculo con X)
4. Confirmar la acción

### Editar Datos de Empresa
1. Ir a **Empresas**
2. Click en ✏️ **Editar** de la empresa
3. Modificar los campos necesarios
4. Click en **Guardar Cambios**

---

## Permisos por Rol

### Matriz de Permisos

| Funcionalidad | Admin | Empresa | Consultor | Cliente |
|--------------|:-----:|:-------:|:---------:|:-------:|
| Ver Dashboard Global | ✓ | - | ✓ | - |
| Gestionar Empresas | ✓ | - | - | - |
| Aprobar Solicitudes | ✓ | - | - | - |
| Gestionar Usuarios | ✓ | - | - | - |
| Ver Todos los Productos | ✓ | - | Solo activos | Solo activos |
| Gestionar Productos Propios | ✓ | ✓ | - | - |
| Ver Todos los Pedidos | ✓ | - | - | - |
| Gestionar Pedidos Propios | ✓ | ✓ | - | - |
| Ver Reportes | ✓ | Propios | ✓ | - |
| Gestionar Categorías | ✓ | - | - | - |
| Editar Contenido | ✓ | - | - | - |

---

## Soporte

Para asistencia técnica o consultas sobre el sistema:
- Email: soporte@gabycosmetics.com
- Documentación técnica: `/docs`

---

*Última actualización: Febrero 2026*
