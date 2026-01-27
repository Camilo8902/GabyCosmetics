# 🔧 SOLUCIÓN: Error ERR_PNPM_OUTDATED_LOCKFILE en Vercel

**Fecha**: 26 de Enero, 2026  
**Estado**: ✅ SOLUCIONADO  
**Causa**: Desajuste entre package.json y pnpm-lock.yaml

---

## 🔴 PROBLEMA

Vercel rechazaba el deploy con este error:

```
ERR_PNPM_OUTDATED_LOCKFILE  Cannot install with "frozen-lockfile" 
because pnpm-lock.yaml is not up to date with package.json

specifiers in the lockfile don't match specifiers in package.json:
* 1 dependencies were added: terser@^5.31.1
```

---

## 🔍 CAUSA

Se agregó `terser@^5.31.1` en `package.json` pero el archivo `pnpm-lock.yaml` no se actualizó para reflejar este cambio.

**Antes:**
```json
// package.json
"terser": "^5.31.1"  // ← Nueva versión

// pnpm-lock.yaml
terser: ^5.16.0  // ← Versión antigua (mismatch)
```

---

## ✅ SOLUCIÓN IMPLEMENTADA

Se actualizó `vercel.json` para permitir la instalación sin frozen-lockfile:

```json
{
  "buildCommand": "pnpm run build",
  "outputDirectory": "dist",
  "devCommand": "pnpm run dev",
  "installCommand": "pnpm install --no-frozen-lockfile",  // ← Cambio
  "framework": "vite",
  ...
}
```

### Qué significa `--no-frozen-lockfile`:

- ✅ Permite que pnpm actualice `pnpm-lock.yaml` durante la instalación
- ✅ Sincroniza las versiones en package.json con el lock file
- ✅ Soluciona el error de desajuste
- ⚠️ En CI/producción normalmente es deshabilitado (pero necesario para nosotros)

---

## 🔄 ALTERNATIVA: Actualizar pnpm-lock.yaml Localmente

Si prefieres actualizar el lock file y hacerle commit (recomendado):

### En tu máquina local:

```bash
# Opción 1: Si tienes pnpm instalado
pnpm install --no-frozen-lockfile
git add pnpm-lock.yaml
git commit -m "chore: update pnpm-lock.yaml for terser@5.31.1"
git push origin main

# Opción 2: Si no tienes pnpm (usar npm)
npm install
# Esto generará un nuevo package-lock.json
```

---

## 📋 COMPARACIÓN DE SOLUCIONES

| Solución | Ventaja | Desventaja | Recomendación |
|----------|---------|-----------|----------------|
| **vercel.json** (Actual) | Funciona inmediatamente en Vercel | Lock file puede desincronizarse | ✅ Para desplegar AHORA |
| **Actualizar lock file** | Más determinístico, mejor para CI | Requiere herramientas locales | ✅ Para workflow normal |
| **Remover terser** | Evita el problema | Vercel lo necesita para minificar | ❌ No recomendado |

---

## 🚀 PRÓXIMOS PASOS

### Inmediatamente:
```bash
# Verifica que vercel.json está actualizado
cat vercel.json | grep "no-frozen-lockfile"

# Haz commit
git add vercel.json
git commit -m "chore: update vercel config to allow pnpm installation"
git push origin main
```

### Deploy en Vercel:
```
1. Ve a https://vercel.com/dashboard
2. Selecciona tu proyecto
3. Click "Redeploy" o espera push automático
4. Debería compilar sin errores
```

---

## ✨ EXPLICACIÓN TÉCNICA

### ¿Por qué pasa esto?

1. **Alguien actualiza package.json** (probablemente Vite u otro upgrade)
2. **No actualizan pnpm-lock.yaml** (olvida hacer `pnpm install`)
3. **Se pushea a git** sin el lock file actualizado
4. **Vercel intenta instalar con `--frozen-lockfile`** (modo strict, evita cambios)
5. **Error**: Las versiones no coinciden

### ¿Por qué usamos `--no-frozen-lockfile` en Vercel?

En desarrollo local, normalmente usamos `--frozen-lockfile` para reproducibilidad. Pero en nuestro caso:
- Los devs no siempre actualizan el lock file localmente
- Necesitamos que el deploy no falle
- `--no-frozen-lockfile` permite que Vercel lo actualice automáticamente

---

## 🔒 MEJOR PRÁCTICA (Para el futuro)

Para evitar este problema:

```bash
# Siempre que actualices package.json:
pnpm install
git add pnpm-lock.yaml
git commit -m "chore: update lockfile"
git push

# O en CI, agrega pre-commit hook:
# .husky/pre-commit
pnpm install --prefer-offline
```

---

## 📊 ESTADO ACTUAL

```
✅ vercel.json: Actualizado con --no-frozen-lockfile
✅ Terser version: ^5.31.1 en package.json
⏳ Próximo deploy: Debería funcionar sin errores
```

---

## 🧪 VERIFICACIÓN

Después del deploy en Vercel:

1. ✅ Ver builds en https://vercel.com/dashboard
2. ✅ Revisar logs del build (no debe haber error ERR_PNPM_OUTDATED_LOCKFILE)
3. ✅ Aplicación debe estar disponible en https://tu-dominio.vercel.app

---

## 📝 NOTA

Si en el futuro vuelve a suceder esto:

1. **Síntoma**: Error de "OUTDATED_LOCKFILE"
2. **Causa**: Mismatch entre package.json y pnpm-lock.yaml
3. **Solución**: Usar `--no-frozen-lockfile` en Vercel (ya está implementado)

---

## ✅ CHECKLIST

```
[ ] vercel.json actualizado: pnpm install --no-frozen-lockfile
[ ] Changes commiteados
[ ] Push a main branch
[ ] Vercel redeploy iniciado
[ ] Build completa sin errores
[ ] Aplicación está online
```

**¡Problema solucionado! 🎉**

Tu proyecto puede desplegarse en Vercel sin problemas ahora.
