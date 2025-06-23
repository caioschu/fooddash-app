import React, { useState } from 'react';
import { Save, Plus, Edit, Trash2, BarChart3 } from 'lucide-react';

interface BenchmarkData {
  id: string;
  cidade: string;
  categoria_culinaria: string;
  ticket_medio: number;
  margem_media: number;
  cmv_medio: number;
  gasto_fixo_medio: number;
  ponto_equilibrio_medio: number;
  taxa_media_venda: number;
  gasto_marketing_medio: number;
  total_restaurantes: number;
}

const mockBenchmarkData: BenchmarkData[] = [
  {
    id: '1',
    cidade: 'Belo Horizonte',
    categoria_culinaria: 'Japonesa',
    ticket_medio: 34.60,
    margem_media: 16.2,
    cmv_medio: 31,
    gasto_fixo_medio: 29,
    ponto_equilibrio_medio: 10900,
    taxa_media_venda: 14.9,
    gasto_marketing_medio: 4,
    total_restaurantes: 829
  },
  {
    id: '2',
    cidade: 'São Paulo',
    categoria_culinaria: 'Italiana',
    ticket_medio: 42.80,
    margem_media: 18.5,
    cmv_medio: 28,
    gasto_fixo_medio: 32,
    ponto_equilibrio_medio: 15200,
    taxa_media_venda: 16.2,
    gasto_marketing_medio: 5.5,
    total_restaurantes: 1247
  }
];

export const AdminBenchmarking: React.FC = () => {
  const [benchmarkData, setBenchmarkData] = useState<BenchmarkData[]>(mockBenchmarkData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<BenchmarkData>>({});

  const handleEdit = (data: BenchmarkData) => {
    setEditingId(data.id);
    setFormData(data);
  };

  const handleSave = () => {
    if (editingId && formData) {
      setBenchmarkData(prev => 
        prev.map(item => 
          item.id === editingId 
            ? { ...item, ...formData } as BenchmarkData
            : item
        )
      );
      setEditingId(null);
      setFormData({});
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setFormData({});
  };

  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir estes dados de benchmarking?')) {
      setBenchmarkData(prev => prev.filter(item => item.id !== id));
    }
  };

  const handleInputChange = (field: keyof BenchmarkData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof value === 'string' && field !== 'cidade' && field !== 'categoria_culinaria' 
        ? parseFloat(value) || 0 
        : value
    }));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dados de Benchmarking</h1>
          <p className="text-gray-600 mt-1">Gerencie as médias de mercado por cidade e categoria</p>
        </div>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors flex items-center space-x-2">
          <Plus className="w-4 h-4" />
          <span>Novo Benchmark</span>
        </button>
      </div>

      {/* Benchmark Data Cards */}
      <div className="space-y-6">
        {benchmarkData.map((data) => (
          <div key={data.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {data.categoria_culinaria} - {data.cidade}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {data.total_restaurantes} restaurantes na base
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {editingId === data.id ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-1"
                    >
                      <Save className="w-4 h-4" />
                      <span>Salvar</span>
                    </button>
                    <button
                      onClick={handleCancel}
                      className="px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancelar
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleEdit(data)}
                      className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(data.id)}
                      className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ticket Médio (R$)</label>
                {editingId === data.id ? (
                  <input
                    type="number"
                    step="0.01"
                    value={formData.ticket_medio || ''}
                    onChange={(e) => handleInputChange('ticket_medio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">R$ {data.ticket_medio.toFixed(2)}</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Margem Média (%)</label>
                {editingId === data.id ? (
                  <input
                    type="number"
                    step="0.1"
                    value={formData.margem_media || ''}
                    onChange={(e) => handleInputChange('margem_media', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">{data.margem_media}%</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">CMV Médio (%)</label>
                {editingId === data.id ? (
                  <input
                    type="number"
                    step="0.1"
                    value={formData.cmv_medio || ''}
                    onChange={(e) => handleInputChange('cmv_medio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">{data.cmv_medio}%</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Gasto Fixo Médio (%)</label>
                {editingId === data.id ? (
                  <input
                    type="number"
                    step="0.1"
                    value={formData.gasto_fixo_medio || ''}
                    onChange={(e) => handleInputChange('gasto_fixo_medio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">{data.gasto_fixo_medio}%</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Ponto de Equilíbrio (R$)</label>
                {editingId === data.id ? (
                  <input
                    type="number"
                    value={formData.ponto_equilibrio_medio || ''}
                    onChange={(e) => handleInputChange('ponto_equilibrio_medio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">R$ {data.ponto_equilibrio_medio.toLocaleString()}</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Taxa Média de Venda (%)</label>
                {editingId === data.id ? (
                  <input
                    type="number"
                    step="0.1"
                    value={formData.taxa_media_venda || ''}
                    onChange={(e) => handleInputChange('taxa_media_venda', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">{data.taxa_media_venda}%</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Gasto Marketing Médio (%)</label>
                {editingId === data.id ? (
                  <input
                    type="number"
                    step="0.1"
                    value={formData.gasto_marketing_medio || ''}
                    onChange={(e) => handleInputChange('gasto_marketing_medio', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">{data.gasto_marketing_medio}%</div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Total de Restaurantes</label>
                {editingId === data.id ? (
                  <input
                    type="number"
                    value={formData.total_restaurantes || ''}
                    onChange={(e) => handleInputChange('total_restaurantes', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                ) : (
                  <div className="text-lg font-semibold text-gray-900">{data.total_restaurantes}</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {benchmarkData.length === 0 && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum dado de benchmarking encontrado</h3>
          <p className="text-gray-600">Adicione dados de benchmarking para começar.</p>
        </div>
      )}
    </div>
  );
};