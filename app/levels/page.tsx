'use client';

import { useEffect, useState } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { useStore } from '@/store/useStore';
import { useExamStore } from '@/store/examStore';
import { LevelBoard } from '@/components/LevelBoard';
import { StudentSlideshow } from '@/components/StudentSlideshow';

export default function ItqonPage() {
  const loadLevels = useSchoolStore((state) => state.loadLevels);
  const loadStudents = useStore((state) => state.loadStudents);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const loadItqonExams = useExamStore((state) => state.loadItqonExams);
  const students = useStore((state) => state.students);
  const itqonExams = useExamStore((state) => state.itqonExams);
  const [viewMode, setViewMode] = useState<'board' | 'slideshow'>('board');

  useEffect(() => {
    loadLevels();
    loadStudents();
    loadClasses();
    loadItqonExams();
  }, [loadLevels, loadStudents, loadClasses, loadItqonExams]);

  const getLatestExam = (studentId: string) => {
    const studentExams = itqonExams
      .filter(exam => exam.studentId === studentId)
      .sort((a, b) => {
        const dateDiff = new Date(b.examDate).getTime() - new Date(a.examDate).getTime();
        if (dateDiff !== 0) return dateDiff;
        // If examDate is the same, sort by id (descending)
        if (b.id > a.id) return 1;
        if (b.id < a.id) return -1;
        return 0;
      });
    return studentExams[0];
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Itqon Management</h1>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('board')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'board'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              Board View
            </div>
          </button>
          <button
            onClick={() => setViewMode('slideshow')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'slideshow'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Slideshow View
            </div>
          </button>
        </div>
      </div>

      {viewMode === 'board' ? (
        <LevelBoard />
      ) : (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <StudentSlideshow 
            students={students} 
            getLatestExam={getLatestExam}
          />
        </div>
      )}
    </div>
  );
}