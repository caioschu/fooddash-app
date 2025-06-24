import React, { useState, useEffect } from 'react';
import { Plus, Calendar, TrendingDown, DollarSign, CreditCard, Edit, Trash2, X, Check, AlertCircle, Filter, Search, Target, Receipt, Percent, BarChart3, CheckCircle, Clock, Zap, TrendingUp } from 'lucide-react';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useDateFilter } from '../../hooks/useDateFilter';
import { useToast } from '../../hooks/useToast';
import { DateFilterSelector } from '../../components/Common/DateFilterSelector';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';
import { supabase } from '../../lib/supabase';

interface Expense {
  id: string;
  data: string;
  nome: string;
  categoria: string;
  subcategoria: string | null;
  tipo: 'fixa' | 'variavel' | 'marketing' | 'taxa_automatica';
  valor: number;
  forma_pagamento: string | null;
  canal: string | null;
  recorrente: boolean;
  origem_automatica: boolean;
  observacoes: string | null;
  data_vencimento: string | null;
  data_pagamento: string | null;
  pago: boolean;
  created_at: string;
}

interface ExpenseCategory {
  id: string;
  nome: string;
  tipo: 'fixa' | 'variavel' | 'marketing';
  descricao: string | null;
  subcategorias: ExpenseSubcategory[];
}

interface ExpenseSubcategory {
  id: string;
  category_id: string;
  nome: string;
  descricao: string | null;
}

interface Sale {
  id: string;
  data: string;
  valor_bruto: number;
  numero_pedidos: number;
}

export const ExpensesPage: React.FC = () => {
  const { restaurant } = useRestaurant();
  const { filterType, getDateRange, getFilterLabel, setFilterType } = useDateFilter();
  const { showSuccess, showError } = useToast();
  
  // States
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showQuickModal, setShowQuickModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pago' | 'pendente'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;
  
  // Form states
  const [formData, setFormData] = useState({
    data: '',
    data_vencimento: '',
    data_pagamento: '',
    nome: '',
    categoria: '',
    subcategoria: '',
    valor: '',
    recorrente: false
  });
  
  // Quick mode states
  const [quickExpenses, setQuickExpenses] = useState<Record<string, Record<string, string>>>({});
  const [quickDate, setQuickDate] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
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

  // Quick filter buttons
  const quickFilters = [
    { type: 'hoje' as const, label: 'Hoje' },
    { type: '7dias' as const, label: '7 dias' },
    { type: 'mes_atual' as const, label: 'Este mês' },
    { type: 'mes_anterior' as const, label: 'Mês anterior' },
    { type: 'proximo_mes' as const, label: 'Próximo mês' }
  ];

  // Initialize form with today's date
  useEffect(() => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    setFormData(prev => ({ ...prev, data: todayString }));
    setQuickDate(todayString);
  }, []);

  // Check for hash to open modal
  useEffect(() => {
    if (window.location.hash === '#add-modal') {
      setShowAddModal(true);
      // Remove hash from URL
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  // Load data when filter changes
  useEffect(() => {
    if (restaurant) {
      fetchExpenses();
      fetchSales();
      fetchCategories();
    }
  }, [restaurant, filterType]);

  // Add keyboard event listener for ESC key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowAddModal(false);
        setShowQuickModal(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const fetchCategories = async () => {
    try {
      // Buscar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Buscar subcategorias
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('expense_subcategories')
        .select('*')
        .eq('ativo', true)
        .order('ordem', { ascending: true });

      if (subcategoriesError) throw subcategoriesError;

      // Organizar dados
      const categoriesWithSubs = categoriesData.map(category => ({
        ...category,
        subcategorias: subcategoriesData.filter(sub => sub.category_id === category.id)
      }));

      setCategories(categoriesWithSubs);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Erro ao carregar categorias', 'Não foi possível carregar as categorias de despesas.');
    }
  };

  const fetchExpenses = async () => {
    if (!restaurant) return;
    
    try {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('data', start)
        .lte('data', end)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
      showError('Erro ao carregar despesas', 'Não foi possível carregar os dados de despesas.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSales = async () => {
    if (!restaurant) return;
    
    try {
      const { start, end } = getDateRange();
      
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('data', start)
        .lte('data', end);

      if (error) throw error;
      
      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!restaurant || !formData.data || !formData.nome || !formData.categoria || !formData.subcategoria || !formData.valor) {
      showError('Campos obrigatórios', 'Preencha todos os campos obrigatórios.');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCategory = categories.find(c => c.nome === formData.categoria);
      if (!selectedCategory) {
        throw new Error('Categoria não encontrada');
      }

      const expenseData = {
        restaurant_id: restaurant.id,
        data: formData.data,
        data_vencimento: formData.data_vencimento || null,
        data_pagamento: formData.data_pagamento || null,
        nome: formData.nome,
        categoria: formData.categoria,
        subcategoria: formData.subcategoria,
        tipo: selectedCategory.tipo,
        valor: parseFloat(formData.valor),
        recorrente: formData.recorrente,
        pago: !!formData.data_pagamento,
        origem_automatica: false
      };

      const { error } = await supabase
        .from('expenses')
        .insert([expenseData]);

      if (error) throw error;

      // Se for recorrente e fixa, criar para os próximos meses
      if (formData.recorrente && selectedCategory.tipo === 'fixa') {
        const recurringExpenses = [];
        for (let i = 1; i <= 11; i++) {
          const nextDate = new Date(formData.data);
          nextDate.setMonth(nextDate.getMonth() + i);
          
          const nextVencimento = formData.data_vencimento ? new Date(formData.data_vencimento) : null;
          if (nextVencimento) {
            nextVencimento.setMonth(nextVencimento.getMonth() + i);
          }

          recurringExpenses.push({
            ...expenseData,
            data: nextDate.toISOString().split('T')[0],
            data_vencimento: nextVencimento ? nextVencimento.toISOString().split('T')[0] : null,
            data_pagamento: null,
            pago: false
          });
        }

        if (recurringExpenses.length > 0) {
          const { error: recurringError } = await supabase
            .from('expenses')
            .insert(recurringExpenses);

          if (recurringError) {
            console.error('Error creating recurring expenses:', recurringError);
          }
        }
      }

      setFormData({
        data: formData.data,
        data_vencimento: '',
        data_pagamento: '',
        nome: '',
        categoria: '',
        subcategoria: '',
        valor: '',
        recorrente: false
      });
      
      setShowAddModal(false);
      await fetchExpenses();
      
      showSuccess(
        'Despesa adicionada!',
        formData.recorrente && selectedCategory.tipo === 'fixa' 
          ? 'Despesa criada e replicada para os próximos 11 meses.'
          : 'Despesa registrada com sucesso.'
      );
    } catch (error) {
      console.error('Error adding expense:', error);
      showError('Erro ao adicionar despesa', 'Não foi possível salvar a despesa.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickAdd = async () => {
    if (!restaurant || !quickDate) {
      showError('Data obrigatória', 'Selecione uma data para as despesas.');
      return;
    }

    const expensesToAdd = [];
    
    for (const [categoryName, subcategories] of Object.entries(quickExpenses)) {
      const category = categories.find(c => c.nome === categoryName);
      if (!category) continue;

      for (const [subcategoryName, value] of Object.entries(subcategories)) {
        const numericValue = parseFloat(value);
        if (numericValue > 0) {
          expensesToAdd.push({
            restaurant_id: restaurant.id,
            data: quickDate,
            nome: subcategoryName,
            categoria: categoryName,
            subcategoria: subcategoryName,
            tipo: category.tipo,
            valor: numericValue,
            recorrente: false,
            pago: false,
            origem_automatica: false
          });
        }
      }
    }

    if (expensesToAdd.length === 0) {
      showError('Nenhuma despesa informada', 'Adicione valores para pelo menos uma subcategoria.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('expenses')
        .insert(expensesToAdd);

      if (error) throw error;

      setQuickExpenses({});
      setShowQuickModal(false);
      await fetchExpenses();
      
      showSuccess(
        'Despesas adicionadas!',
        `${expensesToAdd.length} despesas foram registradas com sucesso.`
      );
    } catch (error) {
      console.error('Error adding quick expenses:', error);
      showError('Erro ao adicionar despesas', 'Não foi possível salvar as despesas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTogglePayment = async (expense: Expense) => {
    try {
      const newPaidStatus = !expense.pago;
      const updateData = {
        pago: newPaidStatus,
        data_pagamento: newPaidStatus ? new Date().toISOString().split('T')[0] : null
      };

      const { error } = await supabase
        .from('expenses')
        .update(updateData)
        .eq('id', expense.id);

      if (error) throw error;

      await fetchExpenses();
      
      showSuccess(
        newPaidStatus ? 'Marcado como pago!' : 'Marcado como pendente!',
        newPaidStatus ? 'A despesa foi marcada como paga.' : 'A despesa foi marcada como pendente.'
      );
    } catch (error) {
      console.error('Error updating payment status:', error);
      showError('Erro ao atualizar status', 'Não foi possível atualizar o status de pagamento.');
    }
  };

  const handleDeleteExpense = (expense: Expense) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir despesa',
      message: `Tem certeza que deseja excluir a despesa "${expense.nome}" no valor de R$ ${expense.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}?`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        
        try {
          const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', expense.id);

          if (error) throw error;
          
          await fetchExpenses();
          
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
          
          showSuccess('Despesa excluída!', 'A despesa foi removida com sucesso.');
        } catch (error) {
          console.error('Error deleting expense:', error);
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
          showError('Erro ao excluir despesa', 'Não foi possível excluir a despesa.');
        }
      },
      isLoading: false
    });
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.valor, 0);
  const fixedExpenses = expenses.filter(e => e.tipo === 'fixa' || e.tipo === 'marketing').reduce((sum, expense) => sum + expense.valor, 0);
  const variableExpenses = expenses.filter(e => e.tipo === 'variavel' || e.tipo === 'taxa_automatica').reduce((sum, expense) => sum + expense.valor, 0);

  // Calculate sales data for breakeven
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.valor_bruto, 0);
  const totalOrders = sales.reduce((sum, sale) => sum + sale.numero_pedidos, 0);
  const currentTicketMedio = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Get historical ticket average (last 6 months)
  const [historicalTicketMedio, setHistoricalTicketMedio] = useState(0);

  useEffect(() => {
    const fetchHistoricalTicket = async () => {
      if (!restaurant) return;
      
      try {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        
        const { data: historicalSales, error } = await supabase
          .from('sales')
          .select('valor_bruto, numero_pedidos')
          .eq('restaurant_id', restaurant.id)
          .gte('data', sixMonthsAgo.toISOString().split('T')[0]);

        if (!error && historicalSales) {
          const totalRevenue = historicalSales.reduce((sum, sale) => sum + sale.valor_bruto, 0);
          const totalOrders = historicalSales.reduce((sum, sale) => sum + sale.numero_pedidos, 0);
          setHistoricalTicketMedio(totalOrders > 0 ? totalRevenue / totalOrders : 0);
        }
      } catch (error) {
        console.error('Error fetching historical ticket:', error);
      }
    };

    fetchHistoricalTicket();
  }, [restaurant]);

  // Breakeven calculations
  const ticketMedio = currentTicketMedio > 0 ? currentTicketMedio : historicalTicketMedio;
  const percentualDespesasVariaveis = totalRevenue > 0 ? (variableExpenses / totalRevenue) * 100 : 30; // Default 30% if no data
  const pontoEquilibrio = fixedExpenses / (1 - (percentualDespesasVariaveis / 100));
  const pedidosPontoEquilibrio = ticketMedio > 0 ? Math.ceil(pontoEquilibrio / ticketMedio) : 0;

  // Calculate expenses by category
  const expensesByCategory = categories.map(category => {
    const categoryExpenses = expenses.filter(e => e.categoria === category.nome);
    const total = categoryExpenses.reduce((sum, e) => sum + e.valor, 0);
    const count = categoryExpenses.length;
    return {
      ...category,
      total,
      count
    };
  }).filter(cat => cat.count > 0);

  // Filter expenses
  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = expense.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (expense.subcategoria && expense.subcategoria.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = !filterCategory || expense.categoria === filterCategory;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'pago' && expense.pago) ||
                         (filterStatus === 'pendente' && !expense.pago);
    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedExpenses = filteredExpenses.slice(startIndex, startIndex + itemsPerPage);

  const getCategoryIcon = (categoryName: string) => {
    switch (categoryName) {
      case 'Impostos': return Percent;
      case 'CMV': return Receipt;
      case 'Despesas com Vendas': return CreditCard;
      case 'CMO': return Target;
      case 'Marketing': return BarChart3;
      case 'Ocupação': return DollarSign;
      default: return CreditCard;
    }
  };

  const getCategoryColor = (categoryName: string) => {
    switch (categoryName) {
      case 'Impostos': return 'bg-red-500';
      case 'CMV': return 'bg-orange-500';
      case 'Despesas com Vendas': return 'bg-blue-500';
      case 'CMO': return 'bg-purple-500';
      case 'Marketing': return 'bg-pink-500';
      case 'Ocupação': return 'bg-indigo-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando despesas...</p>
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
          <h1 className="text-2xl font-bold text-gray-900">Despesas</h1>
          <p className="text-gray-600 mt-1">Gerencie e acompanhe suas despesas - {getFilterLabel()}</p>
        </div>
        <div className="flex items-center space-x-3">
          <DateFilterSelector />
          <button
            onClick={() => setShowQuickModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Zap className="w-4 h-4" />
            <span>Modo Rápido</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Despesa</span>
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
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Total de Despesas</h3>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            R$ {totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">{getFilterLabel()}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Despesas Fixas</h3>
            <Target className="w-5 h-5 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            R$ {fixedExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {totalExpenses > 0 ? ((fixedExpenses / totalExpenses) * 100).toFixed(1) : 0}% do total
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Despesas Variáveis</h3>
            <TrendingUp className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            R$ {variableExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {totalExpenses > 0 ? ((variableExpenses / totalExpenses) * 100).toFixed(1) : 0}% do total
          </p>
        </div>
      </div>

      {/* Segunda linha: Ponto de Equilíbrio - MELHORADO LAYOUT */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">Ponto de Equilíbrio</h3>
              <p className="text-gray-600">Faturamento necessário para cobrir custos fixos</p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-4xl font-bold text-purple-600 mb-2">
              R$ {pontoEquilibrio.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-purple-700 font-medium">Faturamento necessário</p>
          </div>
          
          <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
            <p className="text-4xl font-bold text-green-600 mb-2">
              {pedidosPontoEquilibrio.toLocaleString('pt-BR')}
            </p>
            <p className="text-green-700 font-medium">Pedidos necessários</p>
          </div>
        </div>
        
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">Ticket médio:</span> R$ {ticketMedio.toFixed(2)}
              {currentTicketMedio === 0 && historicalTicketMedio > 0 && (
                <span className="text-blue-600"> (histórico)</span>
              )}
            </div>
            <div>
              <span className="font-medium">Despesas fixas:</span> R$ {fixedExpenses.toFixed(2)}
            </div>
            <div>
              <span className="font-medium">Despesas variáveis:</span> {percentualDespesasVariaveis.toFixed(1)}% do faturamento
            </div>
          </div>
        </div>
      </div>

      {/* Category Cards */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Despesas por Categoria</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {expensesByCategory.map((category) => {
            const IconComponent = getCategoryIcon(category.nome);
            const colorClass = getCategoryColor(category.nome);
            
            return (
              <div 
                key={category.id} 
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-orange-300 hover:shadow-md transition-all cursor-pointer"
                onClick={() => setFilterCategory(filterCategory === category.nome ? '' : category.nome)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 ${colorClass} rounded-lg flex items-center justify-center`}>
                      <IconComponent className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{category.nome}</h4>
                      <p className="text-xs text-gray-500">{category.count} despesas</p>
                    </div>
                  </div>
                  {filterCategory === category.nome && (
                    <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">
                    R$ {category.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-gray-500">
                    {((category.total / totalExpenses) * 100).toFixed(1)}% do total
                  </div>
                </div>
              </div>
            );
          })}
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
                placeholder="Buscar despesas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Todos os status</option>
                <option value="pago">Pago</option>
                <option value="pendente">Pendente</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredExpenses.length} de {expenses.length} despesas
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Lista de Despesas</h3>
          <p className="text-sm text-gray-600 mt-1">Todas as despesas registradas no período</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Despesa</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedExpenses.map((expense) => (
                <tr key={expense.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{expense.nome}</div>
                      {expense.subcategoria && (
                        <div className="text-xs text-gray-500">{expense.subcategoria}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      expense.tipo === 'fixa' ? 'bg-purple-100 text-purple-800' : 
                      expense.tipo === 'marketing' ? 'bg-pink-100 text-pink-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {expense.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      R$ {expense.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {new Date(expense.data + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </div>
                    {expense.data_vencimento && (
                      <div className="text-xs text-gray-500">
                        Venc: {new Date(expense.data_vencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleTogglePayment(expense)}
                      className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                        expense.pago
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      }`}
                    >
                      {expense.pago ? '✓ Pago' : '⏳ Marcar como Pago'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleDeleteExpense(expense)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir despesa"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {filteredExpenses.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma despesa encontrada</h3>
              <p className="text-gray-600">Adicione suas primeiras despesas para começar a acompanhar os gastos.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredExpenses.length)} de {filteredExpenses.length} despesas
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

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Adicionar Despesa</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Data Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data da Compra *
                  </label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData(prev => ({ ...prev, data: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    value={formData.data_vencimento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_vencimento: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Pagamento
                  </label>
                  <input
                    type="date"
                    value={formData.data_pagamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_pagamento: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  />
                  <p className="text-xs text-gray-500 mt-1">Deixe em branco se ainda não foi pago</p>
                </div>
              </div>

              {/* Fornecedor/Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fornecedor/Nome *
                </label>
                <input
                  type="text"
                  value={formData.nome}
                  onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  placeholder="Ex: Supermercado ABC, Energia Elétrica, etc."
                  required
                />
              </div>

              {/* Category and Subcategory */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria *
                  </label>
                  <select
                    value={formData.categoria}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        categoria: e.target.value,
                        subcategoria: '' // Reset subcategory when category changes
                      }));
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    required
                  >
                    <option value="">Selecione uma categoria</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.nome}>
                        {category.nome}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Subcategoria *
                  </label>
                  <select
                    value={formData.subcategoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, subcategoria: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    disabled={!formData.categoria}
                    required
                  >
                    <option value="">Selecione uma subcategoria</option>
                    {formData.categoria && categories
                      .find(c => c.nome === formData.categoria)
                      ?.subcategorias.map(sub => (
                        <option key={sub.id} value={sub.nome}>
                          {sub.nome}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Value and Type */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.valor}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                    placeholder="0,00"
                    required
                  />
                </div>
                
                <div className="flex items-center justify-center">
                  {formData.categoria && (() => {
                    const selectedCategory = categories.find(c => c.nome === formData.categoria);
                    return (
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 mb-2">Tipo:</div>
                        <span className={`px-3 py-2 text-sm font-medium rounded-full ${
                          selectedCategory?.tipo === 'fixa' ? 'bg-purple-100 text-purple-800' : 
                          selectedCategory?.tipo === 'marketing' ? 'bg-pink-100 text-pink-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {selectedCategory?.tipo === 'fixa' ? 'Fixa' : 
                           selectedCategory?.tipo === 'marketing' ? 'Marketing' : 'Variável'}
                        </span>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Recorrente option for fixed expenses */}
              {formData.categoria && categories.find(c => c.nome === formData.categoria)?.tipo === 'fixa' && (
                <div className="flex items-center space-x-3 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <input
                    type="checkbox"
                    id="recorrente"
                    checked={formData.recorrente}
                    onChange={(e) => setFormData(prev => ({ ...prev, recorrente: e.target.checked }))}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                  <label htmlFor="recorrente" className="text-sm font-medium text-purple-800">
                    Despesa recorrente (criar para os próximos 11 meses)
                  </label>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddExpense}
                disabled={isSubmitting || !formData.data || !formData.nome || !formData.categoria || !formData.subcategoria || !formData.valor}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isSubmitting ? 'Salvando...' : 'Salvar Despesa'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Add Modal */}
      {showQuickModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Lançamento Rápido de Despesas</h2>
                <button
                  onClick={() => setShowQuickModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Preencha os valores para múltiplas despesas de uma só vez
              </p>
            </div>

            <div className="p-6 space-y-6">
              {/* Date Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Data das Despesas *
                </label>
                <input
                  type="date"
                  value={quickDate}
                  onChange={(e) => setQuickDate(e.target.value)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
                  required
                />
              </div>

              {/* Categories Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {categories.map(category => {
                  const IconComponent = getCategoryIcon(category.nome);
                  const colorClass = getCategoryColor(category.nome);
                  
                  return (
                    <div key={category.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className={`w-8 h-8 ${colorClass} rounded-lg flex items-center justify-center`}>
                          <IconComponent className="w-4 h-4 text-white" />
                        </div>
                        <h3 className="font-semibold text-gray-900">{category.nome}</h3>
                      </div>
                      
                      <div className="space-y-3">
                        {category.subcategorias.map(subcategory => (
                          <div key={subcategory.id} className="flex items-center space-x-3">
                            <label className="flex-1 text-sm text-gray-700">
                              {subcategory.nome}
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={quickExpenses[category.nome]?.[subcategory.nome] || ''}
                              onChange={(e) => {
                                setQuickExpenses(prev => ({
                                  ...prev,
                                  [category.nome]: {
                                    ...prev[category.nome],
                                    [subcategory.nome]: e.target.value
                                  }
                                }));
                              }}
                              className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                              placeholder="0,00"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowQuickModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleQuickAdd}
                disabled={isSubmitting || !quickDate}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                {isSubmitting && (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                )}
                <span>{isSubmitting ? 'Salvando...' : 'Salvar Despesas'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};