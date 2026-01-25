import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import type { User, UserRole, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

/**
 * Hook for fetching users with filters and pagination
 */
export function useUsers(filters?: UserFilters, page = 1, pageSize = 20) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ['users', filters, page, pageSize],
    queryFn: () => userService.getUsers(filters, page, pageSize),
    staleTime: 1000 * 60 * 5, // 5 minutes
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
