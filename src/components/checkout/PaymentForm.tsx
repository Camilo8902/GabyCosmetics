import { useState, useMemo } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}

interface PaymentFormContentProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}

function PaymentFormContent({ clientSecret, amount, onSuccess }: PaymentFormContentProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.error('Error cargando Stripe');
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/checkout/success`,
        },
      });

      if (error) {
        console.error('Payment error:', error.message);
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Método de Pago</h3>

      <div className="p-4 border rounded-lg bg-white">
        <PaymentElement />
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <p className="text-sm text-gray-700">
          <strong>Monto a pagar:</strong> ${(amount * 1.19).toFixed(2)} (incluido IVA)
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || !stripe}
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Procesando pago...' : `Pagar $${(amount * 1.19).toFixed(2)}`}
      </Button>

      <p className="text-xs text-gray-500 text-center">
        Tus datos de pago están seguros con Stripe
      </p>
    </form>
  );
}

export function PaymentForm({
  clientSecret,
  amount,
  onSuccess,
}: PaymentFormProps) {
  // Load Stripe inside component to handle missing env vars gracefully
  const stripePromise = useMemo(
    () => {
      const key = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
      if (!key) {
        console.error('VITE_STRIPE_PUBLIC_KEY not found in environment');
        return null;
      }
      return loadStripe(key);
    },
    []
  );

  if (!stripePromise) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-semibold">Error de Configuración</p>
        <p className="text-red-500 text-sm">Stripe no está configurado. Por favor intenta más tarde.</p>
      </div>
    );
  }

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          theme: 'stripe',
        },
      }}
    >
      <PaymentFormContent
        clientSecret={clientSecret}
        amount={amount}
        onSuccess={onSuccess}
      />
    </Elements>
  );
}
