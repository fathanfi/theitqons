'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { usePathname, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getTeacherRoleNames, resolveAuthRoleFromTeacherRoles } from '@/lib/teacherRoles';
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
        const { data: roleData } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single();

        const { data: teacherData } = await supabase
          .from('teachers')
          .select('*, teacher_roles(role)')
          .eq('email', session.user.email!)
          .maybeSingle();

        let role = roleData?.role as 'admin' | 'user' | 'teacher' | undefined;
        let name = session.user.user_metadata.name || '';

        if (teacherData) {
          name = teacherData.name || name;
          const teacherRoleNames = getTeacherRoleNames(teacherData.teacher_roles);
          const resolvedRole = resolveAuthRoleFromTeacherRoles(teacherRoleNames, teacherData.username);
          role = resolvedRole;

          if (roleData?.role !== resolvedRole) {
            await supabase.rpc('assign_user_role', {
              p_role_name: resolvedRole,
              p_user_id: session.user.id,
            });
          }
        }

        if (role) {
          useAuthStore.setState({
            user: {
              id: session.user.id,
              email: session.user.email!,
              role,
              name,
            },
            loading: false,
          });
        } else {
          useAuthStore.setState({ loading: false });
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