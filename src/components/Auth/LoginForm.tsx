import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, Users, AlertCircle, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

interface LoginFormProps {
  onSwitchToRegister: () => void;
  onSwitchToEmployeeLogin: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister, onSwitchToEmployeeLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
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

    console.log('Attempting login with email:', email);
    const result = await login(email, password);
    
    if (result.success) {
      console.log('Login successful, redirecting to dashboard...');
      navigate('/dashboard', { replace: true });
    } else {
      setError(result.error || 'Erro ao fazer login. Tente novamente.');
    }
    
    setIsSubmitting(false);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, digite seu email primeiro');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?reset=true`,
      });

      if (error) {
        setError('Erro ao enviar email de recuperação. Tente novamente.');
      } else {
        setResetEmailSent(true);
        setShowForgotPassword(false);
      }
    } catch (error) {
      setError('Erro inesperado. Tente novamente.');
    }

    setIsSubmitting(false);
  };

  if (showForgotPassword) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Recuperar Senha</h1>
          <p className="text-gray-600 text-sm sm:text-base">Digite seu email para receber um link de recuperação</p>
        </div>

        <form onSubmit={handleForgotPassword} className="space-y-4 sm:space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
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
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-base"
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center">
          <button
            onClick={() => setShowForgotPassword(false)}
            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
            disabled={isSubmitting}
          >
            ← Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  if (resetEmailSent) {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Email Enviado!</h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Enviamos um link de recuperação para <strong>{email}</strong>
          </p>
          <p className="text-gray-500 text-xs sm:text-sm mt-2">
            Verifique sua caixa de entrada e spam
          </p>
        </div>

        <div className="text-center">
          <button
            onClick={() => {
              setResetEmailSent(false);
              setShowForgotPassword(false);
            }}
            className="text-orange-600 hover:text-orange-700 font-medium text-sm"
          >
            ← Voltar ao login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Bem-vindo de volta!</h1>
        <p className="text-gray-600 text-sm sm:text-base">Entre na sua conta FoodDash</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="font-medium">{error}</p>
                {error.includes('Email ou senha incorretos') && (
                  <div className="mt-3 space-y-2">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <div className="flex items-start space-x-2">
                        <Info className="w-4 h-4 mt-0.5 text-blue-600 flex-shrink-0" />
                        <div className="text-blue-800 text-xs">
                          <p className="font-medium mb-1">Possíveis soluções:</p>
                          <ul className="space-y-1 list-disc list-inside">
                            <li>Verifique se o email está digitado corretamente</li>
                            <li>Certifique-se de que confirmou seu email após o cadastro</li>
                            <li>Tente usar a opção "Esqueci minha senha" abaixo</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs">
                      Ainda não tem uma conta?{' '}
                      <button
                        type="button"
                        onClick={onSwitchToRegister}
                        className="text-orange-600 hover:text-orange-700 font-medium underline"
                      >
                        Cadastre-se aqui
                      </button>
                    </p>
                  </div>
                )}
              </div>
            </div>
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
          <div className="flex justify-between items-center mb-2">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <button
              type="button"
              onClick={() => setShowForgotPassword(true)}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              disabled={isSubmitting}
            >
              Esqueci minha senha
            </button>
          </div>
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
        <button
          onClick={onSwitchToEmployeeLogin}
          className="flex items-center justify-center space-x-2 text-blue-600 hover:text-blue-700 font-medium mx-auto"
          disabled={isSubmitting}
        >
          <Users className="w-4 h-4" />
          <span>Sou funcionário</span>
        </button>
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