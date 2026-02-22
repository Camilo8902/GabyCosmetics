import { supabase } from '@/lib/supabase';
import type { SubscriptionPlan, Company, Subscription } from '@/types';
import { SUBSCRIPTION_PLANS } from '@/types';

// ==========================================
// SERVICIOS DE SUSCRIPCIONES
// ==========================================

export interface SubscriptionWithCompany extends Subscription {
  company: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PlanLimits {
  products: number;
  users: number;
  storage_gb: number;
  orders_per_month: number;
}

/**
 * Obtener todas las suscripciones (admin)
 */
export async function getAllSubscriptions(
  page = 1,
  pageSize = 20,
  filters?: { plan?: SubscriptionPlan; status?: string }
): Promise<{
  data: SubscriptionWithCompany[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}> {
  try {
    let query = supabase
      .from('subscriptions')
      .select(
        `
        *,
        company:companies (
          id,
          name,
          email
        )
      `,
        { count: 'exact' }
      );

    if (filters?.plan) {
      query = query.eq('plan', filters.plan);
    }
    if (filters?.status) {
      query = query.eq('status', filters.status);
    }

    const { data, error, count } = await query
      .range((page - 1) * pageSize, page * pageSize - 1)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      data: (data as unknown as SubscriptionWithCompany[]) || [],
      total: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    return {
      data: [],
      total: 0,
      page,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * Obtener suscripción de una empresa
 */
export async function getCompanySubscription(
  companyId: string
): Promise<{ subscription: Subscription | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { subscription: data as unknown as Subscription, error: null };
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return { subscription: null, error: error as Error };
  }
}

/**
 * Crear suscripción para una empresa
 */
export async function createSubscription(data: {
  companyId: string;
  plan: SubscriptionPlan;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}): Promise<{ subscription: Subscription | null; error: Error | null }> {
  try {
    const planDetails = SUBSCRIPTION_PLANS[data.plan];
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .insert({
        company_id: data.companyId,
        plan: data.plan,
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        stripe_customer_id: data.stripeCustomerId,
        stripe_subscription_id: data.stripeSubscriptionId,
        cancel_at_period_end: false,
      })
      .select()
      .single();

    if (error) throw error;

    // Actualizar el plan en la empresa
    await supabase
      .from('companies')
      .update({ plan: data.plan, updated_at: new Date().toISOString() })
      .eq('id', data.companyId);

    return { subscription: subscription as unknown as Subscription, error: null };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return { subscription: null, error: error as Error };
  }
}

/**
 * Actualizar plan de suscripción
 */
export async function updateSubscriptionPlan(
  subscriptionId: string,
  newPlan: SubscriptionPlan
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const planDetails = SUBSCRIPTION_PLANS[newPlan];
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 1);

    const { error } = await supabase
      .from('subscriptions')
      .update({
        plan: newPlan,
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        updated_at: now.toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) throw error;

    // Obtener company_id para actualizar
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('company_id')
      .eq('id', subscriptionId)
      .single();

    if (sub) {
      await supabase
        .from('companies')
        .update({ plan: newPlan, updated_at: now.toISOString() })
        .eq('id', sub.company_id);
    }

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Cancelar suscripción al final del período
 */
export async function cancelSubscriptionAtPeriodEnd(
  subscriptionId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error canceling subscription:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Reactivar suscripción cancelada
 */
export async function reactivateSubscription(
  subscriptionId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', subscriptionId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Verificar si la empresa puede agregar más productos
 */
export async function checkProductLimit(
  companyId: string
): Promise<{ canAdd: boolean; current: number; limit: number; error: Error | null }> {
  try {
    // Obtener suscripción
    const { subscription, error: subError } = await getCompanySubscription(companyId);
    if (subError) throw subError;

    const plan = subscription?.plan || 'basic';
    const limits = SUBSCRIPTION_PLANS[plan].limits;

    // Ilimitado
    if (limits.products === -1) {
      return { canAdd: true, current: 0, limit: -1, error: null };
    }

    // Contar productos actuales
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (countError) throw countError;

    return {
      canAdd: (count || 0) < limits.products,
      current: count || 0,
      limit: limits.products,
      error: null,
    };
  } catch (error) {
    console.error('Error checking product limit:', error);
    return { canAdd: false, current: 0, limit: 0, error: error as Error };
  }
}

/**
 * Verificar si la empresa puede agregar más usuarios
 */
export async function checkUserLimit(
  companyId: string
): Promise<{ canAdd: boolean; current: number; limit: number; error: Error | null }> {
  try {
    // Obtener suscripción
    const { subscription, error: subError } = await getCompanySubscription(companyId);
    if (subError) throw subError;

    const plan = subscription?.plan || 'basic';
    const limits = SUBSCRIPTION_PLANS[plan].limits;

    // Ilimitado
    if (limits.users === -1) {
      return { canAdd: true, current: 0, limit: -1, error: null };
    }

    // Contar usuarios actuales
    const { count, error: countError } = await supabase
      .from('company_users')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('status', 'active');

    if (countError) throw countError;

    return {
      canAdd: (count || 0) < limits.users,
      current: count || 0,
      limit: limits.users,
      error: null,
    };
  } catch (error) {
    console.error('Error checking user limit:', error);
    return { canAdd: false, current: 0, limit: 0, error: error as Error };
  }
}

/**
 * Obtener uso actual de la empresa
 */
export async function getCompanyUsage(companyId: string): Promise<{
  products: { current: number; limit: number };
  users: { current: number; limit: number };
  storage: { current: number; limit: number };
  ordersThisMonth: { current: number; limit: number };
  error: Error | null;
}> {
  try {
    const { subscription, error: subError } = await getCompanySubscription(companyId);
    if (subError) throw subError;

    const plan = subscription?.plan || 'basic';
    const limits = SUBSCRIPTION_PLANS[plan].limits;

    // Obtener conteos en paralelo
    const [productsCount, usersCount, ordersCount] = await Promise.all([
      supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId),
      supabase
        .from('company_users')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('status', 'active'),
      supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .gte('created_at', getStartOfMonth()),
    ]);

    // TODO: Calcular storage usado (requiere tabla o integración con storage)

    return {
      products: {
        current: productsCount.count || 0,
        limit: limits.products,
      },
      users: {
        current: usersCount.count || 0,
        limit: limits.users,
      },
      storage: {
        current: 0, // TODO: implementar
        limit: limits.storage_gb,
      },
      ordersThisMonth: {
        current: ordersCount.count || 0,
        limit: limits.orders_per_month,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error getting company usage:', error);
    return {
      products: { current: 0, limit: 0 },
      users: { current: 0, limit: 0 },
      storage: { current: 0, limit: 0 },
      ordersThisMonth: { current: 0, limit: 0 },
      error: error as Error,
    };
  }
}

/**
 * Sincronizar estado de suscripción desde Stripe
 */
export async function syncSubscriptionFromStripe(
  stripeSubscriptionId: string,
  data: {
    status: string;
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
  }
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: data.status,
        current_period_start: data.current_period_start,
        current_period_end: data.current_period_end,
        cancel_at_period_end: data.cancel_at_period_end,
        updated_at: new Date().toISOString(),
      })
      .eq('stripe_subscription_id', stripeSubscriptionId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error syncing subscription from Stripe:', error);
    return { success: false, error: error as Error };
  }
}

// Helper function
function getStartOfMonth(): string {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

// Exportar objeto de servicio
export const subscriptionService = {
  getAllSubscriptions,
  getCompanySubscription,
  createSubscription,
  updateSubscriptionPlan,
  cancelSubscriptionAtPeriodEnd,
  reactivateSubscription,
  checkProductLimit,
  checkUserLimit,
  getCompanyUsage,
  syncSubscriptionFromStripe,
};
