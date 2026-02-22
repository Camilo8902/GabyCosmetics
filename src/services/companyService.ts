import { supabase } from '@/lib/supabase';
import type {
  Company,
  CompanyUser,
  Subscription,
  SubscriptionPlan,
  CompanyRole,
  Permission,
} from '@/types';
import { SUBSCRIPTION_PLANS } from '@/types';

// ==========================================
// SERVICIOS DE EMPRESAS
// ==========================================

// Exportar como objeto para facilitar imports
const companyService = {
  createCompany,
  getCompanyById,
  getCompanyBySlug,
  updateCompany,
  getMyCompanies,
  inviteUserToCompany,
  acceptInvitation,
  updateUserRole,
  removeUserFromCompany,
  getCompanyUsers,
  getSubscription,
  updateSubscriptionPlan,
  getSubscriptionLimits,
  canAddMoreProducts,
};

export { companyService };
export type { Company, CompanyUser, Subscription };

/**
 * Crear una nueva empresa
 */
export async function createCompany(data: {
  name: string;
  email: string;
  phone?: string;
  description?: string;
  business_type?: string;
  tax_id?: string;
}): Promise<{ company: Company | null; error: Error | null }> {
  try {
    // Generar slug único
    const slug = data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const { data: company, error } = await supabase
      .from('companies')
      .insert({
        name: data.name,
        slug: slug,
        email: data.email,
        phone: data.phone,
        description: data.description,
        business_type: data.business_type,
        tax_id: data.tax_id,
        status: 'pending',
        plan: 'basic',
      })
      .select()
      .single();

    if (error) throw error;

    return { company: company as unknown as Company, error: null };
  } catch (error) {
    console.error('Error creating company:', error);
    return { company: null, error: error as Error };
  }
}

/**
 * Obtener empresa por ID
 */
export async function getCompanyById(
  companyId: string
): Promise<{ company: Company | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (error) throw error;

    return { company: data as unknown as Company, error: null };
  } catch (error) {
    console.error('Error getting company:', error);
    return { company: null, error: error as Error };
  }
}

/**
 * Obtener empresa por slug
 */
export async function getCompanyBySlug(
  slug: string
): Promise<{ company: Company | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) throw error;

    return { company: data as unknown as Company, error: null };
  } catch (error) {
    console.error('Error getting company by slug:', error);
    return { company: null, error: error as Error };
  }
}

/**
 * Actualizar empresa
 */
export async function updateCompany(
  companyId: string,
  data: Partial<Company>
): Promise<{ company: Company | null; error: Error | null }> {
  try {
    const { data: company, error } = await supabase
      .from('companies')
      .update(data)
      .eq('id', companyId)
      .select()
      .single();

    if (error) throw error;

    return { company: company as unknown as Company, error: null };
  } catch (error) {
    console.error('Error updating company:', error);
    return { company: null, error: error as Error };
  }
}

/**
 * Obtener empresas del usuario actual
 */
export async function getMyCompanies(): Promise<{
  companies: (Company & { role: string })[];
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('company_users')
      .select(
        `
        id,
        role,
        status,
        company:companies (
          id,
          name,
          slug,
          email,
          logo_url,
          plan,
          status,
          created_at
        )
      `
      )
      .eq('user_id', supabase.auth.user()?.id || '')
      .eq('status', 'active');

    if (error) throw error;

    const companies = data.map((item: any) => ({
      ...item.company,
      role: item.role,
    }));

    return { companies: companies as (Company & { role: string })[], error: null };
  } catch (error) {
    console.error('Error getting my companies:', error);
    return { companies: [], error: error as Error };
  }
}

// ==========================================
// SERVICIOS DE USUARIOS DE EMPRESA
// ==========================================

/**
 * Obtener usuarios de una empresa
 */
export async function getCompanyUsers(
  companyId: string
): Promise<{ users: CompanyUser[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('company_users')
      .select(
        `
        *,
        user:auth.users!inner (
          id,
          email,
          raw_user_meta_data
        )
      `
      )
      .eq('company_id', companyId)
      .neq('status', 'removed')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const users = data.map((item: any) => ({
      ...item,
      user: {
        id: item.user.id,
        email: item.user.email,
        full_name: item.user.raw_user_meta_data?.full_name,
        avatar_url: item.user.raw_user_meta_data?.avatar_url,
      },
    }));

    return { users: users as CompanyUser[], error: null };
  } catch (error) {
    console.error('Error getting company users:', error);
    return { users: [], error: error as Error };
  }
}

/**
 * Invitar usuario a empresa
 */
export async function inviteUserToCompany(data: {
  companyId: string;
  email: string;
  role: CompanyRole;
  permissions?: Permission[];
}): Promise<{ invitation: any | null; error: Error | null }> {
  try {
    const invitationToken = crypto.randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    const { data: invitation, error } = await supabase
      .from('company_invitations')
      .insert({
        company_id: data.companyId,
        invited_email: data.email,
        invited_by: supabase.auth.user()?.id,
        role: data.role,
        permissions: data.permissions || [],
        invitation_token: invitationToken,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) throw error;

    // TODO: Enviar email de invitación

    return { invitation, error: null };
  } catch (error) {
    console.error('Error inviting user:', error);
    return { invitation: null, error: error as Error };
  }
}

/**
 * Aceptar invitación a empresa
 */
export async function acceptInvitation(
  invitationToken: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    // Obtener invitación
    const { data: invitation, error: fetchError } = await supabase
      .from('company_invitations')
      .select('*')
      .eq('invitation_token', invitationToken)
      .eq('status', 'pending')
      .single();

    if (fetchError) throw fetchError;
    if (!invitation) throw new Error('Invitación no encontrada');

    // Verificar si ha expirado
    if (new Date(invitation.expires_at) < new Date()) {
      // Marcar como expirada
      await supabase
        .from('company_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);
      throw new Error('La invitación ha expirado');
    }

    // Verificar si el email coincide con el usuario actual
    const currentUser = supabase.auth.user();
    if (!currentUser || currentUser.email !== invitation.invited_email) {
      throw new Error('Esta invitación es para otro email');
    }

    // Crear el registro de company_user
    const { error: insertError } = await supabase.from('company_users').insert({
      company_id: invitation.company_id,
      user_id: currentUser.id,
      role: invitation.role,
      permissions: invitation.permissions,
      status: 'active',
      hired_at: new Date().toISOString(),
    });

    if (insertError) throw insertError;

    // Actualizar invitación
    await supabase
      .from('company_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    return { success: true, error: null };
  } catch (error) {
    console.error('Error accepting invitation:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Actualizar rol de usuario en empresa
 */
export async function updateUserRole(
  companyId: string,
  userId: string,
  role: CompanyRole,
  permissions?: Permission[]
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('company_users')
      .update({
        role,
        permissions: permissions || [],
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', companyId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: error as Error };
  }
}

/**
 * Remover usuario de empresa
 */
export async function removeUserFromCompany(
  companyId: string,
  userId: string
): Promise<{ success: boolean; error: Error | null }> {
  try {
    const { error } = await supabase
      .from('company_users')
      .update({
        status: 'removed',
        removed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', companyId)
      .eq('user_id', userId);

    if (error) throw error;

    return { success: true, error: null };
  } catch (error) {
    console.error('Error removing user:', error);
    return { success: false, error: error as Error };
  }
}

// ==========================================
// SERVICIOS DE SUSCRIPCIONES
// ==========================================

/**
 * Obtener suscripción de empresa
 */
export async function getSubscription(
  companyId: string
): Promise<{ subscription: Subscription | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('company_id', companyId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return { subscription: data as unknown as Subscription || null, error: null };
  } catch (error) {
    console.error('Error getting subscription:', error);
    return { subscription: null, error: error as Error };
  }
}

/**
 * Actualizar plan de suscripción
 */
export async function updateSubscriptionPlan(
  companyId: string,
  plan: SubscriptionPlan
): Promise<{ subscription: Subscription | null; error: Error | null }> {
  try {
    const { data: subscription, error } = await supabase
      .from('subscriptions')
      .update({
        plan,
        limits: SUBSCRIPTION_PLANS[plan].limits,
        updated_at: new Date().toISOString(),
      })
      .eq('company_id', companyId)
      .select()
      .single();

    if (error) throw error;

    // Actualizar también en companies
    await supabase
      .from('companies')
      .update({ plan, updated_at: new Date().toISOString() })
      .eq('id', companyId);

    return { subscription: subscription as unknown as Subscription, error: null };
  } catch (error) {
    console.error('Error updating subscription plan:', error);
    return { subscription: null, error: error as Error };
  }
}

/**
 * Obtener límites de suscripción
 */
export function getSubscriptionLimits(plan: SubscriptionPlan) {
  return SUBSCRIPTION_PLANS[plan].limits;
}

/**
 * Verificar si la empresa puede agregar más productos
 */
export async function canAddMoreProducts(companyId: string): Promise<{
  canAdd: boolean;
  currentCount: number;
  limit: number;
  error: Error | null;
}> {
  try {
    // Obtener suscripción
    const { subscription, error: subError } = await getSubscription(companyId);
    if (subError) throw subError;

    const plan = subscription?.plan || 'basic';
    const limits = getSubscriptionLimits(plan);

    if (limits.products === -1) {
      return { canAdd: true, currentCount: 0, limit: -1, error: null };
    }

    // Contar productos actuales
    const { count, error: countError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId);

    if (countError) throw countError;

    return {
      canAdd: (count || 0) < limits.products,
      currentCount: count || 0,
      limit: limits.products,
      error: null,
    };
  } catch (error) {
    console.error('Error checking product limits:', error);
    return { canAdd: false, currentCount: 0, limit: 0, error: error as Error };
  }
}

// ==========================================
// VERIFICACIÓN DE PERMISOS
// ==========================================

/**
 * Verificar si el usuario tiene permiso en la empresa
 */
export async function checkCompanyPermission(
  companyId: string,
  permission: Permission
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .rpc('check_company_permission', {
        company_uuid: companyId,
        required_permission: permission,
      });

    if (error) throw error;

    return data || false;
  } catch (error) {
    console.error('Error checking permission:', error);
    return false;
  }
}

/**
 * Obtener permisos del usuario en la empresa
 */
export async function getMyPermissions(
  companyId: string
): Promise<Permission[]> {
  try {
    const { data, error } = await supabase
      .from('company_users')
      .select('role, permissions')
      .eq('company_id', companyId)
      .eq('user_id', supabase.auth.user()?.id || '')
      .eq('status', 'active')
      .single();

    if (error) throw error;

    return data?.permissions || [];
  } catch (error) {
    console.error('Error getting permissions:', error);
    return [];
  }
}
