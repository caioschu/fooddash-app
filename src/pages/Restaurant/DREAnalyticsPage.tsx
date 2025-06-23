import React, { useState, useEffect } from 'react';
import { Calendar, TrendingUp, TrendingDown, BarChart3, ArrowLeft, Download, Target, DollarSign, Percent, AlertCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface MonthlyDRE {
  month: string;
  year: number;
  monthName: string;
  receitaLiquida: number;
  totalCustosVariaveis: number;
  margemContribuicao: number;
  margemContribuicaoPercentual: number;
  totalDespesasFixas: number;
  lucroLiquido: number;
  margemLiquida: number;
  cmv: number;
  cmvPercentual: number;
  impostos: number;
  impostosPercentual: number;
  despesasVendas: number;
  despesasVendasPercentual: number;
  cmo: number;
  cmoPercentual: number;
  marketing: number;
  marketingPercentual: number;
  ocupacao: number;
  ocupacaoPercentual: number;
  totalPedidos: number;
  ticketMedio: number;
  hasData: boolean;
}

interface YearlyDRE {
  year: number;
  receitaLiquida: number;
  totalCustosVariaveis: number;
  margemContribuicao: number;
  margemContribuicaoPercentual: number;
  totalDespesasFixas: number;
  lucroLiquido: number;
  margemLiquida: number;
  cmv: number;
  cmvPercentual: number;
  totalPedidos: number;
  ticketMedio: number;
  mesesComDados: number;
}

export const DREAnalyticsPage: React.FC = () => {
  const { restaurant } = useRestaurant();
  const { showSuccess, showError } = useToast();
  
  const [monthlyData, setMonthlyData] = useState<MonthlyDRE[]>([]);
  const [yearlyData, setYearlyData] = useState<YearlyDRE[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  
  // Estados para expandir categorias
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    impostos: false,
    cmv: false,
    despesasVendas: false,
    cmo: false,
    marketing: false,
    ocupacao: false
  });

  const monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  const monthNamesComplete = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    if (restaurant) {
      fetchAnalyticsData();
    }
  }, [restaurant, selectedYear]);

  const fetchAnalyticsData = async () => {
    if (!restaurant) return;
    
    setIsLoading(true);
    try {
      // Buscar dados dos últimos 24 meses
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 2);
      startDate.setDate(1);
      
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      
      // Buscar vendas
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('data', startDate.toISOString().split('T')[0])
        .lte('data', endDate.toISOString().split('T')[0])
        .order('data', { ascending: true });

      if (salesError) throw salesError;

      // Buscar despesas
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .gte('data', startDate.toISOString().split('T')[0])
        .lte('data', endDate.toISOString().split('T')[0])
        .order('data', { ascending: true });

      if (expensesError) throw expensesError;

      // Processar dados por mês
      const monthlyMap = new Map<string, MonthlyDRE>();
      const yearlyMap = new Map<number, YearlyDRE>();

      // Inicializar meses dos últimos 24 meses
      for (let i = 0; i < 24; i++) {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        monthlyMap.set(monthKey, {
          month: monthKey,
          year: date.getFullYear(),
          monthName: monthNamesComplete[date.getMonth()],
          receitaLiquida: 0,
          totalCustosVariaveis: 0,
          margemContribuicao: 0,
          margemContribuicaoPercentual: 0,
          totalDespesasFixas: 0,
          lucroLiquido: 0,
          margemLiquida: 0,
          cmv: 0,
          cmvPercentual: 0,
          impostos: 0,
          impostosPercentual: 0,
          despesasVendas: 0,
          despesasVendasPercentual: 0,
          cmo: 0,
          cmoPercentual: 0,
          marketing: 0,
          marketingPercentual: 0,
          ocupacao: 0,
          ocupacaoPercentual: 0,
          totalPedidos: 0,
          ticketMedio: 0,
          hasData: false
        });
      }

      // Processar vendas
      (salesData || []).forEach(sale => {
        const saleDate = new Date(sale.data + 'T00:00:00');
        const monthKey = `${saleDate.getFullYear()}-${String(saleDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyMap.has(monthKey)) {
          const monthData = monthlyMap.get(monthKey)!;
          monthData.receitaLiquida += sale.valor_bruto;
          monthData.totalPedidos += sale.numero_pedidos;
          monthData.hasData = true;
        }
      });

      // Processar despesas
      (expensesData || []).forEach(expense => {
        const expenseDate = new Date(expense.data + 'T00:00:00');
        const monthKey = `${expenseDate.getFullYear()}-${String(expenseDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyMap.has(monthKey)) {
          const monthData = monthlyMap.get(monthKey)!;
          monthData.hasData = true;
          
          // Classificar despesas por categoria específica
          const isCMV = expense.categoria === 'CMV – Custo da Mercadoria Vendida' ||
                       expense.categoria === 'CMV' ||
                       expense.categoria.toLowerCase().includes('cmv') ||
                       expense.categoria.toLowerCase().includes('custo da mercadoria');
          
          const isImpostos = expense.categoria === 'Impostos';
          const isDespesasVendas = expense.categoria === 'Despesas com Vendas';
          const isCMO = expense.categoria === 'CMO – Custo de Mão de Obra';
          const isMarketing = expense.categoria === 'Marketing';
          const isOcupacao = expense.categoria === 'Ocupação';
          
          if (expense.tipo === 'variavel' || expense.tipo === 'taxa_automatica') {
            monthData.totalCustosVariaveis += expense.valor;
            
            if (isCMV) {
              monthData.cmv += expense.valor;
            } else if (isImpostos) {
              monthData.impostos += expense.valor;
            } else if (isDespesasVendas) {
              monthData.despesasVendas += expense.valor;
            }
          } else if (expense.tipo === 'fixa' || expense.tipo === 'marketing') {
            monthData.totalDespesasFixas += expense.valor;
            
            if (isCMO) {
              monthData.cmo += expense.valor;
            } else if (isMarketing) {
              monthData.marketing += expense.valor;
            } else if (isOcupacao) {
              monthData.ocupacao += expense.valor;
            }
          }
        }
      });

      // Calcular métricas derivadas
      monthlyMap.forEach(monthData => {
        monthData.ticketMedio = monthData.totalPedidos > 0 ? monthData.receitaLiquida / monthData.totalPedidos : 0;
        monthData.margemContribuicao = monthData.receitaLiquida - monthData.totalCustosVariaveis;
        monthData.margemContribuicaoPercentual = monthData.receitaLiquida > 0 ? (monthData.margemContribuicao / monthData.receitaLiquida) * 100 : 0;
        monthData.lucroLiquido = monthData.margemContribuicao - monthData.totalDespesasFixas;
        monthData.margemLiquida = monthData.receitaLiquida > 0 ? (monthData.lucroLiquido / monthData.receitaLiquida) * 100 : 0;
        
        // Calcular percentuais das categorias
        monthData.cmvPercentual = monthData.receitaLiquida > 0 ? (monthData.cmv / monthData.receitaLiquida) * 100 : 0;
        monthData.impostosPercentual = monthData.receitaLiquida > 0 ? (monthData.impostos / monthData.receitaLiquida) * 100 : 0;
        monthData.despesasVendasPercentual = monthData.receitaLiquida > 0 ? (monthData.despesasVendas / monthData.receitaLiquida) * 100 : 0;
        monthData.cmoPercentual = monthData.receitaLiquida > 0 ? (monthData.cmo / monthData.receitaLiquida) * 100 : 0;
        monthData.marketingPercentual = monthData.receitaLiquida > 0 ? (monthData.marketing / monthData.receitaLiquida) * 100 : 0;
        monthData.ocupacaoPercentual = monthData.receitaLiquida > 0 ? (monthData.ocupacao / monthData.receitaLiquida) * 100 : 0;
        
        // Agregar dados anuais
        if (!yearlyMap.has(monthData.year)) {
          yearlyMap.set(monthData.year, {
            year: monthData.year,
            receitaLiquida: 0,
            totalCustosVariaveis: 0,
            margemContribuicao: 0,
            margemContribuicaoPercentual: 0,
            totalDespesasFixas: 0,
            lucroLiquido: 0,
            margemLiquida: 0,
            cmv: 0,
            cmvPercentual: 0,
            totalPedidos: 0,
            ticketMedio: 0,
            mesesComDados: 0
          });
        }
        
        const yearData = yearlyMap.get(monthData.year)!;
        if (monthData.hasData) {
          yearData.mesesComDados++;
        }
        
        yearData.receitaLiquida += monthData.receitaLiquida;
        yearData.totalCustosVariaveis += monthData.totalCustosVariaveis;
        yearData.totalDespesasFixas += monthData.totalDespesasFixas;
        yearData.totalPedidos += monthData.totalPedidos;
        yearData.cmv += monthData.cmv;
      });

      // Calcular métricas anuais derivadas
      yearlyMap.forEach(yearData => {
        yearData.ticketMedio = yearData.totalPedidos > 0 ? yearData.receitaLiquida / yearData.totalPedidos : 0;
        yearData.margemContribuicao = yearData.receitaLiquida - yearData.totalCustosVariaveis;
        yearData.margemContribuicaoPercentual = yearData.receitaLiquida > 0 ? (yearData.margemContribuicao / yearData.receitaLiquida) * 100 : 0;
        yearData.lucroLiquido = yearData.margemContribuicao - yearData.totalDespesasFixas;
        yearData.margemLiquida = yearData.receitaLiquida > 0 ? (yearData.lucroLiquido / yearData.receitaLiquida) * 100 : 0;
        yearData.cmvPercentual = yearData.receitaLiquida > 0 ? (yearData.cmv / yearData.receitaLiquida) * 100 : 0;
      });

      // Converter para arrays e ordenar
      const monthlyArray = Array.from(monthlyMap.values())
        .filter(m => m.year === selectedYear)
        .sort((a, b) => a.month.localeCompare(b.month));
      
      const yearlyArray = Array.from(yearlyMap.values())
        .filter(y => y.mesesComDados > 0)
        .sort((a, b) => b.year - a.year);

      const years = Array.from(yearlyMap.keys()).sort((a, b) => b - a);

      setMonthlyData(monthlyArray);
      setYearlyData(yearlyArray);
      setAvailableYears(years);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      showError('Erro ao carregar dados', 'Não foi possível carregar os dados de análise.');
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getVariation = (current: number, previous: number) => {
    if (previous === 0) return { value: 0, type: 'neutral' as const };
    const variation = ((current - previous) / previous) * 100;
    return {
      value: Math.abs(variation),
      type: variation > 0 ? 'positive' as const : variation < 0 ? 'negative' as const : 'neutral' as const
    };
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  // CORREÇÃO: Função de exportação da análise temporal funcionando corretamente
  const exportToPDF = () => {
    // Criar conteúdo HTML estruturado para impressão com logo e nova visualização
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>DRE Analytics - ${restaurant?.nome} - ${selectedYear}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #f97316; padding-bottom: 20px; }
          .logo { max-height: 60px; margin-bottom: 10px; }
          .company-name { font-size: 24px; font-weight: bold; color: #f97316; margin-bottom: 5px; }
          .report-title { font-size: 18px; color: #666; }
          .period { font-size: 14px; color: #888; margin-top: 10px; }
          
          .summary-section { margin-bottom: 30px; }
          .summary-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #333; }
          .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
          .summary-card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; background: #f9fafb; }
          .summary-card h4 { margin: 0 0 10px 0; font-size: 14px; color: #666; }
          .summary-card .value { font-size: 18px; font-weight: bold; color: #333; }
          .summary-card .detail { font-size: 12px; color: #888; margin-top: 5px; }
          
          .table-section { margin-bottom: 30px; }
          .table-title { font-size: 16px; font-weight: bold; margin-bottom: 15px; color: #333; }
          table { width: 100%; border-collapse: collapse; font-size: 10px; }
          th, td { border: 1px solid #e5e7eb; padding: 6px; text-align: center; }
          th { background-color: #f3f4f6; font-weight: bold; color: #374151; }
          td:first-child, th:first-child { text-align: left; font-weight: bold; }
          .no-data { opacity: 0.5; }
          .positive { color: #059669; }
          .negative { color: #dc2626; }
          .neutral { color: #6b7280; }
          .category-header { background-color: #f9fafb; font-weight: bold; }
          .total-row { background-color: #f3f4f6; font-weight: bold; }
          
          .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 12px; color: #888; }
          
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          ${restaurant?.logo_url ? `<img src="${restaurant.logo_url}" alt="Logo" class="logo" />` : ''}
          <div class="company-name">${restaurant?.nome || 'Restaurante'}</div>
          <div class="report-title">Análise Temporal da DRE</div>
          <div class="period">Período: ${selectedYear}</div>
        </div>

        ${yearlyData.length > 0 ? `
        <div class="summary-section">
          <div class="summary-title">Resumo Anual</div>
          <div class="summary-grid">
            ${yearlyData.slice(0, 4).map(year => `
              <div class="summary-card">
                <h4>${year.year} (${year.mesesComDados} meses)</h4>
                <div class="value">${formatCurrency(year.receitaLiquida)}</div>
                <div class="detail">Margem Líquida: ${formatPercentage(year.margemLiquida)}</div>
                <div class="detail">Lucro: ${formatCurrency(year.lucroLiquido)}</div>
              </div>
            `).join('')}
          </div>
        </div>
        ` : ''}

        <div class="table-section">
          <div class="table-title">Evolução Mensal - ${selectedYear} (Categorias em Linhas, Meses em Colunas)</div>
          <table>
            <thead>
              <tr>
                <th>Categoria</th>
                ${monthlyData.map(month => `
                  <th>${monthNames[parseInt(month.month.split('-')[1]) - 1]}${!month.hasData ? '<br><small>(sem dados)</small>' : ''}</th>
                `).join('')}
              </tr>
            </thead>
            <tbody>
              <tr class="category-header" style="background-color: #dcfce7;">
                <td><strong>RECEITAS</strong></td>
                ${monthlyData.map(month => `
                  <td class="${!month.hasData ? 'no-data' : ''}">${formatCurrency(month.receitaLiquida)}</td>
                `).join('')}
              </tr>
              
              <tr class="category-header" style="background-color: #fef2f2;">
                <td><strong>CUSTOS VARIÁVEIS</strong></td>
                ${monthlyData.map(month => `
                  <td class="${!month.hasData ? 'no-data' : ''}">(${formatCurrency(month.totalCustosVariaveis)})</td>
                `).join('')}
              </tr>
              
              <tr>
                <td style="padding-left: 15px;">Impostos</td>
                ${monthlyData.map(month => `
                  <td class="${!month.hasData ? 'no-data' : ''}">(${formatCurrency(month.impostos)})<br><small>${formatPercentage(month.impostosPercentual)}</small></td>
                `).join('')}
              </tr>
              
              <tr>
                <td style="padding-left: 15px;">CMV</td>
                ${monthlyData.map(month => `
                  <td class="${!month.hasData ? 'no-data' : ''} ${month.cmvPercentual <= 30 ? 'positive' : month.cmvPercentual <= 35 ? 'neutral' : 'negative'}">(${formatCurrency(month.cmv)})<br><small>${formatPercentage(month.cmvPercentual)}</small></td>
                `).join('')}
              </tr>
              
              <tr>
                <td style="padding-left: 15px;">Despesas com Vendas</td>
                ${monthlyData.map(month => `
                  <td class="${!month.hasData ? 'no-data' : ''}">(${formatCurrency(month.despesasVendas)})<br><small>${formatPercentage(month.despesasVendasPercentual)}</small></td>
                `).join('')}
              </tr>
              
              <tr class="total-row" style="background-color: #dbeafe;">
                <td><strong>MARGEM DE CONTRIBUIÇÃO</strong></td>
                ${monthlyData.map(month => `
                  <td class="${!month.hasData ? 'no-data' : ''}">${formatCurrency(month.margemContribuicao)}<br><small>${formatPercentage(month.margemContribuicaoPercentual)}</small></td>
                `).join('')}
              </tr>
              
              <tr class="category-header" style="background-color: #f3e8ff;">
                <td><strong>DESPESAS FIXAS</strong></td>
                ${monthlyData.map(month => `
                  <td class="${!month.hasData ? 'no-data' : ''}">(${formatCurrency(month.totalDespesasFixas)})</td>
                `).join('')}
              </tr>
              
              <tr>
                <td style="padding-left: 15px;">CMO</td>
                ${monthlyData.map(month => `
                  <td class="${!month.hasData ? 'no-data' : ''}">(${formatCurrency(month.cmo)})<br><small>${formatPercentage(month.cmoPercentual)}</small></td>
                `).join('')}
              </tr>
              
              <tr>
                <td style="padding-left: 15px;">Marketing</td>
                ${monthlyData.map(month => `
                  <td class="${!month.hasData ? 'no-data' : ''}">(${formatCurrency(month.marketing)})<br><small>${formatPercentage(month.marketingPercentual)}</small></td>
                `).join('')}
              </tr>
              
              <tr>
                <td style="padding-left: 15px;">Ocupação</td>
                ${monthlyData.map(month => `
                  <td class="${!month.hasData ? 'no-data' : ''}">(${formatCurrency(month.ocupacao)})<br><small>${formatPercentage(month.ocupacaoPercentual)}</small></td>
                `).join('')}
              </tr>
              
              <tr class="total-row" style="background-color: #fed7aa;">
                <td><strong>LUCRO LÍQUIDO</strong></td>
                ${monthlyData.map(month => `
                  <td class="${!month.hasData ? 'no-data' : ''} ${month.lucroLiquido >= 0 ? 'positive' : 'negative'}">${formatCurrency(month.lucroLiquido)}<br><small>${formatPercentage(month.margemLiquida)}</small></td>
                `).join('')}
              </tr>
            </tbody>
          </table>
        </div>

        <div class="footer">
          Relatório gerado em ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')} | FoodDash SaaS
        </div>
      </body>
      </html>
    `;

    // Abrir nova janela para impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      
      // Aguardar carregamento e imprimir
      setTimeout(() => {
        printWindow.print();
        showSuccess('Relatório gerado!', 'O relatório foi aberto em uma nova aba para impressão ou salvamento em PDF.');
      }, 500);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando análise temporal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/dre"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <BarChart3 className="w-7 h-7 mr-3 text-orange-600" />
              Análise Temporal da DRE
            </h1>
            <p className="text-gray-600 mt-1">Evolução mensal e comparativos anuais</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <button
            onClick={exportToPDF}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Exportar PDF</span>
          </button>
        </div>
      </div>

      {/* Evolução Mensal - NOVA ESTRUTURA: Meses em colunas, categorias em linhas */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Evolução Mensal - {selectedYear}</h2>
        
        {monthlyData.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado encontrado</h3>
            <p className="text-gray-600">Não há dados de vendas ou despesas para {selectedYear}.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10">Categoria</th>
                  {monthlyData.map(month => (
                    <th key={month.month} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[100px]">
                      <div>{monthNames[parseInt(month.month.split('-')[1]) - 1]}</div>
                      {!month.hasData && <div className="text-red-500 text-[10px]">Sem dados</div>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* RECEITAS */}
                <tr className="bg-green-50">
                  <td className="px-4 py-3 font-bold text-green-800 sticky left-0 bg-green-50 z-10">RECEITAS</td>
                  {monthlyData.map(month => (
                    <td key={month.month} className={`px-3 py-3 text-center font-semibold text-green-800 ${!month.hasData ? 'opacity-50' : ''}`}>
                      {formatCurrency(month.receitaLiquida)}
                    </td>
                  ))}
                </tr>

                {/* CUSTOS E DESPESAS VARIÁVEIS */}
                <tr className="bg-red-50">
                  <td className="px-4 py-3 font-bold text-red-800 sticky left-0 bg-red-50 z-10">CUSTOS VARIÁVEIS</td>
                  {monthlyData.map(month => (
                    <td key={month.month} className={`px-3 py-3 text-center font-semibold text-red-800 ${!month.hasData ? 'opacity-50' : ''}`}>
                      ({formatCurrency(month.totalCustosVariaveis)})
                    </td>
                  ))}
                </tr>

                {/* Impostos */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10 flex items-center">
                    <button
                      onClick={() => toggleCategory('impostos')}
                      className="flex items-center space-x-2 hover:text-orange-600"
                    >
                      <Percent className="w-4 h-4 text-red-600" />
                      <span>Impostos</span>
                      {expandedCategories.impostos ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                  {monthlyData.map(month => (
                    <td key={month.month} className={`px-3 py-3 text-center ${!month.hasData ? 'opacity-50' : ''}`}>
                      <div>({formatCurrency(month.impostos)})</div>
                      <div className="text-xs text-gray-500">{formatPercentage(month.impostosPercentual)}</div>
                    </td>
                  ))}
                </tr>

                {/* CMV */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10 flex items-center">
                    <button
                      onClick={() => toggleCategory('cmv')}
                      className="flex items-center space-x-2 hover:text-orange-600"
                    >
                      <Target className="w-4 h-4 text-orange-600" />
                      <span>CMV</span>
                      {expandedCategories.cmv ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                  {monthlyData.map(month => (
                    <td key={month.month} className={`px-3 py-3 text-center ${!month.hasData ? 'opacity-50' : ''}`}>
                      <div>({formatCurrency(month.cmv)})</div>
                      <div className={`text-xs ${
                        month.cmvPercentual <= 30 ? 'text-green-600' : 
                        month.cmvPercentual <= 35 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(month.cmvPercentual)}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* Despesas com Vendas */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10 flex items-center">
                    <button
                      onClick={() => toggleCategory('despesasVendas')}
                      className="flex items-center space-x-2 hover:text-orange-600"
                    >
                      <DollarSign className="w-4 h-4 text-blue-600" />
                      <span>Despesas com Vendas</span>
                      {expandedCategories.despesasVendas ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                  {monthlyData.map(month => (
                    <td key={month.month} className={`px-3 py-3 text-center ${!month.hasData ? 'opacity-50' : ''}`}>
                      <div>({formatCurrency(month.despesasVendas)})</div>
                      <div className="text-xs text-gray-500">{formatPercentage(month.despesasVendasPercentual)}</div>
                    </td>
                  ))}
                </tr>

                {/* MARGEM DE CONTRIBUIÇÃO */}
                <tr className="bg-blue-50 border-t-2 border-blue-200">
                  <td className="px-4 py-3 font-bold text-blue-800 sticky left-0 bg-blue-50 z-10">MARGEM DE CONTRIBUIÇÃO</td>
                  {monthlyData.map(month => (
                    <td key={month.month} className={`px-3 py-3 text-center font-bold text-blue-800 ${!month.hasData ? 'opacity-50' : ''}`}>
                      <div>{formatCurrency(month.margemContribuicao)}</div>
                      <div className="text-xs">{formatPercentage(month.margemContribuicaoPercentual)}</div>
                    </td>
                  ))}
                </tr>

                {/* DESPESAS FIXAS */}
                <tr className="bg-purple-50">
                  <td className="px-4 py-3 font-bold text-purple-800 sticky left-0 bg-purple-50 z-10">DESPESAS FIXAS</td>
                  {monthlyData.map(month => (
                    <td key={month.month} className={`px-3 py-3 text-center font-semibold text-purple-800 ${!month.hasData ? 'opacity-50' : ''}`}>
                      ({formatCurrency(month.totalDespesasFixas)})
                    </td>
                  ))}
                </tr>

                {/* CMO */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10 flex items-center">
                    <button
                      onClick={() => toggleCategory('cmo')}
                      className="flex items-center space-x-2 hover:text-orange-600"
                    >
                      <Target className="w-4 h-4 text-purple-600" />
                      <span>CMO</span>
                      {expandedCategories.cmo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                  {monthlyData.map(month => (
                    <td key={month.month} className={`px-3 py-3 text-center ${!month.hasData ? 'opacity-50' : ''}`}>
                      <div>({formatCurrency(month.cmo)})</div>
                      <div className="text-xs text-gray-500">{formatPercentage(month.cmoPercentual)}</div>
                    </td>
                  ))}
                </tr>

                {/* Marketing */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10 flex items-center">
                    <button
                      onClick={() => toggleCategory('marketing')}
                      className="flex items-center space-x-2 hover:text-orange-600"
                    >
                      <BarChart3 className="w-4 h-4 text-pink-600" />
                      <span>Marketing</span>
                      {expandedCategories.marketing ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                  {monthlyData.map(month => (
                    <td key={month.month} className={`px-3 py-3 text-center ${!month.hasData ? 'opacity-50' : ''}`}>
                      <div>({formatCurrency(month.marketing)})</div>
                      <div className="text-xs text-gray-500">{formatPercentage(month.marketingPercentual)}</div>
                    </td>
                  ))}
                </tr>

                {/* Ocupação */}
                <tr className="hover:bg-gray-50">
                  <td className="px-4 py-3 pl-8 text-gray-700 sticky left-0 bg-white z-10 flex items-center">
                    <button
                      onClick={() => toggleCategory('ocupacao')}
                      className="flex items-center space-x-2 hover:text-orange-600"
                    >
                      <DollarSign className="w-4 h-4 text-indigo-600" />
                      <span>Ocupação</span>
                      {expandedCategories.ocupacao ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </td>
                  {monthlyData.map(month => (
                    <td key={month.month} className={`px-3 py-3 text-center ${!month.hasData ? 'opacity-50' : ''}`}>
                      <div>({formatCurrency(month.ocupacao)})</div>
                      <div className="text-xs text-gray-500">{formatPercentage(month.ocupacaoPercentual)}</div>
                    </td>
                  ))}
                </tr>

                {/* LUCRO LÍQUIDO */}
                <tr className="bg-orange-50 border-t-2 border-orange-200">
                  <td className="px-4 py-3 font-bold text-orange-800 text-lg sticky left-0 bg-orange-50 z-10">LUCRO LÍQUIDO</td>
                  {monthlyData.map(month => (
                    <td key={month.month} className={`px-3 py-3 text-center font-bold text-orange-800 ${!month.hasData ? 'opacity-50' : ''}`}>
                      <div className="text-base">{formatCurrency(month.lucroLiquido)}</div>
                      <div className={`text-xs ${
                        month.margemLiquida >= 10 ? 'text-green-600' : 
                        month.margemLiquida >= 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {formatPercentage(month.margemLiquida)}
                      </div>
                    </td>
                  ))}
                </tr>

                {/* RESUMO ANUAL - ÚLTIMA LINHA */}
                {yearlyData.length > 0 && (
                  <tr className="bg-gray-100 border-t-4 border-gray-400">
                    <td className="px-4 py-4 font-bold text-gray-900 text-lg sticky left-0 bg-gray-100 z-10">
                      TOTAL {selectedYear}
                      <div className="text-xs font-normal text-gray-600">
                        {yearlyData.find(y => y.year === selectedYear)?.mesesComDados || 0} meses com dados
                      </div>
                    </td>
                    {(() => {
                      const yearData = yearlyData.find(y => y.year === selectedYear);
                      if (!yearData) return monthlyData.map(month => <td key={month.month} className="px-3 py-4 text-center">-</td>);
                      
                      return (
                        <td colSpan={monthlyData.length} className="px-3 py-4 text-center">
                          <div className="grid grid-cols-4 gap-4 text-sm">
                            <div>
                              <div className="font-semibold text-green-600">Receita Total</div>
                              <div>{formatCurrency(yearData.receitaLiquida)}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-blue-600">Margem Contribuição</div>
                              <div>{formatCurrency(yearData.margemContribuicao)}</div>
                              <div className="text-xs text-gray-500">{formatPercentage(yearData.margemContribuicaoPercentual)}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-orange-600">Lucro Líquido</div>
                              <div className={yearData.lucroLiquido >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {formatCurrency(yearData.lucroLiquido)}
                              </div>
                              <div className="text-xs text-gray-500">{formatPercentage(yearData.margemLiquida)}</div>
                            </div>
                            <div>
                              <div className="font-semibold text-purple-600">Ticket Médio</div>
                              <div>{formatCurrency(yearData.ticketMedio)}</div>
                              <div className="text-xs text-gray-500">{yearData.totalPedidos.toLocaleString('pt-BR')} pedidos</div>
                            </div>
                          </div>
                        </td>
                      );
                    })()}
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Indicadores de Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Melhor Mês</h3>
            <Target className="w-5 h-5 text-green-600" />
          </div>
          {monthlyData.length > 0 && (() => {
            const bestMonth = monthlyData
              .filter(m => m.hasData)
              .reduce((best, current) => 
                current.lucroLiquido > best.lucroLiquido ? current : best
              , monthlyData[0]);
            
            if (!bestMonth.hasData) return <div className="text-gray-500">Sem dados disponíveis</div>;
            
            return (
              <div>
                <div className="text-2xl font-bold text-green-600">{bestMonth.monthName}</div>
                <div className="text-sm text-gray-600">Lucro: {formatCurrency(bestMonth.lucroLiquido)}</div>
                <div className="text-sm text-gray-600">Margem: {formatPercentage(bestMonth.margemLiquida)}</div>
              </div>
            );
          })()}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Maior Receita</h3>
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          {monthlyData.length > 0 && (() => {
            const bestRevenueMonth = monthlyData
              .filter(m => m.hasData)
              .reduce((best, current) => 
                current.receitaLiquida > best.receitaLiquida ? current : best
              , monthlyData[0]);
            
            if (!bestRevenueMonth.hasData) return <div className="text-gray-500">Sem dados disponíveis</div>;
            
            return (
              <div>
                <div className="text-2xl font-bold text-blue-600">{bestRevenueMonth.monthName}</div>
                <div className="text-sm text-gray-600">Receita: {formatCurrency(bestRevenueMonth.receitaLiquida)}</div>
                <div className="text-sm text-gray-600">Pedidos: {bestRevenueMonth.totalPedidos.toLocaleString('pt-BR')}</div>
              </div>
            );
          })()}
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Menor CMV</h3>
            <Percent className="w-5 h-5 text-purple-600" />
          </div>
          {monthlyData.length > 0 && (() => {
            const bestCMVMonths = monthlyData
              .filter(m => m.hasData && m.receitaLiquida > 0);
            
            if (bestCMVMonths.length === 0) return <div className="text-gray-500">Sem dados disponíveis</div>;
            
            const bestCMVMonth = bestCMVMonths.reduce((best, current) => 
              current.cmvPercentual < best.cmvPercentual ? current : best
            , bestCMVMonths[0]);
            
            return (
              <div>
                <div className="text-2xl font-bold text-purple-600">{bestCMVMonth.monthName}</div>
                <div className="text-sm text-gray-600">CMV: {formatPercentage(bestCMVMonth.cmvPercentual)}</div>
                <div className="text-sm text-gray-600">Valor: {formatCurrency(bestCMVMonth.cmv)}</div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
};