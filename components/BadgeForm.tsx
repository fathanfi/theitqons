'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Badge } from '@/types/student';

export function BadgeForm() {
  const addBadge = useStore((state) => state.addBadge);
  const [formData, setFormData] = useState<Partial<Badge>>({
    icon: '🏆',
    description: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBadge({
      ...formData,
      id: crypto.randomUUID(),
    } as Badge);
    setFormData({
      icon: '🏆',
      description: ''
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const emojis = ['🏆', '⭐', '🌟', '🎖️', '🥇', '🥈', '🥉', '📚', '✨', '🎯'];

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Create New Badge</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Icon</label>
          <div className="flex gap-2 mt-1">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFormData({ ...formData, icon: emoji })}
                className={`p-2 rounded-md ${
                  formData.icon === emoji ? 'bg-indigo-100' : 'hover:bg-gray-100'
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            rows={3}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Create Badge
        </button>
      </div>
    </form>
  );
}