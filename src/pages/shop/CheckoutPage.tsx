import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { ShippingForm, ShippingFormData } from '@/components/checkout/ShippingForm';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

type CheckoutStep = 'shipping' | 'payment' | 'review';

export function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { items, total, clearCart } = useCartStore();

  const [step, setStep] = useState<CheckoutStep>('shipping');
  const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);
  const [orderId, setOrderId] = useState<string>('');

  // Si no está autenticado, redirigir a login
  useEffect(() => {
    if (!user) {
      console.warn('Usuario no autenticado, redirigiendo a login');
      navigate('/login?redirect=/checkout');
    }
  }, [user, navigate]);

  // Si no hay items en carrito, redirigir a shop
  useEffect(() => {
    if (items.length === 0 && step === 'shipping') {
      navigate('/shop');
    }
  }, [items, navigate, step]);

  // Cargar datos guardados
  useEffect(() => {
    const saved = localStorage.getItem('checkout_shipping');
    if (saved) {
      setShippingData(JSON.parse(saved));
    }
  }, []);

  const handleShippingSubmit = async (data: ShippingFormData) => {
    setShippingData(data);
    // Crear orden y obtener clientSecret de Stripe
    await createPaymentIntent(data);
  };

  const createPaymentIntent = async (shipping: ShippingFormData) => {
    try {
      setIsCreatingOrder(true);

      // Crear orden simplificada (sin llamar a orderService en compilación)
      const mockOrderId = `order_${Date.now()}`;
      setOrderId(mockOrderId);

      // En producción, llamarías a tu servidor para crear payment intent
      // Por ahora, simulamos con un clientSecret mock
      const mockClientSecret = `pi_test_${mockOrderId}`;
      setClientSecret(mockClientSecret);
      setStep('payment');

      console.log('Orden iniciada, procediendo al pago');
    } catch (error) {
      console.error('Error creando orden:', error);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentSuccess = async () => {
    try {
      // Actualizar orden con estado confirmed
      // TODO: Implementar actualización en orderService
      clearCart();
      localStorage.removeItem('checkout_shipping');
      setStep('review');
      navigate(`/checkout/success?orderId=${orderId}`);
    } catch (error) {
      console.error('Error confirmando pago:', error);
    }
  };

  if (!user || items.length === 0) {
    return null;
  }

  const TAX_RATE = 0.19; // IVA 19%
  const subtotal = total;
  const tax = subtotal * TAX_RATE;
  const finalTotal = subtotal + tax;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
      <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/shop')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la tienda
          </Button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        {/* Stepper */}
        <div className="mb-8 flex items-center justify-between">
          {(['shipping', 'payment', 'review'] as const).map((s, idx) => (
            <div key={s} className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold text-white ${
                  step === s
                    ? 'bg-blue-600'
                    : step > s
                      ? 'bg-green-500'
                      : 'bg-gray-300'
                }`}
              >
                {step > s ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {s === 'shipping' ? 'Envío' : s === 'payment' ? 'Pago' : 'Confirmación'}
                </p>
              </div>
              {idx < 2 && (
                <div
                  className={`mx-4 h-1 flex-1 ${
                    step > s ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Contenido principal */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-6">
                {step === 'shipping' && (
                  <ShippingForm
                    onNext={handleShippingSubmit}
                    initialData={shippingData || undefined}
                  />
                )}

                {step === 'payment' && clientSecret && (
                  <PaymentForm
                    clientSecret={clientSecret}
                    amount={subtotal}
                    onSuccess={handlePaymentSuccess}
                  />
                )}

                {step === 'review' && (
                  <div className="space-y-4">
                    <div className="rounded-lg bg-green-50 p-4">
                      <div className="flex items-center">
                        <CheckCircle2 className="mr-3 h-6 w-6 text-green-600" />
                        <div>
                          <p className="font-semibold text-green-900">
                            ¡Pago confirmado!
                          </p>
                          <p className="text-sm text-green-700">
                            Tu orden ha sido creada exitosamente
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-gray-600">
                      Número de orden: <span className="font-mono font-bold">{orderId}</span>
                    </p>
                    <Button onClick={() => navigate('/')} className="w-full">
                      Volver al inicio
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Resumen de orden (sidebar) */}
          <div>
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">Resumen de Orden</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3 border-b pb-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-gray-600">
                        {item.name} <span className="text-xs">x{item.quantity}</span>
                      </span>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Totals */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Envío</span>
                    <span className="text-green-600 font-medium">Gratis</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA (19%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                {/* Info */}
                <div className="rounded-lg bg-blue-50 p-3">
                  <div className="flex items-start gap-2">
                    <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-900">
                      Tus datos están protegidos por Stripe. Nunca guardamos información de tarjeta.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
