# Integración Stripe - Guía de Configuración

## 1. Obtener Claves de Stripe

1. Ve a [https://dashboard.stripe.com/](https://dashboard.stripe.com/)
2. Inicia sesión o crea una cuenta
3. Ve a **Developers** → **API Keys**
4. Copia:
   - **Publishable Key** (clave pública) - comienza con `pk_test_` o `pk_live_`
   - **Secret Key** (clave secreta) - comienza con `sk_test_` o `sk_live_`

## 2. Variables de Entorno Locales

Crea o actualiza `.env.local` en la raíz del proyecto:

```env
VITE_STRIPE_PUBLIC_KEY=pk_test_tu_clave_publica_aqui
```

## 3. Variables de Entorno en Vercel

1. Ve a tu proyecto en [https://vercel.com/](https://vercel.com/)
2. Haz clic en **Settings** → **Environment Variables**
3. Agrega:
   - **Name**: `VITE_STRIPE_PUBLIC_KEY`
   - **Value**: Tu clave pública de Stripe
   - **Environments**: Selecciona Production, Preview, Development

## 4. Backend - Crear Endpoint de Payment Intent

En un proyecto real, necesitarías un backend para crear Payment Intents de forma segura.

### Opción A: Con Vercel Functions (Recomendado)

Crea el archivo `api/create-payment-intent.ts` en tu proyecto Vercel:

```typescript
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, orderId } = req.body;

    if (!amount || !orderId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects cents
      currency: 'usd',
      metadata: {
        orderId,
      },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    console.error('Stripe error:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal server error',
    });
  }
}
```

### Opción B: Usar Stripe.js directamente (Para Testing)

Para pruebas locales, puedes usar `stripe.paymentIntents.create()` directamente desde el frontend,
pero esto NO es recomendado para producción.

## 5. Webhook para Confirmar Pagos

En producción, también necesitarías un webhook para:
- Confirmar cuando se completa el pago
- Crear la orden en tu base de datos
- Enviar confirmación por email

```typescript
// api/webhooks/stripe.ts
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  
  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      const orderId = paymentIntent.metadata.orderId;
      
      // Actualizar orden en base de datos
      console.log(`Pago confirmado para orden: ${orderId}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(400).json({ error: 'Webhook error' });
  }
}
```

## 6. Configurar Webhook en Stripe Dashboard

1. Ve a **Developers** → **Webhooks**
2. Haz clic en **Add an endpoint**
3. URL: `https://tu-dominio.com/api/webhooks/stripe`
4. Selecciona eventos: `payment_intent.succeeded`, `payment_intent.payment_failed`

## 7. Testing Local

Para testing local con webhooks:

```bash
# Instala Stripe CLI
# https://stripe.com/docs/stripe-cli

# Autentica
stripe login

# Escucha webhooks locales
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Obtén el signing secret y actualiza .env
```

## Flujo Completo

1. Usuario agrega productos al carrito
2. Usuario va a checkout
3. Usuario completa el formulario de envío
4. Frontend llama a `/api/create-payment-intent`
5. Backend crea Payment Intent en Stripe
6. Frontend recibe `clientSecret`
7. Usuario completa el formulario de tarjeta
8. Frontend confirma pago con Stripe
9. Si es exitoso, redirige a página de éxito
10. Webhook confirma pago y crea orden en BD

## Ambiente de Prueba

Usa estas tarjetas de prueba de Stripe:

- **Pago exitoso**: `4242 4242 4242 4242`
- **Pago rechazado**: `4000 0000 0000 0002`
- **Requiere autenticación**: `4000 0025 0000 3155`

Cualquier fecha futura y CVC funcionan.

## Próximos Pasos

1. ✅ Instalar librerías de Stripe (ya hecho)
2. ✅ Configurar PaymentForm con CardElement (ya hecho)
3. ⏳ Crear API endpoint para Payment Intent
4. ⏳ Agregar variables de entorno a Vercel
5. ⏳ Configurar webhook en Stripe
6. ⏳ Crear tabla de órdenes en Supabase
7. ⏳ Guardar órdenes después de pago exitoso
