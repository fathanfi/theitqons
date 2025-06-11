'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { QurbanMyQurban } from '@/types/qurban';
import { useAuthStore } from '@/store/authStore';

interface MyQurbanFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: QurbanMyQurban;
}

type MyQurbanStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export function MyQurbanForm({ onSuccess, onCancel, initialData }: MyQurbanFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    qurban_animal_id: initialData?.qurban_animal_id || '',
    qurban_edition_id: initialData?.qurban_edition_id || '',
    status: (initialData?.status || 'pending') as MyQurbanStatus,
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
        .from('qurban_my_qurban')
        .upsert({
          ...(initialData?.id && { id: initialData.id }),
          ...formData,
          user_id: user.id,
        });

      if (error) throw error;
      onSuccess?.();
    } catch (error) {
      console.error('Error saving my qurban:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="qurban_animal_id" className="block text-sm font-medium text-gray-700">
          Qurban Animal
        </label>
        <input
          type="text"
          id="qurban_animal_id"
          value={formData.qurban_animal_id}
          onChange={(e) => setFormData({ ...formData, qurban_animal_id: e.target.value })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          required
        />
      </div>

      <div>
        <label htmlFor="qurban_edition_id" className="block text-sm font-medium text-gray-700">
          Qurban Edition
        </label>
        <input
          type="text"
          id="qurban_edition_id"
          value={formData.qurban_edition_id}
          onChange={(e) => setFormData({ ...formData, qurban_edition_id: e.target.value })}
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
          onChange={(e) => setFormData({ ...formData, status: e.target.value as MyQurbanStatus })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
          required
        >
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
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