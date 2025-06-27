import React, { useState } from 'react';
import { useEmployeeAuth } from '../../hooks/useEmployeeAuth';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, AlertCircle, Building2 } from 'lucide-react';

interface EmployeeLoginFormProps {
  onSwitchToRegular: () => void;
}

export const EmployeeLoginForm: React.FC<EmployeeLoginFormProps> = ({ onSwitchToRegular }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useEmployeeAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      setIsSubmitting(false);
      return;
    }

    console.log('Tentando login de funcionário com email:', email);
    const result = await login(email, password);
    
    if (result.success) {
      console.log('Login de funcionário bem-sucedido, redirecionando para dashboard...');
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error || 'Erro ao fazer login. Tente novamente.');
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Building2 className="w-8 h-8 text-blue-600" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Login de Funcionário</h1>
        <p className="text-gray-600 text-sm sm:text-base">Acesse com suas credenciais de funcionário</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label htmlFor="employee-email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="employee-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
              placeholder="seu@email.com"
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="employee-password" className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="employee-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-base"
              placeholder="Sua senha"
              disabled={isSubmitting}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
        >
          {isSubmitting ? 'Entrando...' : 'Entrar como Funcionário'}
        </button>
      </form>

      <div className="mt-4 sm:mt-6 text-center">
        <p className="text-sm text-gray-600">
          Não é um funcionário?{' '}
          <button
            onClick={onSwitchToRegular}
            className="text-orange-600 hover:text-orange-700 font-medium"
            disabled={isSubmitting}
          >
            Login de Proprietário
          </button>
        </p>
      </div>

      <div className="mt-3 sm:mt-4 text-center">
        <p className="text-xs text-gray-500">
          Acesso exclusivo para funcionários cadastrados pelo proprietário do restaurante.
        </p>
      </div>
    </div>
  );
};