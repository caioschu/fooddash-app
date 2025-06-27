import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';
import { useToast } from './useToast';

interface Restaurant {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  categoria_culinaria: string;
  logo_url: string | null;
  is_matriz: boolean;
  matriz_id: string | null;
  group_id: string | null;
  group_name: string | null;
}

interface RestaurantGroup {
  id: string;
  nome: string;
  descricao: string | null;
  logo_url: string | null;
  restaurantes: Restaurant[];
}

interface RestaurantSelectorContextType {
  restaurants: Restaurant[];
  groups: RestaurantGroup[];
  selectedRestaurantId: string | null;
  selectedGroupId: string | null;
  isViewingAsGroup: boolean;
  isLoading: boolean;
  error: string | null;
  selectRestaurant: (id: string) => void;
  selectGroup: (id: string) => void;
  toggleViewMode: () => void;
  createRestaurant: (data: Partial<Restaurant>) => Promise<string | null>;
  createGroup: (name: string, description?: string) => Promise<string | null>;
  addRestaurantToGroup: (restaurantId: string, groupId: string) => Promise<boolean>;
  removeRestaurantFromGroup: (restaurantId: string, groupId: string) => Promise<boolean>;
  refreshData: () => Promise<void>;
}

const RestaurantSelectorContext = createContext<RestaurantSelectorContextType | null>(null);

export const useRestaurantSelector = () => {
  const context = useContext(RestaurantSelectorContext);
  if (!context) {
    throw new Error('useRestaurantSelector must be used within RestaurantSelectorProvider');
  }
  return context;
};

export const RestaurantSelectorProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [groups, setGroups] = useState<RestaurantGroup[]>([]);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [isViewingAsGroup, setIsViewingAsGroup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUserRestaurants();
    }
  }, [user]);

  const fetchUserRestaurants = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch all restaurants for the user
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .rpc('get_user_restaurants', { user_uuid: user.id });

      if (restaurantsError) throw restaurantsError;
      
      setRestaurants(restaurantsData || []);
      
      // If we have restaurants but none selected, select the first one
      if (restaurantsData && restaurantsData.length > 0 && !selectedRestaurantId) {
        setSelectedRestaurantId(restaurantsData[0].id);
      }
      
      // Fetch restaurant groups
      const { data: groupsData, error: groupsError } = await supabase
        .from('restaurant_groups')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativo', true);
        
      if (groupsError) throw groupsError;
      
      // For each group, get its member restaurants
      const groupsWithRestaurants = await Promise.all((groupsData || []).map(async (group) => {
        const { data: memberships, error: membershipError } = await supabase
          .from('restaurant_memberships')
          .select('restaurant_id')
          .eq('group_id', group.id);
          
        if (membershipError) throw membershipError;
        
        const groupRestaurants = restaurantsData?.filter(r => 
          memberships?.some(m => m.restaurant_id === r.id)
        ) || [];
        
        return {
          ...group,
          restaurantes: groupRestaurants
        };
      }));
      
      setGroups(groupsWithRestaurants);
      
    } catch (error) {
      console.error('Error fetching restaurants:', error);
      setError('Falha ao carregar restaurantes');
    } finally {
      setIsLoading(false);
    }
  };

  const selectRestaurant = (id: string) => {
    setSelectedRestaurantId(id);
    setIsViewingAsGroup(false);
    
    // Save selection to localStorage for persistence
    localStorage.setItem('selectedRestaurantId', id);
    localStorage.setItem('isViewingAsGroup', 'false');
  };

  const selectGroup = (id: string) => {
    setSelectedGroupId(id);
    setIsViewingAsGroup(true);
    
    // Save selection to localStorage for persistence
    localStorage.setItem('selectedGroupId', id);
    localStorage.setItem('isViewingAsGroup', 'true');
  };

  const toggleViewMode = () => {
    setIsViewingAsGroup(!isViewingAsGroup);
    localStorage.setItem('isViewingAsGroup', (!isViewingAsGroup).toString());
  };

  const createRestaurant = async (data: Partial<Restaurant>): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const { data: newRestaurant, error } = await supabase
        .from('restaurants')
        .insert([{
          ...data,
          user_id: user.id
        }])
        .select()
        .single();

      if (error) throw error;
      
      showSuccess('Restaurante criado com sucesso!');
      await fetchUserRestaurants();
      
      return newRestaurant.id;
    } catch (error) {
      console.error('Error creating restaurant:', error);
      showError('Erro ao criar restaurante', 'Verifique os dados e tente novamente.');
      return null;
    }
  };

  const createGroup = async (name: string, description?: string): Promise<string | null> => {
    if (!user) return null;
    
    try {
      const { data: newGroup, error } = await supabase
        .from('restaurant_groups')
        .insert([{
          user_id: user.id,
          nome: name,
          descricao: description || null
        }])
        .select()
        .single();

      if (error) throw error;
      
      showSuccess('Grupo criado com sucesso!');
      await fetchUserRestaurants();
      
      return newGroup.id;
    } catch (error) {
      console.error('Error creating group:', error);
      showError('Erro ao criar grupo', 'Verifique os dados e tente novamente.');
      return null;
    }
  };

  const addRestaurantToGroup = async (restaurantId: string, groupId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('restaurant_memberships')
        .insert([{
          restaurant_id: restaurantId,
          group_id: groupId
        }]);

      if (error) throw error;
      
      showSuccess('Restaurante adicionado ao grupo!');
      await fetchUserRestaurants();
      
      return true;
    } catch (error) {
      console.error('Error adding restaurant to group:', error);
      showError('Erro ao adicionar restaurante ao grupo', 'Tente novamente.');
      return false;
    }
  };

  const removeRestaurantFromGroup = async (restaurantId: string, groupId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('restaurant_memberships')
        .delete()
        .eq('restaurant_id', restaurantId)
        .eq('group_id', groupId);

      if (error) throw error;
      
      showSuccess('Restaurante removido do grupo!');
      await fetchUserRestaurants();
      
      return true;
    } catch (error) {
      console.error('Error removing restaurant from group:', error);
      showError('Erro ao remover restaurante do grupo', 'Tente novamente.');
      return false;
    }
  };

  const refreshData = async () => {
    await fetchUserRestaurants();
  };

  return (
    <RestaurantSelectorContext.Provider value={{
      restaurants,
      groups,
      selectedRestaurantId,
      selectedGroupId,
      isViewingAsGroup,
      isLoading,
      error,
      selectRestaurant,
      selectGroup,
      toggleViewMode,
      createRestaurant,
      createGroup,
      addRestaurantToGroup,
      removeRestaurantFromGroup,
      refreshData
    }}>
      {children}
    </RestaurantSelectorContext.Provider>
  );
};