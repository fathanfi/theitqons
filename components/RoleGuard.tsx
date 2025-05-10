import { ReactNode } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { RouteLoader } from './RouteLoader';

interface RoleGuardProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function RoleGuard({ children, requireAdmin = false }: RoleGuardProps) {
  const { user, loading, isAdmin } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    } else if (!loading && requireAdmin && !isAdmin()) {
      router.push('/');
    }
  }, [user, loading, requireAdmin, isAdmin, router]);

  if (loading) {
    return <RouteLoader />;
  }

  if (!user || (requireAdmin && !isAdmin())) {
    return null;
  }

  return <>{children}</>;
} 