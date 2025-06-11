'use client';

import { useState, useEffect } from 'react';
import { QurbanEdition } from '@/types/qurban';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { EditionForm } from '@/components/qurban/edition-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function QurbanEditionsPage() {
  const [editions, setEditions] = useState<QurbanEdition[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const [open, setOpen] = useState(false);
  const [editEdition, setEditEdition] = useState<QurbanEdition | null>(null);

  useEffect(() => {
    fetchEditions();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: QurbanEdition['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const handleSuccess = () => {
    setOpen(false);
    setEditEdition(null);
    fetchEditions();
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Qurban Editions</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditEdition(null); setOpen(true); }}>Create New Edition</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editEdition ? 'Edit Edition' : 'Create Edition'}</DialogTitle>
            </DialogHeader>
            <EditionForm initialData={editEdition || undefined} onSuccess={handleSuccess} onCancel={() => setOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {editions.map((edition) => (
          <Card key={edition.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{edition.name}</CardTitle>
                <Badge className={getStatusColor(edition.status)}>
                  {edition.status}
                </Badge>
              </div>
              <Button size="sm" variant="outline" onClick={() => { setEditEdition(edition); setOpen(true); }}>Edit</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Start:</span>{' '}
                  {format(new Date(edition.start), 'PPP')}
                </p>
                <p>
                  <span className="font-semibold">End:</span>{' '}
                  {format(new Date(edition.end), 'PPP')}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 