import React, { createContext, useContext, useState, useMemo } from 'react';

interface AcademicYearContextType {
  academicYear: string; // e.g. "2025-2026"
  setAcademicYear: (year: string) => void;
  startDate: Date;
  endDate: Date;
  yearOptions: string[];
}

const AcademicYearContext = createContext<AcademicYearContextType | null>(null);

function getCurrentAcademicYear(): string {
  const now = new Date();
  const month = now.getMonth(); // 0-indexed
  const year = now.getFullYear();
  // Academic year runs April (3) to March
  if (month >= 3) {
    return `${year}-${year + 1}`;
  }
  return `${year - 1}-${year}`;
}

function generateYearOptions(): string[] {
  const options: string[] = [];
  for (let y = 2024; y <= 2050; y++) {
    options.push(`${y}-${y + 1}`);
  }
  return options;
}

function parseDateRange(academicYear: string): { start: Date; end: Date } {
  const [startYear] = academicYear.split('-').map(Number);
  return {
    start: new Date(startYear, 3, 1), // April 1
    end: new Date(startYear + 1, 2, 31, 23, 59, 59), // March 31
  };
}

export const AcademicYearProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [academicYear, setAcademicYear] = useState(getCurrentAcademicYear);
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
