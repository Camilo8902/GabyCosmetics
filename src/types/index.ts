// ==========================================
// GABY COSMETICS - TYPE DEFINITIONS
// Scalable architecture for future categories
// ==========================================

// User Roles
export type UserRole = 'admin' | 'company' | 'consultant' | 'customer';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  role: UserRole;
  phone?: string;
  created_at: string;
  updated_at: string;
  email_verified: boolean;
  is_active: boolean;
}

// Company (for company users)
export interface Company {
  id: string;
  user_id: string;
  company_name: string;
  logo_url?: string;
  description?: string;
  website?: string;
  phone?: string;
  address?: string;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  user?: User; // User who owns the company
}

// Hierarchical Categories (scalable)
export interface Category {
  id: string;
  name: string;
  name_en: string;
  slug: string;
  description?: string;
  description_en?: string;
  image_url?: string;
  parent_id?: string;
  order_index: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Nested categories
  children?: Category[];
  parent?: Category;
}

// Dynamic Category Attributes (for scalability)
export interface CategoryAttribute {
  id: string;
  category_id: string;
  name: string;
  name_en: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean';
  options?: string[]; // For select/multiselect types
  is_required: boolean;
  is_filterable: boolean;
  order_index: number;
  created_at: string;
}

// Products
export interface Product {
  id: string;
  company_id?: string;
  name: string;
  name_en: string;
  slug: string;
  description: string;
  description_en: string;
  short_description?: string;
  short_description_en?: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  sku?: string; // Base SKU (if no variants)
  barcode?: string;
  weight?: number;
  has_variants: boolean; // Whether product has variants
  is_active: boolean;
  is_featured: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  images?: ProductImage[];
  categories?: Category[];
  attributes?: ProductAttribute[];
  variants?: ProductVariant[]; // Product variants
  company?: Company;
  reviews?: Review[];
  inventory?: Inventory; // Base inventory (if no variants)
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_text?: string;
  order_index: number;
  is_primary: boolean;
}

// Product Attributes (dynamic values)
export interface ProductAttribute {
  id: string;
  product_id: string;
  category_attribute_id: string;
  value: string;
  category_attribute?: CategoryAttribute;
}

// Product Categories (many-to-many)
export interface ProductCategory {
  product_id: string;
  category_id: string;
}

// Inventory - Advanced with variants and SKUs
export interface Inventory {
  id: string;
  product_id: string;
  quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  location?: string; // Warehouse location
  updated_at: string;
  [key: string]: any; // Allow array indexing for backwards compatibility
}

// Product Variants (for advanced inventory)
export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name: string; // e.g., "Small - Red"
  name_en: string;
  price: number;
  compare_at_price?: number;
  cost_price?: number;
  barcode?: string;
  weight?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  inventory?: Inventory;
  attributes?: Record<string, string>; // e.g., { size: "Small", color: "Red" }
}

// Variant Attributes (e.g., Size, Color)
export interface VariantAttribute {
  id: string;
  name: string;
  name_en: string;
  values: string[]; // e.g., ["Small", "Medium", "Large"]
  order_index: number;
}

// Reviews
export interface Review {
  id: string;
  product_id: string;
  user_id: string;
  rating: number;
  title?: string;
  comment?: string;
  is_verified_purchase: boolean;
  is_approved: boolean;
  created_at: string;
  user?: User;
}

// Shopping Cart
export interface CartItem {
  id: string;
  user_id?: string;
  session_id?: string;
  product_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product?: Product;
}

// Wishlist
export interface WishlistItem {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
  product?: Product;
}

// Addresses
export interface Address {
  id: string;
  user_id: string;
  full_name: string;
  phone: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
}

// Orders
export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';

export interface Order {
  id: string;
  user_id: string;
  order_number: string;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  shipping_cost: number;
  discount: number;
  total: number;
  shipping_address: Address | Record<string, any>; // Allow flexible address format
  billing_address?: Address | Record<string, any>;
  payment?: Payment; // Payment information
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  user?: User;
  tax_amount?: number; // Alternative tax field name
  discount_amount?: number; // Alternative discount field name
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  variant_id?: string; // If product has variants
  company_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  product_image?: string;
  variant_name?: string; // e.g., "Small - Red"
  price?: number; // Optional price field for compatibility
  product?: Product;
  variant?: ProductVariant;
}

// Coupons
export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_purchase?: number;
  max_uses?: number;
  current_uses: number;
  starts_at?: string;
  expires_at?: string;
  is_active: boolean;
  created_at: string;
}

// Newsletter Subscribers
export interface NewsletterSubscriber {
  id: string;
  email: string;
  is_active: boolean;
  subscribed_at: string;
}

// Site Settings
export interface SiteSetting {
  id: string;
  key: string;
  value: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  description?: string;
  updated_at: string;
}

// Statistics for dashboards
export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  totalCustomers: number;
  recentOrders: Order[];
  topProducts: Product[];
  salesByCategory: { category: string; sales: number }[];
  monthlySales: { month: string; sales: number }[];
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter types for shop
export interface ProductFilters {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  search?: string;
  sortBy?: 'name' | 'price' | 'created_at' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  attributes?: Record<string, string[]>;
  inStock?: boolean;
  featured?: boolean;
  is_active?: boolean;
  is_visible?: boolean;
  includeInactive?: boolean; // For admin panel - include inactive products
  includeInvisible?: boolean; // For admin panel - include invisible products
}

// Stripe Payment Types
export interface StripePaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: 'requires_payment_method' | 'requires_confirmation' | 'requires_action' | 'processing' | 'requires_capture' | 'canceled' | 'succeeded';
}

export interface StripeCheckoutSession {
  id: string;
  url: string;
  amount_total: number;
  currency: string;
  payment_status: 'paid' | 'unpaid' | 'no_payment_required';
}

// Payment Methods
export type PaymentMethod = 'stripe_card' | 'stripe_other';

export interface Payment {
  id: string;
  order_id: string;
  payment_intent_id?: string; // Stripe payment intent ID
  method: PaymentMethod;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'refunded';
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

// ==========================================
// COMPANY MARKETPLACE TYPES
// ==========================================

// Plans de suscripción
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
  timezone: string;
  currency: string;
  language: string;
  auto_fulfill_orders: boolean;
  low_stock_threshold: number;
  email_notifications: boolean;
  order_notifications: boolean;
  low_stock_alerts: boolean;
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
export interface MarketplaceCompany {
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
  limits: {
    products: number;
    users: number;
    storage_gb: number;
    orders_per_month: number;
  };
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

// Planes de suscripción
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
      products: -1,
      users: -1,
      storage_gb: 1000,
      orders_per_month: -1,
    },
  },
};

// Roles con permisos por defecto
export const ROLE_PERMISSIONS: Record<CompanyRole, Permission[]> = {
  owner: [
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

// Helper functions
export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every(p => userPermissions.includes(p));
}

export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some(p => userPermissions.includes(p));
}

// ==========================================
// FASE 2: CATÁLOGO DE PRODUCTOS AVANZADO
// ==========================================

// --- Productos ---

export type ProductStatus = 'draft' | 'active' | 'inactive' | 'archived';

export type ProductType = 'physical' | 'digital' | 'service';

// Producto extendido para marketplace
export interface ExtendedProduct {
  id: string;
  company_id: string;
  category_id?: string;
  name: string;
  name_en?: string;
  slug: string;
  description?: string;
  description_en?: string;
  short_description?: string;
  brand?: string;
  model?: string;
  base_price: number;
  compare_at_price?: number;
  cost_price?: number;
  sku_prefix?: string;
  barcode?: string;
  weight?: number;
  dimensions?: ProductDimensions;
  images: string[];
  videos: ExtendedProductVideo[];
  documents: ExtendedProductDocument[];
  attributes: Record<string, string>;
  seo_metadata: ProductSEOMetadata;
  status: ProductStatus;
  is_featured: boolean;
  is_digital: boolean;
  has_variants: boolean;
  total_stock: number;
  low_stock_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface ProductDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'cm' | 'in' | 'm';
}

export interface ProductSEOMetadata {
  title?: string;
  description?: string;
  keywords?: string[];
}

// Video de producto
export interface ExtendedProductVideo {
  id: string;
  product_id: string;
  url: string;
  thumbnail_url?: string;
  title?: string;
  type: 'youtube' | 'vimeo' | 'upload';
  duration_seconds?: number;
  sort_order: number;
}

// Documento de producto (manuales, etc.)
export interface ExtendedProductDocument {
  id: string;
  product_id: string;
  name: string;
  url: string;
  type: 'manual' | 'specsheet' | 'warranty' | 'other';
  file_size: number;
  mime_type: string;
}

// --- Categorías Jerárquicas ---

export interface ExtendedCategory {
  id: string;
  company_id?: string;
  parent_id?: string;
  name: string;
  name_en?: string;
  slug: string;
  description?: string;
  description_en?: string;
  image_url?: string;
  icon?: string;
  attributes: ExtendedCategoryAttribute[];
  sort_order: number;
  is_active: boolean;
  children?: ExtendedCategory[];
  product_count?: number;
  created_at: string;
  updated_at: string;
}

// Atributo de categoría
export interface ExtendedCategoryAttribute {
  id: string;
  category_id: string;
  name: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'boolean' | 'color' | 'size';
  options?: string[];
  is_required: boolean;
  is_filterable: boolean;
  sort_order: number;
}

// --- Inventario y Almacenes ---

export type WarehouseType = 'fulfillment' | 'dropship' | 'returns';

export interface Warehouse {
  id: string;
  company_id: string;
  name: string;
  type: WarehouseType;
  address: WarehouseAddress;
  is_active: boolean;
  is_default: boolean;
  contact_email?: string;
  contact_phone?: string;
  created_at: string;
  updated_at: string;
}

export interface WarehouseAddress {
  street: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}

// Inventario por almacén
export interface ExtendedWarehouseInventory {
  id: string;
  variant_id: string;
  warehouse_id: string;
  quantity: number;
  reserved_quantity: number;
  reorder_point: number;
  reorder_quantity: number;
  location_code?: string;
  last_counted_at?: string;
  created_at: string;
  updated_at: string;
}

// Historial de movimientos de inventario
export type InventoryMovementType = 
  | 'purchase' | 'sale' | 'return' | 'transfer_in' | 'transfer_out'
  | 'adjustment' | 'damaged' | 'expired' | 'reserved' | 'unreserved';

export interface ExtendedInventoryMovement {
  id: string;
  variant_id: string;
  warehouse_id?: string;
  type: InventoryMovementType;
  quantity_change: number;
  previous_quantity: number;
  new_quantity: number;
  reason?: string;
  reference_type?: 'order' | 'purchase' | 'transfer' | 'adjustment';
  reference_id?: string;
  user_id: string;
  created_at: string;
}

// --- SKU Automático ---

export interface SKUTemplate {
  id: string;
  company_id: string;
  pattern: string;
  segments: SKUSegment[];
  is_active: boolean;
}

export interface SKUSegment {
  name: string;
  type: 'fixed' | 'attribute' | 'sequence' | 'date';
  value?: string;
  attribute_key?: string;
  format?: string;
  length?: number;
}

// --- Filtros de Búsqueda ---

export interface ProductSearchFilters {
  search?: string;
  category_ids?: string[];
  include_children?: boolean;
  min_price?: number;
  max_price?: number;
  attributes?: Record<string, string[]>;
  in_stock?: boolean;
  low_stock?: boolean;
  status?: ProductStatus[];
  brands?: string[];
  sort_by?: 'name' | 'price' | 'created_at' | 'updated_at' | 'sales' | 'popularity';
  sort_order?: 'asc' | 'desc';
  page?: number;
  page_size?: number;
}

// --- Respuestas de API ---

export interface ProductListResponse {
  products: ExtendedProduct[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  facets?: ProductFacets;
}

export interface ProductFacets {
  categories: { id: string; name: string; count: number }[];
  brands: { name: string; count: number }[];
  attributes: { name: string; values: { value: string; count: number }[] }[];
  price_range: { min: number; max: number };
}

export interface InventoryStatus {
  product_id: string;
  total_stock: number;
  total_reserved: number;
  total_available: number;
  low_stock: boolean;
  out_of_stock: boolean;
  warehouses: {
    warehouse_id: string;
    warehouse_name: string;
    quantity: number;
    reserved: number;
    available: number;
  }[];
}

