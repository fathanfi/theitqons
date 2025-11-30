'use client';

import { useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { Teacher } from '@/types/school';
import { TeacherForm } from './TeacherForm';
import { useAuthStore } from '@/store/authStore';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

export function TeacherList() {
  const teachers = useSchoolStore((state) => state.teachers);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);
  const setTeacherStatus = useSchoolStore((state) => state.setTeacherStatus);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const handleStatusChange = async (id: string, status: boolean) => {
    if (!user || user.role !== 'admin') return;
    await setTeacherStatus(id, status);
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    // Focus on the name input after a short delay to ensure the form is rendered
    setTimeout(() => {
      const nameInput = document.querySelector('input[name="name"]') as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
      }
    }, 100);
  };

  const handleCancel = () => {
    setEditingTeacher(null);
  };

  // Filter teachers based on search query
  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.phone.includes(searchQuery)
  );

  // Calculate gender statistics
  const maleCount = teachers.filter(t => t.gender === 'Ikhwan').length;
  const femaleCount = teachers.filter(t => t.gender === 'Akhwat').length;

  // Helper to format date as 'day month year'
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return format(date, 'd MMMM yyyy', { locale: localeId });
  };

  // Helper to calculate age
  const getAge = (dateStr: string) => {
    if (!dateStr) return '-';
    const birth = new Date(dateStr);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  // Helper to calculate years of service
  const getYearsOfService = (dateStr: string) => {
    if (!dateStr) return '-';
    const joined = new Date(dateStr);
    const today = new Date();
    let years = today.getFullYear() - joined.getFullYear();
    const m = today.getMonth() - joined.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < joined.getDate())) {
      years--;
    }
    return years;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
        <h2 className="text-2xl font-semibold">Teachers List</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end md:gap-4">
          <div className="text-sm text-gray-600 flex justify-between sm:justify-start sm:gap-4">
            <span className="mr-4">Male: {maleCount}</span>
            <span>Female: {femaleCount}</span>
          </div>
          <div className="relative w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search teachers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 px-4 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {editingTeacher && (
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Editing Teacher</h3>
            <button
              onClick={handleCancel}
              className="text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
          <TeacherForm 
            editTeacher={editingTeacher} 
            onUpdate={() => setEditingTeacher(null)}
            onCancel={handleCancel}
          />
        </div>
      )}

      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTeachers.map((teacher) => (
            <div key={teacher.id} className="border rounded-lg p-4 flex flex-col justify-between h-full">
              <div>
                <h3 className="font-semibold">{teacher.name}</h3>
                <p className="text-sm text-gray-500">
                  {teacher.gender} | Phone: {teacher.phone}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="inline-flex items-center mr-4">
                    <span role="img" aria-label="Birthday" className="mr-1">🎂</span>
                    {formatDate(teacher.dateOfBirth)} ({getAge(teacher.dateOfBirth)})
                  </span>
                  <span className="inline-flex items-center">
                    <span role="img" aria-label="Joined" className="mr-1">🗓️</span>
                    {formatDate(teacher.joinDate)} ({getYearsOfService(teacher.joinDate)})
                  </span>
                </p>
                {teacher.roles.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {teacher.roles.map((role) => (
                      <span
                        key={role}
                        className="px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full"
                      >
                        {role}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-4 mt-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teacher.status}
                    onChange={(e) => handleStatusChange(teacher.id, e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                    disabled={!user || user.role !== 'admin'}
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <button
                  onClick={() => handleEdit(teacher)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
          {filteredTeachers.length === 0 && (
            <p className="text-gray-500 text-center col-span-2">No teachers found.</p>
          )}
        </div>
      </div>
    </div>
  );
}