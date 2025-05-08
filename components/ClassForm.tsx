'use client';

import { useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { Class, Teacher } from '@/types/school';

export function ClassForm({ editClass, onUpdate }: { editClass?: Class; onUpdate?: () => void }) {
  const teachers = useSchoolStore((state) => state.teachers);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);
  const addClass = useSchoolStore((state) => state.addClass);
  const updateClass = useSchoolStore((state) => state.updateClass);

  useEffect(() => {
    loadTeachers();
  }, [loadTeachers]);

  const [formData, setFormData] = useState<Partial<Class>>(
    editClass || {
      name: '',
      description: '',
      teacherId: ''
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editClass) {
      await updateClass({ ...editClass, ...formData } as Class);
      onUpdate?.();
    } else {
      await addClass(formData as Omit<Class, 'id' | 'createdAt' | 'teacher'>);
      setFormData({
        name: '',
        description: '',
        teacherId: ''
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">
        {editClass ? 'Edit Class' : 'Add New Class'}
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Teacher</label>
          <select
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          >
            <option value="">Select a teacher</option>
            {teachers
              .filter(teacher => teacher.status)
              .map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))
            }
          </select>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {editClass ? 'Update Class' : 'Add Class'}
        </button>
      </div>
    </form>
  );
}