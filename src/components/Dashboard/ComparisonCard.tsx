import React from 'react';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, Info } from 'lucide-react';

interface ComparisonCardProps {
  title: string;
  myValue: number;
  marketValue: number;
  format: 'currency' | 'percentage' | 'number';
  icon: React.ComponentType<any>;
  color: string;
  totalRestaurants: number;
  region: string;
}

export const ComparisonCard: React.FC<ComparisonCardProps> = ({
  title,
  myValue,
  marketValue,
  format,
  icon: Icon,
  color,
  totalRestaurants,
  region
}) => {
  const formatValue = (value: number) => {
    switch (format) {
      case 'currency':
        return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      case 'percentage':
        return `${value.toFixed(1)}%`;
      case 'number':
        return value.toLocaleString('pt-BR');
      default:
        return value.toString();
    }
  };

  const difference = ((myValue - marketValue) / marketValue) * 100;
  const isAbove = difference > 0;
  const isSignificant = Math.abs(difference) > 5;

  // Determinar se o resultado é positivo ou negativo com base no contexto
  const isPositiveContext = title.includes('Faturamento') || 
                           title.includes('Pedidos') || 
                           title.includes('Ticket') || 
                           title.includes('Margem') || 
                           title.includes('Lucro');
  
  // Determinar se o resultado é preocupante (vermelho), atenção (amarelo) ou bom (verde)
  const getAlertStatus = () => {
    if (!isSignificant) return 'neutral';
    
    if (isPositiveContext) {
      return isAbove ? 'positive' : 'negative';
    } else {
      // Para métricas como CMV, Impostos, etc. onde menor é melhor
      return isAbove ? 'negative' : 'positive';
    }
  };

  const alertStatus = getAlertStatus();

  const getPerformanceText = () => {
    if (!isSignificant) return 'Na média do mercado';
    
    if (isPositiveContext) {
      if (isAbove) {
        return `${Math.abs(difference).toFixed(0)}% ACIMA da média`;
      } else {
        return `${Math.abs(difference).toFixed(0)}% abaixo da média`;
      }
    } else {
      if (isAbove) {
        return `${Math.abs(difference).toFixed(0)}% acima da média`;
      } else {
        return `${Math.abs(difference).toFixed(0)}% ABAIXO da média`;
      }
    }
  };

  // Obter dicas personalizadas com base no título e no desempenho
  const getInsightTip = () => {
    if (!isSignificant) return null;
    
    if (title.includes('Faturamento')) {
      return isAbove 
        ? "Seu faturamento está acima da média! Continue com as estratégias atuais."
        : "Considere revisar sua estratégia de preços ou aumentar o volume de vendas.";
    }
    
    if (title.includes('Ticket Médio')) {
      return isAbove 
        ? "Seu ticket médio está acima da média! Considere estratégias de upsell para aumentar ainda mais."
        : "Experimente combos, promoções de upsell ou revisar seu cardápio para aumentar o ticket médio.";
    }
    
    if (title.includes('Pedidos')) {
      return isAbove 
        ? "Volume de pedidos acima da média! Certifique-se de manter a qualidade com o alto volume."
        : "Considere estratégias de marketing, promoções ou melhorar a visibilidade do seu restaurante.";
    }
    
    if (title.includes('CMV')) {
      return isAbove 
        ? "Seu CMV está alto. Revise fornecedores, controle de estoque e processos de produção para reduzir desperdícios."
        : "Excelente controle de CMV! Continue com as práticas atuais de gestão de estoque e fornecedores.";
    }
    
    if (title.includes('Impostos')) {
      return isAbove 
        ? "Seus impostos estão acima da média. Consulte um contador para revisar seu regime tributário."
        : "Boa gestão tributária! Continue com as práticas atuais.";
    }
    
    if (title.includes('Marketing')) {
      return isAbove 
        ? "Investimento em marketing acima da média. Analise o ROI de cada canal para otimizar gastos."
        : "Considere aumentar investimentos em marketing para impulsionar vendas e visibilidade.";
    }
    
    if (title.includes('Margem')) {
      return isAbove 
        ? "Excelente margem! Continue com as estratégias atuais de precificação e controle de custos."
        : "Revise sua estrutura de custos e estratégia de precificação para melhorar a margem.";
    }
    
    if (title.includes('Lucro')) {
      return isAbove 
        ? "Lucro acima da média! Continue com as estratégias atuais."
        : "Analise seus custos fixos e variáveis para identificar oportunidades de melhoria.";
    }
    
    return isAbove 
      ? "Seu resultado está acima da média do mercado."
      : "Seu resultado está abaixo da média do mercado.";
  };

  const getProgressWidth = () => {
    const maxValue = Math.max(myValue, marketValue);
    return {
      my: (myValue / maxValue) * 100,
      market: (marketValue / maxValue) * 100
    };
  };

  const progress = getProgressWidth();
  const insightTip = getInsightTip();

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-12 h-12 rounded-lg ${color} flex items-center justify-center`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{title}</h3>
            <p className="text-xs text-gray-500">{totalRestaurants} restaurantes • {region}</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {/* Meu Valor */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Seu restaurante</span>
            <span className="text-lg font-bold text-gray-900">{formatValue(myValue)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-orange-600 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.my}%` }}
            />
          </div>
        </div>

        {/* Valor do Mercado */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Média do mercado</span>
            <span className="text-lg font-bold text-gray-700">{formatValue(marketValue)}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
              style={{ width: `${progress.market}%` }}
            />
          </div>
        </div>

        {/* Performance */}
        <div className={`p-3 rounded-lg text-center text-sm font-medium ${
          alertStatus === 'positive' 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : alertStatus === 'negative'
              ? 'bg-red-50 text-red-700 border border-red-200'
              : alertStatus === 'warning'
                ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                : 'bg-gray-50 text-gray-700 border border-gray-200'
        }`}>
          {getPerformanceText()}
        </div>

        {/* Insight Tip - Novo componente de alerta inteligente */}
        {insightTip && alertStatus !== 'neutral' && (
          <div className={`mt-2 p-3 rounded-lg text-sm ${
            alertStatus === 'positive' 
              ? 'bg-green-50 border border-green-200'
              : alertStatus === 'negative'
                ? 'bg-red-50 border border-red-200'
                : 'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-start space-x-2">
              {alertStatus === 'positive' ? (
                <Info className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              ) : alertStatus === 'negative' ? (
                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              ) : (
                <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              )}
              <span className={`${
                alertStatus === 'positive' 
                  ? 'text-green-700'
                  : alertStatus === 'negative'
                    ? 'text-red-700'
                    : 'text-yellow-700'
              }`}>
                {insightTip}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};