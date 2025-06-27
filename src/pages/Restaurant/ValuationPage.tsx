import React, { useState, useEffect } from 'react';
import { Calculator, DollarSign, TrendingUp, TrendingDown, BarChart3, Info, Download, ArrowRight, ArrowLeft, ArrowUp, Percent, Building2, Calendar, ChevronDown, ChevronUp, Users, Target, ShoppingCart, CreditCard, AlertTriangle, Check, Minus } from 'lucide-react';
import { useRestaurant } from '../../hooks/useRestaurant';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { DateFilterSelector } from '../../components/Common/DateFilterSelector';
import { useDateFilter } from '../../hooks/useDateFilter';

interface ValuationFormData {
  faturamentoMensal: number;
  margemLiquida: number;
  crescimentoAnual: number;
  taxaDesconto: number;
  modeloNegocio: 'delivery' | 'salao' | 'hibrido' | 'franquia';
  multiploMercado: number;
  despesasExtraordinarias: number;
  tempoOperacao: number;
  dependeDoDono: 'sim' | 'parcialmente' | 'nao';
  possuiProcessos: 'sim' | 'parcialmente' | 'nao';
  tipoPonto: 'alugado' | 'proprio' | 'contrato_curto';
}

interface ValuationResult {
  dcfValuation: number;
  multipleValuation: number;
  averageValuation: number;
  yearlyProjections: {
    year: number;
    revenue: number;
    profit: number;
    presentValue: number;
  }[];
  terminalValue: number;
  terminalValuePV: number;
  totalPresentValue: number;
  enterpriseValue: number;
  multipleRange: {
    min: number;
    max: number;
  };
  adjustmentFactors: {
    name: string;
    impact: number;
    description: string;
    type: 'positive' | 'negative' | 'neutral';
  }[];
  qualityScore: number;
  recommendations: {
    text: string;
    potentialImpact: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

// Múltiplos de mercado por tipo de restaurante
const marketMultiples = {
  delivery: { min: 3, max: 5, default: 4 },
  salao: { min: 4, max: 7, default: 5.5 },
  hibrido: { min: 4.5, max: 8, default: 6 },
  franquia: { min: 6, max: 10, default: 8 }
};

export const ValuationPage: React.FC = () => {
  const { restaurant } = useRestaurant();
  const { showSuccess, showError } = useToast();
  const { getDateRange } = useDateFilter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [financialData, setFinancialData] = useState<{
    faturamentoMensal: number;
    margemLiquida: number;
    canalPrincipal: string;
    percentualCanalPrincipal: number;
    tempoOperacao: number;
  } | null>(null);
  
  const [formData, setFormData] = useState<ValuationFormData>({
    faturamentoMensal: 0,
    margemLiquida: 15,
    crescimentoAnual: 10,
    taxaDesconto: 18,
    modeloNegocio: 'hibrido',
    multiploMercado: 6,
    despesasExtraordinarias: 0,
    tempoOperacao: 2,
    dependeDoDono: 'parcialmente',
    possuiProcessos: 'parcialmente',
    tipoPonto: 'alugado'
  });
  
  const [result, setResult] = useState<ValuationResult | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [showMethodology, setShowMethodology] = useState(false);
  const [showBusinessFactors, setShowBusinessFactors] = useState(false);
  
  // Carregar dados financeiros do restaurante
  useEffect(() => {
    if (restaurant) {
      fetchFinancialData();
    }
  }, [restaurant]);
  
  // Atualizar formulário quando os dados financeiros forem carregados
  useEffect(() => {
    if (financialData) {
      setFormData(prev => ({
        ...prev,
        faturamentoMensal: financialData.faturamentoMensal,
        margemLiquida: financialData.margemLiquida,
        tempoOperacao: financialData.tempoOperacao || prev.tempoOperacao,
        // Sugerir modelo de negócio baseado nos canais de venda
        modeloNegocio: financialData.percentualCanalPrincipal > 70 && 
                      (financialData.canalPrincipal.toLowerCase().includes('ifood') || 
                       financialData.canalPrincipal.toLowerCase().includes('delivery'))
                      ? 'delivery' 
                      : financialData.percentualCanalPrincipal > 70 && 
                        financialData.canalPrincipal.toLowerCase().includes('salão')
                        ? 'salao'
                        : 'hibrido'
      }));
    }
  }, [financialData]);

  const fetchFinancialData = async () => {
    if (!restaurant) return;
    
    setIsLoading(true);
    try {
      const { start, end } = getDateRange();
      
      // Buscar vendas
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('valor_bruto, canal, data')
        .eq('restaurant_id', restaurant.id)
        .gte('data', start)
        .lte('data', end);

      if (salesError) throw salesError;
      
      // Buscar despesas
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('valor, categoria')
        .eq('restaurant_id', restaurant.id)
        .gte('data', start)
        .lte('data', end);

      if (expensesError) throw expensesError;
      
      // Calcular faturamento mensal e margem líquida
      const totalRevenue = salesData?.reduce((sum, sale) => sum + sale.valor_bruto, 0) || 0;
      const totalExpenses = expensesData?.reduce((sum, expense) => sum + expense.valor, 0) || 0;
      const profit = totalRevenue - totalExpenses;
      const margin = totalRevenue > 0 ? (profit / totalRevenue) * 100 : 0;
      
      // Calcular média mensal (considerando o período selecionado)
      const startDate = new Date(start);
      const endDate = new Date(end);
      const monthsDiff = (endDate.getFullYear() - startDate.getFullYear()) * 12 + 
                         (endDate.getMonth() - startDate.getMonth()) + 1;
      
      const monthlyRevenue = monthsDiff > 0 ? totalRevenue / monthsDiff : totalRevenue;
      
      // Calcular canal principal e seu percentual
      const canalCounts: Record<string, number> = {};
      salesData?.forEach(sale => {
        canalCounts[sale.canal] = (canalCounts[sale.canal] || 0) + sale.valor_bruto;
      });
      
      let canalPrincipal = '';
      let valorCanalPrincipal = 0;
      
      Object.entries(canalCounts).forEach(([canal, valor]) => {
        if (valor > valorCanalPrincipal) {
          canalPrincipal = canal;
          valorCanalPrincipal = valor;
        }
      });
      
      const percentualCanalPrincipal = totalRevenue > 0 ? (valorCanalPrincipal / totalRevenue) * 100 : 0;
      
      // Calcular tempo de operação baseado na data mais antiga
      let tempoOperacao = 2; // valor padrão
      
      if (salesData && salesData.length > 0) {
        const datas = salesData.map(sale => new Date(sale.data));
        const dataMinima = new Date(Math.min(...datas.map(d => d.getTime())));
        const hoje = new Date();
        const diffAnos = (hoje.getTime() - dataMinima.getTime()) / (1000 * 60 * 60 * 24 * 365);
        tempoOperacao = Math.max(diffAnos, 0.5); // mínimo de 6 meses
      }
      
      setFinancialData({
        faturamentoMensal: Math.round(monthlyRevenue),
        margemLiquida: Math.round(margin * 10) / 10,
        canalPrincipal,
        percentualCanalPrincipal,
        tempoOperacao
      });
      
    } catch (error) {
      console.error('Error fetching financial data:', error);
      showError('Erro ao carregar dados', 'Não foi possível carregar os dados financeiros.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateValuation = () => {
    try {
      // Validar dados de entrada
      if (formData.faturamentoMensal <= 0) {
        showError('Dados inválidos', 'O faturamento mensal deve ser maior que zero.');
        return;
      }
      
      // Preparar dados para cálculo
      const annualRevenue = formData.faturamentoMensal * 12;
      const annualProfit = annualRevenue * (formData.margemLiquida / 100);
      const growthRate = formData.crescimentoAnual / 100;
      const discountRate = formData.taxaDesconto / 100;
      
      // Projeções para 5 anos
      const projections = [];
      let totalPV = 0;
      
      for (let year = 1; year <= 5; year++) {
        const yearlyRevenue = annualRevenue * Math.pow(1 + growthRate, year);
        const yearlyProfit = yearlyRevenue * (formData.margemLiquida / 100);
        const discountFactor = Math.pow(1 + discountRate, year);
        const presentValue = yearlyProfit / discountFactor;
        
        totalPV += presentValue;
        
        projections.push({
          year: new Date().getFullYear() + year,
          revenue: yearlyRevenue,
          profit: yearlyProfit,
          presentValue
        });
      }
      
      // Valor terminal (perpetuidade)
      const terminalGrowthRate = 0.03; // 3% crescimento perpétuo
      const lastYearProfit = annualProfit * Math.pow(1 + growthRate, 5);
      const terminalValue = lastYearProfit * (1 + terminalGrowthRate) / (discountRate - terminalGrowthRate);
      const terminalValuePV = terminalValue / Math.pow(1 + discountRate, 5);
      
      // Calcular fatores de ajuste
      const adjustmentFactors = [];
      let totalAdjustment = 0;
      
      // Fator 1: Dependência do dono
      let donoImpact = 0;
      if (formData.dependeDoDono === 'sim') {
        donoImpact = -0.15; // -15%
        adjustmentFactors.push({
          name: 'Dependência do dono',
          impact: donoImpact,
          description: 'O negócio depende fortemente do dono para operar, reduzindo seu valor de mercado.',
          type: 'negative'
        });
      } else if (formData.dependeDoDono === 'parcialmente') {
        donoImpact = -0.05; // -5%
        adjustmentFactors.push({
          name: 'Dependência parcial do dono',
          impact: donoImpact,
          description: 'O negócio depende parcialmente do dono, o que afeta moderadamente seu valor.',
          type: 'negative'
        });
      } else {
        donoImpact = 0.05; // +5%
        adjustmentFactors.push({
          name: 'Independência operacional',
          impact: donoImpact,
          description: 'O negócio opera independentemente do dono, aumentando seu valor de mercado.',
          type: 'positive'
        });
      }
      totalAdjustment += donoImpact;
      
      // Fator 2: Processos documentados
      let processosImpact = 0;
      if (formData.possuiProcessos === 'sim') {
        processosImpact = 0.1; // +10%
        adjustmentFactors.push({
          name: 'Processos bem documentados',
          impact: processosImpact,
          description: 'O negócio possui processos bem documentados, facilitando a transição e reduzindo riscos.',
          type: 'positive'
        });
      } else if (formData.possuiProcessos === 'parcialmente') {
        processosImpact = 0; // neutro
        adjustmentFactors.push({
          name: 'Processos parcialmente documentados',
          impact: processosImpact,
          description: 'O negócio possui alguma documentação de processos, mas ainda há espaço para melhorias.',
          type: 'neutral'
        });
      } else {
        processosImpact = -0.1; // -10%
        adjustmentFactors.push({
          name: 'Falta de processos documentados',
          impact: processosImpact,
          description: 'O negócio não possui processos documentados, aumentando riscos e reduzindo valor.',
          type: 'negative'
        });
      }
      totalAdjustment += processosImpact;
      
      // Fator 3: Tipo de ponto
      let pontoImpact = 0;
      if (formData.tipoPonto === 'proprio') {
        pontoImpact = 0.15; // +15%
        adjustmentFactors.push({
          name: 'Ponto próprio',
          impact: pontoImpact,
          description: 'O ponto é próprio, agregando valor significativo ao negócio.',
          type: 'positive'
        });
      } else if (formData.tipoPonto === 'alugado') {
        pontoImpact = 0; // neutro
        adjustmentFactors.push({
          name: 'Ponto alugado',
          impact: pontoImpact,
          description: 'O ponto é alugado, o que é neutro para a avaliação.',
          type: 'neutral'
        });
      } else {
        pontoImpact = -0.1; // -10%
        adjustmentFactors.push({
          name: 'Contrato de curto prazo',
          impact: pontoImpact,
          description: 'O contrato de aluguel é de curto prazo, representando um risco para o negócio.',
          type: 'negative'
        });
      }
      totalAdjustment += pontoImpact;
      
      // Fator 4: Tempo de operação
      let tempoImpact = 0;
      if (formData.tempoOperacao < 2) {
        tempoImpact = -0.15; // -15%
        adjustmentFactors.push({
          name: 'Negócio recente',
          impact: tempoImpact,
          description: 'O negócio tem menos de 2 anos, representando maior risco e incerteza.',
          type: 'negative'
        });
      } else if (formData.tempoOperacao >= 5) {
        tempoImpact = 0.1; // +10%
        adjustmentFactors.push({
          name: 'Negócio estabelecido',
          impact: tempoImpact,
          description: 'O negócio está estabelecido há mais de 5 anos, demonstrando estabilidade.',
          type: 'positive'
        });
      } else {
        tempoImpact = 0; // neutro
        adjustmentFactors.push({
          name: 'Tempo de operação intermediário',
          impact: tempoImpact,
          description: 'O negócio está em operação entre 2 e 5 anos, o que é neutro para a avaliação.',
          type: 'neutral'
        });
      }
      totalAdjustment += tempoImpact;
      
      // Fator 5: Margem líquida comparada ao setor
      let margemImpact = 0;
      if (formData.margemLiquida > 15) {
        margemImpact = 0.15; // +15%
        adjustmentFactors.push({
          name: 'Margem acima do mercado',
          impact: margemImpact,
          description: 'A margem líquida está acima da média do setor (10-15%), indicando eficiência operacional.',
          type: 'positive'
        });
      } else if (formData.margemLiquida < 10) {
        margemImpact = -0.1; // -10%
        adjustmentFactors.push({
          name: 'Margem abaixo do mercado',
          impact: margemImpact,
          description: 'A margem líquida está abaixo da média do setor (10-15%), indicando possíveis ineficiências.',
          type: 'negative'
        });
      } else {
        margemImpact = 0; // neutro
        adjustmentFactors.push({
          name: 'Margem dentro da média',
          impact: margemImpact,
          description: 'A margem líquida está dentro da média do setor (10-15%).',
          type: 'neutral'
        });
      }
      totalAdjustment += margemImpact;
      
      // Fator 6: Dependência de canal (se disponível)
      if (financialData && financialData.percentualCanalPrincipal > 70) {
        const canalImpact = -0.1; // -10%
        adjustmentFactors.push({
          name: 'Alta dependência de canal',
          impact: canalImpact,
          description: `${financialData.percentualCanalPrincipal.toFixed(0)}% das vendas vêm de ${financialData.canalPrincipal}, representando um risco de dependência.`,
          type: 'negative'
        });
        totalAdjustment += canalImpact;
      }
      
      // Calcular score de qualidade (0-100)
      const baseScore = 50; // pontuação base
      const qualityScore = Math.min(100, Math.max(0, baseScore + (totalAdjustment * 100)));
      
      // Aplicar ajustes ao valor da empresa
      const adjustmentMultiplier = 1 + totalAdjustment;
      
      // Valor total da empresa ajustado
      const enterpriseValue = (totalPV + terminalValuePV - formData.despesasExtraordinarias) * adjustmentMultiplier;
      
      // Valuation por múltiplo
      const multipleValuation = annualProfit * formData.multiploMercado * adjustmentMultiplier;
      
      // Média dos dois métodos
      const averageValuation = (enterpriseValue + multipleValuation) / 2;
      
      // Definir múltiplo de mercado baseado no modelo de negócio
      const multipleRange = marketMultiples[formData.modeloNegocio];
      
      // Gerar recomendações
      const recommendations = [];
      
      if (formData.margemLiquida < 10) {
        recommendations.push({
          text: 'Aumente sua margem líquida revisando custos e preços',
          potentialImpact: 'Cada 1% de aumento na margem pode elevar o valor em aproximadamente ' + 
                          formatCurrency(averageValuation * 0.05),
          priority: 'high' as const
        });
      }
      
      if (formData.dependeDoDono === 'sim') {
        recommendations.push({
          text: 'Desenvolva uma equipe que possa operar o negócio sem sua presença constante',
          potentialImpact: 'Pode aumentar o valor em até ' + formatCurrency(averageValuation * 0.15),
          priority: 'high' as const
        });
      }
      
      if (formData.possuiProcessos === 'nao') {
        recommendations.push({
          text: 'Documente processos operacionais e crie manuais de procedimentos',
          potentialImpact: 'Pode aumentar o valor em até ' + formatCurrency(averageValuation * 0.1),
          priority: 'medium' as const
        });
      }
      
      if (financialData && financialData.percentualCanalPrincipal > 70) {
        recommendations.push({
          text: `Diversifique seus canais de venda para reduzir a dependência de ${financialData.canalPrincipal}`,
          potentialImpact: 'Pode aumentar o valor em até ' + formatCurrency(averageValuation * 0.1),
          priority: 'medium' as const
        });
      }
      
      if (formData.tipoPonto === 'contrato_curto') {
        recommendations.push({
          text: 'Negocie um contrato de aluguel mais longo para reduzir riscos',
          potentialImpact: 'Pode aumentar o valor em até ' + formatCurrency(averageValuation * 0.1),
          priority: 'medium' as const
        });
      }
      
      // Resultado final
      setResult({
        dcfValuation: enterpriseValue,
        multipleValuation,
        averageValuation,
        yearlyProjections: projections,
        terminalValue,
        terminalValuePV,
        totalPresentValue: totalPV,
        enterpriseValue,
        multipleRange: {
          min: multipleRange.min,
          max: multipleRange.max
        },
        adjustmentFactors,
        qualityScore,
        recommendations
      });
      
      showSuccess('Valuation calculado!', 'O valor estimado do seu negócio foi calculado com sucesso.');
      
    } catch (error) {
      console.error('Error calculating valuation:', error);
      showError('Erro no cálculo', 'Não foi possível calcular o valuation. Verifique os dados informados.');
    }
  };

  const handleInputChange = (field: keyof ValuationFormData, value: string | number) => {
    // Converter string para número quando necessário
    const numValue = typeof value === 'string' && 
                    ['faturamentoMensal', 'margemLiquida', 'crescimentoAnual', 
                     'taxaDesconto', 'multiploMercado', 'despesasExtraordinarias', 
                     'tempoOperacao'].includes(field) 
                    ? parseFloat(value) || 0 
                    : value;
    
    setFormData(prev => ({
      ...prev,
      [field]: numValue
    }));
  };

  const handleModelChange = (model: ValuationFormData['modeloNegocio']) => {
    const multipleRange = marketMultiples[model];
    
    setFormData(prev => ({
      ...prev,
      modeloNegocio: model,
      multiploMercado: multipleRange.default
    }));
  };

  const formatCurrency = (value: number) => {
    return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const exportValuationReport = () => {
    if (!result) return;
    
    const reportContent = `
RELATÓRIO DE VALUATION - ${restaurant?.nome || 'Restaurante'}
Data: ${new Date().toLocaleDateString('pt-BR')}

DADOS DO NEGÓCIO
Faturamento Mensal: ${formatCurrency(formData.faturamentoMensal)}
Faturamento Anual: ${formatCurrency(formData.faturamentoMensal * 12)}
Margem Líquida: ${formData.margemLiquida.toFixed(1)}%
Lucro Anual: ${formatCurrency((formData.faturamentoMensal * 12) * (formData.margemLiquida / 100))}
Modelo de Negócio: ${
  formData.modeloNegocio === 'delivery' ? 'Delivery' :
  formData.modeloNegocio === 'salao' ? 'Salão' :
  formData.modeloNegocio === 'hibrido' ? 'Híbrido' : 'Franquia'
}
Tempo de Operação: ${formData.tempoOperacao.toFixed(1)} anos
Dependência do Dono: ${formData.dependeDoDono === 'sim' ? 'Alta' : formData.dependeDoDono === 'parcialmente' ? 'Parcial' : 'Baixa'}
Processos Documentados: ${formData.possuiProcessos === 'sim' ? 'Sim' : formData.possuiProcessos === 'parcialmente' ? 'Parcialmente' : 'Não'}
Tipo de Ponto: ${formData.tipoPonto === 'proprio' ? 'Próprio' : formData.tipoPonto === 'alugado' ? 'Alugado' : 'Contrato Curto'}

PREMISSAS
Taxa de Crescimento Anual: ${formData.crescimentoAnual.toFixed(1)}%
Taxa de Desconto: ${formData.taxaDesconto.toFixed(1)}%
Múltiplo de Mercado: ${formData.multiploMercado.toFixed(1)}x
Despesas Extraordinárias: ${formatCurrency(formData.despesasExtraordinarias)}

RESULTADO DA AVALIAÇÃO
Valor por Fluxo de Caixa Descontado (DCF): ${formatCurrency(result.dcfValuation)}
Valor por Múltiplo de Lucro: ${formatCurrency(result.multipleValuation)}
Valor Médio Estimado: ${formatCurrency(result.averageValuation)}
Score de Qualidade: ${result.qualityScore.toFixed(0)}/100

FATORES DE AJUSTE
${result.adjustmentFactors.map(factor => 
  `${factor.name}: ${factor.impact >= 0 ? '+' : ''}${(factor.impact * 100).toFixed(0)}% - ${factor.description}`
).join('\n')}

PROJEÇÕES ANUAIS
${result.yearlyProjections.map(year => 
  `${year.year}: Receita ${formatCurrency(year.revenue)} | Lucro ${formatCurrency(year.profit)}`
).join('\n')}

Valor Terminal: ${formatCurrency(result.terminalValue)}
Valor Presente do Valor Terminal: ${formatCurrency(result.terminalValuePV)}

FAIXA DE MÚLTIPLOS DE MERCADO
Mínimo: ${result.multipleRange.min}x
Máximo: ${result.multipleRange.max}x

RECOMENDAÇÕES PARA AUMENTAR O VALOR
${result.recommendations.map(rec => 
  `- ${rec.text} (Impacto potencial: ${rec.potentialImpact})`
).join('\n')}

OBSERVAÇÕES
Este relatório é uma estimativa baseada nos dados fornecidos e premissas de mercado.
Recomenda-se consultar um especialista para uma avaliação mais precisa.
    `;
    
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Valuation_${restaurant?.nome || 'Restaurante'}_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccess('Relatório exportado!', 'O relatório de valuation foi baixado com sucesso.');
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Calculator className="w-7 h-7 mr-3 text-orange-600" />
            Calculadora de Valuation
          </h1>
          <p className="text-gray-600 mt-1">
            Descubra o valor estimado do seu restaurante
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <DateFilterSelector />
          {result && (
            <button
              onClick={exportValuationReport}
              className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Exportar Relatório</span>
            </button>
          )}
        </div>
      </div>

      {/* Form and Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Input Form */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Dados para Valuation</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Faturamento Mensal (R$)
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  value={formData.faturamentoMensal}
                  onChange={(e) => handleInputChange('faturamentoMensal', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: 50000"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Faturamento anual: {formatCurrency(formData.faturamentoMensal * 12)}
              </p>
              
              {financialData && financialData.faturamentoMensal !== formData.faturamentoMensal && (
                <p className="text-xs text-orange-600 mt-1">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Valor diferente do apurado no sistema: {formatCurrency(financialData.faturamentoMensal)}/mês
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Margem Líquida (%)
              </label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  value={formData.margemLiquida}
                  onChange={(e) => handleInputChange('margemLiquida', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: 15"
                  step="0.1"
                  min="0"
                  max="100"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Lucro anual estimado: {formatCurrency((formData.faturamentoMensal * 12) * (formData.margemLiquida / 100))}
              </p>
              
              {financialData && Math.abs(financialData.margemLiquida - formData.margemLiquida) > 2 && (
                <p className="text-xs text-orange-600 mt-1">
                  <AlertTriangle className="w-3 h-3 inline mr-1" />
                  Valor diferente do apurado no sistema: {financialData.margemLiquida.toFixed(1)}%
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Modelo de Negócio
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleModelChange('delivery')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.modeloNegocio === 'delivery'
                      ? 'bg-orange-100 text-orange-800 border-2 border-orange-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Delivery
                </button>
                <button
                  type="button"
                  onClick={() => handleModelChange('salao')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.modeloNegocio === 'salao'
                      ? 'bg-orange-100 text-orange-800 border-2 border-orange-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Salão
                </button>
                <button
                  type="button"
                  onClick={() => handleModelChange('hibrido')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.modeloNegocio === 'hibrido'
                      ? 'bg-orange-100 text-orange-800 border-2 border-orange-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Híbrido
                </button>
                <button
                  type="button"
                  onClick={() => handleModelChange('franquia')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    formData.modeloNegocio === 'franquia'
                      ? 'bg-orange-100 text-orange-800 border-2 border-orange-300'
                      : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  Franquia
                </button>
              </div>
              
              {financialData && financialData.percentualCanalPrincipal > 70 && (
                <p className="text-xs text-blue-600 mt-1">
                  <Info className="w-3 h-3 inline mr-1" />
                  {financialData.percentualCanalPrincipal.toFixed(0)}% das vendas vêm de {financialData.canalPrincipal}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Crescimento Anual Esperado (%)
              </label>
              <div className="relative">
                <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  value={formData.crescimentoAnual}
                  onChange={(e) => handleInputChange('crescimentoAnual', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: 10"
                  step="0.5"
                  min="0"
                  max="100"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tempo de Operação (anos)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="number"
                  value={formData.tempoOperacao}
                  onChange={(e) => handleInputChange('tempoOperacao', e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: 2"
                  step="0.5"
                  min="0"
                />
              </div>
            </div>
            
            <div>
              <button
                type="button"
                onClick={() => setShowBusinessFactors(!showBusinessFactors)}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium flex items-center"
              >
                {showBusinessFactors ? 'Ocultar fatores do negócio' : 'Mostrar fatores do negócio'}
                {showBusinessFactors ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />}
              </button>
            </div>
            
            {showBusinessFactors && (
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    O negócio depende do dono para operar?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('dependeDoDono', 'sim')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.dependeDoDono === 'sim'
                          ? 'bg-red-100 text-red-800 border-2 border-red-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('dependeDoDono', 'parcialmente')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.dependeDoDono === 'parcialmente'
                          ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Parcialmente
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('dependeDoDono', 'nao')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.dependeDoDono === 'nao'
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Possui processos documentados e equipe independente?
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('possuiProcessos', 'sim')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.possuiProcessos === 'sim'
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Sim
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('possuiProcessos', 'parcialmente')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.possuiProcessos === 'parcialmente'
                          ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Parcialmente
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('possuiProcessos', 'nao')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.possuiProcessos === 'nao'
                          ? 'bg-red-100 text-red-800 border-2 border-red-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Não
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de ponto comercial
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleInputChange('tipoPonto', 'proprio')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.tipoPonto === 'proprio'
                          ? 'bg-green-100 text-green-800 border-2 border-green-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Próprio
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('tipoPonto', 'alugado')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.tipoPonto === 'alugado'
                          ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Alugado
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('tipoPonto', 'contrato_curto')}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                        formData.tipoPonto === 'contrato_curto'
                          ? 'bg-red-100 text-red-800 border-2 border-red-300'
                          : 'bg-gray-100 text-gray-800 border border-gray-200 hover:bg-gray-200'
                      }`}
                    >
                      Contrato Curto
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-orange-600 hover:text-orange-800 text-sm font-medium flex items-center"
              >
                {showAdvancedOptions ? 'Ocultar opções avançadas' : 'Mostrar opções avançadas'}
                {showAdvancedOptions ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />}
              </button>
            </div>
            
            {showAdvancedOptions && (
              <div className="space-y-4 pt-2 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Taxa de Desconto (%)
                  </label>
                  <input
                    type="number"
                    value={formData.taxaDesconto}
                    onChange={(e) => handleInputChange('taxaDesconto', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: 18"
                    step="0.5"
                    min="0"
                    max="100"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Recomendado: 15-25% para pequenos restaurantes
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Múltiplo de Mercado
                  </label>
                  <input
                    type="number"
                    value={formData.multiploMercado}
                    onChange={(e) => handleInputChange('multiploMercado', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: 6"
                    step="0.1"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Faixa típica para {
                      formData.modeloNegocio === 'delivery' ? 'delivery' :
                      formData.modeloNegocio === 'salao' ? 'restaurantes com salão' :
                      formData.modeloNegocio === 'hibrido' ? 'modelos híbridos' : 'franquias'
                    }: {marketMultiples[formData.modeloNegocio].min}x-{marketMultiples[formData.modeloNegocio].max}x o lucro anual
                  </p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Despesas Extraordinárias (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.despesasExtraordinarias}
                    onChange={(e) => handleInputChange('despesasExtraordinarias', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Ex: 50000"
                    min="0"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Dívidas ou investimentos necessários que reduzem o valor
                  </p>
                </div>
              </div>
            )}
            
            <div className="pt-4">
              <button
                onClick={calculateValuation}
                className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-colors flex items-center justify-center space-x-2"
              >
                <Calculator className="w-5 h-5" />
                <span>Calcular Valor do Negócio</span>
              </button>
            </div>
          </div>
        </div>
        
        {/* Results */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resultado da Avaliação</h2>
          
          {!result ? (
            <div className="text-center py-12">
              <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">Valor do seu Restaurante</h3>
              <p className="text-gray-500 mb-6">
                Preencha os dados ao lado e clique em "Calcular Valor do Negócio" para ver o resultado.
              </p>
              <div className="text-sm text-gray-500 max-w-md mx-auto">
                <p>
                  Esta calculadora utiliza métodos profissionais de valuation para estimar o valor do seu restaurante com base nos dados financeiros e premissas de mercado.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Valor Final */}
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-6 rounded-xl border border-orange-200">
                <h3 className="text-lg font-semibold text-orange-800 mb-2">Valor Estimado do Negócio</h3>
                <div className="text-3xl font-bold text-orange-700 mb-2">
                  {formatCurrency(result.averageValuation)}
                </div>
                <div className="flex items-center">
                  <div className="flex-1">
                    <p className="text-sm text-orange-600">
                      Baseado na média entre os métodos de Fluxo de Caixa Descontado e Múltiplo de Lucro
                    </p>
                  </div>
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center border-4 border-orange-200">
                    <div className="text-lg font-bold text-orange-700">{result.qualityScore.toFixed(0)}</div>
                  </div>
                </div>
              </div>
              
              {/* Métodos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <h4 className="font-medium text-blue-800 mb-1">Fluxo de Caixa Descontado</h4>
                  <div className="text-xl font-bold text-blue-700 mb-1">
                    {formatCurrency(result.dcfValuation)}
                  </div>
                  <p className="text-xs text-blue-600">
                    Baseado em projeções de 5 anos + valor terminal
                  </p>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <h4 className="font-medium text-green-800 mb-1">Múltiplo de Lucro</h4>
                  <div className="text-xl font-bold text-green-700 mb-1">
                    {formatCurrency(result.multipleValuation)}
                  </div>
                  <p className="text-xs text-green-600">
                    {formData.multiploMercado}x o lucro anual de {formatCurrency((formData.faturamentoMensal * 12) * (formData.margemLiquida / 100))}
                  </p>
                </div>
              </div>
              
              {/* Fatores de Ajuste */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Fatores que Impactam o Valor</h4>
                <div className="space-y-2">
                  {result.adjustmentFactors.map((factor, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border ${
                        factor.type === 'positive' ? 'bg-green-50 border-green-200' :
                        factor.type === 'negative' ? 'bg-red-50 border-red-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {factor.type === 'positive' ? (
                            <TrendingUp className="w-4 h-4 text-green-600 mr-2" />
                          ) : factor.type === 'negative' ? (
                            <TrendingDown className="w-4 h-4 text-red-600 mr-2" />
                          ) : (
                            <Minus className="w-4 h-4 text-gray-600 mr-2" />
                          )}
                          <span className="font-medium text-sm">
                            {factor.name}
                          </span>
                        </div>
                        <span className={`text-sm font-bold ${
                          factor.type === 'positive' ? 'text-green-600' :
                          factor.type === 'negative' ? 'text-red-600' :
                          'text-gray-600'
                        }`}>
                          {factor.impact >= 0 ? '+' : ''}{(factor.impact * 100).toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs mt-1 ml-6 text-gray-600">{factor.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Recomendações */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Recomendações para Aumentar o Valor</h4>
                <div className="space-y-3">
                  {result.recommendations.map((rec, index) => (
                    <div 
                      key={index} 
                      className={`p-3 rounded-lg border ${
                        rec.priority === 'high' ? 'bg-red-50 border-red-200' :
                        rec.priority === 'medium' ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <div className="flex items-start">
                        <div className={`mt-0.5 mr-2 p-1 rounded-full ${
                          rec.priority === 'high' ? 'bg-red-100' :
                          rec.priority === 'medium' ? 'bg-yellow-100' :
                          'bg-blue-100'
                        }`}>
                          {rec.priority === 'high' ? (
                            <ArrowUp className="w-3 h-3 text-red-600" />
                          ) : rec.priority === 'medium' ? (
                            <ArrowRight className="w-3 h-3 text-yellow-600" />
                          ) : (
                            <Info className="w-3 h-3 text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{rec.text}</p>
                          <p className="text-xs text-gray-600 mt-1">{rec.potentialImpact}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Projeções */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Projeções Anuais</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ano</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Receita</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Lucro</th>
                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Presente</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {result.yearlyProjections.map((year) => (
                        <tr key={year.year}>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{year.year}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(year.revenue)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(year.profit)}</td>
                          <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(year.presentValue)}</td>
                        </tr>
                      ))}
                      <tr className="bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">Valor Terminal</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-500">-</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(result.terminalValue)}</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-gray-900">{formatCurrency(result.terminalValuePV)}</td>
                      </tr>
                      <tr className="bg-orange-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-orange-800">Total</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-orange-500">-</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right text-orange-500">-</td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-right font-medium text-orange-800">{formatCurrency(result.totalPresentValue + result.terminalValuePV)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Info Card - Moved to bottom */}
      <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-100 p-3 rounded-lg">
            <Info className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">O que é Valuation?</h3>
            <p className="text-blue-800">
              Valuation é o processo de estimar o valor de um negócio. Esta calculadora utiliza dois métodos principais:
            </p>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-1">Fluxo de Caixa Descontado (DCF)</h4>
                <p className="text-sm text-blue-700">
                  Projeta os lucros futuros e os converte para valor presente, considerando o valor do dinheiro no tempo.
                </p>
              </div>
              <div className="bg-white p-3 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-1">Múltiplo de Lucro</h4>
                <p className="text-sm text-blue-700">
                  Multiplica o lucro anual por um fator baseado em transações similares no mercado de restaurantes.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowMethodology(!showMethodology)}
              className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
            >
              {showMethodology ? 'Ocultar metodologia detalhada' : 'Ver metodologia detalhada'}
              {showMethodology ? <ChevronUp className="ml-1 w-4 h-4" /> : <ChevronDown className="ml-1 w-4 h-4" />}
            </button>
            
            {showMethodology && (
              <div className="mt-3 bg-white p-4 rounded-lg border border-blue-200">
                <h4 className="font-medium text-blue-800 mb-2">Metodologia Detalhada</h4>
                <div className="space-y-3 text-sm text-blue-700">
                  <p>
                    <strong>1. Fluxo de Caixa Descontado (DCF):</strong> Projeta os lucros para os próximos 5 anos, 
                    considerando a taxa de crescimento anual informada. Cada fluxo futuro é descontado pela taxa de 
                    desconto para trazer a valor presente. Adicionalmente, calcula-se um valor terminal (perpetuidade) 
                    que representa o valor do negócio após o período de projeção explícita.
                  </p>
                  <p>
                    <strong>2. Múltiplo de Lucro:</strong> Utiliza múltiplos de mercado específicos para o setor de 
                    restaurantes, que variam conforme o modelo de negócio. Delivery geralmente tem múltiplos entre 
                    3x e 5x o lucro anual, enquanto restaurantes com salão variam de 4x a 7x, modelos híbridos de 
                    4.5x a 8x, e franquias podem chegar a 6x-10x.
                  </p>
                  <p>
                    <strong>3. Fatores de Ajuste:</strong> O valor é ajustado com base em fatores qualitativos como 
                    dependência do dono, processos documentados, tipo de ponto, tempo de operação, margem comparada 
                    ao setor e dependência de canais específicos.
                  </p>
                  <p>
                    <strong>4. Valor Final:</strong> Apresentamos tanto os valores individuais de cada método quanto 
                    uma média ponderada, que geralmente oferece uma estimativa mais equilibrada do valor do negócio.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Disclaimer */}
      <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
        <p className="text-xs text-gray-600 text-center">
          <strong>Aviso:</strong> Esta calculadora fornece apenas uma estimativa e não substitui a avaliação profissional. 
          Os resultados dependem da precisão dos dados fornecidos e das premissas utilizadas. 
          Recomendamos consultar um especialista em avaliação de empresas para decisões importantes.
        </p>
      </div>
    </div>
  );
};