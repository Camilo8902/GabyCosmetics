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

// Webhook secret para Connect (diferente del webhook regular)
const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET || '';

/**
 * POST /api/webhooks/stripe-connect
 * 
 * Maneja webhooks de Stripe Connect para actualizar el estado
 * de las cuentas conectadas de las empresas.
 * 
 * Eventos manejados:
 * - account.updated: Cuando se actualiza la cuenta (onboarding completo, requisitos, etc.)
 * - account.application.deauthorized: Cuando la empresa desconecta su cuenta
 */
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

    console.log('📨 Evento Stripe Connect recibido:', event.type);

    // Manejar diferentes tipos de eventos
    switch (event.type) {
      case 'account.updated': {
        const account = event.data.object as Stripe.Account;
        console.log('🔄 Cuenta actualizada:', account.id);

        // Buscar la empresa asociada
        const { data: stripeAccount, error: findError } = await supabase
          .from('stripe_accounts')
          .select('*')
          .eq('stripe_account_id', account.id)
          .single();

        if (findError || !stripeAccount) {
          console.error('⚠️ No se encontró la cuenta en la BD:', account.id);
          break;
        }

        // Actualizar el estado de la cuenta
        const updates: Record<string, unknown> = {
          onboarding_complete: account.details_submitted || false,
          charges_enabled: account.charges_enabled || false,
          payouts_enabled: account.payouts_enabled || false,
          requirements: account.requirements || {},
          pending_requirements: account.requirements?.currently_due || [],
          updated_at: new Date().toISOString(),
        };

        // Si el onboarding se completó ahora
        if (account.details_submitted && !stripeAccount.onboarding_complete) {
          updates.onboarding_completed_at = new Date().toISOString();
          console.log('✅ Onboarding completado para cuenta:', account.id);
        }

        const { error: updateError } = await supabase
          .from('stripe_accounts')
          .update(updates)
          .eq('id', stripeAccount.id);

        if (updateError) {
          console.error('❌ Error actualizando cuenta:', updateError);
        } else {
          console.log('✅ Cuenta actualizada en BD:', account.id);
        }

        break;
      }

      case 'account.application.deauthorized': {
        const deauth = event.data.object as Stripe.Account;
        console.log('🔌 Cuenta desconectada:', deauth.id);

        // Marcar la cuenta como desconectada en lugar de eliminarla
        const { error } = await supabase
          .from('stripe_accounts')
          .update({
            onboarding_complete: false,
            charges_enabled: false,
            payouts_enabled: false,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_account_id', deauth.id);

        if (error) {
          console.error('❌ Error actualizando cuenta desconectada:', error);
        } else {
          console.log('✅ Cuenta marcada como desconectada:', deauth.id);
        }

        break;
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer;
        console.log('💸 Transferencia creada:', transfer.id);

        // Buscar la transferencia en nuestra BD
        const { data: paymentTransfer, error: findError } = await supabase
          .from('payment_transfers')
          .select('*')
          .eq('stripe_transfer_id', transfer.id)
          .single();

        if (findError || !paymentTransfer) {
          console.log('⚠️ Transferencia no encontrada en BD, puede ser de otro origen');
          break;
        }

        // Actualizar estado
        const { error: updateError } = await supabase
          .from('payment_transfers')
          .update({
            status: 'processing',
            updated_at: new Date().toISOString(),
          })
          .eq('id', paymentTransfer.id);

        if (updateError) {
          console.error('❌ Error actualizando transferencia:', updateError);
        }

        break;
      }

      case 'transfer.paid': {
        const transfer = event.data.object as Stripe.Transfer;
        console.log('✅ Transferencia completada:', transfer.id);

        // Actualizar estado a completado
        const { error } = await supabase
          .from('payment_transfers')
          .update({
            status: 'completed',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_transfer_id', transfer.id);

        if (error) {
          console.error('❌ Error actualizando transferencia completada:', error);
        }

        break;
      }

      case 'transfer.failed': {
        const transfer = event.data.object as Stripe.Transfer;
        console.log('❌ Transferencia fallida:', transfer.id);

        // Actualizar estado a fallido
        const { error } = await supabase
          .from('payment_transfers')
          .update({
            status: 'failed',
            failure_code: transfer.failure_code || null,
            failure_message: transfer.failure_message || null,
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_transfer_id', transfer.id);

        if (error) {
          console.error('❌ Error actualizando transferencia fallida:', error);
        }

        break;
      }

      case 'transfer.reversed': {
        const transfer = event.data.object as Stripe.Transfer;
        console.log('🔙 Transferencia revertida:', transfer.id);

        // Actualizar estado a revertido
        const { error } = await supabase
          .from('payment_transfers')
          .update({
            status: 'reversed',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_transfer_id', transfer.id);

        if (error) {
          console.error('❌ Error actualizando transferencia revertida:', error);
        }

        break;
      }

      case 'payout.created':
      case 'payout.paid':
      case 'payout.failed': {
        const payout = event.data.object as Stripe.Payout;
        console.log(`💰 Payout ${event.type.split('.')[1]}:`, payout.id);
        
        // Los payouts son de la cuenta conectada, solo logueamos
        // La empresa puede ver estos en su dashboard de Stripe
        break;
      }

      default:
        console.log(`⚠️ Evento Connect no manejado: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error('❌ Error en webhook Connect:', error);

    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Error en webhook',
    });
  }
}