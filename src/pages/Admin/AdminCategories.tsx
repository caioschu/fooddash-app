import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X, Check, AlertCircle, Filter, Search, ChevronDown, ChevronUp, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../hooks/useToast';
import { ConfirmDialog } from '../../components/Common/ConfirmDialog';

interface ExpenseCategory {
  id: string;
  nome: string;
  tipo: 'fixa' | 'variavel' | 'marketing';
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
  subcategorias: ExpenseSubcategory[];
}

interface ExpenseSubcategory {
  id: string;
  category_id: string;
  nome: string;
  descricao: string | null;
  ativo: boolean;
  ordem: number;
  created_at: string;
  updated_at: string;
}

export const AdminCategories: React.FC = () => {
  const { showSuccess, showError } = useToast();
  
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'fixa' | 'variavel' | 'marketing'>('all');
  const [sortField, setSortField] = useState<string>('ordem');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Estados para edição
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editingSubcategoryId, setEditingSubcategoryId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // Estados para formulários
  const [newCategory, setNewCategory] = useState({
    nome: '',
    tipo: 'variavel' as const,
    descricao: ''
  });
  
  const [newSubcategory, setNewSubcategory] = useState<{
    categoryId: string | null;
    nome: string;
    descricao: string;
  }>({
    categoryId: null,
    nome: '',
    descricao: ''
  });
  
  const [editForm, setEditForm] = useState<{
    id: string;
    nome: string;
    tipo?: 'fixa' | 'variavel' | 'marketing';
    descricao: string;
    categoryId?: string;
  }>({
    id: '',
    nome: '',
    descricao: ''
  });
  
  // Estado para diálogo de confirmação
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
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      // Buscar categorias
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('expense_categories')
        .select('*')
        .order('ordem', { ascending: true });

      if (categoriesError) throw categoriesError;

      // Buscar subcategorias
      const { data: subcategoriesData, error: subcategoriesError } = await supabase
        .from('expense_subcategories')
        .select('*')
        .order('ordem', { ascending: true });

      if (subcategoriesError) throw subcategoriesError;

      // Organizar dados
      const categoriesWithSubs = categoriesData.map(category => ({
        ...category,
        subcategorias: subcategoriesData.filter(sub => sub.category_id === category.id)
      }));

      setCategories(categoriesWithSubs);
    } catch (error) {
      console.error('Error fetching categories:', error);
      showError('Erro ao carregar categorias', 'Não foi possível carregar as categorias de despesas.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.nome) {
      showError('Erro de validação', 'O nome da categoria é obrigatório.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert([{
          nome: newCategory.nome,
          tipo: newCategory.tipo,
          descricao: newCategory.descricao || null
        }])
        .select();

      if (error) throw error;

      showSuccess('Categoria adicionada!', 'A categoria foi criada com sucesso.');
      setNewCategory({
        nome: '',
        tipo: 'variavel',
        descricao: ''
      });
      
      await fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      showError('Erro ao adicionar categoria', 'Não foi possível salvar a categoria.');
    }
  };

  const handleAddSubcategory = async () => {
    if (!newSubcategory.categoryId || !newSubcategory.nome) {
      showError('Erro de validação', 'Selecione uma categoria e informe o nome da subcategoria.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('expense_subcategories')
        .insert([{
          category_id: newSubcategory.categoryId,
          nome: newSubcategory.nome,
          descricao: newSubcategory.descricao || null
        }])
        .select();

      if (error) throw error;

      showSuccess('Subcategoria adicionada!', 'A subcategoria foi criada com sucesso.');
      setNewSubcategory({
        categoryId: null,
        nome: '',
        descricao: ''
      });
      
      await fetchCategories();
    } catch (error) {
      console.error('Error adding subcategory:', error);
      showError('Erro ao adicionar subcategoria', 'Não foi possível salvar a subcategoria.');
    }
  };

  const handleEditCategory = (category: ExpenseCategory) => {
    setEditingCategoryId(category.id);
    setEditForm({
      id: category.id,
      nome: category.nome,
      tipo: category.tipo,
      descricao: category.descricao || ''
    });
  };

  const handleEditSubcategory = (subcategory: ExpenseSubcategory) => {
    setEditingSubcategoryId(subcategory.id);
    setEditForm({
      id: subcategory.id,
      nome: subcategory.nome,
      descricao: subcategory.descricao || '',
      categoryId: subcategory.category_id
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.nome) {
      showError('Erro de validação', 'O nome é obrigatório.');
      return;
    }

    try {
      if (editingCategoryId) {
        // Editar categoria
        const { error } = await supabase
          .from('expense_categories')
          .update({
            nome: editForm.nome,
            tipo: editForm.tipo,
            descricao: editForm.descricao || null
          })
          .eq('id', editingCategoryId);

        if (error) throw error;
        
        showSuccess('Categoria atualizada!', 'As alterações foram salvas com sucesso.');
      } else if (editingSubcategoryId) {
        // Editar subcategoria
        const { error } = await supabase
          .from('expense_subcategories')
          .update({
            nome: editForm.nome,
            descricao: editForm.descricao || null
          })
          .eq('id', editingSubcategoryId);

        if (error) throw error;
        
        showSuccess('Subcategoria atualizada!', 'As alterações foram salvas com sucesso.');
      }

      setEditingCategoryId(null);
      setEditingSubcategoryId(null);
      await fetchCategories();
    } catch (error) {
      console.error('Error saving edit:', error);
      showError('Erro ao salvar alterações', 'Não foi possível atualizar os dados.');
    }
  };

  const handleCancelEdit = () => {
    setEditingCategoryId(null);
    setEditingSubcategoryId(null);
  };

  const handleDeleteCategory = (category: ExpenseCategory) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir categoria',
      message: `Tem certeza que deseja excluir a categoria "${category.nome}" e todas as suas subcategorias? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        
        try {
          const { error } = await supabase
            .from('expense_categories')
            .delete()
            .eq('id', category.id);

          if (error) throw error;
          
          await fetchCategories();
          
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
          
          showSuccess('Categoria excluída!', 'A categoria foi removida com sucesso.');
        } catch (error) {
          console.error('Error deleting category:', error);
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
          showError('Erro ao excluir categoria', 'Não foi possível excluir a categoria.');
        }
      },
      isLoading: false
    });
  };

  const handleDeleteSubcategory = (subcategory: ExpenseSubcategory) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Excluir subcategoria',
      message: `Tem certeza que deseja excluir a subcategoria "${subcategory.nome}"? Esta ação não pode ser desfeita.`,
      onConfirm: async () => {
        setConfirmDialog(prev => ({ ...prev, isLoading: true }));
        
        try {
          const { error } = await supabase
            .from('expense_subcategories')
            .delete()
            .eq('id', subcategory.id);

          if (error) throw error;
          
          await fetchCategories();
          
          setConfirmDialog(prev => ({ ...prev, isOpen: false, isLoading: false }));
          
          showSuccess('Subcategoria excluída!', 'A subcategoria foi removida com sucesso.');
        } catch (error) {
          console.error('Error deleting subcategory:', error);
          setConfirmDialog(prev => ({ ...prev, isLoading: false }));
          showError('Erro ao excluir subcategoria', 'Não foi possível excluir a subcategoria.');
        }
      },
      isLoading: false
    });
  };

  const toggleCategoryExpand = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
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

  // Render sort icon
  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    
    return sortDirection === 'asc' 
      ? <ArrowUp className="w-4 h-4 inline-block ml-1" /> 
      : <ArrowDown className="w-4 h-4 inline-block ml-1" />;
  };

  // Filtrar categorias
  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (category.descricao && category.descricao.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = filterType === 'all' || category.tipo === filterType;
    return matchesSearch && matchesType;
  }).sort((a, b) => {
    if (sortField === 'nome' || sortField === 'descricao') {
      const aValue = a[sortField as keyof ExpenseCategory] || '';
      const bValue = b[sortField as keyof ExpenseCategory] || '';
      return sortDirection === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    } else if (sortField === 'tipo') {
      return sortDirection === 'asc' 
        ? a.tipo.localeCompare(b.tipo)
        : b.tipo.localeCompare(a.tipo);
    } else if (sortField === 'ordem') {
      return sortDirection === 'asc' 
        ? a.ordem - b.ordem
        : b.ordem - a.ordem;
    }
    return 0;
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando categorias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
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
          <h1 className="text-2xl font-bold text-gray-900">Categorias de Despesas</h1>
          <p className="text-gray-600 mt-1">Gerencie as categorias e subcategorias de despesas do sistema</p>
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
                placeholder="Buscar categorias..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">Todos os tipos</option>
                <option value="fixa">Fixas</option>
                <option value="variavel">Variáveis</option>
                <option value="marketing">Marketing</option>
              </select>
            </div>
          </div>
          
          <div className="text-sm text-gray-600">
            {filteredCategories.length} de {categories.length} categorias
          </div>
        </div>
      </div>

      {/* Add New Category */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Nova Categoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Categoria *
            </label>
            <input
              type="text"
              value={newCategory.nome}
              onChange={(e) => setNewCategory(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ex: Equipamentos"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo *
            </label>
            <select
              value={newCategory.tipo}
              onChange={(e) => setNewCategory(prev => ({ ...prev, tipo: e.target.value as any }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="variavel">Variável</option>
              <option value="fixa">Fixa</option>
              <option value="marketing">Marketing</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={newCategory.descricao}
              onChange={(e) => setNewCategory(prev => ({ ...prev, descricao: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Descrição opcional"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAddCategory}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Categoria</span>
          </button>
        </div>
      </div>

      {/* Add New Subcategory */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Adicionar Nova Subcategoria</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categoria *
            </label>
            <select
              value={newSubcategory.categoryId || ''}
              onChange={(e) => setNewSubcategory(prev => ({ ...prev, categoryId: e.target.value || null }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Selecione uma categoria</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.nome}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Subcategoria *
            </label>
            <input
              type="text"
              value={newSubcategory.nome}
              onChange={(e) => setNewSubcategory(prev => ({ ...prev, nome: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Ex: Manutenção de Equipamentos"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <input
              type="text"
              value={newSubcategory.descricao}
              onChange={(e) => setNewSubcategory(prev => ({ ...prev, descricao: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              placeholder="Descrição opcional"
            />
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleAddSubcategory}
            disabled={!newSubcategory.categoryId}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Adicionar Subcategoria</span>
          </button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Categorias e Subcategorias</h2>
          <p className="text-sm text-gray-600 mt-1">Clique em uma categoria para ver suas subcategorias</p>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('nome')}
                >
                  Nome {renderSortIcon('nome')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('tipo')}
                >
                  Tipo {renderSortIcon('tipo')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('descricao')}
                >
                  Descrição {renderSortIcon('descricao')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subcategorias
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCategories.map((category) => (
                <React.Fragment key={category.id}>
                  <tr className={`hover:bg-gray-50 ${expandedCategories[category.id] ? 'bg-gray-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCategoryId === category.id ? (
                        <input
                          type="text"
                          value={editForm.nome}
                          onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      ) : (
                        <div className="text-sm font-medium text-gray-900">{category.nome}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingCategoryId === category.id ? (
                        <select
                          value={editForm.tipo}
                          onChange={(e) => setEditForm(prev => ({ ...prev, tipo: e.target.value as any }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="variavel">Variável</option>
                          <option value="fixa">Fixa</option>
                          <option value="marketing">Marketing</option>
                        </select>
                      ) : (
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          category.tipo === 'fixa' ? 'bg-purple-100 text-purple-800' : 
                          category.tipo === 'marketing' ? 'bg-pink-100 text-pink-800' : 
                          'bg-blue-100 text-blue-800'
                        }`}>
                          {category.tipo === 'fixa' ? 'Fixa' : 
                           category.tipo === 'marketing' ? 'Marketing' : 'Variável'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {editingCategoryId === category.id ? (
                        <input
                          type="text"
                          value={editForm.descricao}
                          onChange={(e) => setEditForm(prev => ({ ...prev, descricao: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Descrição opcional"
                        />
                      ) : (
                        <div className="text-sm text-gray-500">{category.descricao || '-'}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleCategoryExpand(category.id)}
                        className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                      >
                        <span>{category.subcategorias.length} subcategorias</span>
                        {expandedCategories[category.id] ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingCategoryId === category.id ? (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={handleSaveEdit}
                            className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                          >
                            <Save className="w-4 h-4" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleEditCategory(category)}
                            className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category)}
                            className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                  
                  {/* Subcategories */}
                  {expandedCategories[category.id] && category.subcategorias.map(subcategory => (
                    <tr key={subcategory.id} className="bg-gray-50 hover:bg-gray-100">
                      <td className="px-6 py-3 pl-12 whitespace-nowrap">
                        {editingSubcategoryId === subcategory.id ? (
                          <input
                            type="text"
                            value={editForm.nome}
                            onChange={(e) => setEditForm(prev => ({ ...prev, nome: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        ) : (
                          <div className="text-sm text-gray-700">{subcategory.nome}</div>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-500">Subcategoria</span>
                      </td>
                      <td className="px-6 py-3">
                        {editingSubcategoryId === subcategory.id ? (
                          <input
                            type="text"
                            value={editForm.descricao}
                            onChange={(e) => setEditForm(prev => ({ ...prev, descricao: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Descrição opcional"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">{subcategory.descricao || '-'}</div>
                        )}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-500">-</span>
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-right text-sm font-medium">
                        {editingSubcategoryId === subcategory.id ? (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={handleSaveEdit}
                              className="p-2 text-green-600 hover:text-green-800 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleEditSubcategory(subcategory)}
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSubcategory(subcategory)}
                              className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          
          {filteredCategories.length === 0 && (
            <div className="text-center py-12">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma categoria encontrada</h3>
              <p className="text-gray-600">Tente ajustar os filtros ou adicione uma nova categoria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};