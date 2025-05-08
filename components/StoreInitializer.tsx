'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

export function StoreInitializer({ children }: { children: React.ReactNode }) {
  const loadInitialData = useStore(state => state.loadInitialData);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  return <>{children}</>;
}