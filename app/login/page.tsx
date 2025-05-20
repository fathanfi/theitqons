'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      let authUser;
      let userRole = 'user'; // Default role
      let userName = '';

      // If username is provided, try to authenticate as a teacher
      if (username) {
        const { data: teacher, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('username', username)
          .eq('password', password)
          .single();

        if (teacherError || !teacher) {
          setError('Invalid username or password');
          setIsLoading(false);
          return;
        }

        userName = teacher.name;

        // Try to sign in with teacher's email
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: teacher.email,
          password: teacher.password,
        });

        if (authError) {
          // If auth fails, try to create a new auth user
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: teacher.email,
            password: teacher.password,
            options: {
              data: {
                name: teacher.name
              }
            }
          });

          if (signUpError || !signUpData.user) {
            setError('Failed to create authentication for teacher');
            setIsLoading(false);
            return;
          }

          authUser = signUpData.user;
        } else {
          authUser = authData.user;
        }

        userRole = 'teacher';

        // Assign teacher role using the function
        const { error: roleError } = await supabase
          .rpc('assign_user_role', {
            p_role_name: 'teacher',
            p_user_id: authUser.id
          });

        if (roleError) {
          console.error('Error setting user role:', roleError);
          setError('Failed to set user role');
          setIsLoading(false);
          return;
        }

        // Update auth store
        useAuthStore.setState({
          user: {
            id: authUser.id,
            email: teacher.email,
            role: 'teacher',
            name: userName
          },
          loading: false
        });

      } else {
        // Regular email login through Supabase auth
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (authError || !authData.user) {
          setError('Invalid email or password');
          setIsLoading(false);
          return;
        }

        authUser = authData.user;

        // Check if this email belongs to a teacher
        const { data: teacherData, error: teacherError } = await supabase
          .from('teachers')
          .select('*')
          .eq('email', email)
          .single();

        if (teacherData) {
          // This is a teacher
          userName = teacherData.name;
          userRole = 'teacher';

          // Assign teacher role using the function
          const { error: roleError } = await supabase
            .rpc('assign_user_role', {
              p_role_name: 'teacher',
              p_user_id: authUser.id
            });

          if (roleError) {
            console.error('Error setting user role:', roleError);
            setError('Failed to set user role');
            setIsLoading(false);
            return;
          }
        } else {
          // Regular user
          userName = authUser.user_metadata.name || '';

          // Get user role
          const { data: roleData, error: roleError } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', authUser.id)
            .single();

          if (roleError) {
            // If no role exists, create one using the function
            const { error: createRoleError } = await supabase
              .rpc('assign_user_role', {
                p_role_name: 'user',
                p_user_id: authUser.id
              });

            if (createRoleError) {
              console.error('Error creating user role:', createRoleError);
              setError('Failed to set user role');
              setIsLoading(false);
              return;
            }

            userRole = 'user';
          } else {
            userRole = roleData.role;
          }
        }

        // Update auth store
        useAuthStore.setState({
          user: {
            id: authUser.id,
            email: authUser.email!,
            role: userRole as 'admin' | 'user' | 'teacher',
            name: userName
          },
          loading: false
        });
      }

      router.push('/');
    } catch (err) {
      console.error('Login error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">Email address</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="username" className="sr-only">Username</label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Username (for teachers)"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="password" className="sr-only">Password</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">{error}</div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}