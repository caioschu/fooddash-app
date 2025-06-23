import React from 'react';
import { ArrowLeft, Globe, Link, ExternalLink } from 'lucide-react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useRestaurant } from '../../hooks/useRestaurant';
import { CustomDomainSetup } from '../../components/CustomDomain/CustomDomainSetup';

export const DomainSettings: React.FC = () => {
  const navigate = useNavigate();
  const { restaurant } = useRestaurant();

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Globe className="w-7 h-7 mr-3 text-orange-600" />
              Configurações de Domínio
            </h1>
            <p className="text-gray-600 mt-1">Personalize seu acesso com um domínio próprio</p>
          </div>
        </div>
      </div>

      {/* Current Domain Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Domínio Atual</h2>
        
        <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <Link className="w-5 h-5 text-blue-600" />
          <div className="flex-1">
            <p className="text-sm text-gray-600">Seu acesso atual</p>
            <p className="font-medium text-gray-900">
              {restaurant?.nome ? restaurant.nome.toLowerCase().replace(/\s+/g, '-') : 'seu-restaurante'}.fooddash.com.br
            </p>
          </div>
          <a 
            href={`https://${restaurant?.nome ? restaurant.nome.toLowerCase().replace(/\s+/g, '-') : 'seu-restaurante'}.fooddash.com.br`} 
            target="_blank" 
            rel="noopener noreferrer"
            className="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors flex items-center space-x-1"
          >
            <span>Visitar</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Custom Domain Setup */}
      <CustomDomainSetup />

      {/* Information Box */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Globe className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Vantagens de um domínio próprio</h4>
            <ul className="text-sm text-blue-800 mt-1 space-y-1">
              <li>• Fortalecimento da marca do seu restaurante</li>
              <li>• Acesso mais fácil para seus funcionários</li>
              <li>• Maior profissionalismo para sua operação</li>
              <li>• Melhor experiência para seus clientes</li>
            </ul>
            <p className="text-xs text-blue-700 mt-2">
              💡 <strong>Dica:</strong> Escolha um domínio que seja fácil de lembrar e que represente bem o seu restaurante.
            </p>
          </div>
        </div>
      </div>

      {/* Help & Support */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Precisa de ajuda?</h2>
        <p className="text-gray-600 mb-4">
          Se você tiver dúvidas sobre como configurar seu domínio próprio, nossa equipe de suporte está disponível para ajudar.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <a 
            href="mailto:suporte@fooddash.com.br" 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            Contatar Suporte
          </a>
          <a 
            href="#" 
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-center"
          >
            Ver Documentação
          </a>
        </div>
      </div>
    </div>
  );
};