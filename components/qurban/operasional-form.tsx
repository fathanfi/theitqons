'use client';

import { useState } from 'react';
import { QurbanOperasional as QurbanOperasionalBase, QurbanEdition } from '@/types/qurban';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';

// Extend QurbanOperasional to include optional expense for local use
interface QurbanOperasional extends QurbanOperasionalBase {
  expense?: {
    name: string;
    unit_price: number;
    qty: number;
    total_price: number;
    store: string;
  }[];
}

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

  const [expense, setExpense] = useState<{
    name: string;
    unit_price: number;
    qty: number;
    total_price: number;
    store: string;
  }[]>(initialData?.expense || []);

  // Helper to add a new expense row
  const addExpense = () => {
    setExpense([
      ...expense,
      { name: '', unit_price: 0, qty: 1, total_price: 0, store: '' },
    ]);
  };

  // Helper to remove an expense row
  const removeExpense = (idx: number) => {
    setExpense(expense.filter((_, i) => i !== idx));
  };

  // Helper to update an expense row
  const updateExpense = (idx: number, key: string, value: any) => {
    setExpense(expense.map((row, i) =>
      i === idx
        ? {
            ...row,
            [key]: value,
            total_price:
              key === 'unit_price' || key === 'qty'
                ? (key === 'unit_price'
                    ? value
                    : row.unit_price) * (key === 'qty' ? value : row.qty)
                : row.unit_price * row.qty,
          }
        : row
    ));
  };

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

      const payload = { ...formData, expense };
      if (initialData?.id) {
        const { error: updateError } = await supabase
          .from('qurban_operasional')
          .update(payload)
          .eq('id', initialData.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('qurban_operasional')
          .insert([payload]);

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

      {/* Pengeluaran Section */}
      <div className="space-y-2">
        <Label className="font-bold">Pengeluaran</Label>
        <div className="overflow-x-auto">
          <table className="min-w-full border text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="border px-2 py-1">No</th>
                <th className="border px-2 py-1">Name</th>
                <th className="border px-2 py-1">Unit Price</th>
                <th className="border px-2 py-1">Qty</th>
                <th className="border px-2 py-1">Total Price</th>
                <th className="border px-2 py-1">Store</th>
                <th className="border px-2 py-1"></th>
              </tr>
            </thead>
            <tbody>
              {expense.map((row, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1 text-center">{idx + 1}</td>
                  <td className="border px-2 py-1">
                    <Input
                      value={row.name}
                      onChange={e => updateExpense(idx, 'name', e.target.value)}
                      placeholder="Name"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <Input
                      type="number"
                      value={row.unit_price}
                      onChange={e => updateExpense(idx, 'unit_price', Number(e.target.value))}
                      placeholder="Unit Price"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <Input
                      type="number"
                      value={row.qty}
                      onChange={e => updateExpense(idx, 'qty', Number(e.target.value))}
                      placeholder="Qty"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <Input
                      type="number"
                      value={row.total_price}
                      readOnly
                      className="bg-gray-50"
                    />
                  </td>
                  <td className="border px-2 py-1">
                    <Input
                      value={row.store}
                      onChange={e => updateExpense(idx, 'store', e.target.value)}
                      placeholder="Store"
                    />
                  </td>
                  <td className="border px-2 py-1 text-center">
                    <Button type="button" size="sm" variant="destructive" onClick={() => removeExpense(idx)}>-</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Button type="button" size="sm" className="mt-2" onClick={addExpense}>+ Add Pengeluaran</Button>
        </div>
        {/* Total Expense */}
        <div className="text-right font-bold mt-2">
          Total Expense: {expense && expense.length > 0 ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(expense.reduce((sum, row) => sum + (row.total_price || 0), 0)) : '-'}
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