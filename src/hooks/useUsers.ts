import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import type { User, UserRole, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  companyId?: string;
}

/**
 * Hook for fetching users with filters and pagination
 */
export function useUsers(filters?: UserFilters, page = 1, pageSize = 20) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['users', filters, page, pageSize],
    queryFn: async () => {
      try {
        return await userService.getUsers(filters, page, pageSize);
      } catch (error: any) {
        console.error('Error en useUsers:', error);
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
 * Hook for fetching a single user by ID
 */
export function useUser(id: string | null) {
  return useQuery<User | null>({
    queryKey: ['user', id],
    queryFn: () => (id ? userService.getUserById(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for creating a new user
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: {
      email: string;
      full_name: string;
      role: UserRole;
      phone?: string;
      company_id?: string;
      is_active?: boolean;
      password: string;
    }) => userService.createUser(userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear el usuario');
    },
  });
}

/**
 * Hook for updating a user
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<User> }) =>
      userService.updateUser(id, updates),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
      toast.success('Usuario actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el usuario');
    },
  });
}

/**
 * Hook for deleting a user (soft delete)
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario desactivado exitosamente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al desactivar el usuario');
    },
  });
}

/**
 * Hook for permanently deleting a user
 */
export function usePermanentDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => userService.permanentDeleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuario eliminado permanentemente');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar el usuario');
    },
  });
}

/**
 * Hook for updating user role
 */
export function useUpdateUserRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      userService.updateUserRole(id, role),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
      toast.success('Rol de usuario actualizado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el rol');
    },
  });
}

/**
 * Hook for toggling user active status
 */
export function useToggleUserActive() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      userService.toggleUserActive(id, isActive),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.id] });
      toast.success(variables.isActive ? 'Usuario activado' : 'Usuario desactivado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al cambiar el estado del usuario');
    },
  });
}

/**
 * Hook for assigning user to company
 */
export function useAssignUserToCompany() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, companyId }: { userId: string; companyId: string | null }) =>
      userService.assignUserToCompany(userId, companyId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['user', variables.userId] });
      toast.success(variables.companyId ? 'Usuario asignado a la empresa' : 'Usuario removido de la empresa');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al asignar el usuario');
    },
  });
}

/**
 * Hook for fetching users by company
 */
export function useCompanyUsers(companyId: string | null) {
  return useQuery<User[]>({
    queryKey: ['users', 'company', companyId],
    queryFn: () => (companyId ? userService.getUsersByCompany(companyId) : Promise.resolve([])),
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for checking if email exists
 */
export function useCheckEmailExists(email: string, enabled = false) {
  return useQuery<boolean>({
    queryKey: ['checkEmail', email],
    queryFn: () => userService.checkEmailExists(email),
    enabled: enabled && !!email,
    staleTime: 1000 * 60 * 5,
  });
}
