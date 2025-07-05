'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { RouteLoader } from './RouteLoader';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, loading, signIn } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Get user role
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        if (roleData) {
          useAuthStore.setState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              role: roleData.role as 'admin' | 'user' | 'teacher',
              name: session.user.user_metadata.name || ''
            },
            loading: false,
          });
        }
      } else {
        useAuthStore.setState({ loading: false });
      }
    };

    checkSession();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        useAuthStore.setState({ user: null, loading: false });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Define public routes that don't require authentication
  const publicRoutes = ['/login', '/register'];

  useEffect(() => {
    if (!loading && !user && !publicRoutes.includes(pathname)) {
      router.push('/login');
    }
  }, [pathname, user, loading, router]);

  if (loading) {
    return <RouteLoader />;
  }

  if (!user && !publicRoutes.includes(pathname)) {
    return null;
  }

  return <>{children}</>;
}