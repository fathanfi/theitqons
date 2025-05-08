'use client';

import { useState } from 'react';
import { useExamStore } from '@/store/examStore';
import { Exam } from '@/types/exam';

export function ExamForm({ editExam, onUpdate }: { editExam?: Exam; onUpdate?: () => void }) {
  const addExam = useExamStore((state) => state.addExam);
  const updateExam = useExamStore((state) => state.updateExam);

  const [formData, setFormData] = useState<Partial<Exam>>(
    editExam || {
      name: '',
      description: ''
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editExam) {
      await updateExam({ ...editExam, ...formData } as Exam);
      onUpdate?.();
    } else {
      await addExam(formData as Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>);
      setFormData({
        name: '',
        description: ''
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">
        {editExam ? 'Edit Exam' : 'Add New Exam'}
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
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {editExam ? 'Update Exam' : 'Add Exam'}
        </button>
      </div>
    </form>
  );
}