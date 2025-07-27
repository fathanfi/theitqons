'use client';

import { StudentForm } from '@/components/StudentForm';
import { StudentList } from '@/components/StudentList';
import { useStore } from '@/store/useStore';
import { Student } from '@/types/student';
import { useState } from 'react';
import { ChevronDownIcon, ChevronUpIcon, PlusIcon } from '@heroicons/react/24/outline';

export default function StudentsPage() {
  const addStudent = useStore((state) => state.addStudent);
  const [showForm, setShowForm] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(true);

  const handleSubmit = async (studentData: Student) => {
    await addStudent(studentData);
    setShowForm(false);
    setIsFormCollapsed(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    setIsFormCollapsed(true);
  };

  const toggleForm = () => {
    if (isFormCollapsed) {
      setShowForm(true);
      setIsFormCollapsed(false);
    } else {
      setShowForm(false);
      setIsFormCollapsed(true);
    }
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
      <div className="space-y-6">
        {/* Collapsible Add New Student Section */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <button
            onClick={toggleForm}
            className="w-full flex items-center justify-between p-4 bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
          >
            <div className="flex items-center space-x-2">
              <PlusIcon className="h-5 w-5" />
              <span className="font-medium">Add New Student</span>
            </div>
            {isFormCollapsed ? (
              <ChevronDownIcon className="h-5 w-5" />
            ) : (
              <ChevronUpIcon className="h-5 w-5" />
            )}
          </button>
          
          {showForm && (
            <div className="p-6 border-t">
              <StudentForm
                onSubmit={handleSubmit}
                onCancel={handleCancel}
              />
            </div>
          )}
        </div>
        
        {/* Student List - Now takes full width */}
        <div className="w-full">
          <StudentList />
        </div>
      </div>
    </div>
    </>
  );
}