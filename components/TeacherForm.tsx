'use client';

import { useState } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { Teacher } from '@/types/school';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/Toast';

const ROLES = [
  'Teacher',
  'Assistant',
  'Executive',
  'Staff',
  'Administrator'
];

export function TeacherForm({ editTeacher, onUpdate, onCancel }: { editTeacher?: Teacher; onUpdate?: () => void; onCancel?: () => void }) {
  const addTeacher = useSchoolStore((state) => state.addTeacher);
  const updateTeacher = useSchoolStore((state) => state.updateTeacher);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<Partial<Teacher>>(
    editTeacher || {
      name: '',
      address: '',
      dateOfBirth: '',
      placeOfBirth: '',
      phone: '',
      joinDate: '',
      gender: 'Ikhwan',
      status: true,
      roles: [],
      username: '',
      password: '',
      email: ''
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }

    setIsSubmitting(true);

    try {
      if (editTeacher) {
        // Ensure we have all required fields including email
        // If password is empty, keep the existing password (don't include it in the update)
        const teacherData: Teacher = {
          ...editTeacher,
          ...formData,
          email: formData.email || editTeacher.email || '',
          // Only include password if it was actually provided (not empty)
          password: (formData.password && formData.password.trim() !== '') 
            ? formData.password 
            : editTeacher.password // Keep existing password if not changed
        } as Teacher;

        await updateTeacher(teacherData);
        await loadTeachers(); // Reload teachers list to get latest data
        toast.success('Successfully updated teacher data. You can return to teacher lists.');
        onUpdate?.(); // Close edit form
      } else {
        if (!formData.email) {
          toast.error('Email is required');
          setIsSubmitting(false);
          return;
        }
        if (!formData.password) {
          toast.error('Password is required');
          setIsSubmitting(false);
          return;
        }
        
        await addTeacher(
          formData as Omit<Teacher, 'id' | 'createdAt' | 'roles'>,
          formData.roles || []
        );
        toast.success('Teacher added successfully');
        setFormData({
          name: '',
          address: '',
          dateOfBirth: '',
          placeOfBirth: '',
          phone: '',
          joinDate: '',
          gender: 'Ikhwan',
          status: true,
          roles: [],
          username: '',
          password: '',
          email: ''
        });
        await loadTeachers(); // Reload teachers list
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update teacher';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (onUpdate) {
      onUpdate(); // If no cancel handler, use update handler to close form
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const value = e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const handleRoleToggle = (role: string) => {
    const currentRoles = formData.roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    setFormData({
      ...formData,
      roles: newRoles
    });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">
        {editTeacher ? 'Edit Teacher' : 'Add New Teacher'}
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            name="gender"
            value={formData.gender}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          >
            <option value="Ikhwan">Ikhwan</option>
            <option value="Akhwat">Akhwat</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
          <input
            type="date"
            name="dateOfBirth"
            value={formData.dateOfBirth}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Place of Birth</label>
          <input
            type="text"
            name="placeOfBirth"
            value={formData.placeOfBirth}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Join Date</label>
          <input
            type="date"
            name="joinDate"
            value={formData.joinDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password || ''}
            onChange={handleChange}
            placeholder={editTeacher ? "Leave empty to keep current password" : ""}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required={!editTeacher}
          />
          {editTeacher && (
            <p className="mt-1 text-xs text-gray-500">Leave empty to keep current password</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
          <div className="space-y-2">
            {ROLES.map((role) => (
              <label key={role} className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.roles?.includes(role)}
                  onChange={() => handleRoleToggle(role)}
                  className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
                <span className="ml-2 text-sm text-gray-700">{role}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="status"
            checked={formData.status}
            onChange={handleChange}
            className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          />
          <label className="ml-2 block text-sm font-medium text-gray-700">
            Active
          </label>
        </div>
        <div className="flex gap-3">
          {editTeacher && (
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              disabled={isSubmitting}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className={`flex-1 bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : editTeacher ? 'Update Teacher' : 'Add Teacher'}
          </button>
        </div>
      </div>
    </form>
  );
}