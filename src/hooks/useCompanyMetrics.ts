import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// Tipos para las métricas
export interface CompanyMetrics {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  lowStockProducts: number;
  totalCustomers: number;
}

export interface ProductSalesData {
  product_id: string;
  product_name: string;
  total_sold: number;
  total_revenue: number;
}

export interface RecentOrder {
  id: string;
  order_number: string;
  customer_name: string;
  total: number;
  status: string;
  created_at: string;
}

export interface RevenueData {
  date: string;
  revenue: number;
  orders: number;
}

/**
 * Hook para obtener el company_id del usuario actual
 */
export function useCompanyId() {
  const { user } = useAuthStore();
  
  const { data: companyUser, isLoading, error } = useQuery({
    queryKey: ['companyUser', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      
      const { data, error } = await supabase
        .from('company_users')
        .select('company_id, role, permissions')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();
      
      if (error) {
        console.error('Error fetching company user:', error);
        return null;
      }
      
      return data;
    },
    enabled: !!user?.id,
  });
  
  return {
    companyId: companyUser?.company_id || null,
    role: companyUser?.role || null,
    permissions: companyUser?.permissions || [],
    isLoading,
    error,
  };
}

/**
 * Hook para obtener métricas generales de la empresa
 */
export function useCompanyMetrics(companyId: string | null) {
  return useQuery({
    queryKey: ['companyMetrics', companyId],
    queryFn: async (): Promise<CompanyMetrics> => {
      if (!companyId) {
        return {
          totalProducts: 0,
          activeProducts: 0,
          totalOrders: 0,
          pendingOrders: 0,
          totalRevenue: 0,
          monthlyRevenue: 0,
          lowStockProducts: 0,
          totalCustomers: 0,
        };
      }

      // Obtener conteo de productos
      const { count: totalProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Obtener productos activos
      const { count: activeProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true);

      // Obtener pedidos totales de la empresa
      const { count: totalOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId);

      // Obtener pedidos pendientes
      const { count: pendingOrders } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .in('status', ['pending', 'processing']);

      // Obtener ingresos totales
      const { data: revenueData } = await supabase
        .from('orders')
        .select('total')
        .eq('company_id', companyId)
        .eq('payment_status', 'paid');

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      // Obtener ingresos del mes actual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { data: monthlyRevenueData } = await supabase
        .from('orders')
        .select('total')
        .eq('company_id', companyId)
        .eq('payment_status', 'paid')
        .gte('created_at', startOfMonth.toISOString());

      const monthlyRevenue = monthlyRevenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      // Obtener productos con bajo stock
      const { count: lowStockProducts } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('company_id', companyId)
        .eq('is_active', true)
        .lt('stock_quantity', 10);

      // Obtener clientes únicos
      const { data: ordersData } = await supabase
        .from('orders')
        .select('user_id')
        .eq('company_id', companyId)
        .not('user_id', 'is', null);

      const uniqueCustomers = new Set(ordersData?.map(o => o.user_id)).size;

      return {
        totalProducts: totalProducts || 0,
        activeProducts: activeProducts || 0,
        totalOrders: totalOrders || 0,
        pendingOrders: pendingOrders || 0,
        totalRevenue,
        monthlyRevenue,
        lowStockProducts: lowStockProducts || 0,
        totalCustomers: uniqueCustomers,
      };
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener los productos más vendidos
 */
export function useTopProducts(companyId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['topProducts', companyId, limit],
    queryFn: async (): Promise<ProductSalesData[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price,
          products!inner (
            id,
            name,
            company_id
          )
        `)
        .eq('products.company_id', companyId);

      if (error) {
        console.error('Error fetching top products:', error);
        return [];
      }

      // Agrupar por producto
      const productMap = new Map<string, { name: string; sold: number; revenue: number }>();
      
      data?.forEach((item: any) => {
        const productId = item.product_id;
        const productName = item.products?.name || 'Producto eliminado';
        const quantity = item.quantity || 0;
        const revenue = (item.price || 0) * quantity;

        if (productMap.has(productId)) {
          const existing = productMap.get(productId)!;
          existing.sold += quantity;
          existing.revenue += revenue;
        } else {
          productMap.set(productId, { name: productName, sold: quantity, revenue });
        }
      });

      // Ordenar por ventas y limitar
      return Array.from(productMap.entries())
        .map(([product_id, data]) => ({
          product_id,
          product_name: data.name,
          total_sold: data.sold,
          total_revenue: data.revenue,
        }))
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, limit);
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 10, // 10 minutos
  });
}

/**
 * Hook para obtener pedidos recientes de la empresa
 */
export function useRecentOrders(companyId: string | null, limit = 5) {
  return useQuery({
    queryKey: ['recentOrders', companyId, limit],
    queryFn: async (): Promise<RecentOrder[]> => {
      if (!companyId) return [];

      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          status,
          created_at,
          user_id,
          users (
            full_name,
            email
          )
        `)
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching recent orders:', error);
        return [];
      }

      return data?.map((order: any) => ({
        id: order.id,
        order_number: order.order_number || `#${order.id.slice(0, 8)}`,
        customer_name: order.users?.full_name || order.users?.email || 'Cliente',
        total: order.total || 0,
        status: order.status,
        created_at: order.created_at,
      })) || [];
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

/**
 * Hook para obtener datos de ingresos por día (últimos 30 días)
 */
export function useRevenueChart(companyId: string | null, days = 30) {
  return useQuery({
    queryKey: ['revenueChart', companyId, days],
    queryFn: async (): Promise<RevenueData[]> => {
      if (!companyId) return [];

      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      const { data, error } = await supabase
        .from('orders')
        .select('created_at, total')
        .eq('company_id', companyId)
        .eq('payment_status', 'paid')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching revenue chart:', error);
        return [];
      }

      // Agrupar por fecha
      const dateMap = new Map<string, { revenue: number; orders: number }>();
      
      // Inicializar todas las fechas
      for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        dateMap.set(dateStr, { revenue: 0, orders: 0 });
      }

      // Llenar con datos reales
      data?.forEach((order: any) => {
        const dateStr = order.created_at.split('T')[0];
        if (dateMap.has(dateStr)) {
          const existing = dateMap.get(dateStr)!;
          existing.revenue += order.total || 0;
          existing.orders += 1;
        }
      });

      return Array.from(dateMap.entries())
        .map(([date, data]) => ({
          date,
          revenue: data.revenue,
          orders: data.orders,
        }))
        .sort((a, b) => a.date.localeCompare(b.date));
    },
    enabled: !!companyId,
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
}

/**
 * Hook para obtener productos de la empresa con paginación
 */
export function useCompanyProducts(
  companyId: string | null,
  page = 1,
  pageSize = 10,
  filters?: { search?: string; status?: string; category?: string }
) {
  return useQuery({
    queryKey: ['companyProducts', companyId, page, pageSize, filters],
    queryFn: async () => {
      if (!companyId) return { data: [], total: 0, totalPages: 0 };

      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          slug,
          price,
          compare_at_price,
          stock_quantity,
          is_active,
          is_featured,
          images,
          created_at,
          product_categories (
            category_id,
            categories (
              id,
              name,
              slug
            )
          )
        `, { count: 'exact' })
        .eq('company_id', companyId);

      // Aplicar filtros
      if (filters?.search) {
        query = query.ilike('name', `%${filters.search}%`);
      }
      if (filters?.status === 'active') {
        query = query.eq('is_active', true);
      } else if (filters?.status === 'inactive') {
        query = query.eq('is_active', false);
      }
      if (filters?.category) {
        query = query.contains('category_ids', [filters.category]);
      }

      const { data, error, count } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching company products:', error);
        return { data: [], total: 0, totalPages: 0 };
      }

      return {
        data: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: !!companyId,
  });
}

/**
 * Hook para obtener pedidos de la empresa con paginación
 */
export function useCompanyOrders(
  companyId: string | null,
  page = 1,
  pageSize = 10,
  filters?: { status?: string; search?: string }
) {
  return useQuery({
    queryKey: ['companyOrders', companyId, page, pageSize, filters],
    queryFn: async () => {
      if (!companyId) return { data: [], total: 0, totalPages: 0 };

      let query = supabase
        .from('orders')
        .select(`
          id,
          order_number,
          total,
          status,
          payment_status,
          created_at,
          users (
            id,
            full_name,
            email
          )
        `, { count: 'exact' })
        .eq('company_id', companyId);

      // Aplicar filtros
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }
      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,users.full_name.ilike.%${filters.search}%`);
      }

      const { data, error, count } = await query
        .range((page - 1) * pageSize, page * pageSize - 1)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching company orders:', error);
        return { data: [], total: 0, totalPages: 0 };
      }

      return {
        data: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize),
      };
    },
    enabled: !!companyId,
  });
}
