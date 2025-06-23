import React, { useState } from 'react';
import { Search, Filter, Edit, Trash2, Plus, Building2 } from 'lucide-react';

interface Restaurant {
  id: string;
  nome: string;
  cidade: string;
  estado: string;
  categoria: string;
  email: string;
  status: 'ativo' | 'inativo';
  created_at: string;
}

const mockRestaurants: Restaurant[] = [
  {
    id: '1',
    nome: 'Sushi House',
    cidade: 'Belo Horizonte',
    estado: 'MG',
    categoria: 'Japonesa',
    email: 'contato@sushihouse.com',
    status: 'ativo',
    created_at: '2024-01-15'
  },
  {
    id: '2',
    nome: 'Pizzaria Bella Vista',
    cidade: 'São Paulo',
    estado: 'SP',
    categoria: 'Italiana',
    email: 'pizza@bellavista.com',
    status: 'ativo',
    created_at: '2024-02-20'
  },
  {
    id: '3',
    nome: 'Burger King',
    cidade: 'Rio de Janeiro',
    estado: 'RJ',
    categoria: 'Fast Food',
    email: 'rj@burgerking.com',
    status: 'inativo',
    created_at: '2024-01-10'
  }
];

export const AdminRestaurants: React.FC = () => {
  const [restaurants, setRestaurants] = useState<Restaurant[]>(mockRestaurants);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'ativo' | 'inativo'>('all');

  const filteredRestaurants = restaurants.filter(restaurant => {
    const matchesSearch = restaurant.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.cidade.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         restaurant.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || restaurant.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este restaurante?')) {
      setRestaurants(restaurants.filter(r => r.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setRestaurants(restaurants.map(r => 
      r.id === id 
        ? { ...r, status: r.status === 'ativo' ? 'inativo' : 'ativo' }
        : r
    ));
  };

  return (
    <div className="p-6 space-y-6">
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
      </div>

      {/* Restaurants Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Restaurante
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Localização
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Categoria
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cadastro
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRestaurants.map((restaurant) => (
                <tr key={restaurant.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mr-3">
                        <Building2 className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-900">{restaurant.nome}</div>
                        <div className="text-sm text-gray-500">{restaurant.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{restaurant.cidade}</div>
                    <div className="text-sm text-gray-500">{restaurant.estado}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                      {restaurant.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => toggleStatus(restaurant.id)}
                      className={`px-2 py-1 text-xs font-medium rounded-full ${
                        restaurant.status === 'ativo'
                          ? 'bg-green-100 text-green-800 hover:bg-green-200'
                          : 'bg-red-100 text-red-800 hover:bg-red-200'
                      } transition-colors`}
                    >
                      {restaurant.status === 'ativo' ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(restaurant.created_at).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end space-x-2">
                      <button className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(restaurant.id)}
                        className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
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
      </div>

      {filteredRestaurants.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum restaurante encontrado</h3>
          <p className="text-gray-600">Tente ajustar os filtros ou adicionar um novo restaurante.</p>
        </div>
      )}
    </div>
  );
};