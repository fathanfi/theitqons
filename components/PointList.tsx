'use client';

import { useState, useEffect } from 'react';
import { usePointsStore } from '@/store/pointsStore';
import { Point } from '@/types/points';
import { PointForm } from './PointForm';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

export function PointList() {
  const points = usePointsStore((state) => state.points);
  const loadPoints = usePointsStore((state) => state.loadPoints);
  const deletePoint = usePointsStore((state) => state.deletePoint);
  const [editingPoint, setEditingPoint] = useState<Point | null>(null);
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  const handleEdit = (point: Point) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    setEditingPoint(point);
  };

  const handleDelete = (pointId: string) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    deletePoint(pointId);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Points List</h2>
      {editingPoint && (
        <div className="mb-6">
          <PointForm 
            editPoint={editingPoint} 
            onUpdate={() => setEditingPoint(null)} 
          />
        </div>
      )}
      <div className="space-y-4">
        {points.map((point) => (
          <div key={point.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{point.name}</h3>
                {point.description && (
                  <p className="text-sm text-gray-500">{point.description}</p>
                )}
                <p className="text-sm font-medium text-indigo-600">
                  {point.point} points
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(point)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(point.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {points.length === 0 && (
          <p className="text-gray-500 text-center">No points added yet.</p>
        )}
      </div>
    </div>
  );
}