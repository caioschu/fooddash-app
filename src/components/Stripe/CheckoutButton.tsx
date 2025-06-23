import React, { useState } from 'react';
import { CreditCard, Loader } from 'lucide-react';
import { createCheckoutSession } from '../../lib/stripe';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../hooks/useToast';

interface CheckoutButtonProps {
  priceId: string;
  planName: string;
  className?: string;
  children?: React.ReactNode;
}

export const CheckoutButton: React.FC<CheckoutButtonProps> = ({
  priceId,
  planName,
  className = '',
  children
}) => {
  const { user } = useAuth();
  const { showError, showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    if (!user) {
      showError('Login necessário', 'Faça login para assinar um plano');
      return;
    }

    setIsLoading(true);
    try {
      showSuccess('Redirecionando...', 'Você será redirecionado para o checkout');
      await createCheckoutSession(priceId, user.email);
    } catch (error) {
      console.error('Checkout error:', error);
      showError('Erro no checkout', 'Não foi possível iniciar o processo de pagamento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={isLoading}
      className={`flex items-center justify-center space-x-2 py-3 sm:py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <>
          <Loader className="w-5 h-5 animate-spin" />
          <span>Processando...</span>
        </>
      ) : (
        <>
          <CreditCard className="w-5 h-5" />
          <span>{children || `Assinar ${planName}`}</span>
        </>
      )}
    </button>
  );
};