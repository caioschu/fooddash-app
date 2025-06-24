import React, { useState, useEffect } from 'react';
import { Users, Building2, BarChart3, TrendingUp, Database, Settings, Calendar, Filter, Search, DollarSign, ShoppingCart, CreditCard } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { DateFilterSelector } from '../../components/Common/DateFilterSelector';
import { useDateFilter } from '../../hooks/useDateFilter';

export const AdminDashboard: React.FC = () => {
  const { showError } = useToast();
  const { getDateRange, getFilterLabel } = useDateFilter();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRestaurants: 0,
    activeRestaurants: 0,
    totalUsers: 0,
    totalSales: 0,
    totalRevenue: 0,
    totalExpenses: 0,
    averageTicket: 0,
    totalOrders: 0
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // Fetch restaurant count
      const { data: restaurants, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('id, ativo');
      
      if (restaurantsError) throw restaurantsError;
      
      // Fetch user count
      const { count: userCount, error: userError } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true });
      
      if (userError) throw userError;
      
      // Fetch sales data
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select('valor_bruto, numero_pedidos')
        .gte('data', start)
        .lte('data', end);
      
      if (salesError) throw salesError;
      
      // Fetch expenses data
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('valor')
        .gte('data', start)
        .lte('data', end);
      
      if (expensesError) throw expensesError;
      
      // Calculate stats
      const totalRestaurants = restaurants?.length || 0;
      const activeRestaurants = restaurants?.filter(r => r.ativo).length || 0;
      const totalSales = sales?.length || 0;
      const totalRevenue = sales?.reduce((sum, sale) => sum + sale.valor_bruto, 0) || 0;
      const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.valor, 0) || 0;
      const totalOrders = sales?.reduce((sum, sale) => sum + sale.numero_pedidos, 0) || 0;
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      setStats({
        totalRestaurants,
        activeRestaurants,
        totalUsers: userCount || 0,
        totalSales,
        totalRevenue,
        totalExpenses,
        averageTicket,
        totalOrders
      });
      
      // Fetch recent activity
      const { data: recentRestaurants } = await supabase
        .from('restaurants')
        .select('id, nome, cidade, estado, created_at')
        .order('created_at', { ascending: false })
        .limit(5);
        
      const { data: recentSales } = await supabase
        .from('sales')
        .select('id, restaurant_id, data, valor_bruto, created_at, restaurants(nome)')
        .order('created_at', { ascending: false })
        .limit(5);
        
      const activity = [
        ...(recentRestaurants?.map(r => ({
          type: 'restaurant',
          id: r.id,
          title: `Novo restaurante cadastrado`,
          description: `${r.nome} - ${r.cidade}, ${r.estado}`,
          timestamp: r.created_at
        })) || []),
        ...(recentSales?.map(s => ({
          type: 'sale',
          id: s.id,
          title: `Nova venda registrada`,
          description: `${s.restaurants?.nome} - R$ ${s.valor_bruto.toFixed(2)}`,
          timestamp: s.created_at
        })) || [])
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 5);
      
      setRecentActivity(activity);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      showError('Erro ao carregar dados', 'Não foi possível carregar os dados do dashboard.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600 mt-1">Visão geral do sistema FoodDash</p>
        </div>
        <div className="flex items-center space-x-3">
          <DateFilterSelector />
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            Admin
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalRestaurants}</h3>
          <p className="text-sm text-gray-600">Restaurantes Cadastrados</p>
          <p className="text-xs text-green-600 mt-2">{stats.activeRestaurants} ativos</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalUsers}</h3>
          <p className="text-sm text-gray-600">Usuários Totais</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">
            R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
          <p className="text-sm text-gray-600">Faturamento Total</p>
          <p className="text-xs text-gray-500 mt-2">{getFilterLabel()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">{stats.totalOrders}</h3>
          <p className="text-sm text-gray-600">Pedidos Totais</p>
          <p className="text-xs text-gray-500 mt-2">Ticket: R$ {stats.averageTicket.toFixed(2)}</p>
        </div>
      </div>

      {/* Second Row Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 lg:col-span-2">
          <h3 className="font-semibold text-gray-900 mb-4">Resumo Financeiro</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 bg-green-50 rounded-lg">
              <div className="text-sm text-green-600 font-medium mb-1">Faturamento</div>
              <div className="text-xl font-bold text-green-700">
                R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-green-600 mt-1">{stats.totalSales} vendas</div>
            </div>
            
            <div className="p-4 bg-red-50 rounded-lg">
              <div className="text-sm text-red-600 font-medium mb-1">Despesas</div>
              <div className="text-xl font-bold text-red-700">
                R$ {stats.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-red-600 mt-1">
                {((stats.totalExpenses / stats.totalRevenue) * 100).toFixed(1)}% da receita
              </div>
            </div>
            
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-600 font-medium mb-1">Resultado</div>
              <div className="text-xl font-bold text-blue-700">
                R$ {(stats.totalRevenue - stats.totalExpenses).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-blue-600 mt-1">
                {stats.totalRevenue > 0 
                  ? ((stats.totalRevenue - stats.totalExpenses) / stats.totalRevenue * 100).toFixed(1) 
                  : '0.0'}% de margem
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-900 mb-4">Métricas de Uso</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Restaurantes Ativos</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.activeRestaurants} / {stats.totalRestaurants}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div 
                className="bg-green-600 h-2.5 rounded-full" 
                style={{ width: `${stats.totalRestaurants > 0 ? (stats.activeRestaurants / stats.totalRestaurants) * 100 : 0}%` }}
              ></div>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">Ticket Médio</span>
              <span className="text-sm font-medium text-gray-900">
                R$ {stats.averageTicket.toFixed(2)}
              </span>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              <span className="text-sm text-gray-600">Pedidos por Restaurante</span>
              <span className="text-sm font-medium text-gray-900">
                {stats.activeRestaurants > 0 ? Math.round(stats.totalOrders / stats.activeRestaurants) : 0}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <a href="/admin/restaurants" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gerenciar Restaurantes</h3>
              <p className="text-sm text-gray-600">Visualizar e editar dados dos restaurantes</p>
            </div>
          </div>
        </a>

        <a href="/admin/benchmarking" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Dados de Benchmarking</h3>
              <p className="text-sm text-gray-600">Atualizar médias de mercado por região</p>
            </div>
          </div>
        </a>

        <a href="/admin/categories" className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Categorias de Despesas</h3>
              <p className="text-sm text-gray-600">Gerenciar categorias e subcategorias</p>
            </div>
          </div>
        </a>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Atividade Recente</h3>
        <div className="space-y-4">
          {recentActivity.map((activity, index) => (
            <div key={index} className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
              <div className={`w-2 h-2 rounded-full ${
                activity.type === 'restaurant' ? 'bg-green-500' : 'bg-blue-500'
              }`}></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                <p className="text-xs text-gray-600">{activity.description}</p>
              </div>
              <span className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </span>
            </div>
          ))}
          
          {recentActivity.length === 0 && (
            <div className="text-center py-6">
              <p className="text-gray-500">Nenhuma atividade recente encontrada</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};