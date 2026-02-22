// ==========================================
// Tipos para el Sistema de Empresas (Marketplace)
// ==========================================

// Planes de suscripción disponibles
export type SubscriptionPlan = 'basic' | 'premium' | 'enterprise';

// Estados de empresa
export type CompanyStatus = 'pending' | 'approved' | 'rejected' | 'suspended' | 'active';

// Estados de suscripción
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing' | 'paused';

// Roles de usuario por empresa
export type CompanyRole = 
  | 'owner'           // Propietario de la empresa
  | 'admin'          // Administrador general
  | 'product_manager' // Gestor de productos
  | 'inventory_manager' // Gestor de inventario
  | 'support'         // Soporte al cliente
  | 'marketing'        // Marketing
  | 'sales'           // Ventas
  | 'viewer';         // Solo lectura

// Permisos individuales
export type Permission =
  | 'products:read' | 'products:write' | 'products:delete'
  | 'orders:read' | 'orders:write' | 'orders:process'
  | 'inventory:read' | 'inventory:write'
  | 'customers:read' | 'customers:write'
  | 'analytics:read'
  | 'settings:read' | 'settings:write'
  | 'users:read' | 'users:write' | 'users:invite'
  | 'billing:read' | 'billing:write'
  | 'reports:read' | 'reports:export';

// Configuración de la empresa
export interface CompanySettings {
  // General
  timezone: string;
  currency: string;
  language: string;
  
  // Pedidos
  auto_fulfill_orders: boolean;
  low_stock_threshold: number;
  
  // Notifications
  email_notifications: boolean;
  order_notifications: boolean;
  low_stock_alerts: boolean;
  
  // Social
  social_links: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
}

// Información fiscal
export interface CompanyTaxInfo {
  tax_id?: string;
  business_type?: string;
  fiscal_address?: string;
  invoice_template?: string;
}

// Empresa principal
export interface Company {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone?: string;
  logo_url?: string;
  cover_image_url?: string;
  description?: string;
  plan: SubscriptionPlan;
  status: CompanyStatus;
  tax_info?: CompanyTaxInfo;
  business_type?: string;
  website_url?: string;
  social_links?: CompanySettings['social_links'];
  settings: CompanySettings;
  metadata?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

// Usuario empleado de la empresa
export interface CompanyUser {
  id: string;
  company_id: string;
  user_id: string;
  role: CompanyRole;
  permissions: Permission[];
  status: 'active' | 'inactive' | 'invited';
  invited_at?: string;
  hired_at?: string;
  created_at: string;
  updated_at: string;
  
  // Datos del usuario relacionados
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
}

// Suscripción de la empresa
export interface Subscription {
  id: string;
  company_id: string;
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  current_period_start: string;
  current_period_end: string;
  stripe_subscription_id?: string;
  stripe_customer_id?: string;
  cancel_at_period_end: boolean;
  trial_end?: string;
  created_at: string;
  updated_at: string;
}

// Plan de suscripción con características
export interface SubscriptionPlanDetails {
  id: SubscriptionPlan;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  features: string[];
  limits: {
    products: number;
    users: number;
    storage_gb: number;
    orders_per_month: number;
  };
}

// Características por plan
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanDetails> = {
  basic: {
    id: 'basic',
    name: 'Básico',
    description: 'Perfecto para comenzar a vender',
    price_monthly: 29,
    price_yearly: 290,
    features: [
      'Hasta 100 productos',
      '1 usuario administrador',
      '5 GB almacenamiento',
      'Soporte por email',
      'Reportes básicos',
      'Integración con Stripe',
    ],
    limits: {
      products: 100,
      users: 1,
      storage_gb: 5,
      orders_per_month: 500,
    },
  },
  premium: {
    id: 'premium',
    name: 'Premium',
    description: 'Para empresas en crecimiento',
    price_monthly: 79,
    price_yearly: 790,
    features: [
      'Hasta 1,000 productos',
      '5 usuarios',
      '50 GB almacenamiento',
      'Soporte prioritario',
      'Reportes avanzados',
      'API access',
      'White-label',
      'Análisis de ventas',
    ],
    limits: {
      products: 1000,
      users: 5,
      storage_gb: 50,
      orders_per_month: 5000,
    },
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Para grandes empresas',
    price_monthly: 199,
    price_yearly: 1990,
    features: [
      'Productos ilimitados',
      'Usuarios ilimitados',
      '1 TB almacenamiento',
      'Soporte 24/7',
      'Reportes personalizados',
      'API access completo',
      'White-label completo',
      'Análisis avanzado',
      'Account manager dedicado',
      'SLA garantizado',
    ],
    limits: {
      products: -1, // ilimitado
      users: -1,
      storage_gb: 1000,
      orders_per_month: -1,
    },
  },
};

// Roles con permisos por defecto
export const ROLE_PERMISSIONS: Record<CompanyRole, Permission[]> = {
  owner: [
    // Todos los permisos
    'products:read', 'products:write', 'products:delete',
    'orders:read', 'orders:write', 'orders:process',
    'inventory:read', 'inventory:write',
    'customers:read', 'customers:write',
    'analytics:read',
    'settings:read', 'settings:write',
    'users:read', 'users:write', 'users:invite',
    'billing:read', 'billing:write',
    'reports:read', 'reports:export',
  ],
  admin: [
    'products:read', 'products:write', 'products:delete',
    'orders:read', 'orders:write', 'orders:process',
    'inventory:read', 'inventory:write',
    'customers:read', 'customers:write',
    'analytics:read',
    'settings:read', 'settings:write',
    'users:read', 'users:write', 'users:invite',
    'billing:read',
    'reports:read', 'reports:export',
  ],
  product_manager: [
    'products:read', 'products:write',
    'inventory:read',
    'analytics:read',
    'reports:read',
  ],
  inventory_manager: [
    'products:read',
    'inventory:read', 'inventory:write',
    'orders:read',
  ],
  support: [
    'orders:read', 'orders:write',
    'customers:read', 'customers:write',
    'inventory:read',
  ],
  marketing: [
    'products:read',
    'orders:read',
    'analytics:read',
    'customers:read',
    'reports:read', 'reports:export',
  ],
  sales: [
    'products:read',
    'orders:read', 'orders:write',
    'customers:read', 'customers:write',
    'analytics:read',
  ],
  viewer: [
    'products:read',
    'orders:read',
    'inventory:read',
    'analytics:read',
  ],
};

// Helper function para verificar permisos
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

// Helper function para verificar múltiples permisos
export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every(p => userPermissions.includes(p));
}

// Helper function para verificar al menos uno
export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some(p => userPermissions.includes(p));
}
