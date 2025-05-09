import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import Cookies from 'js-cookie';

interface AuthState {
  isAuthenticated: boolean;
  login: (password: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      login: async (password: string) => {
        if (password === 'itqon2025') {
          Cookies.set('auth', 'true', { 
            expires: 7,
            path: '/',
            sameSite: 'lax'
          });
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },
      logout: () => {
        Cookies.remove('auth', { path: '/' });
        set({ isAuthenticated: false });
      },
      checkAuth: () => {
        const auth = Cookies.get('auth');
        const isAuthenticated = auth === 'true';
        set({ isAuthenticated });
        return isAuthenticated;
      }
    }),
    {
      name: 'auth-storage',
    }
  )
); 