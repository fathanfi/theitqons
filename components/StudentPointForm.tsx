'use client';

import { useState, useEffect } from 'react';
import { usePointsStore } from '@/store/pointsStore';
import { useStore } from '@/store/useStore';
import Select from 'react-select';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

export function StudentPointForm() {
  const points = usePointsStore((state) => state.points);
  const loadPoints = usePointsStore((state) => state.loadPoints);
  const addStudentPoint = usePointsStore((state) => state.addStudentPoint);
  const students = useStore((state) => state.students);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedPoint, setSelectedPoint] = useState('');
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();

  useEffect(() => {
    loadPoints();
  }, [loadPoints]);

  const studentOptions = students.map(student => ({
    value: student.id,
    label: student.name
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    if (!selectedStudent || !selectedPoint) return;
    await addStudentPoint(selectedStudent, selectedPoint);
    setSelectedStudent('');
    setSelectedPoint('');
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Add Points to Student</h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Student</label>
          <Select
            options={studentOptions}
            value={studentOptions.find(option => option.value === selectedStudent)}
            onChange={(selected) => setSelectedStudent(selected?.value || '')}
            className="mt-1"
            placeholder="Search and select student..."
            isClearable
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Point</label>
          <select
            value={selectedPoint}
            onChange={(e) => setSelectedPoint(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          >
            <option value="">Select a point</option>
            {points.map((point) => (
              <option key={point.id} value={point.id}>
                {point.name} ({point.point} points)
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={!selectedStudent || !selectedPoint}
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Add Points
        </button>
      </div>
    </form>
  );
}