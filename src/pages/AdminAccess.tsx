import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { Save, Edit, RefreshCw as Refresh, Check, AlertTriangle, Shield, Users, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const AdminAccess: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [email, setEmail] = useState('');
  const [isPromoting, setIsPromoting] = useState(false);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      console.log('Checking admin status for user:', user.email);
      checkAdminStatus();
      fetchAdminUsers();
    }
  }, [user]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      console.log('Checking if user is admin...');
      // First check if user is already admin
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('tipo_usuario')
        .eq('id', user.id)
        .single();
      
      if (userError) {
        console.error('Error checking user type:', userError);
        throw userError;
      }
      
      console.log('User type from database:', userData.tipo_usuario);
      if (userData.tipo_usuario === 'admin') {
        setIsAdmin(true);
        setMessage({ type: 'success', text: 'Você tem acesso de administrador.' });
      } else {
        setMessage({ type: 'error', text: 'Você não tem permissão para acessar esta página.' });
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
      setMessage({ type: 'error', text: 'Erro ao verificar status de administrador.' });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAdminUsers = async () => {
    try {
      console.log('Fetching admin users...');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('tipo_usuario', 'admin')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin users:', error);
        throw error;
      }
      console.log('Found admin users:', data?.length || 0);
      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
    }
  };

  const promoteToAdmin = async () => {
    if (!email) {
      setMessage({ type: 'error', text: 'Por favor, informe um email válido.' });
      return;
    }

    setIsPromoting(true);
    try {
      console.log('Promoting user to admin:', email);
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
      
      setMessage({ type: 'success', text: `Usuário ${email} foi promovido a administrador com sucesso!` });
      setEmail('');
      fetchAdminUsers(); // Refresh the list
    } catch (error) {
      console.error('Error promoting user:', error);
      setMessage({ type: 'error', text: `Erro ao promover usuário: ${error.message}` });
    } finally {
      setIsPromoting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando acesso de administrador...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="p-6 flex items-center justify-center min-h-screen">
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
    );
  }

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
              <Shield className="w-7 h-7 mr-3 text-orange-600" />
              Gerenciamento de Administradores
            </h1>
            <p className="text-gray-600 mt-1">Gerencie permissões de administrador do sistema</p>
          </div>
        </div>
        <button
          onClick={fetchAdminUsers}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Refresh className="w-4 h-4" />
          <span>Atualizar Lista</span>
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-lg ${
          message.type === 'success' ? 'bg-green-100 text-green-800 border border-green-200' :
          message.type === 'error' ? 'bg-red-100 text-red-800 border border-red-200' :
          'bg-blue-100 text-blue-800 border border-blue-200'
        }`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' && <Check className="w-5 h-5" />}
            {message.type === 'error' && <AlertTriangle className="w-5 h-5" />}
            {message.type === 'info' && <Refresh className="w-5 h-5" />}
            <span>{message.text}</span>
          </div>
        </div>
      )}

      {/* Admin Tools */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Novo Administrador</h2>
        <div className="grid grid-cols-1 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-900 mb-2">Promover Usuário</h3>
            <p className="text-sm text-gray-600 mb-4">Conceda acesso de administrador a um usuário existente.</p>
            <div className="flex items-center space-x-2">
              <input
                type="email"
                placeholder="Email do usuário"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
              <button
                onClick={promoteToAdmin}
                disabled={isPromoting || !email}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {isPromoting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Conceder Acesso</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Admins */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Administradores Atuais</h2>
        
        {adminUsers.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum administrador encontrado</h3>
            <p className="text-gray-600">Promova um usuário para começar.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data de Criação</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminUsers.map((admin) => (
                  <tr key={admin.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-orange-100 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-orange-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{admin.email}</div>
                          <div className="text-sm text-gray-500">ID: {admin.id.substring(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(admin.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Ativo
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Links */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Páginas Administrativas</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            to="/admin" 
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <h3 className="font-medium text-gray-900 mb-1">Dashboard Admin</h3>
            <p className="text-sm text-gray-600">Visão geral do sistema</p>
          </Link>
          
          <Link 
            to="/admin/restaurants" 
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <h3 className="font-medium text-gray-900 mb-1">Gerenciar Restaurantes</h3>
            <p className="text-sm text-gray-600">Visualizar e editar restaurantes</p>
          </Link>
          
          <Link 
            to="/admin/benchmarking" 
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <h3 className="font-medium text-gray-900 mb-1">Dados de Benchmarking</h3>
            <p className="text-sm text-gray-600">Gerenciar dados comparativos</p>
          </Link>
          
          <Link 
            to="/admin/categories" 
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <h3 className="font-medium text-gray-900 mb-1">Categorias</h3>
            <p className="text-sm text-gray-600">Gerenciar categorias de despesas</p>
          </Link>
          
          <Link 
            to="/admin-promote" 
            className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:bg-gray-100 transition-colors"
          >
            <h3 className="font-medium text-gray-900 mb-1">Promover Admin</h3>
            <p className="text-sm text-gray-600">Promover usuários a administrador</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminAccess;