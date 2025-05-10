'use client';

import { useEffect, useState } from 'react';
import { usePointsStore } from '@/store/pointsStore';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';

export function StudentPointHistory() {
  const studentPoints = usePointsStore((state) => state.studentPoints);
  const loadStudentPoints = usePointsStore((state) => state.loadStudentPoints);
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  const deleteStudentPoint = async (id: string) => {
    const { error } = await supabase
      .from('student_points')
      .delete()
      .eq('id', id);

    if (!error) {
      loadStudentPoints();
    }
  };

  useEffect(() => {
    loadStudentPoints();
    loadStudents();
  }, [loadStudentPoints, loadStudents]);

  const getStudentName = (studentId: string) => {
    const studentPoint = studentPoints.find(sp => sp.student_id === studentId);
    return studentPoint?.student?.name || 'Unknown Student';
  };

  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'Invalid Date';
      
      // Parse the PostgreSQL timestamp with timezone
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Invalid Date';

      // Format the date in Indonesian locale
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Jakarta' // Set to Indonesia timezone
      }).format(date);
    } catch (error) {
      console.error('Date formatting error:', error);
      return 'Invalid Date';
    }
  };

  const studentOptions = students.map(student => ({
    value: student.id,
    label: student.name
  }));

  const filteredPoints = selectedStudent
    ? studentPoints.filter(point => point.student_id === selectedStudent)
    : studentPoints;

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Points History</h2>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Student</label>
        <Select
          options={studentOptions}
          value={studentOptions.find(option => option.value === selectedStudent)}
          onChange={(selected) => setSelectedStudent(selected?.value || '')}
          className="mb-4"
          placeholder="Search and select student..."
          isClearable
        />
      </div>
      <div className="space-y-4">
        {filteredPoints.map((studentPoint) => (
          <div key={studentPoint.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{getStudentName(studentPoint.student_id)}</h3>
                <p className="text-sm text-gray-500">
                  {studentPoint.point?.name} ({studentPoint.point?.point} points)
                </p>
                <p className="text-xs text-gray-400">
                  {formatDate(studentPoint.created_at)}
                </p>
              </div>
              <button
                onClick={() => deleteStudentPoint(studentPoint.id)}
                className="text-red-600 hover:text-red-800"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filteredPoints.length === 0 && (
          <p className="text-gray-500 text-center">No points history yet.</p>
        )}
      </div>
    </div>
  );
}