'use client';

import { useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { LevelBoard } from '@/components/LevelBoard';

export default function ItqonPage() {
  const loadLevels = useSchoolStore((state) => state.loadLevels);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Itqon Management</h1>
      <LevelBoard />
    </div>
  );
}