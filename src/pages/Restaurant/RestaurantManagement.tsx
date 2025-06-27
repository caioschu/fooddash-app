import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Building2, 
  Plus, 
  Users, 
  Edit, 
  Trash2, 
  ArrowLeft, 
  Check, 
  X, 
  AlertTriangle,
  DollarSign,
  Calendar,
  Clock,
  MapPin,
  Info
} from 'lucide-react';
import { useRestaurantSelector } from '../../hooks/useRestaurantSelector';
import { useToast } from '../../hooks/useToast';
import { useStripe } from '../../hooks/useStripe';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';

export const RestaurantManagement: React.FC = () => {
  const { 
    restaurants, 
    groups, 
    createRestaurant, 
    createGroup, 
    addRestaurantToGroup, 
    removeRestaurantFromGroup,
    refreshData
  } = useRestaurantSelector();
  
  const { showSuccess, showError } = useToast();
  const { subscription, hasActiveSubscription } = useStripe();
  
  const [showNewRestaurantForm, setShowNewRestaurantForm] = useState(false);
  const [showNewGroupForm, setShowNewGroupForm] = useState(false);
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [selectedRestaurantForGroup, setSelectedRestaurantForGroup] = useState<string | null>(null);
  
  const [newRestaurantData, setNewRestaurantData] = useState({
    nome: '',
    cidade: '',
    estado: 'SP',
    categoria_culinaria: '',
    is_matriz: true,
    matriz_id: null as string | null
  });
  
  const [newGroupData, setNewGroupData] = useState({
    nome: '',
    descricao: ''
  });
  
  const [selectedGroupForAdd, setSelectedGroupForAdd] = useState<string | null>(null);
  
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

  const handleCreateRestaurant = async () => {
    if (!newRestaurantData.nome || !newRestaurantData.cidade || !newRestaurantData.categoria_culinaria) {
      showError('Campos obrigatórios', 'Preencha todos os campos obrigatórios.');
      return;
    }
    
    // Check if user has active subscription
    if (!hasActiveSubscription()) {
      showError('Assinatura necessária', 'Você precisa ter uma assinatura ativa para adicionar restaurantes.');
      return;
    }
    
    // Check if user already has restaurants (additional units are charged extra)
    if (restaurants.length > 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Confirmar adição de restaurante',
        message: 'Adicionar um novo restaurante terá um custo adicional de 50% do valor do seu plano atual. Deseja continuar?',
        onConfirm: async () => {
          setConfirmDialog(prev => ({ ...prev, isLoading: true }));
          
          const restaurantId = await createRestaurant(newRestaurantData);
          
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
          
          if (restaurantId) {
            setNewRestaurantData({
              nome: '',
              cidade: '',
              estado: 'SP',
              categoria_culinaria: '',
              is_matriz: true,
              matriz_id: null
            });
            setShowNewRestaurantForm(false);
          }
        },
        isLoading: false
      });
    } else {
      // First restaurant, no extra charge
      const restaurantId = await createRestaurant(newRestaurantData);
      
      if (restaurantId) {
        setNewRestaurantData({
          nome: '',
          cidade: '',
          estado: 'SP',
          categoria_culinaria: '',
          is_matriz: true,
          matriz_id: null
        });
        setShowNewRestaurantForm(false);
      }
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.nome) {
      showError('Nome obrigatório', 'Informe um nome para a rede.');
      return;
    }
    
    const groupId = await createGroup(newGroupData.nome, newGroupData.descricao);
    
    if (groupId) {
      setNewGroupData({
        nome: '',
        descricao: ''
      });
      setShowNewGroupForm(false);
    }
  };

  const handleAddToGroup = async () => {
    if (!selectedRestaurantForGroup || !selectedGroupForAdd) {
      showError('Seleção necessária', 'Selecione um restaurante e um grupo.');
      return;
    }
    
    const success = await addRestaurantToGroup(selectedRestaurantForGroup, selectedGroupForAdd);
    
    if (success) {
      setShowAddToGroupModal(false);
      setSelectedRestaurantForGroup(null);
      setSelectedGroupForAdd(null);
    }
  };

  const handleRemoveFromGroup = (restaurantId: string, groupId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Remover restaurante da rede',
      message: 'Tem certeza que deseja remover este restaurante da rede? Isso não afetará os dados do restaurante.',
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        
        const success = await removeRestaurantFromGroup(restaurantId, groupId);
        
        setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
      },
      isLoading: false
    });
  };

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText="Sim, continuar"
        cancelText="Cancelar"
        type="warning"
        isLoading={confirmDialog.isLoading}
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/profile"
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Gerenciar Restaurantes</h1>
            <p className="text-gray-600 mt-1">Administre seus restaurantes e redes</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowNewGroupForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Rede</span>
          </button>
          <button
            onClick={() => setShowNewRestaurantForm(true)}
            className="flex items-center space-x-2 bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Restaurante</span>
          </button>
        </div>
      </div>

      {/* Subscription Info */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-green-600" />
          Informações de Cobrança
        </h2>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Política de Múltiplos Restaurantes</h3>
              <p className="text-sm text-blue-700 mt-1">
                Cada restaurante adicional tem um custo de 50% do valor do seu plano base.
                Por exemplo, se seu plano custa R$ 100/mês, cada restaurante adicional custará R$ 50/mês.
              </p>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 font-medium mb-1">Plano Atual</div>
            <div className="text-lg font-bold text-gray-900">
              {subscription ? subscription.plan_name : 'Sem plano ativo'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {subscription ? (
                <span>
                  R$ {subscription.plan_price.toFixed(2)}/
                  {subscription.plan_interval === 'month' ? 'mês' : 
                   subscription.plan_interval === 'year' ? 'ano' : subscription.plan_interval}
                </span>
              ) : 'Assine um plano para continuar'}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 font-medium mb-1">Restaurantes</div>
            <div className="text-lg font-bold text-gray-900">{restaurants.length}</div>
            <div className="text-xs text-gray-500 mt-1">
              {restaurants.length > 1 ? (
                <span>
                  Custo adicional: R$ {((subscription?.plan_price || 0) * 0.5 * (restaurants.length - 1)).toFixed(2)}/
                  {subscription?.plan_interval === 'month' ? 'mês' : 
                   subscription?.plan_interval === 'year' ? 'ano' : subscription?.plan_interval || 'mês'}
                </span>
              ) : 'Sem custo adicional'}
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="text-sm text-gray-600 font-medium mb-1">Próxima Cobrança</div>
            <div className="text-lg font-bold text-gray-900">
              {subscription ? (
                `R$ ${(subscription.plan_price + (subscription.plan_price * 0.5 * (restaurants.length - 1))).toFixed(2)}`
              ) : 'N/A'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {subscription ? (
                <span>Em {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}</span>
              ) : 'Assine um plano para continuar'}
            </div>
          </div>
        </div>
      </div>

      {/* Restaurants List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Building2 className="w-5 h-5 mr-2 text-orange-600" />
          Seus Restaurantes
        </h2>
        
        {restaurants.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum restaurante encontrado</h3>
            <p className="text-gray-600 mb-4">Adicione seu primeiro restaurante para começar</p>
            <button
              onClick={() => setShowNewRestaurantForm(true)}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              Adicionar Restaurante
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {restaurants.map(restaurant => (
              <div key={restaurant.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
                    {restaurant.logo_url ? (
                      <img src={restaurant.logo_url} alt={restaurant.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Building2 className="w-5 h-5 text-orange-600" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{restaurant.nome}</h3>
                    <p className="text-xs text-gray-500">{restaurant.cidade}, {restaurant.estado}</p>
                  </div>
                </div>
                
                <div className="flex items-center text-xs text-gray-600 mb-3">
                  <MapPin className="w-3 h-3 mr-1" />
                  <span>{restaurant.categoria_culinaria}</span>
                </div>
                
                {restaurant.group_name && (
                  <div className="mb-3 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full inline-flex items-center">
                    <Users className="w-3 h-3 mr-1" />
                    <span>Rede: {restaurant.group_name}</span>
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setSelectedRestaurantForGroup(restaurant.id);
                        setShowAddToGroupModal(true);
                      }}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Adicionar à rede"
                    >
                      <Users className="w-4 h-4" />
                    </button>
                    <Link
                      to={`/profile/restaurants/edit/${restaurant.id}`}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Editar restaurante"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                  </div>
                  <Link
                    to={`/dashboard?restaurant=${restaurant.id}`}
                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                  >
                    Ver Dashboard
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Groups List */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          Suas Redes
        </h2>
        
        {groups.length === 0 ? (
          <div className="text-center py-8">
            <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma rede encontrada</h3>
            <p className="text-gray-600 mb-4">Crie uma rede para agrupar seus restaurantes</p>
            <button
              onClick={() => setShowNewGroupForm(true)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Criar Rede
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map(group => (
              <div key={group.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {group.logo_url ? (
                        <img src={group.logo_url} alt={group.nome} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{group.nome}</h3>
                      <p className="text-xs text-gray-500">{group.restaurantes.length} restaurantes</p>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Link
                      to={`/profile/restaurants/groups/edit/${group.id}`}
                      className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                      title="Editar rede"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <Link
                      to={`/dashboard?group=${group.id}`}
                      className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                      Ver Dashboard
                    </Link>
                  </div>
                </div>
                
                {/* Group Members */}
                <div className="bg-gray-50 rounded-lg p-3">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Restaurantes na rede:</h4>
                  <div className="space-y-2">
                    {group.restaurantes.length > 0 ? (
                      group.restaurantes.map(restaurant => (
                        <div key={restaurant.id} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center overflow-hidden">
                              {restaurant.logo_url ? (
                                <img src={restaurant.logo_url} alt={restaurant.nome} className="w-full h-full object-cover" />
                              ) : (
                                <Building2 className="w-3 h-3 text-orange-600" />
                              )}
                            </div>
                            <span className="text-xs text-gray-700">{restaurant.nome}</span>
                          </div>
                          <button
                            onClick={() => handleRemoveFromGroup(restaurant.id, group.id)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Remover da rede"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-gray-500 text-center py-2">
                        Nenhum restaurante nesta rede
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Restaurant Form Modal */}
      {showNewRestaurantForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Novo Restaurante</h2>
                <button
                  onClick={() => setShowNewRestaurantForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Restaurante *
                </label>
                <input
                  type="text"
                  value={newRestaurantData.nome}
                  onChange={(e) => setNewRestaurantData(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Pizzaria Bella Napoli"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cidade *
                </label>
                <input
                  type="text"
                  value={newRestaurantData.cidade}
                  onChange={(e) => setNewRestaurantData(prev => ({ ...prev, cidade: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: São Paulo"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado *
                </label>
                <select
                  value={newRestaurantData.estado}
                  onChange={(e) => setNewRestaurantData(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="AC">AC</option>
                  <option value="AL">AL</option>
                  <option value="AP">AP</option>
                  <option value="AM">AM</option>
                  <option value="BA">BA</option>
                  <option value="CE">CE</option>
                  <option value="DF">DF</option>
                  <option value="ES">ES</option>
                  <option value="GO">GO</option>
                  <option value="MA">MA</option>
                  <option value="MT">MT</option>
                  <option value="MS">MS</option>
                  <option value="MG">MG</option>
                  <option value="PA">PA</option>
                  <option value="PB">PB</option>
                  <option value="PR">PR</option>
                  <option value="PE">PE</option>
                  <option value="PI">PI</option>
                  <option value="RJ">RJ</option>
                  <option value="RN">RN</option>
                  <option value="RS">RS</option>
                  <option value="RO">RO</option>
                  <option value="RR">RR</option>
                  <option value="SC">SC</option>
                  <option value="SP">SP</option>
                  <option value="SE">SE</option>
                  <option value="TO">TO</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria Culinária *
                </label>
                <select
                  value={newRestaurantData.categoria_culinaria}
                  onChange={(e) => setNewRestaurantData(prev => ({ ...prev, categoria_culinaria: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="Açaí">Açaí</option>
                  <option value="Árabe">Árabe</option>
                  <option value="Brasileira">Brasileira</option>
                  <option value="Cafeteria">Cafeteria</option>
                  <option value="Carnes">Carnes</option>
                  <option value="Chinesa">Chinesa</option>
                  <option value="Fast Food">Fast Food</option>
                  <option value="Hambúrguer">Hambúrguer</option>
                  <option value="Italiana">Italiana</option>
                  <option value="Japonesa">Japonesa</option>
                  <option value="Lanches">Lanches</option>
                  <option value="Mexicana">Mexicana</option>
                  <option value="Pizza">Pizza</option>
                  <option value="Saudável">Saudável</option>
                  <option value="Vegetariana">Vegetariana</option>
                  <option value="Outro">Outro</option>
                </select>
              </div>
              
              {restaurants.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Unidade
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={newRestaurantData.is_matriz}
                        onChange={() => setNewRestaurantData(prev => ({ ...prev, is_matriz: true, matriz_id: null }))}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Nova matriz (independente)</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="radio"
                        checked={!newRestaurantData.is_matriz}
                        onChange={() => setNewRestaurantData(prev => ({ ...prev, is_matriz: false }))}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="text-sm text-gray-700">Filial de um restaurante existente</span>
                    </label>
                    
                    {!newRestaurantData.is_matriz && (
                      <div className="mt-2 pl-6">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Selecione a matriz
                        </label>
                        <select
                          value={newRestaurantData.matriz_id || ''}
                          onChange={(e) => setNewRestaurantData(prev => ({ ...prev, matriz_id: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
                        >
                          <option value="">Selecione um restaurante</option>
                          {restaurants.filter(r => r.is_matriz).map(restaurant => (
                            <option key={restaurant.id} value={restaurant.id}>{restaurant.nome}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Cobrança Adicional</h4>
                    <p className="text-xs text-yellow-700 mt-1">
                      Cada restaurante adicional tem um custo de 50% do valor do seu plano base.
                      {subscription && (
                        <span className="block mt-1 font-medium">
                          Valor adicional: R$ {(subscription.plan_price * 0.5).toFixed(2)}/
                          {subscription.plan_interval === 'month' ? 'mês' : 
                           subscription.plan_interval === 'year' ? 'ano' : subscription.plan_interval}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowNewRestaurantForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateRestaurant}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
              >
                Criar Restaurante
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Group Form Modal */}
      {showNewGroupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Nova Rede</h2>
                <button
                  onClick={() => setShowNewGroupForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome da Rede *
                </label>
                <input
                  type="text"
                  value={newGroupData.nome}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, nome: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ex: Grupo Gastronômico Silva"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={newGroupData.descricao}
                  onChange={(e) => setNewGroupData(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Descrição opcional da rede"
                  rows={3}
                />
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start space-x-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-blue-800">Sobre Redes</h4>
                    <p className="text-xs text-blue-700 mt-1">
                      Redes permitem agrupar seus restaurantes para visualizar dados consolidados.
                      Você pode adicionar ou remover restaurantes de uma rede a qualquer momento.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowNewGroupForm(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Criar Rede
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Group Modal */}
      {showAddToGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">Adicionar à Rede</h2>
                <button
                  onClick={() => setShowAddToGroupModal(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Restaurante Selecionado
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                  {selectedRestaurantForGroup && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {restaurants.find(r => r.id === selectedRestaurantForGroup)?.logo_url ? (
                          <img 
                            src={restaurants.find(r => r.id === selectedRestaurantForGroup)?.logo_url || ''} 
                            alt="Logo" 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <Building2 className="w-4 h-4 text-orange-600" />
                        )}
                      </div>
                      <span className="font-medium text-gray-900">
                        {restaurants.find(r => r.id === selectedRestaurantForGroup)?.nome}
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selecione a Rede *
                </label>
                <select
                  value={selectedGroupForAdd || ''}
                  onChange={(e) => setSelectedGroupForAdd(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecione uma rede</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.nome}</option>
                  ))}
                </select>
              </div>
              
              {groups.length === 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Nenhuma rede disponível</h4>
                      <p className="text-xs text-yellow-700 mt-1">
                        Você precisa criar uma rede primeiro para poder adicionar restaurantes a ela.
                      </p>
                      <button
                        onClick={() => {
                          setShowAddToGroupModal(false);
                          setShowNewGroupForm(true);
                        }}
                        className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800"
                      >
                        Criar nova rede
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => setShowAddToGroupModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddToGroup}
                disabled={!selectedGroupForAdd || groups.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Adicionar à Rede
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};