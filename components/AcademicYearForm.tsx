'use client';

import { useState } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { AcademicYear } from '@/types/school';

export function AcademicYearForm({ editYear, onUpdate }: { editYear?: AcademicYear; onUpdate?: () => void }) {
  const addAcademicYear = useSchoolStore((state) => state.addAcademicYear);
  const updateAcademicYear = useSchoolStore((state) => state.updateAcademicYear);

  const [formData, setFormData] = useState<Partial<AcademicYear>>(
    editYear || {
      name: '',
      startDate: '',
      endDate: '',
      status: false
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editYear) {
      await updateAcademicYear({ ...editYear, ...formData } as AcademicYear);
      onUpdate?.();
    } else {
      await addAcademicYear(formData as Omit<AcademicYear, 'id' | 'createdAt'>);
      setFormData({
        name: '',
        startDate: '',
        endDate: '',
        status: false
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">
        {editYear ? 'Edit Academic Year' : 'Add New Academic Year'}
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
            placeholder="e.g., 2024/2025"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Start Date</label>
          <input
            type="date"
            name="startDate"
            value={formData.startDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">End Date</label>
          <input
            type="date"
            name="endDate"
            value={formData.endDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="status"
            checked={formData.status}
            onChange={handleChange}
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          <label className="ml-2 block text-sm font-medium text-gray-700">
            Active
          </label>
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {editYear ? 'Update Academic Year' : 'Add Academic Year'}
        </button>
      </div>
    </form>
  );
}