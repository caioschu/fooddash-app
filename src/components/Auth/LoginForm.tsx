import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Link } from 'react-router-dom';

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useAuth();
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

    try {
      console.log('Attempting login with email:', email);
      const result = await login(email, password);
      
      if (result.success) {
        console.log('Login successful, redirecting to dashboard...');
        // Redireciona para dashboard após login bem-sucedido
        navigate('/dashboard', { replace: true });
      } else {
        setError(result.error || 'Erro ao fazer login. Tente novamente.');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Bem-vindo de volta!</h1>
        <p className="text-gray-600 text-sm sm:text-base">Entre na sua conta FoodDash</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-base"
              placeholder="seu@email.com"
              disabled={isSubmitting}
              autoComplete="email"
            />
          </div>
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-base"
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
          className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
        >
          {isSubmitting ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="mt-4 sm:mt-6 text-center">
        <p className="text-sm text-gray-600">
          Não tem uma conta?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-orange-600 hover:text-orange-700 font-medium"
            disabled={isSubmitting}
          >
            Cadastre-se
          </button>
        </p>
      </div>

      <div className="mt-3 sm:mt-4 text-center">
        <p className="text-xs text-gray-500">
          Quer conhecer nossos planos?{' '}
          <Link to="/pricing" className="text-orange-600 hover:text-orange-700 font-medium">
            Ver preços
          </Link>
        </p>
      </div>

      <div className="mt-3 sm:mt-4 text-center">
        <p className="text-xs text-gray-500">
          Ao continuar, você aceita os{' '}
          <a href="#" className="text-orange-600 hover:text-orange-700">
            termos
          </a>{' '}
          e a{' '}
          <a href="#" className="text-orange-600 hover:text-orange-700">
            política de privacidade
          </a>
          .
        </p>
      </div>
    </div>
  );
};

