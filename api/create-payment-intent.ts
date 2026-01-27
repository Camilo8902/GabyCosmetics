import Stripe from 'stripe';
import { VercelRequest, VercelResponse } from '@vercel/node';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20',
});

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { amount, orderId, email, metadata } = req.body;

    // Validar campos requeridos
    if (!amount || !orderId) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: amount, orderId',
      });
    }

    // Validar que amount sea un número válido
    if (typeof amount !== 'number' || amount <= 0) {
      return res.status(400).json({
        error: 'amount debe ser un número mayor a 0',
      });
    }

    // Crear Payment Intent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convertir a centavos
      currency: 'usd',
      metadata: {
        orderId,
        ...(metadata || {}),
      },
      receipt_email: email,
      // automatic_payment_methods solo funciona con confirmación desde el frontend
      // Nos dejaremos esto para el frontend confirme con CardElement
    });

    console.log('✅ Payment Intent creado:', {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      orderId,
    });

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('❌ Error al crear Payment Intent:', error);

    if (error instanceof Stripe.errors.StripeError) {
      return res.status(error.statusCode || 500).json({
        error: error.message,
        type: error.type,
      });
    }

    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Error interno del servidor',
    });
  }
}
