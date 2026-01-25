/**
 * Formatters Utility
 * Common formatting functions for dates, currency, etc.
 */

/**
 * Format currency
 */
export const formatCurrency = (amount: number, currency = 'USD', locale = 'es-MX'): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
};

/**
 * Format date
 */
export const formatDate = (date: string | Date, locale = 'es-MX'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(dateObj);
};

/**
 * Format date and time
 */
export const formatDateTime = (date: string | Date, locale = 'es-MX'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj);
};

/**
 * Format relative time (e.g., "hace 2 horas")
 */
export const formatRelativeTime = (date: string | Date, locale = 'es-MX'): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - dateObj.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return locale === 'es-MX' ? 'hace un momento' : 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return locale === 'es-MX' 
      ? `hace ${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}`
      : `${diffInMinutes} ${diffInMinutes === 1 ? 'minute' : 'minutes'} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return locale === 'es-MX'
      ? `hace ${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}`
      : `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return locale === 'es-MX'
      ? `hace ${diffInDays} ${diffInDays === 1 ? 'día' : 'días'}`
      : `${diffInDays} ${diffInDays === 1 ? 'day' : 'days'} ago`;
  }

  return formatDate(dateObj, locale);
};

/**
 * Format number with thousand separators
 */
export const formatNumber = (number: number, locale = 'es-MX'): string => {
  return new Intl.NumberFormat(locale).format(number);
};

/**
 * Format percentage
 */
export const formatPercentage = (value: number, decimals = 0): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Format file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

/**
 * Format slug from text
 */
export const formatSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

/**
 * Format phone number
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
};

/**
 * Truncate text
 */
export const truncate = (text: string, maxLength: number, suffix = '...'): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - suffix.length) + suffix;
};
