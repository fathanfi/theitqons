'use client';

import { StudentForm } from '@/components/StudentForm';
import { StudentList } from '@/components/StudentList';
import { useStore } from '@/store/useStore';
import { Student } from '@/types/student';
import { useState } from 'react';

export default function StudentsPage() {
  const addStudent = useStore((state) => state.addStudent);
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = async (studentData: Student) => {
    await addStudent(studentData);
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
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
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-8">
          <div className="lg:col-span-3">
            {showForm ? (
              <StudentForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              >
                Add New Student
              </button>
            )}
          </div>
          <div className="lg:col-span-7">
            <StudentList />
          </div>
        </div>
      </div>
    </>
  );
}