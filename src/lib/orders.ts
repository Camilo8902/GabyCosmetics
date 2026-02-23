import { supabase } from './supabase';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  sku?: string;
}

export interface ShippingInfo {
  name: string;
  email: string;
  phone?: string;
  address: string;
  city: string;
  zip?: string;
  country: string;
}

export interface CreateOrderData {
  userId: string;
  items: OrderItem[];
  shippingInfo: ShippingInfo;
  total: number;
  orderId?: string;
}

export async function createOrder(data: CreateOrderData) {
  console.log('📦 [Orders] Creating order in Supabase...', data);

  try {
    const { userId, items, shippingInfo, total } = data;

    // No proporcionar ID - dejar que Supabase genere el UUID automáticamente
    const { data: order, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        email: shippingInfo.email,
        total,
        status: 'pending',
        items: items,
        shipping_name: shippingInfo.name,
        shipping_email: shippingInfo.email,
        shipping_phone: shippingInfo.phone || null,
        shipping_address: shippingInfo.address,
        shipping_city: shippingInfo.city,
        shipping_zip: shippingInfo.zip || null,
        shipping_country: shippingInfo.country,
      })
      .select()
      .single();

    if (error) {
      console.error('❌ [Orders] Error creating order:', error);
      throw error;
    }

    console.log('✅ [Orders] Order created successfully:', order.id);
    return order;
  } catch (error) {
    console.error('❌ [Orders] Error saving order:', error);
    throw error;
  }
}

export async function updateOrderPaymentStatus(
  orderId: string,
  status: 'paid' | 'failed' | 'refunded',
  paymentIntentId?: string
) {
  console.log(`📦 [Orders] Updating order ${orderId} status to ${status}...`);

  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString(),
    };

    if (paymentIntentId) {
      updateData.payment_intent_id = paymentIntentId;
    }

    if (status === 'paid') {
      updateData.paid_at = new Date().toISOString();
    }

    const { data: order, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('❌ [Orders] Error updating order:', error);
      throw error;
    }

    console.log('✅ [Orders] Order updated successfully:', order.id);
    return order;
  } catch (error) {
    console.error('❌ [Orders] Error updating order status:', error);
    throw error;
  }
}

export async function getOrder(orderId: string) {
  console.log('📦 [Orders] Fetching order:', orderId);

  try {
    const { data: order, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) {
      console.error('❌ [Orders] Error fetching order:', error);
      throw error;
    }

    return order;
  } catch (error) {
    console.error('❌ [Orders] Error getting order:', error);
    throw error;
  }
}

export async function getUserOrders(userId: string) {
  console.log('📦 [Orders] Fetching orders for user:', userId);

  try {
    const { data: orders, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ [Orders] Error fetching user orders:', error);
      throw error;
    }

    return orders;
  } catch (error) {
    console.error('❌ [Orders] Error getting user orders:', error);
    throw error;
  }
}
