/**
 * Stripe utilities for handling payments
 */

export async function createPaymentIntent(amount: number, orderId: string) {
  console.log('💳 [Stripe] Creating payment intent for order:', orderId, 'amount:', amount);

  try {
    // In a real application, you would call your backend API
    // For now, we'll use Stripe's test client secret
    // In production, replace this with a real API call to your backend
    
    const response = await fetch('/api/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to cents
        orderId,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create payment intent');
    }

    const data = await response.json();
    console.log('✅ [Stripe] Payment intent created:', data.clientSecret);
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
