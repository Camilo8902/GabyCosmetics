/**
 * Utilidades para el cálculo de comisiones del marketplace
 * Gaby Cosmetics - Sistema de Pagos Seguro
 */

import { supabase } from './supabase';

// ==========================================
// TIPOS
// ==========================================

export interface CommissionRate {
  id: string;
  plan_name: string;
  percentage: number;
  fixed_fee: number;
  min_fee: number;
  max_fee: number | null;
  is_active: boolean;
  description: string;
}

export interface CommissionCalculation {
  amount: number;
  commission_rate: number;
  commission_amount: number;
  fixed_fee: number;
  total_commission: number;
  vendor_amount: number;
  plan_name: string;
}

export interface CompanyPaymentStatus {
  can_receive_payments: boolean;
  is_connected: boolean;
  onboarding_complete: boolean;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  pending_requirements: string[];
  message: string;
}

// ==========================================
// FUNCIONES DE COMISIÓN
// ==========================================

/**
 * Obtiene todas las tasas de comisión activas
 */
export async function getCommissionRates(): Promise<CommissionRate[]> {
  const { data, error } = await supabase
    .from('commission_rates')
    .select('*')
    .eq('is_active', true)
    .order('percentage', { ascending: false });

  if (error) {
    console.error('Error obteniendo tasas de comisión:', error);
    return [];
  }

  return data || [];
}

/**
 * Obtiene la tasa de comisión para un plan específico
 */
export async function getCommissionRateByPlan(planName: string): Promise<CommissionRate | null> {
  const { data, error } = await supabase
    .from('commission_rates')
    .select('*')
    .eq('plan_name', planName)
    .eq('is_active', true)
    .single();

  if (error) {
    console.error('Error obteniendo tasa de comisión:', error);
    return null;
  }

  return data;
}

/**
 * Calcula la comisión para una empresa y monto dados
 * Usa la función de PostgreSQL para consistencia
 */
export async function calculateCommission(
  companyId: string,
  amount: number
): Promise<CommissionCalculation> {
  try {
    // Intentar usar la función de PostgreSQL
    const { data, error } = await supabase.rpc('calculate_commission', {
      p_company_id: companyId,
      p_amount: amount,
    });

    if (!error && data !== null) {
      // Obtener información adicional de la tasa
      const rate = await getCompanyCommissionRate(companyId);
      
      return {
        amount,
        commission_rate: rate?.percentage || 0,
        commission_amount: data - (rate?.fixed_fee || 0),
        fixed_fee: rate?.fixed_fee || 0,
        total_commission: data,
        vendor_amount: amount - data,
        plan_name: rate?.plan_name || 'basic',
      };
    }

    // Fallback: cálculo local
    return calculateCommissionLocally(companyId, amount);
  } catch (error) {
    console.error('Error calculando comisión:', error);
    return calculateCommissionLocally(companyId, amount);
  }
}

/**
 * Cálculo local de comisión (fallback)
 */
async function calculateCommissionLocally(
  companyId: string,
  amount: number
): Promise<CommissionCalculation> {
  const rate = await getCompanyCommissionRate(companyId);
  
  if (!rate) {
    // Default a basic
    const basicRate = await getCommissionRateByPlan('basic');
    if (basicRate) {
      return calculateWithRate(amount, basicRate);
    }
    
    // Hardcoded fallback
    return {
      amount,
      commission_rate: 0.20,
      commission_amount: amount * 0.20,
      fixed_fee: 0.30,
      total_commission: amount * 0.20 + 0.30,
      vendor_amount: amount - (amount * 0.20 + 0.30),
      plan_name: 'basic',
    };
  }

  return calculateWithRate(amount, rate);
}

/**
 * Calcula la comisión usando una tasa específica
 */
function calculateWithRate(amount: number, rate: CommissionRate): CommissionCalculation {
  const commissionAmount = amount * rate.percentage;
  let totalCommission = commissionAmount + rate.fixed_fee;

  // Aplicar límite mínimo
  if (rate.min_fee && totalCommission < rate.min_fee) {
    totalCommission = rate.min_fee;
  }

  // Aplicar límite máximo
  if (rate.max_fee && totalCommission > rate.max_fee) {
    totalCommission = rate.max_fee;
  }

  // La comisión no puede ser mayor que el monto
  if (totalCommission > amount) {
    totalCommission = amount;
  }

  return {
    amount,
    commission_rate: rate.percentage,
    commission_amount: commissionAmount,
    fixed_fee: rate.fixed_fee,
    total_commission: totalCommission,
    vendor_amount: amount - totalCommission,
    plan_name: rate.plan_name,
  };
}

/**
 * Obtiene la tasa de comisión de una empresa
 */
async function getCompanyCommissionRate(companyId: string): Promise<CommissionRate | null> {
  try {
    // Obtener el plan de la empresa desde subscriptions
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .single();

    let planName = subscription?.plan;

    // Si no tiene suscripción, verificar en companies
    if (!planName) {
      const { data: company } = await supabase
        .from('companies')
        .select('plan')
        .eq('id', companyId)
        .single();
      
      planName = company?.plan || 'basic';
    }

    return await getCommissionRateByPlan(planName);
  } catch (error) {
    console.error('Error obteniendo plan de empresa:', error);
    return await getCommissionRateByPlan('basic');
  }
}

/**
 * Calcula el monto que recibe el vendedor
 */
export async function calculateVendorAmount(
  companyId: string,
  amount: number
): Promise<number> {
  const calculation = await calculateCommission(companyId, amount);
  return calculation.vendor_amount;
}

/**
 * Calcula las comisiones para múltiples items agrupados por empresa
 */
export async function calculateMultiVendorCommissions(
  items: Array<{ company_id: string; amount: number }>
): Promise<Map<string, CommissionCalculation>> {
  const results = new Map<string, CommissionCalculation>();

  // Agrupar por empresa
  const groupedByCompany = new Map<string, number>();
  for (const item of items) {
    const current = groupedByCompany.get(item.company_id) || 0;
    groupedByCompany.set(item.company_id, current + item.amount);
  }

  // Calcular comisión para cada empresa
  for (const [companyId, amount] of groupedByCompany) {
    const calculation = await calculateCommission(companyId, amount);
    results.set(companyId, calculation);
  }

  return results;
}

// ==========================================
// VERIFICACIÓN DE ESTADO DE PAGO
// ==========================================

/**
 * Verifica si una empresa puede recibir pagos
 */
export async function checkCompanyPaymentStatus(
  companyId: string
): Promise<CompanyPaymentStatus> {
  try {
    // Verificar usando la función de PostgreSQL
    const { data: canReceive, error } = await supabase.rpc('company_can_receive_payments', {
      p_company_id: companyId,
    });

    if (!error && canReceive !== null) {
      // Obtener detalles adicionales
      const { data: stripeAccount } = await supabase
        .from('stripe_accounts')
        .select('*')
        .eq('company_id', companyId)
        .single();

      return {
        can_receive_payments: canReceive,
        is_connected: !!stripeAccount,
        onboarding_complete: stripeAccount?.onboarding_complete || false,
        charges_enabled: stripeAccount?.charges_enabled || false,
        payouts_enabled: stripeAccount?.payouts_enabled || false,
        pending_requirements: (stripeAccount?.pending_requirements as string[]) || [],
        message: canReceive
          ? 'Cuenta lista para recibir pagos'
          : stripeAccount
            ? 'La cuenta necesita completar el proceso de verificación'
            : 'La empresa no tiene cuenta Stripe Connect',
      };
    }

    // Fallback: verificación manual
    return await checkCompanyPaymentStatusManually(companyId);
  } catch (error) {
    console.error('Error verificando estado de pago:', error);
    return {
      can_receive_payments: false,
      is_connected: false,
      onboarding_complete: false,
      charges_enabled: false,
      payouts_enabled: false,
      pending_requirements: [],
      message: 'Error al verificar el estado de la cuenta',
    };
  }
}

/**
 * Verificación manual del estado de pago (fallback)
 */
async function checkCompanyPaymentStatusManually(
  companyId: string
): Promise<CompanyPaymentStatus> {
  // Verificar que la empresa existe y está activa
  const { data: company, error: companyError } = await supabase
    .from('companies')
    .select('id, status')
    .eq('id', companyId)
    .single();

  if (companyError || !company) {
    return {
      can_receive_payments: false,
      is_connected: false,
      onboarding_complete: false,
      charges_enabled: false,
      payouts_enabled: false,
      pending_requirements: [],
      message: 'Empresa no encontrada',
    };
  }

  if (company.status !== 'approved' && company.status !== 'active') {
    return {
      can_receive_payments: false,
      is_connected: false,
      onboarding_complete: false,
      charges_enabled: false,
      payouts_enabled: false,
      pending_requirements: [],
      message: 'La empresa no está aprobada',
    };
  }

  // Verificar cuenta Stripe
  const { data: stripeAccount } = await supabase
    .from('stripe_accounts')
    .select('*')
    .eq('company_id', companyId)
    .single();

  if (!stripeAccount) {
    return {
      can_receive_payments: false,
      is_connected: false,
      onboarding_complete: false,
      charges_enabled: false,
      payouts_enabled: false,
      pending_requirements: [],
      message: 'La empresa no tiene cuenta Stripe Connect',
    };
  }

  const canReceive = 
    stripeAccount.onboarding_complete && 
    stripeAccount.charges_enabled;

  return {
    can_receive_payments: canReceive,
    is_connected: true,
    onboarding_complete: stripeAccount.onboarding_complete || false,
    charges_enabled: stripeAccount.charges_enabled || false,
    payouts_enabled: stripeAccount.payouts_enabled || false,
    pending_requirements: (stripeAccount.pending_requirements as string[]) || [],
    message: canReceive
      ? 'Cuenta lista para recibir pagos'
      : 'La cuenta necesita completar el proceso de verificación',
  };
}

// ==========================================
// UTILIDADES DE FORMATO
// ==========================================

/**
 * Formatea un porcentaje de comisión para mostrar
 */
export function formatCommissionRate(rate: number): string {
  return `${(rate * 100).toFixed(0)}%`;
}

/**
 * Formatea un monto de comisión para mostrar
 */
export function formatCommissionAmount(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Obtiene un resumen de comisiones para mostrar al usuario
 */
export function getCommissionSummary(calculation: CommissionCalculation): string {
  const rateFormatted = formatCommissionRate(calculation.commission_rate);
  const commissionFormatted = formatCommissionAmount(calculation.total_commission);
  const vendorFormatted = formatCommissionAmount(calculation.vendor_amount);

  return `Comisión (${rateFormatted}): ${commissionFormatted} | Vendedor recibe: ${vendorFormatted}`;
}