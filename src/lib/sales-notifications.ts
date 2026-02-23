/**
 * Servicio de notificaciones de ventas
 * Gaby Cosmetics - Sistema de Pagos Seguro
 */

import { supabase } from './supabase';

// ==========================================
// TIPOS
// ==========================================

export interface SaleNotification {
  id: string;
  company_id: string;
  order_id: string;
  user_id?: string;
  type: 'new_sale' | 'payment_received' | 'transfer_completed' | 'refund_requested';
  title: string;
  message: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface NotificationPayload {
  company_id: string;
  order_id: string;
  user_id?: string;
  type: SaleNotification['type'];
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

// ==========================================
// CREAR NOTIFICACIONES
// ==========================================

/**
 * Crea una notificación de nueva venta para una empresa
 */
export async function notifyNewSale(
  companyId: string,
  orderId: string,
  orderDetails: {
    total: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    customer_email?: string;
  }
): Promise<void> {
  try {
    // Crear notificación en la base de datos
    const { error } = await supabase
      .from('notifications')
      .insert({
        company_id: companyId,
        order_id: orderId,
        type: 'new_sale',
        title: '¡Nueva venta recibida!',
        message: `Has recibido una nueva orden por $${orderDetails.total.toFixed(2)}`,
        data: {
          total: orderDetails.total,
          items_count: orderDetails.items.length,
          customer_email: orderDetails.customer_email,
        },
        read: false,
      });

    if (error) {
      console.error('Error creating sale notification:', error);
    }

    // Enviar email (si está configurado)
    await sendSaleEmail(companyId, orderId, orderDetails);

    console.log('✅ Sale notification created for company:', companyId);
  } catch (error) {
    console.error('Error in notifyNewSale:', error);
  }
}

/**
 * Notifica cuando una transferencia se completa
 */
export async function notifyTransferCompleted(
  companyId: string,
  orderId: string,
  amount: number
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        company_id: companyId,
        order_id: orderId,
        type: 'transfer_completed',
        title: 'Pago transferido',
        message: `Se han transferido $${amount.toFixed(2)} a tu cuenta`,
        data: {
          amount,
          transfer_date: new Date().toISOString(),
        },
        read: false,
      });

    if (error) {
      console.error('Error creating transfer notification:', error);
    }

    console.log('✅ Transfer notification created for company:', companyId);
  } catch (error) {
    console.error('Error in notifyTransferCompleted:', error);
  }
}

/**
 * Notifica cuando hay un reembolso
 */
export async function notifyRefundRequested(
  companyId: string,
  orderId: string,
  refundDetails: {
    amount: number;
    reason?: string;
  }
): Promise<void> {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        company_id: companyId,
        order_id: orderId,
        type: 'refund_requested',
        title: 'Solicitud de reembolso',
        message: `Se ha solicitado un reembolso de $${refundDetails.amount.toFixed(2)}`,
        data: {
          amount: refundDetails.amount,
          reason: refundDetails.reason,
        },
        read: false,
      });

    if (error) {
      console.error('Error creating refund notification:', error);
    }

    console.log('✅ Refund notification created for company:', companyId);
  } catch (error) {
    console.error('Error in notifyRefundRequested:', error);
  }
}

// ==========================================
// OBTENER NOTIFICACIONES
// ==========================================

/**
 * Obtiene las notificaciones de una empresa
 */
export async function getCompanyNotifications(
  companyId: string,
  options?: {
    limit?: number;
    unread_only?: boolean;
  }
): Promise<SaleNotification[]> {
  try {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (options?.limit) {
      query = query.limit(options.limit);
    }

    if (options?.unread_only) {
      query = query.eq('read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getCompanyNotifications:', error);
    return [];
  }
}

/**
 * Cuenta las notificaciones no leídas
 */
export async function getUnreadNotificationCount(
  companyId: string
): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('company_id', companyId)
      .eq('read', false);

    if (error) {
      console.error('Error counting notifications:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error in getUnreadNotificationCount:', error);
    return 0;
  }
}

/**
 * Marca una notificación como leída
 */
export async function markNotificationAsRead(
  notificationId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    if (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markNotificationAsRead:', error);
    return false;
  }
}

/**
 * Marca todas las notificaciones de una empresa como leídas
 */
export async function markAllNotificationsAsRead(
  companyId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('company_id', companyId)
      .eq('read', false);

    if (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in markAllNotificationsAsRead:', error);
    return false;
  }
}

// ==========================================
// EMAILS
// ==========================================

/**
 * Envía un email de notificación de venta
 * (Integración con servicio de email)
 */
async function sendSaleEmail(
  companyId: string,
  orderId: string,
  orderDetails: {
    total: number;
    items: Array<{ name: string; quantity: number; price: number }>;
    customer_email?: string;
  }
): Promise<void> {
  try {
    // Obtener email de la empresa
    const { data: company } = await supabase
      .from('companies')
      .select('email, company_name')
      .eq('id', companyId)
      .single();

    if (!company?.email) {
      console.log('Company has no email, skipping email notification');
      return;
    }

    // Aquí se integraría con el servicio de email (SendGrid, Resend, etc.)
    // Por ahora solo logueamos
    console.log('📧 Would send email to:', company.email);
    console.log('📧 Subject: Nueva venta en Gaby Cosmetics');
    console.log('📧 Order ID:', orderId);
    console.log('📧 Total:', orderDetails.total);
    console.log('📧 Items:', orderDetails.items.length);

    // TODO: Implementar envío real de email
    // await sendEmail({
    //   to: company.email,
    //   subject: '¡Nueva venta en Gaby Cosmetics!',
    //   template: 'new-sale',
    //   data: {
    //     company_name: company.company_name,
    //     order_id: orderId,
    //     total: orderDetails.total,
    //     items: orderDetails.items,
    //   },
    // });
  } catch (error) {
    console.error('Error sending sale email:', error);
  }
}

// ==========================================
// REALTIME SUBSCRIPTION
// ==========================================

/**
 * Suscribe a las notificaciones de una empresa en tiempo real
 */
export function subscribeToCompanyNotifications(
  companyId: string,
  onNewNotification: (notification: SaleNotification) => void
): () => void {
  const channel = supabase
    .channel(`notifications:${companyId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `company_id=eq.${companyId}`,
      },
      (payload) => {
        console.log('New notification received:', payload);
        onNewNotification(payload.new as SaleNotification);
      }
    )
    .subscribe();

  // Retornar función para desuscribir
  return () => {
    supabase.removeChannel(channel);
  };
}

// ==========================================
// HOOK HELPERS
// ==========================================

/**
 * Formatea una notificación para mostrar
 */
export function formatNotification(notification: SaleNotification): {
  title: string;
  message: string;
  timeAgo: string;
  icon: 'shopping-bag' | 'dollar-sign' | 'refresh-ccw' | 'alert-circle';
  color: 'green' | 'blue' | 'yellow' | 'red';
} {
  const timeAgo = getTimeAgo(notification.created_at);

  switch (notification.type) {
    case 'new_sale':
      return {
        title: notification.title,
        message: notification.message,
        timeAgo,
        icon: 'shopping-bag',
        color: 'green',
      };
    case 'payment_received':
    case 'transfer_completed':
      return {
        title: notification.title,
        message: notification.message,
        timeAgo,
        icon: 'dollar-sign',
        color: 'blue',
      };
    case 'refund_requested':
      return {
        title: notification.title,
        message: notification.message,
        timeAgo,
        icon: 'refresh-ccw',
        color: 'yellow',
      };
    default:
      return {
        title: notification.title,
        message: notification.message,
        timeAgo,
        icon: 'alert-circle',
        color: 'red',
      };
  }
}

/**
 * Calcula el tiempo transcurrido desde una fecha
 */
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) {
    return 'Hace un momento';
  }

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `Hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `Hace ${hours} hora${hours > 1 ? 's' : ''}`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  }

  const weeks = Math.floor(days / 7);
  return `Hace ${weeks} semana${weeks > 1 ? 's' : ''}`;
}
