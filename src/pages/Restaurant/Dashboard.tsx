import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Users,
  BarChart3,
  Calendar,
  Filter,
  Settings,
  Building2,
  Plus,
  CreditCard,
  Lightbulb,
  Zap,
  Target,
  Percent,
  Receipt,
  TrendingDown,
  ChevronRight,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Minus,
} from "lucide-react";
import { useRestaurant } from "../../hooks/useRestaurant";
import { useDateFilter } from "../../hooks/useDateFilter";
import { DateFilterSelector } from "../../components/Common/DateFilterSelector";
import { supabase } from "../../lib/supabase";
import { ComparisonCard } from "../../components/Dashboard/ComparisonCard";
import { Link, useNavigate } from "react-router-dom";

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
  categoria: string;
  tipo: "fixa" | "variavel" | "marketing" | "taxa_automatica";
  valor: number;
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

interface MonthlyData {
  month: string;
  monthName: string;
  revenue: number;
  orders: number;
  ticket: number;
  expenses: number;
}

export const Dashboard: React.FC = () => {
  const { restaurant } = useRestaurant();
  const { filterType, setFilterType, getDateRange, getFilterLabel } =
    useDateFilter();
  const navigate = useNavigate();

  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData | null>(
    null
  );
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState<string>("");

  // Estados para controlar seções expandidas - TODAS VISÍVEIS POR PADRÃO
  const [expandedSections, setExpandedSections] = useState({
    vendas: true,
    custos: true,
    rentabilidade: true,
    comparativo: true,
    canais: true,
  });

  // Quick filter buttons - MUDANÇA: "hoje" para "ontem"
  const quickFilters = [
    { type: "ontem" as const, label: "Ontem" },
    { type: "7dias" as const, label: "7 dias" },
    { type: "mes_atual" as const, label: "Este mês" },
    { type: "mes_anterior" as const, label: "Mês anterior" },
    { type: "proximo_mes" as const, label: "Próximo mês" },
  ];

  useEffect(() => {
    if (restaurant) {
      fetchData();
    } else {
      // Se não tem restaurante, parar o loading
      setIsLoading(false);
    }
  }, [restaurant, filterType]);

  const fetchData = async () => {
    if (!restaurant) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const { start, end } = getDateRange();

      // Buscar vendas
      const { data: salesData, error: salesError } = await supabase
        .from("sales")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .gte("data", start)
        .lte("data", end)
        .order("created_at", { ascending: false });

      if (salesError) throw salesError;

      setSales(salesData || []);

      // Buscar despesas
      const { data: expensesData, error: expensesError } = await supabase
        .from("expenses")
        .select("*")
        .eq("restaurant_id", restaurant.id)
        .gte("data", start)
        .lte("data", end)
        .order("created_at", { ascending: false });

      if (expensesError) throw expensesError;

      setExpenses(expensesData || []);

      // Buscar dados históricos para comparativo mensal (últimos 6 meses)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);

      const { data: historicalSales, error: historicalSalesError } =
        await supabase
          .from("sales")
          .select("*")
          .eq("restaurant_id", restaurant.id)
          .gte("data", sixMonthsAgo.toISOString().split("T")[0])
          .order("data", { ascending: true });

      const { data: historicalExpenses, error: historicalExpensesError } =
        await supabase
          .from("expenses")
          .select("*")
          .eq("restaurant_id", restaurant.id)
          .gte("data", sixMonthsAgo.toISOString().split("T")[0])
          .order("data", { ascending: true });

      if (!historicalSalesError && !historicalExpensesError) {
        processMonthlyData(historicalSales || [], historicalExpenses || []);
      }

      // Buscar dados de benchmark usando a função
      try {
        const { data: benchmarkResult, error: benchmarkError } =
          await supabase.rpc("get_benchmark_data", {
            restaurant_cidade: restaurant.cidade,
            restaurant_estado: restaurant.estado,
            restaurant_categoria: restaurant.categoria_culinaria,
          });

        if (benchmarkError) {
          console.error("Error fetching benchmark data:", benchmarkError);
        } else if (benchmarkResult && benchmarkResult.length > 0) {
          setBenchmarkData(benchmarkResult[0]);
        } else {
          // Dados de benchmark simulados para quando não houver dados reais
          setBenchmarkData({
            ticket_medio: 35.0,
            margem_media: 15.0,
            cmv_medio: 30.0,
            gasto_fixo_medio: 25.0,
            ponto_equilibrio_medio: 10000.0,
            taxa_media_venda: 15.0,
            gasto_marketing_medio: 5.0,
            total_restaurantes: 100,
            fonte: "simulado_default",
          });
        }
      } catch (error) {
        console.error("Error with benchmark data:", error);
        // Dados de benchmark simulados para quando houver erro
        setBenchmarkData({
          ticket_medio: 35.0,
          margem_media: 15.0,
          cmv_medio: 30.0,
          gasto_fixo_medio: 25.0,
          ponto_equilibrio_medio: 10000.0,
          taxa_media_venda: 15.0,
          gasto_marketing_medio: 5.0,
          total_restaurantes: 100,
          fonte: "simulado_fallback",
        });
      }

      // Buscar região
      try {
        const { data: regionData } = await supabase
          .from("regions")
          .select("nome")
          .contains("estados", [restaurant.estado])
          .eq("ativo", true)
          .limit(1);

        if (regionData && regionData.length > 0) {
          setRegion(regionData[0].nome);
        } else {
          setRegion("Sudeste"); // Fallback
        }
      } catch (error) {
        console.error("Error fetching region:", error);
        setRegion("Sudeste"); // Fallback em caso de erro
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const processMonthlyData = (salesData: Sale[], expensesData: Expense[]) => {
    const monthlyMap = new Map<string, MonthlyData>();

    // Inicializar últimos 6 meses
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;
      const monthName = date.toLocaleDateString("pt-BR", {
        month: "short",
        year: "numeric",
      });

      monthlyMap.set(monthKey, {
        month: monthKey,
        monthName,
        revenue: 0,
        orders: 0,
        ticket: 0,
        expenses: 0,
      });
    }

    // Processar vendas
    salesData.forEach((sale) => {
      const saleDate = new Date(sale.data + "T00:00:00");
      const monthKey = `${saleDate.getFullYear()}-${String(
        saleDate.getMonth() + 1
      ).padStart(2, "0")}`;

      if (monthlyMap.has(monthKey)) {
        const monthData = monthlyMap.get(monthKey)!;
        monthData.revenue += sale.valor_bruto;
        monthData.orders += sale.numero_pedidos;
      }
    });

    // Processar despesas
    expensesData.forEach((expense) => {
      const expenseDate = new Date(expense.data + "T00:00:00");
      const monthKey = `${expenseDate.getFullYear()}-${String(
        expenseDate.getMonth() + 1
      ).padStart(2, "0")}`;

      if (monthlyMap.has(monthKey)) {
        const monthData = monthlyMap.get(monthKey)!;
        monthData.expenses += expense.valor;
      }
    });

    // Calcular ticket médio
    monthlyMap.forEach((monthData) => {
      monthData.ticket =
        monthData.orders > 0 ? monthData.revenue / monthData.orders : 0;
    });

    setMonthlyData(Array.from(monthlyMap.values()));
  };

  // Calcular métricas das vendas
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.valor_bruto, 0);
  const totalOrders = sales.reduce((sum, sale) => sum + sale.numero_pedidos, 0);
  const averageTicket = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Calcular métricas das despesas POR CATEGORIA (não por tipo)
  const totalExpenses = expenses.reduce(
    (sum, expense) => sum + expense.valor,
    0
  );

  // CORRIGIDO: Despesas por categoria específica
  const cmvExpenses = expenses
    .filter((e) => e.categoria === "CMV")
    .reduce((sum, expense) => sum + expense.valor, 0);
  const impostosExpenses = expenses
    .filter((e) => e.categoria === "Impostos")
    .reduce((sum, expense) => sum + expense.valor, 0);
  const despesasVendasExpenses = expenses
    .filter((e) => e.categoria === "Despesas com Vendas")
    .reduce((sum, expense) => sum + expense.valor, 0);
  const cmoExpenses = expenses
    .filter((e) => e.categoria === "CMO")
    .reduce((sum, expense) => sum + expense.valor, 0);
  const marketingExpenses = expenses
    .filter((e) => e.categoria === "Marketing")
    .reduce((sum, expense) => sum + expense.valor, 0);
  const ocupacaoExpenses = expenses
    .filter((e) => e.categoria === "Ocupação")
    .reduce((sum, expense) => sum + expense.valor, 0);

  // Calcular totais por tipo DRE
  const totalCustosVariaveis =
    impostosExpenses + cmvExpenses + despesasVendasExpenses;
  const totalDespesasFixas = cmoExpenses + marketingExpenses + ocupacaoExpenses;

  // Calcular percentuais
  const cmvPercentage =
    totalRevenue > 0 ? (cmvExpenses / totalRevenue) * 100 : 0;
  const impostosPercentage =
    totalRevenue > 0 ? (impostosExpenses / totalRevenue) * 100 : 0;
  const despesasVendasPercentage =
    totalRevenue > 0 ? (despesasVendasExpenses / totalRevenue) * 100 : 0;
  const cmoPercentage =
    totalRevenue > 0 ? (cmoExpenses / totalRevenue) * 100 : 0;
  const marketingPercentage =
    totalRevenue > 0 ? (marketingExpenses / totalRevenue) * 100 : 0;
  const ocupacaoPercentage =
    totalRevenue > 0 ? (ocupacaoExpenses / totalRevenue) * 100 : 0;
  const fixedExpensesPercentage =
    totalRevenue > 0 ? (totalDespesasFixas / totalRevenue) * 100 : 0;

  // Calcular margem de contribuição e lucro líquido
  const margemContribuicao = totalRevenue - totalCustosVariaveis;
  const margemContribuicaoPercentage =
    totalRevenue > 0 ? (margemContribuicao / totalRevenue) * 100 : 0;
  const lucroLiquido = margemContribuicao - totalDespesasFixas;
  const lucroLiquidoPercentage =
    totalRevenue > 0 ? (lucroLiquido / totalRevenue) * 100 : 0;

  // Calcular vendas por canal com comparativo de mercado
  const channelSales = sales.reduce((acc, sale) => {
    if (!acc[sale.canal]) {
      acc[sale.canal] = { revenue: 0, orders: 0 };
    }
    acc[sale.canal].revenue += sale.valor_bruto;
    acc[sale.canal].orders += sale.numero_pedidos;
    return acc;
  }, {} as Record<string, { revenue: number; orders: number }>);

  const sortedChannels = Object.entries(channelSales)
    .sort(([, a], [, b]) => b.revenue - a.revenue)
    .slice(0, 3);

  // Dados simulados de mercado para canais (baseado na região)
  const getMarketChannelData = (channelName: string) => {
    const marketData = {
      Salão: { percentage: 45, avgTicket: benchmarkData?.ticket_medio || 35 },
      iFood: {
        percentage: 30,
        avgTicket: (benchmarkData?.ticket_medio || 35) * 0.9,
      },
      WhatsApp: {
        percentage: 15,
        avgTicket: (benchmarkData?.ticket_medio || 35) * 1.1,
      },
      Telefone: {
        percentage: 5,
        avgTicket: (benchmarkData?.ticket_medio || 35) * 1.2,
      },
      "Retirada (balcão)": {
        percentage: 3,
        avgTicket: (benchmarkData?.ticket_medio || 35) * 0.8,
      },
      "App próprio": {
        percentage: 2,
        avgTicket: (benchmarkData?.ticket_medio || 35) * 1.0,
      },
    };

    return (
      marketData[channelName as keyof typeof marketData] || {
        percentage: 10,
        avgTicket: benchmarkData?.ticket_medio || 35,
      }
    );
  };

  // NOVO: Função para abrir modal de vendas
  const handleOpenSalesModal = () => {
    navigate("/sales#add-modal");
  };

  // NOVO: Função para abrir modal de despesas
  const handleOpenExpensesModal = () => {
    navigate("/expenses#add-modal");
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Função para calcular variação entre meses
  const getMonthlyVariation = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, type: "neutral" as const };
    const variation = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(variation),
      type:
        variation > 0
          ? ("positive" as const)
          : variation < 0
          ? ("negative" as const)
          : ("neutral" as const),
    };
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!restaurant) {
    return (
      <div className="p-6 flex flex-col items-center justify-center min-h-screen">
        <div className="text-center max-w-md">
          <Building2 className="w-16 h-16 text-orange-500 mx-auto mb-6" />
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            Bem-vindo ao FoodDash!
          </h3>
          <p className="text-gray-600 mb-6">
            Para começar a usar todas as funcionalidades, complete seu perfil de
            restaurante.
          </p>
          <Link
            to="/profile"
            className="px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors inline-flex items-center"
          >
            <Settings className="w-5 h-5 mr-2" />
            Configurar Perfil
          </Link>
        </div>
      </div>
    );
  }

  // Se tem restaurante mas não tem dados completos
  if (
    !restaurant.cidade ||
    !restaurant.estado ||
    !restaurant.categoria_culinaria
  ) {
    return (
      <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
        {/* Header com Período e Comparação - SIMPLIFICADO */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Dashboard - {getFilterLabel()}
              </h2>
              <p className="text-sm text-orange-600 font-medium">
                Complete seu perfil para ativar o benchmarking
              </p>
            </div>
          </div>
        </div>

        {/* Mensagem de perfil incompleto */}
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-8 rounded-xl shadow-sm border-2 border-orange-200 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Lightbulb className="w-16 h-16 text-orange-500" />
              <Zap className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            🚀 Quase lá! Complete seu perfil para desbloquear todos os recursos
          </h3>
          <p className="text-gray-700 mb-6 max-w-2xl mx-auto leading-relaxed">
            Para ativar o benchmarking e comparar seu restaurante com outros do
            mercado, precisamos de algumas informações básicas:
          </p>

          <div className="bg-white/70 p-4 rounded-lg border border-orange-200 mb-6 max-w-md mx-auto">
            <ul className="text-left space-y-2">
              {!restaurant.cidade && (
                <li className="flex items-center text-red-600">
                  <Minus className="w-4 h-4 mr-2" />
                  <span>Cidade do restaurante</span>
                </li>
              )}
              {!restaurant.estado && (
                <li className="flex items-center text-red-600">
                  <Minus className="w-4 h-4 mr-2" />
                  <span>Estado do restaurante</span>
                </li>
              )}
              {!restaurant.categoria_culinaria && (
                <li className="flex items-center text-red-600">
                  <Minus className="w-4 h-4 mr-2" />
                  <span>Categoria culinária</span>
                </li>
              )}
            </ul>
          </div>

          <Link
            to="/profile"
            className="px-6 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white rounded-lg font-medium hover:from-orange-700 hover:to-orange-800 transition-all duration-200 inline-flex items-center shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Settings className="w-5 h-5 mr-2" />
            <span>Completar Perfil</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-8 bg-gray-50 min-h-screen">
      {/* Header com Período e Comparação - SIMPLIFICADO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Dashboard - {getFilterLabel()}
            </h2>
            <p className="text-sm text-orange-600 font-medium">
              Comparando com {benchmarkData?.total_restaurantes || 0}{" "}
              restaurantes da região {region}
            </p>
          </div>
        </div>
      </div>

      {/* NOVO: Filtros com Ações Rápidas Integradas - LAYOUT COMPACTO */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Filtros Rápidos */}
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros:</span>
            {quickFilters.map((filter) => (
              <button
                key={filter.type}
                onClick={() => setFilterType(filter.type)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                  filterType === filter.type
                    ? "bg-orange-100 text-orange-700"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {filter.label}
              </button>
            ))}
            <DateFilterSelector />
          </div>

          {/* Ações Rápidas - COMPACTAS */}
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700 hidden lg:inline">
              Ações:
            </span>
            <button
              onClick={handleOpenSalesModal}
              className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Venda</span>
            </button>
            <button
              onClick={handleOpenExpensesModal}
              className="flex items-center space-x-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm"
            >
              <CreditCard className="w-4 h-4" />
              <span>Despesa</span>
            </button>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: VENDAS E FATURAMENTO */}
      {totalRevenue > 0 && benchmarkData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div
            className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection("vendas")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Vendas e Faturamento
                  </h2>
                  <p className="text-sm text-gray-600">
                    Compare seu desempenho de vendas com o mercado
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">3 métricas</span>
                {expandedSections.vendas ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {expandedSections.vendas && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ComparisonCard
                  title="Faturamento Total"
                  myValue={totalRevenue}
                  marketValue={benchmarkData.ticket_medio * totalOrders * 0.8}
                  format="currency"
                  icon={DollarSign}
                  color="bg-green-600"
                  totalRestaurants={benchmarkData.total_restaurantes}
                  region={region}
                />

                <ComparisonCard
                  title="Ticket Médio"
                  myValue={averageTicket}
                  marketValue={benchmarkData.ticket_medio}
                  format="currency"
                  icon={TrendingUp}
                  color="bg-purple-600"
                  totalRestaurants={benchmarkData.total_restaurantes}
                  region={region}
                />

                <ComparisonCard
                  title="Quantidade de Pedidos"
                  myValue={totalOrders}
                  marketValue={Math.round(totalOrders * 1.2)}
                  format="number"
                  icon={ShoppingCart}
                  color="bg-blue-600"
                  totalRestaurants={benchmarkData.total_restaurantes}
                  region={region}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 2: CUSTOS E DESPESAS - CORRIGIDO COM TODAS AS CATEGORIAS */}
      {totalRevenue > 0 && benchmarkData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div
            className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection("custos")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Custos e Despesas
                  </h2>
                  <p className="text-sm text-gray-600">
                    Analise seus gastos por categoria comparado ao mercado
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">6 categorias</span>
                {expandedSections.custos ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {expandedSections.custos && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ComparisonCard
                  title="Impostos (%)"
                  myValue={impostosPercentage}
                  marketValue={benchmarkData.taxa_media_venda * 0.3}
                  format="percentage"
                  icon={Percent}
                  color="bg-red-600"
                  totalRestaurants={benchmarkData.total_restaurantes}
                  region={region}
                />

                <ComparisonCard
                  title="CMV (%)"
                  myValue={cmvPercentage}
                  marketValue={benchmarkData.cmv_medio}
                  format="percentage"
                  icon={Receipt}
                  color="bg-orange-600"
                  totalRestaurants={benchmarkData.total_restaurantes}
                  region={region}
                />

                <ComparisonCard
                  title="Despesas com Vendas (%)"
                  myValue={despesasVendasPercentage}
                  marketValue={benchmarkData.taxa_media_venda * 0.7}
                  format="percentage"
                  icon={CreditCard}
                  color="bg-blue-600"
                  totalRestaurants={benchmarkData.total_restaurantes}
                  region={region}
                />

                <ComparisonCard
                  title="CMO (%)"
                  myValue={cmoPercentage}
                  marketValue={benchmarkData.gasto_fixo_medio * 0.6}
                  format="percentage"
                  icon={Users}
                  color="bg-purple-600"
                  totalRestaurants={benchmarkData.total_restaurantes}
                  region={region}
                />

                <ComparisonCard
                  title="Marketing (%)"
                  myValue={marketingPercentage}
                  marketValue={benchmarkData.gasto_marketing_medio}
                  format="percentage"
                  icon={BarChart3}
                  color="bg-pink-600"
                  totalRestaurants={benchmarkData.total_restaurantes}
                  region={region}
                />

                <ComparisonCard
                  title="Ocupação (%)"
                  myValue={ocupacaoPercentage}
                  marketValue={benchmarkData.gasto_fixo_medio * 0.4}
                  format="percentage"
                  icon={Building2}
                  color="bg-indigo-600"
                  totalRestaurants={benchmarkData.total_restaurantes}
                  region={region}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 3: RENTABILIDADE - CORRIGIDO */}
      {totalRevenue > 0 && benchmarkData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div
            className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection("rentabilidade")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                  <Target className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Rentabilidade
                  </h2>
                  <p className="text-sm text-gray-600">
                    Veja como está sua margem de contribuição e lucro líquido
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">2 métricas</span>
                {expandedSections.rentabilidade ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {expandedSections.rentabilidade && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ComparisonCard
                  title="Margem de Contribuição (%)"
                  myValue={margemContribuicaoPercentage}
                  marketValue={benchmarkData.margem_media}
                  format="percentage"
                  icon={Target}
                  color="bg-indigo-600"
                  totalRestaurants={benchmarkData.total_restaurantes}
                  region={region}
                />

                <ComparisonCard
                  title="Lucro Líquido (%)"
                  myValue={lucroLiquidoPercentage}
                  marketValue={
                    benchmarkData.margem_media - benchmarkData.gasto_fixo_medio
                  }
                  format="percentage"
                  icon={DollarSign}
                  color="bg-teal-600"
                  totalRestaurants={benchmarkData.total_restaurantes}
                  region={region}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 4: COMPARATIVO MENSAL - NOVA SEÇÃO COM EVOLUÇÃO TEMPORAL */}
      {monthlyData.length > 0 && monthlyData.some((m) => m.revenue > 0) && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div
            className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection("comparativo")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Evolução Mensal
                  </h2>
                  <p className="text-sm text-gray-600">
                    Compare receitas, pedidos, ticket médio e despesas dos
                    últimos 6 meses
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">6 meses</span>
                {expandedSections.comparativo ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {expandedSections.comparativo && (
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Receitas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <DollarSign className="w-5 h-5 text-green-600 mr-2" />
                    Receitas Mensais
                  </h3>
                  <div className="space-y-3">
                    {monthlyData.map((month, index) => {
                      const previousMonth =
                        index > 0 ? monthlyData[index - 1] : null;
                      const variation = previousMonth
                        ? getMonthlyVariation(
                            month.revenue,
                            previousMonth.revenue
                          )
                        : { value: 0, type: "neutral" as const };

                      return (
                        <div
                          key={month.month}
                          className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {month.monthName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {month.orders} pedidos
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-green-600">
                              R${" "}
                              {month.revenue.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            {variation.type !== "neutral" && (
                              <div
                                className={`text-xs flex items-center ${
                                  variation.type === "positive"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {variation.type === "positive" ? (
                                  <ArrowUp className="w-3 h-3 mr-1" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 mr-1" />
                                )}
                                {variation.value.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Ticket Médio */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <TrendingUp className="w-5 h-5 text-purple-600 mr-2" />
                    Ticket Médio
                  </h3>
                  <div className="space-y-3">
                    {monthlyData.map((month, index) => {
                      const previousMonth =
                        index > 0 ? monthlyData[index - 1] : null;
                      const variation = previousMonth
                        ? getMonthlyVariation(
                            month.ticket,
                            previousMonth.ticket
                          )
                        : { value: 0, type: "neutral" as const };

                      return (
                        <div
                          key={month.month}
                          className="flex items-center justify-between p-3 bg-purple-50 rounded-lg border border-purple-200"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {month.monthName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {month.orders} pedidos
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-purple-600">
                              R${" "}
                              {month.ticket.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            {variation.type !== "neutral" && (
                              <div
                                className={`text-xs flex items-center ${
                                  variation.type === "positive"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {variation.type === "positive" ? (
                                  <ArrowUp className="w-3 h-3 mr-1" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 mr-1" />
                                )}
                                {variation.value.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Despesas */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <CreditCard className="w-5 h-5 text-red-600 mr-2" />
                    Despesas Mensais
                  </h3>
                  <div className="space-y-3">
                    {monthlyData.map((month, index) => {
                      const previousMonth =
                        index > 0 ? monthlyData[index - 1] : null;
                      const variation = previousMonth
                        ? getMonthlyVariation(
                            month.expenses,
                            previousMonth.expenses
                          )
                        : { value: 0, type: "neutral" as const };

                      return (
                        <div
                          key={month.month}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {month.monthName}
                            </div>
                            <div className="text-sm text-gray-600">
                              {month.revenue > 0
                                ? `${(
                                    (month.expenses / month.revenue) *
                                    100
                                  ).toFixed(1)}% da receita`
                                : "Sem receita"}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-bold text-red-600">
                              R${" "}
                              {month.expenses.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            {variation.type !== "neutral" && (
                              <div
                                className={`text-xs flex items-center ${
                                  variation.type === "positive"
                                    ? "text-red-600"
                                    : "text-green-600"
                                }`}
                              >
                                {variation.type === "positive" ? (
                                  <ArrowUp className="w-3 h-3 mr-1" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 mr-1" />
                                )}
                                {variation.value.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Lucro Estimado */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Target className="w-5 h-5 text-blue-600 mr-2" />
                    Lucro Estimado
                  </h3>
                  <div className="space-y-3">
                    {monthlyData.map((month, index) => {
                      const lucro = month.revenue - month.expenses;
                      const margemLucro =
                        month.revenue > 0 ? (lucro / month.revenue) * 100 : 0;
                      const previousMonth =
                        index > 0 ? monthlyData[index - 1] : null;
                      const previousLucro = previousMonth
                        ? previousMonth.revenue - previousMonth.expenses
                        : 0;
                      const variation = previousMonth
                        ? getMonthlyVariation(lucro, previousLucro)
                        : { value: 0, type: "neutral" as const };

                      return (
                        <div
                          key={month.month}
                          className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div>
                            <div className="font-medium text-gray-900">
                              {month.monthName}
                            </div>
                            <div className="text-sm text-gray-600">
                              Margem: {margemLucro.toFixed(1)}%
                            </div>
                          </div>
                          <div className="text-right">
                            <div
                              className={`font-bold ${
                                lucro >= 0 ? "text-blue-600" : "text-red-600"
                              }`}
                            >
                              R${" "}
                              {lucro.toLocaleString("pt-BR", {
                                minimumFractionDigits: 2,
                              })}
                            </div>
                            {variation.type !== "neutral" && (
                              <div
                                className={`text-xs flex items-center ${
                                  variation.type === "positive"
                                    ? "text-green-600"
                                    : "text-red-600"
                                }`}
                              >
                                {variation.type === "positive" ? (
                                  <ArrowUp className="w-3 h-3 mr-1" />
                                ) : (
                                  <ArrowDown className="w-3 h-3 mr-1" />
                                )}
                                {variation.value.toFixed(1)}%
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SEÇÃO 5: COMPARATIVO POR CANAIS */}
      {sortedChannels.length > 0 && benchmarkData && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div
            className="p-6 border-b border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={() => toggleSection("canais")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Comparativo por Canais de Venda
                  </h2>
                  <p className="text-sm text-gray-600">
                    Análise detalhada de cada canal vs mercado
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">
                  {sortedChannels.length} canais
                </span>
                {expandedSections.canais ? (
                  <EyeOff className="w-5 h-5 text-gray-400" />
                ) : (
                  <Eye className="w-5 h-5 text-gray-400" />
                )}
              </div>
            </div>
          </div>

          {expandedSections.canais && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedChannels.map(([channel, data], index) => {
                  const marketData = getMarketChannelData(channel);
                  const myPercentage = (data.revenue / totalRevenue) * 100;
                  const myTicket = data.revenue / data.orders;

                  return (
                    <div
                      key={channel}
                      className="bg-white p-6 rounded-xl shadow-sm border border-gray-200"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold text-gray-900">
                          {channel}
                        </h3>
                        <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                          {index + 1}º lugar
                        </span>
                      </div>

                      <div className="space-y-4">
                        {/* Participação no Faturamento */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">
                              Participação no faturamento
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">
                                Você:
                              </span>
                              <span className="font-semibold text-orange-600">
                                {myPercentage.toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">
                                Mercado:
                              </span>
                              <span className="font-semibold text-blue-600">
                                {marketData.percentage}%
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Ticket Médio */}
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Ticket médio</span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">
                                Você:
                              </span>
                              <span className="font-semibold text-orange-600">
                                R${" "}
                                {myTicket.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-gray-600">
                                Mercado:
                              </span>
                              <span className="font-semibold text-blue-600">
                                R${" "}
                                {marketData.avgTicket.toLocaleString("pt-BR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Performance */}
                        <div
                          className={`p-2 rounded-lg text-center text-xs font-medium ${
                            myPercentage > marketData.percentage
                              ? "bg-green-50 text-green-700 border border-green-200"
                              : myPercentage < marketData.percentage * 0.8
                              ? "bg-red-50 text-red-700 border border-red-200"
                              : "bg-gray-50 text-gray-700 border border-gray-200"
                          }`}
                        >
                          {myPercentage > marketData.percentage
                            ? `${(
                                ((myPercentage - marketData.percentage) /
                                  marketData.percentage) *
                                100
                              ).toFixed(0)}% acima do mercado`
                            : myPercentage < marketData.percentage * 0.8
                            ? `${(
                                ((marketData.percentage - myPercentage) /
                                  marketData.percentage) *
                                100
                              ).toFixed(0)}% abaixo do mercado`
                            : "Na média do mercado"}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NOVA: Mensagem motivacional quando não há dados */}
      {totalRevenue === 0 && (
        <div className="bg-gradient-to-br from-orange-50 to-yellow-50 p-8 rounded-xl shadow-sm border-2 border-orange-200 text-center">
          <div className="flex justify-center mb-4">
            <div className="relative">
              <Lightbulb className="w-16 h-16 text-orange-500" />
              <Zap className="w-6 h-6 text-yellow-500 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h3 className="text-xl font-bold text-gray-900 mb-3">
            🚀 Pronto para decolar seus resultados?
          </h3>
          <p className="text-gray-700 mb-2 max-w-2xl mx-auto leading-relaxed">
            <strong>
              Você só pode ver dados comparativos se informar seus próprios
              dados!
            </strong>
          </p>
          <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
            Para o período <strong>{getFilterLabel()}</strong>, você ainda não
            registrou vendas. Comece agora e desbloqueie insights poderosos
            comparando seu desempenho com
            <strong>
              {" "}
              {benchmarkData?.total_restaurantes || 0} restaurantes
            </strong>{" "}
            da sua região!
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
            <button
              onClick={handleOpenSalesModal}
              className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium hover:from-green-700 hover:to-green-800 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              <Plus className="w-5 h-5" />
              <span>Registrar Primeira Venda</span>
            </button>
            <button
              onClick={() => setFilterType("mes_atual")}
              className="px-6 py-3 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
            >
              Ver Este Mês
            </button>
          </div>

          <div className="bg-white/70 p-4 rounded-lg border border-orange-200">
            <p className="text-sm text-gray-600">
              💡 <strong>Dica:</strong> Quanto mais dados você registrar, mais
              precisos serão seus comparativos e insights de mercado!
            </p>
          </div>
        </div>
      )}

      {/* Fonte dos Dados */}
      {benchmarkData && totalRevenue > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              Dados de comparação:{" "}
              {benchmarkData.fonte === "simulado" ? "Simulados" : "Reais"} •
              {benchmarkData.total_restaurantes} restaurantes de{" "}
              {restaurant.categoria_culinaria} na região {region}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
