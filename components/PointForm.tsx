'use client';

import { useState } from 'react';
import { usePointsStore } from '@/store/pointsStore';
import { Point } from '@/types/points';

export function PointForm({ editPoint, onUpdate }: { editPoint?: Point; onUpdate?: () => void }) {
  const addPoint = usePointsStore((state) => state.addPoint);
  const updatePoint = usePointsStore((state) => state.updatePoint);

  const [formData, setFormData] = useState<Partial<Point>>(
    editPoint || {
      name: '',
      description: '',
      point: 0
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editPoint) {
      await updatePoint({ ...editPoint, ...formData } as Point);
      onUpdate?.();
    } else {
      await addPoint(formData as Omit<Point, 'id' | 'createdAt'>);
      setFormData({
        name: '',
        description: '',
        point: 0
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'number' ? parseInt(e.target.value) : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">
        {editPoint ? 'Edit Point' : 'Add New Point'}
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
          <label className="block text-sm font-medium text-gray-700">Points</label>
          <input
            type="number"
            name="point"
            value={formData.point}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
            min="0"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {editPoint ? 'Update Point' : 'Add Point'}
        </button>
      </div>
    </form>
  );
}