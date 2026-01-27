import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { getOrder } from '@/lib/orders';

interface Order {
  id: string;
  total: number;
  status: string;
  created_at: string;
  items: any[];
  shipping_name: string;
  shipping_email: string;
}

export default function PaymentSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = searchParams.get('order_id');
  const paymentStatus = searchParams.get('status');

  useEffect(() => {
    if (!orderId) {
      setError('No se encontró el ID de la orden');
      setLoading(false);
      return;
    }

    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      if (!orderId) return;
      
      const orderData = await getOrder(orderId);
      setOrder(orderData);
    } catch (err) {
      console.error('Error fetching order:', err);
      setError('No se pudo cargar la información de tu orden');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center px-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600"></div>
          <p className="mt-4 text-gray-600">Cargando información de tu orden...</p>
        </div>
      </div>
    );
  }

  const isSuccess = paymentStatus === 'success' && order?.status === 'paid';

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white py-12 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          {isSuccess ? (
            <>
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                ¡Pago Exitoso!
              </h1>
              <p className="text-xl text-gray-600">
                Tu orden ha sido confirmada correctamente
              </p>
            </>
          ) : (
            <>
              <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Orden Pendiente
              </h1>
              <p className="text-xl text-gray-600">
                Tu pago está siendo procesado
              </p>
            </>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Order Details */}
        {order && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            {/* Order Number */}
            <div className="border-b pb-6 mb-6">
              <p className="text-sm text-gray-600 mb-1">Número de Orden</p>
              <p className="text-2xl font-bold text-gray-900">{order.id}</p>
            </div>

            {/* Order Items */}
            <div className="border-b pb-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Productos Ordenados
              </h2>
              <div className="space-y-3">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item: any, idx: number) => (
                    <div
                      key={idx}
                      className="flex justify-between items-center py-2"
                    >
                      <div>
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-sm text-gray-600">
                          Cantidad: {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-gray-900">
                        ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600">Sin productos</p>
                )}
              </div>
            </div>

            {/* Order Total */}
            <div className="border-b pb-6 mb-6">
              <div className="flex justify-between items-center">
                <p className="text-lg font-semibold text-gray-900">Total Pagado</p>
                <p className="text-3xl font-bold text-pink-600">
                  ${order.total.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="border-b pb-6 mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Información de Envío
              </h2>
              <div className="space-y-2">
                <p className="text-gray-700">
                  <span className="font-medium">Nombre:</span> {order.shipping_name}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Email:</span> {order.shipping_email}
                </p>
              </div>
            </div>

            {/* Order Status */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Estado de la Orden</p>
              <div className="flex items-center gap-3">
                {order.status === 'paid' ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-lg font-semibold text-green-600">
                      Pagada
                    </span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                    <span className="text-lg font-semibold text-yellow-600">
                      Pendiente
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Email */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <p className="text-blue-900">
            <span className="font-semibold">📧 Confirmación enviada:</span> Se ha
            enviado un email de confirmación a{' '}
            {order?.shipping_email || 'tu correo electrónico'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 justify-center">
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="min-w-[200px]"
          >
            Volver al Inicio
          </Button>
          <Button
            onClick={() => navigate('/shop')}
            className="min-w-[200px] bg-pink-600 hover:bg-pink-700"
          >
            Seguir Comprando
          </Button>
        </div>

        {/* Help Section */}
        <div className="mt-12 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            ¿Necesitas ayuda?
          </h3>
          <p className="text-gray-700 mb-4">
            Si tienes preguntas sobre tu orden o necesitas hacer cambios, no dudes
            en contactarnos:
          </p>
          <div className="space-y-2 text-gray-700">
            <p>📧 Email: contacto@gabycosmetics.com</p>
            <p>📱 WhatsApp: +1 (XXX) XXX-XXXX</p>
            <p>🕒 Horario de atención: Lunes a Viernes, 9AM - 6PM</p>
          </div>
        </div>
      </div>
    </div>
  );
}
