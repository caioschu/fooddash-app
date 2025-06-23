import React, { useState } from 'react';
import { Check, Star, Zap, Crown, Shield, TrendingUp, BarChart3, Users, CreditCard, Calendar, ArrowRight, Sparkles, Target, ArrowLeft, Home } from 'lucide-react';
import { CheckoutButton } from '../../components/Stripe/CheckoutButton';
import { STRIPE_PRODUCTS } from '../../lib/stripe';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

interface PlanFeature {
  name: string;
  included: boolean;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  description: string;
  duration: string;
  originalPrice: number;
  price: number;
  savings?: number;
  popular?: boolean;
  premium?: boolean;
  icon: React.ComponentType<any>;
  features: PlanFeature[];
  badge?: string;
  priceId: string;
}

export const PricingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const plans: Plan[] = [
    {
      id: 'monthly',
      name: 'Mensal',
      description: 'Ideal para testar a plataforma',
      duration: '1 mês',
      originalPrice: 149.90,
      price: 149.90,
      icon: Calendar,
      priceId: STRIPE_PRODUCTS.monthly.priceId,
      features: [
        { name: 'Dashboard completo', included: true },
        { name: 'Gestão de vendas', included: true },
        { name: 'Gestão de despesas', included: true },
        { name: 'DRE automática', included: true },
        { name: 'Comparativo com mercado', included: true, highlight: true },
        { name: 'Análise temporal', included: true },
        { name: 'Gestão de acessos', included: true },
        { name: 'Suporte por email', included: true }
      ]
    },
    {
      id: 'semestral',
      name: 'Semestral',
      description: 'Economia de 13% ao mês',
      duration: '6 meses',
      originalPrice: 149.90,
      price: 129.90,
      savings: 13,
      popular: true,
      icon: TrendingUp,
      badge: 'Mais Popular',
      priceId: STRIPE_PRODUCTS.semestral.priceId,
      features: [
        { name: 'Dashboard completo', included: true },
        { name: 'Gestão de vendas', included: true },
        { name: 'Gestão de despesas', included: true },
        { name: 'DRE automática', included: true },
        { name: 'Comparativo com mercado', included: true, highlight: true },
        { name: 'Análise temporal', included: true },
        { name: 'Gestão de acessos', included: true },
        { name: 'Suporte prioritário', included: true }
      ]
    },
    {
      id: 'anual',
      name: 'Anual',
      description: 'Economia de 33% ao mês',
      duration: '12 meses',
      originalPrice: 149.90,
      price: 99.90,
      savings: 33,
      premium: true,
      icon: Crown,
      badge: 'Melhor Valor',
      priceId: STRIPE_PRODUCTS.anual.priceId,
      features: [
        { name: 'Dashboard completo', included: true },
        { name: 'Gestão de vendas', included: true },
        { name: 'Gestão de despesas', included: true },
        { name: 'DRE automática', included: true },
        { name: 'Comparativo com mercado', included: true, highlight: true },
        { name: 'Análise temporal', included: true },
        { name: 'Gestão de acessos', included: true },
        { name: 'Suporte VIP', included: true }
      ]
    }
  ];

  const handleGoBack = () => {
    navigate(-1);
  };

  const renderNavigationHeader = () => {
    if (user) {
      // Usuário logado - mostrar link para dashboard
      return (
        <div className="flex items-center justify-between mb-4">
          <Link 
            to="/dashboard"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Voltar ao Dashboard</span>
          </Link>
        </div>
      );
    } else {
      // Usuário não logado - mostrar opções de voltar e fazer login
      return (
        <div className="flex items-center justify-between mb-4">
          <button 
            onClick={handleGoBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Voltar</span>
          </button>
          
          <Link 
            to="/auth" 
            className="text-orange-600 hover:text-orange-700 font-medium"
          >
            Fazer login
          </Link>
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          {renderNavigationHeader()}
          
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              {user ? 'Upgrade seu plano' : 'Escolha o plano ideal para seu restaurante'}
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
              {user 
                ? 'Aproveite todos os recursos da plataforma com nossos planos premium.'
                : 'Todos os planos incluem as mesmas funcionalidades. A diferença está apenas no período de cobrança e desconto.'
              }
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {plans.map((plan) => {
            const IconComponent = plan.icon;
            
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                  plan.popular ? 'ring-4 ring-orange-500 ring-opacity-50' : ''
                } ${plan.premium ? 'ring-4 ring-purple-500 ring-opacity-50' : ''}`}
              >
                {/* Badge */}
                {plan.badge && (
                  <div className="absolute top-0 left-0 right-0 flex justify-center z-10">
                    <div className={`px-6 py-2 rounded-b-lg text-sm font-bold text-white shadow-lg ${
                      plan.popular ? 'bg-gradient-to-r from-orange-500 to-orange-600' : 
                      plan.premium ? 'bg-gradient-to-r from-purple-500 to-purple-600' : 
                      'bg-gradient-to-r from-blue-500 to-blue-600'
                    }`}>
                      {plan.badge}
                    </div>
                  </div>
                )}

                <div className={`p-6 sm:p-8 ${plan.badge ? 'pt-12' : ''}`}>
                  {/* Header */}
                  <div className="text-center mb-6">
                    <div className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center mb-4 ${
                      plan.popular ? 'bg-orange-100' : plan.premium ? 'bg-purple-100' : 'bg-blue-100'
                    }`}>
                      <IconComponent className={`w-8 h-8 ${
                        plan.popular ? 'text-orange-600' : plan.premium ? 'text-purple-600' : 'text-blue-600'
                      }`} />
                    </div>
                    
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                    <p className="text-gray-600 mb-4">{plan.description}</p>
                    
                    {/* Pricing */}
                    <div className="mb-4">
                      {plan.savings && (
                        <div className="flex items-center justify-center space-x-2 mb-2">
                          <span className="text-sm text-gray-500 line-through">
                            R$ {plan.originalPrice.toFixed(2)}
                          </span>
                          <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                            plan.popular ? 'bg-orange-100 text-orange-800' : 'bg-purple-100 text-purple-800'
                          }`}>
                            -{plan.savings}%
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-baseline justify-center">
                        <span className="text-3xl sm:text-4xl font-bold text-gray-900">
                          R$ {plan.price.toFixed(2)}
                        </span>
                        <span className="text-gray-600 ml-2">/mês</span>
                      </div>
                      
                      <p className="text-sm text-gray-500 mt-2">
                        Cobrança {plan.duration === '1 mês' ? 'mensal' : plan.duration === '6 meses' ? 'semestral' : 'anual'}
                      </p>
                      
                      {plan.savings && (
                        <p className="text-sm font-medium text-green-600 mt-2">
                          💰 Economia de R$ {((plan.originalPrice - plan.price) * (plan.duration === '6 meses' ? 6 : 12)).toFixed(2)} 
                          {plan.duration === '6 meses' ? ' em 6 meses' : ' por ano'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-3 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className={`flex items-center space-x-3 ${
                        feature.highlight ? 'bg-gradient-to-r from-orange-50 to-yellow-50 p-3 rounded-lg border-2 border-orange-200' : ''
                      }`}>
                        <div className={`flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${
                          feature.highlight ? 'bg-orange-500' : 'bg-green-500'
                        }`}>
                          {feature.highlight ? (
                            <Target className="w-3 h-3 text-white" />
                          ) : (
                            <Check className="w-3 h-3 text-white" />
                          )}
                        </div>
                        <span className={`text-sm ${
                          feature.highlight ? 'text-orange-800 font-semibold' : 'text-gray-700'
                        }`}>
                          {feature.name}
                          {feature.highlight && (
                            <span className="block text-xs text-orange-600 mt-1">
                              🎯 Compare com outros restaurantes da sua região
                            </span>
                          )}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <CheckoutButton
                    priceId={plan.priceId}
                    planName={plan.name}
                    className={`w-full ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-lg hover:shadow-xl'
                        : plan.premium
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl'
                    }`}
                  >
                    {user ? 'Assinar agora' : 'Começar agora'}
                  </CheckoutButton>
                </div>
              </div>
            );
          })}
        </div>

        {/* Features Comparison */}
        <div className="mt-16">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h3 className="text-2xl font-bold text-gray-900 text-center mb-2">
              Todas as funcionalidades incluídas em todos os planos
            </h3>
            <p className="text-center text-orange-600 font-semibold mb-8">
              🎯 Destaque especial: Compare seu restaurante com o mercado da sua região
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-yellow-50 rounded-xl border-2 border-orange-200">
                <div className="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-white" />
                </div>
                <h4 className="font-bold text-orange-800 mb-2">Comparativo de Mercado</h4>
                <p className="text-sm text-orange-700">Compare seu desempenho com outros restaurantes da sua região e categoria</p>
                <div className="mt-3 text-xs text-orange-600 font-medium">
                  ⭐ Principal diferencial da plataforma
                </div>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Dashboard Completo</h4>
                <p className="text-sm text-gray-600">Visão geral com todas as métricas importantes</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">Gestão Financeira</h4>
                <p className="text-sm text-gray-600">Controle completo de vendas e despesas</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <BarChart3 className="w-6 h-6 text-purple-600" />
                </div>
                <h4 className="font-semibold text-gray-900 mb-2">DRE Automática</h4>
                <p className="text-sm text-gray-600">Relatórios financeiros gerados automaticamente</p>
              </div>
            </div>
          </div>
        </div>

        {/* Guarantee Section */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8 max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Shield className="w-12 h-12 text-green-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Garantia de 30 dias
            </h3>
            <p className="text-gray-600 text-lg mb-6">
              Experimente nossa plataforma sem riscos. Se não ficar satisfeito, 
              devolvemos 100% do seu dinheiro nos primeiros 30 dias.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Sem taxa de setup</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Cancele quando quiser</span>
              </div>
              <div className="flex items-center justify-center space-x-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Suporte incluído</span>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 sm:p-8 text-white">
            <h3 className="text-2xl font-bold mb-4">
              Ainda tem dúvidas?
            </h3>
            <p className="text-orange-100 mb-6">
              Nossa equipe está pronta para ajudar você a escolher o melhor plano
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
              <a
                href="mailto:vendas@fooddash.com.br"
                className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors"
              >
                Falar com vendas
              </a>
              <a
                href="https://wa.me/5511999999999"
                className="border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white hover:text-orange-600 transition-colors"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};