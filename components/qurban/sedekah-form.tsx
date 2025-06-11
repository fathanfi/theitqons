'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { QurbanSedekah, QurbanEdition } from '@/types/qurban';
import { useAuthStore } from '@/store/authStore';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

interface SedekahFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: QurbanSedekah;
  editions: QurbanEdition[];
}

type SedekahStatus = 'pending' | 'approved' | 'rejected' | 'completed';

export function SedekahForm({ onSuccess, onCancel, initialData, editions }: SedekahFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    from_who: initialData?.from_who || '',
    via: initialData?.via || '',
    qurban_edition_id: initialData?.qurban_edition_id || '',
    total: initialData?.total || 0,
    status: initialData?.status || 'pending',
    donate_date: initialData?.donate_date || new Date().toISOString().split('T')[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!user) {
      console.error('User not authenticated');
      router.push('/auth/login');
      return;
    }

    try {
      if (initialData) {
        const { error } = await supabase
          .from('qurban_sedekah')
          .update({
            name: formData.name,
            from_who: formData.from_who,
            via: formData.via,
            qurban_edition_id: formData.qurban_edition_id,
            total: formData.total,
            status: formData.status,
            donate_date: formData.donate_date,
          })
          .eq('id', initialData.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('qurban_sedekah')
          .insert({
            name: formData.name,
            from_who: formData.from_who,
            via: formData.via,
            qurban_edition_id: formData.qurban_edition_id,
            total: formData.total,
            status: formData.status,
            donate_date: formData.donate_date,
          });

        if (error) throw error;
      }

      onSuccess?.();
    } catch (error) {
      console.error('Error saving sedekah:', error);
      setError(error instanceof Error ? error.message : 'An error occurred while saving');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded relative" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="from_who">From</Label>
        <Input
          id="from_who"
          value={formData.from_who}
          onChange={(e) => setFormData({ ...formData, from_who: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="via">Via</Label>
        <Input
          id="via"
          value={formData.via}
          onChange={(e) => setFormData({ ...formData, via: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="total">Total</Label>
        <Input
          id="total"
          type="number"
          value={formData.total}
          onChange={(e) => setFormData({ ...formData, total: Number(e.target.value) })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="donate_date">Donate Date</Label>
        <Input
          id="donate_date"
          type="date"
          value={formData.donate_date}
          onChange={(e) => setFormData({ ...formData, donate_date: e.target.value })}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={formData.status}
          onValueChange={(value: string) => setFormData({ ...formData, status: value as QurbanSedekah['status'] })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="edition">Qurban Edition</Label>
        <Select
          value={formData.qurban_edition_id}
          onValueChange={(value: string) => setFormData({ ...formData, qurban_edition_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Edition" />
          </SelectTrigger>
          <SelectContent>
            {editions.map((edition) => (
              <SelectItem key={edition.id} value={edition.id}>
                {edition.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update' : 'Create'} Sedekah
        </Button>
      </div>
    </form>
  );
} 