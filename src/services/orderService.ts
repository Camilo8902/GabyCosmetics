import { supabase } from '@/lib/supabase';
import type { Order, OrderStatus, PaginatedResponse } from '@/types';

/**
 * Order Service
 * Handles all order-related operations with Supabase
 */
export const orderService = {
  /**
   * Get all orders with filters and pagination
   */
  async getOrders(
    filters?: {
      status?: OrderStatus;
      userId?: string;
      companyId?: string;
      startDate?: string;
      endDate?: string;
    },
    page = 1,
    pageSize = 20
  ): Promise<PaginatedResponse<Order>> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*, product:products(*)),
          user:users(*)
        `, { count: 'exact' });

      // Apply filters
      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      if (filters?.companyId) {
        query = query.in('id',
          supabase
            .from('order_items')
            .select('order_id')
            .eq('company_id', filters.companyId)
        );
      }

      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate);
      }

      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate);
      }

      // Apply sorting
      query = query.order('created_at', { ascending: false });

      // Apply pagination
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      const totalPages = count ? Math.ceil(count / pageSize) : 0;

      return {
        data: (data || []) as Order[],
        total: count || 0,
        page,
        pageSize,
        totalPages,
      };
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  },

  /**
   * Get a single order by ID
   */
  async getOrderById(id: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*, product:products(*)),
          user:users(*)
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      return data as Order;
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  },

  /**
   * Get order by order number
   */
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*, product:products(*)),
          user:users(*)
        `)
        .eq('order_number', orderNumber)
        .single();

      if (error) throw error;
      return data as Order;
    } catch (error) {
      console.error('Error fetching order by number:', error);
      return null;
    }
  },

  /**
   * Create a new order
   */
  async createOrder(order: Partial<Order>): Promise<Order> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .insert(order)
        .select()
        .single();

      if (error) throw error;
      return data as Order;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  /**
   * Update order status
   */
  async updateOrderStatus(id: string, status: OrderStatus, notes?: string): Promise<Order> {
    try {
      const updates: Partial<Order> = { status };
      if (notes) {
        updates.notes = notes;
      }

      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as Order;
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  /**
   * Cancel an order
   */
  async cancelOrder(id: string, reason?: string): Promise<Order> {
    return this.updateOrderStatus(id, 'cancelled', reason);
  },
};
