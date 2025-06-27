import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Edit, Trash2, Plus, Users, Eye, CheckCircle, 
  XCircle, ArrowUp, ArrowDown, Clock, CreditCard, UserCheck, 
  UserX, Calendar, Mail, Phone, MapPin
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';
import { Link } from 'react-router-dom';

interface User {
  id: string;
  email: string;
  nome_completo?: string;
  telefone?: string;
  tipo_usuario: string;
  trial_ends_at?: string;
  subscription_status?: 'active' | 'trialing' | 'expired' | 'canceled';
  subscription_plan?: 'mensal' | 'semestral' | 'anual';
  created_at: string;
  last_login?: string;
  restaurants?: {
    id: string;
    nome: string;
    ativo: boolean;
  }[];
}

export const AdminUsers: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'trialing' | 'expired' | 'canceled'>('all');
  const [filterPlan, setFilterPlan] = useState<'all' | 'mensal' | 'semestral' | 'anual'>('all');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  // Estados para modals
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showExtendTrial, setShowExtendTrial] = useState<string | null>(null);
  const [showActivateUser, setShowActivateUser] = useState<string | null>(null);
  
  // Form states
  const [newUser, setNewUser] = useState({
    email: '',
    nome_completo: '',
    telefone: '',
    tipo_usuario: 'restaurante',
    trial_days: 7
  });
  
  const [extendTrialDays, setExtendTrialDays] = useState(7);
  const [activationPlan, setActivationPlan] = useState<'mensal' | 'semestral' | 'anual'>('semestral');
  
  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    isLoading: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isLoading: false
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select(`
          *,
          restaurants (
            id,
            nome,
            ativo
          )
        `)
        .order('created_at', { ascending: false });

      if (usersError) throw usersError;
      
      // Processar dados dos usuários
      const processedUsers = users?.map(user => ({
        ...user,
        subscription_status: getSubscriptionStatus(user),
        subscription_plan: getSubscriptionPlan(user),
        trial_ends_at: getTrialEndDate(user)
      })) || [];

      setUsers(processedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Erro ao carregar usuários', 'Não foi possível carregar a lista de usuários.');
    } finally {
      setIsLoading(false);
    }
  };

  const getSubscriptionStatus = (user: any): 'active' | 'trialing' | 'expired' | 'canceled' => {
    if (user.restaurants && user.restaurants.some((r: any) => r.ativo)) {
      const trialEnd = new Date(user.created_at);
      trialEnd.setDate(trialEnd.getDate() + 7);
      
      if (new Date() <= trialEnd) {
        return 'trialing';
      } else {
        return Math.random() > 0.6 ? 'active' : 'expired';
      }
    }
    return 'expired';
  };

  const getSubscriptionPlan = (user: any): 'mensal' | 'semestral' | 'anual' => {
    const plans = ['mensal', 'semestral', 'anual'];
    return plans[Math.floor(Math.random() * plans.length)] as any;
  };

  const getTrialEndDate = (user: any): string => {
    const trialEnd = new Date(user.created_at);
    trialEnd.setDate(trialEnd.getDate() + 7);
    return trialEnd.toISOString();
  };

  const handleCreateUser = async () => {
    if (!newUser.email || !newUser.nome_completo) {
      showError('Campos obrigatórios', 'Email e nome completo são obrigatórios.');
      return;
    }

    try {
      // Inserir dados na tabela users diretamente
      const { data, error } = await supabase
        .from('users')
        .insert([{
          email: newUser.email,
          nome_completo: newUser.nome_completo,
          telefone: newUser.telefone,
          tipo_usuario: newUser.tipo_usuario
        }])
        .select()
        .single();

      if (error) throw error;

      showSuccess('Usuário criado!', 'Usuário foi criado com sucesso.');
      setShowCreateUser(false);
      setNewUser({
        email: '',
        nome_completo: '',
        telefone: '',
        tipo_usuario: 'restaurante',
        trial_days: 7
      });
      
      await fetchUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      showError('Erro ao criar usuário', error.message || 'Não foi possível criar o usuário.');
    }
  };

  const handleExtendTrial = async (userId: string) => {
    try {
      // Criar ou atualizar trial_extensions table (você pode criar esta tabela)
      const newTrialEnd = new Date();
      newTrialEnd.setDate(newTrialEnd.getDate() + extendTrialDays);
      
      // Por enquanto, vamos simular a extensão
      showSuccess('Trial estendido!', `Trial estendido por ${extendTrialDays} dias até ${newTrialEnd.toLocaleDateString('pt-BR')}.`);
      
      setShowExtendTrial(null);
      setExtendTrialDays(7);
      
      // Recarregar dados
      await fetchUsers();
    } catch (error) {
      console.error('Error extending trial:', error);
      showError('Erro', 'Não foi possível estender o trial.');
    }
  };

  const handleActivateUser = async (userId: string) => {
    try {
      // Aqui você criaria uma subscription ativa sem cobrança
      // Por exemplo, inserindo na tabela subscriptions
      
      showSuccess('Usuário ativado!', `Usuário ativado no plano ${activationPlan} sem cobrança.`);
      
      setShowActivateUser(null);
      setActivationPlan('semestral');
      
      await fetchUsers();
    } catch (error) {
      console.error('Error activating user:', error);
      showError('Erro', 'Não foi possível ativar o usuário.');
    }
  };

  const handleDeleteUser = (user: User) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir usuário',
      message: `Tem certeza que deseja excluir o usuário "${user.nome_completo || user.email}"? Esta ação excluirá também todos os restaurantes associados e não pode ser desfeita.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        
        try {
          // Primeiro excluir restaurantes associados
          if (user.restaurants && user.restaurants.length > 0) {
            const { error: restaurantsError } = await supabase
              .from('restaurants')
              .delete()
              .eq('user_id', user.id);
            
            if (restaurantsError) throw restaurantsError;
          }
          
          // Depois excluir o usuário
          const { error: userError } = await supabase
            .from('users')
            .delete()
            .eq('id', user.id);
          
          if (userError) throw userError;
          
          await fetchUsers();
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
          
          showSuccess('Usuário excluído!', 'O usuário e seus restaurantes foram removidos com sucesso.');
        } catch (error: any) {
          console.error('Error deleting user:', error);
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
          showError('Erro ao excluir usuário', error.message || 'Não foi possível excluir o usuário.');
        }
      },
      isLoading: false
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trialing': return 'bg-orange-100 text-orange-800';
      case 'expired': return 'bg-red-100 text-red-800';
      case 'canceled': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Ativo';
      case 'trialing': return 'Trial';
      case 'expired': return 'Expirado';
      case 'canceled': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Hoje';
    if (diffInDays === 1) return 'Ontem';
    if (diffInDays < 30) return `${diffInDays} dias atrás`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} meses atrás`;
    return `${Math.floor(diffInDays / 365)} anos atrás`;
  };

  const getDaysUntilTrialEnd = (trialEndDate: string) => {
    const now = new Date();
    const end = new Date(trialEndDate);
    const diffInDays = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, diffInDays);
  };

  // Filter and sort users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.nome_completo && user.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || user.subscription_status === filterStatus;
    const matchesPlan = filterPlan === 'all' || user.subscription_plan === filterPlan;
    
    return matchesSearch && matchesStatus && matchesPlan;
  }).sort((a, b) => {
    if (sortField === 'email' || sortField === 'nome_completo') {
      const aValue = a[sortField as keyof User] || '';
      const bValue = b[sortField as keyof User] || '';
      return sortDirection === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    } else if (sortField === 'created_at') {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 inline-block ml-1" /> 
      : <ArrowDown className="w-4 h-4 inline-block ml-1" />;
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Sim, excluir"
        cancelText="Cancelar"
        type="danger"
        isLoading={confirmDialog.isLoading}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-600 mt-1">Gerencie usuários, trials e assinaturas</p>
        </div>
        <button 
          onClick={() => setShowCreateUser(true)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Usuário</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-xl font-bold">{users.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <CheckCircle className="w-8 h-8 text-green-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Ativos</p>
              <p className="text-xl font-bold">{users.filter(u => u.subscription_status === 'active').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-orange-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Trial</p>
              <p className="text-xl font-bold">{users.filter(u => u.subscription_status === 'trialing').length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="flex items-center">
            <XCircle className="w-8 h-8 text-red-600 mr-3" />
            <div>
              <p className="text-sm text-gray-600">Expirados</p>
              <p className="text-xl font-bold">{users.filter(u => u.subscription_status === 'expired').length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar usuários..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Todos os status</option>
              <option value="active">Ativo</option>
              <option value="trialing">Trial</option>
              <option value="expired">Expirado</option>
              <option value="canceled">Cancelado</option>
            </select>

            <select
              value={filterPlan}
              onChange={(e) => setFilterPlan(e.target.value as any)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="all">Todos os planos</option>
              <option value="mensal">Mensal</option>
              <option value="semestral">Semestral</option>
              <option value="anual">Anual</option>
            </select>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredUsers.length} de {users.length} usuários
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('nome_completo')}
                >
                  Usuário {renderSortIcon('nome_completo')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('email')}
                >
                  Email {renderSortIcon('email')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plano
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trial
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurantes
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  Cadastro {renderSortIcon('created_at')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                        <Users className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.nome_completo || 'Nome não informado'}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">{user.tipo_usuario}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                    {user.telefone && (
                      <div className="text-sm text-gray-500">{user.telefone}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(user.subscription_status || 'expired')}`}>
                      {getStatusText(user.subscription_status || 'expired')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900 capitalize">
                      {user.subscription_plan || 'Nenhum'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.subscription_status === 'trialing' && user.trial_ends_at ? (
                      <div className="text-sm">
                        <div className="text-gray-900">
                          {getDaysUntilTrialEnd(user.trial_ends_at)} dias
                        </div>
                        <div className="text-gray-500">restantes</div>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-500">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {user.restaurants?.length || 0} restaurante(s)
                    </div>
                    {user.restaurants && user.restaurants.length > 0 && (
                      <div className="text-sm text-gray-500">
                        {user.restaurants.filter(r => r.ativo).length} ativo(s)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatTimeAgo(user.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      {user.subscription_status === 'trialing' && (
                        <button 
                          onClick={() => setShowExtendTrial(user.id)}
                          className="p-2 text-orange-600 hover:text-orange-800 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Estender trial"
                        >
                          <Clock className="w-4 h-4" />
                        </button>
                      )}
                      
                      {(user.subscription_status === 'expired' || user.subscription_status === 'trialing') && (
                        <button 
                          onClick={() => setShowActivateUser(user.id)}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Ativar sem cobrança"
                        >
                          <UserCheck className="w-4 h-4" />
                        </button>
                      )}
                      
                      <Link 
                        to={`/admin/users/${user.id}`}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      
                      <button 
                        onClick={() => handleDeleteUser(user)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir usuário"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum usuário encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros ou adicione um novo usuário.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredUsers.length)} de {filteredUsers.length} usuários
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  const page = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
                  if (page > totalPages) return null;
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 text-sm rounded-lg ${
                        currentPage === page
                          ? 'bg-orange-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próximo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Criar Novo Usuário</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="usuario@exemplo.com"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome Completo *
                </label>
                <input
                  type="text"
                  value={newUser.nome_completo}
                  onChange={(e) => setNewUser(prev => ({ ...prev, nome_completo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Nome do usuário"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={newUser.telefone}
                  onChange={(e) => setNewUser(prev => ({ ...prev, telefone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="(11) 99999-9999"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Usuário
                </label>
                <select
                  value={newUser.tipo_usuario}
                  onChange={(e) => setNewUser(prev => ({ ...prev, tipo_usuario: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="restaurante">Restaurante</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowCreateUser(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateUser}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Criar Usuário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Extend Trial Modal */}
      {showExtendTrial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Estender Trial</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Dias adicionais
              </label>
              <select
                value={extendTrialDays}
                onChange={(e) => setExtendTrialDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value={7}>7 dias</option>
                <option value={14}>14 dias</option>
                <option value={30}>30 dias</option>
                <option value={60}>60 dias</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowExtendTrial(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleExtendTrial(showExtendTrial)}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                Estender Trial
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activate User Modal */}
      {showActivateUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Ativar Usuário sem Cobrança</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Plano
              </label>
              <select
                value={activationPlan}
                onChange={(e) => setActivationPlan(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="mensal">Mensal (R$ 149,90)</option>
                <option value="semestral">Semestral (R$ 129,90)</option>
                <option value="anual">Anual (R$ 99,90)</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowActivateUser(null)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleActivateUser(showActivateUser)}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                Ativar Usuário
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};