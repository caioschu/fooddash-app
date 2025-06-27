import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  Save, 
  Edit, 
  Trash2, 
  Plus, 
  Settings, 
  Calculator, 
  DollarSign, 
  Percent, 
  Check, 
  X, 
  Info, 
  RefreshCw, 
  BarChart3, 
  TrendingUp, 
  Users 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';

interface ValuationMultiple {
  id: string;
  businessType: 'delivery' | 'salao' | 'hibrido' | 'franquia';
  minMultiple: number;
  maxMultiple: number;
  defaultMultiple: number;
  description: string;
}

interface ValuationFactor {
  id: string;
  name: string;
  type: 'positive' | 'negative' | 'neutral';
  impactPercentage: number;
  description: string;
  active: boolean;
}

export const AdminValuationSettings: React.FC = () => {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();
  
  const [isLoading, setIsLoading] = useState(true);
  const [multiples, setMultiples] = useState<ValuationMultiple[]>([
    {
      id: '1',
      businessType: 'delivery',
      minMultiple: 3,
      maxMultiple: 5,
      defaultMultiple: 4,
      description: 'Restaurantes focados em delivery'
    },
    {
      id: '2',
      businessType: 'salao',
      minMultiple: 4,
      maxMultiple: 7,
      defaultMultiple: 5.5,
      description: 'Restaurantes com salão físico'
    },
    {
      id: '3',
      businessType: 'hibrido',
      minMultiple: 4.5,
      maxMultiple: 8,
      defaultMultiple: 6,
      description: 'Restaurantes com modelo híbrido (salão + delivery)'
    },
    {
      id: '4',
      businessType: 'franquia',
      minMultiple: 6,
      maxMultiple: 10,
      defaultMultiple: 8,
      description: 'Restaurantes com modelo de franquia'
    }
  ]);
  
  const [factors, setFactors] = useState<ValuationFactor[]>([
    {
      id: '1',
      name: 'Dependência do dono',
      type: 'negative',
      impactPercentage: 15,
      description: 'Negócio depende fortemente do dono para operar',
      active: true
    },
    {
      id: '2',
      name: 'Processos documentados',
      type: 'positive',
      impactPercentage: 10,
      description: 'Negócio possui processos bem documentados',
      active: true
    },
    {
      id: '3',
      name: 'Ponto próprio',
      type: 'positive',
      impactPercentage: 15,
      description: 'Negócio possui ponto próprio',
      active: true
    },
    {
      id: '4',
      name: 'Negócio recente',
      type: 'negative',
      impactPercentage: 15,
      description: 'Negócio com menos de 2 anos de operação',
      active: true
    },
    {
      id: '5',
      name: 'Margem acima do mercado',
      type: 'positive',
      impactPercentage: 15,
      description: 'Margem líquida acima da média do setor (>15%)',
      active: true
    },
    {
      id: '6',
      name: 'Dependência de canal',
      type: 'negative',
      impactPercentage: 10,
      description: 'Mais de 70% das vendas vêm de um único canal',
      active: true
    }
  ]);
  
  const [editingMultipleId, setEditingMultipleId] = useState<string | null>(null);
  const [editingFactorId, setEditingFactorId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [newFactor, setNewFactor] = useState<Omit<ValuationFactor, 'id'>>({
    name: '',
    type: 'positive',
    impactPercentage: 10,
    description: '',
    active: true
  });
  const [showNewFactorForm, setShowNewFactorForm] = useState(false);
  
  // Configurações globais
  const [settings, setSettings] = useState({
    defaultDiscountRate: 18,
    defaultTerminalGrowthRate: 3,
    useRealData: true
  });

  useEffect(() => {
    // Em um ambiente real, você buscaria esses dados do backend
    // Aqui estamos apenas simulando o carregamento
    setTimeout(() => {
      setIsLoading(false);
    }, 500);
  }, []);

  const handleEditMultiple = (multiple: ValuationMultiple) => {
    setEditingMultipleId(multiple.id);
    setEditForm({
      businessType: multiple.businessType,
      minMultiple: multiple.minMultiple,
      maxMultiple: multiple.maxMultiple,
      defaultMultiple: multiple.defaultMultiple,
      description: multiple.description
    });
  };

  const handleSaveMultiple = () => {
    if (!editingMultipleId) return;
    
    // Validar dados
    if (editForm.minMultiple > editForm.maxMultiple) {
      showError('Erro de validação', 'O múltiplo mínimo não pode ser maior que o máximo.');
      return;
    }
    
    if (editForm.defaultMultiple < editForm.minMultiple || editForm.defaultMultiple > editForm.maxMultiple) {
      showError('Erro de validação', 'O múltiplo padrão deve estar entre o mínimo e o máximo.');
      return;
    }
    
    // Atualizar múltiplo
    setMultiples(prev => 
      prev.map(m => 
        m.id === editingMultipleId 
          ? { 
              ...m, 
              minMultiple: parseFloat(editForm.minMultiple),
              maxMultiple: parseFloat(editForm.maxMultiple),
              defaultMultiple: parseFloat(editForm.defaultMultiple),
              description: editForm.description
            } 
          : m
      )
    );
    
    setEditingMultipleId(null);
    setEditForm({});
    showSuccess('Múltiplo atualizado!', 'As alterações foram salvas com sucesso.');
  };

  const handleEditFactor = (factor: ValuationFactor) => {
    setEditingFactorId(factor.id);
    setEditForm({
      name: factor.name,
      type: factor.type,
      impactPercentage: factor.impactPercentage,
      description: factor.description,
      active: factor.active
    });
  };

  const handleSaveFactor = () => {
    if (!editingFactorId) return;
    
    // Validar dados
    if (!editForm.name || !editForm.description) {
      showError('Erro de validação', 'Nome e descrição são obrigatórios.');
      return;
    }
    
    if (editForm.impactPercentage <= 0 || editForm.impactPercentage > 50) {
      showError('Erro de validação', 'O impacto percentual deve estar entre 1% e 50%.');
      return;
    }
    
    // Atualizar fator
    setFactors(prev => 
      prev.map(f => 
        f.id === editingFactorId 
          ? { 
              ...f, 
              name: editForm.name,
              type: editForm.type,
              impactPercentage: parseFloat(editForm.impactPercentage),
              description: editForm.description,
              active: editForm.active
            } 
          : f
      )
    );
    
    setEditingFactorId(null);
    setEditForm({});
    showSuccess('Fator atualizado!', 'As alterações foram salvas com sucesso.');
  };

  const handleDeleteFactor = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este fator?')) {
      setFactors(prev => prev.filter(f => f.id !== id));
      showSuccess('Fator excluído!', 'O fator foi removido com sucesso.');
    }
  };

  const handleAddFactor = () => {
    // Validar dados
    if (!newFactor.name || !newFactor.description) {
      showError('Erro de validação', 'Nome e descrição são obrigatórios.');
      return;
    }
    
    if (newFactor.impactPercentage <= 0 || newFactor.impactPercentage > 50) {
      showError('Erro de validação', 'O impacto percentual deve estar entre 1% e 50%.');
      return;
    }
    
    // Adicionar novo fator
    const newId = (factors.length + 1).toString();
    setFactors(prev => [...prev, { ...newFactor, id: newId }]);
    
    // Resetar formulário
    setNewFactor({
      name: '',
      type: 'positive',
      impactPercentage: 10,
      description: '',
      active: true
    });
    
    setShowNewFactorForm(false);
    showSuccess('Fator adicionado!', 'O novo fator foi adicionado com sucesso.');
  };

  const handleSaveSettings = () => {
    // Validar dados
    if (settings.defaultDiscountRate <= 0 || settings.defaultDiscountRate > 50) {
      showError('Erro de validação', 'A taxa de desconto padrão deve estar entre 1% e 50%.');
      return;
    }
    
    if (settings.defaultTerminalGrowthRate <= 0 || settings.defaultTerminalGrowthRate > 10) {
      showError('Erro de validação', 'A taxa de crescimento terminal deve estar entre 1% e 10%.');
      return;
    }
    
    // Em um ambiente real, você salvaria essas configurações no backend
    showSuccess('Configurações salvas!', 'As configurações foram atualizadas com sucesso.');
  };

  const handleToggleFactorStatus = (id: string, currentStatus: boolean) => {
    setFactors(prev => 
      prev.map(f => 
        f.id === id 
          ? { ...f, active: !currentStatus } 
          : f
      )
    );
    
    showSuccess(
      currentStatus ? 'Fator desativado!' : 'Fator ativado!',
      `O fator foi ${currentStatus ? 'desativado' : 'ativado'} com sucesso.`
    );
  };

  const handleRecalculateDefaults = () => {
    if (confirm('Tem certeza que deseja redefinir todos os valores para os padrões?')) {
      // Redefinir múltiplos
      setMultiples([
        {
          id: '1',
          businessType: 'delivery',
          minMultiple: 3,
          maxMultiple: 5,
          defaultMultiple: 4,
          description: 'Restaurantes focados em delivery'
        },
        {
          id: '2',
          businessType: 'salao',
          minMultiple: 4,
          maxMultiple: 7,
          defaultMultiple: 5.5,
          description: 'Restaurantes com salão físico'
        },
        {
          id: '3',
          businessType: 'hibrido',
          minMultiple: 4.5,
          maxMultiple: 8,
          defaultMultiple: 6,
          description: 'Restaurantes com modelo híbrido (salão + delivery)'
        },
        {
          id: '4',
          businessType: 'franquia',
          minMultiple: 6,
          maxMultiple: 10,
          defaultMultiple: 8,
          description: 'Restaurantes com modelo de franquia'
        }
      ]);
      
      // Redefinir fatores
      setFactors([
        {
          id: '1',
          name: 'Dependência do dono',
          type: 'negative',
          impactPercentage: 15,
          description: 'Negócio depende fortemente do dono para operar',
          active: true
        },
        {
          id: '2',
          name: 'Processos documentados',
          type: 'positive',
          impactPercentage: 10,
          description: 'Negócio possui processos bem documentados',
          active: true
        },
        {
          id: '3',
          name: 'Ponto próprio',
          type: 'positive',
          impactPercentage: 15,
          description: 'Negócio possui ponto próprio',
          active: true
        },
        {
          id: '4',
          name: 'Negócio recente',
          type: 'negative',
          impactPercentage: 15,
          description: 'Negócio com menos de 2 anos de operação',
          active: true
        },
        {
          id: '5',
          name: 'Margem acima do mercado',
          type: 'positive',
          impactPercentage: 15,
          description: 'Margem líquida acima da média do setor (>15%)',
          active: true
        },
        {
          id: '6',
          name: 'Dependência de canal',
          type: 'negative',
          impactPercentage: 10,
          description: 'Mais de 70% das vendas vêm de um único canal',
          active: true
        }
      ]);
      
      // Redefinir configurações
      setSettings({
        defaultDiscountRate: 18,
        defaultTerminalGrowthRate: 3,
        useRealData: true
      });
      
      showSuccess('Valores redefinidos!', 'Todos os valores foram redefinidos para os padrões.');
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando configurações...</p>
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
              <Calculator className="w-7 h-7 mr-3 text-orange-600" />
              Configurações de Valuation
            </h1>
            <p className="text-gray-600 mt-1">
              Gerencie múltiplos, fatores de ajuste e configurações da calculadora
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRecalculateDefaults}
            className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Redefinir Padrões</span>
          </button>
        </div>
      </div>

      {/* Configurações Globais */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Settings className="w-5 h-5 mr-2 text-gray-600" />
          Configurações Globais
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taxa de Desconto Padrão (%)
            </label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={settings.defaultDiscountRate}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultDiscountRate: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                step="0.5"
                min="1"
                max="50"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Taxa usada para descontar fluxos futuros
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Taxa de Crescimento Terminal (%)
            </label>
            <div className="relative">
              <TrendingUp className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="number"
                value={settings.defaultTerminalGrowthRate}
                onChange={(e) => setSettings(prev => ({ ...prev, defaultTerminalGrowthRate: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                step="0.5"
                min="1"
                max="10"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Taxa de crescimento perpétuo para valor terminal
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Usar Dados Reais
            </label>
            <div className="flex items-center mt-2">
              <button
                onClick={() => setSettings(prev => ({ ...prev, useRealData: !prev.useRealData }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.useRealData ? 'bg-green-600' : 'bg-gray-200'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.useRealData ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
              <span className="ml-2 text-sm text-gray-700">
                {settings.useRealData ? 'Usando dados reais' : 'Usando dados simulados'}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Quando ativado, usa dados reais do restaurante para cálculos
            </p>
          </div>
        </div>
        
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </div>

      {/* Múltiplos de Mercado */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <DollarSign className="w-5 h-5 mr-2 text-gray-600" />
          Múltiplos de Mercado
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo de Negócio</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Múltiplo Mínimo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Múltiplo Padrão</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Múltiplo Máximo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {multiples.map((multiple) => (
                <tr key={multiple.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingMultipleId === multiple.id ? (
                      <select
                        value={editForm.businessType}
                        onChange={(e) => setEditForm(prev => ({ ...prev, businessType: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        disabled
                      >
                        <option value="delivery">Delivery</option>
                        <option value="salao">Salão</option>
                        <option value="hibrido">Híbrido</option>
                        <option value="franquia">Franquia</option>
                      </select>
                    ) : (
                      <span className="text-sm font-medium text-gray-900">
                        {multiple.businessType === 'delivery' ? 'Delivery' :
                         multiple.businessType === 'salao' ? 'Salão' :
                         multiple.businessType === 'hibrido' ? 'Híbrido' : 'Franquia'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingMultipleId === multiple.id ? (
                      <input
                        type="number"
                        value={editForm.minMultiple}
                        onChange={(e) => setEditForm(prev => ({ ...prev, minMultiple: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        step="0.1"
                        min="1"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{multiple.minMultiple}x</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingMultipleId === multiple.id ? (
                      <input
                        type="number"
                        value={editForm.defaultMultiple}
                        onChange={(e) => setEditForm(prev => ({ ...prev, defaultMultiple: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        step="0.1"
                        min="1"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{multiple.defaultMultiple}x</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingMultipleId === multiple.id ? (
                      <input
                        type="number"
                        value={editForm.maxMultiple}
                        onChange={(e) => setEditForm(prev => ({ ...prev, maxMultiple: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        step="0.1"
                        min="1"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{multiple.maxMultiple}x</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingMultipleId === multiple.id ? (
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">{multiple.description}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingMultipleId === multiple.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={handleSaveMultiple}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Salvar alterações"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingMultipleId(null);
                            setEditForm({});
                          }}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditMultiple(multiple)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar múltiplo"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fatores de Ajuste */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2 text-gray-600" />
            Fatores de Ajuste
          </h2>
          <button
            onClick={() => setShowNewFactorForm(!showNewFactorForm)}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            {showNewFactorForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            <span>{showNewFactorForm ? 'Cancelar' : 'Novo Fator'}</span>
          </button>
        </div>
        
        {showNewFactorForm && (
          <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <h3 className="text-sm font-medium text-orange-800 mb-3">Adicionar Novo Fator</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome do Fator *
                </label>
                <input
                  type="text"
                  value={newFactor.name}
                  onChange={(e) => setNewFactor(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Equipe qualificada"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de Impacto *
                </label>
                <select
                  value={newFactor.type}
                  onChange={(e) => setNewFactor(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="positive">Positivo</option>
                  <option value="negative">Negativo</option>
                  <option value="neutral">Neutro</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Impacto Percentual (%) *
                </label>
                <input
                  type="number"
                  value={newFactor.impactPercentage}
                  onChange={(e) => setNewFactor(prev => ({ ...prev, impactPercentage: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: 10"
                  step="0.5"
                  min="1"
                  max="50"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição *
                </label>
                <input
                  type="text"
                  value={newFactor.description}
                  onChange={(e) => setNewFactor(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Ex: Equipe capaz de operar sem o dono"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={handleAddFactor}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Adicionar Fator</span>
              </button>
            </div>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Impacto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {factors.map((factor) => (
                <tr key={factor.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingFactorId === factor.id ? (
                      <select
                        value={editForm.active ? 'true' : 'false'}
                        onChange={(e) => setEditForm(prev => ({ ...prev, active: e.target.value === 'true' }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    ) : (
                      <button
                        onClick={() => handleToggleFactorStatus(factor.id, factor.active)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          factor.active ? 'bg-green-600' : 'bg-gray-200'
                        }`}
                      >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          factor.active ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingFactorId === factor.id ? (
                      <input
                        type="text"
                        value={editForm.name}
                        onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-sm font-medium text-gray-900">{factor.name}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingFactorId === factor.id ? (
                      <select
                        value={editForm.type}
                        onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="positive">Positivo</option>
                        <option value="negative">Negativo</option>
                        <option value="neutral">Neutro</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        factor.type === 'positive' ? 'bg-green-100 text-green-800' :
                        factor.type === 'negative' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {factor.type === 'positive' ? 'Positivo' :
                         factor.type === 'negative' ? 'Negativo' : 'Neutro'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingFactorId === factor.id ? (
                      <input
                        type="number"
                        value={editForm.impactPercentage}
                        onChange={(e) => setEditForm(prev => ({ ...prev, impactPercentage: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                        step="0.5"
                        min="1"
                        max="50"
                      />
                    ) : (
                      <span className="text-sm text-gray-900">{factor.impactPercentage}%</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {editingFactorId === factor.id ? (
                      <input
                        type="text"
                        value={editForm.description}
                        onChange={(e) => setEditForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <span className="text-sm text-gray-600">{factor.description}</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingFactorId === factor.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={handleSaveFactor}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Salvar alterações"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingFactorId(null);
                            setEditForm({});
                          }}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditFactor(factor)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar fator"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFactor(factor.id)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir fator"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Estatísticas de Uso */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-gray-600" />
          Estatísticas de Uso
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-800">Total de Cálculos</span>
              <Calculator className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-900">1,248</div>
            <div className="text-xs text-blue-600 mt-1">Últimos 30 dias</div>
          </div>
          
          <div className="p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-green-800">Valor Médio Calculado</span>
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-900">R$ 487.350</div>
            <div className="text-xs text-green-600 mt-1">Média de todos os cálculos</div>
          </div>
          
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-purple-800">Score Médio</span>
              <BarChart3 className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-900">68/100</div>
            <div className="text-xs text-purple-600 mt-1">Qualidade média dos negócios</div>
          </div>
        </div>
      </div>

      {/* Informações */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <div className="flex items-start space-x-3">
          <Info className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Sobre as Configurações de Valuation</h4>
            <p className="text-xs text-blue-800 mt-1">
              Estas configurações afetam diretamente como o valor dos restaurantes é calculado na plataforma. 
              Os múltiplos de mercado e fatores de ajuste são aplicados a todos os cálculos realizados pelos usuários.
              Recomendamos ajustar estes valores com base em dados reais do mercado de restaurantes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};