'use client';

import { useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { AcademicYear } from '@/types/school';
import { AcademicYearForm } from './AcademicYearForm';
import { useAuthStore } from '@/store/authStore';

export function AcademicYearList() {
  const academicYears = useSchoolStore((state) => state.academicYears);
  const loadAcademicYears = useSchoolStore((state) => state.loadAcademicYears);
  const setAcademicYearStatus = useSchoolStore((state) => state.setAcademicYearStatus);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    loadAcademicYears();
  }, [loadAcademicYears]);

  const handleStatusChange = async (id: string, status: boolean) => {
    if (!user || user.role !== 'admin') return;
    await setAcademicYearStatus(id, status);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Academic Years List</h2>
      {editingYear && (
        <div className="mb-6">
          <AcademicYearForm 
            editYear={editingYear} 
            onUpdate={() => setEditingYear(null)} 
          />
        </div>
      )}
      <div className="space-y-4">
        {academicYears.map((year) => (
          <div key={year.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{year.name}</h3>
                <p className="text-sm text-gray-500">
                  {new Date(year.startDate).toLocaleDateString()} - {new Date(year.endDate).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={year.status}
                    onChange={(e) => handleStatusChange(year.id, e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    disabled={!user || user.role !== 'admin'}
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <button
                  onClick={() => setEditingYear(year)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
        {academicYears.length === 0 && (
          <p className="text-gray-500 text-center">No academic years added yet.</p>
        )}
      </div>
    </div>
  );
}