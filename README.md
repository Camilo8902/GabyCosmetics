# 💄 Gaby Cosmetics - E-commerce Platform

Plataforma de e-commerce moderna construida con React, TypeScript, Vite y Supabase.

## 🚀 Características

- 🛍️ **Catálogo de Productos**: Sistema completo de productos con categorías jerárquicas
- 👤 **Autenticación**: Sistema de autenticación con múltiples roles (Admin, Company, Consultant, Customer)
- 🛒 **Carrito de Compras**: Carrito persistente con Zustand
- 🌐 **Internacionalización**: Soporte para Español e Inglés (i18next)
- 🎨 **UI Moderna**: Diseño moderno con Tailwind CSS y Radix UI
- 📱 **Responsive**: Diseño completamente responsive
- ⚡ **Performance**: Optimizado con Vite y React Query

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Radix UI + Framer Motion
- **Estado**: Zustand + React Query
- **Backend**: Supabase (Auth, Database, Storage)
- **Routing**: React Router v6
- **Formularios**: React Hook Form + Zod
- **i18n**: react-i18next

## 📦 Instalación

```bash
# Instalar dependencias
pnpm install

# Desarrollo
pnpm dev

# Build de producción
pnpm build

# Preview del build
pnpm preview
```

## ⚙️ Configuración

### Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anonima-real
```

### Base de Datos

1. Ejecuta el script SQL en Supabase: `supabase-schema.sql`
2. Ejecuta los triggers: `supabase-triggers.sql`

Ver la [guía de autenticación](./AUTHENTICATION_SETUP.md) para más detalles.

## 🚀 Despliegue

Este proyecto está configurado para desplegarse en **Vercel**.

### Despliegue en Vercel

1. Conecta tu repositorio a Vercel
2. Configura las variables de entorno
3. Vercel detectará automáticamente la configuración de Vite

Ver la [guía completa de despliegue](./VERCEL_DEPLOYMENT.md) para instrucciones detalladas.

## 📁 Estructura del Proyecto

```
src/
├── components/       # Componentes reutilizables
│   ├── common/      # Componentes comunes (CartDrawer, etc.)
│   ├── landing/     # Componentes de la página principal
│   └── layout/      # Componentes de layout (Header, Footer)
├── hooks/           # Custom hooks
├── i18n/            # Configuración de internacionalización
├── lib/             # Utilidades y configuraciones
│   ├── supabase.ts  # Cliente de Supabase
│   └── utils.ts     # Utilidades generales
├── pages/           # Páginas de la aplicación
│   ├── admin/       # Panel de administración
│   ├── auth/        # Páginas de autenticación
│   ├── company/     # Panel de empresas
│   ├── consultant/  # Panel de consultores
│   └── shop/        # Páginas de la tienda
├── store/           # Estado global (Zustand)
│   ├── authStore.ts # Estado de autenticación
│   └── cartStore.ts # Estado del carrito
└── types/           # Definiciones de TypeScript
```

## 🔐 Autenticación

El proyecto incluye un sistema completo de autenticación con:

- Registro de usuarios
- Inicio de sesión (Email/Password y OAuth)
- Múltiples roles: Admin, Company, Consultant, Customer
- Protección de rutas basada en roles
- Perfiles de usuario automáticos

Ver [AUTHENTICATION_SETUP.md](./AUTHENTICATION_SETUP.md) para la configuración completa.

## 📚 Documentación

- [Guía de Autenticación](./AUTHENTICATION_SETUP.md) - Configuración de autenticación
- [Guía de Despliegue en Vercel](./VERCEL_DEPLOYMENT.md) - Instrucciones de despliegue

## 🧪 Desarrollo

```bash
# Ejecutar en modo desarrollo
pnpm dev

# Linting
pnpm lint

# Build
pnpm build
```

## 📝 Scripts Disponibles

- `pnpm dev` - Inicia el servidor de desarrollo
- `pnpm build` - Construye para producción
- `pnpm preview` - Previsualiza el build de producción
- `pnpm lint` - Ejecuta ESLint

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto es privado.

## 🆘 Soporte

Para problemas o preguntas:
1. Revisa la documentación en los archivos `.md`
2. Verifica los logs en la consola del navegador
3. Revisa los logs en Vercel Dashboard (si está desplegado)

---

Desarrollado con ❤️ para Gaby Cosmetics
