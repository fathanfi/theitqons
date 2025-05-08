'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { AcademicYear } from '@/types/school';

interface SessionContextType {
  currentAcademicYear: AcademicYear | null;
  setCurrentAcademicYear: (year: AcademicYear | null) => void;
}

const SessionContext = createContext<SessionContextType>({
  currentAcademicYear: null,
  setCurrentAcademicYear: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const academicYears = useSchoolStore((state) => state.academicYears);
  const loadAcademicYears = useSchoolStore((state) => state.loadAcademicYears);
  const [currentAcademicYear, setCurrentAcademicYear] = useState<AcademicYear | null>(null);

  useEffect(() => {
    loadAcademicYears();
  }, [loadAcademicYears]);

  useEffect(() => {
    if (!currentAcademicYear && academicYears.length > 0) {
      const activeYear = academicYears.find(year => year.status);
      if (activeYear) {
        setCurrentAcademicYear(activeYear);
      }
    }
  }, [academicYears, currentAcademicYear]);

  return (
    <SessionContext.Provider value={{ currentAcademicYear, setCurrentAcademicYear }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}