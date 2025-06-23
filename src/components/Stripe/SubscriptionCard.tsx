import React from 'react';
import { Calendar, CreditCard, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useStripe } from '../../hooks/useStripe';
import { createPortalSession } from '../../lib/stripe';

export const SubscriptionCard: React.FC = () => {
  const { subscription, isLoading, hasActiveSubscription, getDaysUntilExpiry, getSubscriptionStatus } = useStripe();

  const handleManageSubscription = async () => {
    if (!subscription?.stripe_customer_id) return;
    
    try {
      await createPortalSession(subscription.stripe_customer_id);
    } catch (error) {
      console.error('Error opening customer portal:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200">
        <div className="flex items-center space-x-3 mb-4">
          <AlertCircle className="w-6 h-6 text-yellow-600" />
          <h3 className="text-lg font-semibold text-yellow-800">Nenhuma assinatura ativa</h3>
        </div>
        <p className="text-yellow-700 mb-4">
          Você não possui uma assinatura ativa. Escolha um plano para continuar usando o FoodDash.
        </p>
        <a
          href="/pricing"
          className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
        >
          Ver Planos
        </a>
      </div>
    );
  }

  const status = getSubscriptionStatus();
  const daysUntilExpiry = getDaysUntilExpiry();

  const getStatusIcon = () => {
    switch (status) {
      case 'active':
        return <CheckCircle className="w-6 h-6 text-green-600" />;
      case 'expired':
        return <AlertCircle className="w-6 h-6 text-red-600" />;
      default:
        return <Clock className="w-6 h-6 text-yellow-600" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'active':
        return 'bg-green-50 border-green-200';
      case 'expired':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'active':
        return daysUntilExpiry > 7 ? 'Assinatura Ativa' : `Expira em ${daysUntilExpiry} dias`;
      case 'expired':
        return 'Assinatura Expirada';
      default:
        return 'Status Indefinido';
    }
  };

  return (
    <div className={`p-6 rounded-xl border ${getStatusColor()}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{subscription.plan_name}</h3>
            <p className="text-sm text-gray-600">{getStatusText()}</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900">
            R$ {subscription.plan_price.toFixed(2)}
          </div>
          <div className="text-sm text-gray-600">
            por {subscription.plan_interval === 'month' ? 'mês' : 
                 subscription.plan_interval === 'year' ? 'ano' : 
                 subscription.plan_interval}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Início: {new Date(subscription.current_period_start).toLocaleDateString('pt-BR')}
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            Renovação: {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          ID da Assinatura: {subscription.stripe_subscription_id.substring(0, 8)}...
        </div>
        <button
          onClick={handleManageSubscription}
          className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          <span>Gerenciar Assinatura</span>
        </button>
      </div>
    </div>
  );
};