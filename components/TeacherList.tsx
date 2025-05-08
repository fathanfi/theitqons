'use client';

import { useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { Teacher } from '@/types/school';
import { TeacherForm } from './TeacherForm';

export function TeacherList() {
  const teachers = useSchoolStore((state) => state.teachers);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);
  const setTeacherStatus = useSchoolStore((state) => state.setTeacherStatus);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const handleStatusChange = async (id: string, status: boolean) => {
    await setTeacherStatus(id, status);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Teachers List</h2>
      {editingTeacher && (
        <div className="mb-6">
          <TeacherForm 
            editTeacher={editingTeacher} 
            onUpdate={() => setEditingTeacher(null)} 
          />
        </div>
      )}
      <div className="space-y-4">
        {teachers.map((teacher) => (
          <div key={teacher.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{teacher.name}</h3>
                <p className="text-sm text-gray-500">
                  {teacher.gender} | Phone: {teacher.phone}
                </p>
                <p className="text-sm text-gray-500">
                  Joined: {new Date(teacher.joinDate).toLocaleDateString()}
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
              <div className="flex items-center gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={teacher.status}
                    onChange={(e) => handleStatusChange(teacher.id, e.target.checked)}
                    className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                  />
                  <span className="ml-2 text-sm text-gray-700">Active</span>
                </label>
                <button
                  onClick={() => setEditingTeacher(teacher)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
              </div>
            </div>
          </div>
        ))}
        {teachers.length === 0 && (
          <p className="text-gray-500 text-center">No teachers added yet.</p>
        )}
      </div>
    </div>
  );
}