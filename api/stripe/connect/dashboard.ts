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
 * POST /api/stripe/connect/dashboard
 * 
 * Crea un enlace al dashboard de Stripe Express para que las empresas
 * puedan ver sus pagos, configurar su cuenta, etc.
 * 
 * Body:
 * - company_id: UUID de la empresa
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
    const { company_id } = req.body;

    if (!company_id) {
      return res.status(400).json({ error: 'company_id es requerido' });
    }

    // Obtener la cuenta Stripe de la empresa
    const { data: stripeAccount, error: dbError } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('company_id', company_id)
      .single();

    if (dbError || !stripeAccount) {
      return res.status(404).json({ 
        error: 'La empresa no tiene una cuenta Stripe Connect configurada' 
      });
    }

    if (!stripeAccount.onboarding_complete) {
      return res.status(400).json({ 
        error: 'El onboarding de Stripe no está completo',
        needs_onboarding: true 
      });
    }

    // Crear enlace al dashboard de Stripe Express
    const loginLink = await stripe.accounts.createLoginLink(
      stripeAccount.stripe_account_id
    );

    console.log('✅ Dashboard link created for company:', company_id);

    return res.status(200).json({
      success: true,
      url: loginLink.url,
      stripe_account_id: stripeAccount.stripe_account_id,
    });
  } catch (error) {
    console.error('❌ Error creating dashboard link:', error);

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
