import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User as UserType } from '../../types';

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<UserType['tipo_usuario']>('restaurante');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!email || !password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      setIsSubmitting(false);
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      setIsSubmitting(false);
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      setIsSubmitting(false);
      return;
    }

    try {
      const result = await register(email, password, userType);
      if (!result.success) {
        if (result.error === 'User already registered' || 
            (result.error && result.error.includes('user_already_exists')) ||
            (result.error && result.error.includes('User already registered'))) {
          setError('Este e-mail já está cadastrado. Por favor, faça login.');
        } else {
          setError(result.error || 'Erro ao criar conta. Tente novamente.');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage === 'User already registered' || 
          errorMessage.includes('user_already_exists') ||
          errorMessage.includes('User already registered')) {
        setError('Este e-mail já está cadastrado. Por favor, faça login.');
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Crie sua conta</h1>
        <p className="text-gray-600 text-sm sm:text-base">Comece a usar o FoodDash gratuitamente</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
            {(error.includes('Este e-mail já está cadastrado') || error.includes('User already registered')) && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-orange-600 hover:text-orange-700 font-medium underline"
                >
                  Clique aqui para fazer login
                </button>
              </div>
            )}
          </div>
        )}

        <div>
          <label htmlFor="userType" className="block text-sm font-medium text-gray-700 mb-2">
            Tipo de Conta
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              id="userType"
              value={userType}
              onChange={(e) => setUserType(e.target.value as UserType['tipo_usuario'])}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors appearance-none text-base"
              disabled={isSubmitting}
            >
              <option value="restaurante">Restaurante</option>
              <option value="fornecedor">Fornecedor</option>
              <option value="candidato">Candidato a Vaga</option>
            </select>
          </div>
        </div>

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
              placeholder="Mínimo 6 caracteres"
              disabled={isSubmitting}
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

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmar Senha
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-base"
              placeholder="Confirme sua senha"
              disabled={isSubmitting}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              disabled={isSubmitting}
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
        >
          {isSubmitting ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>

      <div className="mt-4 sm:mt-6 text-center">
        <p className="text-sm text-gray-600">
          Já tem uma conta?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-orange-600 hover:text-orange-700 font-medium"
            disabled={isSubmitting}
          >
            Faça login
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
          Ao criar uma conta, você aceita os{' '}
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