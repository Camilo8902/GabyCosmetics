# 🔧 Configuración de Variables de Entorno en Vercel

## ⚠️ Problema Común

Si ves este error en la consola:
```
❌ Supabase configuration error:
VITE_SUPABASE_URL: NOT SET
VITE_SUPABASE_ANON_KEY: SET (but may be invalid)
```

Significa que las variables de entorno no están configuradas correctamente en Vercel.

## ✅ Solución Paso a Paso

### Paso 1: Obtener las Credenciales de Supabase

1. Ve a tu proyecto en [Supabase Dashboard](https://app.supabase.com)
2. Navega a **Settings** → **API**
3. Copia los siguientes valores:
   - **Project URL** → Esta será tu `VITE_SUPABASE_URL`
   - **anon/public key** → Esta será tu `VITE_SUPABASE_ANON_KEY`

### Paso 2: Configurar Variables en Vercel

#### Opción A: Desde el Dashboard Web

1. **Ve a tu proyecto en Vercel:**
   - Abre [Vercel Dashboard](https://vercel.com/dashboard)
   - Selecciona tu proyecto **Gaby Cosmetics**

2. **Navega a Environment Variables:**
   - Haz clic en **Settings** (en el menú superior)
   - En el menú lateral, haz clic en **Environment Variables**

3. **Agrega la primera variable:**
   - Haz clic en **Add New**
   - **Key**: `VITE_SUPABASE_URL`
   - **Value**: Pega tu Project URL de Supabase (ej: `https://xxxxx.supabase.co`)
   - **Environment**: Selecciona las tres opciones:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Haz clic en **Save**

4. **Agrega la segunda variable:**
   - Haz clic en **Add New** nuevamente
   - **Key**: `VITE_SUPABASE_ANON_KEY`
   - **Value**: Pega tu anon/public key de Supabase
   - **Environment**: Selecciona las tres opciones:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
   - Haz clic en **Save**

#### Opción B: Desde la CLI

```bash
# Instalar Vercel CLI si no lo tienes
npm i -g vercel

# Agregar variables de entorno
vercel env add VITE_SUPABASE_URL
# Cuando te pregunte, pega tu URL de Supabase
# Selecciona: Production, Preview, Development

vercel env add VITE_SUPABASE_ANON_KEY
# Cuando te pregunte, pega tu anon key de Supabase
# Selecciona: Production, Preview, Development
```

### Paso 3: Redesplegar el Proyecto

**⚠️ IMPORTANTE**: Después de agregar o modificar variables de entorno, debes redesplegar el proyecto.

#### Opción A: Desde el Dashboard

1. Ve a **Deployments** en el menú superior
2. Encuentra el último deployment
3. Haz clic en los **tres puntos** (⋯) a la derecha
4. Selecciona **Redeploy**
5. Confirma el redespliegue

#### Opción B: Desde la CLI

```bash
vercel --prod
```

#### Opción C: Hacer un nuevo commit

```bash
git commit --allow-empty -m "Trigger redeploy"
git push
```

### Paso 4: Verificar que Funciona

1. Espera a que el deployment termine
2. Abre tu sitio en Vercel
3. Abre la consola del navegador (F12)
4. Deberías ver:
   - ✅ No más errores de "Supabase configuration error"
   - ✅ La aplicación carga correctamente

## 🔍 Verificar Configuración Actual

### Ver Variables Configuradas en Vercel

1. Ve a **Settings** → **Environment Variables**
2. Deberías ver ambas variables listadas:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

### Verificar en el Código

Abre la consola del navegador y busca:
- ❌ Si ves errores de configuración → Las variables no están configuradas
- ✅ Si no ves errores → Las variables están configuradas correctamente

## 🐛 Solución de Problemas

### Problema: "VITE_SUPABASE_URL: NOT SET"

**Causa**: La variable no está configurada o no se redesplegó después de agregarla.

**Solución**:
1. Verifica que la variable esté en Vercel Dashboard → Settings → Environment Variables
2. Asegúrate de haber seleccionado **Production**, **Preview** y **Development**
3. **Redesplega el proyecto** (esto es crucial)

### Problema: "VITE_SUPABASE_ANON_KEY: SET (but may be invalid)"

**Causa**: La variable está configurada pero puede tener un valor incorrecto.

**Solución**:
1. Verifica que el valor sea correcto en Supabase Dashboard → Settings → API
2. Copia el valor exacto (sin espacios al inicio o final)
3. Actualiza la variable en Vercel
4. Redesplega

### Problema: Variables configuradas pero no funcionan

**Causa**: El proyecto no se redesplegó después de agregar las variables.

**Solución**:
1. **Redesplega el proyecto** (más importante)
2. Espera a que termine el build
3. Verifica en la consola del navegador

### Problema: Funciona en local pero no en Vercel

**Causa**: Las variables están en `.env.local` pero no en Vercel.

**Solución**:
1. Asegúrate de agregar las variables en Vercel (no solo en `.env.local`)
2. Las variables de `.env.local` solo funcionan en desarrollo local
3. Vercel necesita sus propias variables de entorno

## 📝 Checklist

Antes de considerar que está configurado:

- [ ] Variables agregadas en Vercel Dashboard
- [ ] Ambas variables seleccionadas para Production, Preview y Development
- [ ] Proyecto redesplegado después de agregar variables
- [ ] No hay errores en la consola del navegador
- [ ] La aplicación carga correctamente

## 💡 Tips

1. **Siempre redesplega** después de agregar/modificar variables de entorno
2. **Verifica los valores** copiando exactamente desde Supabase (sin espacios)
3. **Usa el mismo valor** para Production, Preview y Development (a menos que tengas diferentes proyectos)
4. **No commitees** las variables de entorno al repositorio (ya están en `.gitignore`)

## 🔐 Seguridad

- ✅ Las variables de entorno en Vercel están encriptadas
- ✅ Solo son accesibles durante el build y runtime
- ✅ No se exponen en el código fuente
- ❌ No las compartas públicamente
- ❌ No las commitees al repositorio

---

¿Aún tienes problemas? Verifica que:
1. Las variables estén exactamente como se muestran arriba (con `VITE_` al inicio)
2. Hayas redesplegado el proyecto después de agregarlas
3. Los valores sean correctos (copia desde Supabase Dashboard)
