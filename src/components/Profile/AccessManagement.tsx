import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, EyeOff, Save, X, Users, Shield, Clock, Mail, User, Key, CheckCircle, XCircle } from 'lucide-react';
import { useRestaurant } from '../../hooks/useRestaurant';
import { useToast } from '../../hooks/useToast';
import { supabase } from '../../lib/supabase';
import { ConfirmDialog } from '../Common/ConfirmDialog';

interface UserAccess {
  id: string;
  restaurant_id: string;
  created_by: string;
  name: string;
  email: string;
  permissions: {
    sales: boolean;
    expenses: boolean;
    dre: boolean;
    profile: boolean;
  };
  active: boolean;
  last_login: string | null;
  created_at: string;
  updated_at: string;
}

interface NewAccessForm {
  name: string;
  email: string;
  password: string;
  permissions: {
    sales: boolean;
    expenses: boolean;
    dre: boolean;
    profile: boolean;
  };
}

export const AccessManagement: React.FC = () => {
  const { restaurant } = useRestaurant();
  const { showSuccess, showError } = useToast();
  
  const [accesses, setAccesses] = useState<UserAccess[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewForm, setShowNewForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const [newAccess, setNewAccess] = useState<NewAccessForm>({
    name: '',
    email: '',
    password: '',
    permissions: {
      sales: true,
      expenses: true,
      dre: false,
      profile: false
    }
  });

  const [editForm, setEditForm] = useState<Partial<UserAccess>>({});
  
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
    if (restaurant) {
      fetchAccesses();
    }
  }, [restaurant]);

  const fetchAccesses = async () => {
    if (!restaurant) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_accesses')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAccesses(data || []);
    } catch (error) {
      console.error('Error fetching accesses:', error);
      showError('Erro ao carregar acessos', 'Não foi possível carregar a lista de acessos.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateAccess = async () => {
    if (!restaurant) return;
    
    if (!newAccess.name || !newAccess.email || !newAccess.password) {
      showError('Campos obrigatórios', 'Preencha todos os campos obrigatórios.');
      return;
    }

    if (newAccess.password.length < 6) {
      showError('Senha muito curta', 'A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      // Hash da senha (em produção, usar bcrypt adequado)
      const passwordHash = btoa(newAccess.password); // Simplificado para demo
      
      const { data, error } = await supabase
        .from('user_accesses')
        .insert([{
          restaurant_id: restaurant.id,
          name: newAccess.name,
          email: newAccess.email,
          password_hash: passwordHash,
          permissions: newAccess.permissions
        }])
        .select();

      if (error) {
        if (error.code === '23505') { // Unique violation
          showError('Email já existe', 'Este email já está sendo usado por outro acesso.');
          return;
        }
        throw error;
      }

      showSuccess('Acesso criado!', `Acesso para ${newAccess.name} foi criado com sucesso.`);
      
      setNewAccess({
        name: '',
        email: '',
        password: '',
        permissions: {
          sales: true,
          expenses: true,
          dre: false,
          profile: false
        }
      });
      setShowNewForm(false);
      
      await fetchAccesses();
    } catch (error) {
      console.error('Error creating access:', error);
      showError('Erro ao criar acesso', 'Não foi possível criar o acesso.');
    }
  };

  const handleEditAccess = (access: UserAccess) => {
    setEditingId(access.id);
    setEditForm({
      name: access.name,
      email: access.email,
      permissions: access.permissions,
      active: access.active
    });
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    
    try {
      const { error } = await supabase
        .from('user_accesses')
        .update({
          name: editForm.name,
          email: editForm.email,
          permissions: editForm.permissions,
          active: editForm.active
        })
        .eq('id', editingId);

      if (error) throw error;

      showSuccess('Acesso atualizado!', 'As alterações foram salvas com sucesso.');
      setEditingId(null);
      setEditForm({});
      
      await fetchAccesses();
    } catch (error) {
      console.error('Error updating access:', error);
      showError('Erro ao atualizar acesso', 'Não foi possível salvar as alterações.');
    }
  };

  const handleDeleteAccess = (access: UserAccess) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir acesso',
      message: `Tem certeza que deseja excluir o acesso de "${access.name}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        
        try {
          const { error } = await supabase
            .from('user_accesses')
            .delete()
            .eq('id', access.id);

          if (error) throw error;
          
          await fetchAccesses();
          
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
          
          showSuccess('Acesso excluído!', `O acesso de ${access.name} foi removido.`);
        } catch (error) {
          console.error('Error deleting access:', error);
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
          showError('Erro ao excluir acesso', 'Não foi possível excluir o acesso.');
        }
      },
      isLoading: false
    });
  };

  const toggleAccessStatus = async (access: UserAccess) => {
    try {
      const { error } = await supabase
        .from('user_accesses')
        .update({ active: !access.active })
        .eq('id', access.id);

      if (error) throw error;

      showSuccess(
        access.active ? 'Acesso desativado' : 'Acesso ativado',
        `O acesso de ${access.name} foi ${access.active ? 'desativado' : 'ativado'}.`
      );
      
      await fetchAccesses();
    } catch (error) {
      console.error('Error toggling access status:', error);
      showError('Erro ao alterar status', 'Não foi possível alterar o status do acesso.');
    }
  };

  const getPermissionLabel = (key: string) => {
    const labels = {
      sales: 'Vendas',
      expenses: 'Despesas',
      dre: 'DRE',
      profile: 'Perfil'
    };
    return labels[key as keyof typeof labels] || key;
  };

  const getPermissionDescription = (key: string) => {
    const descriptions = {
      sales: 'Pode adicionar, editar e visualizar vendas',
      expenses: 'Pode adicionar, editar e visualizar despesas',
      dre: 'Pode visualizar relatórios DRE e análises',
      profile: 'Pode editar informações do restaurante'
    };
    return descriptions[key as keyof typeof descriptions] || '';
  };

  if (isLoading) {
    return (
      <div className="p-6 text-center">
        <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-600">Carregando acessos...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-orange-600" />
            Gestão de Acessos
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Crie acessos para funcionários com permissões específicas
          </p>
        </div>
        <button
          onClick={() => setShowNewForm(!showNewForm)}
          className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Acesso</span>
        </button>
      </div>

      {/* New Access Form */}
      {showNewForm && (
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200">
          <h4 className="text-md font-semibold text-gray-900 mb-4">Criar Novo Acesso</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Completo *
              </label>
              <input
                type="text"
                value={newAccess.name}
                onChange={(e) => setNewAccess(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Ex: João Silva"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={newAccess.email}
                onChange={(e) => setNewAccess(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="joao@exemplo.com"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Senha *
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newAccess.password}
                  onChange={(e) => setNewAccess(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          {/* Permissions */}
          <div className="mb-6">
            <h5 className="text-sm font-medium text-gray-700 mb-3">Permissões</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(newAccess.permissions).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-start space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNewAccess(prev => ({
                      ...prev,
                      permissions: {
                        ...prev.permissions,
                        [key]: e.target.checked
                      }
                    }))}
                    className="mt-1 rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{getPermissionLabel(key)}</div>
                    <div className="text-xs text-gray-600">{getPermissionDescription(key)}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={() => setShowNewForm(false)}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateAccess}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Criar Acesso</span>
            </button>
          </div>
        </div>
      )}

      {/* Access List */}
      <div className="space-y-4">
        {accesses.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum acesso criado</h3>
            <p className="text-gray-600">Crie acessos para seus funcionários gerenciarem dados específicos.</p>
          </div>
        ) : (
          accesses.map((access) => (
            <div key={access.id} className="bg-white p-6 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    access.active ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <User className={`w-5 h-5 ${access.active ? 'text-green-600' : 'text-gray-400'}`} />
                  </div>
                  <div>
                    {editingId === access.id ? (
                      <input
                        type="text"
                        value={editForm.name || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="font-medium text-gray-900 border border-gray-300 rounded px-2 py-1"
                      />
                    ) : (
                      <h4 className="font-medium text-gray-900">{access.name}</h4>
                    )}
                    {editingId === access.id ? (
                      <input
                        type="email"
                        value={editForm.email || ''}
                        onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                        className="text-sm text-gray-600 border border-gray-300 rounded px-2 py-1 mt-1"
                      />
                    ) : (
                      <p className="text-sm text-gray-600">{access.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    access.active 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {access.active ? 'Ativo' : 'Inativo'}
                  </span>
                  
                  {editingId === access.id ? (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditingId(null);
                          setEditForm({});
                        }}
                        className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => toggleAccessStatus(access)}
                        className={`p-2 rounded-lg transition-colors ${
                          access.active
                            ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                        }`}
                        title={access.active ? 'Desativar acesso' : 'Ativar acesso'}
                      >
                        {access.active ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleEditAccess(access)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteAccess(access)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Permissions */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2">Permissões:</h5>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(editingId === access.id ? editForm.permissions || access.permissions : access.permissions).map(([key, value]) => (
                    <div key={key}>
                      {editingId === access.id ? (
                        <label className="flex items-center space-x-2 px-3 py-1 border border-gray-300 rounded-full cursor-pointer hover:bg-gray-50">
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) => setEditForm(prev => ({
                              ...prev,
                              permissions: {
                                ...prev.permissions,
                                [key]: e.target.checked
                              }
                            }))}
                            className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                          />
                          <span className="text-xs font-medium text-gray-700">{getPermissionLabel(key)}</span>
                        </label>
                      ) : (
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          value 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {getPermissionLabel(key)}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Last Login */}
              <div className="flex items-center text-xs text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {access.last_login 
                  ? `Último acesso: ${new Date(access.last_login).toLocaleString('pt-BR')}`
                  : 'Nunca fez login'
                }
              </div>
            </div>
          ))
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Como funciona</h4>
            <ul className="text-sm text-blue-800 mt-1 space-y-1">
              <li>• <strong>Vendas:</strong> Permite adicionar e visualizar vendas</li>
              <li>• <strong>Despesas:</strong> Permite adicionar e visualizar despesas</li>
              <li>• <strong>DRE:</strong> Permite visualizar relatórios financeiros</li>
              <li>• <strong>Perfil:</strong> Permite editar informações do restaurante</li>
            </ul>
            <p className="text-xs text-blue-700 mt-2">
              💡 <strong>Dica:</strong> Funcionários usarão o mesmo sistema com login separado e acesso limitado às funcionalidades permitidas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};