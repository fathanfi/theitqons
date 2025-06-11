'use client';

import { QurbanAnimal } from '@/types/qurban';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface AnimalListProps {
  animals: QurbanAnimal[];
  onEdit?: (animal: QurbanAnimal) => void;
}

export function AnimalList({ animals, onEdit }: AnimalListProps) {
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

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {animals.map((animal) => (
        <Card key={animal.id}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle>{animal.name}</CardTitle>
              <Badge className={getStatusColor(animal.status)}>{animal.status}</Badge>
            </div>
            {onEdit && (
              <button className="text-xs underline" onClick={() => onEdit(animal)}>
                Edit
              </button>
            )}
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p>
                <span className="font-semibold">Type:</span> {animal.type}
              </p>
              <p>
                <span className="font-semibold">For Whom:</span> {animal.for_whom}
              </p>
              <p>
                <span className="font-semibold">Location:</span> {animal.location}
              </p>
              <p>
                <span className="font-semibold">Price:</span> {animal.price}
              </p>
              <p className="text-sm text-gray-600">{animal.description}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
} 