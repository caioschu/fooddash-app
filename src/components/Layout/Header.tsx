import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useStripe } from '../../hooks/useStripe';
import { User, LogOut, Bell, Settings, Building2, Clock, Crown, AlertTriangle } from 'lucide-react';
import logoHorizontal from '../../assets/FreeSample-Vectorizer-io-logo horizontal.svg';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const { restaurant } = useRestaurant();
  const { subscription, hasActiveSubscription, getDaysUntilExpiry, getSubscriptionStatus } = useStripe();

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
  const hasActiveSub = hasActiveSubscription();
  const subscriptionDaysRemaining = hasActiveSub ? getDaysUntilExpiry() : 0;

  // Determinar qual indicador mostrar
  const getSubscriptionIndicator = () => {
    if (hasActiveSub) {
      // Usuário tem assinatura ativa
      const status = getSubscriptionStatus();
      const isExpiringSoon = subscriptionDaysRemaining <= 7;
      
      return (
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
          isExpiringSoon 
            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' 
            : 'bg-green-100 text-green-800 border border-green-200'
        }`}>
          <Crown className="w-4 h-4" />
          <span className="hidden sm:inline">
            {status === 'active' ? 'Pro' : 'Assinatura'} • {subscriptionDaysRemaining} dias
          </span>
          <span className="sm:hidden">
            {subscriptionDaysRemaining}d
          </span>
        </div>
      );
    } else if (trialDaysRemaining > 0) {
      // Usuário em período de trial
      const isTrialExpiringSoon = trialDaysRemaining <= 2;
      
      return (
        <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
          isTrialExpiringSoon 
            ? 'bg-red-100 text-red-800 border border-red-200' 
            : 'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <Clock className="w-4 h-4" />
          <span className="hidden sm:inline">
            Trial • {trialDaysRemaining} {trialDaysRemaining === 1 ? 'dia' : 'dias'}
          </span>
          <span className="sm:hidden">
            {trialDaysRemaining}d
          </span>
        </div>
      );
    } else {
      // Trial expirado, sem assinatura
      return (
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-800 border border-red-200">
          <AlertTriangle className="w-4 h-4" />
          <span className="hidden sm:inline">Trial Expirado</span>
          <span className="sm:hidden">Expirado</span>
        </div>
      );
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4 sm:py-5 h-16 sm:h-20 fixed top-0 left-0 right-0 z-40">
      <div className="flex items-center justify-between h-full">
        <div className="flex items-center space-x-4 sm:space-x-6 h-full ml-10 md:ml-0">
          {/* Logo */}
          <div className="h-12 sm:h-16 md:h-18 flex items-center">
            <img 
              src={logoHorizontal} 
              alt="FoodDash" 
              className="h-full w-auto object-contain"
            />
          </div>
          
          {/* Restaurant Info */}
          {restaurant && (
            <div className="flex items-center space-x-4 pl-4 sm:pl-6 border-l border-gray-200">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-orange-100 rounded-xl flex items-center justify-center overflow-hidden">
                {restaurant.logo_url ? (
                  <img 
                    src={restaurant.logo_url} 
                    alt="Logo" 
                    className="w-full h-full object-cover rounded-xl"
                  />
                ) : (
                  <Building2 className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" />
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">{restaurant.nome}</h1>
                <p className="text-sm text-gray-600">
                  {restaurant.categoria_culinaria} • {restaurant.cidade}, {restaurant.estado}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Right Side - Subscription Status + User Actions */}
        <div className="flex items-center space-x-2 sm:space-x-4">
          {/* Subscription/Trial Indicator */}
          {user && getSubscriptionIndicator()}
          
          {/* Desktop Actions */}
          <div className="hidden sm:flex items-center space-x-4">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Settings className="w-5 h-5" />
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                <User className="w-4 h-4 text-orange-600" />
              </div>
              <div className="text-sm">
                <div className="font-medium text-gray-700">
                  {user?.email}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.tipo_usuario === 'admin' ? 'Administrador' : 'Restaurante'}
                </div>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile Actions - Compacto */}
          <div className="flex sm:hidden items-center space-x-1">
            <div className="w-7 h-7 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
              <User className="w-3 h-3 text-orange-600" />
            </div>
            
            <button
              onClick={logout}
              className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
