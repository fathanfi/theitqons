'use client';

import { useAuthStore } from '@/store/authStore';
import { TeacherPasswordForm } from '@/components/TeacherPasswordForm';

export default function ProfilePage() {
  const { user } = useAuthStore();

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Profile Settings</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Account Information</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Name</label>
            <div className="mt-1 text-gray-900">{user?.name}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <div className="mt-1 text-gray-900">{user?.email}</div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Role</label>
            <div className="mt-1 text-gray-900 capitalize">{user?.role}</div>
          </div>
        </div>
      </div>

      {user?.role === 'teacher' && (
        <TeacherPasswordForm />
      )}
    </div>
  );
} 