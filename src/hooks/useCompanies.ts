import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyService } from '@/services/companyService';
import type { Company, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

interface CompanyFilters {
  isVerified?: boolean;
  isActive?: boolean;
  search?: string;
}

/**
 * Hook for fetching companies with filters and pagination
 */
export function useCompanies(filters?: CompanyFilters, page = 1, pageSize = 20) {
  return useQuery<PaginatedResponse<Company>>({
    queryKey: ['companies', filters, page, pageSize],
    queryFn: async () => {
      try {
        return await companyService.getCompanies(filters, page, pageSize);
      } catch (error: any) {
        console.error('Error en useCompanies:', error);
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
      if (error?.message?.includes('Auth') || error?.code === 'PGRST301') {
        return false;
      }
      return failureCount < 1;
    },
  });
}

/**
 * Hook for fetching a single company by ID
 */
export function useCompany(id: string | null) {
  return useQuery<Company | null>({
    queryKey: ['company', id],
    queryFn: () => (id ? companyService.getCompanyById(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for fetching company by user ID
 */
export function useCompanyByUserId(userId: string | null) {
  return useQuery<Company | null>({
    queryKey: ['company', 'user', userId],
    queryFn: () => (userId ? companyService.getCompanyByUserId(userId) : Promise.resolve(null)),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for creating a company
 */
export function useCreateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (company: Partial<Company>) => companyService.createCompany(company),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear la empresa');
    },
  });
}

/**
 * Hook for updating a company
 */
export function useUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Company> }) =>
      companyService.updateCompany(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
      toast.success('Empresa actualizada exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar la empresa');
    },
  });
}

/**
 * Hook for verifying a company
 */
export function useVerifyCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => companyService.verifyCompany(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', id] });
      toast.success('Empresa verificada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al verificar la empresa');
    },
  });
}

/**
 * Hook for toggling company active status
 */
export function useToggleCompanyActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      companyService.toggleCompanyActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
      toast.success(variables.isActive ? 'Empresa activada' : 'Empresa desactivada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al cambiar el estado de la empresa');
    },
  });
}
