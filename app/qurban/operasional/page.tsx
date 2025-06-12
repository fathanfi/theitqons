'use client';

import { useState, useEffect } from 'react';
import { QurbanOperasional as QurbanOperasionalBase, QurbanEdition } from '@/types/qurban';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OperasionalForm } from '@/components/qurban/operasional-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

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

export default function QurbanOperasionalPage() {
  const router = useRouter();
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [operasional, setOperasional] = useState<QurbanOperasional[]>([]);
  const [editions, setEditions] = useState<QurbanEdition[]>([]);
  const [selectedEdition, setSelectedEdition] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOperasional, setEditOperasional] = useState<QurbanOperasional | null>(null);

  useEffect(() => {
    checkAuth();
    fetchEditions();
    fetchOperasional();
  }, [selectedEdition]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth/login');
    }
  };

  const fetchEditions = async () => {
    try {
      const { data, error } = await supabase
        .from('qurban_editions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setEditions(data || []);
    } catch (error) {
      console.error('Error fetching editions:', error);
    }
  };

  const fetchOperasional = async () => {
    try {
      let query = supabase
        .from('qurban_operasional')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedEdition && selectedEdition !== 'all') {
        query = query.eq('qurban_edition_id', selectedEdition);
      }

      const { data, error } = await query;

      if (error) throw error;
      setOperasional(data || []);
    } catch (error) {
      console.error('Error fetching operasional:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: QurbanOperasional['status']) => {
    switch (status) {
      case 'in_progress':
        return 'bg-yellow-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatAmount = (total: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(total);
  };

  const calculateBudgetProgress = (budget: number, reality: number) => {
    return (reality / budget) * 100;
  };

  const handleSuccess = () => {
    setOpen(false);
    setEditOperasional(null);
    fetchOperasional();
  };

  const handleEditClick = (item: QurbanOperasional) => {
    if (!isAdmin) {
      showUnauthorized();
      return;
    }
    setEditOperasional(item);
    setOpen(true);
  };

  const handleAddClick = () => {
    if (!isAdmin) {
      showUnauthorized();
      return;
    }
    setEditOperasional(null);
    setOpen(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Qurban Operasional</h1>
        <div className="flex items-center gap-4">
          <div className="w-[200px]">
            <Select defaultValue="all" onValueChange={setSelectedEdition}>
              <SelectTrigger>
                <SelectValue placeholder="Select Edition" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Editions</SelectItem>
                {editions.map((edition) => (
                  <SelectItem key={edition.id} value={edition.id}>
                    {edition.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Dialog open={open} onOpenChange={(newOpen) => {
            if (!newOpen) {
              setOpen(false);
              return;
            }
            if (!isAdmin) {
              showUnauthorized();
              return;
            }
            setOpen(true);
          }}>
            <DialogTrigger asChild>
              <Button>Add New Operasional</Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editOperasional ? 'Edit Operasional' : 'Add Operasional'}</DialogTitle>
              </DialogHeader>
              <OperasionalForm 
                initialData={editOperasional || undefined} 
                onSuccess={handleSuccess} 
                onCancel={() => setOpen(false)}
                editions={editions}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {operasional.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{item.name}</CardTitle>
                <Badge className={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleEditClick(item)}>Edit</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">Budget Progress</p>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                    <div
                      className={`h-2 rounded-full ${item.reality / item.budget <= 1 ? 'bg-green-500' : 'bg-red-500'}`}
                      style={{ width: `${Math.min(100, (item.reality / item.budget) * 100)}%` }}
                    />
                  </div>
                  <div className="text-xs text-gray-500 mb-2">{((item.reality / item.budget) * 100).toFixed(1)}%</div>
                </div>

                <div className="space-y-2">
                  <p>
                    <span className="font-semibold">Edition:</span>{' '}
                    {editions.find(e => e.id === item.qurban_edition_id)?.name || 'Unknown Edition'}
                  </p>
                  <p>
                    <span className="font-semibold">Budget:</span>{' '}
                    {formatAmount(item.budget)}
                  </p>
                  <p>
                    <span className="font-semibold">Reality:</span>{' '}
                    {formatAmount(item.reality)}
                  </p>
                  {item.description && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Description:</p>
                      <div className="bg-gray-50 rounded-lg p-3 max-h-[400px] overflow-y-auto pr-2">
                        <div className="space-y-4">
                          {item.description.split('\n\n').map((section, sectionIndex) => {
                            const lines = section.split('\n');
                            const firstLine = lines[0].trim();
                            const isListCheckSection = firstLine.toLowerCase().includes('[lists-check]');
                            const isListSection = firstLine.toLowerCase().includes('[lists]');
                            
                            if (isListCheckSection || isListSection) {
                              // Extract the title from the first line
                              const title = firstLine.replace(/\[lists(-check)?\]/i, '').trim();
                              return (
                                <div key={sectionIndex} className="space-y-2">
                                  <p className="font-medium text-gray-700">
                                    {isListCheckSection ? 'Checklist' : 'List'}{title ? ` of ${title}` : ''}
                                  </p>
                                  <div className="grid grid-cols-3 gap-2 text-sm max-h-[80px] overflow-y-auto pr-2">
                                    {lines.slice(1).map((line, index) => {
                                      const name = line.trim();
                                      if (!name) return null;
                                      return (
                                        <div key={index} className="flex items-baseline gap-1 text-left">
                                          {isListCheckSection ? (
                                            <span className="text-green-500 flex-shrink-0">✅</span>
                                          ) : (
                                            <span className="text-gray-500 font-medium flex-shrink-0">{index + 1}.</span>
                                          )}
                                          <span className="whitespace-pre-line text-left">{name}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            } else {
                              return (
                                <div key={sectionIndex} className="text-sm text-gray-600 whitespace-pre-line">
                                  {section}
                                </div>
                              );
                            }
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Detail Pengeluaran Section */}
                {Array.isArray(item.expense) && item.expense.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-bold mb-2">Detail Pengeluaran</p>
                    <div className="overflow-x-auto max-h-[150px] overflow-y-auto">
                      <table className="min-w-full border text-xs">
                        <thead>
                          <tr className="bg-gray-100">
                            <th className="border px-2 py-1">No</th>
                            <th className="border px-2 py-1">Name</th>
                            <th className="border px-2 py-1">Unit Price</th>
                            <th className="border px-2 py-1">Qty</th>
                            <th className="border px-2 py-1">Total Price</th>
                            <th className="border px-2 py-1">Store</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.expense.map((row, idx) => (
                            <tr key={idx}>
                              <td className="border px-2 py-1 text-center">{idx + 1}</td>
                              <td className="border px-2 py-1">{row.name}</td>
                              <td className="border px-2 py-1">{formatAmount(row.unit_price)}</td>
                              <td className="border px-2 py-1 text-center">{row.qty}</td>
                              <td className="border px-2 py-1">{formatAmount(row.total_price)}</td>
                              <td className="border px-2 py-1">{row.store}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {/* Total Expense */}
                    <div className="text-right font-bold mt-2">
                      Total Expense: {item.expense && item.expense.length > 0 ? formatAmount(item.expense.reduce((sum, row) => sum + (row.total_price || 0), 0)) : '-'}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 