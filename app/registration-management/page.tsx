'use client';

import { RegistrationManagement } from '@/components/RegistrationManagement';
import { useAuthStore } from '@/store/authStore';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useEffect } from 'react';

export default function RegistrationManagementPage() {
  const { user, isAdmin } = useAuthStore();
  const { showUnauthorized } = useUnauthorized();

  useEffect(() => {
    if (user && !isAdmin()) {
      showUnauthorized();
    }
  }, [user, isAdmin, showUnauthorized]);

  if (!user || !isAdmin()) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <RegistrationManagement />
    </div>
  );
} 