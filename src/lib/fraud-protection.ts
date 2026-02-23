/**
 * Utilidades de protección contra fraudes
 * Gaby Cosmetics - Sistema de Pagos Seguro
 */

import { supabase } from './supabase';

// ==========================================
// TIPOS
// ==========================================

export interface FraudCheckResult {
  allowed: boolean;
  risk_level: 'low' | 'medium' | 'high';
  warnings: string[];
  requires_review: boolean;
}

export interface CompanyVerificationStatus {
  is_verified: boolean;
  stripe_onboarding_complete: boolean;
  stripe_charges_enabled: boolean;
  has_accepted_terms: boolean;
  days_since_registration: number;
  total_sales: number;
  average_rating: number;
}

// ==========================================
// VERIFICACIÓN DE EMPRESAS
// ==========================================

/**
 * Verifica si una empresa puede recibir pagos
 * Incluye validaciones de seguridad
 */
export async function verifyCompanyForPayments(
  companyId: string
): Promise<{ allowed: boolean; status: CompanyVerificationStatus; message: string }> {
  try {
    // Obtener información de la empresa
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select(`
        id,
        company_name,
        status,
        is_verified,
        created_at,
        stripe_accounts (
          onboarding_complete,
          charges_enabled,
          payouts_enabled
        )
      `)
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      return {
        allowed: false,
        status: getEmptyStatus(),
        message: 'Empresa no encontrada',
      };
    }

    // Verificar estado de la empresa
    if (company.status !== 'approved' && company.status !== 'active') {
      return {
        allowed: false,
        status: getEmptyStatus(),
        message: 'La empresa no está aprobada para vender',
      };
    }

    // Obtener estadísticas de ventas
    const { data: salesData } = await supabase
      .from('orders')
      .select('total')
      .eq('company_id', companyId)
      .eq('status', 'paid');

    const totalSales = salesData?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

    // Calcular días desde registro
    const createdAt = new Date(company.created_at);
    const daysSinceRegistration = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Obtener estado de Stripe
    const stripeAccount = Array.isArray(company.stripe_accounts) 
      ? company.stripe_accounts[0] 
      : company.stripe_accounts;

    const status: CompanyVerificationStatus = {
      is_verified: company.is_verified || false,
      stripe_onboarding_complete: stripeAccount?.onboarding_complete || false,
      stripe_charges_enabled: stripeAccount?.charges_enabled || false,
      has_accepted_terms: true, // Asumimos que aceptaron al registrarse
      days_since_registration: daysSinceRegistration,
      total_sales: totalSales,
      average_rating: 0, // TODO: Implementar sistema de ratings
    };

    // Verificar si puede recibir pagos
    const allowed = status.stripe_onboarding_complete && status.stripe_charges_enabled;

    return {
      allowed,
      status,
      message: allowed
        ? 'La empresa está verificada para recibir pagos'
        : 'La empresa necesita completar la configuración de pagos',
    };
  } catch (error) {
    console.error('Error verificando empresa:', error);
    return {
      allowed: false,
      status: getEmptyStatus(),
      message: 'Error al verificar la empresa',
    };
  }
}

function getEmptyStatus(): CompanyVerificationStatus {
  return {
    is_verified: false,
    stripe_onboarding_complete: false,
    stripe_charges_enabled: false,
    has_accepted_terms: false,
    days_since_registration: 0,
    total_sales: 0,
    average_rating: 0,
  };
}

// ==========================================
// VERIFICACIÓN DE TRANSACCIONES
// ==========================================

/**
 * Realiza verificaciones de fraude en una transacción
 */
export async function checkTransactionFraud(
  userId: string,
  amount: number,
  items: Array<{ company_id: string; price: number; quantity: number }>
): Promise<FraudCheckResult> {
  const warnings: string[] = [];
  let riskLevel: 'low' | 'medium' | 'high' = 'low';
  let requiresReview = false;

  try {
    // 1. Verificar historial del usuario
    const { data: userOrders } = await supabase
      .from('orders')
      .select('id, total, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    // 2. Verificar órdenes recientes del usuario
    const recentOrders = userOrders?.filter(o => {
      const orderDate = new Date(o.created_at);
      const hoursSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60);
      return hoursSinceOrder < 24;
    }) || [];

    if (recentOrders.length >= 5) {
      warnings.push('Usuario con múltiples órdenes en las últimas 24 horas');
      riskLevel = 'medium';
    }

    // 3. Verificar monto inusual
    const avgOrderAmount = userOrders && userOrders.length > 0
      ? userOrders.reduce((sum, o) => sum + (o.total || 0), 0) / userOrders.length
      : 0;

    if (avgOrderAmount > 0 && amount > avgOrderAmount * 3) {
      warnings.push('Monto de orden significativamente mayor al promedio del usuario');
      riskLevel = 'medium';
    }

    // 4. Verificar monto máximo
    if (amount > 1000) {
      warnings.push('Orden con monto alto (>$1000)');
      requiresReview = true;
    }

    if (amount > 5000) {
      warnings.push('Orden con monto muy alto (>$5000)');
      riskLevel = 'high';
      requiresReview = true;
    }

    // 5. Verificar que todas las empresas pueden recibir pagos
    const companyIds = [...new Set(items.map(i => i.company_id).filter(Boolean))];
    
    for (const companyId of companyIds) {
      const { allowed } = await verifyCompanyForPayments(companyId);
      if (!allowed) {
        warnings.push(`Empresa ${companyId} no verificada para recibir pagos`);
        riskLevel = 'high';
      }
    }

    // 6. Verificar tasa de reembolsos del usuario
    const { data: refunds } = await supabase
      .from('refunds')
      .select('id')
      .eq('user_id', userId);

    const totalUserOrders = userOrders?.length || 0;
    const refundRate = totalUserOrders > 0 
      ? (refunds?.length || 0) / totalUserOrders 
      : 0;

    if (refundRate > 0.5) {
      warnings.push('Usuario con alta tasa de reembolsos');
      riskLevel = 'high';
      requiresReview = true;
    }

    return {
      allowed: riskLevel !== 'high' || !requiresReview,
      risk_level: riskLevel,
      warnings,
      requires_review: requiresReview,
    };
  } catch (error) {
    console.error('Error en verificación de fraude:', error);
    return {
      allowed: true, // En caso de error, permitir pero registrar
      risk_level: 'medium',
      warnings: ['Error en verificación de fraude'],
      requires_review: true,
    };
  }
}

// ==========================================
// RETENCIÓN PARA NUEVOS VENDEDORES
// ==========================================

/**
 * Determina si se debe aplicar retención a un vendedor nuevo
 */
export async function shouldHoldPaymentForNewSeller(
  companyId: string
): Promise<{ hold: boolean; holdDays: number; reason: string }> {
  try {
    // Obtener información de la empresa
    const { data: company } = await supabase
      .from('companies')
      .select('created_at, is_verified')
      .eq('id', companyId)
      .single();

    if (!company) {
      return { hold: false, holdDays: 0, reason: '' };
    }

    // Si está verificada, no retener
    if (company.is_verified) {
      return { hold: false, holdDays: 0, reason: '' };
    }

    // Calcular días desde registro
    const createdAt = new Date(company.created_at);
    const daysSinceRegistration = Math.floor(
      (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Nuevos vendedores (< 30 días) tienen retención de 7 días
    if (daysSinceRegistration < 30) {
      return {
        hold: true,
        holdDays: 7,
        reason: 'Vendedor nuevo - período de retención de 7 días',
      };
    }

    // Vendedores intermedios (30-90 días) tienen retención de 3 días
    if (daysSinceRegistration < 90) {
      return {
        hold: true,
        holdDays: 3,
        reason: 'Vendedor en período de verificación - retención de 3 días',
      };
    }

    return { hold: false, holdDays: 0, reason: '' };
  } catch (error) {
    console.error('Error verificando retención:', error);
    return { hold: false, holdDays: 0, reason: '' };
  }
}

// ==========================================
// LÍMITES DE TRANSACCIONES
// ==========================================

export const TRANSACTION_LIMITS = {
  // Límite diario por usuario
  DAILY_USER_LIMIT: 5000,
  // Límite por transacción
  SINGLE_TRANSACTION_LIMIT: 10000,
  // Límite mensual por empresa
  MONTHLY_VENDOR_LIMIT: 50000,
  // Umbral para revisión manual
  REVIEW_THRESHOLD: 1000,
};

/**
 * Verifica si una transacción excede los límites
 */
export async function checkTransactionLimits(
  userId: string,
  amount: number
): Promise<{ withinLimits: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  // Verificar límite por transacción
  if (amount > TRANSACTION_LIMITS.SINGLE_TRANSACTION_LIMIT) {
    warnings.push(`Transacción excede límite único de $${TRANSACTION_LIMITS.SINGLE_TRANSACTION_LIMIT}`);
  }

  // Verificar límite diario del usuario
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: todayOrders } = await supabase
    .from('orders')
    .select('total')
    .eq('user_id', userId)
    .gte('created_at', today.toISOString());

  const todayTotal = todayOrders?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;

  if (todayTotal + amount > TRANSACTION_LIMITS.DAILY_USER_LIMIT) {
    warnings.push(`Transacción excedería límite diario de $${TRANSACTION_LIMITS.DAILY_USER_LIMIT}`);
  }

  return {
    withinLimits: warnings.length === 0,
    warnings,
  };
}