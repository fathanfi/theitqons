'use client';

import { useState, useEffect } from 'react';
import { QurbanSedekah, QurbanEdition } from '@/types/qurban';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SedekahForm } from '@/components/qurban/sedekah-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';

export default function QurbanSedekahPage() {
  const [sedekah, setSedekah] = useState<QurbanSedekah[]>([]);
  const [editions, setEditions] = useState<QurbanEdition[]>([]);
  const [selectedEdition, setSelectedEdition] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editionLoading, setEditionLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editSedekah, setEditSedekah] = useState<QurbanSedekah | null>(null);

  useEffect(() => {
    fetchEditions();
    fetchSedekah();
  }, [selectedEdition]);

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

  const fetchSedekah = async () => {
    try {
      setEditionLoading(true);
      let query = supabase
        .from('qurban_sedekah')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedEdition && selectedEdition !== 'all') {
        query = query.eq('qurban_edition_id', selectedEdition);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSedekah(data || []);
    } catch (error) {
      console.error('Error fetching sedekah:', error);
    } finally {
      setLoading(false);
      setEditionLoading(false);
    }
  };

  const getStatusColor = (status: QurbanSedekah['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'rejected':
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

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleSuccess = () => {
    setOpen(false);
    setEditSedekah(null);
    fetchSedekah();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Qurban Sedekah</h1>
        <div className="flex items-center gap-4">
          <div className="w-[200px]">
            <Select defaultValue="all" onValueChange={setSelectedEdition}>
              <SelectTrigger className="bg-white cursor-pointer">
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
            {editionLoading && (
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            )}
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditSedekah(null); setOpen(true); }}>Add New Sedekah</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editSedekah ? 'Edit Sedekah' : 'Add Sedekah'}</DialogTitle>
              </DialogHeader>
              <SedekahForm 
                initialData={editSedekah || undefined} 
                onSuccess={handleSuccess} 
                onCancel={() => setOpen(false)}
                editions={editions}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sedekah.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{item.name}</CardTitle>
                <Badge className={getStatusColor(item.status)}>
                  {item.status}
                </Badge>
              </div>
              <Button size="sm" variant="outline" onClick={() => { setEditSedekah(item); setOpen(true); }}>Edit</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Edition:</span>{' '}
                  {editions.find(e => e.id === item.qurban_edition_id)?.name || 'Unknown Edition'}
                </p>
                <p>
                  <span className="font-semibold">From:</span>{' '}
                  {item.from_who}
                </p>
                <p>
                  <span className="font-semibold">Via:</span>{' '}
                  {item.via}
                </p>
                <p>
                  <span className="font-semibold">Total:</span>{' '}
                  {formatAmount(item.total)}
                </p>
                <p>
                  <span className="font-semibold">Date:</span>{' '}
                  {formatDate(item.donate_date)}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 