import React, { createContext, useContext, useState, useMemo } from 'react';

interface AcademicYearContextType {
  academicYear: string;
  setAcademicYear: (year: string) => void;
  startDate: Date;
  endDate: Date;
  yearOptions: string[];
}

const AcademicYearContext = createContext<AcademicYearContextType | null>(null);

function getCurrentYear(): string {
  return `${new Date().getFullYear()}`;
}

function generateYearOptions(): string[] {
  const options: string[] = [];
  for (let y = 2024; y <= 2050; y++) {
    options.push(`${y}`);
  }
  return options;
}

function parseDateRange(year: string): { start: Date; end: Date } {
  const y = Number(year);
  return {
    start: new Date(y, 0, 1, 0, 0, 0),       // Jan 1
    end: new Date(y, 11, 31, 23, 59, 59),     // Dec 31
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
