import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Calculator, FileText, AlertCircle, BarChart3, Download, Calendar, Minus, Receipt, Percent, CreditCard, Target, ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useDateFilter } from '../../hooks/useDateFilter';
import { useToast } from '../../hooks/useToast';
import { DateFilterSelector } from '../../components/Common/DateFilterSelector';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface Sale {
  id: string;
  data: string;
  canal: string;
  forma_pagamento: string;
  valor_bruto: number;
  numero_pedidos: number;
  ticket_medio: number;
}

interface Expense {
  id: string;
  data: string;
  nome: string;
  categoria: string;
  subcategoria: string;
  tipo: 'fixa' | 'variavel' | 'marketing' | 'taxa_automatica';
  valor: number;
  forma_pagamento: string;
  canal: string;
  recorrente: boolean;
  origem_automatica: boolean;
  observacoes: string | null;
  created_at: string;
}

interface DREData {
  // CORREÇÃO: Usar apenas receita total (valor bruto das vendas)
  receitaTotal: number;

  // Custos e Despesas por categoria DRE
  impostos: number;
  cmv: number;
  despesasVendas: number;
  cmo: number;
  marketing: number;
  ocupacao: number;

  // Totais
  totalCustosVariaveis: number;
  totalDespesasFixas: number;
  totalDespesas: number;

  // Resultado
  lucroBruto: number;
  margemBruta: number;
  lucroLiquido: number;
  margemLiquida: number;

  // Métricas
  ticketMedio: number;
  totalPedidos: number;

  // Detalhes por canal
  receitasPorCanal: Record<string, number>;
  receitasPorPagamento: Record<string, number>;
  despesasPorCategoria: Record<string, number>;
}

interface BenchmarkData {
  ticket_medio: number;
  margem_media: number;
  cmv_medio: number;
  gasto_fixo_medio: number;
  ponto_equilibrio_medio: number;
  taxa_media_venda: number;
  gasto_marketing_medio: number;
  total_restaurantes: number;
  fonte: string;
}

export const DREPage: React.FC = () => {
  const { restaurant } = useRestaurant();
  const { filterType, getDateRange, getFilterLabel, setFilterType } = useDateFilter();
  const { showSuccess, showError } = useToast();

  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [dreData, setDreData] = useState<DREData | null>(null);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [historicalTicket, setHistoricalTicket] = useState(0);

  // Expandable sections state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    canais: false,
    pagamentos: false,
    impostos: false,
    cmv: false,
    despesasVendas: false,
    cmo: false,
    marketing: false,
    ocupacao: false
  });

  // Quick filter buttons
  const quickFilters = [
    { type: 'hoje' as const, label: 'Hoje' },
    { type: '7dias' as const, label: '7 dias' },
    { type: 'mes_atual' as const, label: 'Este mês' },
    { type: 'mes_anterior' as const, label: 'Mês anterior' },
    { type: 'proximo_mes' as const, label: 'Próximo mês' }
  ];

  useEffect(() => {
    if (restaurant) {
      fetchData();
    }
  }, [restaurant, filterType]);

  // Listener para mudanças em tempo real
  useEffect(() => {
    if (!restaurant) return;

    const expensesSubscription = supabase
      .channel('expenses_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'expenses',
          filter: `restaurant_id=eq.${restaurant.id}`
        },
        () => fetchData()
      )
      .subscribe();

    const salesSubscription = supabase
      .channel('sales_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales',
          filter: `restaurant_id=eq.${restaurant.id}`
        },
        () => fetchData()
      )
      .subscribe();

    return () => {
      expensesSubscription.unsubscribe();
      salesSubscription.unsubscribe();
    };
  }, [restaurant]);

  const fetchData = async () => {
    if (!restaurant) return;

    setIsLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // Buscar vendas
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('data', start)
        .lte('data', end)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;
      setSales(salesData || []);

      // Buscar despesas
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('data', start)
        .lte('data', end)
        .order('created_at', { ascending: false });

      if (expensesError) throw expensesError;
      setExpenses(expensesData || []);

      // Buscar ticket médio histórico
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      
      const { data: historicalSales, error: historicalError } = await supabase
        .from('sales')
        .select('valor_bruto, numero_pedidos')
        .eq('restaurant_id', restaurant.id)
        .gte('data', sixMonthsAgo.toISOString().split('T')[0]);

      if (!historicalError && historicalSales) {
        const totalRevenue = historicalSales.reduce((sum, sale) => sum + sale.valor_bruto, 0);
        const totalOrders = historicalSales.reduce((sum, sale) => sum + sale.numero_pedidos, 0);
        setHistoricalTicket(totalOrders > 0 ? totalRevenue / totalOrders : 0);
      }

      // Buscar dados de benchmark
      const { data: benchmarkResult, error: benchmarkError } = await supabase
        .rpc('get_benchmark_data', {
          restaurant_cidade: restaurant.cidade,
          restaurant_estado: restaurant.estado,
          restaurant_categoria: restaurant.categoria_culinaria
        });

      if (!benchmarkError && benchmarkResult && benchmarkResult.length > 0) {
        setBenchmarkData(benchmarkResult[0]);
      }

      // Calcular DRE
      calculateDRE(salesData || [], expensesData || []);

    } catch (error) {
      console.error('Error fetching DRE data:', error);
      showError('Erro ao carregar dados', 'Não foi possível carregar os dados da DRE.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateDRE = (salesData: Sale[], expensesData: Expense[]) => {
    // CORREÇÃO SIMPLES: Receita Total = soma dos valores brutos das vendas (SEM descontar nada)
    const receitaTotal = salesData.reduce((sum, sale) => sum + sale.valor_bruto, 0);
    const totalPedidos = salesData.reduce((sum, sale) => sum + sale.numero_pedidos, 0);
    const ticketMedio = totalPedidos > 0 ? receitaTotal / totalPedidos : historicalTicket;

    // Receitas por canal
    const receitasPorCanal = salesData.reduce((acc, sale) => {
      acc[sale.canal] = (acc[sale.canal] || 0) + sale.valor_bruto;
      return acc;
    }, {} as Record<string, number>);

    // Receitas por forma de pagamento
    const receitasPorPagamento = salesData.reduce((acc, sale) => {
      acc[sale.forma_pagamento] = (acc[sale.forma_pagamento] || 0) + sale.valor_bruto;
      return acc;
    }, {} as Record<string, number>);

    // Despesas por categoria DRE
    const impostos = expensesData
      .filter(expense => expense.categoria === 'Impostos')
      .reduce((sum, expense) => sum + expense.valor, 0);

    const cmv = expensesData
      .filter(expense => expense.categoria === 'CMV')
      .reduce((sum, expense) => sum + expense.valor, 0);

    const despesasVendas = expensesData
      .filter(expense => expense.categoria === 'Despesas com Vendas')
      .reduce((sum, expense) => sum + expense.valor, 0);

    const cmo = expensesData
      .filter(expense => expense.categoria === 'CMO')
      .reduce((sum, expense) => sum + expense.valor, 0);

    const marketing = expensesData
      .filter(expense => expense.categoria === 'Marketing')
      .reduce((sum, expense) => sum + expense.valor, 0);

    const ocupacao = expensesData
      .filter(expense => expense.categoria === 'Ocupação')
      .reduce((sum, expense) => sum + expense.valor, 0);

    // Totais
    const totalCustosVariaveis = impostos + cmv + despesasVendas;
    const totalDespesasFixas = cmo + marketing + ocupacao;
    const totalDespesas = totalCustosVariaveis + totalDespesasFixas;

    // Despesas por categoria (para detalhamento)
    const despesasPorCategoria = expensesData.reduce((acc, expense) => {
      acc[expense.categoria] = (acc[expense.categoria] || 0) + expense.valor;
      return acc;
    }, {} as Record<string, number>);

    // CORREÇÃO: Resultado baseado na receita total (sem descontar taxas)
    const lucroBruto = receitaTotal - totalCustosVariaveis;
    const margemBruta = receitaTotal > 0 ? (lucroBruto / receitaTotal) * 100 : 0;

    const lucroLiquido = lucroBruto - totalDespesasFixas;
    const margemLiquida = receitaTotal > 0 ? (lucroLiquido / receitaTotal) * 100 : 0;

    const dreCalculada = {
      receitaTotal,
      impostos,
      cmv,
      despesasVendas,
      cmo,
      marketing,
      ocupacao,
      totalCustosVariaveis,
      totalDespesasFixas,
      totalDespesas,
      lucroBruto,
      margemBruta,
      lucroLiquido,
      margemLiquida,
      ticketMedio,
      totalPedidos,
      receitasPorCanal,
      receitasPorPagamento,
      despesasPorCategoria
    };

    setDreData(dreCalculada);
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const getSubcategoriesForCategory = (categoria: string) => {
    return expenses
      .filter(expense => expense.categoria === categoria)
      .reduce((acc, expense) => {
        const key = expense.subcategoria || 'Outros';
        acc[key] = (acc[key] || 0) + expense.valor;
        return acc;
      }, {} as Record<string, number>);
  };

  const exportDRE = () => {
    if (!dreData) return;

    const dreText = `
DEMONSTRAÇÃO DO RESULTADO DO EXERCÍCIO
${restaurant?.nome}
Período: ${getFilterLabel()}

RECEITAS
Receita Total: ${formatCurrency(dreData.receitaTotal)}

CUSTOS E DESPESAS VARIÁVEIS
(-) Impostos: ${formatCurrency(dreData.impostos)}
(-) CMV: ${formatCurrency(dreData.cmv)}
(-) Despesas com Vendas: ${formatCurrency(dreData.despesasVendas)}
(=) Total Custos Variáveis: ${formatCurrency(dreData.totalCustosVariaveis)}

(=) Lucro Bruto: ${formatCurrency(dreData.lucroBruto)} (${formatPercentage(dreData.margemBruta)})

DESPESAS FIXAS
(-) CMO: ${formatCurrency(dreData.cmo)}
(-) Marketing: ${formatCurrency(dreData.marketing)}
(-) Ocupação: ${formatCurrency(dreData.ocupacao)}
(=) Total Despesas Fixas: ${formatCurrency(dreData.totalDespesasFixas)}

RESULTADO
(=) Lucro Líquido: ${formatCurrency(dreData.lucroLiquido)} (${formatPercentage(dreData.margemLiquida)})

MÉTRICAS
Ticket Médio: ${formatCurrency(dreData.ticketMedio)}
Total de Pedidos: ${dreData.totalPedidos}
`;

    const blob = new Blob([dreText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DRE_${restaurant?.nome}_${getFilterLabel()}.txt`;
    a.click();
    URL.revokeObjectURL(url);

    showSuccess('DRE exportada!', 'O arquivo foi baixado com sucesso.');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando DRE...</p>
        </div>
      </div>
    );
  }

  if (!dreData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Dados insuficientes</h2>
          <p className="text-gray-600">Adicione vendas e despesas para gerar a DRE.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <FileText className="w-7 h-7 mr-3 text-orange-600" />
            DRE - Demonstração do Resultado
          </h1>
          <p className="text-gray-600 mt-1">Análise financeira completa - {getFilterLabel()}</p>
        </div>
        <div className="flex items-center space-x-3">
          <Link 
            to="/dre/analytics" 
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Análise Temporal</span>
          </Link>
          <DateFilterSelector />
          <button
            onClick={exportDRE}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar DRE</span>
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
            <h3 className="text-sm font-medium text-gray-700">Receita Total</h3>
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(dreData.receitaTotal)}</p>
          <p className="text-xs text-gray-500 mt-1">{dreData.totalPedidos} pedidos • Ticket: {formatCurrency(dreData.ticketMedio)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Despesa Total</h3>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(dreData.totalDespesas)}</p>
          <p className="text-xs text-gray-500 mt-1">Custos + Despesas</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-700">Lucro Líquido</h3>
            <Calculator className={`w-5 h-5 ${dreData.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`} />
          </div>
          <p className={`text-2xl font-bold ${dreData.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {formatCurrency(dreData.lucroLiquido)}
          </p>
          <p className="text-xs text-gray-500 mt-1">Margem: {formatPercentage(dreData.margemLiquida)}</p>
        </div>
      </div>

      {/* DRE Table Structure */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Demonstração do Resultado do Exercício</h2>
          <p className="text-sm text-gray-600 mt-1">Estrutura DRE detalhada com análise por categorias</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">% Receita</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Detalhes</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {/* RECEITA TOTAL */}
              <tr className="bg-green-50">
                <td className="px-6 py-4 font-bold text-green-800">RECEITA TOTAL</td>
                <td className="px-6 py-4 text-right font-bold text-green-800">{formatCurrency(dreData.receitaTotal)}</td>
                <td className="px-6 py-4 text-right font-bold text-green-800">100.0%</td>
                <td className="px-6 py-4"></td>
              </tr>

              {/* Receitas por Canal */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 pl-8 text-gray-700">Receitas por Canal</td>
                <td className="px-6 py-4 text-right text-gray-900">{formatCurrency(dreData.receitaTotal)}</td>
                <td className="px-6 py-4 text-right text-gray-600">100.0%</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => toggleSection('canais')}
                    className="text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    {expandedSections.canais ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </td>
              </tr>

              {expandedSections.canais && Object.entries(dreData.receitasPorCanal)
                .sort(([,a], [,b]) => b - a)
                .map(([canal, valor]) => (
                  <tr key={canal} className="bg-green-25">
                    <td className="px-6 py-2 pl-12 text-sm text-gray-600">{canal}</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-700">{formatCurrency(valor)}</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-600">
                      {formatPercentage((valor / dreData.receitaTotal) * 100)}
                    </td>
                    <td className="px-6 py-2"></td>
                  </tr>
                ))}

              {/* CUSTOS E DESPESAS VARIÁVEIS */}
              <tr className="bg-red-50">
                <td className="px-6 py-4 font-bold text-red-800">CUSTOS E DESPESAS VARIÁVEIS</td>
                <td className="px-6 py-4 text-right font-bold text-red-800">({formatCurrency(dreData.totalCustosVariaveis)})</td>
                <td className="px-6 py-4 text-right font-bold text-red-800">
                  {formatPercentage((dreData.totalCustosVariaveis / dreData.receitaTotal) * 100)}
                </td>
                <td className="px-6 py-4"></td>
              </tr>

              {/* Impostos */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 pl-8 text-gray-700 flex items-center">
                  <Percent className="w-4 h-4 mr-2 text-red-600" />
                  Impostos
                </td>
                <td className="px-6 py-4 text-right text-gray-900">({formatCurrency(dreData.impostos)})</td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {formatPercentage((dreData.impostos / dreData.receitaTotal) * 100)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => toggleSection('impostos')}
                    className="text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    {expandedSections.impostos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </td>
              </tr>

              {expandedSections.impostos && Object.entries(getSubcategoriesForCategory('Impostos'))
                .sort(([,a], [,b]) => b - a)
                .map(([subcategoria, valor]) => (
                  <tr key={subcategoria} className="bg-red-25">
                    <td className="px-6 py-2 pl-12 text-sm text-gray-600">{subcategoria}</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-700">({formatCurrency(valor)})</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-600">
                      {formatPercentage((valor / dreData.receitaTotal) * 100)}
                    </td>
                    <td className="px-6 py-2"></td>
                  </tr>
                ))}

              {/* CMV */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 pl-8 text-gray-700 flex items-center">
                  <Receipt className="w-4 h-4 mr-2 text-orange-600" />
                  CMV
                </td>
                <td className="px-6 py-4 text-right text-gray-900">({formatCurrency(dreData.cmv)})</td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {formatPercentage((dreData.cmv / dreData.receitaTotal) * 100)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => toggleSection('cmv')}
                    className="text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    {expandedSections.cmv ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </td>
              </tr>

              {expandedSections.cmv && Object.entries(getSubcategoriesForCategory('CMV'))
                .sort(([,a], [,b]) => b - a)
                .map(([subcategoria, valor]) => (
                  <tr key={subcategoria} className="bg-orange-25">
                    <td className="px-6 py-2 pl-12 text-sm text-gray-600">{subcategoria}</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-700">({formatCurrency(valor)})</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-600">
                      {formatPercentage((valor / dreData.receitaTotal) * 100)}
                    </td>
                    <td className="px-6 py-2"></td>
                  </tr>
                ))}

              {/* Despesas com Vendas */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 pl-8 text-gray-700 flex items-center">
                  <CreditCard className="w-4 h-4 mr-2 text-blue-600" />
                  Despesas com Vendas
                </td>
                <td className="px-6 py-4 text-right text-gray-900">({formatCurrency(dreData.despesasVendas)})</td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {formatPercentage((dreData.despesasVendas / dreData.receitaTotal) * 100)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => toggleSection('despesasVendas')}
                    className="text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    {expandedSections.despesasVendas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </td>
              </tr>

              {expandedSections.despesasVendas && Object.entries(getSubcategoriesForCategory('Despesas com Vendas'))
                .sort(([,a], [,b]) => b - a)
                .map(([subcategoria, valor]) => (
                  <tr key={subcategoria} className="bg-blue-25">
                    <td className="px-6 py-2 pl-12 text-sm text-gray-600">{subcategoria}</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-700">({formatCurrency(valor)})</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-600">
                      {formatPercentage((valor / dreData.receitaTotal) * 100)}
                    </td>
                    <td className="px-6 py-2"></td>
                  </tr>
                ))}

              {/* LUCRO BRUTO */}
              <tr className="bg-blue-50 border-t-2 border-blue-200">
                <td className="px-6 py-4 font-bold text-blue-800">LUCRO BRUTO</td>
                <td className="px-6 py-4 text-right font-bold text-blue-800">{formatCurrency(dreData.lucroBruto)}</td>
                <td className="px-6 py-4 text-right font-bol text-blue-800">{formatPercentage(dreData.margemBruta)}</td>
                <td className="px-6 py-4"></td>
              </tr>

              {/* DESPESAS FIXAS */}
              <tr className="bg-purple-50">
                <td className="px-6 py-4 font-bold text-purple-800">DESPESAS FIXAS</td>
                <td className="px-6 py-4 text-right font-bold text-purple-800">({formatCurrency(dreData.totalDespesasFixas)})</td>
                <td className="px-6 py-4 text-right font-bold text-purple-800">
                  {formatPercentage((dreData.totalDespesasFixas / dreData.receitaTotal) * 100)}
                </td>
                <td className="px-6 py-4"></td>
              </tr>

              {/* CMO */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 pl-8 text-gray-700 flex items-center">
                  <Target className="w-4 h-4 mr-2 text-purple-600" />
                  CMO
                </td>
                <td className="px-6 py-4 text-right text-gray-900">({formatCurrency(dreData.cmo)})</td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {formatPercentage((dreData.cmo / dreData.receitaTotal) * 100)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => toggleSection('cmo')}
                    className="text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    {expandedSections.cmo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </td>
              </tr>

              {expandedSections.cmo && Object.entries(getSubcategoriesForCategory('CMO'))
                .sort(([,a], [,b]) => b - a)
                .map(([subcategoria, valor]) => (
                  <tr key={subcategoria} className="bg-purple-25">
                    <td className="px-6 py-2 pl-12 text-sm text-gray-600">{subcategoria}</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-700">({formatCurrency(valor)})</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-600">
                      {formatPercentage((valor / dreData.receitaTotal) * 100)}
                    </td>
                    <td className="px-6 py-2"></td>
                  </tr>
                ))}

              {/* Marketing */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 pl-8 text-gray-700 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-2 text-pink-600" />
                  Marketing
                </td>
                <td className="px-6 py-4 text-right text-gray-900">({formatCurrency(dreData.marketing)})</td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {formatPercentage((dreData.marketing / dreData.receitaTotal) * 100)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => toggleSection('marketing')}
                    className="text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    {expandedSections.marketing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </td>
              </tr>

              {expandedSections.marketing && Object.entries(getSubcategoriesForCategory('Marketing'))
                .sort(([,a], [,b]) => b - a)
                .map(([subcategoria, valor]) => (
                  <tr key={subcategoria} className="bg-pink-25">
                    <td className="px-6 py-2 pl-12 text-sm text-gray-600">{subcategoria}</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-700">({formatCurrency(valor)})</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-600">
                      {formatPercentage((valor / dreData.receitaTotal) * 100)}
                    </td>
                    <td className="px-6 py-2"></td>
                  </tr>
                ))}

              {/* Ocupação */}
              <tr className="hover:bg-gray-50">
                <td className="px-6 py-4 pl-8 text-gray-700 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2 text-indigo-600" />
                  Ocupação
                </td>
                <td className="px-6 py-4 text-right text-gray-900">({formatCurrency(dreData.ocupacao)})</td>
                <td className="px-6 py-4 text-right text-gray-600">
                  {formatPercentage((dreData.ocupacao / dreData.receitaTotal) * 100)}
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => toggleSection('ocupacao')}
                    className="text-orange-600 hover:text-orange-800 transition-colors"
                  >
                    {expandedSections.ocupacao ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </td>
              </tr>

              {expandedSections.ocupacao && Object.entries(getSubcategoriesForCategory('Ocupação'))
                .sort(([,a], [,b]) => b - a)
                .map(([subcategoria, valor]) => (
                  <tr key={subcategoria} className="bg-indigo-25">
                    <td className="px-6 py-2 pl-12 text-sm text-gray-600">{subcategoria}</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-700">({formatCurrency(valor)})</td>
                    <td className="px-6 py-2 text-right text-sm text-gray-600">
                      {formatPercentage((valor / dreData.receitaTotal) * 100)}
                    </td>
                    <td className="px-6 py-2"></td>
                  </tr>
                ))}

              {/* LUCRO LÍQUIDO */}
              <tr className="bg-orange-50 border-t-2 border-orange-200">
                <td className="px-6 py-4 font-bold text-orange-800 text-lg">LUCRO LÍQUIDO</td>
                <td className="px-6 py-4 text-right font-bold text-orange-800 text-lg">{formatCurrency(dreData.lucroLiquido)}</td>
                <td className="px-6 py-4 text-right font-bold text-orange-800 text-lg">{formatPercentage(dreData.margemLiquida)}</td>
                <td className="px-6 py-4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparativo com Mercado */}
      {benchmarkData && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Comparativo com o Mercado</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Margem Bruta</span>
              </div>
              <div className="text-lg font-bold text-gray-900">{formatPercentage(dreData.margemBruta)}</div>
              <div className="text-xs text-gray-500">Mercado: {formatPercentage(benchmarkData.margem_media)}</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">% CMV</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatPercentage((dreData.cmv / dreData.receitaTotal) * 100)}
              </div>
              <div className="text-xs text-gray-500">Mercado: {formatPercentage(benchmarkData.cmv_medio)}</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">% Gastos Fixos</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatPercentage((dreData.totalDespesasFixas / dreData.receitaTotal) * 100)}
              </div>
              <div className="text-xs text-gray-500">Mercado: {formatPercentage(benchmarkData.gasto_fixo_medio)}</div>
            </div>
            
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">% Marketing</span>
              </div>
              <div className="text-lg font-bold text-gray-900">
                {formatPercentage((dreData.marketing / dreData.receitaTotal) * 100)}
              </div>
              <div className="text-xs text-gray-500">Mercado: {formatPercentage(benchmarkData.gasto_marketing_medio)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Análise Temporal Link */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-sm border border-blue-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Análise Temporal da DRE</h3>
            <p className="text-gray-600 mt-1">Compare a evolução mensal e anual dos seus resultados</p>
          </div>
          <Link 
            to="/dre/analytics" 
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <span>Ver Análise Completa</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
};