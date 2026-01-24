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
  sku?: string;
  barcode?: string;
  weight?: number;
  is_active: boolean;
  is_featured: boolean;
  is_visible: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  images?: ProductImage[];
  categories?: Category[];
  attributes?: ProductAttribute[];
  company?: Company;
  reviews?: Review[];
  inventory?: Inventory;
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

// Inventory
export interface Inventory {
  id: string;
  product_id: string;
  quantity: number;
  low_stock_threshold: number;
  track_inventory: boolean;
  allow_backorder: boolean;
  updated_at: string;
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
  shipping_address: Address;
  billing_address?: Address;
  notes?: string;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
  user?: User;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  company_id?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_name: string;
  product_image?: string;
  product?: Product;
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
}
