'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { Student } from '@/types/student';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

export function StudentForm({ 
  onSubmit, 
  initialData, 
  onCancel 
}: { 
  onSubmit: (studentData: Student) => Promise<void>;
  initialData?: Student | null;
  onCancel: () => void;
}) {
  const addStudent = useStore((state) => state.addStudent);
  const updateStudent = useStore((state) => state.updateStudent);
  
  const classes = useSchoolStore((state) => state.classes);
  const levels = useSchoolStore((state) => state.levels);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const loadLevels = useSchoolStore((state) => state.loadLevels);
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin' || user?.id === '8d32e5ad-df88-4132-b675-c0c4b9b36b52' || user?.id === '96ab64fd-0473-42c4-947c-dcb1393f39c3'; // Ayu Hana & Risman as Admin

  useEffect(() => {
    loadClasses();
    loadLevels();
  }, [loadClasses, loadLevels]);

  const [formData, setFormData] = useState<Partial<Student>>(
    initialData || {
      name: '',
      gender: 'Ikhwan',
      address: '',
      class_id: '',
      level_id: '',
      father_name: '',
      mother_name: '',
      wali_name: '',
      school_info: '',
      profileImageUrl: '',
      status: true,
      placeOfBirth: '',
      dateOfBirth: '',
      phoneNumber: '',
      lastAchievement: '',
      totalPages: 0,
      registration_number: '',
      national_id: '',
      family_id: '',
      joined_date: '',
      notes: '',
      badges: []
    }
  );

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        gender: initialData.gender || 'Ikhwan',
        address: initialData.address || '',
        class_id: initialData.class_id || '',
        level_id: initialData.level_id || '',
        father_name: initialData.father_name || '',
        mother_name: initialData.mother_name || '',
        wali_name: initialData.wali_name || '',
        school_info: initialData.school_info || '',
        profileImageUrl: initialData.profileImageUrl || '',
        status: initialData.status ?? true,
        placeOfBirth: initialData.placeOfBirth || '',
        dateOfBirth: initialData.dateOfBirth || '',
        phoneNumber: initialData.phoneNumber || '',
        lastAchievement: initialData.lastAchievement || '',
        totalPages: initialData.totalPages || 0,
        registration_number: initialData.registration_number || '',
        national_id: initialData.national_id || '',
        family_id: initialData.family_id || '',
        joined_date: initialData.joined_date || '',
        notes: initialData.notes || '',
        badges: initialData.badges || []
      });
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) {
      showUnauthorized();
      return;
    }
    const initials = getInitials(formData.name || '');
    const avatarType = formData.gender === 'Akhwat' ? 'lorelei' : 'avataaars';
    const profileImageUrl = `https://api.dicebear.com/7.x/${avatarType}/svg?seed=${encodeURIComponent(initials)}`;

    await onSubmit({
      ...formData,
      profileImageUrl
    } as Student);

    if (!initialData) {
      setFormData({
        name: '',
        placeOfBirth: '',
        dateOfBirth: '',
        phoneNumber: '',
        lastAchievement: '',
        totalPages: 0,
        gender: 'Ikhwan',
        address: '',
        class_id: '',
        level_id: '',
        father_name: '',
        mother_name: '',
        wali_name: '',
        school_info: '',
        status: true,
        profileImageUrl: '',
        registration_number: '',
        national_id: '',
        family_id: '',
        joined_date: '',
        notes: '',
        badges: []
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length === 1) return words[0].charAt(0);
    
    let initials = '';
    if (words[0].toLowerCase() === 'm.' || words[0].toLowerCase().startsWith('muhammad')) {
      initials = words.slice(1, 3).map(word => word.charAt(0)).join('');
    } else {
      initials = words.slice(0, 2).map(word => word.charAt(0)).join('');
    }
    
    return initials.toUpperCase();
  };

  return (
    <>
      <style>{`
        label,
        select,
        input,
        textarea,
        option {
          color: #222 !important;
        }
      `}</style>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {initialData ? 'Edit Student' : 'Add New Student'}
          </h2>
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        </div>
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
            {formData.name && (
              <p className="mt-1 text-sm text-gray-500">
                Avatar Initials: {getInitials(formData.name)}
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Place of Birth</label>
            <input
              type="text"
              name="placeOfBirth"
              value={formData.placeOfBirth}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
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
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="e.g., 08123456789"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
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
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Class</label>
            <select
              name="class_id"
              value={formData.class_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            >
              <option value="">Select Class</option>
              {classes.map(class_ => (
                <option key={class_.id} value={class_.id}>
                  {class_.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Level</label>
            <select
              name="level_id"
              value={formData.level_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              required
            >
              <option value="">Select Level</option>
              {levels
                .filter(level => level.status)
                .map(level => (
                  <option key={level.id} value={level.id}>
                    {level.name}
                  </option>
                ))
              }
            </select>
          </div>

          {/* Parent Information Section */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Parent Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Father's Name</label>
                <input
                  type="text"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Mother's Name</label>
                <input
                  type="text"
                  name="mother_name"
                  value={formData.mother_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Wali's Name</label>
                <input
                  type="text"
                  name="wali_name"
                  value={formData.wali_name}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">School Information</label>
                <textarea
                  name="school_info"
                  value={formData.school_info}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Achievement</label>
            <input
              type="text"
              name="lastAchievement"
              value={formData.lastAchievement}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter student's last achievement"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Total Pages</label>
            <input
              type="number"
              name="totalPages"
              value={formData.totalPages}
              onChange={handleChange}
              min="0"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter total pages completed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">NISP</label>
            <input
              type="text"
              name="registration_number"
              value={formData.registration_number}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter registration number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">NIK</label>
            <input
              type="text"
              name="national_id"
              value={formData.national_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter national ID number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">No. KK</label>
            <input
              type="text"
              name="family_id"
              value={formData.family_id}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter family ID number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Joined Date</label>
            <input
              type="date"
              name="joined_date"
              value={formData.joined_date}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              placeholder="Enter any additional notes"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="status"
              checked={formData.status}
              onChange={handleChange}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
              disabled={!isAdmin}
            />
            <label className="ml-2 block text-sm font-medium text-gray-700">
              Active
            </label>
          </div>
          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
          >
            {initialData ? 'Update Student' : 'Add Student'}
          </button>
        </div>
      </form>
    </>
  );
}