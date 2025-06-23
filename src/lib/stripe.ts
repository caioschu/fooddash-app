import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!stripePublishableKey) {
  console.warn('VITE_STRIPE_PUBLISHABLE_KEY is not defined');
}

export const stripePromise = loadStripe(stripePublishableKey || '');

// Produtos e preços do Stripe - ATUALIZE COM SEUS PRICE IDs REAIS
export const STRIPE_PRODUCTS = {
  monthly: {
    priceId: 'price_1Rb5BMGahqHLIkEZvkUYwIQf', // Substitua pelo Price ID real do plano mensal
    name: 'Plano Mensal',
    price: 149.90,
    interval: 'month',
    description: 'Acesso completo à plataforma FoodDash'
  },
  semestral: {
    priceId: 'price_1Rb5CuGahqHLIkEZXToyfl76', // Substitua pelo Price ID real do plano semestral
    name: 'Plano Semestral',
    price: 129.90,
    interval: '6 months',
    description: 'Acesso completo com 13% de desconto'
  },
  anual: {
    priceId: 'price_1Rb5DPGahqHLIkEZHys5esYL', // Substitua pelo Price ID real do plano anual
    name: 'Plano Anual', 
    price: 99.90,
    interval: 'year',
    description: 'Acesso completo com 33% de desconto'
  }
};

export const createCheckoutSession = async (priceId: string, customerEmail?: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        priceId,
        customerEmail,
        successUrl: `${window.location.origin}/dashboard?payment=success`,
        cancelUrl: `${window.location.origin}/pricing?payment=cancelled`
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create checkout session');
    }

    const { sessionId } = await response.json();
    
    const stripe = await stripePromise;
    if (!stripe) {
      throw new Error('Stripe failed to load');
    }

    const { error } = await stripe.redirectToCheckout({ sessionId });
    
    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
};

export const createPortalSession = async (customerId: string) => {
  try {
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-portal-session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({
        customerId,
        returnUrl: `${window.location.origin}/dashboard`
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to create portal session');
    }

    const { url } = await response.json();
    window.location.href = url;
  } catch (error) {
    console.error('Error creating portal session:', error);
    throw error;
  }
};