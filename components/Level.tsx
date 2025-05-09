'use client';

import { useDroppable } from '@dnd-kit/core';
import { Student } from '@/types/student';
import { StudentAvatar } from './StudentAvatar';

interface LevelProps {
  level: string;
  levelId: string;
  students: Student[];
  searchQuery: string;
}

export function Level({ level, levelId, students, searchQuery }: LevelProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: levelId,
  });

  // Calculate gender counts
  const maleCount = students.filter(student => student.gender === 'Ikhwan').length;
  const femaleCount = students.filter(student => student.gender === 'Akhwat').length;

  return (
    <div
      ref={setNodeRef}
      className={`p-6 rounded-lg ${
        isOver ? 'bg-indigo-50' : 'bg-white'
      } shadow-lg transition-colors`}
    >
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Level {level}</h2>
        <div className="text-sm text-gray-600">
          <div>Total: {students.length} students</div>
          <div className="flex gap-4">
            <span className="text-blue-600">Male: {maleCount}</span>
            <span className="text-pink-600">Female: {femaleCount}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {students.map((student) => (
          <StudentAvatar 
            key={student.id} 
            student={student} 
            searchQuery={searchQuery}
          />
        ))}
        {students.length === 0 && (
          <p className="text-gray-500">No students in this level</p>
        )}
      </div>
    </div>
  );
}