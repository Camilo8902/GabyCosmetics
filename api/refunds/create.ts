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

/**
 * POST /api/refunds/create
 * 
 * Crea un reembolso para una orden.
 * 
 * Body:
 * - orderId: ID de la orden
 * - amount: Monto a reembolsar (opcional, si no se especifica es reembolso total)
 * - reason: Razón del reembolso
 * - reasonDescription: Descripción detallada
 * - refundCommission: Si se debe reembolsar también la comisión (default: true)
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { 
      orderId, 
      amount, 
      reason = 'requested_by_customer',
      reasonDescription,
      refundCommission = true 
    } = req.body;

    // Validar campos requeridos
    if (!orderId) {
      return res.status(400).json({ error: 'orderId es requerido' });
    }

    console.log('💸 [Refunds] Creating refund for order:', orderId);

    // Obtener la orden de la base de datos
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError || !order) {
      return res.status(404).json({ error: 'Orden no encontrada' });
    }

    // Verificar que la orden tiene un payment_intent
    if (!order.payment_intent_id) {
      return res.status(400).json({ 
        error: 'La orden no tiene un payment intent asociado' 
      });
    }

    // Verificar que la orden está pagada
    if (order.status !== 'paid') {
      return res.status(400).json({ 
        error: 'La orden no está en estado pagado',
        status: order.status 
      });
    }

    // Determinar el monto a reembolsar
    const refundAmount = amount || order.total;
    const isFullRefund = refundAmount === order.total;

    console.log('💰 [Refunds] Refund amount:', refundAmount, 'Full:', isFullRefund);

    // Obtener el Payment Intent de Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(order.payment_intent_id);

    // Crear el reembolso en Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.payment_intent_id,
      amount: Math.round(refundAmount * 100), // Convertir a centavos
      reason: reason as Stripe.Refunds.RefundCreateParams.Reason,
      metadata: {
        order_id: orderId,
        refund_commission: refundCommission.toString(),
        reason_description: reasonDescription || '',
      },
    });

    console.log('✅ [Refunds] Stripe refund created:', refund.id);

    // Si hay transferencias a vendedores, crear reembolsos de transferencia
    if (refundCommission && order.is_multi_vendor) {
      await handleTransferReversals(orderId, refundAmount, order.total);
    }

    // Guardar el reembolso en la base de datos
    const { data: savedRefund, error: saveError } = await supabase
      .from('refunds')
      .insert({
        order_id: orderId,
        company_id: order.company_id,
        user_id: order.user_id,
        stripe_refund_id: refund.id,
        stripe_charge_id: paymentIntent.latest_charge as string,
        amount: refundAmount,
        currency: 'USD',
        refund_type: isFullRefund ? 'full' : 'partial',
        reason: reason,
        reason_description: reasonDescription,
        status: refund.status === 'succeeded' ? 'succeeded' : 'processing',
        refund_commission: refundCommission,
        processed_at: refund.status === 'succeeded' ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (saveError) {
      console.error('⚠️ [Refunds] Error saving refund to DB:', saveError);
    }

    // Actualizar el estado de la orden
    const newOrderStatus = isFullRefund ? 'refunded' : 'partially_refunded';
    await supabase
      .from('orders')
      .update({
        status: newOrderStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return res.status(200).json({
      success: true,
      refund: {
        id: refund.id,
        amount: refundAmount,
        status: refund.status,
        type: isFullRefund ? 'full' : 'partial',
      },
      order: {
        id: orderId,
        status: newOrderStatus,
      },
    });
  } catch (error) {
    console.error('❌ [Refunds] Error:', error);

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

/**
 * Maneja las reversiones de transferencias para multi-vendedor
 */
async function handleTransferReversals(
  orderId: string,
  refundAmount: number,
  orderTotal: number
) {
  try {
    // Obtener las transferencias de esta orden
    const { data: transfers } = await supabase
      .from('payment_transfers')
      .select('*')
      .eq('order_id', orderId)
      .eq('status', 'completed');

    if (!transfers || transfers.length === 0) {
      console.log('ℹ️ [Refunds] No transfers to reverse');
      return;
    }

    // Calcular la proporción del reembolso
    const refundRatio = refundAmount / orderTotal;

    // Revertir cada transferencia proporcionalmente
    for (const transfer of transfers) {
      const reversalAmount = transfer.amount * refundRatio;

      if (reversalAmount > 0 && transfer.stripe_transfer_id) {
        try {
          // Crear reversión en Stripe
          const reversal = await stripe.transferReversals.create(
            transfer.stripe_transfer_id,
            {
              amount: Math.round(reversalAmount * 100),
              metadata: {
                order_id: orderId,
                reason: 'Customer refund',
              },
            }
          );

          console.log('✅ [Refunds] Transfer reversal created:', {
            transferId: transfer.stripe_transfer_id,
            reversalId: reversal.id,
            amount: reversalAmount,
          });

          // Actualizar la transferencia en la BD
          await supabase
            .from('payment_transfers')
            .update({
              status: 'reversed',
              updated_at: new Date().toISOString(),
            })
            .eq('id', transfer.id);
        } catch (reversalError) {
          console.error('❌ [Refunds] Error creating reversal:', reversalError);
        }
      }
    }
  } catch (error) {
    console.error('❌ [Refunds] Error handling transfer reversals:', error);
  }
}