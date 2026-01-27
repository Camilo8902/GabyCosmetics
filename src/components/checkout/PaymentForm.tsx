import { useState } from 'react';
import { Button } from '@/components/ui/button';

interface PaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: () => void;
}

export function PaymentForm({
  clientSecret,
  amount,
  onSuccess,
}: PaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const stripeKey = import.meta.env.VITE_STRIPE_PUBLIC_KEY;

  const handlePayment = async () => {
    setIsLoading(true);
    try {
      // TODO: Integrate Stripe payment
      console.log('Payment processing with client secret:', clientSecret);
      // Simulated success for now
      setTimeout(() => {
        onSuccess();
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Payment error:', error);
      setIsLoading(false);
    }
  };

  if (!stripeKey) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-700">Stripe not configured yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold mb-4">Payment Method</h3>
      <div className="p-4 border rounded-lg bg-white">
        <p className="text-sm text-gray-600 mb-4">
          Monto a pagar: <strong>${(amount * 1.19).toFixed(2)}</strong> (incluido IVA)
        </p>
      </div>
      <Button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full"
        size="lg"
      >
        {isLoading ? 'Processing...' : `Pay $${(amount * 1.19).toFixed(2)}`}
      </Button>
    </div>
  );
}

