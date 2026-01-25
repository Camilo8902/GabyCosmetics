import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { categoryService } from '@/services/categoryService';
import type { Category } from '@/types';
import toast from 'react-hot-toast';

/**
 * Hook for fetching all categories
 */
export function useCategories(includeInactive = false) {
  return useQuery<Category[]>({
    queryKey: ['categories', includeInactive],
    queryFn: () => categoryService.getCategories(includeInactive),
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

/**
 * Hook for fetching a single category by ID
 */
export function useCategory(id: string | null) {
  return useQuery<Category | null>({
    queryKey: ['category', id],
    queryFn: () => (id ? categoryService.getCategoryById(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 1000 * 60 * 15,
  });
}

/**
 * Hook for fetching a single category by slug
 */
export function useCategoryBySlug(slug: string | null) {
  return useQuery<Category | null>({
    queryKey: ['category', 'slug', slug],
    queryFn: () => (slug ? categoryService.getCategoryBySlug(slug) : Promise.resolve(null)),
    enabled: !!slug,
    staleTime: 1000 * 60 * 15,
  });
}

/**
 * Hook for creating a category
 */
export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (category: Partial<Category>) => categoryService.createCategory(category),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoría creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la categoría');
    },
  });
}

/**
 * Hook for updating a category
 */
export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Category> }) =>
      categoryService.updateCategory(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      queryClient.invalidateQueries({ queryKey: ['category', variables.id] });
      toast.success('Categoría actualizada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar la categoría');
    },
  });
}

/**
 * Hook for deleting a category
 */
export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => categoryService.deleteCategory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      toast.success('Categoría eliminada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar la categoría');
    },
  });
}
