/**
 * Utilidades para validación de empresas antes de vender
 * Gaby Cosmetics - Sistema de Pagos Seguro
 */

import { supabase } from './supabase';

// ==========================================
// TIPOS
// ==========================================

export interface CompanyValidationResult {
  can_sell: boolean;
  is_approved: boolean;
  has_stripe_connect: boolean;
  stripe_onboarding_complete: boolean;
  stripe_charges_enabled: boolean;
  has_active_plan: boolean;
  issues: string[];
  warnings: string[];
}

export interface ProductValidationResult {
  is_valid: boolean;
  company_can_sell: boolean;
  product_is_active: boolean;
  has_stock: boolean;
  issues: string[];
}

// ==========================================
// VALIDACIÓN DE EMPRESA
// ==========================================

/**
 * Verifica si una empresa puede vender productos
 */
export async function validateCompanyForSelling(
  companyId: string
): Promise<CompanyValidationResult> {
  const result: CompanyValidationResult = {
    can_sell: false,
    is_approved: false,
    has_stripe_connect: false,
    stripe_onboarding_complete: false,
    stripe_charges_enabled: false,
    has_active_plan: false,
    issues: [],
    warnings: [],
  };

  try {
    // 1. Verificar que la empresa existe y está aprobada
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, status, company_name')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      result.issues.push('La empresa no existe');
      return result;
    }

    if (company.status !== 'approved' && company.status !== 'active') {
      result.issues.push(`La empresa no está aprobada (estado: ${company.status})`);
      return result;
    }
    result.is_approved = true;

    // 2. Verificar cuenta Stripe Connect
    const { data: stripeAccount, error: stripeError } = await supabase
      .from('stripe_accounts')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (stripeError || !stripeAccount) {
      result.issues.push('La empresa no tiene cuenta Stripe Connect configurada');
      result.warnings.push('Debe completar el onboarding de Stripe para recibir pagos');
      return result;
    }
    result.has_stripe_connect = true;

    if (!stripeAccount.onboarding_complete) {
      result.issues.push('El onboarding de Stripe no está completo');
      result.warnings.push('Complete la configuración de Stripe para recibir pagos');
      return result;
    }
    result.stripe_onboarding_complete = true;

    if (!stripeAccount.charges_enabled) {
      result.issues.push('La cuenta Stripe no puede recibir cargos');
      result.warnings.push('Verifique los requisitos pendientes en Stripe');
      return result;
    }
    result.stripe_charges_enabled = true;

    // 3. Verificar plan/suscripción activa
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .single();

    if (!subscription) {
      // Verificar si tiene plan en la tabla companies
      const { data: companyPlan } = await supabase
        .from('companies')
        .select('plan')
        .eq('id', companyId)
        .single();

      if (!companyPlan?.plan) {
        result.warnings.push('La empresa no tiene un plan activo, se aplicará tarifa básica');
      }
    }
    result.has_active_plan = true;

    // Si pasó todas las validaciones
    result.can_sell = result.is_approved && 
                       result.stripe_onboarding_complete && 
                       result.stripe_charges_enabled;

    return result;
  } catch (error) {
    console.error('Error validating company:', error);
    result.issues.push('Error al validar la empresa');
    return result;
  }
}

/**
 * Verifica si múltiples empresas pueden vender
 */
export async function validateMultipleCompanies(
  companyIds: string[]
): Promise<Map<string, CompanyValidationResult>> {
  const results = new Map<string, CompanyValidationResult>();

  // Usar Promise.all para validación en paralelo
  const validations = await Promise.all(
    companyIds.map(async (id) => ({
      id,
      result: await validateCompanyForSelling(id),
    }))
  );

  validations.forEach(({ id, result }) => {
    results.set(id, result);
  });

  return results;
}

// ==========================================
// VALIDACIÓN DE PRODUCTO
// ==========================================

/**
 * Verifica si un producto puede ser vendido
 */
export async function validateProductForSelling(
  productId: string
): Promise<ProductValidationResult> {
  const result: ProductValidationResult = {
    is_valid: false,
    company_can_sell: false,
    product_is_active: false,
    has_stock: false,
    issues: [],
  };

  try {
    // Obtener producto con información de la empresa
    const { data: product, error: productError } = await supabase
      .from('products')
      .select(`
        id,
        name,
        is_active,
        stock_quantity,
        company_id,
        companies (
          id,
          status
        )
      `)
      .eq('id', productId)
      .single();

    if (productError || !product) {
      result.issues.push('El producto no existe');
      return result;
    }

    // Verificar si el producto está activo
    if (!product.is_active) {
      result.issues.push('El producto no está activo');
      return result;
    }
    result.product_is_active = true;

    // Verificar stock
    if (product.stock_quantity !== null && product.stock_quantity <= 0) {
      result.issues.push('El producto no tiene stock disponible');
      return result;
    }
    result.has_stock = true;

    // Verificar que la empresa puede vender
    const companyValidation = await validateCompanyForSelling(product.company_id);
    if (!companyValidation.can_sell) {
      result.issues.push(...companyValidation.issues);
      return result;
    }
    result.company_can_sell = true;

    // Si pasó todas las validaciones
    result.is_valid = result.product_is_active && 
                      result.has_stock && 
                      result.company_can_sell;

    return result;
  } catch (error) {
    console.error('Error validating product:', error);
    result.issues.push('Error al validar el producto');
    return result;
  }
}

// ==========================================
// VALIDACIÓN EN CHECKOUT
// ==========================================

/**
 * Valida todos los items del carrito antes del checkout
 */
export async function validateCartForCheckout(
  items: Array<{ product_id: string; quantity: number }>
): Promise<{
  is_valid: boolean;
  invalid_items: Array<{ product_id: string; reason: string }>;
  company_issues: Array<{ company_id: string; company_name: string; issues: string[] }>;
}> {
  const result = {
    is_valid: true,
    invalid_items: [] as Array<{ product_id: string; reason: string }>,
    company_issues: [] as Array<{ company_id: string; company_name: string; issues: string[] }>,
  };

  // Obtener IDs únicos de empresas
  const companyIds = new Set<string>();

  // Validar cada producto
  for (const item of items) {
    const validation = await validateProductForSelling(item.product_id);
    
    if (!validation.is_valid) {
      result.is_valid = false;
      result.invalid_items.push({
        product_id: item.product_id,
        reason: validation.issues.join(', '),
      });
    }
  }

  // Si hay items inválidos, retornar
  if (!result.is_valid) {
    return result;
  }

  // Obtener información de empresas para los productos válidos
  const { data: products } = await supabase
    .from('products')
    .select('id, company_id, companies(id, company_name)')
    .in('id', items.map(i => i.product_id));

  if (products) {
    products.forEach(p => {
      if (p.company_id) {
        companyIds.add(p.company_id);
      }
    });
  }

  // Validar todas las empresas
  const companyValidations = await validateMultipleCompanies(Array.from(companyIds));

  companyValidations.forEach((validation, companyId) => {
    if (!validation.can_sell) {
      result.is_valid = false;
      // Obtener nombre de la empresa
      const product = products?.find(p => p.company_id === companyId);
      const companyName = (product?.companies as any)?.company_name || 'Empresa desconocida';
      
      result.company_issues.push({
        company_id: companyId,
        company_name: companyName,
        issues: validation.issues,
      });
    }
  });

  return result;
}

// ==========================================
// UTILIDADES
// ==========================================

/**
 * Obtiene un mensaje de error amigable para el usuario
 */
export function getValidationErrorMessage(
  validation: CompanyValidationResult | ProductValidationResult
): string {
  if (validation.issues.length === 0) {
    return 'Validación exitosa';
  }

  return validation.issues.join('. ');
}

/**
 * Verifica si una empresa necesita configurar Stripe Connect
 */
export async function companyNeedsStripeSetup(
  companyId: string
): Promise<boolean> {
  const validation = await validateCompanyForSelling(companyId);
  return validation.is_approved && !validation.stripe_onboarding_complete;
}
