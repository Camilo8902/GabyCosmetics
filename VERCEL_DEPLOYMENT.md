# 🚀 Guía de Despliegue en Vercel - Gaby Cosmetics

Esta guía te ayudará a desplegar tu aplicación Gaby Cosmetics en Vercel.

## 📋 Prerrequisitos

1. Una cuenta en [Vercel](https://vercel.com)
2. Tu proyecto en un repositorio Git (GitHub, GitLab, o Bitbucket)
3. Variables de entorno de Supabase configuradas

## 🔧 Configuración Inicial

### Opción 1: Despliegue desde el Dashboard de Vercel

1. **Conecta tu repositorio:**
   - Ve a [Vercel Dashboard](https://vercel.com/dashboard)
   - Haz clic en **Add New** → **Project**
   - Conecta tu repositorio de Git
   - Selecciona el repositorio de Gaby Cosmetics

2. **Configura el proyecto:**
   - **Framework Preset**: Vite (debería detectarse automáticamente)
   - **Root Directory**: `./` (raíz del proyecto)
   - **Build Command**: `pnpm run build` (o `npm run build`)
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install` (o `npm install`)

3. **Configura las Variables de Entorno:**
   - Haz clic en **Environment Variables**
   - Agrega las siguientes variables:
     ```
     VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
     VITE_SUPABASE_ANON_KEY=tu-clave-anonima-real
     ```
   - Selecciona los ambientes: **Production**, **Preview**, y **Development**

4. **Despliega:**
   - Haz clic en **Deploy**
   - Vercel comenzará a construir y desplegar tu aplicación

### Opción 2: Despliegue desde la CLI

1. **Instala Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Inicia sesión:**
   ```bash
   vercel login
   ```

3. **Despliega:**
   ```bash
   vercel
   ```
   
   Sigue las instrucciones:
   - ¿Quieres modificar los ajustes? → **No** (si es la primera vez, puede que quieras revisar)
   - Se creará el proyecto automáticamente

4. **Despliegue de producción:**
   ```bash
   vercel --prod
   ```

## ⚙️ Configuración del Proyecto

El archivo `vercel.json` ya está configurado con:
- ✅ Comando de build: `pnpm run build`
- ✅ Directorio de salida: `dist`
- ✅ Rewrites para SPA (Single Page Application)
- ✅ Headers de seguridad
- ✅ Cache para assets estáticos

### Personalización

Si necesitas modificar la configuración, edita `vercel.json`:

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## 🔐 Variables de Entorno

### Variables Requeridas

Asegúrate de configurar estas variables en Vercel:

| Variable | Descripción | Ejemplo |
|----------|-------------|---------|
| `VITE_SUPABASE_URL` | URL de tu proyecto Supabase | `https://xxxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Clave anónima de Supabase | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

### Cómo Agregar Variables de Entorno

1. Ve a tu proyecto en Vercel Dashboard
2. Navega a **Settings** → **Environment Variables**
3. Haz clic en **Add New**
4. Ingresa el nombre y valor de la variable
5. Selecciona los ambientes donde aplicará:
   - ✅ Production
   - ✅ Preview
   - ✅ Development
6. Haz clic en **Save**

### Importante

- Después de agregar o modificar variables de entorno, necesitas **redesplegar** el proyecto
- Ve a **Deployments** → Selecciona el último deployment → **Redeploy**

## 🌐 Configuración de Dominio

### Dominio por Defecto

Vercel asigna automáticamente un dominio:
- `tu-proyecto.vercel.app`

### Dominio Personalizado

1. Ve a **Settings** → **Domains**
2. Agrega tu dominio personalizado
3. Sigue las instrucciones para configurar los DNS

### Actualizar URLs en Supabase

Después de obtener tu dominio de Vercel, actualiza las URLs en Supabase:

1. Ve a Supabase Dashboard → **Authentication** → **URL Configuration**
2. Actualiza **Site URL**: `https://tu-dominio.vercel.app`
3. Agrega a **Redirect URLs**:
   - `https://tu-dominio.vercel.app/auth/callback`
   - `https://tu-dominio.vercel.app/**`

## 🔄 Despliegues Automáticos

Vercel despliega automáticamente cuando:
- Haces push a la rama principal (producción)
- Haces push a otras ramas (preview)
- Abres un Pull Request (preview)

### Configuración de Ramas

1. Ve a **Settings** → **Git**
2. Configura:
   - **Production Branch**: `main` o `master`
   - **Preview Branches**: Todas las demás

## 📊 Monitoreo y Logs

### Ver Logs de Build

1. Ve a **Deployments**
2. Haz clic en un deployment
3. Revisa los logs de build y runtime

### Analytics

Vercel ofrece analytics básicos:
- Ve a **Analytics** en el dashboard
- Revisa métricas de rendimiento

## 🐛 Solución de Problemas

### Error: Build Failed

1. **Revisa los logs:**
   - Ve a **Deployments** → Selecciona el deployment fallido
   - Revisa los logs de build

2. **Problemas comunes:**
   - Variables de entorno faltantes
   - Errores de TypeScript
   - Dependencias no instaladas

3. **Solución:**
   ```bash
   # Prueba localmente primero
   pnpm install
   pnpm run build
   ```

### Error: Variables de Entorno no Encontradas

1. Verifica que las variables estén configuradas en Vercel
2. Asegúrate de haber seleccionado los ambientes correctos
3. Redesplega el proyecto después de agregar variables

### Error: 404 en Rutas

Si las rutas de tu SPA devuelven 404:
- Verifica que `vercel.json` tenga el rewrite configurado
- Asegúrate de que todas las rutas redirijan a `/index.html`

### Error: Assets no se Cargan

1. Verifica que el `outputDirectory` sea `dist`
2. Revisa que los assets estén en la carpeta `public`
3. Verifica las rutas en el código (deben ser relativas)

## 📝 Comandos Útiles

```bash
# Desplegar a preview
vercel

# Desplegar a producción
vercel --prod

# Ver información del proyecto
vercel inspect

# Ver logs en tiempo real
vercel logs

# Eliminar un deployment
vercel rm <deployment-url>
```

## 🔒 Seguridad

### Headers de Seguridad

El archivo `vercel.json` ya incluye headers de seguridad:
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Variables Sensibles

- ❌ **NUNCA** commitees variables de entorno al repositorio
- ✅ Usa siempre las variables de entorno de Vercel
- ✅ Usa diferentes valores para desarrollo y producción

## 📚 Recursos Adicionales

- [Documentación de Vercel](https://vercel.com/docs)
- [Guía de Vite en Vercel](https://vercel.com/guides/deploying-vite-with-vercel)
- [Variables de Entorno en Vercel](https://vercel.com/docs/concepts/projects/environment-variables)

## ✅ Checklist de Despliegue

Antes de considerar el despliegue completo, verifica:

- [ ] Variables de entorno configuradas en Vercel
- [ ] URLs de Supabase actualizadas con el dominio de Vercel
- [ ] Build exitoso localmente (`pnpm run build`)
- [ ] Todas las rutas funcionan correctamente
- [ ] Autenticación funciona (registro e inicio de sesión)
- [ ] Assets se cargan correctamente
- [ ] Dominio personalizado configurado (si aplica)

---

¿Necesitas ayuda? Revisa los logs en Vercel Dashboard o consulta la [documentación oficial](https://vercel.com/docs).
