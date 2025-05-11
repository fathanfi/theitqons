'use client';

import { useStore } from '@/store/useStore';
import { Student } from '@/types/student';
import { useState } from 'react';
import Select from 'react-select';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

export function BadgeList() {
  const badges = useStore((state) => state.badges);
  const students = useStore((state) => state.students);
  const deleteBadge = useStore((state) => state.deleteBadge);
  const addBadgeToStudent = useStore((state) => state.addBadgeToStudent);
  const removeBadgeFromStudent = useStore((state) => state.removeBadgeFromStudent);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();

  const handleAssignBadge = (badgeId: string) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    if (!selectedStudent) return;
    const badge = badges.find(b => b.id === badgeId);
    if (!badge) return;

    // Check if student already has a similar badge (same description)
    const student = students.find(s => s.id === selectedStudent);
    if (student && student.badges.some(b => b.description === badge.description)) {
      alert('Student already has a similar badge');
      return;
    }

    addBadgeToStudent(selectedStudent, badge);
  };

  const handleDeleteBadge = (badgeId: string) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    deleteBadge(badgeId);
  };

  const handleRemoveBadge = (studentId: string, badgeId: string) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    removeBadgeFromStudent(studentId, badgeId);
  };

  const student = students.find(s => s.id === selectedStudent);

  const studentOptions = students.map(student => ({
    value: student.id,
    label: student.name
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
        <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Badges List</h2>
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Student's Badge</label>
          <Select
            options={studentOptions}
            value={studentOptions.find(option => option.value === selectedStudent)}
            onChange={(selected) => setSelectedStudent(selected?.value || '')}
            className="mt-1"
            placeholder="Search and select student..."
            isClearable
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
          {badges.map((badge) => (
            <div key={badge.id} className="border rounded-lg p-3 sm:p-4 flex flex-col">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-xl sm:text-2xl">{badge.icon}</span>
                <div>
                  <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{badge.description}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => handleAssignBadge(badge.id)}
                  disabled={!selectedStudent}
                  className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  Assign
                </button>
                <button
                  onClick={() => handleDeleteBadge(badge.id)}
                  className="text-red-600 hover:text-red-800 text-xs sm:text-sm"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {badges.length === 0 && (
            <p className="text-gray-500 text-center col-span-2 sm:col-span-3">No badges created yet.</p>
          )}
        </div>
      </div>

      {student && (
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg">
          <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6">Student's Badges ({student.name})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {student.badges.map((badge) => (
              <div key={badge.id} className="border rounded-lg p-3 sm:p-4 flex flex-col">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-xl sm:text-2xl">{badge.icon}</span>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 line-clamp-2">{badge.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveBadge(student.id, badge.id)}
                  className="text-red-600 hover:text-red-800 text-xs sm:text-sm mt-auto"
                >
                  Remove
                </button>
              </div>
            ))}
            {student.badges.length === 0 && (
              <p className="text-gray-500 text-center col-span-2 sm:col-span-3">No badges assigned to this student yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}