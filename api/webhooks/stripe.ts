import Stripe from 'stripe';
import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Configurar el signing secret del webhook desde Stripe Dashboard
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  const sig = req.headers['stripe-signature'];

  if (!sig || !webhookSecret) {
    console.error('❌ Falta firma de webhook o secret no configurado');
    return res.status(400).json({ error: 'Falta configuración de webhook' });
  }

  try {
    // Verificar la firma del webhook
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    console.log('📨 Evento Stripe recibido:', event.type);

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('✅ Pago exitoso:', paymentIntent.id);

        // Actualizar orden en Supabase
        const { orderId } = paymentIntent.metadata;

        if (orderId) {
          const { error } = await supabase
            .from('orders')
            .update({
              status: 'paid',
              payment_intent_id: paymentIntent.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (error) {
            console.error('❌ Error al actualizar orden:', error);
          } else {
            console.log('✅ Orden actualizada en BD:', orderId);
          }
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('❌ Pago fallido:', paymentIntent.id);

        const { orderId } = paymentIntent.metadata;

        if (orderId) {
          const { error } = await supabase
            .from('orders')
            .update({
              status: 'failed',
              payment_intent_id: paymentIntent.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', orderId);

          if (error) {
            console.error('❌ Error al actualizar orden:', error);
          }
        }

        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        console.log('💸 Pago reembolsado:', charge.id);

        // Buscar y actualizar la orden
        if (charge.payment_intent) {
          const paymentIntent = await stripe.paymentIntents.retrieve(
            charge.payment_intent.toString()
          );

          const { orderId } = paymentIntent.metadata;

          if (orderId) {
            const { error } = await supabase
              .from('orders')
              .update({
                status: 'refunded',
                updated_at: new Date().toISOString(),
              })
              .eq('id', orderId);

            if (error) {
              console.error('❌ Error al reembolsar orden:', error);
            }
          }
        }

        break;
      }

      default:
        console.log(`⚠️ Evento no manejado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error en webhook:', error);

    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Error en webhook',
    });
  }
}
