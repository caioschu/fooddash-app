import React, { useState } from 'react';
import { Building2, Plus, ChevronDown, Users, ArrowRight, Settings, Edit, Trash2 } from 'lucide-react';
import { useRestaurantSelector } from '../../hooks/useRestaurantSelector';
import { useToast } from '../../hooks/useToast';

interface RestaurantSelectorProps {
  className?: string;
}

export const RestaurantSelector: React.FC<RestaurantSelectorProps> = ({ className = '' }) => {
  const { 
    restaurants, 
    groups, 
    selectedRestaurantId, 
    selectedGroupId,
    isViewingAsGroup,
    selectRestaurant, 
    selectGroup,
    toggleViewMode
  } = useRestaurantSelector();
  
  const { showSuccess, showError } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showNewRestaurantModal, setShowNewRestaurantModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);

  const selectedRestaurant = restaurants.find(r => r.id === selectedRestaurantId);
  const selectedGroup = groups.find(g => g.id === selectedGroupId);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectRestaurant = (id: string) => {
    selectRestaurant(id);
    setIsOpen(false);
  };

  const handleSelectGroup = (id: string) => {
    selectGroup(id);
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Selected Restaurant/Group Display */}
      <button
        onClick={toggleDropdown}
        className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
          {isViewingAsGroup ? (
            selectedGroup?.logo_url ? (
              <img src={selectedGroup.logo_url} alt={selectedGroup.nome} className="w-full h-full object-cover" />
            ) : (
              <Users className="w-4 h-4 text-orange-600" />
            )
          ) : (
            selectedRestaurant?.logo_url ? (
              <img src={selectedRestaurant.logo_url} alt={selectedRestaurant.nome} className="w-full h-full object-cover" />
            ) : (
              <Building2 className="w-4 h-4 text-orange-600" />
            )
          )}
        </div>
        <div className="text-left">
          <div className="font-medium text-gray-900 text-sm truncate max-w-[150px]">
            {isViewingAsGroup 
              ? selectedGroup?.nome || 'Selecione um grupo' 
              : selectedRestaurant?.nome || 'Selecione um restaurante'}
          </div>
          <div className="text-xs text-gray-500">
            {isViewingAsGroup 
              ? `${selectedGroup?.restaurantes.length || 0} restaurantes` 
              : selectedRestaurant?.cidade ? `${selectedRestaurant.cidade}, ${selectedRestaurant.estado}` : ''}
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <div className="p-3 border-b border-gray-200">
            <h3 className="text-sm font-medium text-gray-700">Seus Restaurantes</h3>
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {/* Individual Restaurants */}
            <div className="p-2">
              {restaurants.length > 0 ? (
                restaurants.map(restaurant => (
                  <button
                    key={restaurant.id}
                    onClick={() => handleSelectRestaurant(restaurant.id)}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left ${
                      selectedRestaurantId === restaurant.id && !isViewingAsGroup
                        ? 'bg-orange-50 text-orange-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {restaurant.logo_url ? (
                        <img src={restaurant.logo_url} alt={restaurant.nome} className="w-full h-full object-cover" />
                      ) : (
                        <Building2 className="w-4 h-4 text-orange-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{restaurant.nome}</div>
                      <div className="text-xs text-gray-500">{restaurant.cidade}, {restaurant.estado}</div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center py-4 text-sm text-gray-500">
                  Nenhum restaurante encontrado
                </div>
              )}
            </div>
            
            {/* Divider */}
            {groups.length > 0 && (
              <div className="px-3 py-2 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700">Suas Redes</h3>
              </div>
            )}
            
            {/* Groups */}
            {groups.length > 0 && (
              <div className="p-2">
                {groups.map(group => (
                  <button
                    key={group.id}
                    onClick={() => handleSelectGroup(group.id)}
                    className={`w-full flex items-center space-x-3 p-2 rounded-lg text-left ${
                      selectedGroupId === group.id && isViewingAsGroup
                        ? 'bg-blue-50 text-blue-700'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                      {group.logo_url ? (
                        <img src={group.logo_url} alt={group.nome} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-4 h-4 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{group.nome}</div>
                      <div className="text-xs text-gray-500">{group.restaurantes.length} restaurantes</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            
            {/* Actions */}
            <div className="p-2 border-t border-gray-200">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowNewRestaurantModal(true);
                }}
                className="w-full flex items-center space-x-2 p-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <Plus className="w-4 h-4 text-green-600" />
                <span>Adicionar novo restaurante</span>
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  setShowNewGroupModal(true);
                }}
                className="w-full flex items-center space-x-2 p-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <Plus className="w-4 h-4 text-blue-600" />
                <span>Criar nova rede</span>
              </button>
              
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/profile/restaurants';
                }}
                className="w-full flex items-center space-x-2 p-2 text-sm text-left text-gray-700 hover:bg-gray-50 rounded-lg"
              >
                <Settings className="w-4 h-4 text-gray-600" />
                <span>Gerenciar restaurantes</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Restaurant Modal - Placeholder */}
      {showNewRestaurantModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Adicionar Novo Restaurante</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Adicionar um novo restaurante à sua conta terá um custo adicional de 50% do valor do seu plano atual.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewRestaurantModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowNewRestaurantModal(false);
                    window.location.href = '/profile/restaurants/new';
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Group Modal - Placeholder */}
      {showNewGroupModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Criar Nova Rede</h2>
            </div>
            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Crie uma rede para agrupar seus restaurantes e visualizar dados consolidados.
              </p>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowNewGroupModal(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setShowNewGroupModal(false);
                    window.location.href = '/profile/restaurants/groups/new';
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Continuar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};