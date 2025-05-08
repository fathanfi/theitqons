'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { Student } from '@/types/student';

export function StudentForm({ editStudent, onUpdate }: { editStudent?: Student; onUpdate?: () => void }) {
  const addStudent = useStore((state) => state.addStudent);
  const updateStudent = useStore((state) => state.updateStudent);
  
  const classes = useSchoolStore((state) => state.classes);
  const levels = useSchoolStore((state) => state.levels);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const loadLevels = useSchoolStore((state) => state.loadLevels);

  useEffect(() => {
    loadClasses();
    loadLevels();
  }, [loadClasses, loadLevels]);

  const [formData, setFormData] = useState<Partial<Student>>(
    editStudent || {
      name: '',
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
      badges: []
    }
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const initials = getInitials(formData.name || '');
    const avatarType = formData.gender === 'Akhwat' ? 'lorelei' : 'avataaars';
    const profileImageUrl = `https://api.dicebear.com/7.x/${avatarType}/svg?seed=${encodeURIComponent(initials)}`;

    if (editStudent) {
      updateStudent({ ...editStudent, ...formData, profileImageUrl } as Student);
      onUpdate?.();
    } else {
      addStudent({
        ...formData,
        id: crypto.randomUUID(),
        badges: [],
        profileImageUrl,
        status: true
      } as Student);
      setFormData({
        name: '',
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
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">{editStudent ? 'Edit Student' : 'Add New Student'}</h2>
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
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {editStudent ? 'Update Student' : 'Add Student'}
        </button>
      </div>
    </form>
  );
}