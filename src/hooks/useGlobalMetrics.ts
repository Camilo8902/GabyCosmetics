import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

// Tipos para las métricas globales
export interface GlobalMetrics {
  totalCompanies: number;
  activeCompanies: number;
  pendingRequests: number;
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  monthlyRevenue: number;
  totalUsers: number;
  newUsersThisMonth: number;
}

export interface CompanyGrowth {
  date: string;
  new_companies: number;
  total_companies: number;
}

export interface RevenueByCompany {
  company_id: string;
  company_name: string;
  total_orders: number;
  total_revenue: number;
}

export interface TopProduct {
  product_id: string;
  product_name: string;
  company_name: string;
  total_sold: number;
  total_revenue: number;
}

/**
 * Hook para obtener métricas globales del sistema
 */
export function useGlobalMetrics() {
  return useQuery({
    queryKey: ['globalMetrics'],
    queryFn: async (): Promise<GlobalMetrics> => {
      // Ejecutar todas las consultas en paralelo
      const [
        companiesCount,
        activeCompaniesCount,
        pendingRequestsCount,
        productsCount,
        activeProductsCount,
        ordersCount,
        pendingOrdersCount,
        revenueData,
        usersCount,
        newUsersCount,
      ] = await Promise.all([
        // Total empresas
        supabase.from('companies').select('*', { count: 'exact', head: true }),
        // Empresas activas
        supabase.from('companies').select('*', { count: 'exact', head: true }).eq('is_active', true),
        // Solicitudes pendientes
        supabase.from('company_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        // Total productos
        supabase.from('products').select('*', { count: 'exact', head: true }),
        // Productos activos
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
        // Total pedidos
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        // Pedidos pendientes
        supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['pending', 'processing']),
        // Ingresos
        supabase.from('orders').select('total').eq('payment_status', 'paid'),
        // Total usuarios
        supabase.from('users').select('*', { count: 'exact', head: true }),
        // Nuevos usuarios este mes
        supabase.from('users').select('*', { count: 'exact', head: true }).gte('created_at', getStartOfMonth()),
      ]);

      const totalRevenue = revenueData.data?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      // Ingresos del mes actual
      const { data: monthlyRevenueData } = await supabase
        .from('orders')
        .select('total')
        .eq('payment_status', 'paid')
        .gte('created_at', getStartOfMonth());

      const monthlyRevenue = monthlyRevenueData?.reduce((sum, order) => sum + (order.total || 0), 0) || 0;

      return {
        totalCompanies: companiesCount.count || 0,
        activeCompanies: activeCompaniesCount.count || 0,
        pendingRequests: pendingRequestsCount.count || 0,
        totalProducts: productsCount.count || 0,
        activeProducts: activeProductsCount.count || 0,
        totalOrders: ordersCount.count || 0,
        pendingOrders: pendingOrdersCount.count || 0,
        totalRevenue,
        monthlyRevenue,
        totalUsers: usersCount.count || 0,
        newUsersThisMonth: newUsersCount.count || 0,
      };
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

/**
 * Hook para obtener crecimiento de empresas por mes
 */
export function useCompanyGrowth(months = 6) {
  return useQuery({
    queryKey: ['companyGrowth', months],
    queryFn: async (): Promise<CompanyGrowth[]> => {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - months);
      startDate.setDate(1);

      const { data, error } = await supabase
        .from('companies')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Agrupar por mes
      const monthlyData: Record<string, { new_companies: number }> = {};
      
      // Inicializar todos los meses
      for (let i = 0; i < months; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = { new_companies: 0 };
      }

      // Contar empresas por mes
      data?.forEach((company) => {
        const date = new Date(company.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        if (monthlyData[monthKey]) {
          monthlyData[monthKey].new_companies++;
        }
      });

      // Calcular total acumulado
      let runningTotal = 0;
      return Object.entries(monthlyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, data]) => {
          runningTotal += data.new_companies;
          return {
            date,
            new_companies: data.new_companies,
            total_companies: runningTotal,
          };
        });
    },
    staleTime: 1000 * 60 * 30, // 30 minutos
  });
}

/**
 * Hook para obtener ingresos por empresa
 */
export function useRevenueByCompany(limit = 10) {
  return useQuery({
    queryKey: ['revenueByCompany', limit],
    queryFn: async (): Promise<RevenueByCompany[]> => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          company_id,
          total,
          companies (
            name
          )
        `)
        .eq('payment_status', 'paid')
        .not('company_id', 'is', null);

      if (error) throw error;

      // Agrupar por empresa
      const companyMap = new Map<string, { name: string; orders: number; revenue: number }>();

      data?.forEach((order: any) => {
        const companyId = order.company_id;
        const companyName = order.companies?.name || 'Sin empresa';
        const total = order.total || 0;

        if (companyMap.has(companyId)) {
          const existing = companyMap.get(companyId)!;
          existing.orders++;
          existing.revenue += total;
        } else {
          companyMap.set(companyId, { name: companyName, orders: 1, revenue: total });
        }
      });

      // Ordenar por ingresos y limitar
      return Array.from(companyMap.entries())
        .map(([company_id, data]) => ({
          company_id,
          company_name: data.name,
          total_orders: data.orders,
          total_revenue: data.revenue,
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, limit);
    },
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
}

/**
 * Hook para obtener productos más vendidos globalmente
 */
export function useTopProductsGlobal(limit = 10) {
  return useQuery({
    queryKey: ['topProductsGlobal', limit],
    queryFn: async (): Promise<TopProduct[]> => {
      const { data, error } = await supabase
        .from('order_items')
        .select(`
          product_id,
          quantity,
          price,
          products (
            name,
            company_id,
            companies (
              name
            )
          )
        `);

      if (error) throw error;

      // Agrupar por producto
      const productMap = new Map<string, { name: string; company: string; sold: number; revenue: number }>();

      data?.forEach((item: any) => {
        const productId = item.product_id;
        const productName = item.products?.name || 'Producto eliminado';
        const companyName = item.products?.companies?.name || 'Sin empresa';
        const quantity = item.quantity || 0;
        const revenue = (item.price || 0) * quantity;

        if (productMap.has(productId)) {
          const existing = productMap.get(productId)!;
          existing.sold += quantity;
          existing.revenue += revenue;
        } else {
          productMap.set(productId, { name: productName, company: companyName, sold: quantity, revenue });
        }
      });

      // Ordenar por ventas y limitar
      return Array.from(productMap.entries())
        .map(([product_id, data]) => ({
          product_id,
          product_name: data.name,
          company_name: data.company,
          total_sold: data.sold,
          total_revenue: data.revenue,
        }))
        .sort((a, b) => b.total_sold - a.total_sold)
        .slice(0, limit);
    },
    staleTime: 1000 * 60 * 15, // 15 minutos
  });
}

/**
 * Hook para obtener actividad reciente del sistema
 */
export function useRecentActivity(limit = 20) {
  return useQuery({
    queryKey: ['recentActivity', limit],
    queryFn: async () => {
      const [orders, companies, products] = await Promise.all([
        supabase
          .from('orders')
          .select('id, created_at, total, status, users (full_name)')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('companies')
          .select('id, created_at, name, status')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('products')
          .select('id, created_at, name, is_active, companies (name)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      // Combinar y ordenar por fecha
      const activities: Array<{
        type: 'order' | 'company' | 'product';
        id: string;
        title: string;
        description: string;
        created_at: string;
        status?: string;
      }> = [];

      orders.data?.forEach((order: any) => {
        activities.push({
          type: 'order',
          id: order.id,
          title: `Nuevo pedido`,
          description: `Cliente: ${order.users?.full_name || 'N/A'} - $${order.total}`,
          created_at: order.created_at,
          status: order.status,
        });
      });

      companies.data?.forEach((company) => {
        activities.push({
          type: 'company',
          id: company.id,
          title: `Nueva empresa: ${company.name}`,
          description: `Estado: ${company.status}`,
          created_at: company.created_at,
          status: company.status,
        });
      });

      products.data?.forEach((product: any) => {
        activities.push({
          type: 'product',
          id: product.id,
          title: `Nuevo producto: ${product.name}`,
          description: `Empresa: ${product.companies?.name || 'N/A'}`,
          created_at: product.created_at,
          status: product.is_active ? 'active' : 'inactive',
        });
      });

      return activities.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ).slice(0, limit);
    },
    staleTime: 1000 * 60 * 2, // 2 minutos
  });
}

// Helper function
function getStartOfMonth(): string {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}
