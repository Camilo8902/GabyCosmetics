import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY || '');

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}

function PaymentFormContent({
  clientSecret,
  amount,
  onSuccess,
}: PaymentFormProps) {
  console.log('💳 [PaymentFormContent] Rendering with clientSecret:', clientSecret);
  
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!stripe || !elements) {
      console.error('❌ Stripe or elements not loaded');
      setError('Stripe no está cargado');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('💳 [PaymentForm] Confirming payment with clientSecret:', clientSecret);
      
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(
        clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement)!,
            billing_details: {},
          },
        }
      );

      if (confirmError) {
        console.error('❌ Payment error:', confirmError);
        setError(confirmError.message || 'Error al procesar el pago');
        setIsLoading(false);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        console.log('✅ Payment successful:', paymentIntent);
        onSuccess();
      } else if (paymentIntent) {
        console.log('⏳ Payment status:', paymentIntent.status);
        setError(`Payment status: ${paymentIntent.status}`);
        setIsLoading(false);
      }
    } catch (err) {
      console.error('❌ Unexpected error:', err);
      setError('Error inesperado al procesar el pago');
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Información de Tarjeta</h3>
      
      <div className="p-4 border rounded-lg bg-white">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      <div className="p-4 border rounded-lg bg-white">
        <p className="text-sm text-gray-600 mb-4">
          Monto a pagar: <strong>${(amount * 1.19).toFixed(2)}</strong> (incluido IVA)
        </p>
      </div>

      <button
        type="submit"
        disabled={isLoading || !stripe}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition"
      >
        {isLoading ? 'Procesando pago...' : `Pagar $${(amount * 1.19).toFixed(2)}`}
      </button>

      <p className="text-xs text-gray-500 text-center">
        Los datos de tu tarjeta están protegidos por Stripe. Nunca guardamos información de tarjeta.
      </p>
    </form>
  );
}

export function PaymentForm({
  clientSecret,
  amount,
  onSuccess,
}: PaymentFormProps) {
  console.log('💳 [PaymentForm] Wrapper rendering');
  
  try {
    const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

    if (!stripeKey) {
      console.warn('⚠️ Stripe not configured - VITE_STRIPE_PUBLIC_KEY is missing');
      return (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-700 font-semibold">Stripe no está configurado</p>
          <p className="text-sm text-yellow-600 mt-2">
            Por favor, configura tu clave pública de Stripe en las variables de entorno.
          </p>
        </div>
      );
    }

    return (
      <Elements stripe={stripePromise}>
        <PaymentFormContent
          clientSecret={clientSecret}
          amount={amount}
          onSuccess={onSuccess}
        />
      </Elements>
  } catch (error) {
    console.error('🔴 [PaymentForm] Error rendering PaymentForm:', error);
    console.error('📍 [PaymentForm] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-700 font-semibold">Error al renderizar el formulario de pago</p>
      </div>
    );
  }
}

