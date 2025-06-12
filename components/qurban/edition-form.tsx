'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { QurbanEdition as QurbanEditionBase } from '@/types/qurban';
import { useAuthStore } from '@/store/authStore';

interface QurbanEdition extends QurbanEditionBase {
  gallery_url?: string;
}

interface EditionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: QurbanEdition;
}

type EditionStatus = 'draft' | 'active' | 'completed' | 'cancelled';

export function EditionForm({ onSuccess, onCancel, initialData }: EditionFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    status: (initialData?.status || 'draft') as EditionStatus,
    start: initialData?.start ? new Date(initialData.start).toISOString().split('T')[0] : '',
    end: initialData?.end ? new Date(initialData.end).toISOString().split('T')[0] : '',
    gallery_url: initialData?.gallery_url || '',
  });

  const { user } = useAuthStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      console.error('User not authenticated');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase
        .from('qurban_editions')
        .upsert({
          ...(initialData?.id && { id: initialData.id }),
          ...formData,
          start: new Date(formData.start).toISOString(),
          end: new Date(formData.end).toISOString(),
          gallery_url: formData.gallery_url,
        });

      if (error) throw error;
      onSuccess?.();
    } catch (error) {
      console.error('Error saving edition:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Name
        </label>
        <input
          type="text"
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status
        </label>
        <select
          id="status"
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: e.target.value as EditionStatus })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          required
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      <div>
        <label htmlFor="start" className="block text-sm font-medium text-gray-700">
          Start Date
        </label>
        <input
          type="date"
          id="start"
          value={formData.start}
          onChange={(e) => setFormData({ ...formData, start: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="end" className="block text-sm font-medium text-gray-700">
          End Date
        </label>
        <input
          type="date"
          id="end"
          value={formData.end}
          onChange={(e) => setFormData({ ...formData, end: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="gallery_url" className="block text-sm font-medium text-gray-700">
          Gallery URLs (comma separated)
        </label>
        <input
          type="text"
          id="gallery_url"
          value={formData.gallery_url}
          onChange={(e) => setFormData({ ...formData, gallery_url: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          placeholder="https://.../image1.jpeg,https://.../image2.jpeg"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
} 