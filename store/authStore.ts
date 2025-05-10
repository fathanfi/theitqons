import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

export type UserRole = 'admin' | 'user';

interface User {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: () => boolean;
  canEdit: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      loading: true,

      signIn: async (email: string, password: string) => {
        try {
          console.log('Attempting to sign in with:', email);
          
          const { data: { user }, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            console.error('Auth error:', error);
            throw new Error(error.message);
          }

          if (!user) {
            console.error('No user returned from auth');
            throw new Error('No user found');
          }

          console.log('User authenticated:', user.id);

          // Get user role
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .single();

          if (roleError) {
            console.error('Role error:', roleError);
            throw new Error('Failed to get user role');
          }

          if (!roleData) {
            console.error('No role data found for user:', user.id);
            throw new Error('No role found for user');
          }

          console.log('User role found:', roleData.role);

          set({
            user: {
              id: user.id,
              email: user.email!,
              role: roleData.role as UserRole,
            },
            loading: false,
          });
        } catch (error) {
          console.error('Sign in error:', error);
          set({ loading: false });
          throw error;
        }
      },

      signOut: async () => {
        try {
          await supabase.auth.signOut();
          set({ user: null, loading: false });
        } catch (error) {
          console.error('Sign out error:', error);
          set({ loading: false });
          throw error;
        }
      },

      isAdmin: () => {
        const { user } = get();
        return user?.role === 'admin';
      },

      canEdit: () => {
        const { user } = get();
        return user?.role === 'admin';
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user }), // Only persist the user state
    }
  )
); 