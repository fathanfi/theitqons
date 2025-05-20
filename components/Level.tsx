'use client';

import { useDroppable } from '@dnd-kit/core';
import { Student } from '@/types/student';
import { StudentAvatar } from './StudentAvatar';
import { useAuthStore } from '@/store/authStore';
import { ItqonExam } from '@/types/exam';
import { useSchoolStore } from '@/store/schoolStore';

interface LevelProps {
  level: string;
  levelId: string;
  students: Student[];
  searchQuery: string;
  getLatestExam: (studentId: string) => ItqonExam | undefined;
}

export function Level({ level, levelId, students, searchQuery, getLatestExam }: LevelProps) {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const levels = useSchoolStore((state) => state.levels);
  const levelData = levels.find(l => l.id === levelId);

  // Only enable droppable for admin
  const droppable = isAdmin ? useDroppable({ id: levelId }) : null;
  const setNodeRef = droppable ? droppable.setNodeRef : undefined;
  const isOver = droppable ? droppable.isOver : false;

  // Calculate gender counts
  const maleCount = students.filter(student => student.gender === 'Ikhwan').length;
  const femaleCount = students.filter(student => student.gender === 'Akhwat').length;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'Passed':
        return 'bg-green-600 text-white';
      case 'Scheduled':
        return 'bg-yellow-500 text-black';
      case 'Failed':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  return (
    <div
      ref={setNodeRef}
      className={`p-6 rounded-lg ${
        isOver ? 'bg-indigo-50' : 'bg-white'
      } shadow-lg transition-colors`}
    >
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-semibold">Level {level}</h2>
          {levelData?.description && (
            <p className="text-base text-gray-600 mt-1">
              {levelData.description}
            </p>
          )}
        </div>
        <div className="text-sm text-gray-600">
          <div>Total: {students.length} students</div>
          <div className="flex gap-4">
            <span className="text-blue-600">Male: {maleCount}</span>
            <span className="text-pink-600">Female: {femaleCount}</span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-4">
        {students.map((student) => {
          const latestExam = getLatestExam(student.id);
          return (
            <div key={student.id} className="flex flex-col items-center">
              <StudentAvatar 
                student={student} 
                searchQuery={searchQuery}
              />
              {latestExam && (
                <span className={`text-xs px-2 py-1 rounded-full mt-1 ${getStatusStyle(latestExam.status)}`}>
                  {latestExam.exam?.name}
                </span>
              )}
            </div>
          );
        })}
        {students.length === 0 && (
          <p className="text-gray-500">No students in this level</p>
        )}
      </div>
    </div>
  );
}