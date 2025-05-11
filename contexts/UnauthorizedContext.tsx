'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { UnauthorizedModal } from '@/components/UnauthorizedModal';

interface UnauthorizedContextType {
  showUnauthorized: () => void;
}

const UnauthorizedContext = createContext<UnauthorizedContextType>({ showUnauthorized: () => {} });

export function useUnauthorized() {
  return useContext(UnauthorizedContext);
}

export function UnauthorizedProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  const showUnauthorized = () => setOpen(true);
  const handleClose = () => setOpen(false);

  return (
    <UnauthorizedContext.Provider value={{ showUnauthorized }}>
      {children}
      <UnauthorizedModal open={open} onClose={handleClose} />
    </UnauthorizedContext.Provider>
  );
} 