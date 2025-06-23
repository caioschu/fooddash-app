import React, { useState, useEffect } from 'react';
import { AlertTriangle, Check, Shield, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const AdminPromote: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    // Check if user is admin
    if (user) {
      console.log('Current user type:', user.tipo_usuario);
      if (user.tipo_usuario === 'admin') {
        setIsAdmin(true);
      } else {
        setMessage({ 
          type: 'error', 
          text: 'Você não tem permissão para acessar esta página.' 
        });
      }
    }
  }, [user]);

  const handlePromote = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setMessage({ type: 'error', text: 'Por favor, informe um email válido.' });
      return;
    }

    setIsLoading(true);
    try {
      console.log('Attempting to promote user:', email);
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/make-admin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email }),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);
      
      if (!response.ok) {
        throw new Error(result.error || 'Erro ao promover usuário');
      }
      
      setMessage({ 
        type: 'success', 
        text: `Usuário ${email} foi promovido a administrador com sucesso!` 
      });
      setEmail('');
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      setMessage({ 
        type: 'error', 
        text: `Erro ao promover usuário: ${error.message}` 
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">Você precisa estar logado para acessar esta página.</p>
            <Link 
              to="/auth" 
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Fazer Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-4">Você não tem permissão para acessar esta página.</p>
            <Link 
              to="/dashboard" 
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Voltar para Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center justify-center flex-1">
            <Shield className="w-10 h-10 text-orange-600" />
          </div>
          <div className="w-7"></div> {/* Spacer for balance */}
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Promover Usuário a Admin</h1>
        <p className="text-gray-600 text-center mb-6">Esta página permite promover qualquer usuário a administrador</p>
        
        {message && (
          <div className={`p-4 rounded-lg mb-6 ${
            message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
            'bg-red-100 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center space-x-2">
              {message.type === 'success' ? 
                <Check className="w-5 h-5" /> : 
                <AlertTriangle className="w-5 h-5" />
              }
              <span>{message.text}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handlePromote} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email do Usuário
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="usuario@exemplo.com"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={isLoading || !email}
            className="w-full bg-orange-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-orange-700 focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? 'Processando...' : 'Promover a Administrador'}
          </button>
        </form>
        
        <div className="mt-6 text-sm text-gray-600">
          <p className="mb-2">
            <strong>Importante:</strong> Esta ação concede acesso administrativo completo ao usuário.
          </p>
          <p>
            Administradores podem gerenciar todos os dados do sistema, incluindo restaurantes, benchmarking e categorias.
          </p>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 flex justify-between">
          <Link to="/admin" className="text-orange-600 hover:text-orange-700 font-medium">
            Dashboard Admin
          </Link>
          <Link to="/admin-access" className="text-orange-600 hover:text-orange-700 font-medium">
            Gerenciar Admins
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminPromote;