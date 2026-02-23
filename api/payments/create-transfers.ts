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

interface VendorTransfer {
  company_id: string;
  company_name: string;
  stripe_account_id: string;
  amount: number;
  commission_amount: number;
  vendor_amount: number;
}

/**
 * POST /api/payments/create-transfers
 * 
 * Crea transferencias a las cuentas de los vendedores después de un pago exitoso.
 * Este endpoint se llama después de que el payment_intent.succeeded se confirma.
 * 
 * Body:
 * - paymentIntentId: ID del Payment Intent de Stripe
 * - orderId: ID de la orden
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
    const { paymentIntentId, orderId } = req.body;

    if (!paymentIntentId || !orderId) {
      return res.status(400).json({
        error: 'Faltan campos requeridos: paymentIntentId, orderId',
      });
    }

    console.log('💸 [Transfers] Creating transfers for order:', orderId);

    // Obtener el Payment Intent de Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        error: 'El pago no ha sido completado exitosamente',
        status: paymentIntent.status,
      });
    }

    // Verificar si ya se hicieron transferencias para esta orden
    const { data: existingTransfers } = await supabase
      .from('payment_transfers')
      .select('*')
      .eq('order_id', orderId);

    if (existingTransfers && existingTransfers.length > 0) {
      console.log('⚠️ [Transfers] Transfers already exist for order:', orderId);
      return res.status(200).json({
        success: true,
        message: 'Las transferencias ya fueron creadas',
        transfers: existingTransfers,
      });
    }

    // Obtener información de vendedores desde los metadatos
    const vendorsJson = paymentIntent.metadata.vendors_json;
    
    if (!vendorsJson) {
      console.log('⚠️ [Transfers] No vendor info in payment intent');
      return res.status(200).json({
        success: true,
        message: 'No hay información de vendedores para transferir',
        transfers: [],
      });
    }

    const vendors: VendorTransfer[] = JSON.parse(vendorsJson);
    const createdTransfers: any[] = [];

    // Crear transferencia para cada vendedor
    for (const vendor of vendors) {
      // Solo transferir si tiene cuenta Stripe Connect
      if (!vendor.stripe_account_id) {
        console.log('⚠️ [Transfers] Vendor without Stripe account:', vendor.company_name);
        
        // Registrar como pendiente
        await supabase
          .from('payment_transfers')
          .insert({
            order_id: orderId,
            company_id: vendor.company_id,
            stripe_payment_intent_id: paymentIntentId,
            amount: vendor.vendor_amount,
            commission_amount: vendor.commission_amount,
            platform_fee_amount: vendor.commission_amount,
            status: 'pending',
            metadata: { reason: 'Vendor has no Stripe account connected' },
          });
        continue;
      }

      try {
        // Crear transferencia en Stripe
        const transfer = await stripe.transfers.create({
          amount: Math.round(vendor.vendor_amount * 100), // Convertir a centavos
          currency: 'usd',
          destination: vendor.stripe_account_id,
          transfer_group: orderId,
          metadata: {
            order_id: orderId,
            company_id: vendor.company_id,
            company_name: vendor.company_name,
            commission_amount: vendor.commission_amount.toFixed(2),
          },
        });

        console.log('✅ [Transfers] Transfer created:', {
          id: transfer.id,
          destination: vendor.company_name,
          amount: vendor.vendor_amount,
        });

        // Guardar en la base de datos
        const { data: savedTransfer, error: saveError } = await supabase
          .from('payment_transfers')
          .insert({
            order_id: orderId,
            company_id: vendor.company_id,
            stripe_transfer_id: transfer.id,
            stripe_payment_intent_id: paymentIntentId,
            amount: vendor.vendor_amount,
            commission_amount: vendor.commission_amount,
            platform_fee_amount: vendor.commission_amount,
            status: 'completed',
            processed_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (saveError) {
          console.error('❌ [Transfers] Error saving transfer:', saveError);
        }

        createdTransfers.push({
          company_id: vendor.company_id,
          company_name: vendor.company_name,
          transfer_id: transfer.id,
          amount: vendor.vendor_amount,
          status: 'completed',
        });
      } catch (transferError) {
        console.error('❌ [Transfers] Error creating transfer:', transferError);

        // Guardar como fallido
        await supabase
          .from('payment_transfers')
          .insert({
            order_id: orderId,
            company_id: vendor.company_id,
            stripe_payment_intent_id: paymentIntentId,
            amount: vendor.vendor_amount,
            commission_amount: vendor.commission_amount,
            platform_fee_amount: vendor.commission_amount,
            status: 'failed',
            failure_message: transferError instanceof Error ? transferError.message : 'Unknown error',
          });
      }
    }

    // Actualizar estado de la orden
    await supabase
      .from('orders')
      .update({
        transfer_status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    return res.status(200).json({
      success: true,
      message: `Transferencias creadas para ${createdTransfers.length} vendedores`,
      transfers: createdTransfers,
    });
  } catch (error) {
    console.error('❌ [Transfers] Error:', error);

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