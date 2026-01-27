import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { ShippingForm, ShippingFormData } from '@/components/checkout/ShippingForm';
import { PaymentForm } from '@/components/checkout/PaymentForm';
import { ArrowLeft, CheckCircle2, Clock } from 'lucide-react';

type CheckoutStep = 'shipping' | 'payment' | 'review';

export function CheckoutPage() {
  console.log('📄 [CheckoutPage] Component rendering');
  
  try {
    const { user } = useAuthStore();
    const { items, getSubtotal, clearCart } = useCartStore();
    console.log('📄 [CheckoutPage] Stores accessed successfully');
    console.log('📦 [CheckoutPage] Cart items:', items);
    
    const total = getSubtotal();
    console.log('💰 [CheckoutPage] Total from getSubtotal():', total);

    const [step, setStep] = useState<CheckoutStep>('shipping');
    const [shippingData, setShippingData] = useState<ShippingFormData | null>(null);
    const [clientSecret, setClientSecret] = useState<string>('');
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [orderId, setOrderId] = useState<string>('');
    console.log('📄 [CheckoutPage] State initialized');

  // Si no está autenticado, redirigir a login
  useEffect(() => {
    if (!user) {
      console.warn('Usuario no autenticado, redirigiendo a login');
      window.location.href = '/login?redirect=/checkout';
    }
  }, [user]);

  // Si no hay items en carrito, redirigir a shop
  useEffect(() => {
    if (items.length === 0 && step === 'shipping') {
      window.location.href = '/shop';
    }
  }, [items, step]);

  // Cargar datos guardados
  useEffect(() => {
    const saved = localStorage.getItem('checkout_shipping');
    if (saved) {
      setShippingData(JSON.parse(saved));
    }
  }, []);

  const handleShippingSubmit = async (data: ShippingFormData) => {
    setShippingData(data);
    await createPaymentIntent(data);
  };

  const createPaymentIntent = async (shipping: ShippingFormData) => {
    try {
      setIsCreatingOrder(true);
      console.log('🔄 [CheckoutPage] Creating payment intent...');

      // Crear orden simplificada
      const mockOrderId = `order_${Date.now()}`;
      setOrderId(mockOrderId);
      console.log('📝 [CheckoutPage] Order created:', mockOrderId);

      // Simular clientSecret
      const mockClientSecret = `pi_test_${mockOrderId}`;
      setClientSecret(mockClientSecret);
      console.log('🔐 [CheckoutPage] Client secret set:', mockClientSecret);
      
      console.log('📊 [CheckoutPage] About to change step from shipping to payment');
      setStep('payment');
      console.log('✅ [CheckoutPage] Step changed to payment');

      console.log('Orden iniciada, procediendo al pago');
    } catch (error) {
      console.error('❌ [CheckoutPage] Error creando orden:', error);
    } finally {
      setIsCreatingOrder(false);
    }
  };

  const handlePaymentSuccess = () => {
    console.log('🎉 [CheckoutPage] Payment success handler called');
    console.log('📦 [CheckoutPage] Current orderId:', orderId);
    
    try {
      console.log('🧹 [CheckoutPage] Clearing cart...');
      clearCart();
      console.log('✅ [CheckoutPage] Cart cleared');
      
      console.log('🗑️ [CheckoutPage] Removing checkout_shipping from localStorage...');
      localStorage.removeItem('checkout_shipping');
      console.log('✅ [CheckoutPage] Checkout shipping removed');
      
      // Use window.location.href instead of navigate() to avoid Router context issues
      // This is a hard navigation which is more reliable
      const successUrl = `/checkout/success?orderId=${orderId}`;
      console.log('🌐 [CheckoutPage] Navigating to success page:', successUrl);
      window.location.href = successUrl;
      console.log('✅ [CheckoutPage] Navigation complete');
    } catch (error) {
      console.error('❌ [CheckoutPage] Error in payment success handler:', error);
      console.error('📍 Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      // Fallback
      console.log('🚨 [CheckoutPage] Fallback: navigating to failure page');
      window.location.href = '/checkout/failure';
    }
  };

  if (!user || items.length === 0) {
    return null;
  }

  console.log('📊 [CheckoutPage] Cart total:', total);
  
  // Ensure total is a valid number
  const validTotal = total && typeof total === 'number' && !isNaN(total) ? total : 0;
  console.log('📊 [CheckoutPage] Valid total:', validTotal);

  const TAX_RATE = 0.19;
  const subtotal = validTotal;
  const tax = subtotal * TAX_RATE;
  const finalTotal = subtotal + tax;

  console.log('💰 [CheckoutPage] Totals - subtotal:', subtotal, 'tax:', tax, 'final:', finalTotal);

    const steps: CheckoutStep[] = ['shipping', 'payment', 'review'];

    console.log('📄 [CheckoutPage] About to render JSX with step:', step);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-4">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => window.location.href = '/shop'}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-5 w-5" />
            Volver a tienda
          </button>
          <h1 className="text-3xl font-bold">Checkout</h1>
        </div>

        {/* Progress */}
        <div className="mb-8 flex items-center justify-between">
          {steps.map((s, idx) => (
            <div key={s} className="flex flex-1 items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-white font-bold ${
                  step === s ? 'bg-blue-600' : step > s ? 'bg-green-500' : 'bg-gray-300'
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
                  className={`mx-4 h-1 flex-1 ${step > s ? 'bg-green-500' : 'bg-gray-300'}`}
                />
              )}
            </div>
          ))}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
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
                        <p className="font-semibold text-green-900">¡Pago confirmado!</p>
                        <p className="text-sm text-green-700">Tu orden ha sido creada exitosamente</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600">
                    Número de orden: <span className="font-mono font-bold">{orderId}</span>
                  </p>
                  <button
                    onClick={() => window.location.href = '/'}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
                  >
                    Volver al inicio
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div>
            <div className="sticky top-8 bg-white rounded-lg shadow-md p-6">
              <h2 className="text-lg font-bold mb-4">Resumen de Orden</h2>

              {/* Items */}
              <div className="space-y-3 border-b pb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {item.name} <span className="text-xs">x{item.quantity}</span>
                    </span>
                    <span className="font-medium">
                      ${(
                        (item.price || 0) * (item.quantity || 0)
                      ).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="space-y-2 pt-4">
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
              <div className="rounded-lg bg-blue-50 p-3 mt-4">
                <div className="flex items-start gap-2">
                  <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-blue-900">
                    Tus datos están protegidos por Stripe. Nunca guardamos información de tarjeta.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    );
  } catch (error) {
    console.error('🔴 [CheckoutPage] Error rendering CheckoutPage:', error);
    console.error('📍 [CheckoutPage] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-12">
        <div className="mx-auto max-w-md px-4">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-2">Error en el Checkout</h1>
            <p className="text-gray-600 mb-6">Ha ocurrido un error al cargar la página de checkout.</p>
            <button
              onClick={() => window.location.href = '/shop'}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Volver a la tienda
            </button>
          </div>
        </div>
      </div>
    );
  }
}
