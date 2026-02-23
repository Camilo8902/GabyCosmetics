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
 * POST /api/stripe/connect/onboard
 * 
 * Inicia el proceso de onboarding de Stripe Connect para una empresa.
 * Crea una cuenta conectada y devuelve la URL de onboarding.
 * 
 * Body:
 * - company_id: UUID de la empresa
 * - return_url: URL a la que redirigir después del onboarding
 * - refresh_url: URL a la que redirigir si el onboarding necesita ser reiniciado
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
    const { company_id, return_url, refresh_url } = req.body;

    // Validar campos requeridos
    if (!company_id) {
      return res.status(400).json({ error: 'company_id es requerido' });
    }

    // Obtener información de la empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, company_name, email, phone, address, tax_id, business_type')
      .eq('id', company_id)
      .single();

    if (companyError || !company) {
      return res.status(404).json({ error: 'Empresa no encontrada' });
    }

    // Verificar si ya tiene una cuenta Stripe Connect
    const { data: existingAccount } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('company_id', company_id)
      .single();

    let stripeAccountId = existingAccount?.stripe_account_id;

    // Si no tiene cuenta, crear una nueva
    if (!stripeAccountId) {
      console.log('🔄 Creando nueva cuenta Stripe Connect para:', company.company_name);

      // Crear cuenta conectada (Express)
      const account = await stripe.accounts.create({
        type: 'express',
        country: 'US', // Cambiar según el país de la empresa
        email: company.email,
        capabilities: {
          card_payments: { requested: true },
          transfers: { requested: true },
        },
        business_type: 'company',
        business_profile: {
          name: company.company_name,
          url: `${process.env.VITE_SITE_URL || 'https://gabycosmetics.com'}/store/${company.id}`,
        },
        metadata: {
          company_id: company_id,
          company_name: company.company_name,
        },
      });

      stripeAccountId = account.id;

      // Guardar en la base de datos
      const { error: insertError } = await supabase
        .from('stripe_accounts')
        .insert({
          company_id: company_id,
          stripe_account_id: stripeAccountId,
          account_type: 'express',
          onboarding_started_at: new Date().toISOString(),
          requirements: account.requirements || {},
        });

      if (insertError) {
        console.error('❌ Error guardando cuenta Stripe:', insertError);
        // Continuar de todas formas, la cuenta ya fue creada en Stripe
      }

      console.log('✅ Cuenta Stripe Connect creada:', stripeAccountId);
    }

    // Crear enlace de onboarding
    const origin = req.headers.origin || process.env.VITE_SITE_URL || 'http://localhost:5173';
    const defaultReturnUrl = return_url || `${origin}/company/settings/payments?stripe=success`;
    const defaultRefreshUrl = refresh_url || `${origin}/company/settings/payments?stripe=refresh`;

    const accountLink = await stripe.accountLinks.create({
      account: stripeAccountId,
      refresh_url: defaultRefreshUrl,
      return_url: defaultReturnUrl,
      type: 'account_onboarding',
    });

    console.log('✅ Enlace de onboarding creado para:', company.company_name);

    return res.status(200).json({
      success: true,
      url: accountLink.url,
      stripe_account_id: stripeAccountId,
      is_new_account: !existingAccount,
    });
  } catch (error) {
    console.error('❌ Error en onboarding de Stripe Connect:', error);

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