/**
 * Stripe utilities for handling payments
 */

interface PaymentIntentOptions {
  amount: number;
  orderId: string;
  email?: string;
  metadata?: Record<string, string>;
}

interface PaymentIntentResponse {
  success: boolean;
  clientSecret: string;
  paymentIntentId: string;
}

export async function createPaymentIntent(options: PaymentIntentOptions): Promise<string> {
  const { amount, orderId, email, metadata } = options;

  console.log('💳 [Stripe] Creating payment intent for order:', orderId, 'amount:', amount);

  try {
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount,
        orderId,
        email,
        metadata,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create payment intent');
    }

    const data: PaymentIntentResponse = await response.json();
    console.log('✅ [Stripe] Payment intent created:', {
      id: data.paymentIntentId,
      clientSecret: data.clientSecret,
    });
    
    return data.clientSecret;
  } catch (error) {
    console.error('❌ [Stripe] Error creating payment intent:', error);
    throw error;
  }
}

export async function confirmPayment(
  stripe: any,
  clientSecret: string,
  cardElement: any
) {
  console.log('💳 [Stripe] Confirming payment with clientSecret:', clientSecret);

  try {
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card: cardElement,
        billing_details: {},
      },
    });

    if (result.error) {
      console.error('❌ [Stripe] Payment error:', result.error);
      throw new Error(result.error.message);
    }

    console.log('✅ [Stripe] Payment confirmed:', result.paymentIntent);
    return result.paymentIntent;
  } catch (error) {
    console.error('❌ [Stripe] Error confirming payment:', error);
    throw error;
  }
}
