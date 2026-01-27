# 🚀 Guía de Implementación - Producción con Stripe

## Estado Actual

✅ **Backend:**
- `api/create-payment-intent.ts` - Endpoint para crear Payment Intents
- `api/webhooks/stripe.ts` - Webhook para confirmar pagos

✅ **Frontend:**
- `PaymentForm.tsx` - Formulario con Stripe CardElement
- `CheckoutPage.tsx` - Flujo completo de checkout
- `PaymentSuccessPage.tsx` - Página de confirmación
- `src/lib/stripe.ts` - Utilidades de Stripe
- `src/lib/orders.ts` - Gestión de órdenes en Supabase

✅ **Base de Datos:**
- `supabase-orders-schema.sql` - Tabla `orders` con RLS y triggers

⏳ **Pendiente:**
- Ejecutar SQL en Supabase
- Instalar dependencias NPM
- Configurar variables de entorno en Vercel
- Establecer webhook en Stripe Dashboard

---

## Paso 1: Ejecutar SQL en Supabase

1. Ve a [https://supabase.com/](https://supabase.com/) y accede a tu proyecto
2. Ve a **SQL Editor**
3. Copia el contenido de `supabase-orders-schema.sql`
4. Pega y ejecuta el SQL
5. Verifica que se creó la tabla `orders` correctamente

**O ejecuta manualmente:**
```bash
# Si tienes Supabase CLI instalado:
supabase db push
```

---

## Paso 2: Instalar Dependencias

```bash
cd d:\GabyCosmetics
npm install
```

Esto instalará:
- `stripe` - SDK de Stripe para Node.js
- `@vercel/node` - Tipos para Vercel Functions

---

## Paso 3: Configurar Variables de Entorno Locales

Actualiza `.env.local` con tus claves de Stripe TEST:

```env
# Stripe (TEST KEYS)
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY_HERE

# Solo para backend (no incluir en frontend)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_WEBHOOK_SECRET_HERE

# Supabase
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY_HERE
```

---

## Paso 4: Configurar Vercel

### 4.1 Variables de Entorno en Vercel

1. Ve a tu proyecto en [https://vercel.com/](https://vercel.com/)
2. Haz clic en **Settings** → **Environment Variables**
3. Agrega estas variables:

**Production:**
```
VITE_STRIPE_PUBLIC_KEY = pk_live_YOUR_LIVE_KEY (o pk_test si usas test)
STRIPE_SECRET_KEY = sk_live_YOUR_LIVE_KEY (o sk_test si usas test)
STRIPE_WEBHOOK_SECRET = whsec_live_YOUR_SECRET (o whsec_test si usas test)
VITE_SUPABASE_URL = https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY = YOUR_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY = YOUR_SERVICE_ROLE_KEY
```

**Preview & Development:**
```
Mismo contenido que Production (o usa test keys para desarrollar)
```

---

## Paso 5: Obtener Claves de Stripe

### 5.1 Claves de Test (Recomendado para desarrollo)

1. Ve a [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
2. Inicia sesión
3. Ve a **Developers** → **API Keys**
4. Copia:
   - **Publishable Key** (pk_test_...)
   - **Secret Key** (sk_test_...)

### 5.2 Claves de Producción (Cuando estés listo)

1. Ve a **Developers** → **API Keys**
2. Cambia de **Test mode** a **Live mode**
3. Copia:
   - **Publishable Key** (pk_live_...)
   - **Secret Key** (sk_live_...)

---

## Paso 6: Configurar Webhook en Stripe

### 6.1 En Stripe Dashboard

1. Ve a **Developers** → **Webhooks**
2. Haz clic en **Add an endpoint**
3. **URL del endpoint:** `https://tu-dominio.com/api/webhooks/stripe`
4. **Selecciona eventos:**
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Haz clic en **Add endpoint**
6. Copia el **Signing secret** (whsec_...)
7. Agrega a tu variable `STRIPE_WEBHOOK_SECRET` en Vercel

### 6.2 Para Testing Local

Usa Stripe CLI:

```bash
# Instala Stripe CLI (desde https://stripe.com/docs/stripe-cli)

# En una terminal, autentica:
stripe login

# En otra terminal, escucha webhooks:
stripe listen --forward-to localhost:5173/api/webhooks/stripe

# Obtén el signing secret y actualiza .env.local
STRIPE_WEBHOOK_SECRET=whsec_test_...
```

---

## Paso 7: Ejecutar Localmente

```bash
npm run dev
```

El sitio estará en `http://localhost:5173`

### 7.1 Probar Checkout Completo

1. Ve a `/shop`
2. Agrega un producto al carrito
3. Haz clic en **Checkout**
4. Completa formulario de envío
5. En el formulario de pago, usa una tarjeta de prueba:

**Tarjeta de test exitosa:**
```
Número: 4242 4242 4242 4242
Vencimiento: Cualquier fecha futura (ej: 12/25)
CVC: Cualquier 3 dígitos (ej: 123)
```

**Tarjeta de test rechazada:**
```
Número: 4000 0000 0000 0002
```

6. Deberías ver la página de éxito con los datos de tu orden

---

## Paso 8: Desplegar a Producción

```bash
git add .
git commit -m "Integración completa de Stripe"
git push origin main
```

Vercel desplegará automáticamente.

### 8.1 Verificar Deployment

1. Ve a tu proyecto en Vercel
2. Espera a que el build se complete
3. Haz clic en el URL para visitar el sitio
4. Prueba el checkout en tu dominio en vivo

---

## Flujo Completo de Pago

```
1. Usuario agrega productos al carrito
   └─> Productos almacenados en Zustand (cartStore)

2. Usuario va a /checkout
   └─> CheckoutPage renderiza ShippingForm

3. Usuario completa dirección de envío
   └─> CheckoutPage crea orden en Supabase (status: pending)
   └─> Llama a /api/create-payment-intent
   └─> Backend crea PaymentIntent en Stripe
   └─> Retorna clientSecret al frontend

4. CheckoutPage renderiza PaymentForm con clientSecret
   └─> Usuario completa tarjeta con CardElement

5. Usuario hace clic en "Pagar"
   └─> PaymentForm llama stripe.confirmCardPayment()
   └─> Stripe procesa el pago

6. Si es exitoso:
   └─> PaymentForm actualiza orden a status: paid
   └─> Redirige a /checkout/success?order_id=XXX&status=success

7. PaymentSuccessPage carga datos de orden desde Supabase
   └─> Muestra detalles completos de la orden
   └─> Muestra mensaje de confirmación

8. Webhook stripe.payment_intent.succeeded
   └─> Backend actualiza orden a status: paid (respaldo)
   └─> Guarda payment_intent_id
   └─> Puede enviar email de confirmación
```

---

## Estructura de Archivos Nuevos

```
d:\GabyCosmetics\
├── api/
│   ├── create-payment-intent.ts    ✅ Crear Payment Intent
│   └── webhooks/
│       └── stripe.ts                ✅ Webhook de Stripe
├── src/
│   ├── lib/
│   │   ├── stripe.ts               ✅ Utilidades Stripe
│   │   └── orders.ts               ✅ Gestión de órdenes
│   ├── pages/
│   │   └── shop/
│   │       ├── CheckoutPage.tsx    ✅ Actualizado
│   │       └── PaymentSuccessPage.tsx ✅ Nuevo
│   └── components/
│       └── checkout/
│           ├── PaymentForm.tsx     ✅ Actualizado
│           └── ShippingForm.tsx    (existente)
├── supabase-orders-schema.sql      ✅ Schema SQL
├── package.json                     ✅ Actualizado
└── .env.local                      ⏳ A configurar
```

---

## Checklist de Deployment

- [ ] SQL ejecutado en Supabase
- [ ] `npm install` completado
- [ ] Variables de entorno configuradas en `.env.local`
- [ ] Variables de entorno en Vercel
- [ ] Webhook configurado en Stripe
- [ ] Pruebas locales completadas
- [ ] Push a GitHub/Git
- [ ] Vercel deployment completado
- [ ] Prueba de checkout en producción
- [ ] Email de confirmación (opcional)

---

## Tarjetas de Test en Stripe

### Exitosas:
- `4242 4242 4242 4242` - Pago exitoso
- `4000 0027 6000 3184` - 3D Secure requerido
- `378282246310005` - American Express

### Rechazadas:
- `4000 0000 0000 0002` - Tarjeta rechazada
- `4000 0000 0000 9995` - Fondos insuficientes
- `4000 0000 0000 9987` - Tarjeta perdida

### Especiales:
- `4000 0025 0000 3155` - Autenticación requerida
- `5555 5555 5555 4444` - Mastercard
- `3782 822463 10005` - American Express

Fecha: Cualquier futura (ej: 12/25)
CVC: Cualquier 3 dígitos (ej: 123)

---

## Solución de Problemas

### Error: "stripe is not defined"
```
✅ Verifica que instalaste: npm install stripe
✅ Verifica que STRIPE_SECRET_KEY está en variables de entorno
```

### Error: "VITE_STRIPE_PUBLIC_KEY is empty"
```
✅ Verifica que .env.local tiene VITE_STRIPE_PUBLIC_KEY
✅ Verifica que la variable está en Vercel (si haces deploy)
```

### Error: "Payment intent not found"
```
✅ Verifica que STRIPE_SECRET_KEY es correcto
✅ Usa test key si estás en desarrollo
```

### Error: "Supabase connection failed"
```
✅ Verifica VITE_SUPABASE_URL y claves
✅ Verifica que la tabla 'orders' existe
✅ Verifica que RLS policies están habilitadas
```

### Webhook no funciona
```
✅ Verifica que URL es correctamente configurada en Stripe
✅ Verifica que STRIPE_WEBHOOK_SECRET es correcto
✅ Revisa logs en Stripe Dashboard → Webhooks
```

---

## Siguientes Pasos (Fase 2)

- [ ] Email de confirmación automático
- [ ] Tracking de órdenes para usuarios
- [ ] Reembolsos y devoluciones
- [ ] Integración con servicio de envío
- [ ] Descuentos y cupones
- [ ] Carrito guardado
- [ ] Múltiples métodos de pago

---

## Contacto & Soporte

Si encuentras problemas:
1. Revisa los logs en Vercel: Settings → Function Logs
2. Revisa los logs en Stripe Dashboard: Developers → Webhooks
3. Revisa la consola del navegador (F12) para errores frontend
4. Revisa los logs en Supabase: Settings → Logs

---

**Fecha de Creación:** 27 de Enero, 2026  
**Estado:** ✅ Listo para Producción
