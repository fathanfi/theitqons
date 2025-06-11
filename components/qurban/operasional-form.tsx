'use client';

import { useState } from 'react';
import { QurbanOperasional, QurbanEdition } from '@/types/qurban';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface OperasionalFormProps {
  initialData?: QurbanOperasional;
  onSuccess: () => void;
  onCancel: () => void;
  editions: QurbanEdition[];
}

export function OperasionalForm({ initialData, onSuccess, onCancel, editions }: OperasionalFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<QurbanOperasional>>({
    name: initialData?.name || '',
    description: initialData?.description || '',
    budget: initialData?.budget || 0,
    reality: initialData?.reality || 0,
    status: initialData?.status || 'in_progress',
    qurban_edition_id: initialData?.qurban_edition_id || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        setError('User not authenticated');
        router.push('/auth/login');
        return;
      }

      if (initialData?.id) {
        const { error: updateError } = await supabase
          .from('qurban_operasional')
          .update(formData)
          .eq('id', initialData.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('qurban_operasional')
          .insert([formData]);

        if (insertError) throw insertError;
      }

      onSuccess();
    } catch (err) {
      console.error('Error saving operasional:', err);
      setError(err instanceof Error ? err.message : 'An error occurred while saving');
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

      <div className="grid grid-cols-3 gap-4">
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
          <Label htmlFor="budget">Budget</Label>
          <Input
            id="budget"
            type="number"
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reality">Reality</Label>
          <Input
            id="reality"
            type="number"
            value={formData.reality}
            onChange={(e) => setFormData({ ...formData, reality: Number(e.target.value) })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData({ ...formData, status: value as QurbanOperasional['status'] })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="edition">Edition</Label>
          <Select
            value={formData.qurban_edition_id}
            onValueChange={(value) => setFormData({ ...formData, qurban_edition_id: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select edition" />
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
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
          className="min-h-[200px]"
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : initialData ? 'Update' : 'Save'}
        </Button>
      </div>
    </form>
  );
} 