import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  Building2, 
  DollarSign, 
  TrendingUp, 
  CreditCard, 
  BarChart3, 
  Calendar, 
  Users, 
  ShoppingCart,
  ArrowUp,
  ArrowDown,
  Percent,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useRestaurantSelector } from '../../hooks/useRestaurantSelector';
import { useDateFilter } from '../../hooks/useDateFilter';
import { DateFilterSelector } from '../../components/Common/DateFilterSelector';
import { RestaurantSelector } from '../../components/Restaurant/RestaurantSelector';

interface GroupData {
  total_restaurants: number;
  total_revenue: number;
  total_expenses: number;
  total_profit: number;
  average_ticket: number;
  total_orders: number;
}

interface RestaurantData {
  id: string;
  nome: string;
  logo_url: string | null;
  cidade: string;
  estado: string;
  revenue: number;
  expenses: number;
  profit: number;
  orders: number;
  ticket: number;
}

export const GroupDashboard: React.FC = () => {
  const { groups, selectedGroupId } = useRestaurantSelector();
  const { getDateRange, getFilterLabel } = useDateFilter();
  const [searchParams] = useSearchParams();
  
  const [isLoading, setIsLoading] = useState(true);
  const [groupData, setGroupData] = useState<GroupData | null>(null);
  const [restaurantsData, setRestaurantsData] = useState<RestaurantData[]>([]);
  const [sortField, setSortField] = useState<string>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  
  // Get group ID from URL or context
  const groupId = searchParams.get('group') || selectedGroupId;
  const selectedGroup = groups.find(g => g.id === groupId);
  
  useEffect(() => {
    if (groupId) {
      fetchGroupData();
      fetchRestaurantsData();
    }
  }, [groupId]);
  
  const fetchGroupData = async () => {
    if (!groupId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .rpc('get_restaurant_group_data', { group_uuid: groupId });
        
      if (error) throw error;
      
      setGroupData(data[0] || null);
    } catch (error) {
      console.error('Error fetching group data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const fetchRestaurantsData = async () => {
    if (!groupId) return;
    
    try {
      const { start, end } = getDateRange();
      
      // Get restaurants in this group
      const { data: memberships, error: membershipError } = await supabase
        .from('restaurant_memberships')
        .select('restaurant_id')
        .eq('group_id', groupId);
        
      if (membershipError) throw membershipError;
      
      if (!memberships || memberships.length === 0) {
        setRestaurantsData([]);
        return;
      }
      
      const restaurantIds = memberships.map(m => m.restaurant_id);
      
      // Get restaurant details
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, nome, logo_url, cidade, estado')
        .in('id', restaurantIds);
        
      if (restaurantsError) throw restaurantsError;
      
      // For each restaurant, get sales and expenses data
      const restaurantsWithData = await Promise.all((restaurants || []).map(async (restaurant) => {
        // Get sales
        const { data: sales, error: salesError } = await supabase
          .from('sales')
          .select('valor_bruto, numero_pedidos')
          .eq('restaurant_id', restaurant.id)
          .gte('data', start)
          .lte('data', end);
          
        if (salesError) throw salesError;
        
        // Get expenses
        const { data: expenses, error: expensesError } = await supabase
          .from('expenses')
          .select('valor')
          .eq('restaurant_id', restaurant.id)
          .gte('data', start)
          .lte('data', end);
          
        if (expensesError) throw expensesError;
        
        // Calculate metrics
        const revenue = sales?.reduce((sum, sale) => sum + sale.valor_bruto, 0) || 0;
        const expensesTotal = expenses?.reduce((sum, expense) => sum + expense.valor, 0) || 0;
        const profit = revenue - expensesTotal;
        const orders = sales?.reduce((sum, sale) => sum + sale.numero_pedidos, 0) || 0;
        const ticket = orders > 0 ? revenue / orders : 0;
        
        return {
          ...restaurant,
          revenue,
          expenses: expensesTotal,
          profit,
          orders,
          ticket
        };
      }));
      
      setRestaurantsData(restaurantsWithData);
    } catch (error) {
      console.error('Error fetching restaurants data:', error);
    }
  };
  
  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Render sort icon
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 inline-block ml-1" /> 
      : <ArrowDown className="w-4 h-4 inline-block ml-1" />;
  };
  
  // Sort restaurants data
  const sortedRestaurants = [...restaurantsData].sort((a, b) => {
    if (sortField === 'nome') {
      return sortDirection === 'asc' 
        ? a.nome.localeCompare(b.nome)
        : b.nome.localeCompare(a.nome);
    } else {
      const aValue = a[sortField as keyof RestaurantData] as number;
      const bValue = b[sortField as keyof RestaurantData] as number;
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });
  
  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados da rede...</p>
        </div>
      </div>
    );
  }
  
  if (!selectedGroup) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Rede não encontrada</h2>
          <p className="text-gray-600 mb-4">A rede selecionada não foi encontrada ou você não tem permissão para acessá-la.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
              {selectedGroup.logo_url ? (
                <img src={selectedGroup.logo_url} alt={selectedGroup.nome} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-5 h-5 text-blue-600" />
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{selectedGroup.nome}</h1>
              <p className="text-gray-600">Visão consolidada da rede • {getFilterLabel()}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <RestaurantSelector />
          <DateFilterSelector />
        </div>
      </div>

      {/* Summary Cards */}
      {groupData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              R$ {groupData.total_revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-sm text-gray-600">Faturamento Total</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              R$ {groupData.total_expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-sm text-gray-600">Despesas Totais</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              R$ {groupData.total_profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-sm text-gray-600">Lucro Total</p>
            <p className="text-xs text-gray-500 mt-1">
              Margem: {groupData.total_revenue > 0 
                ? ((groupData.total_profit / groupData.total_revenue) * 100).toFixed(1) 
                : '0.0'}%
            </p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              {groupData.total_orders.toLocaleString('pt-BR')}
            </h3>
            <p className="text-sm text-gray-600">Pedidos Totais</p>
            <p className="text-xs text-gray-500 mt-1">
              Ticket Médio: R$ {groupData.average_ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      )}

      {/* Restaurants Comparison */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Comparativo de Unidades</h2>
          <p className="text-sm text-gray-600 mt-1">Desempenho de cada restaurante da rede</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('nome')}
                >
                  Restaurante {renderSortIcon('nome')}
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('revenue')}
                >
                  Faturamento {renderSortIcon('revenue')}
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('profit')}
                >
                  Lucro {renderSortIcon('profit')}
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('orders')}
                >
                  Pedidos {renderSortIcon('orders')}
                </th>
                <th 
                  className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('ticket')}
                >
                  Ticket Médio {renderSortIcon('ticket')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  % da Rede
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedRestaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mr-3 overflow-hidden">
                        {restaurant.logo_url ? (
                          <img src={restaurant.logo_url} alt={restaurant.nome} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{restaurant.nome}</div>
                        <div className="text-xs text-gray-500">{restaurant.cidade}, {restaurant.estado}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-semibold text-gray-900">
                      R$ {restaurant.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-semibold ${restaurant.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      R$ {restaurant.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {restaurant.revenue > 0 
                        ? ((restaurant.profit / restaurant.revenue) * 100).toFixed(1) 
                        : '0.0'}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">{restaurant.orders.toLocaleString('pt-BR')}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm text-gray-900">
                      R$ {restaurant.ticket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {groupData && groupData.total_revenue > 0 
                        ? ((restaurant.revenue / groupData.total_revenue) * 100).toFixed(1) 
                        : '0.0'}%
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className="bg-orange-600 h-1.5 rounded-full" 
                        style={{ 
                          width: `${groupData && groupData.total_revenue > 0 
                            ? (restaurant.revenue / groupData.total_revenue) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {sortedRestaurants.length === 0 && (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum restaurante nesta rede</h3>
              <p className="text-gray-600">Adicione restaurantes à rede para visualizar dados comparativos.</p>
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribuição de Faturamento</h3>
          
          {sortedRestaurants.length > 0 ? (
            <div className="space-y-4">
              {sortedRestaurants.map(restaurant => (
                <div key={restaurant.id} className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {restaurant.logo_url ? (
                      <img src={restaurant.logo_url} alt={restaurant.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-4 h-4 text-orange-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900">{restaurant.nome}</span>
                      <span className="text-sm text-gray-600">
                        R$ {restaurant.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-600 h-2 rounded-full" 
                        style={{ 
                          width: `${groupData && groupData.total_revenue > 0 
                            ? (restaurant.revenue / groupData.total_revenue) * 100 
                            : 0}%` 
                        }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 text-right mt-1">
                      {groupData && groupData.total_revenue > 0 
                        ? ((restaurant.revenue / groupData.total_revenue) * 100).toFixed(1) 
                        : '0.0'}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum dado disponível</p>
            </div>
          )}
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparativo de Lucratividade</h3>
          
          {sortedRestaurants.length > 0 ? (
            <div className="space-y-4">
              {sortedRestaurants
                .sort((a, b) => (b.profit / b.revenue || 0) - (a.profit / a.revenue || 0))
                .map(restaurant => (
                  <div key={restaurant.id} className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {restaurant.logo_url ? (
                        <img src={restaurant.logo_url} alt={restaurant.nome} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{restaurant.nome}</span>
                        <span className={`text-sm ${restaurant.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {restaurant.revenue > 0 
                            ? ((restaurant.profit / restaurant.revenue) * 100).toFixed(1) 
                            : '0.0'}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${restaurant.profit >= 0 ? 'bg-blue-600' : 'bg-red-600'}`}
                          style={{ 
                            width: `${restaurant.revenue > 0 
                              ? Math.min(Math.abs((restaurant.profit / restaurant.revenue) * 100), 100) 
                              : 0}%` 
                          }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-right mt-1">
                        Lucro: R$ {restaurant.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum dado disponível</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};