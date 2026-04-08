import React, { createContext, useContext, useState, useMemo } from 'react';

interface AcademicYearContextType {
  academicYear: string; // e.g. "2026" or "all"
  setAcademicYear: (year: string) => void;
  startDate: Date;
  endDate: Date;
  yearOptions: string[];
  isAllYears: boolean;
}

const AcademicYearContext = createContext<AcademicYearContextType | null>(null);

function getCurrentYear(): string {
  return `${new Date().getFullYear()}`;
}

function generateYearOptions(): string[] {
  const options: string[] = ['all'];
  for (let y = 2024; y <= 2050; y++) {
    options.push(`${y}`);
  }
  return options;
}

function parseDateRange(year: string): { start: Date; end: Date } {
  if (year === 'all') {
    return {
      start: new Date(2000, 0, 1, 0, 0, 0),
      end: new Date(2099, 11, 31, 23, 59, 59),
    };
  }
  const y = Number(year);
  return {
    start: new Date(y, 0, 1, 0, 0, 0),
    end: new Date(y, 11, 31, 23, 59, 59),
  };
}

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [academicYear, setAcademicYear] = useState(getCurrentYear);
  const yearOptions = useMemo(generateYearOptions, []);
  const { start, end } = useMemo(() => parseDateRange(academicYear), [academicYear]);

  return (
    <AcademicYearContext.Provider
      value={{
        academicYear,
        setAcademicYear,
        startDate: start,
        endDate: end,
        yearOptions,
        isAllYears: academicYear === 'all',
      }}
    >
      {children}
    </AcademicYearContext.Provider>
  );
};

export const useAcademicYear = () => {
  const context = useContext(AcademicYearContext);
  if (!context) throw new Error('useAcademicYear must be used within AcademicYearProvider');
  return context;
};
