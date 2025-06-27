import React from 'react';
import { ArrowLeft, CreditCard, Calendar, CheckCircle, AlertCircle, Clock, Shield, Zap, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStripe } from '../../hooks/useStripe';
import { SubscriptionCard } from '../../components/Stripe/SubscriptionCard';
import { useAuth } from '../../hooks/useAuth';

export const SubscriptionPage: React.FC = () => {
  const { user } = useAuth();
  const { subscription, isLoading } = useStripe();

  // Calcular dias restantes do trial (7 dias a partir da criação da conta)
  const getTrialDaysRemaining = () => {
    if (!user) return 0;
    const createdAt = new Date(user.created_at);
    const trialEndDate = new Date(createdAt);
    trialEndDate.setDate(trialEndDate.getDate() + 7);
    
    const today = new Date();
    const diffTime = trialEndDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const trialDaysRemaining = getTrialDaysRemaining();
  const isInTrial = trialDaysRemaining > 0;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          to="/profile"
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Assinatura</h1>
          <p className="text-gray-600 mt-1">Gerencie seu plano e pagamentos</p>
        </div>
      </div>

      {/* Trial Status */}
      {isInTrial && !subscription && (
        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <Clock className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-blue-800">Período de Trial</h3>
          </div>
          <p className="text-blue-700 mb-4">
            Você está no período de avaliação gratuita. Restam <span className="font-bold">{trialDaysRemaining} dias</span> para escolher um plano.
          </p>
          <Link
            to="/pricing"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Ver Planos
          </Link>
        </div>
      )}

      {/* Current Subscription */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Sua Assinatura</h2>
        
        {isLoading ? (
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        ) : (
          <SubscriptionCard />
        )}
      </div>

      {/* Payment History */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Histórico de Pagamentos</h2>
        
        {isLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="h-12 bg-gray-200 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
            <div className="h-12 bg-gray-200 rounded w-full"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscription ? (
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(subscription.current_period_start).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Assinatura {subscription.plan_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      R$ {subscription.plan_price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Pago
                      </span>
                    </td>
                  </tr>
                ) : (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                      Nenhum pagamento encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Plan Benefits */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Benefícios do Plano</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mt-1">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Comparativo com o Mercado</h3>
              <p className="text-sm text-gray-600">Compare seu desempenho com outros restaurantes da sua região e categoria</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mt-1">
              <Shield className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Suporte Prioritário</h3>
              <p className="text-sm text-gray-600">Acesso a suporte técnico com prioridade para resolver suas dúvidas</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mt-1">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Atualizações Exclusivas</h3>
              <p className="text-sm text-gray-600">Acesso antecipado a novos recursos e funcionalidades</p>
            </div>
          </div>
          
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mt-1">
              <Package className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">Recursos Completos</h3>
              <p className="text-sm text-gray-600">Acesso a todas as funcionalidades sem limitações</p>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Perguntas Frequentes</h2>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-gray-900">Como funciona a cobrança?</h3>
            <p className="text-sm text-gray-600 mt-1">
              A cobrança é feita automaticamente no cartão de crédito cadastrado, de acordo com o período do seu plano.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">Posso cancelar a qualquer momento?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Sim! Você pode cancelar sua assinatura a qualquer momento. O acesso permanece ativo até o final do período já pago.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">Como alterar meu plano?</h3>
            <p className="text-sm text-gray-600 mt-1">
              Você pode fazer upgrade ou downgrade do seu plano a qualquer momento através da página de assinatura.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};