# ⚡ Quick Start - Stripe Integration

## 🚀 Setup en 5 Minutos

### 1️⃣ Ejecutar SQL (2 min)
```
Ve a Supabase → SQL Editor → Pega supabase-orders-schema.sql → Ejecuta
```

### 2️⃣ Instalar Dependencias (1 min)
```bash
npm install
```

### 3️⃣ Variables de Entorno (1 min)

Actualiza `.env.local`:
```env
VITE_STRIPE_PUBLIC_KEY=pk_test_YOUR_KEY
STRIPE_SECRET_KEY=sk_test_YOUR_KEY
STRIPE_WEBHOOK_SECRET=whsec_test_YOUR_KEY
```

Obten las claves de: https://dashboard.stripe.com/apikeys

### 4️⃣ Configurar Webhook (1 min)

En Stripe Dashboard:
1. Developers → Webhooks
2. Add endpoint: `https://tu-dominio.com/api/webhooks/stripe`
3. Selecciona: payment_intent.succeeded, payment_intent.payment_failed
4. Copia el signing secret a STRIPE_WEBHOOK_SECRET

---

## 🧪 Testing Local

```bash
npm run dev
```

1. Ve a http://localhost:5173
2. Agrega producto al carrito
3. Checkout → Completa envío
4. Tarjeta test: **4242 4242 4242 4242**
5. Mes/Año: Cualquier futuro (12/25)
6. CVC: Cualquier 3 dígitos (123)
7. ¡Debe funcionar! ✅

---

## 📦 Deployment

```bash
git add .
git commit -m "Add Stripe integration"
git push origin main
```

Vercel se despliega automáticamente.

Agrega variables de entorno en Vercel Settings.

---

## 📚 Documentación Completa

- **`STRIPE_PRODUCTION_SETUP.md`** - Guía detallada paso a paso
- **`STRIPE_IMPLEMENTATION_SUMMARY.md`** - Resumen técnico
- **`STRIPE_SETUP.md`** - Conceptos básicos

---

## ✅ Archivos Nuevos

```
✅ api/create-payment-intent.ts       - Backend endpoint
✅ api/webhooks/stripe.ts              - Webhook handler
✅ src/lib/stripe.ts                   - Stripe utilities
✅ src/lib/orders.ts                   - Order management
✅ src/pages/shop/PaymentSuccessPage.tsx - Success page
✅ supabase-orders-schema.sql          - Database schema
```

---

## 🔄 Cambios a Archivos Existentes

```
✅ src/App.tsx                         - Import PaymentSuccessPage
✅ src/components/checkout/PaymentForm.tsx - Stripe integration
✅ src/pages/shop/CheckoutPage.tsx    - Order creation + payment
✅ package.json                        - Add stripe dependency
```

---

## 🎯 Flujo Rápido

```
User → Cart → Checkout → Shipping Form → Payment Form → Success Page
        ↓         ↓            ↓               ↓             ↓
      Zustand   Redirect   Save Order   Stripe Elements  Load Order
```

---

## 📞 Problemas Comunes

| Problema | Solución |
|----------|----------|
| `stripe is not defined` | Ejecuta `npm install stripe` |
| `VITE_STRIPE_PUBLIC_KEY is empty` | Agrega a `.env.local` |
| Webhook no funciona | Verifica URL en Stripe Dashboard |
| Orden no se guarda | Verifica tabla `orders` en Supabase |

---

## 🔐 Tarjetas de Test

**Exitosa:**
```
4242 4242 4242 4242 | 12/25 | 123
```

**Rechazada:**
```
4000 0000 0000 0002 | 12/25 | 123
```

Más: https://stripe.com/docs/testing

---

**¡Listo para Producción! 🚀**

Ver documentación completa en `STRIPE_PRODUCTION_SETUP.md`
