'use client';

import { useState } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';
import { Badge } from '@/types/student';
import { useStore } from '@/store/useStore';

export function BadgeForm({ editBadge, onUpdate }: { editBadge?: any; onUpdate?: () => void }) {
  const addBadge = useSchoolStore((state) => state.addBadge);
  const updateBadge = useSchoolStore((state) => state.updateBadge);
  const [formData, setFormData] = useState<Partial<Badge>>(editBadge || {
    icon: '🏆',
    description: ''
  });
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    if (editBadge) {
      if (formData.id && formData.icon && formData.description) {
        await updateBadge({
          id: formData.id,
          icon: formData.icon,
          description: formData.description
        });
      } else {
        alert('Badge ID, icon, and description are required for update.');
        return;
      }
    } else {
      if (formData.icon && formData.description) {
        await addBadge({
          icon: formData.icon,
          description: formData.description
        });
        await useStore.getState().loadInitialData();
      } else {
        alert('Icon, and description are required.');
        return;
      }
    }
    onUpdate?.();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const emojis = ['🏆', '⭐', '🌟', '🎖️', '🥇', '🥈', '🥉', '📚', '✨', '🎯', '🏅', '🌕', '🚀'];

  return (
    <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
      <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Create New Badge</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Icon</label>
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-13 gap-2 mt-1">
            {emojis.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFormData({ ...formData, icon: emoji })}
                className={`p-2 rounded-md text-lg sm:text-xl ${
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