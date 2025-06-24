import React, { useState, useEffect } from 'react';
import { Save, Plus, Edit, Trash2, BarChart3, Filter, Search, ArrowUp, ArrowDown, Check, X, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';

interface BenchmarkData {
  id: string;
  regiao: string;
  categoria_culinaria: string;
  ticket_medio: number;
  margem_media: number;
  cmv_medio: number;
  gasto_fixo_medio: number;
  ponto_equilibrio_medio: number;
  taxa_media_venda: number;
  gasto_marketing_medio: number;
  total_restaurantes: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

interface Region {
  id: string;
  nome: string;
  estados: string[];
  cidades: string[];
  ativo: boolean;
}

export const AdminBenchmarking: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData[]>([]);
  const [regions, setRegions] = useState<Region[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BenchmarkData>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBenchmark, setNewBenchmark] = useState<Partial<BenchmarkData>>({
    regiao: '',
    categoria_culinaria: '',
    ticket_medio: 0,
    margem_media: 0,
    cmv_medio: 0,
    gasto_fixo_medio: 0,
    ponto_equilibrio_medio: 0,
    taxa_media_venda: 0,
    gasto_marketing_medio: 0,
    total_restaurantes: 0,
    ativo: true
  });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortField, setSortField] = useState<string>('updated_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [categories, setCategories] = useState<string[]>([]);
  
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
    fetchBenchmarkData();
    fetchRegions();
    fetchCategories();
  }, []);

  const fetchBenchmarkData = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('simulated_benchmarks')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) throw error;
      
      setBenchmarkData(data || []);
    } catch (error) {
      console.error('Error fetching benchmark data:', error);
      showError('Erro ao carregar dados', 'Não foi possível carregar os dados de benchmarking.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRegions = async () => {
    try {
      const { data, error } = await supabase
        .from('regions')
        .select('*')
        .eq('ativo', true);

      if (error) throw error;
      
      setRegions(data || []);
    } catch (error) {
      console.error('Error fetching regions:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      // Get unique categories from restaurants
      const { data, error } = await supabase
        .from('restaurants')
        .select('categoria_culinaria')
        .not('categoria_culinaria', 'is', null);

      if (error) throw error;
      
      const uniqueCategories = [...new Set(data?.map(r => r.categoria_culinaria).filter(Boolean))];
      setCategories(uniqueCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleEdit = (data: BenchmarkData) => {
    setEditingId(data.id);
    setFormData(data);
  };

  const handleSave = async () => {
    if (editingId && formData) {
      try {
        const { error } = await supabase
          .from('simulated_benchmarks')
          .update({
            regiao: formData.regiao,
            categoria_culinaria: formData.categoria_culinaria,
            ticket_medio: formData.ticket_medio,
            margem_media: formData.margem_media,
            cmv_medio: formData.cmv_medio,
            gasto_fixo_medio: formData.gasto_fixo_medio,
            ponto_equilibrio_medio: formData.ponto_equilibrio_medio,
            taxa_media_venda: formData.taxa_media_venda,
            gasto_marketing_medio: formData.gasto_marketing_medio,
            total_restaurantes: formData.total_restaurantes,
            ativo: formData.ativo
          })
          .eq('id', editingId);

        if (error) throw error;
        
        setBenchmarkData(prev => 
          prev.map(item => 
            item.id === editingId 
              ? { ...item, ...formData } as BenchmarkData
              : item
          )
        );
        
        setEditingId(null);
        setFormData({});
        
        showSuccess('Dados atualizados!', 'Os dados de benchmarking foram atualizados com sucesso.');
      } catch (error) {
        console.error('Error updating benchmark data:', error);
        showError('Erro ao atualizar dados', 'Não foi possível salvar as alterações.');
      }
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = (data: BenchmarkData) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir dados de benchmarking',
      message: `Tem certeza que deseja excluir os dados de benchmarking para ${data.categoria_culinaria} na região ${data.regiao}?`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        
        try {
          const { error } = await supabase
            .from('simulated_benchmarks')
            .delete()
            .eq('id', data.id);

          if (error) throw error;
          
          setBenchmarkData(prev => prev.filter(item => item.id !== data.id));
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
          
          showSuccess('Dados excluídos!', 'Os dados de benchmarking foram removidos com sucesso.');
        } catch (error) {
          console.error('Error deleting benchmark data:', error);
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
          showError('Erro ao excluir dados', 'Não foi possível excluir os dados de benchmarking.');
        }
      },
      isLoading: false
    });
  };

  const handleAddBenchmark = async () => {
    if (!newBenchmark.regiao || !newBenchmark.categoria_culinaria) {
      showError('Campos obrigatórios', 'Região e categoria culinária são obrigatórios.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('simulated_benchmarks')
        .insert([{
          regiao: newBenchmark.regiao,
          categoria_culinaria: newBenchmark.categoria_culinaria,
          ticket_medio: newBenchmark.ticket_medio || 0,
          margem_media: newBenchmark.margem_media || 0,
          cmv_medio: newBenchmark.cmv_medio || 0,
          gasto_fixo_medio: newBenchmark.gasto_fixo_medio || 0,
          ponto_equilibrio_medio: newBenchmark.ponto_equilibrio_medio || 0,
          taxa_media_venda: newBenchmark.taxa_media_venda || 0,
          gasto_marketing_medio: newBenchmark.gasto_marketing_medio || 0,
          total_restaurantes: newBenchmark.total_restaurantes || 0,
          ativo: true
        }])
        .select();

      if (error) {
        if (error.code === '23505') {
          showError('Erro ao adicionar dados', 'Já existem dados para esta região e categoria.');
        } else {
          throw error;
        }
      } else {
        setBenchmarkData(prev => [...prev, ...(data || [])]);
        setShowAddForm(false);
        setNewBenchmark({
          regiao: '',
          categoria_culinaria: '',
          ticket_medio: 0,
          margem_media: 0,
          cmv_medio: 0,
          gasto_fixo_medio: 0,
          ponto_equilibrio_medio: 0,
          taxa_media_venda: 0,
          gasto_marketing_medio: 0,
          total_restaurantes: 0,
          ativo: true
        });
        
        showSuccess('Dados adicionados!', 'Os novos dados de benchmarking foram adicionados com sucesso.');
      }
    } catch (error) {
      console.error('Error adding benchmark data:', error);
      showError('Erro ao adicionar dados', 'Não foi possível adicionar os dados de benchmarking.');
    }
  };

  const handleInputChange = (field: keyof BenchmarkData, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'regiao' && field !== 'categoria_culinaria' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  const handleNewBenchmarkChange = (field: keyof BenchmarkData, value: string | number | boolean) => {
    setNewBenchmark(prev => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'regiao' && field !== 'categoria_culinaria' 
        ? parseFloat(value) || 0 
        : value
    }));
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

  // Filter and sort benchmark data
  const filteredBenchmarks = benchmarkData.filter(data => {
    const matchesSearch = 
      data.regiao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      data.categoria_culinaria.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRegion = !filterRegion || data.regiao === filterRegion;
    const matchesCategory = !filterCategory || data.categoria_culinaria === filterCategory;
    
    return matchesSearch && matchesRegion && matchesCategory;
  }).sort((a, b) => {
    // Handle different field types
    if (sortField === 'regiao' || sortField === 'categoria_culinaria') {
      return sortDirection === 'asc' 
        ? a[sortField].localeCompare(b[sortField])
        : b[sortField].localeCompare(a[sortField]);
    } else if (sortField === 'updated_at' || sortField === 'created_at') {
      const aDate = new Date(a[sortField]).getTime();
      const bDate = new Date(b[sortField]).getTime();
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    } else {
      // Numeric fields
      const aValue = a[sortField as keyof BenchmarkData] as number;
      const bValue = b[sortField as keyof BenchmarkData] as number;
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    }
  });

  // Render sort icon
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 inline-block ml-1" /> 
      : <ArrowDown className="w-4 h-4 inline-block ml-1" />;
  };

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
          <h1 className="text-2xl font-bold text-gray-900">Dados de Benchmarking</h1>
          <p className="text-gray-600 mt-1">Gerencie as médias de mercado por região e categoria</p>
        </div>
        <button 
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
        >
          {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
          <span>{showAddForm ? 'Cancelar' : 'Novo Benchmark'}</span>
        </button>
      </div>

      {/* Add New Benchmark Form */}
      {showAddForm && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Novos Dados de Benchmarking</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Região *
              </label>
              <select
                value={newBenchmark.regiao}
                onChange={(e) => handleNewBenchmarkChange('regiao', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Selecione uma região</option>
                {regions.map(region => (
                  <option key={region.id} value={region.nome}>{region.nome}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Categoria Culinária *
              </label>
              <select
                value={newBenchmark.categoria_culinaria}
                onChange={(e) => handleNewBenchmarkChange('categoria_culinaria', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                required
              >
                <option value="">Selecione uma categoria</option>
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ticket Médio (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={newBenchmark.ticket_medio || ''}
                onChange={(e) => handleNewBenchmarkChange('ticket_medio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Margem Média (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={newBenchmark.margem_media || ''}
                onChange={(e) => handleNewBenchmarkChange('margem_media', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CMV Médio (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={newBenchmark.cmv_medio || ''}
                onChange={(e) => handleNewBenchmarkChange('cmv_medio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gasto Fixo Médio (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={newBenchmark.gasto_fixo_medio || ''}
                onChange={(e) => handleNewBenchmarkChange('gasto_fixo_medio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ponto de Equilíbrio (R$)
              </label>
              <input
                type="number"
                value={newBenchmark.ponto_equilibrio_medio || ''}
                onChange={(e) => handleNewBenchmarkChange('ponto_equilibrio_medio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Taxa Média de Venda (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={newBenchmark.taxa_media_venda || ''}
                onChange={(e) => handleNewBenchmarkChange('taxa_media_venda', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gasto Marketing Médio (%)
              </label>
              <input
                type="number"
                step="0.1"
                value={newBenchmark.gasto_marketing_medio || ''}
                onChange={(e) => handleNewBenchmarkChange('gasto_marketing_medio', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total de Restaurantes
              </label>
              <input
                type="number"
                value={newBenchmark.total_restaurantes || ''}
                onChange={(e) => handleNewBenchmarkChange('total_restaurantes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex justify-end">
            <button
              onClick={handleAddBenchmark}
              disabled={!newBenchmark.regiao || !newBenchmark.categoria_culinaria}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar Benchmark</span>
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar dados..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredBenchmarks.length} de {benchmarkData.length} registros
          </div>
        </div>
        
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filtrar por Região
            </label>
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Todas as regiões</option>
              {regions.map(region => (
                <option key={region.id} value={region.nome}>{region.nome}</option>
              ))}
            </select>
          </div>
          
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
        </div>
      </div>

      {/* Benchmark Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('regiao')}
                >
                  Região {renderSortIcon('regiao')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('categoria_culinaria')}
                >
                  Categoria {renderSortIcon('categoria_culinaria')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('ticket_medio')}
                >
                  Ticket Médio {renderSortIcon('ticket_medio')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('margem_media')}
                >
                  Margem {renderSortIcon('margem_media')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('cmv_medio')}
                >
                  CMV {renderSortIcon('cmv_medio')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('total_restaurantes')}
                >
                  Restaurantes {renderSortIcon('total_restaurantes')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredBenchmarks.map((data) => (
                <tr key={data.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === data.id ? (
                      <select
                        value={formData.regiao || ''}
                        onChange={(e) => handleInputChange('regiao', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {regions.map(region => (
                          <option key={region.id} value={region.nome}>{region.nome}</option>
                        ))}
                      </select>
                    ) : (
                      <div className="text-sm font-medium text-gray-900">{data.regiao}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === data.id ? (
                      <select
                        value={formData.categoria_culinaria || ''}
                        onChange={(e) => handleInputChange('categoria_culinaria', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        {categories.map(category => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        {data.categoria_culinaria}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === data.id ? (
                      <input
                        type="number"
                        step="0.01"
                        value={formData.ticket_medio || ''}
                        onChange={(e) => handleInputChange('ticket_medio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-sm font-semibold text-gray-900">
                        R$ {data.ticket_medio.toFixed(2)}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === data.id ? (
                      <input
                        type="number"
                        step="0.1"
                        value={formData.margem_media || ''}
                        onChange={(e) => handleInputChange('margem_media', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{data.margem_media.toFixed(1)}%</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === data.id ? (
                      <input
                        type="number"
                        step="0.1"
                        value={formData.cmv_medio || ''}
                        onChange={(e) => handleInputChange('cmv_medio', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{data.cmv_medio.toFixed(1)}%</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === data.id ? (
                      <input
                        type="number"
                        value={formData.total_restaurantes || ''}
                        onChange={(e) => handleInputChange('total_restaurantes', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="text-sm text-gray-900">{data.total_restaurantes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {editingId === data.id ? (
                      <select
                        value={formData.ativo ? 'true' : 'false'}
                        onChange={(e) => handleInputChange('ativo', e.target.value === 'true')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      >
                        <option value="true">Ativo</option>
                        <option value="false">Inativo</option>
                      </select>
                    ) : (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        data.ativo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {data.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === data.id ? (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={handleSave}
                          className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          title="Salvar alterações"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={handleCancel}
                          className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          title="Cancelar"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(data)}
                          className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Editar dados"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(data)}
                          className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          title="Excluir dados"
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

        {filteredBenchmarks.length === 0 && (
          <div className="text-center py-12">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado de benchmarking encontrado</h3>
            <p className="text-gray-600">Adicione dados de benchmarking para começar.</p>
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Configurações Avançadas</h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Usar Dados Reais</h4>
              <p className="text-sm text-gray-600">
                Quando ativado, o sistema usará dados reais de benchmarking em vez de simulados
              </p>
            </div>
            <div>
              <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                Desativado
              </button>
            </div>
          </div>
          
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Recalcular Dados Reais</h4>
              <p className="text-sm text-gray-600">
                Atualiza os dados de benchmarking com base nas informações reais dos restaurantes
              </p>
            </div>
            <div>
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors">
                Recalcular Agora
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};