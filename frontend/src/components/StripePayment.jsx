import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { getStripeConfig, createStripePaymentIntent, confirmStripePayment } from '../services/payments';
import Button from './ui/Button';

/**
 * Stripe Payment Form Component
 * Handles the payment UI and Stripe integration
 */
function CheckoutForm({ paymentId, amount, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      console.warn('Stripe or Elements not ready');
      return;
    }

    setIsProcessing(true);
    setMessage('');

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/payments/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        setMessage(error.message);
        if (onError) onError(error);
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        // Payment succeeded in Stripe, now confirm with backend
        try {
          await confirmStripePayment(paymentId, paymentIntent.id);
          setMessage('Payment successful!');
          if (onSuccess) onSuccess(paymentIntent);
        } catch (backendError) {
          console.error('Backend confirmation error:', backendError);
          setMessage('Payment processed but confirmation failed. Please refresh the page.');
          // Still call onSuccess since payment went through
          if (onSuccess) onSuccess(paymentIntent);
        }
      }
    } catch (err) {
      console.error('Payment error:', err);
      setMessage('An unexpected error occurred.');
      if (onError) onError(err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      
      {message && (
        <div className={`p-3 rounded ${message.includes('successful') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {message}
        </div>
      )}

      <Button
        type="submit"
        disabled={!stripe || isProcessing}
        className="w-full"
      >
        {isProcessing ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </Button>
    </form>
  );
}

/**
 * Stripe Payment Component
 * Main component that loads Stripe and manages payment flow
 */
export default function StripePayment({ paymentId, amount, onSuccess, onCancel, onError }) {
  const [stripePromise, setStripePromise] = useState(null);
  const [clientSecret, setClientSecret] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Load Stripe publishable key
    const loadStripeKey = async () => {
      try {
        const config = await getStripeConfig();
        setStripePromise(loadStripe(config.publishableKey));
      } catch (err) {
        setError('Failed to load payment system');
        console.error('Failed to load Stripe:', err);
      }
    };

    loadStripeKey();
  }, []);

  useEffect(() => {
    // Create payment intent
    const initializePayment = async () => {
      if (!paymentId) return;

      try {
        setLoading(true);
        const { clientSecret } = await createStripePaymentIntent(paymentId);
        setClientSecret(clientSecret);
      } catch (err) {
        setError(err.message || 'Failed to initialize payment');
        console.error('Failed to create payment intent:', err);
      } finally {
        setLoading(false);
      }
    };

    if (stripePromise) {
      initializePayment();
    }
  }, [paymentId, stripePromise]);

  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#0070f3',
    },
  };

  const options = {
    clientSecret,
    appearance,
    paymentMethodOrder: ['card'], // Only show card payment option
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-3">Loading payment...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-600 mb-4">{error}</div>
        {onCancel && (
          <Button onClick={onCancel} variant="outline">
            Go Back
          </Button>
        )}
      </div>
    );
  }

  if (!clientSecret || !stripePromise) {
    return null;
  }

  return (
    <div>
      <Elements stripe={stripePromise} options={options}>
        <CheckoutForm
          paymentId={paymentId}
          amount={amount}
          onSuccess={onSuccess}
          onError={(error) => {
            setError(error.message);
            if (onError) onError(error);
          }}
        />
      </Elements>

      {onCancel && (
        <div className="mt-4">
          <Button onClick={onCancel} variant="outline" className="w-full">
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
