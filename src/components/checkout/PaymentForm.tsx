import { useState } from 'react';
import {
  useStripe,
  useElements,
  PaymentElement,
  Elements,
} from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/js';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLIC_KEY
);

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}

function PaymentFormContent({ clientSecret, amount, onSuccess }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error('Error cargando Stripe');
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
        toast.error(error.message || 'Error en el pago');
      } else {
        onSuccess();
      }
    } catch (err) {
      console.error('Payment error:', err);
      toast.error('Error procesando pago');
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
