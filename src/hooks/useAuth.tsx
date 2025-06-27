import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { AuthApiError } from '@supabase/supabase-js';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string; }>;
  register: (email: string, password: string, userType: User['tipo_usuario']) => Promise<{ success: boolean; error?: string; }>;
  logout: () => void;
  isLoading: boolean;
  // Aliases para compatibilidade
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, tipoUsuario?: User['tipo_usuario']) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Force logout function to handle invalid refresh tokens
  const forceLogout = async () => {
    console.log('Force logout triggered due to invalid refresh token');
    
    // Clear local state
    setUser(null);
    setError(null);
    setIsLoading(false);
    
    // Clear Supabase auth tokens from local storage
    try {
      // Remove auth tokens from localStorage
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.startsWith('sb-') && key.includes('auth-token')) {
          localStorage.removeItem(key);
        }
      });
      
      // Also try to clear session storage
      const sessionKeys = Object.keys(sessionStorage);
      sessionKeys.forEach(key => {
        if (key.startsWith('sb-') && key.includes('auth-token')) {
          sessionStorage.removeItem(key);
        }
      });
    } catch (storageError) {
      console.warn('Error clearing auth tokens from storage:', storageError);
    }
  };

  // Função auxiliar para buscar dados do usuário
  const fetchUserData = async (sessionUser: any): Promise<User> => {
    const fallbackUser: User = {
      id: sessionUser.id,
      email: sessionUser.email || '',
      tipo_usuario: 'restaurante',
      created_at: new Date().toISOString()
    };

    try {
      const { data: dbUser, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', sessionUser.id)
        .single();

      if (error) {
        console.log('User not found in database, using session data');
        return fallbackUser;
      }

      return dbUser || fallbackUser;
    } catch (error) {
      console.log('Database query failed, using session data:', error);
      return fallbackUser;
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        setError(null);
        console.log('Starting auth initialization...');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          
          // Check if the error is related to invalid refresh token
          if (sessionError.message?.includes('refresh_token_not_found') || 
              sessionError.message?.includes('Invalid Refresh Token')) {
            console.log('Invalid refresh token detected, forcing logout');
            await forceLogout();
            return;
          }
          
          if (mounted) {
            setError(sessionError.message);
            setIsLoading(false);
          }
          return;
        }
        
        if (session?.user && mounted) {
          console.log('Session found, setting user...');
          // Usar dados básicos da sessão por padrão
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            tipo_usuario: 'restaurante',
            created_at: new Date().toISOString()
          };
          setUser(userData);
        }
        
        if (mounted) {
          setIsLoading(false);
          console.log('Auth initialization completed');
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        
        // Check if the error is related to invalid refresh token
        if (error instanceof Error && 
            (error.message?.includes('refresh_token_not_found') || 
             error.message?.includes('Invalid Refresh Token'))) {
          console.log('Invalid refresh token detected in catch block, forcing logout');
          await forceLogout();
          return;
        }
        
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Unknown error');
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const authSubscription = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;

      try {
        console.log('Auth state changed:', event);

        // Handle token refresh errors
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('Token refresh failed, forcing logout');
          await forceLogout();
          return;
        }

        if (event === 'SIGNED_IN' && session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            tipo_usuario: 'restaurante',
            created_at: new Date().toISOString()
          };
          setUser(userData);
          setError(null);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setError(null);
        }
        setIsLoading(false);
      } catch (error) {
        console.error('Error in auth state change:', error);
        
        // Check if the error is related to invalid refresh token
        if (error instanceof Error && 
            (error.message?.includes('refresh_token_not_found') || 
             error.message?.includes('Invalid Refresh Token'))) {
          console.log('Invalid refresh token detected in auth state change, forcing logout');
          await forceLogout();
          return;
        }
        
        if (mounted) {
          setError(error instanceof Error ? error.message : 'Unknown error');
          setIsLoading(false);
        }
      }
    });

    return () => {
      mounted = false;
      authSubscription.data.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string; }> => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        console.error('Login error:', error);
        
        // Provide more specific error messages with actionable guidance
        if (error.message === 'Invalid login credentials') {
          return { 
            success: false, 
            error: 'Email ou senha incorretos. Verifique suas credenciais e certifique-se de que confirmou seu email.' 
          };
        } else if (error.message === 'Email not confirmed') {
          return { 
            success: false, 
            error: 'Email não confirmado. Verifique sua caixa de entrada (incluindo spam) e clique no link de confirmação.' 
          };
        } else if (error.message === 'Too many requests') {
          return { 
            success: false, 
            error: 'Muitas tentativas de login. Aguarde alguns minutos antes de tentar novamente.' 
          };
        } else if (error.message.includes('signup_disabled')) {
          return { 
            success: false, 
            error: 'Cadastros estão temporariamente desabilitados. Tente novamente mais tarde.' 
          };
        } else if (error.message.includes('email_address_invalid')) {
          return { 
            success: false, 
            error: 'Formato de email inválido. Verifique se digitou corretamente.' 
          };
        } else {
          return { 
            success: false, 
            error: error.message || 'Erro ao fazer login. Tente novamente.' 
          };
        }
      }

      return { success: !!data.user };
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        error: 'Erro inesperado ao fazer login. Verifique sua conexão e tente novamente.' 
      };
    }
  };

  const register = async (email: string, password: string, userType: User['tipo_usuario']): Promise<{ success: boolean; error?: string; }> => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
        options: {
          data: {
            tipo_usuario: userType
          }
        }
      });

      if (error) {
        console.error('Registration error:', error);
        
        // Provide more specific error messages for registration
        if (error.message.includes('User already registered')) {
          return { 
            success: false, 
            error: 'Este email já está cadastrado. Tente fazer login ou use a opção "Esqueci minha senha".' 
          };
        } else if (error.message.includes('Password should be at least')) {
          return { 
            success: false, 
            error: 'A senha deve ter pelo menos 6 caracteres.' 
          };
        } else if (error.message.includes('signup_disabled')) {
          return { 
            success: false, 
            error: 'Cadastros estão temporariamente desabilitados. Tente novamente mais tarde.' 
          };
        } else if (error.message.includes('email_address_invalid')) {
          return { 
            success: false, 
            error: 'Formato de email inválido. Verifique se digitou corretamente.' 
          };
        } else {
          return { 
            success: false, 
            error: error.message || 'Erro ao criar conta. Tente novamente.' 
          };
        }
      }

      // Tentar criar usuário na tabela users (opcional)
      if (data.user) {
        try {
          await supabase
            .from('users')
            .upsert({
              id: data.user.id,
              email: data.user.email || '',
              tipo_usuario: userType,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            });
        } catch (dbError) {
          // Não falhar o registro se a operação de banco falhar
          console.log('Failed to create user in database, but auth registration succeeded:', dbError);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        error: 'Erro inesperado ao criar conta. Verifique sua conexão e tente novamente.' 
      };
    }
  };

  const logout = async () => {
    try {
      // Check if there's an active session before attempting to sign out
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        // Only attempt to sign out if there's an active session
        await supabase.auth.signOut();
      } else {
        // No active session, user is already effectively logged out
        console.log('No active session found, user already logged out');
      }
    } catch (error) {
      // Handle specific case where session is already invalid
      if (error instanceof AuthApiError && 
          error.status === 403 && 
          error.message.includes('Session from session_id claim in JWT does not exist')) {
        console.warn('Session already invalid during logout - user is effectively logged out');
      } else if (error instanceof Error && 
                 (error.message?.includes('refresh_token_not_found') || 
                  error.message?.includes('Invalid Refresh Token'))) {
        console.warn('Invalid refresh token during logout - forcing cleanup');
        await forceLogout();
        return;
      } else {
        console.error('Error during logout:', error);
      }
    } finally {
      setUser(null);
    }
  };

  // Aliases para compatibilidade
  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    const result = await login(email, password);
    return result.success ? {} : { error: result.error };
  };

  const signUp = async (email: string, password: string, tipoUsuario: User['tipo_usuario'] = 'restaurante'): Promise<{ error?: string }> => {
    const result = await register(email, password, tipoUsuario);
    return result.success ? {} : { error: result.error };
  };

  const signOut = async (): Promise<void> => {
    await logout();
  };

  // Se houver erro, mostrar uma mensagem de erro em vez de quebrar
  if (error) {
    console.error('AuthProvider error:', error);
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h3>Erro de Autenticação</h3>
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>
          Recarregar Página
        </button>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      register, 
      logout, 
      isLoading,
      signIn,
      signUp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};