import React, { useState, useEffect } from 'react';
import { Search, Filter, Edit, Trash2, Plus, Building2, Eye, CheckCircle, XCircle, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';
import { Link } from 'react-router-dom';

interface Restaurant {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  categoria_culinaria: string;
  email: string;
  user_id: string;
  ativo: boolean;
  created_at: string;
  users: {
    email: string;
    nome_completo?: string;
  };
}

export const AdminRestaurants: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'inativo'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterLocation, setFilterLocation] = useState('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
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
    fetchRestaurants();
  }, []);

  const fetchRestaurants = async () => {
    setIsLoading(true);
    try {
      console.log('🔍 Iniciando busca de restaurantes...');
      
      // 1. Buscar todos os restaurantes
      const { data: restaurantsData, error: restaurantsError } = await supabase
        .from('restaurants')
        .select('*')
        .order('created_at', { ascending: false });

      if (restaurantsError) {
        console.error('❌ Erro ao buscar restaurantes:', restaurantsError);
        throw restaurantsError;
      }

      if (!restaurantsData || restaurantsData.length === 0) {
        console.log('⚠️ Nenhum restaurante encontrado');
        setRestaurants([]);
        setCategories([]);
        setLocations([]);
        return;
      }

      console.log('✅ Restaurantes encontrados:', restaurantsData.length);

      // 2. Buscar todos os usuários da tabela users
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email, tipo_usuario');

      if (usersError) {
        console.error('❌ Erro ao buscar usuários:', usersError);
      } else {
        console.log('✅ Usuários encontrados:', usersData?.length || 0);
      }

      // 3. Combinar dados manualmente
      const restaurantsWithEmails = restaurantsData.map(restaurant => {
        // Procurar o usuário correspondente
        const user = usersData?.find(u => u.id === restaurant.user_id);
        
        console.log(`🔍 Restaurante ${restaurant.nome} - user_id: ${restaurant.user_id} - Email encontrado: ${user?.email || 'NÃO ENCONTRADO'}`);
        
        return {
          ...restaurant,
          users: user ? { 
            email: user.email
          } : { 
            email: 'Email não encontrado'
          }
        };
      });

      console.log('✅ Restaurantes processados com emails:', restaurantsWithEmails);

      setRestaurants(restaurantsWithEmails);
      
      // Extract unique categories and locations
      const uniqueCategories = [...new Set(restaurantsData.map(r => r.categoria_culinaria).filter(Boolean))];
      const uniqueLocations = [...new Set(restaurantsData.map(r => `${r.cidade}, ${r.estado}`).filter(Boolean))];
      
      setCategories(uniqueCategories);
      setLocations(uniqueLocations);
      
    } catch (error) {
      console.error('💥 Erro geral ao carregar restaurantes:', error);
      showError('Erro ao carregar restaurantes', 'Não foi possível carregar a lista de restaurantes.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('restaurants')
        .update({ ativo: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setRestaurants(prev => 
        prev.map(restaurant => 
          restaurant.id === id 
            ? { ...restaurant, ativo: !currentStatus } 
            : restaurant
        )
      );

      showSuccess(
        currentStatus ? 'Restaurante desativado' : 'Restaurante ativado',
        `O restaurante foi ${currentStatus ? 'desativado' : 'ativado'} com sucesso.`
      );
    } catch (error) {
      console.error('Error toggling restaurant status:', error);
      showError('Erro ao alterar status', 'Não foi possível alterar o status do restaurante.');
    }
  };

  const handleDelete = (restaurant: Restaurant) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir restaurante',
      message: `Tem certeza que deseja excluir o restaurante "${restaurant.nome}"? Esta ação não pode ser desfeita e excluirá todos os dados associados.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        
        try {
          const { error } = await supabase
            .from('restaurants')
            .delete()
            .eq('id', restaurant.id);

          if (error) throw error;
          
          setRestaurants(prev => prev.filter(r => r.id !== restaurant.id));
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
          
          showSuccess('Restaurante excluído!', 'O restaurante foi removido com sucesso.');
        } catch (error) {
          console.error('Error deleting restaurant:', error);
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
          showError('Erro ao excluir restaurante', 'Não foi possível excluir o restaurante.');
        }
      },
      isLoading: false
    });
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to ascending
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filter and sort restaurants
  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = 
      restaurant.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
      restaurant.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (restaurant.users?.email && restaurant.users.email.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'ativo' && restaurant.ativo) ||
                         (filterStatus === 'inativo' && !restaurant.ativo);
    
    const matchesCategory = !filterCategory || restaurant.categoria_culinaria === filterCategory;
    
    const matchesLocation = !filterLocation || `${restaurant.cidade}, ${restaurant.estado}` === filterLocation;
    
    return matchesSearch && matchesStatus && matchesCategory && matchesLocation;
  }).sort((a, b) => {
    // Handle different field types
    if (sortField === 'nome' || sortField === 'cidade' || sortField === 'categoria_culinaria') {
      const aValue = a[sortField as keyof Restaurant] || '';
      const bValue = b[sortField as keyof Restaurant] || '';
      return sortDirection === 'asc' 
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    } else if (sortField === 'created_at') {
      const aDate = new Date(a.created_at).getTime();
      const bDate = new Date(b.created_at).getTime();
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    } else if (sortField === 'email') {
      const aEmail = a.users?.email || '';
      const bEmail = b.users?.email || '';
      return sortDirection === 'asc'
        ? aEmail.localeCompare(bEmail)
        : bEmail.localeCompare(aEmail);
    }
    return 0;
  });

  // Pagination
  const totalPages = Math.ceil(filteredRestaurants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedRestaurants = filteredRestaurants.slice(startIndex, startIndex + itemsPerPage);

  // Render sort icon
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
          <p className="text-gray-600">Carregando restaurantes...</p>
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

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gerenciar Restaurantes</h1>
          <p className="text-gray-600 mt-1">Visualize e gerencie todos os restaurantes cadastrados</p>
        </div>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Novo Restaurante</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar restaurantes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as 'all' | 'ativo' | 'inativo')}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredRestaurants.length} de {restaurants.length} restaurantes
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Categoria
            </label>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Todas as categorias</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Localização
            </label>
            <select
              value={filterLocation}
              onChange={(e) => setFilterLocation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Todas as localizações</option>
              {locations.map(location => (
                <option key={location} value={location}>{location}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Restaurants Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('nome')}
                >
                  Restaurante {renderSortIcon('nome')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('cidade')}
                >
                  Localização {renderSortIcon('cidade')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('categoria_culinaria')}
                >
                  Categoria {renderSortIcon('categoria_culinaria')}
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
              {paginatedRestaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        <Building2 className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{restaurant.nome}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{restaurant.cidade}</div>
                    <div className="text-sm text-gray-500">{restaurant.estado}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {restaurant.categoria_culinaria || 'Não informado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{restaurant.users?.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleStatus(restaurant.id, restaurant.ativo)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        restaurant.ativo
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } transition-colors`}
                    >
                      {restaurant.ativo ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(restaurant.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <Link 
                        to={`/admin/restaurants/${restaurant.id}`}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Ver detalhes"
                      >
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button 
                        onClick={() => handleToggleStatus(restaurant.id, restaurant.ativo)}
                        className={`p-2 rounded-lg transition-colors ${
                          restaurant.ativo
                            ? 'text-red-600 hover:text-red-800 hover:bg-red-50'
                            : 'text-green-600 hover:text-green-800 hover:bg-green-50'
                        }`}
                        title={restaurant.ativo ? 'Desativar' : 'Ativar'}
                      >
                        {restaurant.ativo ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => handleDelete(restaurant)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir restaurante"
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

        {filteredRestaurants.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum restaurante encontrado</h3>
            <p className="text-gray-600">Tente ajustar os filtros ou adicionar um novo restaurante.</p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredRestaurants.length)} de {filteredRestaurants.length} restaurantes
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                ))}
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
    </div>
  );
};