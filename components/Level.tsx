'use client';

import { useDroppable } from '@dnd-kit/core';
import { Student } from '@/types/student';
import { StudentAvatar } from './StudentAvatar';

interface LevelProps {
  level: string;
  levelId: string;
  students: Student[];
}

export function Level({ level, levelId, students }: LevelProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: levelId,
  });

  return (
    <div
      ref={setNodeRef}
      className={`p-6 rounded-lg ${
        isOver ? 'bg-indigo-50' : 'bg-white'
      } shadow-lg transition-colors`}
    >
      <h2 className="text-2xl font-semibold mb-4">Level {level}</h2>
      <div className="flex flex-wrap gap-4">
        {students.map((student) => (
          <StudentAvatar key={student.id} student={student} />
        ))}
        {students.length === 0 && (
          <p className="text-gray-500">No students in this level</p>
        )}
      </div>
    </div>
  );
}