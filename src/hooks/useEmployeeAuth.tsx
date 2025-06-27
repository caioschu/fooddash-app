import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface EmployeeUser {
  id: string;
  restaurant_id: string;
  restaurant_name: string;
  name: string;
  email: string;
  permissions: {
    sales: boolean;
    expenses: boolean;
    dre: boolean;
    profile: boolean;
    dashboard: boolean;
    analytics: boolean;
    reports: boolean;
    settings: boolean;
  };
  is_active: boolean;
  restaurant_logo?: string;
  restaurant_category?: string;
}

interface EmployeeAuthContextType {
  employeeUser: EmployeeUser | null;
  isEmployeeAuth: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
}

const EmployeeAuthContext = createContext<EmployeeAuthContextType | null>(null);

export const useEmployeeAuth = () => {
  const context = useContext(EmployeeAuthContext);
  if (!context) {
    throw new Error('useEmployeeAuth must be used within EmployeeAuthProvider');
  }
  return context;
};

export const EmployeeAuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [employeeUser, setEmployeeUser] = useState<EmployeeUser | null>(null);
  const [isEmployeeAuth, setIsEmployeeAuth] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Verificar se há um usuário de acesso no localStorage
    const checkStoredEmployee = () => {
      try {
        const storedEmployeeData = localStorage.getItem('employeeUser');
        if (storedEmployeeData) {
          const parsedData = JSON.parse(storedEmployeeData);
          setEmployeeUser(parsedData);
          setIsEmployeeAuth(true);
        }
      } catch (err) {
        console.error('Erro ao recuperar dados do funcionário:', err);
        localStorage.removeItem('employeeUser');
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredEmployee();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setIsLoading(true);
      setError(null);

      // Verificar se as variáveis de ambiente estão configuradas
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.');
      }

      // Chamar a Edge Function para autenticar o funcionário
      const response = await supabase.functions.invoke('authenticate-employee', {
        body: { email, password }
      });

      if (response.error) {
        throw new Error(response.error.message || 'Credenciais inválidas');
      }

      const employeeData = response.data;
      
      // Formatar os dados do usuário
      const formattedUser: EmployeeUser = {
        id: employeeData.id,
        restaurant_id: employeeData.restaurant_id,
        restaurant_name: employeeData.restaurant_name,
        name: employeeData.name,
        email: employeeData.email,
        permissions: employeeData.permissions || {
          sales: false,
          expenses: false,
          dre: false,
          profile: false,
          dashboard: false,
          analytics: false,
          reports: false,
          settings: false
        },
        is_active: employeeData.is_active,
        restaurant_logo: employeeData.restaurant_logo,
        restaurant_category: employeeData.restaurant_category
      };

      // Salvar no estado e localStorage
      setEmployeeUser(formattedUser);
      setIsEmployeeAuth(true);
      localStorage.setItem('employeeUser', JSON.stringify(formattedUser));

      return { success: true };
    } catch (err) {
      console.error('Erro ao autenticar funcionário:', err);
      let errorMessage = 'Erro desconhecido ao fazer login';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (typeof err === 'string') {
        errorMessage = err;
      }
      
      // Tratar erros específicos de rede
      if (errorMessage.includes('Failed to fetch') || errorMessage.includes('fetch')) {
        errorMessage = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.';
      }
      
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      // Apenas limpar os dados locais, não é necessário fazer logout no Supabase
      setEmployeeUser(null);
      setIsEmployeeAuth(false);
      setError(null);
      localStorage.removeItem('employeeUser');
    } catch (err) {
      console.error('Erro ao fazer logout:', err);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!employeeUser || !employeeUser.permissions) return false;
    return !!employeeUser.permissions[permission as keyof typeof employeeUser.permissions];
  };

  return (
    <EmployeeAuthContext.Provider value={{
      employeeUser,
      isEmployeeAuth,
      isLoading,
      error,
      login,
      logout,
      hasPermission
    }}>
      {children}
    </EmployeeAuthContext.Provider>
  );
};