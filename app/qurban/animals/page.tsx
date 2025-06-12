'use client';

import { useState, useEffect } from 'react';
import { QurbanAnimal, QurbanEdition } from '@/types/qurban';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimalForm } from '@/components/qurban/animal-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

export default function QurbanAnimalsPage() {
  const router = useRouter();
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const [animals, setAnimals] = useState<QurbanAnimal[]>([]);
  const [editions, setEditions] = useState<QurbanEdition[]>([]);
  const [selectedEdition, setSelectedEdition] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [editionLoading, setEditionLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editAnimal, setEditAnimal] = useState<QurbanAnimal | null>(null);
  const [imagePopup, setImagePopup] = useState<{ open: boolean; url: string; name: string }>({
    open: false,
    url: '',
    name: '',
  });

  useEffect(() => {
    checkAuth();
    fetchEditions();
    fetchAnimals();
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

  const fetchAnimals = async () => {
    try {
      let query = supabase
        .from('qurban_animals')
        .select('*')
        .order('created_at', { ascending: false });

      if (selectedEdition && selectedEdition !== 'all') {
        query = query.eq('qurban_edition_id', selectedEdition);
      }

      const { data, error } = await query;

      if (error) throw error;
      setAnimals(data || []);
    } catch (error) {
      console.error('Error fetching animals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = () => {
    setOpen(false);
    setEditAnimal(null);
    fetchAnimals();
  };

  const getStatusColor = (status: QurbanAnimal['status']) => {
    switch (status) {
      case 'available':
        return 'bg-green-500';
      case 'reserved':
        return 'bg-yellow-500';
      case 'sold':
        return 'bg-blue-500';
      case 'slaughtered':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(price);
  };

  const handleEditionChange = async (value: string) => {
    setEditionLoading(true);
    setSelectedEdition(value);
    await fetchAnimals();
    setEditionLoading(false);
  };

  const handleEditClick = (animal: QurbanAnimal) => {
    if (!isAdmin) {
      showUnauthorized();
      return;
    }
    setEditAnimal(animal);
    setOpen(true);
  };

  const handleAddClick = () => {
    if (!isAdmin) {
      showUnauthorized();
      return;
    }
    setEditAnimal(null);
    setOpen(true);
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Hewan Qurban</h1>
        <div className="flex items-center gap-4">
          <div className="w-[200px]">
            <Select defaultValue="all" onValueChange={handleEditionChange}>
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
              <Button>Add New Animal</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editAnimal ? 'Edit Animal' : 'Add Animal'}</DialogTitle>
              </DialogHeader>
              <AnimalForm 
                initialData={editAnimal || undefined} 
                onSuccess={handleSuccess} 
                onCancel={() => setOpen(false)}
                editions={editions}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {animals.map((animal) => (
          <Card key={animal.id} className="relative">
            {animal.image_url && (
              <div 
                className="absolute top-2 right-2 w-20 h-20 rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                onClick={() => setImagePopup({ open: true, url: animal.image_url!, name: animal.name })}
              >
                <img 
                  src={animal.image_url} 
                  alt={animal.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle>{animal.name}</CardTitle>
                <Badge className={getStatusColor(animal.status)}>{animal.status}</Badge>
              </div>
              <Button size="sm" variant="outline" onClick={() => handleEditClick(animal)}>Edit</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p>
                  <span className="font-semibold">Type:</span> {animal.type}
                </p>
                <p>
                  <span className="font-semibold">Edition:</span>{' '}
                  {editions.find(e => e.id === animal.qurban_edition_id)?.name || 'Unknown Edition'}
                </p>
                <p>
                  <span className="font-semibold">Price:</span> {formatPrice(animal.price)}
                </p>
                <p>
                  <span className="font-semibold">Weight:</span> {animal.weight} kg
                </p>
                <p>
                  <span className="font-semibold">For Whom:</span> {animal.for_whom}
                </p>
                <p>
                  <span className="font-semibold">Location:</span> {animal.location}
                </p>
                <p className="text-sm text-gray-600 whitespace-pre-line">{animal.description}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={imagePopup.open} onOpenChange={(open) => setImagePopup(prev => ({ ...prev, open }))}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{imagePopup.name}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full aspect-video">
            <img 
              src={imagePopup.url} 
              alt={imagePopup.name}
              className="w-full h-full object-contain rounded-lg"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 