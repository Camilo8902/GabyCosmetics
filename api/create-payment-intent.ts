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

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
  company_id?: string;
  company_name?: string;
}

interface VendorBreakdown {
  company_id: string;
  company_name: string;
  stripe_account_id: string | null;
  subtotal: number;
  commission_amount: number;
  vendor_amount: number;
  items: CartItem[];
}

/**
 * POST /api/create-payment-intent
 * 
 * Crea un Payment Intent para checkout, con soporte para:
 * - Un solo vendedor: Usa transfer_data para enviar fondos directamente
 * - Múltiples vendedores: Usa transfer_group para transferencias separadas
 * 
 * Body:
 * - amount: Monto total
 * - orderId: ID de la orden
 * - email: Email del cliente
 * - items: Array de items del carrito con company_id
 * - metadata: Metadatos adicionales
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
    const { amount, orderId, email, items, metadata } = req.body;

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

    // Analizar items para determinar vendedores
    const vendorBreakdown = await analyzeVendors(items || []);
    
    console.log('📊 [PaymentIntent] Vendor breakdown:', {
      vendorCount: vendorBreakdown.length,
      vendors: vendorBreakdown.map(v => ({
        company: v.company_name,
        subtotal: v.subtotal,
        commission: v.commission_amount,
        vendorAmount: v.vendor_amount,
        hasStripe: !!v.stripe_account_id,
      })),
    });

    // Determinar si es multi-vendedor
    const isMultiVendor = vendorBreakdown.length > 1;
    const hasValidStripeAccounts = vendorBreakdown.every(v => v.stripe_account_id);

    // Crear Payment Intent
    let paymentIntent: Stripe.PaymentIntent;

    if (!isMultiVendor && vendorBreakdown[0]?.stripe_account_id) {
      // CASO 1: Un solo vendedor con cuenta Stripe Connect
      // Los fondos van directamente a la cuenta del vendedor, con aplicación de fee
      const vendor = vendorBreakdown[0];
      
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir a centavos
        currency: 'usd',
        payment_method_types: ['card'],
        receipt_email: email,
        metadata: {
          orderId,
          company_id: vendor.company_id,
          company_name: vendor.company_name,
          commission_amount: vendor.commission_amount.toFixed(2),
          vendor_amount: vendor.vendor_amount.toFixed(2),
          ...(metadata || {}),
        },
        // Transferir a la cuenta del vendedor
        transfer_data: {
          destination: vendor.stripe_account_id,
        },
        // La plataforma retiene la comisión
        application_fee_amount: Math.round(vendor.commission_amount * 100),
      });

      console.log('✅ [PaymentIntent] Created with direct transfer:', {
        id: paymentIntent.id,
        destination: vendor.stripe_account_id,
        applicationFee: vendor.commission_amount,
      });
    } else {
      // CASO 2: Múltiples vendedores o vendedor sin Stripe Connect
      // La plataforma recibe todos los fondos y luego hace transferencias
      paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convertir a centavos
        currency: 'usd',
        payment_method_types: ['card'],
        receipt_email: email,
        metadata: {
          orderId,
          is_multi_vendor: isMultiVendor.toString(),
          vendor_count: vendorBreakdown.length.toString(),
          vendors_json: JSON.stringify(vendorBreakdown.map(v => ({
            company_id: v.company_id,
            company_name: v.company_name,
            subtotal: v.subtotal,
            commission: v.commission_amount,
            vendor_amount: v.vendor_amount,
            stripe_account_id: v.stripe_account_id,
          }))),
          ...(metadata || {}),
        },
        // Usar transfer_group para agrupar transferencias
        transfer_group: orderId,
      });

      console.log('✅ [PaymentIntent] Created with transfer_group:', {
        id: paymentIntent.id,
        transfer_group: orderId,
        vendorCount: vendorBreakdown.length,
      });
    }

    // Guardar información de la orden en Supabase
    await saveOrderToSupabase(orderId, amount, vendorBreakdown, paymentIntent.id);

    return res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      isMultiVendor,
      vendorBreakdown: vendorBreakdown.map(v => ({
        company_id: v.company_id,
        company_name: v.company_name,
        subtotal: v.subtotal,
        commission: v.commission_amount,
        vendor_amount: v.vendor_amount,
      })),
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

/**
 * Analiza los items del carrito y agrupa por vendedor
 */
async function analyzeVendors(items: CartItem[]): Promise<VendorBreakdown[]> {
  // Agrupar items por company_id
  const companyMap = new Map<string, CartItem[]>();
  
  items.forEach(item => {
    const companyId = item.company_id || 'platform';
    if (!companyMap.has(companyId)) {
      companyMap.set(companyId, []);
    }
    companyMap.get(companyId)!.push(item);
  });

  // Procesar cada empresa
  const breakdowns: VendorBreakdown[] = [];

  for (const [companyId, companyItems] of companyMap) {
    // Calcular subtotal
    const subtotal = companyItems.reduce((sum, item) => 
      sum + (item.price * item.quantity), 0
    );

    // Obtener información de la empresa
    let stripeAccountId: string | null = null;
    let companyName = 'Gaby Cosmetics';
    let commissionRate = 0.20; // Default: Basic plan

    if (companyId !== 'platform') {
      // Obtener cuenta Stripe y plan de la empresa
      const { data: company } = await supabase
        .from('companies')
        .select('company_name, plan')
        .eq('id', companyId)
        .single();

      if (company) {
        companyName = company.company_name;
        
        // Obtener tasa de comisión según el plan
        commissionRate = await getCommissionRate(companyId, company.plan);
      }

      // Obtener cuenta Stripe Connect
      const { data: stripeAccount } = await supabase
        .from('stripe_accounts')
        .select('stripe_account_id, onboarding_complete, charges_enabled')
        .eq('company_id', companyId)
        .single();

      if (stripeAccount?.onboarding_complete && stripeAccount?.charges_enabled) {
        stripeAccountId = stripeAccount.stripe_account_id;
      }
    }

    // Calcular comisión y monto del vendedor
    const commissionAmount = subtotal * commissionRate + 0.30; // Porcentaje + tarifa fija
    const vendorAmount = subtotal - commissionAmount;

    breakdowns.push({
      company_id: companyId,
      company_name: companyName,
      stripe_account_id: stripeAccountId,
      subtotal,
      commission_amount: Math.max(0, commissionAmount),
      vendor_amount: Math.max(0, vendorAmount),
      items: companyItems,
    });
  }

  return breakdowns;
}

/**
 * Obtiene la tasa de comisión para una empresa
 */
async function getCommissionRate(companyId: string, plan?: string): Promise<number> {
  // Si ya tenemos el plan, obtener la tasa directamente
  if (plan) {
    const { data: rate } = await supabase
      .from('commission_rates')
      .select('percentage')
      .eq('plan_name', plan)
      .eq('is_active', true)
      .single();
    
    if (rate?.percentage) {
      return rate.percentage;
    }
  }

  // Intentar obtener desde subscriptions
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plan')
    .eq('company_id', companyId)
    .eq('status', 'active')
    .single();

  if (subscription?.plan) {
    const { data: rate } = await supabase
      .from('commission_rates')
      .select('percentage')
      .eq('plan_name', subscription.plan)
      .eq('is_active', true)
      .single();
    
    if (rate?.percentage) {
      return rate.percentage;
    }
  }

  // Default: Basic plan (20%)
  return 0.20;
}

/**
 * Guarda la información de la orden en Supabase
 */
async function saveOrderToSupabase(
  orderId: string,
  total: number,
  vendorBreakdown: VendorBreakdown[],
  paymentIntentId: string
) {
  try {
    // Calcular totales
    const totalCommission = vendorBreakdown.reduce((sum, v) => sum + v.commission_amount, 0);
    const totalVendorAmount = vendorBreakdown.reduce((sum, v) => sum + v.vendor_amount, 0);
    const isMultiVendor = vendorBreakdown.length > 1;

    // Actualizar la orden
    await supabase
      .from('orders')
      .update({
        payment_intent_id: paymentIntentId,
        platform_fee: totalCommission,
        vendor_amount: totalVendorAmount,
        is_multi_vendor: isMultiVendor,
        company_id: isMultiVendor ? null : vendorBreakdown[0]?.company_id,
        transfer_group: orderId,
        transfer_status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    console.log('✅ [Supabase] Order updated:', orderId);
  } catch (error) {
    console.error('⚠️ [Supabase] Error updating order:', error);
    // No lanzar error, el payment intent ya fue creado
  }
}
