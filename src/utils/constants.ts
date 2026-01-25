/**
 * Constants
 * Application-wide constants
 */

// Order statuses
export const ORDER_STATUSES = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

// Order status labels
export const ORDER_STATUS_LABELS: Record<string, { es: string; en: string }> = {
  pending: { es: 'Pendiente', en: 'Pending' },
  confirmed: { es: 'Confirmado', en: 'Confirmed' },
  processing: { es: 'Procesando', en: 'Processing' },
  shipped: { es: 'Enviado', en: 'Shipped' },
  delivered: { es: 'Entregado', en: 'Delivered' },
  cancelled: { es: 'Cancelado', en: 'Cancelled' },
  refunded: { es: 'Reembolsado', en: 'Refunded' },
};

// Order status colors
export const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-purple-100 text-purple-700',
  shipped: 'bg-indigo-100 text-indigo-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  refunded: 'bg-gray-100 text-gray-700',
};

// User roles
export const USER_ROLES = {
  ADMIN: 'admin',
  COMPANY: 'company',
  CONSULTANT: 'consultant',
  CUSTOMER: 'customer',
} as const;

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// File upload
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Product
export const DEFAULT_LOW_STOCK_THRESHOLD = 10;

// Stripe
export const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || '';

// API endpoints (if needed)
export const API_ENDPOINTS = {
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  USERS: '/api/users',
  COMPANIES: '/api/companies',
  CATEGORIES: '/api/categories',
} as const;

// Storage buckets
export const STORAGE_BUCKETS = {
  PRODUCT_IMAGES: 'product-images',
  COMPANY_LOGOS: 'company-logos',
  USER_AVATARS: 'user-avatars',
  CATEGORY_IMAGES: 'category-images',
} as const;

// Date formats
export const DATE_FORMATS = {
  DISPLAY: 'DD/MM/YYYY',
  DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
  API: 'YYYY-MM-DD',
  API_WITH_TIME: 'YYYY-MM-DD HH:mm:ss',
} as const;

// Validation
export const VALIDATION = {
  MIN_PASSWORD_LENGTH: 6,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 255,
  MIN_DESCRIPTION_LENGTH: 10,
  MAX_DESCRIPTION_LENGTH: 5000,
  MIN_PRICE: 0,
  MAX_PRICE: 999999.99,
} as const;

// Cache times (in milliseconds)
export const CACHE_TIMES = {
  SHORT: 1000 * 60 * 5, // 5 minutes
  MEDIUM: 1000 * 60 * 15, // 15 minutes
  LONG: 1000 * 60 * 60, // 1 hour
} as const;
