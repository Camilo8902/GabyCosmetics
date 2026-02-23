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
 * GET /api/stripe/connect/status
 * 
 * Obtiene el estado de la cuenta Stripe Connect de una empresa.
 * 
 * Query params:
 * - company_id: UUID de la empresa
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Solo permitir GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Método no permitido' });
  }

  try {
    const { company_id } = req.query;

    if (!company_id || typeof company_id !== 'string') {
      return res.status(400).json({ error: 'company_id es requerido' });
    }

    // Obtener cuenta de la base de datos
    const { data: stripeAccount, error: dbError } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('company_id', company_id)
      .single();

    if (dbError || !stripeAccount) {
      return res.status(200).json({
        connected: false,
        onboarding_complete: false,
        charges_enabled: false,
        payouts_enabled: false,
        message: 'La empresa no tiene cuenta Stripe Connect',
      });
    }

    // Obtener información actualizada de Stripe
    let accountFromStripe: Stripe.Account | null = null;
    try {
      accountFromStripe = await stripe.accounts.retrieve(stripeAccount.stripe_account_id);
    } catch (stripeError) {
      console.error('⚠️ Error obteniendo cuenta de Stripe:', stripeError);
      // Continuar con la información de la base de datos
    }

    // Actualizar la base de datos con la información más reciente
    if (accountFromStripe) {
      const updates: Record<string, unknown> = {
        onboarding_complete: accountFromStripe.details_submitted || false,
        charges_enabled: accountFromStripe.charges_enabled || false,
        payouts_enabled: accountFromStripe.payouts_enabled || false,
        requirements: accountFromStripe.requirements || {},
        pending_requirements: accountFromStripe.requirements?.currently_due || [],
      };

      // Si el onboarding se completó, actualizar la fecha
      if (accountFromStripe.details_submitted && !stripeAccount.onboarding_complete) {
        updates.onboarding_completed_at = new Date().toISOString();
      }

      await supabase
        .from('stripe_accounts')
        .update(updates)
        .eq('id', stripeAccount.id);

      // Actualizar el objeto local
      Object.assign(stripeAccount, updates);
    }

    // Determinar si puede recibir pagos
    const canReceivePayments = 
      stripeAccount.onboarding_complete && 
      stripeAccount.charges_enabled;

    // Determinar si hay requisitos pendientes
    const pendingRequirements = (stripeAccount.pending_requirements as string[]) || [];
    const hasPendingRequirements = pendingRequirements.length > 0;

    return res.status(200).json({
      connected: true,
      stripe_account_id: stripeAccount.stripe_account_id,
      onboarding_complete: stripeAccount.onboarding_complete,
      charges_enabled: stripeAccount.charges_enabled,
      payouts_enabled: stripeAccount.payouts_enabled,
      can_receive_payments: canReceivePayments,
      has_pending_requirements: hasPendingRequirements,
      pending_requirements: pendingRequirements,
      requirements: stripeAccount.requirements,
      onboarding_started_at: stripeAccount.onboarding_started_at,
      onboarding_completed_at: stripeAccount.onboarding_completed_at,
      message: canReceivePayments 
        ? 'Cuenta lista para recibir pagos'
        : hasPendingRequirements
          ? 'Hay requisitos pendientes para completar la cuenta'
          : 'El onboarding no está completo',
    });
  } catch (error) {
    console.error('❌ Error obteniendo estado de Stripe Connect:', error);

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