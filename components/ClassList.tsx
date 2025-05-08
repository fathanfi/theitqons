'use client';

import { useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { Class } from '@/types/school';
import { ClassForm } from './ClassForm';

export function ClassList() {
  const classes = useSchoolStore((state) => state.classes);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const [editingClass, setEditingClass] = useState<Class | null>(null);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  const handleUpdate = async () => {
    setEditingClass(null);
    await loadClasses(); // Reload classes to get fresh data
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Classes List</h2>
      {editingClass && (
        <div className="mb-6">
          <ClassForm 
            editClass={editingClass} 
            onUpdate={handleUpdate}
          />
        </div>
      )}
      <div className="space-y-4">
        {classes.map((class_) => (
          <div key={class_.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{class_.name}</h3>
                {class_.description && (
                  <p className="text-sm text-gray-500">{class_.description}</p>
                )}
                {class_.teacher && (
                  <p className="text-sm text-gray-500">
                    Teacher: {class_.teacher.name}
                  </p>
                )}
              </div>
              <button
                onClick={() => setEditingClass(class_)}
                className="text-indigo-600 hover:text-indigo-800"
              >
                Edit
              </button>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <p className="text-gray-500 text-center">No classes added yet.</p>
        )}
      </div>
    </div>
  );
}