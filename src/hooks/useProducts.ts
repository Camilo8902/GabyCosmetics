import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';
import type { Product, ProductFilters, PaginatedResponse } from '@/types';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

/**
 * Hook for fetching products with filters and pagination
 */

/**
 * Hook for fetching products with filters and pagination
 */
export function useProducts(filters?: ProductFilters, page = 1, pageSize = 20) {
  return useQuery<PaginatedResponse<Product>>({
    queryKey: ['products', filters, page, pageSize],
    queryFn: async () => {
      try {
        const result = await productService.getProducts(filters, page, pageSize);
        return result;
      } catch (error: any) {
        console.error('Error en useProducts:', error);
        // Return empty result instead of throwing
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry on auth errors
      if (error?.message?.includes('Auth') || error?.code === 'PGRST301') {
        return false;
      }
      return failureCount < 1;
    },
  });
}

/**
 * Hook for fetching a single product by ID
 */
export function useProduct(id: string | null) {
  return useQuery<Product | null>({
    queryKey: ['product', id],
    queryFn: () => (id ? productService.getProductById(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for fetching a single product by slug
 */
export function useProductBySlug(slug: string | null) {
  return useQuery<Product | null>({
    queryKey: ['product', 'slug', slug],
    queryFn: () => (slug ? productService.getProductBySlug(slug) : Promise.resolve(null)),
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for fetching featured products
 */
export function useFeaturedProducts(limit = 8) {
  return useQuery<Product[]>({
    queryKey: ['products', 'featured', limit],
    queryFn: () => productService.getFeaturedProducts(limit),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // Keep cache for 1 hour
  });
}

/**
 * Hook for fetching best sellers
 */
export function useBestSellers(limit = 8) {
  return useQuery<Product[]>({
    queryKey: ['products', 'best-sellers', limit],
    queryFn: () => productService.getBestSellers(limit),
    staleTime: 1000 * 60 * 30, // 30 minutes
    gcTime: 1000 * 60 * 60, // Keep cache for 1 hour
  });
}

/**
 * Hook for creating a product
 */
export function useCreateProduct() {
  const queryClient = useQueryClient();
  const { user, isCompany } = useAuthStore();

  return useMutation({
    mutationFn: async (product: Partial<Product>) => {
      // Get company_id from user or product
      let companyId = product.company_id;
      
      // If user is a company owner, use their company_id
      if (!companyId && isCompany()) {
        companyId = user?.company_id;
      }
      
      if (!companyId) {
        throw new Error('Se requiere company_id para crear un producto');
      }
      
      return productService.createProduct(companyId, product);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el producto');
    },
  });
}

/**
 * Hook for updating a product
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Product> }) =>
      productService.updateProduct(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', variables.id] });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el producto');
    },
  });
}

/**
 * Hook for deleting a product
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => productService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el producto');
    },
  });
}

/**
 * Hook for uploading product images
 */
export function useUploadProductImage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, file, isPrimary }: { productId: string; file: File; isPrimary?: boolean }) =>
      productService.uploadProductImage(productId, file, isPrimary),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Imagen subida exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al subir la imagen');
    },
  });
}

/**
 * Hook for setting product categories
 */
export function useSetProductCategories() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, categoryIds }: { productId: string; categoryIds: string[] }) =>
      productService.setProductCategories(productId, categoryIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['product', variables.productId] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar categorías');
    },
  });
}
