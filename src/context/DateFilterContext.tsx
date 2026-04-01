import React, { createContext, useContext, useState, useMemo } from 'react';
import { useAcademicYear } from './AcademicYearContext';

type FilterType = 'all' | 'today' | 'week' | 'month' | 'custom';

interface DateFilterContextType {
  filterType: FilterType;
  setFilterType: (type: FilterType) => void;
  customStartDate: Date | undefined;
  customEndDate: Date | undefined;
  setCustomStartDate: (date: Date | undefined) => void;
  setCustomEndDate: (date: Date | undefined) => void;
  filterStartDate: Date;
  filterEndDate: Date;
}

const DateFilterContext = createContext<DateFilterContextType | null>(null);

export const DateFilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { startDate: academicStart, endDate: academicEnd } = useAcademicYear();
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  const { filterStartDate, filterEndDate } = useMemo(() => {
    const now = new Date();
    switch (filterType) {
      case 'today': {
        const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
        return { filterStartDate: start, filterEndDate: end };
      }
      case 'week': {
        const dayOfWeek = now.getDay();
        const start = new Date(now);
        start.setDate(now.getDate() - dayOfWeek);
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { filterStartDate: start, filterEndDate: end };
      }
      case 'month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
        return { filterStartDate: start, filterEndDate: end };
      }
      case 'custom': {
        const start = customStartDate || academicStart;
        const end = customEndDate || academicEnd;
        return { filterStartDate: start, filterEndDate: end };
      }
      default:
        return { filterStartDate: new Date(2020, 0, 1), filterEndDate: new Date(2099, 11, 31, 23, 59, 59) };
    }
  }, [filterType, customStartDate, customEndDate, academicStart, academicEnd]);

  return (
    <DateFilterContext.Provider value={{
      filterType, setFilterType,
      customStartDate, customEndDate,
      setCustomStartDate, setCustomEndDate,
      filterStartDate, filterEndDate,
    }}>
      {children}
    </DateFilterContext.Provider>
  );
};

export const useDateFilter = () => {
  const context = useContext(DateFilterContext);
  if (!context) throw new Error('useDateFilter must be used within DateFilterProvider');
  return context;
};
