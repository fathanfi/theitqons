'use client';

import { useStore } from '@/store/useStore';
import { Student } from '@/types/student';
import { useState } from 'react';
import Select from 'react-select';

export function BadgeList() {
  const badges = useStore((state) => state.badges);
  const students = useStore((state) => state.students);
  const deleteBadge = useStore((state) => state.deleteBadge);
  const addBadgeToStudent = useStore((state) => state.addBadgeToStudent);
  const removeBadgeFromStudent = useStore((state) => state.removeBadgeFromStudent);
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  const handleAssignBadge = (badgeId: string) => {
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

  const student = students.find(s => s.id === selectedStudent);

  const studentOptions = students.map(student => ({
    value: student.id,
    label: student.name
  }));

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Badges List</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">Assign to Student</label>
          <Select
            options={studentOptions}
            value={studentOptions.find(option => option.value === selectedStudent)}
            onChange={(selected) => setSelectedStudent(selected?.value || '')}
            className="mt-1"
            placeholder="Search and select student..."
            isClearable
          />
        </div>
        <div className="space-y-4">
          {badges.map((badge) => (
            <div key={badge.id} className="border rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="text-2xl">{badge.icon}</span>
                <div>
                  <p className="text-sm text-gray-500">{badge.description}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleAssignBadge(badge.id)}
                  disabled={!selectedStudent}
                  className="text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Assign
                </button>
                <button
                  onClick={() => deleteBadge(badge.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
          {badges.length === 0 && (
            <p className="text-gray-500 text-center">No badges created yet.</p>
          )}
        </div>
      </div>

      {student && (
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Student&apos;s Badges</h2>
          <div className="space-y-4">
            {student.badges.map((badge) => (
              <div key={badge.id} className="border rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <span className="text-2xl">{badge.icon}</span>
                  <div>
                    <p className="text-sm text-gray-500">{badge.description}</p>
                  </div>
                </div>
                <button
                  onClick={() => removeBadgeFromStudent(student.id, badge.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </button>
              </div>
            ))}
            {student.badges.length === 0 && (
              <p className="text-gray-500 text-center">No badges assigned to this student yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}