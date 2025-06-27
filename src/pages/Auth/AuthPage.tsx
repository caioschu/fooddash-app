import React, { useState } from 'react';
import { LoginForm } from '../../components/Auth/LoginForm';
import { RegisterForm } from '../../components/Auth/RegisterForm';
import { EmployeeLoginForm } from '../../components/Auth/EmployeeLoginForm';
import logoHorizontal from '../../assets/FreeSample-Vectorizer-io-logo horizontal.svg';

export const AuthPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isEmployeeLogin, setIsEmployeeLogin] = useState(false);

  const handleSwitchToRegister = () => {
    setIsLogin(false);
    setIsEmployeeLogin(false);
  };

  const handleSwitchToLogin = () => {
    setIsLogin(true);
    setIsEmployeeLogin(false);
  };

  const handleSwitchToEmployeeLogin = () => {
    setIsLogin(true);
    setIsEmployeeLogin(true);
  };

  const handleSwitchToRegularLogin = () => {
    setIsLogin(true);
    setIsEmployeeLogin(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <img 
            src={logoHorizontal} 
            alt="FoodDash" 
            className="h-16 sm:h-20 md:h-24 mx-auto mb-4"
          />
          <p className="text-gray-600 text-sm sm:text-base">
            Plataforma SaaS para gestão inteligente de restaurantes
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8">
          {isLogin ? (
            isEmployeeLogin ? (
              <EmployeeLoginForm onSwitchToRegular={handleSwitchToRegularLogin} />
            ) : (
              <LoginForm 
                onSwitchToRegister={handleSwitchToRegister} 
                onSwitchToEmployeeLogin={handleSwitchToEmployeeLogin}
              />
            )
          ) : (
            <RegisterForm onSwitchToLogin={handleSwitchToLogin} />
          )}
        </div>

        <div className="mt-6 sm:mt-8 text-center">
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-xs sm:text-sm text-gray-500">
            <span>✅ Gestão completa</span>
            <span>📊 Benchmarking</span>
            <span>💰 DRE automática</span>
          </div>
        </div>
      </div>
    </div>
  );
};