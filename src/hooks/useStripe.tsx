import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabase';

interface Subscription {
  id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  plan_name: string;
  plan_price: number;
  plan_interval: string;
  stripe_customer_id: string;
  stripe_subscription_id: string;
}

export const useStripe = () => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubscription();
    } else {
      setSubscription(null);
      setIsLoading(false);
    }
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) {
      setSubscription(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch subscription with increased timeout
      const fetchPromise = supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .limit(1);

      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Subscription fetch timeout')), 60000)
      );

      const { data, error: fetchError } = await Promise.race([
        fetchPromise,
        timeoutPromise
      ]) as any;

      if (fetchError) {
        console.error('Error fetching subscription:', fetchError);
        setError('Erro ao carregar dados da assinatura');
      } else {
        setSubscription(data && data.length > 0 ? data[0] : null);
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Erro ao carregar assinatura');
    } finally {
      setIsLoading(false);
    }
  };

  const hasActiveSubscription = () => {
    return !!subscription && subscription.status === 'active';
  };

  const isSubscriptionExpired = () => {
    if (!subscription) return true;
    return new Date(subscription.current_period_end) < new Date();
  };

  const getSubscriptionStatus = () => {
    if (!subscription) return 'inactive';
    if (isSubscriptionExpired()) return 'expired';
    return subscription.status;
  };

  const getDaysUntilExpiry = () => {
    if (!subscription) return 0;
    const expiryDate = new Date(subscription.current_period_end);
    const today = new Date();
    const diffTime = expiryDate.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return {
    subscription,
    isLoading,
    error,
    hasActiveSubscription,
    isSubscriptionExpired,
    getSubscriptionStatus,
    getDaysUntilExpiry,
    refetch: fetchSubscription
  };
};