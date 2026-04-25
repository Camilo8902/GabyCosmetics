import { z } from 'zod';
import { VALIDATION } from './constants';

/**
 * Validators
 * Reusable validation schemas using Zod
 */

// Email validation
export const emailSchema = z.string().email('Correo electrónico inválido');

// Password validation
export const passwordSchema = z
  .string()
  .min(VALIDATION.MIN_PASSWORD_LENGTH, `La contraseña debe tener al menos ${VALIDATION.MIN_PASSWORD_LENGTH} caracteres`)
  .max(VALIDATION.MAX_PASSWORD_LENGTH, `La contraseña no puede tener más de ${VALIDATION.MAX_PASSWORD_LENGTH} caracteres`);

// Name validation
export const nameSchema = z
  .string()
  .min(VALIDATION.MIN_NAME_LENGTH, `El nombre debe tener al menos ${VALIDATION.MIN_NAME_LENGTH} caracteres`)
  .max(VALIDATION.MAX_NAME_LENGTH, `El nombre no puede tener más de ${VALIDATION.MAX_NAME_LENGTH} caracteres`);

// Phone validation
export const phoneSchema = z
  .string()
  .regex(/^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/, 'Número de teléfono inválido')
  .optional();

 // Price validation
 export const priceSchema = z
   .number()
   .min(VALIDATION.MIN_PRICE, `El precio debe ser mayor o igual a ${VALIDATION.MIN_PRICE}`)
   .max(VALIDATION.MAX_PRICE, `El precio no puede ser mayor a ${VALIDATION.MAX_PRICE}`);

// Helper schema for optional numeric fields that may be empty strings (from number inputs)
 export const optionalNumberSchema = z.preprocess(
   (val) => {
     if (val === '' || val === null) return undefined;
     if (typeof val === 'number' && isNaN(val)) return undefined;
     return val;
   },
   priceSchema.optional()
 );

// Description validation
export const descriptionSchema = z
  .string()
  .min(VALIDATION.MIN_DESCRIPTION_LENGTH, `La descripción debe tener al menos ${VALIDATION.MIN_DESCRIPTION_LENGTH} caracteres`)
  .max(VALIDATION.MAX_DESCRIPTION_LENGTH, `La descripción no puede tener más de ${VALIDATION.MAX_DESCRIPTION_LENGTH} caracteres`)
  .optional();

// Slug validation
export const slugSchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'El slug solo puede contener letras minúsculas, números y guiones')
  .min(1, 'El slug es requerido');

// URL validation
export const urlSchema = z
  .string()
  .refine(
    (value) => {
      if (!value) return true; // Empty string is valid
      if (value.startsWith('data:')) return true; // Data URLs (base64 images) are valid
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    'URL inválida'
  )
  .optional()
  .or(z.literal(''));

// File validation
export const fileSchema = z
  .instanceof(File)
  .refine((file) => file.size <= 5 * 1024 * 1024, 'El archivo no puede ser mayor a 5MB')
  .refine(
    (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type),
    'Solo se permiten imágenes (JPEG, PNG, WebP)'
  );

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

// Register schema
export const registerSchema = z.object({
  fullName: nameSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Product schema
export const productSchema = z.object({
  name: nameSchema,
  name_en: nameSchema,
  slug: slugSchema,
  description: descriptionSchema,
  description_en: descriptionSchema,
  short_description: z.string().max(500).optional().or(z.literal('')),
  short_description_en: z.string().max(500).optional().or(z.literal('')),
  price: priceSchema,
  compare_at_price: optionalNumberSchema,
  cost_price: optionalNumberSchema,
  sku: z.string().optional(),
  barcode: z.string().optional(),
  weight: optionalNumberSchema,
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  is_visible: z.boolean().default(true),
  company_id: z.string().uuid().optional().or(z.literal('')),
});

// Category schema
export const categorySchema = z.object({
  name: nameSchema,
  name_en: nameSchema,
  slug: slugSchema,
  description: descriptionSchema,
  description_en: descriptionSchema,
  image_url: urlSchema,
  parent_id: z.string().uuid().optional(),
  order_index: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
});

// Address schema
export const addressSchema = z.object({
  full_name: nameSchema,
  phone: phoneSchema,
  address_line1: z.string().min(5, 'La dirección debe tener al menos 5 caracteres'),
  address_line2: z.string().optional(),
  city: nameSchema,
  state: nameSchema,
  postal_code: z.string().min(4, 'El código postal debe tener al menos 4 caracteres'),
  country: z.string().default('México'),
  is_default: z.boolean().default(false),
});

// Review schema
export const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(255).optional(),
  comment: z.string().max(2000).optional(),
});

// Type exports
export type LoginForm = z.infer<typeof loginSchema>;
export type RegisterForm = z.infer<typeof registerSchema>;
export type ProductForm = z.infer<typeof productSchema>;
export type CategoryForm = z.infer<typeof categorySchema>;
export type AddressForm = z.infer<typeof addressSchema>;
export type ReviewForm = z.infer<typeof reviewSchema>;
