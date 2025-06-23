'use client';

import { useEffect } from 'react';
import { BadgeForm } from '@/components/BadgeForm';
import { BadgeList } from '@/components/BadgeList';
import { StudentBadgesTable } from '@/components/StudentBadgesTable';
import { useStore } from '@/store/useStore';

export default function BadgesPage() {
  const loadInitialData = useStore((state) => state.loadInitialData);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Badge Management</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <BadgeForm />
        <BadgeList />
      </div>
      <StudentBadgesTable />
    </div>
  );
}