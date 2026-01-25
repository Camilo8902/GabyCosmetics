import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { orderService } from '@/services/orderService';
import type { Order, OrderStatus, PaginatedResponse } from '@/types';
import toast from 'react-hot-toast';

interface OrderFilters {
  status?: OrderStatus;
  userId?: string;
  companyId?: string;
  startDate?: string;
  endDate?: string;
}

/**
 * Hook for fetching orders with filters and pagination
 */
export function useOrders(filters?: OrderFilters, page = 1, pageSize = 20) {
  return useQuery<PaginatedResponse<Order>>({
    queryKey: ['orders', filters, page, pageSize],
    queryFn: () => orderService.getOrders(filters, page, pageSize),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Hook for fetching a single order by ID
 */
export function useOrder(id: string | null) {
  return useQuery<Order | null>({
    queryKey: ['order', id],
    queryFn: () => (id ? orderService.getOrderById(id) : Promise.resolve(null)),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for fetching order by order number
 */
export function useOrderByNumber(orderNumber: string | null) {
  return useQuery<Order | null>({
    queryKey: ['order', 'number', orderNumber],
    queryFn: () => (orderNumber ? orderService.getOrderByNumber(orderNumber) : Promise.resolve(null)),
    enabled: !!orderNumber,
    staleTime: 1000 * 60 * 5,
  });
}

/**
 * Hook for updating order status
 */
export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status, notes }: { id: string; status: OrderStatus; notes?: string }) =>
      orderService.updateOrderStatus(id, status, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      toast.success('Estado del pedido actualizado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al actualizar el estado del pedido');
    },
  });
}

/**
 * Hook for canceling an order
 */
export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      orderService.cancelOrder(id, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['order', variables.id] });
      toast.success('Pedido cancelado');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al cancelar el pedido');
    },
  });
}
