import React, { useState, useEffect } from 'react';
import { Plus, Calendar, TrendingUp, DollarSign, ShoppingCart, Edit, Trash2, X, Check, AlertCircle, Filter, Search } from 'lucide-react';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useDateFilter } from '../../hooks/useDateFilter';
import { useToast } from '../../hooks/useToast';
import { DateFilterSelector } from '../../components/Common/DateFilterSelector';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';
import { supabase } from '../../lib/supabase';

interface Sale {
  id: string;
  data: string;
  canal: string;
  forma_pagamento: string;
  valor_bruto: number;
  numero_pedidos: number;
  ticket_medio: number;
  created_at: string;
}

interface ChannelData {
  [key: string]: string;
}

interface PaymentData {
  [key: string]: string;
}

interface ChannelOrdersData {
  [key: string]: string;
}

interface SalesLaunch {
  id: string;
  data: string;
  faturamento_total: number;
  pedidos_total: number;
  ticket_medio: number;
  created_at: string;
  sales_ids: string[];
  detalhes: {
    canais: { [key: string]: number };
    pagamentos: { [key: string]: number };
  };
}

export const SalesPage: React.FC = () => {
  const { restaurant, salesChannels, paymentMethods } = useRestaurant();
  const { filterType, getDateRange, getFilterLabel, setFilterType } = useDateFilter();
  const { showSuccess, showError } = useToast();
  
  // States
  const [sales, setSales] = useState<Sale[]>([]);
  const [salesLaunches, setSalesLaunches] = useState<SalesLaunch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingLaunch, setEditingLaunch] = useState<SalesLaunch | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [filterPayment, setFilterPayment] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Confirm dialog states
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isLoading: false
  });
  
  // Form states for adding sales
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [channelData, setChannelData] = useState<ChannelData>({});
  const [paymentData, setPaymentData] = useState<PaymentData>({});
  const [channelOrdersData, setChannelOrdersData] = useState<ChannelOrdersData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Form states for editing sales
  const [editChannelData, setEditChannelData] = useState<ChannelData>({});
  const [editPaymentData, setEditPaymentData] = useState<PaymentData>({});
  const [editChannelOrdersData, setEditChannelOrdersData] = useState<ChannelOrdersData>({});

  // Get active channels and payment methods
  const activeChannels = salesChannels.filter(c => c.ativo);
  const activePaymentMethods = paymentMethods.filter(p => p.ativo);

  // Quick filter buttons
  const quickFilters = [
    { type: 'hoje' as const, label: 'Hoje' },
    { type: '7dias' as const, label: '7 dias' },
    { type: 'mes_atual' as const, label: 'Este mês' },
    { type: 'mes_anterior' as const, label: 'Mês anterior' },
    { type: 'proximo_mes' as const, label: 'Próximo mês' }
  ];

  // Initialize form with today's date in local timezone
  useEffect(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayString = `${year}-${month}-${day}`;
    
    setStartDate(todayString);
    setEndDate(todayString);
  }, []);

  // Check for hash to open modal
  useEffect(() => {
    if (window.location.hash === '#add-modal') {
      setShowAddModal(true);
      // Remove hash from URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Load sales data when filter changes
  useEffect(() => {
    if (restaurant) {
      fetchSales();
    }
  }, [restaurant, filterType]);

  // Add keyboard event listener for ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAddModal(false);
        setShowEditModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchSales = async () => {
    if (!restaurant) return;
    
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('data', start)
        .lte('data', end)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const salesWithTicket = (data || []).map(sale => ({
        ...sale,
        ticket_medio: sale.numero_pedidos > 0 ? sale.valor_bruto / sale.numero_pedidos : 0
      }));
      
      setSales(salesWithTicket);
      
      // Agrupar por created_at (momento do lançamento) para identificar lançamentos únicos
      const launchesMap = new Map<string, SalesLaunch>();
      
      salesWithTicket.forEach(sale => {
        const launchKey = sale.created_at.substring(0, 19); // YYYY-MM-DDTHH:MM:SS
        
        if (!launchesMap.has(launchKey)) {
          launchesMap.set(launchKey, {
            id: launchKey,
            data: sale.data,
            faturamento_total: 0,
            pedidos_total: 0,
            ticket_medio: 0,
            created_at: sale.created_at,
            sales_ids: [],
            detalhes: {
              canais: {},
              pagamentos: {}
            }
          });
        }
        
        const launch = launchesMap.get(launchKey)!;
        launch.faturamento_total += sale.valor_bruto;
        launch.pedidos_total += sale.numero_pedidos;
        launch.sales_ids.push(sale.id);
        
        launch.detalhes.canais[sale.canal] = (launch.detalhes.canais[sale.canal] || 0) + sale.valor_bruto;
        launch.detalhes.pagamentos[sale.forma_pagamento] = (launch.detalhes.pagamentos[sale.forma_pagamento] || 0) + sale.valor_bruto;
      });
      
      const launchesArray = Array.from(launchesMap.values()).map(launch => ({
        ...launch,
        ticket_medio: launch.pedidos_total > 0 ? launch.faturamento_total / launch.pedidos_total : 0
      })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      setSalesLaunches(launchesArray);
    } catch (error) {
      console.error('Error fetching sales:', error);
      showError('Erro ao carregar vendas', 'Não foi possível carregar os dados de vendas.');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate totals
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.valor_bruto, 0);
  const totalOrders = sales.reduce((sum, sale) => sum + sale.numero_pedidos, 0);
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calculate sales by channel
  const salesByChannel = sales.reduce((acc, sale) => {
    if (!acc[sale.canal]) {
      acc[sale.canal] = { revenue: 0, orders: 0 };
    }
    acc[sale.canal].revenue += sale.valor_bruto;
    acc[sale.canal].orders += sale.numero_pedidos;
    return acc;
  }, {} as Record<string, { revenue: number; orders: number }>);

  const sortedChannels = Object.entries(salesByChannel)
    .sort(([,a], [,b]) => b.revenue - a.revenue)
    .map(([channel, data], index) => ({
      channel,
      data,
      rank: index + 1
    }));

  // Validation functions
  const getTotalChannelValue = (data: ChannelData) => {
    return Object.values(data).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  };

  const getTotalPaymentValue = (data: PaymentData) => {
    return Object.values(data).reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
  };

  const getTotalChannelOrders = (data: ChannelOrdersData) => {
    return Object.values(data).reduce((sum, value) => sum + (parseInt(value) || 0), 0);
  };

  const isFormValid = (channelData: ChannelData, paymentData: PaymentData, channelOrdersData: ChannelOrdersData) => {
    const channelTotal = getTotalChannelValue(channelData);
    const paymentTotal = getTotalPaymentValue(paymentData);
    const ordersTotal = getTotalChannelOrders(channelOrdersData);
    
    const hasChannelData = Object.values(channelData).some(value => parseFloat(value) > 0);
    const hasPaymentData = Object.values(paymentData).some(value => parseFloat(value) > 0);
    const hasOrdersData = Object.values(channelOrdersData).some(value => parseInt(value) > 0);
    
    return hasChannelData && hasPaymentData && hasOrdersData && 
           Math.abs(channelTotal - paymentTotal) < 0.01 && ordersTotal > 0;
  };

  // Função para criar despesas automáticas de taxas
  const createAutomaticExpenses = async (salesRecords: any[]) => {
    if (!restaurant) return;
    
    try {
      const expensesRecords = [];
      
      // Agrupar vendas por data, canal e forma de pagamento
      const salesByDateChannelPayment: Record<string, Record<string, Record<string, number>>> = {};
      
      salesRecords.forEach(sale => {
        if (!salesByDateChannelPayment[sale.data]) {
          salesByDateChannelPayment[sale.data] = {};
        }
        
        if (!salesByDateChannelPayment[sale.data][sale.canal]) {
          salesByDateChannelPayment[sale.data][sale.canal] = {};
        }
        
        if (!salesByDateChannelPayment[sale.data][sale.canal][sale.forma_pagamento]) {
          salesByDateChannelPayment[sale.data][sale.canal][sale.forma_pagamento] = 0;
        }
        
        salesByDateChannelPayment[sale.data][sale.canal][sale.forma_pagamento] += sale.valor_bruto;
      });
      
      // Criar despesas para taxas de canais
      for (const [data, channels] of Object.entries(salesByDateChannelPayment)) {
        for (const [channelName, payments] of Object.entries(channels)) {
          const channelTotal = Object.values(payments).reduce((sum, value) => sum + value, 0);
          const channel = salesChannels.find(c => c.nome === channelName);
          
          if (channel && channel.taxa_percentual > 0) {
            const taxaValor = (channelTotal * channel.taxa_percentual) / 100;
            
            if (taxaValor > 0) {
              expensesRecords.push({
                restaurant_id: restaurant.id,
                data: data,
                nome: `Taxa ${channelName}`,
                categoria: 'Despesas com Vendas',
                subcategoria: `Taxa Comissão ${channelName}`,
                tipo: 'taxa_automatica',
                valor: taxaValor,
                forma_pagamento: null,
                canal: channelName,
                recorrente: false,
                origem_automatica: true,
                observacoes: `Taxa de ${channel.taxa_percentual}% sobre vendas de R$ ${channelTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              });
            }
          }
          
          // Criar despesas para taxas de formas de pagamento
          for (const [paymentName, paymentValue] of Object.entries(payments)) {
            const payment = paymentMethods.find(p => p.nome === paymentName);
            
            if (payment && payment.taxa_percentual > 0) {
              const taxaValor = (paymentValue * payment.taxa_percentual) / 100;
              
              if (taxaValor > 0) {
                expensesRecords.push({
                  restaurant_id: restaurant.id,
                  data: data,
                  nome: `Taxa ${paymentName}`,
                  categoria: 'Despesas com Vendas',
                  subcategoria: `Taxa ${paymentName}`,
                  tipo: 'taxa_automatica',
                  valor: taxaValor,
                  forma_pagamento: paymentName,
                  canal: channelName,
                  recorrente: false,
                  origem_automatica: true,
                  observacoes: `Taxa de ${payment.taxa_percentual}% sobre vendas de R$ ${paymentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                });
              }
            }
          }
        }
      }
      
      // Inserir despesas automáticas
      if (expensesRecords.length > 0) {
        const { error } = await supabase
          .from('expenses')
          .insert(expensesRecords);
          
        if (error) {
          console.error('Erro ao criar despesas automáticas:', error);
        } else {
          console.log(`${expensesRecords.length} despesas automáticas criadas`);
        }
      }
    } catch (error) {
      console.error('Erro ao criar despesas automáticas:', error);
    }
  };

  const handleAddSales = async () => {
    if (!restaurant || !isFormValid(channelData, paymentData, channelOrdersData)) return;
    
    setIsSubmitting(true);
    try {
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      
      // Calculate number of days in the period
      const timeDiff = end.getTime() - start.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
      
      let salesRecords: any[] = [];
      
      // Create records for each day in the period
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        const currentDate = `${year}-${month}-${day}`;
        
        // Create records for each channel with value
        for (const [channelName, value] of Object.entries(channelData)) {
          const channelValue = parseFloat(value);
          const channelOrders = parseInt(channelOrdersData[channelName]) || 0;
          
          if (channelValue > 0 && channelOrders > 0) {
            // Distribute values across days
            const dailyChannelValue = channelValue / daysDiff;
            const dailyChannelOrders = Math.round(channelOrders / daysDiff);
            
            // Find corresponding payment methods
            const paymentEntries = Object.entries(paymentData).filter(([, val]) => parseFloat(val) > 0);
            const totalPaymentValue = getTotalPaymentValue(paymentData);
            
            for (const [paymentName, paymentValue] of paymentEntries) {
              const paymentAmount = parseFloat(paymentValue);
              const recordValue = (dailyChannelValue * paymentAmount) / totalPaymentValue;
              const recordOrders = Math.round((dailyChannelOrders * paymentAmount) / totalPaymentValue);
              
              if (recordValue > 0 && recordOrders > 0) {
                salesRecords.push({
                  restaurant_id: restaurant.id,
                  data: currentDate,
                  canal: channelName,
                  forma_pagamento: paymentName,
                  valor_bruto: recordValue,
                  numero_pedidos: recordOrders,
                  ticket_medio: recordValue / recordOrders
                });
              }
            }
          }
        }
      }

      // Insert all records
      const { error } = await supabase
        .from('sales')
        .insert(salesRecords);

      if (error) throw error;

      // Criar despesas automáticas para taxas
      await createAutomaticExpenses(salesRecords);

      // Reset form and close modal
      setChannelData({});
      setPaymentData({});
      setChannelOrdersData({});
      setShowAddModal(false);
      
      // Refresh sales data
      await fetchSales();
      
      showSuccess(
        'Vendas adicionadas com sucesso!',
        `${salesRecords.length} registros foram criados no período selecionado.`
      );
    } catch (error) {
      console.error('Error adding sales:', error);
      showError(
        'Erro ao adicionar vendas',
        'Não foi possível salvar os dados. Verifique as informações e tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLaunch = (launch: SalesLaunch) => {
    setEditingLaunch(launch);
    
    // Populate form with launch data
    const channelTotals: ChannelData = {};
    const paymentTotals: PaymentData = {};
    const channelOrderTotals: ChannelOrdersData = {};
    
    // Get all sales for this launch
    const salesForLaunch = sales.filter(sale => launch.sales_ids.includes(sale.id));
    
    salesForLaunch.forEach(sale => {
      channelTotals[sale.canal] = (parseFloat(channelTotals[sale.canal] || '0') + sale.valor_bruto).toString();
      paymentTotals[sale.forma_pagamento] = (parseFloat(paymentTotals[sale.forma_pagamento] || '0') + sale.valor_bruto).toString();
      channelOrderTotals[sale.canal] = (parseInt(channelOrderTotals[sale.canal] || '0') + sale.numero_pedidos).toString();
    });
    
    setEditChannelData(channelTotals);
    setEditPaymentData(paymentTotals);
    setEditChannelOrdersData(channelOrderTotals);
    
    setShowEditModal(true);
  };

  const handleUpdateLaunch = async () => {
    if (!editingLaunch || !isFormValid(editChannelData, editPaymentData, editChannelOrdersData)) return;
    
    setIsSubmitting(true);
    try {
      // Delete all existing sales for this launch
      const { error: deleteError } = await supabase
        .from('sales')
        .delete()
        .in('id', editingLaunch.sales_ids);

      if (deleteError) throw deleteError;

      // Delete automatic expenses related to this launch
      const { error: deleteExpensesError } = await supabase
        .from('expenses')
        .delete()
        .eq('data', editingLaunch.data)
        .eq('origem_automatica', true)
        .eq('restaurant_id', restaurant?.id || '');

      if (deleteExpensesError) {
        console.error('Error deleting automatic expenses:', deleteExpensesError);
      }

      // Create new sales records
      let salesRecords: any[] = [];
      
      for (const [channelName, value] of Object.entries(editChannelData)) {
        const channelValue = parseFloat(value);
        const channelOrders = parseInt(editChannelOrdersData[channelName]) || 0;
        
        if (channelValue > 0 && channelOrders > 0) {
          const paymentEntries = Object.entries(editPaymentData).filter(([, val]) => parseFloat(val) > 0);
          const totalPaymentValue = getTotalPaymentValue(editPaymentData);
          
          for (const [paymentName, paymentValue] of paymentEntries) {
            const paymentAmount = parseFloat(paymentValue);
            const recordValue = (channelValue * paymentAmount) / totalPaymentValue;
            const recordOrders = Math.round((channelOrders * paymentAmount) / totalPaymentValue);
            
            if (recordValue > 0 && recordOrders > 0) {
              salesRecords.push({
                restaurant_id: restaurant?.id,
                data: editingLaunch.data,
                canal: channelName,
                forma_pagamento: paymentName,
                valor_bruto: recordValue,
                numero_pedidos: recordOrders,
                ticket_medio: recordValue / recordOrders
              });
            }
          }
        }
      }

      // Insert new records
      const { error: insertError } = await supabase
        .from('sales')
        .insert(salesRecords);

      if (insertError) throw insertError;

      // Criar despesas automáticas para taxas
      await createAutomaticExpenses(salesRecords);

      setShowEditModal(false);
      setEditingLaunch(null);
      await fetchSales();
      
      showSuccess(
        'Lançamento atualizado!',
        'As alterações foram salvas com sucesso.'
      );
    } catch (error) {
      console.error('Error updating launch:', error);
      showError(
        'Erro ao atualizar lançamento',
        'Não foi possível salvar as alterações. Tente novamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLaunch = (launch: SalesLaunch) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir lançamento',
      message: `Tem certeza que deseja excluir o lançamento de ${new Date(launch.data + 'T00:00:00').toLocaleDateString('pt-BR')} no valor de R$ ${launch.faturamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        
        try {
          const { error } = await supabase
            .from('sales')
            .delete()
            .in('id', launch.sales_ids);

          if (error) throw error;
          
          // Delete automatic expenses related to this launch
          const { error: deleteExpensesError } = await supabase
            .from('expenses')
            .delete()
            .eq('data', launch.data)
            .eq('origem_automatica', true)
            .eq('restaurant_id', restaurant?.id || '');

          if (deleteExpensesError) {
            console.error('Error deleting automatic expenses:', deleteExpensesError);
          }
          
          await fetchSales();
          
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
          
          showSuccess(
            'Lançamento excluído!',
            'O lançamento foi removido com sucesso.'
          );
        } catch (error) {
          console.error('Error deleting launch:', error);
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
          showError(
            'Erro ao excluir lançamento',
            'Não foi possível excluir o lançamento. Tente novamente.'
          );
        }
      },
      isLoading: false
    });
  };

  // Filter sales
  const filteredSales = salesLaunches.filter(launch => {
    const matchesSearch = Object.keys(launch.detalhes.canais).some(canal => 
      canal.toLowerCase().includes(searchTerm.toLowerCase())
    ) || Object.keys(launch.detalhes.pagamentos).some(pagamento => 
      pagamento.toLowerCase().includes(searchTerm.toLowerCase())
    );
    
    const matchesChannel = !filterChannel || Object.keys(launch.detalhes.canais).includes(filterChannel);
    const matchesPayment = !filterPayment || Object.keys(launch.detalhes.pagamentos).includes(filterPayment);
    
    return matchesSearch && matchesChannel && matchesPayment;
  });

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSales = filteredSales.slice(startIndex, startIndex + itemsPerPage);

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando vendas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={confirmDialog.isLoading}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vendas</h1>
          <p className="text-gray-600 mt-1">Gerencie e acompanhe suas vendas - {getFilterLabel()}</p>
        </div>
        <div className="flex items-center space-x-3">
          <DateFilterSelector />
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Vendas</span>
          </button>
        </div>
      </div>

      {/* Quick Filters */}
      <div className="flex items-center space-x-3">
        <Calendar className="w-5 h-5 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Filtros rápidos:</span>
        {quickFilters.map((filter) => (
          <button
            key={filter.type}
            onClick={() => setFilterType(filter.type)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              filterType === filter.type
                ? 'bg-orange-100 text-orange-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Faturamento Total</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">{sales.length} vendas • {getFilterLabel()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Total de Pedidos</h3>
            <ShoppingCart className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-2xl font-bold text-blue-600">{totalOrders}</p>
          <p className="text-xs text-gray-500 mt-1">{sales.length} registros de venda</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Ticket Médio</h3>
            <TrendingUp className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-2xl font-bold text-purple-600">
            R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">Por pedido</p>
        </div>
      </div>

      {/* Channel Performance */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance por Canal</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedChannels.map(({ channel, data, rank }) => (
            <div key={channel} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-gray-900">{channel}</h4>
                <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                  {rank}º
                </span>
              </div>
              <div className="space-y-1">
                <div className="text-lg font-bold text-green-600">
                  R$ {data.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-gray-600">
                  {data.orders} pedidos • Ticket: R$ {(data.revenue / data.orders).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-xs text-gray-500">
                  {((data.revenue / totalRevenue) * 100).toFixed(1)}% do faturamento
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar vendas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Todos os canais</option>
                {salesChannels.map(channel => (
                  <option key={channel.id} value={channel.nome}>{channel.nome}</option>
                ))}
              </select>
              
              <select
                value={filterPayment}
                onChange={(e) => setFilterPayment(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="">Todas as formas</option>
                {paymentMethods.map(method => (
                  <option key={method.id} value={method.nome}>{method.nome}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredSales.length} de {salesLaunches.length} lançamentos
          </div>
        </div>
      </div>

      {/* Sales Launches Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lançamentos Registrados</h3>
          <p className="text-sm text-gray-600 mt-1">Todos os lançamentos registrados no período</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data da Venda</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faturamento Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qtd Pedidos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket Médio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inserido em</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedSales.map((launch) => (
                <tr key={launch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {new Date(launch.data + 'T00:00:00').toLocaleDateString('pt-BR', { 
                        weekday: 'short', 
                        day: '2-digit', 
                        month: '2-digit', 
                        year: 'numeric' 
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {Object.entries(launch.detalhes.canais)
                        .filter(([, valor]) => valor > 0)
                        .map(([canal]) => canal)
                        .join(', ')}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      R$ {launch.faturamento_total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{launch.pedidos_total}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      R$ {launch.ticket_medio.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-xs text-gray-500">
                      {new Date(launch.created_at).toLocaleDateString('pt-BR')} às {new Date(launch.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditLaunch(launch)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar lançamento"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteLaunch(launch)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir lançamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredSales.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma venda encontrada</h3>
              <p className="text-gray-600">Adicione suas primeiras vendas para começar a acompanhar o faturamento.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredSales.length)} de {filteredSales.length} lançamentos
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      currentPage === page
                        ? 'bg-orange-600 text-white'
                        : 'border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add Sales Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Adicionar Vendas</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Preencha os dados de vendas. Para períodos múltiplos, os valores serão distribuídos igualmente entre os dias.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Date Range */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Início</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Data Fim</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Instruções:</strong> Preencha apenas os canais e formas de pagamento que foram utilizados. 
                  Os totais de canais e formas de pagamento devem ser iguais. Informe também a quantidade de pedidos por canal.
                </p>
              </div>

              {/* Sales Channels */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 text-orange-700">Canais de Venda</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeChannels.map((channel) => (
                    <div key={channel.id} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {channel.nome}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={channelData[channel.nome] || ''}
                          onChange={(e) => setChannelData(prev => ({
                            ...prev,
                            [channel.nome]: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="R$ 0,00"
                        />
                        <input
                          type="number"
                          value={channelOrdersData[channel.nome] || ''}
                          onChange={(e) => setChannelOrdersData(prev => ({
                            ...prev,
                            [channel.nome]: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                          placeholder="Qtd pedidos"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="font-medium text-orange-700">
                    Total Faturamento: R$ {getTotalChannelValue(channelData).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="font-medium text-orange-700">
                    Total Pedidos: {getTotalChannelOrders(channelOrdersData)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 text-green-700">Formas de Pagamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activePaymentMethods.map((method) => (
                    <div key={method.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {method.nome}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={paymentData[method.nome] || ''}
                        onChange={(e) => setPaymentData(prev => ({
                          ...prev,
                          [method.nome]: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right">
                  <span className="text-sm font-medium text-green-700">
                    Total: R$ {getTotalPaymentValue(paymentData).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Validation */}
              <div className="flex items-center space-x-2">
                {isFormValid(channelData, paymentData, channelOrdersData) ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Dados válidos!</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Verifique se os totais de canais e formas de pagamento são iguais e se há pedidos informados
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddSales}
                disabled={!isFormValid(channelData, paymentData, channelOrdersData) || isSubmitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isSubmitting ? 'Adicionando...' : 'Adicionar Vendas'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Sales Modal */}
      {showEditModal && editingLaunch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Editar Lançamento</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Edite os dados do lançamento de {new Date(editingLaunch.data + 'T00:00:00').toLocaleDateString('pt-BR')}.
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Sales Channels */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 text-orange-700">Canais de Venda</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activeChannels.map((channel) => (
                    <div key={channel.id} className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {channel.nome}
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="number"
                          step="0.01"
                          value={editChannelData[channel.nome] || ''}
                          onChange={(e) => setEditChannelData(prev => ({
                            ...prev,
                            [channel.nome]: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="R$ 0,00"
                        />
                        <input
                          type="number"
                          value={editChannelOrdersData[channel.nome] || ''}
                          onChange={(e) => setEditChannelOrdersData(prev => ({
                            ...prev,
                            [channel.nome]: e.target.value
                          }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Qtd pedidos"
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="font-medium text-orange-700">
                    Total Faturamento: R$ {getTotalChannelValue(editChannelData).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  <span className="font-medium text-orange-700">
                    Total Pedidos: {getTotalChannelOrders(editChannelOrdersData)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3 text-green-700">Formas de Pagamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {activePaymentMethods.map((method) => (
                    <div key={method.id}>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {method.nome}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={editPaymentData[method.nome] || ''}
                        onChange={(e) => setEditPaymentData(prev => ({
                          ...prev,
                          [method.nome]: e.target.value
                        }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="R$ 0,00"
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right">
                  <span className="text-sm font-medium text-green-700">
                    Total: R$ {getTotalPaymentValue(editPaymentData).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Validation */}
              <div className="flex items-center space-x-2">
                {isFormValid(editChannelData, editPaymentData, editChannelOrdersData) ? (
                  <div className="flex items-center space-x-2 text-green-600">
                    <Check className="w-5 h-5" />
                    <span className="text-sm font-medium">Dados válidos!</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2 text-red-600">
                    <AlertCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">
                      Verifique se os totais de canais e formas de pagamento são iguais e se há pedidos informados
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpdateLaunch}
                disabled={!isFormValid(editChannelData, editPaymentData, editChannelOrdersData) || isSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isSubmitting ? 'Salvando...' : 'Salvar Alterações'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};