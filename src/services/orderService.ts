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
        const { data: companyOrders } = await supabase
          .from('order_items')
          .select('order_id')
          .eq('company_id', filters.companyId);
        
        const orderIds = companyOrders?.map((item) => item.order_id) || [];
        if (orderIds.length > 0) {
          query = query.in('id', orderIds);
        } else {
          // Return empty result if no orders found for this company
          return {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          };
        }
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

      if (error) {
        console.error('Error en query de pedidos:', error);
        if (error.message?.includes('Auth') || error.code === 'PGRST301') {
          return {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0,
          };
        }
        throw error;
      }

      const totalPages = count ? Math.ceil(count / pageSize) : 0;

      return {
        data: (data || []) as Order[],
        total: count || 0,
        page,
        pageSize,
        totalPages,
      };
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (error?.message?.includes('Auth') || error?.code === 'PGRST301') {
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0,
        };
      }
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
      // Generate a unique order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      
      // Prepare order data with shipping info as JSONB
      const orderData: any = {
        ...order,
        order_number: orderNumber,
      };

      // If we have shipping data from CheckoutPage, convert it to JSONB format
      if (order.shipping_address || order.shipping_name) {
        orderData.shipping_address = {
          name: order.shipping_name,
          email: order.shipping_email,
          phone: order.shipping_phone,
          address: order.shipping_address,
          city: order.shipping_city,
          zip: order.shipping_zip,
        };
      }

      const { data, error } = await supabase
        .from('orders')
        .insert(orderData)
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
   * Create order items for an order
   */
  async createOrderItems(
    orderId: string,
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      total_price: number;
      product_name: string;
      product_image?: string;
      company_id?: string;
    }>
  ): Promise<void> {
    try {
      const itemsToInsert = items.map((item) => ({
        order_id: orderId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        product_name: item.product_name,
        product_image: item.product_image,
        company_id: item.company_id,
      }));

      const { error } = await supabase.from('order_items').insert(itemsToInsert);

      if (error) throw error;
    } catch (error) {
      console.error('Error creating order items:', error);
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
