'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const isAuth = checkAuth();
    if (!isAuth && pathname !== '/login') {
      router.push('/login');
    }
  }, [pathname, checkAuth, router]);

  if (!isAuthenticated && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}