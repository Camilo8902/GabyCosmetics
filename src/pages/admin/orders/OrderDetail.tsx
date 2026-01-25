import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Package, User, MapPin, CreditCard, Send } from 'lucide-react';
import { useOrder, useUpdateOrderStatus } from '@/hooks';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { formatCurrency, formatDate, formatDateTime } from '@/utils/formatters';
import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/utils/constants';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';

export function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { i18n } = useTranslation();
  const { data: order, isLoading } = useOrder(id || null);
  const updateStatus = useUpdateOrderStatus();
  const [newStatus, setNewStatus] = useState<string>('');

  const handleStatusUpdate = async () => {
    if (!id || !newStatus) return;
    try {
      await updateStatus.mutateAsync({
        id,
        status: newStatus as any,
      });
      setNewStatus('');
      toast.success('Estado del pedido actualizado');
    } catch (error) {
      // Error handled by hook
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Pedido no encontrado</p>
        <Link
          to="/admin/orders"
          className="mt-4 text-rose-600 hover:underline"
        >
          Volver a la lista
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/orders"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Pedido {order.order_number || order.id.slice(0, 8)}
            </h1>
            <p className="text-gray-600 mt-1">
              {formatDateTime(order.created_at)}
            </p>
          </div>
        </div>
        <StatusBadge
          status={order.status}
          locale={i18n.language as 'es' | 'en'}
          size="lg"
        />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Items del Pedido
            </h2>
            <div className="space-y-4">
              {order.items?.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  {item.product?.images?.[0]?.url && (
                    <img
                      src={item.product.images[0].url}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{item.product?.name || 'Producto'}</p>
                    {item.variant_name && (
                      <p className="text-sm text-gray-500">Variante: {item.variant_name}</p>
                    )}
                    <p className="text-sm text-gray-500">
                      Cantidad: {item.quantity} × {formatCurrency(item.price || item.unit_price || 0)}
                    </p>
                  </div>
                  <p className="font-bold text-gray-900">
                    {formatCurrency((item.price || item.unit_price || 0) * item.quantity)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Resumen</h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal</span>
                <span className="text-gray-900">
                  {formatCurrency(order.subtotal || order.total || 0)}
                </span>
              </div>
              {order.shipping_cost && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Envío</span>
                  <span className="text-gray-900">{formatCurrency(order.shipping_cost)}</span>
                </div>
              )}
              {(order.tax_amount || order.tax) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Impuestos</span>
                  <span className="text-gray-900">{formatCurrency(order.tax_amount || order.tax || 0)}</span>
                </div>
              )}
              {(order.discount_amount || order.discount) && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Descuento</span>
                  <span className="text-red-600">-{formatCurrency(order.discount_amount || order.discount || 0)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t">
                <span className="text-lg font-bold text-gray-900">Total</span>
                <span className="text-lg font-bold text-gray-900">
                  {formatCurrency(order.total || 0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Customer Info */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5" />
              Cliente
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nombre</p>
                <p className="font-medium text-gray-900">
                  {order.user?.full_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-sm text-gray-900">{order.user?.email || 'N/A'}</p>
              </div>
              {order.user?.phone && (
                <div>
                  <p className="text-sm text-gray-500">Teléfono</p>
                  <p className="text-sm text-gray-900">{order.user.phone}</p>
                </div>
              )}
            </div>
          </div>

          {/* Shipping Address */}
          {order.shipping_address && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Dirección de Envío
              </h2>
              <div className="text-sm text-gray-600 whitespace-pre-line">
                {order.shipping_address}
              </div>
            </div>
          )}

          {/* Payment Info */}
          {order.payment && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Pago
              </h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Método</span>
                  <span className="text-gray-900">{order.payment.method || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Estado</span>
                  <span className="text-gray-900">{order.payment.status || 'N/A'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Update Status */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Actualizar Estado</h2>
            <div className="space-y-3">
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="">Seleccionar nuevo estado</option>
                {Object.values(ORDER_STATUSES).map((status) => (
                  <option key={status} value={status}>
                    {ORDER_STATUS_LABELS[status]?.[i18n.language as 'es' | 'en'] || status}
                  </option>
                ))}
              </select>
              <button
                onClick={handleStatusUpdate}
                disabled={!newStatus || updateStatus.isPending}
                className="w-full px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                {updateStatus.isPending ? 'Actualizando...' : 'Actualizar Estado'}
              </button>
            </div>
          </div>

          {/* Metadata */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Información</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Creado</span>
                <span className="text-gray-900">{formatDate(order.created_at)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Actualizado</span>
                <span className="text-gray-900">{formatDate(order.updated_at)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
