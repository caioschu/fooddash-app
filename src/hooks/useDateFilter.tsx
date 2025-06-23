import { createContext, useContext, useState, ReactNode } from 'react';

export type DateFilterType = 'hoje' | 'ontem' | '7dias' | '30dias' | 'mes_atual' | 'mes_anterior' | 'proximo_mes' | 'ano_atual' | 'ano_anterior' | 'custom';

interface DateRange {
  start: string;
  end: string;
}

interface DateFilterContextType {
  filterType: DateFilterType;
  customRange: DateRange;
  setFilterType: (type: DateFilterType) => void;
  setCustomRange: (range: DateRange) => void;
  getDateRange: () => DateRange;
  getFilterLabel: () => string;
  resetFilter: () => void;
}

const DateFilterContext = createContext<DateFilterContextType | null>(null);

export const useDateFilter = () => {
  const context = useContext(DateFilterContext);
  if (!context) {
    throw new Error('useDateFilter must be used within DateFilterProvider');
  }
  return context;
};

export const DateFilterProvider = ({ children }: { children: ReactNode }) => {
  const [filterType, setFilterType] = useState<DateFilterType>('mes_atual');
  const [customRange, setCustomRange] = useState<DateRange>(() => {
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    return {
      start: firstDayOfMonth.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    };
  });

  const getDateRange = (): DateRange => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date = today;
    
    switch (filterType) {
      case 'hoje':
        startDate = new Date(today);
        endDate = new Date(today);
        break;
        
      case 'ontem':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 1);
        endDate = new Date(today);
        endDate.setDate(today.getDate() - 1);
        break;
        
      case '7dias':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 6); // Últimos 7 dias incluindo hoje
        break;
        
      case '30dias':
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 29); // Últimos 30 dias incluindo hoje
        break;
        
      case 'mes_atual':
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Último dia do mês
        break;
        
      case 'mes_anterior':
        startDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
        
      case 'proximo_mes':
        startDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
        endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;
        
      case 'ano_atual':
        startDate = new Date(today.getFullYear(), 0, 1);
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
        
      case 'ano_anterior':
        startDate = new Date(today.getFullYear() - 1, 0, 1);
        endDate = new Date(today.getFullYear() - 1, 11, 31);
        break;
        
      case 'custom':
        return customRange;
        
      default:
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
    }
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const getFilterLabel = (): string => {
    switch (filterType) {
      case 'hoje': return 'Hoje';
      case 'ontem': return 'Ontem';
      case '7dias': return 'Últimos 7 dias';
      case '30dias': return 'Últimos 30 dias';
      case 'mes_atual': return 'Este mês';
      case 'mes_anterior': return 'Mês anterior';
      case 'proximo_mes': return 'Próximo mês';
      case 'ano_atual': return 'Este ano';
      case 'ano_anterior': return 'Ano anterior';
      case 'custom': {
        const start = new Date(customRange.start).toLocaleDateString('pt-BR');
        const end = new Date(customRange.end).toLocaleDateString('pt-BR');
        return `${start} a ${end}`;
      }
      default: return 'Este mês';
    }
  };

  const resetFilter = () => {
    setFilterType('mes_atual');
    const today = new Date();
    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    setCustomRange({
      start: firstDayOfMonth.toISOString().split('T')[0],
      end: today.toISOString().split('T')[0]
    });
  };

  return (
    <DateFilterContext.Provider value={{
      filterType,
      customRange,
      setFilterType,
      setCustomRange,
      getDateRange,
      getFilterLabel,
      resetFilter
    }}>
      {children}
    </DateFilterContext.Provider>
  );
};