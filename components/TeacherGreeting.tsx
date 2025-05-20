'use client';

import { useAuthStore } from '@/store/authStore';

export function TeacherGreeting() {
  const { user } = useAuthStore();

  if (!user || user.role !== 'teacher') {
    return null;
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow-lg mb-6">
      <h1 className="text-2xl font-semibold text-gray-800">
        Assalamualaikum {user.name}
      </h1>
    </div>
  );
} 