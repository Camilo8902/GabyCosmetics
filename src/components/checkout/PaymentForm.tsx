import { useState } from 'react';

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

  console.log('💳 [PaymentForm] Rendering with:', {
    clientSecret,
    amount,
    stripeKey: stripeKey ? 'configured' : 'NOT configured'
  });

  const handlePayment = async () => {
    console.log('🛒 [PaymentForm] Payment button clicked');
    setIsLoading(true);
    try {
      // Simulated payment - call success callback
      console.log('⏳ [PaymentForm] Payment processing with client secret:', clientSecret);
      // Wait a bit then trigger success
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✨ [PaymentForm] Payment simulated, calling onSuccess callback');
      
      try {
        console.log('📞 [PaymentForm] Calling onSuccess()');
        onSuccess();
        console.log('✅ [PaymentForm] onSuccess() completed');
      } catch (err) {
        console.error('❌ [PaymentForm] Error in onSuccess():', err);
        console.error('📍 [PaymentForm] Error stack:', err instanceof Error ? err.stack : 'No stack trace');
        // Fallback to direct navigation
        console.log('🚨 [PaymentForm] Fallback: direct navigation to success page');
        window.location.href = `/checkout/success?orderId=test`;
      }
    } catch (error) {
      console.error('❌ [PaymentForm] Payment error:', error);
      console.error('📍 [PaymentForm] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      setIsLoading(false);
    }
  };

  if (!stripeKey) {
    console.warn('⚠️ [PaymentForm] Stripe not configured - VITE_STRIPE_PUBLIC_KEY is missing');
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
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition"
      >
        {isLoading ? 'Processing...' : `Pay $${(amount * 1.19).toFixed(2)}`}
      </button>
    </div>
  );
}

