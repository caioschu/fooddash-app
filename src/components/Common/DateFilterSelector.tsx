import React, { useState } from 'react';
import { Calendar, ChevronDown, X, Filter } from 'lucide-react';
import { useDateFilter, DateFilterType } from '../../hooks/useDateFilter';

interface DateFilterSelectorProps {
  className?: string;
}

export const DateFilterSelector: React.FC<DateFilterSelectorProps> = ({ className = '' }) => {
  const { 
    filterType, 
    customRange, 
    setFilterType, 
    setCustomRange, 
    getFilterLabel, 
    resetFilter 
  } = useDateFilter();
  
  const [isOpen, setIsOpen] = useState(false);
  const [tempCustomRange, setTempCustomRange] = useState(customRange);

  const quickFilters: { type: DateFilterType; label: string; description: string }[] = [
    { type: 'hoje', label: 'Hoje', description: 'Apenas hoje' },
    { type: 'ontem', label: 'Ontem', description: 'Apenas ontem' },
    { type: '7dias', label: 'Últimos 7 dias', description: 'Incluindo hoje' },
    { type: '30dias', label: 'Últimos 30 dias', description: 'Incluindo hoje' },
    { type: 'mes_atual', label: 'Este mês', description: 'Mês atual completo' },
    { type: 'mes_anterior', label: 'Mês anterior', description: 'Mês passado completo' },
    { type: 'proximo_mes', label: 'Próximo mês', description: 'Mês que vem completo' },
    { type: 'ano_atual', label: 'Este ano', description: 'Ano atual completo' },
    { type: 'ano_anterior', label: 'Ano anterior', description: 'Ano passado completo' }
  ];

  const handleQuickFilter = (type: DateFilterType) => {
    setFilterType(type);
    setIsOpen(false);
  };

  const handleCustomRangeApply = () => {
    if (new Date(tempCustomRange.start) > new Date(tempCustomRange.end)) {
      alert('A data de início não pode ser posterior à data de fim');
      return;
    }

    const start = new Date(tempCustomRange.start);
    const end = new Date(tempCustomRange.end);
    const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
    
    if (diffMonths > 12) {
      alert('O período máximo permitido é de 12 meses');
      return;
    }

    setCustomRange(tempCustomRange);
    setFilterType('custom');
    setIsOpen(false);
  };

  const handleReset = () => {
    resetFilter();
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Filter Button - Responsivo */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors text-sm"
      >
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="font-medium text-gray-700 hidden sm:inline">
          📅 {getFilterLabel()}
        </span>
        <span className="font-medium text-gray-700 sm:hidden">
          {getFilterLabel()}
        </span>
        <ChevronDown className="w-4 h-4 text-gray-500" />
      </button>

      {/* Filter Tag (when not default) */}
      {filterType !== 'mes_atual' && (
        <div className="absolute -top-2 -right-2 z-10">
          <button
            onClick={handleReset}
            className="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center hover:bg-orange-600 transition-colors"
            title="Limpar filtro"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Dropdown - Responsivo */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-[80vh] overflow-y-auto">
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Filtrar por período</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-600 rounded"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Filters - Grid responsivo */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Períodos rápidos</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {quickFilters.map((filter) => (
                  <button
                    key={filter.type}
                    onClick={() => handleQuickFilter(filter.type)}
                    className={`p-2 sm:p-3 text-left rounded-lg border transition-colors ${
                      filterType === filter.type
                        ? 'bg-orange-50 border-orange-200 text-orange-700'
                        : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="font-medium text-sm">{filter.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{filter.description}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Range */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Período personalizado</h4>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Data início
                    </label>
                    <input
                      type="date"
                      value={tempCustomRange.start}
                      onChange={(e) => setTempCustomRange(prev => ({ ...prev, start: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Data fim
                    </label>
                    <input
                      type="date"
                      value={tempCustomRange.end}
                      onChange={(e) => setTempCustomRange(prev => ({ ...prev, end: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <p className="text-xs text-gray-500">
                    Máximo de 12 meses por período
                  </p>
                  <button
                    onClick={handleCustomRangeApply}
                    className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors"
                  >
                    Aplicar
                  </button>
                </div>
              </div>
            </div>

            {/* Reset Button */}
            <div className="border-t border-gray-200 pt-4 mt-4">
              <button
                onClick={handleReset}
                className="w-full px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                <Filter className="w-4 h-4 inline mr-2" />
                Resetar para padrão (Este mês)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};