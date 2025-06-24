import React, { useState, useEffect } from 'react';
import { BarChart3, Calendar, Filter, Search, Download, ArrowUp, ArrowDown, DollarSign, ShoppingCart, TrendingUp, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { DateFilterSelector } from '../../components/Common/DateFilterSelector';
import { useDateFilter } from '../../hooks/useDateFilter';

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  topRestaurants: {
    id: string;
    nome: string;
    revenue: number;
    orders: number;
  }[];
  topCategories: {
    categoria: string;
    revenue: number;
    count: number;
  }[];
  salesByMonth: {
    month: string;
    revenue: number;
    orders: number;
  }[];
  expensesByCategory: {
    categoria: string;
    valor: number;
    percentual: number;
  }[];
}

export const AdminAnalytics: React.FC = () => {
  const { showError } = useToast();
  const { getDateRange, getFilterLabel } = useDateFilter();
  const [isLoading, setIsLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [filterRestaurant, setFilterRestaurant] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [restaurants, setRestaurants] = useState<{id: string, nome: string}[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [sortField, setSortField] = useState<string>('revenue');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchAnalyticsData();
    fetchRestaurants();
    fetchCategories();
  }, []);

  const fetchAnalyticsData = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          restaurant_id,
          data,
          canal,
          valor_bruto,
          numero_pedidos,
          restaurants (
            nome,
            categoria_culinaria
          )
        `)
        .gte('data', start)
        .lte('data', end);
      
      if (salesError) throw salesError;
      
      // Fetch expenses data
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          id,
          restaurant_id,
          data,
          categoria,
          valor,
          restaurants (
            nome
          )
        `)
        .gte('data', start)
        .lte('data', end);
      
      if (expensesError) throw expensesError;
      
      // Calculate analytics
      const totalRevenue = sales?.reduce((sum, sale) => sum + sale.valor_bruto, 0) || 0;
      const totalOrders = sales?.reduce((sum, sale) => sum + sale.numero_pedidos, 0) || 0;
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.valor, 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
      
      // Top restaurants by revenue
      const restaurantMap = new Map<string, { id: string, nome: string, revenue: number, orders: number }>();
      
      sales?.forEach(sale => {
        if (!restaurantMap.has(sale.restaurant_id)) {
          restaurantMap.set(sale.restaurant_id, {
            id: sale.restaurant_id,
            nome: sale.restaurants?.nome || 'Desconhecido',
            revenue: 0,
            orders: 0
          });
        }
        
        const restaurant = restaurantMap.get(sale.restaurant_id)!;
        restaurant.revenue += sale.valor_bruto;
        restaurant.orders += sale.numero_pedidos;
      });
      
      const topRestaurants = Array.from(restaurantMap.values())
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      
      // Top categories by revenue
      const categoryMap = new Map<string, { categoria: string, revenue: number, count: number }>();
      
      sales?.forEach(sale => {
        const categoria = sale.restaurants?.categoria_culinaria || 'Desconhecido';
        
        if (!categoryMap.has(categoria)) {
          categoryMap.set(categoria, {
            categoria,
            revenue: 0,
            count: 0
          });
        }
        
        const category = categoryMap.get(categoria)!;
        category.revenue += sale.valor_bruto;
        category.count++;
      });
      
      const topCategories = Array.from(categoryMap.values())
        .sort((a, b) => b.revenue - a.revenue);
      
      // Sales by month
      const monthMap = new Map<string, { month: string, revenue: number, orders: number }>();
      
      sales?.forEach(sale => {
        const date = new Date(sale.data);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const monthName = date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' });
        
        if (!monthMap.has(monthKey)) {
          monthMap.set(monthKey, {
            month: monthName,
            revenue: 0,
            orders: 0
          });
        }
        
        const month = monthMap.get(monthKey)!;
        month.revenue += sale.valor_bruto;
        month.orders += sale.numero_pedidos;
      });
      
      const salesByMonth = Array.from(monthMap.values())
        .sort((a, b) => {
          const [monthA, yearA] = a.month.split(' ');
          const [monthB, yearB] = b.month.split(' ');
          return yearA === yearB 
            ? monthA.localeCompare(monthB) 
            : yearA.localeCompare(yearB);
        });
      
      // Expenses by category
      const expenseCategoryMap = new Map<string, number>();
      
      expenses?.forEach(expense => {
        if (!expenseCategoryMap.has(expense.categoria)) {
          expenseCategoryMap.set(expense.categoria, 0);
        }
        
        expenseCategoryMap.set(
          expense.categoria, 
          expenseCategoryMap.get(expense.categoria)! + expense.valor
        );
      });
      
      const expensesByCategory = Array.from(expenseCategoryMap.entries())
        .map(([categoria, valor]) => ({
          categoria,
          valor,
          percentual: totalExpenses > 0 ? (valor / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.valor - a.valor);
      
      setAnalyticsData({
        totalRevenue,
        totalOrders,
        averageTicket,
        totalExpenses,
        netProfit,
        profitMargin,
        topRestaurants,
        topCategories,
        salesByMonth,
        expensesByCategory
      });
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      showError('Erro ao carregar dados', 'Não foi possível carregar os dados de análise.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRestaurants = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('id, nome')
        .eq('ativo', true)
        .order('nome');
      
      if (error) throw error;
      
      setRestaurants(data || []);
    } catch (error) {
      console.error('Error fetching restaurants:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('categoria_culinaria')
        .not('categoria_culinaria', 'is', null);
      
      if (error) throw error;
      
      const uniqueCategories = [...new Set(data?.map(r => r.categoria_culinaria).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleExportData = () => {
    if (!analyticsData) return;
    
    const { start, end } = getDateRange();
    const filename = `analytics_${start}_to_${end}.csv`;
    
    // Create CSV content
    let csvContent = "data:text/csv;charset=utf-8,";
    
    // Headers
    csvContent += "Métrica,Valor\r\n";
    
    // Summary data
    csvContent += `Faturamento Total,${analyticsData.totalRevenue}\r\n`;
    csvContent += `Total de Pedidos,${analyticsData.totalOrders}\r\n`;
    csvContent += `Ticket Médio,${analyticsData.averageTicket}\r\n`;
    csvContent += `Total de Despesas,${analyticsData.totalExpenses}\r\n`;
    csvContent += `Lucro Líquido,${analyticsData.netProfit}\r\n`;
    csvContent += `Margem de Lucro,${analyticsData.profitMargin}%\r\n\r\n`;
    
    // Top restaurants
    csvContent += "Top Restaurantes\r\n";
    csvContent += "Nome,Faturamento,Pedidos\r\n";
    analyticsData.topRestaurants.forEach(restaurant => {
      csvContent += `${restaurant.nome},${restaurant.revenue},${restaurant.orders}\r\n`;
    });
    csvContent += "\r\n";
    
    // Top categories
    csvContent += "Top Categorias\r\n";
    csvContent += "Categoria,Faturamento,Quantidade\r\n";
    analyticsData.topCategories.forEach(category => {
      csvContent += `${category.categoria},${category.revenue},${category.count}\r\n`;
    });
    csvContent += "\r\n";
    
    // Sales by month
    csvContent += "Vendas por Mês\r\n";
    csvContent += "Mês,Faturamento,Pedidos\r\n";
    analyticsData.salesByMonth.forEach(month => {
      csvContent += `${month.month},${month.revenue},${month.orders}\r\n`;
    });
    csvContent += "\r\n";
    
    // Expenses by category
    csvContent += "Despesas por Categoria\r\n";
    csvContent += "Categoria,Valor,Percentual\r\n";
    analyticsData.expensesByCategory.forEach(expense => {
      csvContent += `${expense.categoria},${expense.valor},${expense.percentual}%\r\n`;
    });
    
    // Create download link
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending for most metrics
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

  // Filter and sort data
  const getFilteredRestaurants = () => {
    if (!analyticsData) return [];
    
    return analyticsData.topRestaurants
      .filter(restaurant => 
        !filterRestaurant || restaurant.id === filterRestaurant
      )
      .sort((a, b) => {
        if (sortField === 'nome') {
          return sortDirection === 'asc' 
            ? a.nome.localeCompare(b.nome)
            : b.nome.localeCompare(a.nome);
        } else if (sortField === 'revenue') {
          return sortDirection === 'asc' 
            ? a.revenue - b.revenue
            : b.revenue - a.revenue;
        } else if (sortField === 'orders') {
          return sortDirection === 'asc' 
            ? a.orders - b.orders
            : b.orders - a.orders;
        }
        return 0;
      });
  };

  const getFilteredCategories = () => {
    if (!analyticsData) return [];
    
    return analyticsData.topCategories
      .filter(category => 
        !filterCategory || category.categoria === filterCategory
      )
      .sort((a, b) => {
        if (sortField === 'categoria') {
          return sortDirection === 'asc' 
            ? a.categoria.localeCompare(b.categoria)
            : b.categoria.localeCompare(a.categoria);
        } else if (sortField === 'revenue') {
          return sortDirection === 'asc' 
            ? a.revenue - b.revenue
            : b.revenue - a.revenue;
        } else if (sortField === 'count') {
          return sortDirection === 'asc' 
            ? a.count - b.count
            : b.count - a.count;
        }
        return 0;
      });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados de análise...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Análise de Dados</h1>
          <p className="text-gray-600 mt-1">Visão geral de desempenho do sistema - {getFilterLabel()}</p>
        </div>
        <div className="flex items-center space-x-3">
          <DateFilterSelector />
          <button
            onClick={handleExportData}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Dados</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {analyticsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              R$ {analyticsData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-sm text-gray-600">Faturamento Total</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <ShoppingCart className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">{analyticsData.totalOrders.toLocaleString('pt-BR')}</h3>
            <p className="text-sm text-gray-600">Total de Pedidos</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              R$ {analyticsData.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-sm text-gray-600">Ticket Médio</p>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-1">
              R$ {analyticsData.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
            <p className="text-sm text-gray-600">Total de Despesas</p>
          </div>
        </div>
      )}

      {/* Profit Summary */}
      {analyticsData && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado Financeiro</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm text-green-600 font-medium mb-1">Faturamento</div>
              <div className="text-xl font-bold text-green-700">
                R$ {analyticsData.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm text-red-600 font-medium mb-1">Despesas</div>
              <div className="text-xl font-bold text-red-700">
                R$ {analyticsData.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
            
            <div className={`p-4 rounded-lg border ${
              analyticsData.netProfit >= 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className={`text-sm font-medium mb-1 ${
                analyticsData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                Lucro Líquido
              </div>
              <div className={`text-xl font-bold ${
                analyticsData.netProfit >= 0 ? 'text-blue-700' : 'text-red-700'
              }`}>
                R$ {analyticsData.netProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className={`text-sm ${
                analyticsData.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'
              }`}>
                Margem: {analyticsData.profitMargin.toFixed(1)}%
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top Restaurants */}
      {analyticsData && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Top Restaurantes</h3>
            <div className="flex items-center space-x-3">
              <select
                value={filterRestaurant}
                onChange={(e) => setFilterRestaurant(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="">Todos os restaurantes</option>
                {restaurants.map(restaurant => (
                  <option key={restaurant.id} value={restaurant.id}>{restaurant.nome}</option>
                ))}
              </select>
            </div>
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
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('revenue')}
                  >
                    Faturamento {renderSortIcon('revenue')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('orders')}
                  >
                    Pedidos {renderSortIcon('orders')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Médio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredRestaurants().map((restaurant, index) => (
                  <tr key={restaurant.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {index + 1}. {restaurant.nome}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        R$ {restaurant.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{restaurant.orders}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        R$ {(restaurant.revenue / restaurant.orders).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {getFilteredRestaurants().length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhum restaurante encontrado com os filtros selecionados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Top Categories */}
      {analyticsData && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Desempenho por Categoria Culinária</h3>
            <div className="flex items-center space-x-3">
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
              >
                <option value="">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('categoria')}
                  >
                    Categoria {renderSortIcon('categoria')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('revenue')}
                  >
                    Faturamento {renderSortIcon('revenue')}
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('count')}
                  >
                    Quantidade {renderSortIcon('count')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % do Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredCategories().map((category, index) => (
                  <tr key={category.categoria} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="text-sm font-medium text-gray-900">
                          {category.categoria}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        R$ {category.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{category.count}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {((category.revenue / analyticsData.totalRevenue) * 100).toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {getFilteredCategories().length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-500">Nenhuma categoria encontrada com os filtros selecionados</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Monthly Trends */}
      {analyticsData && analyticsData.salesByMonth.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendência Mensal</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Mês
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Faturamento
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pedidos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ticket Médio
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.salesByMonth.map((month) => (
                  <tr key={month.month} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{month.month}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        R$ {month.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{month.orders}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        R$ {(month.revenue / month.orders).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Expenses by Category */}
      {analyticsData && analyticsData.expensesByCategory.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Despesas por Categoria</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    % do Total
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analyticsData.expensesByCategory.map((expense) => (
                  <tr key={expense.categoria} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{expense.categoria}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        R$ {expense.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{expense.percentual.toFixed(1)}%</div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="bg-red-600 h-1.5 rounded-full" 
                          style={{ width: `${expense.percentual}%` }}
                        ></div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};