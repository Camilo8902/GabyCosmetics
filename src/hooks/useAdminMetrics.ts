import { useQuery } from '@tanstack/react-query';
import { useProducts } from './useProducts';
import { useOrders } from './useOrders';
import { useUsers } from './useUsers';
import { startOfMonth, endOfMonth, subMonths, formatISO } from 'date-fns';
import type { OrderStatus } from '@/types';

export interface AdminMetrics {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  ordersByStatus: Record<OrderStatus, number>;
  revenueTrend: number; // % cambio
  ordersTrend: number;
  productsTrend: number;
  usersTrend: number;
  isLoading: boolean;
}

/**
 * Hook for fetching admin dashboard metrics
 */
export function useAdminMetrics() {
  const now = new Date();
  const currentMonthStart = startOfMonth(now);
  const currentMonthEnd = endOfMonth(now);
  const previousMonthStart = startOfMonth(subMonths(now, 1));
  const previousMonthEnd = endOfMonth(subMonths(now, 1));

  // Fetch current month data
  const { data: currentProducts, isLoading: productsLoading } = useProducts(
    { is_active: true },
    1,
    1
  );

  const { data: currentOrders, isLoading: ordersLoading } = useOrders(
    {
      startDate: formatISO(currentMonthStart),
      endDate: formatISO(currentMonthEnd),
    },
    1,
    1
  );

  const { data: currentUsers, isLoading: usersLoading } = useUsers(
    { isActive: true },
    1,
    1
  );

  // Fetch previous month data for trends
  const { data: previousOrders } = useOrders(
    {
      startDate: formatISO(previousMonthStart),
      endDate: formatISO(previousMonthEnd),
    },
    1,
    1
  );

  const { data: previousProducts } = useProducts({ is_active: true }, 1, 1);

  const { data: previousUsers } = useUsers({ isActive: true }, 1, 1);

  const isLoading = productsLoading || ordersLoading || usersLoading;

  // Calculate totals
  const totalProducts = currentProducts?.total || 0;
  const totalOrders = currentOrders?.total || 0;
  const totalUsers = currentUsers?.total || 0;

  // Calculate revenue from orders
  const totalRevenue =
    currentOrders?.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

  // Calculate orders by status
  const ordersByStatus: Record<OrderStatus, number> = {
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    refunded: 0,
  };

  currentOrders?.data?.forEach((order) => {
    if (order.status && order.status in ordersByStatus) {
      ordersByStatus[order.status as OrderStatus]++;
    }
  });

  // Calculate trends
  const previousOrdersCount = previousOrders?.total || 0;
  const previousProductsCount = previousProducts?.total || 0;
  const previousUsersCount = previousUsers?.total || 0;
  const previousRevenue =
    previousOrders?.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

  const ordersTrend =
    previousOrdersCount > 0
      ? ((totalOrders - previousOrdersCount) / previousOrdersCount) * 100
      : 0;

  const productsTrend =
    previousProductsCount > 0
      ? ((totalProducts - previousProductsCount) / previousProductsCount) * 100
      : 0;

  const usersTrend =
    previousUsersCount > 0
      ? ((totalUsers - previousUsersCount) / previousUsersCount) * 100
      : 0;

  const revenueTrend = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  return {
    totalProducts,
    totalOrders,
    totalUsers,
    totalRevenue,
    ordersByStatus,
    revenueTrend,
    ordersTrend,
    productsTrend,
    usersTrend,
    isLoading,
  };
}
