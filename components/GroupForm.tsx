'use client';

import { useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { useStore } from '@/store/useStore';
import { Group } from '@/types/school';
import { useSession } from './SessionProvider';
import Select from 'react-select';
import Link from 'next/link';

export function GroupForm({ editGroup, onUpdate }: { editGroup?: Group; onUpdate?: () => void }) {
  const { currentAcademicYear } = useSession();
  const teachers = useSchoolStore((state) => state.teachers);
  const classes = useSchoolStore((state) => state.classes);
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const addGroup = useSchoolStore((state) => state.addGroup);
  const updateGroup = useSchoolStore((state) => state.updateGroup);

  useEffect(() => {
    loadStudents();
    loadTeachers();
    loadClasses();
  }, [loadStudents, loadTeachers, loadClasses]);

  const [formData, setFormData] = useState<Partial<Group>>(
    editGroup || {
      name: '',
      academicYearId: currentAcademicYear?.id || '',
      classId: '',
      teacherId: '',
      students: []
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentAcademicYear) {
      alert('Please select an academic year');
      return;
    }

    if (editGroup) {
      await updateGroup(formData as Group);
      onUpdate?.();
    } else {
      await addGroup({
        ...formData,
        academicYearId: currentAcademicYear.id
      } as Omit<Group, 'id' | 'createdAt'>);
      setFormData({
        name: '',
        academicYearId: currentAcademicYear.id,
        classId: '',
        teacherId: '',
        students: []
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      // Clear students when class changes
      ...(name === 'classId' ? { students: [] } : {})
    }));
  };

  // Filter students by selected class
  const filteredStudents = students.filter(student => 
    formData.classId ? student.class_id === formData.classId : true
  );

  const studentOptions = filteredStudents.map(student => ({
    value: student.id,
    label: student.name
  }));

  if (!currentAcademicYear) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <p className="text-center text-gray-500">Please select an academic year first</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">
        {editGroup ? 'Edit Group' : 'Add New Group'}
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
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Class</label>
            <Link href="/classes" className="text-sm text-indigo-600 hover:text-indigo-800">
              Manage Classes
            </Link>
          </div>
          <select
            name="classId"
            value={formData.classId}
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
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-gray-700">Teacher</label>
            <Link href="/teachers" className="text-sm text-indigo-600 hover:text-indigo-800">
              Manage Teachers
            </Link>
          </div>
          <select
            name="teacherId"
            value={formData.teacherId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          >
            <option value="">Select Teacher</option>
            {teachers
              .filter(teacher => teacher.status)
              .map(teacher => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.name}
                </option>
              ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Students</label>
          <Select
            isMulti
            options={studentOptions}
            value={studentOptions.filter(option => formData.students?.includes(option.value))}
            onChange={(selected) => {
              setFormData({
                ...formData,
                students: selected.map(option => option.value)
              });
            }}
            className="basic-multi-select"
            classNamePrefix="select"
            placeholder="Search and select students..."
            isDisabled={!formData.classId}
          />
          {!formData.classId && (
            <p className="mt-1 text-sm text-gray-500">Please select a class first to see available students</p>
          )}
        </div>
        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {editGroup ? 'Update Group' : 'Add Group'}
        </button>
      </div>
    </form>
  );
}