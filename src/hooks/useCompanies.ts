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
    queryFn: async () => {
      if (!id) return null;
      const result = await companyService.getCompanyById(id);
      return result.company;
    },
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
    queryFn: () => (userId ? companyService.getCompanyById(userId) : Promise.resolve(null)),
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
    mutationFn: async (company: Partial<Company>) => {
      const result = await companyService.createCompany(company);
      if (result.error) throw result.error;
      return result.company;
    },
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
    mutationFn: async ({ id, updates }: { id: string; updates: Partial<Company> }) => {
      const result = await companyService.updateCompany(id, updates);
      if (result.error) throw result.error;
      return result.company;
    },
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

/**
 * Hook for deleting a company (soft delete)
 */
export function useDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => companyService.deleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa eliminada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar la empresa');
    },
  });
}

/**
 * Hook for permanently deleting a company
 */
export function usePermanentDeleteCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => companyService.permanentDeleteCompany(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Empresa eliminada permanentemente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar la empresa');
    },
  });
}

/**
 * Hook for fetching company stats
 */
export function useCompanyStats(companyId: string | null) {
  return useQuery({
    queryKey: ['companyStats', companyId],
    queryFn: () => (companyId ? companyService.getCompanyStats(companyId) : null),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for fetching company products
 */
export function useCompanyProducts(companyId: string | null, page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['companyProducts', companyId, page, pageSize],
    queryFn: () => (companyId ? companyService.getCompanyProducts(companyId, page, pageSize) : null),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for fetching company orders
 */
export function useCompanyOrders(companyId: string | null, page = 1, pageSize = 10) {
  return useQuery({
    queryKey: ['companyOrders', companyId, page, pageSize],
    queryFn: () => (companyId ? companyService.getCompanyOrders(companyId, page, pageSize) : null),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for changing company plan
 */
export function useChangeCompanyPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, plan }: { id: string; plan: string }) =>
      companyService.changeCompanyPlan(id, plan as any),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
      toast.success('Plan actualizado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al cambiar el plan');
    },
  });
}

/**
 * Hook for admin updating company
 */
export function useAdminUpdateCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Company> }) =>
      companyService.adminUpdateCompany(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      queryClient.invalidateQueries({ queryKey: ['company', variables.id] });
      toast.success('Empresa actualizada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar la empresa');
    },
  });
}
