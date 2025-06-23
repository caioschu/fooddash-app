import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { Database } from '../lib/supabase';

type Restaurant = Database['public']['Tables']['restaurants']['Row'];
type SalesChannel = Database['public']['Tables']['sales_channels']['Row'];
type PaymentMethod = Database['public']['Tables']['payment_methods']['Row'];

interface RestaurantContextType {
  restaurant: Restaurant | null;
  salesChannels: SalesChannel[];
  paymentMethods: PaymentMethod[];
  isLoading: boolean;
  error: string | null;
  updateRestaurant: (data: Partial<Restaurant>) => Promise<boolean>;
  addSalesChannel: (name: string, taxa: number) => Promise<boolean>;
  updateSalesChannel: (id: string, data: Partial<SalesChannel>) => Promise<boolean>;
  removeSalesChannel: (id: string) => Promise<boolean>;
  addPaymentMethod: (name: string, taxa: number) => Promise<boolean>;
  updatePaymentMethod: (id: string, data: Partial<PaymentMethod>) => Promise<boolean>;
  removePaymentMethod: (id: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType | null>(null);

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within RestaurantProvider');
  }
  return context;
};

export const RestaurantProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && user.tipo_usuario === 'restaurante') {
      fetchRestaurantData();
    }
  }, [user]);

  const fetchRestaurantData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      // Check if Supabase is properly configured
      if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
        setError('Supabase configuration is missing. Please check your environment variables.');
        return;
      }

      // Fetch restaurant data directly without connection test
      const { data: restaurantData, error: restaurantError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('user_id', user.id);

      if (restaurantError) {
        console.error('Error fetching restaurant:', restaurantError);
        setError(`Failed to fetch restaurant data: ${restaurantError.message}`);
        return;
      }

      // Set restaurant to first result or null if no results
      const restaurantRecord = restaurantData && restaurantData.length > 0 ? restaurantData[0] : null;
      setRestaurant(restaurantRecord);

      if (restaurantRecord) {
        // Fetch sales channels with error handling
        const { data: channelsData, error: channelsError } = await supabase
          .from('sales_channels')
          .select('*')
          .eq('restaurant_id', restaurantRecord.id)
          .order('created_at');

        if (channelsError) {
          console.error('Error fetching channels:', channelsError);
          // Don't set error state for channels, just log
        } else {
          setSalesChannels(channelsData || []);
        }

        // Fetch payment methods with error handling
        const { data: methodsData, error: methodsError } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('restaurant_id', restaurantRecord.id)
          .order('created_at');

        if (methodsError) {
          console.error('Error fetching payment methods:', methodsError);
          // Don't set error state for payment methods, just log
        } else {
          setPaymentMethods(methodsData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      let errorMessage = 'An unknown error occurred while fetching restaurant data';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Check for specific network errors
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('NetworkError')) {
        errorMessage = 'Unable to connect to the database. Please check your internet connection and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateRestaurant = async (data: Partial<Restaurant>): Promise<boolean> => {
    if (!user) return false;

    try {
      setError(null);
      
      if (restaurant) {
        // Update existing restaurant
        const { error } = await supabase
          .from('restaurants')
          .update(data)
          .eq('id', restaurant.id);

        if (error) throw error;
      } else {
        // Create new restaurant
        const { data: newRestaurant, error } = await supabase
          .from('restaurants')
          .insert([{ ...data, user_id: user.id }])
          .select()
          .single();

        if (error) throw error;
        setRestaurant(newRestaurant);
      }

      await refreshData();
      return true;
    } catch (error) {
      console.error('Error updating restaurant:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update restaurant';
      setError(errorMessage);
      return false;
    }
  };

  const addSalesChannel = async (name: string, taxa: number): Promise<boolean> => {
    if (!restaurant) return false;

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('sales_channels')
        .insert([{
          restaurant_id: restaurant.id,
          nome: name,
          taxa_percentual: taxa
        }])
        .select()
        .single();

      if (error) throw error;

      setSalesChannels(prev => [...prev, data]);
      return true;
    } catch (error) {
      console.error('Error adding sales channel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add sales channel';
      setError(errorMessage);
      return false;
    }
  };

  const updateSalesChannel = async (id: string, data: Partial<SalesChannel>): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('sales_channels')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      setSalesChannels(prev => 
        prev.map(channel => 
          channel.id === id ? { ...channel, ...data } : channel
        )
      );
      return true;
    } catch (error) {
      console.error('Error updating sales channel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update sales channel';
      setError(errorMessage);
      return false;
    }
  };

  const removeSalesChannel = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('sales_channels')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      setSalesChannels(prev => prev.filter(channel => channel.id !== id));
      return true;
    } catch (error) {
      console.error('Error removing sales channel:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove sales channel';
      setError(errorMessage);
      return false;
    }
  };

  const addPaymentMethod = async (name: string, taxa: number): Promise<boolean> => {
    if (!restaurant) return false;

    try {
      setError(null);
      
      const { data, error } = await supabase
        .from('payment_methods')
        .insert([{
          restaurant_id: restaurant.id,
          nome: name,
          taxa_percentual: taxa
        }])
        .select()
        .single();

      if (error) throw error;

      setPaymentMethods(prev => [...prev, data]);
      return true;
    } catch (error) {
      console.error('Error adding payment method:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to add payment method';
      setError(errorMessage);
      return false;
    }
  };

  const updatePaymentMethod = async (id: string, data: Partial<PaymentMethod>): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('payment_methods')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      setPaymentMethods(prev => 
        prev.map(method => 
          method.id === id ? { ...method, ...data } : method
        )
      );
      return true;
    } catch (error) {
      console.error('Error updating payment method:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update payment method';
      setError(errorMessage);
      return false;
    }
  };

  const removePaymentMethod = async (id: string): Promise<boolean> => {
    try {
      setError(null);
      
      const { error } = await supabase
        .from('payment_methods')
        .update({ ativo: false })
        .eq('id', id);

      if (error) throw error;

      setPaymentMethods(prev => prev.filter(method => method.id !== id));
      return true;
    } catch (error) {
      console.error('Error removing payment method:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove payment method';
      setError(errorMessage);
      return false;
    }
  };

  const refreshData = async () => {
    await fetchRestaurantData();
  };

  return (
    <RestaurantContext.Provider value={{
      restaurant,
      salesChannels,
      paymentMethods,
      isLoading,
      error,
      updateRestaurant,
      addSalesChannel,
      updateSalesChannel,
      removeSalesChannel,
      addPaymentMethod,
      updatePaymentMethod,
      removePaymentMethod,
      refreshData
    }}>
      {children}
    </RestaurantContext.Provider>
  );
};