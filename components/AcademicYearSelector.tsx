'use client';

import { useSession } from '@/components/SessionProvider';
import { useSchoolStore } from '@/store/schoolStore';
import { useAuthStore } from '@/store/authStore';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';

export function AcademicYearSelector() {
  const { currentAcademicYear, setCurrentAcademicYear } = useSession();
  const academicYears = useSchoolStore((state) => state.academicYears);
  const { user } = useAuthStore();
  const { showUnauthorized } = useUnauthorized();
  const isAdmin = user?.role === 'admin';

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!isAdmin) {
      showUnauthorized();
      return;
    }
    const year = academicYears.find(y => y.id === e.target.value);
    setCurrentAcademicYear(year || null);
  };

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm font-medium text-white">Academic Year:</label>
      <select
        value={currentAcademicYear?.id || ''}
        onChange={handleYearChange}
        className="rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 bg-white text-black"
      >
        {academicYears.map((year) => (
          <option key={year.id} value={year.id}>
            {year.name} {year.status ? '(Active)' : ''}
          </option>
        ))}
      </select>
    </div>
  );
}