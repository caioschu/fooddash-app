import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, Phone, Mail, Calendar, DollarSign, ShoppingCart, TrendingUp, CreditCard, BarChart3, User, Check, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { DateFilterSelector } from '../../components/Common/DateFilterSelector';
import { useDateFilter } from '../../hooks/useDateFilter';

interface Restaurant {
  id: string;
  nome: string;
  cnpj: string | null;
  cidade: string;
  estado: string;
  endereco: string | null;
  telefone: string | null;
  categoria_culinaria: string;
  logo_url: string | null;
  descricao: string | null;
  horario_funcionamento: any;
  capacidade_pessoas: number | null;
  area_m2: number | null;
  completude_perfil: number;
  aceita_contato_fornecedores: boolean;
  ativo: boolean;
  pdv_erp: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  users: {
    email: string;
  };
}

interface SalesData {
  totalRevenue: number;
  totalOrders: number;
  averageTicket: number;
  salesByChannel: {
    canal: string;
    valor: number;
    percentual: number;
  }[];
  salesByPayment: {
    forma_pagamento: string;
    valor: number;
    percentual: number;
  }[];
}

interface ExpensesData {
  totalExpenses: number;
  expensesByCategory: {
    categoria: string;
    valor: number;
    percentual: number;
  }[];
  expensesByType: {
    tipo: string;
    valor: number;
    percentual: number;
  }[];
}

export const AdminRestaurantView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showError } = useToast();
  const { getDateRange, getFilterLabel } = useDateFilter();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [expensesData, setExpensesData] = useState<ExpensesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchRestaurantData();
      fetchSalesData();
      fetchExpensesData();
    }
  }, [id]);

  const fetchRestaurantData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select(`
          *,
          users (
            email
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setRestaurant(data);
    } catch (error) {
      console.error('Error fetching restaurant data:', error);
      showError('Erro ao carregar dados', 'Não foi possível carregar os dados do restaurante.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSalesData = async () => {
    if (!id) return;
    
    try {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('restaurant_id', id)
        .gte('data', start)
        .lte('data', end);

      if (error) throw error;
      
      // Calculate sales metrics
      const totalRevenue = data?.reduce((sum, sale) => sum + sale.valor_bruto, 0) || 0;
      const totalOrders = data?.reduce((sum, sale) => sum + sale.numero_pedidos, 0) || 0;
      const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      
      // Sales by channel
      const channelMap = new Map<string, number>();
      
      data?.forEach(sale => {
        if (!channelMap.has(sale.canal)) {
          channelMap.set(sale.canal, 0);
        }
        
        channelMap.set(sale.canal, channelMap.get(sale.canal)! + sale.valor_bruto);
      });
      
      const salesByChannel = Array.from(channelMap.entries())
        .map(([canal, valor]) => ({
          canal,
          valor,
          percentual: totalRevenue > 0 ? (valor / totalRevenue) * 100 : 0
        }))
        .sort((a, b) => b.valor - a.valor);
      
      // Sales by payment method
      const paymentMap = new Map<string, number>();
      
      data?.forEach(sale => {
        if (!paymentMap.has(sale.forma_pagamento)) {
          paymentMap.set(sale.forma_pagamento, 0);
        }
        
        paymentMap.set(sale.forma_pagamento, paymentMap.get(sale.forma_pagamento)! + sale.valor_bruto);
      });
      
      const salesByPayment = Array.from(paymentMap.entries())
        .map(([forma_pagamento, valor]) => ({
          forma_pagamento,
          valor,
          percentual: totalRevenue > 0 ? (valor / totalRevenue) * 100 : 0
        }))
        .sort((a, b) => b.valor - a.valor);
      
      setSalesData({
        totalRevenue,
        totalOrders,
        averageTicket,
        salesByChannel,
        salesByPayment
      });
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const fetchExpensesData = async () => {
    if (!id) return;
    
    try {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('restaurant_id', id)
        .gte('data', start)
        .lte('data', end);

      if (error) throw error;
      
      // Calculate expenses metrics
      const totalExpenses = data?.reduce((sum, expense) => sum + expense.valor, 0) || 0;
      
      // Expenses by category
      const categoryMap = new Map<string, number>();
      
      data?.forEach(expense => {
        if (!categoryMap.has(expense.categoria)) {
          categoryMap.set(expense.categoria, 0);
        }
        
        categoryMap.set(expense.categoria, categoryMap.get(expense.categoria)! + expense.valor);
      });
      
      const expensesByCategory = Array.from(categoryMap.entries())
        .map(([categoria, valor]) => ({
          categoria,
          valor,
          percentual: totalExpenses > 0 ? (valor / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.valor - a.valor);
      
      // Expenses by type
      const typeMap = new Map<string, number>();
      
      data?.forEach(expense => {
        if (!typeMap.has(expense.tipo)) {
          typeMap.set(expense.tipo, 0);
        }
        
        typeMap.set(expense.tipo, typeMap.get(expense.tipo)! + expense.valor);
      });
      
      const expensesByType = Array.from(typeMap.entries())
        .map(([tipo, valor]) => ({
          tipo,
          valor,
          percentual: totalExpenses > 0 ? (valor / totalExpenses) * 100 : 0
        }))
        .sort((a, b) => b.valor - a.valor);
      
      setExpensesData({
        totalExpenses,
        expensesByCategory,
        expensesByType
      });
    } catch (error) {
      console.error('Error fetching expenses data:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados do restaurante...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Restaurante não encontrado</h2>
          <p className="text-gray-600 mb-4">O restaurante solicitado não foi encontrado.</p>
          <Link 
            to="/admin/restaurants" 
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Voltar para lista
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/admin/restaurants"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{restaurant.nome}</h1>
            <p className="text-gray-600 mt-1">{restaurant.categoria_culinaria} • {restaurant.cidade}, {restaurant.estado}</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <DateFilterSelector />
          <span className={`px-3 py-1 text-xs font-medium rounded-full ${
            restaurant.ativo
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}>
            {restaurant.ativo ? 'Ativo' : 'Inativo'}
          </span>
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          <div className="w-24 h-24 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
            {restaurant.logo_url ? (
              <img 
                src={restaurant.logo_url} 
                alt={restaurant.nome} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-12 h-12 text-gray-400" />
            )}
          </div>
          
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Informações Básicas</h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-start">
                  <MapPin className="w-4 h-4 text-gray-400 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm text-gray-900">{restaurant.cidade}, {restaurant.estado}</p>
                    <p className="text-xs text-gray-500">{restaurant.endereco || 'Endereço não informado'}</p>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">{restaurant.telefone || 'Telefone não informado'}</p>
                </div>
                
                <div className="flex items-center">
                  <Mail className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">{restaurant.users?.email}</p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Detalhes do Negócio</h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">{restaurant.categoria_culinaria}</p>
                </div>
                
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">
                    {restaurant.capacidade_pessoas 
                      ? `${restaurant.capacidade_pessoas} pessoas`
                      : 'Capacidade não informada'
                    }
                  </p>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">
                    Cadastrado em {new Date(restaurant.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Configurações</h3>
              <div className="mt-2 space-y-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 flex items-center justify-center">
                    {restaurant.aceita_contato_fornecedores 
                      ? <Check className="w-4 h-4 text-green-500" />
                      : <X className="w-4 h-4 text-red-500" />
                    }
                  </div>
                  <p className="text-sm text-gray-900">
                    {restaurant.aceita_contato_fornecedores 
                      ? 'Aceita contato de fornecedores'
                      : 'Não aceita contato de fornecedores'
                    }
                  </p>
                </div>
                
                <div className="flex items-center">
                  <BarChart3 className="w-4 h-4 text-gray-400 mr-2" />
                  <p className="text-sm text-gray-900">
                    {restaurant.pdv_erp 
                      ? `PDV/ERP: ${restaurant.pdv_erp}`
                      : 'PDV/ERP não informado'
                    }
                  </p>
                </div>
                
                <div className="flex items-center">
                  <div className="w-4 h-4 mr-2 flex items-center justify-center">
                    <span className="inline-block w-3 h-3 rounded-full bg-orange-500"></span>
                  </div>
                  <p className="text-sm text-gray-900">
                    Perfil {restaurant.completude_perfil}% completo
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Faturamento</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            R$ {salesData?.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{getFilterLabel()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Despesas</h3>
            <CreditCard className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">
            R$ {expensesData?.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
          </p>
          <p className="text-xs text-gray-500 mt-1">{getFilterLabel()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-700">Resultado</h3>
            <BarChart3 className="w-5 h-5 text-blue-600" />
          </div>
          <p className={`text-2xl font-bold ${
            (salesData?.totalRevenue || 0) - (expensesData?.totalExpenses || 0) >= 0
              ? 'text-blue-600'
              : 'text-red-600'
          }`}>
            R$ {((salesData?.totalRevenue || 0) - (expensesData?.totalExpenses || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {salesData?.totalRevenue && salesData.totalRevenue > 0
              ? `${(((salesData.totalRevenue - (expensesData?.totalExpenses || 0)) / salesData.totalRevenue) * 100).toFixed(1)}% de margem`
              : 'Sem dados de faturamento'
            }
          </p>
        </div>
      </div>

      {/* Sales Details */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes de Vendas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Por Canal de Venda</h4>
            {salesData?.salesByChannel && salesData.salesByChannel.length > 0 ? (
              <div className="space-y-3">
                {salesData.salesByChannel.map(channel => (
                  <div key={channel.canal} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{channel.canal}</span>
                        <span className="text-sm text-gray-600">
                          R$ {channel.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-green-600 h-1.5 rounded-full" 
                          style={{ width: `${channel.percentual}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-right mt-1">
                        {channel.percentual.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Nenhum dado de venda por canal</p>
              </div>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Por Forma de Pagamento</h4>
            {salesData?.salesByPayment && salesData.salesByPayment.length > 0 ? (
              <div className="space-y-3">
                {salesData.salesByPayment.map(payment => (
                  <div key={payment.forma_pagamento} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{payment.forma_pagamento}</span>
                        <span className="text-sm text-gray-600">
                          R$ {payment.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-blue-600 h-1.5 rounded-full" 
                          style={{ width: `${payment.percentual}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-right mt-1">
                        {payment.percentual.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Nenhum dado de venda por forma de pagamento</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 font-medium mb-1">Total de Pedidos</div>
              <div className="text-xl font-bold text-gray-900">{salesData?.totalOrders || 0}</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 font-medium mb-1">Ticket Médio</div>
              <div className="text-xl font-bold text-gray-900">
                R$ {salesData?.averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 font-medium mb-1">Faturamento por Pedido</div>
              <div className="text-xl font-bold text-gray-900">
                R$ {((salesData?.totalRevenue || 0) / (salesData?.totalOrders || 1)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Details */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalhes de Despesas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Por Categoria</h4>
            {expensesData?.expensesByCategory && expensesData.expensesByCategory.length > 0 ? (
              <div className="space-y-3">
                {expensesData.expensesByCategory.map(category => (
                  <div key={category.categoria} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">{category.categoria}</span>
                        <span className="text-sm text-gray-600">
                          R$ {category.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className="bg-red-600 h-1.5 rounded-full" 
                          style={{ width: `${category.percentual}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-right mt-1">
                        {category.percentual.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Nenhum dado de despesa por categoria</p>
              </div>
            )}
          </div>
          
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Por Tipo</h4>
            {expensesData?.expensesByType && expensesData.expensesByType.length > 0 ? (
              <div className="space-y-3">
                {expensesData.expensesByType.map(type => (
                  <div key={type.tipo} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {type.tipo === 'fixa' ? 'Fixa' : 
                           type.tipo === 'variavel' ? 'Variável' : 
                           type.tipo === 'marketing' ? 'Marketing' : 
                           type.tipo === 'taxa_automatica' ? 'Taxa Automática' : 
                           type.tipo}
                        </span>
                        <span className="text-sm text-gray-600">
                          R$ {type.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full ${
                            type.tipo === 'fixa' ? 'bg-purple-600' : 
                            type.tipo === 'variavel' ? 'bg-blue-600' : 
                            type.tipo === 'marketing' ? 'bg-pink-600' : 
                            'bg-orange-600'
                          }`}
                          style={{ width: `${type.percentual}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 text-right mt-1">
                        {type.percentual.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-gray-500">Nenhum dado de despesa por tipo</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 font-medium mb-1">% Despesas sobre Faturamento</div>
              <div className="text-xl font-bold text-gray-900">
                {salesData?.totalRevenue && salesData.totalRevenue > 0
                  ? `${(((expensesData?.totalExpenses || 0) / salesData.totalRevenue) * 100).toFixed(1)}%`
                  : 'N/A'
                }
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600 font-medium mb-1">Resultado Líquido</div>
              <div className={`text-xl font-bold ${
                (salesData?.totalRevenue || 0) - (expensesData?.totalExpenses || 0) >= 0
                  ? 'text-green-600'
                  : 'text-red-600'
              }`}>
                R$ {((salesData?.totalRevenue || 0) - (expensesData?.totalExpenses || 0)).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ações Administrativas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to={`/admin/restaurants/edit/${restaurant.id}`}
            className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors"
          >
            <h4 className="font-medium text-blue-800 mb-1">Editar Restaurante</h4>
            <p className="text-sm text-blue-600">Modificar dados do restaurante</p>
          </Link>
          
          <button 
            className={`p-4 rounded-lg border hover:bg-opacity-80 transition-colors text-left ${
              restaurant.ativo
                ? 'bg-red-50 border-red-200 hover:bg-red-100'
                : 'bg-green-50 border-green-200 hover:bg-green-100'
            }`}
          >
            <h4 className={`font-medium mb-1 ${
              restaurant.ativo ? 'text-red-800' : 'text-green-800'
            }`}>
              {restaurant.ativo ? 'Desativar Restaurante' : 'Ativar Restaurante'}
            </h4>
            <p className={`text-sm ${
              restaurant.ativo ? 'text-red-600' : 'text-green-600'
            }`}>
              {restaurant.ativo 
                ? 'Impedir acesso à plataforma' 
                : 'Permitir acesso à plataforma'
              }
            </p>
          </button>
          
          <button className="p-4 bg-purple-50 rounded-lg border border-purple-200 hover:bg-purple-100 transition-colors text-left">
            <h4 className="font-medium text-purple-800 mb-1">Acessar como Usuário</h4>
            <p className="text-sm text-purple-600">Ver a plataforma como este restaurante</p>
          </button>
        </div>
      </div>
    </div>
  );
};