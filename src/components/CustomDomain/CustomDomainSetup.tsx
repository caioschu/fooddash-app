import React, { useState } from 'react';
import { Globe, Check, AlertCircle, ArrowRight, Loader } from 'lucide-react';
import { useToast } from '../../hooks/useToast';

interface CustomDomainSetupProps {
  currentDomain?: string;
}

export const CustomDomainSetup: React.FC<CustomDomainSetupProps> = ({ currentDomain }) => {
  const [domain, setDomain] = useState(currentDomain || '');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleVerifyDomain = async () => {
    if (!domain) {
      showError('Domínio inválido', 'Por favor, insira um domínio válido.');
      return;
    }

    setIsVerifying(true);
    setVerificationStatus('idle');

    try {
      // Simulação de verificação de domínio
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Em um ambiente real, você faria uma chamada à API para verificar o domínio
      // const response = await fetch('/api/verify-domain', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ domain })
      // });
      // const data = await response.json();
      
      // Simulando sucesso
      setVerificationStatus('success');
      showSuccess('Domínio verificado', 'O domínio está disponível para uso.');
    } catch (error) {
      console.error('Erro ao verificar domínio:', error);
      setVerificationStatus('error');
      showError('Erro na verificação', 'Não foi possível verificar o domínio. Tente novamente.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (verificationStatus !== 'success') {
      showError('Verificação necessária', 'Por favor, verifique o domínio antes de configurar.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Simulação de configuração de domínio
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Em um ambiente real, você faria uma chamada à API para configurar o domínio
      // const response = await fetch('/api/configure-domain', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ domain })
      // });
      // const data = await response.json();
      
      showSuccess('Domínio configurado', `O domínio ${domain} foi configurado com sucesso!`);
    } catch (error) {
      console.error('Erro ao configurar domínio:', error);
      showError('Erro na configuração', 'Não foi possível configurar o domínio. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
          <Globe className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Configurar Domínio Próprio</h3>
          <p className="text-sm text-gray-600">Conecte seu domínio personalizado ao FoodDash</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="domain" className="block text-sm font-medium text-gray-700 mb-2">
            Seu Domínio
          </label>
          <div className="flex items-center space-x-3">
            <div className="flex-1">
              <input
                id="domain"
                type="text"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="exemplo.com.br"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isVerifying || isSubmitting}
              />
            </div>
            <button
              type="button"
              onClick={handleVerifyDomain}
              disabled={isVerifying || isSubmitting || !domain}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {isVerifying ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  <span>Verificando...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Verificar</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Digite seu domínio sem "http://" ou "https://"
          </p>
        </div>

        {verificationStatus === 'success' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <Check className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">Domínio verificado</h4>
                <p className="text-sm text-green-700">
                  O domínio {domain} está disponível para configuração.
                </p>
              </div>
            </div>
          </div>
        )}

        {verificationStatus === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Erro na verificação</h4>
                <p className="text-sm text-red-700">
                  Não foi possível verificar o domínio. Verifique se o domínio está correto e tente novamente.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-medium text-gray-900 mb-3">Configuração de DNS</h4>
          <p className="text-sm text-gray-700 mb-3">
            Para configurar seu domínio, adicione os seguintes registros DNS:
          </p>
          
          <div className="space-y-3">
            <div className="bg-white p-3 rounded border border-gray-300">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-gray-500">Tipo</span>
                  <p className="font-mono text-sm">CNAME</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Nome</span>
                  <p className="font-mono text-sm">www</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Valor</span>
                  <p className="font-mono text-sm">fooddash-app.netlify.app</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white p-3 rounded border border-gray-300">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <span className="text-xs text-gray-500">Tipo</span>
                  <p className="font-mono text-sm">A</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Nome</span>
                  <p className="font-mono text-sm">@</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Valor</span>
                  <p className="font-mono text-sm">75.2.60.5</p>
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-xs text-gray-500 mt-3">
            Nota: As alterações de DNS podem levar até 48 horas para propagar completamente.
          </p>
        </div>

        <button
          type="submit"
          disabled={verificationStatus !== 'success' || isSubmitting}
          className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isSubmitting ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              <span>Configurando...</span>
            </>
          ) : (
            <>
              <ArrowRight className="w-4 h-4" />
              <span>Configurar Domínio</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};