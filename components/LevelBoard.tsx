'use client';

import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { useExamStore } from '@/store/examStore';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { Student } from '@/types/student';
import { Level as SchoolLevel } from '@/types/school';
import { Level } from './Level';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { formatDate } from '@/lib/utils';

export function LevelBoard() {
  const students = useStore((state) => state.students);
  const moveStudentToLevel = useStore((state) => state.moveStudentToLevel);
  const levels = useSchoolStore((state) => state.levels);
  const classes = useSchoolStore((state) => state.classes);
  const loadLevels = useSchoolStore((state) => state.loadLevels);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const loadStudents = useStore((state) => state.loadStudents);
  const itqonExams = useExamStore((state) => state.itqonExams);
  const loadItqonExams = useExamStore((state) => state.loadItqonExams);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const { user } = useAuthStore();
  const { showUnauthorized } = useUnauthorized();
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadLevels();
    loadStudents();
    loadClasses();
    loadItqonExams();
  }, [loadLevels, loadStudents, loadClasses, loadItqonExams]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    if (!isAdmin) {
      showUnauthorized();
      return;
    }

    const studentId = active.id as string;
    const levelId = over.id as string;

    // Find the level object from the levels array
    const level = levels.find(l => l.id === levelId);
    if (!level) return;

    // Convert school level to student level format
    const studentLevel = {
      id: level.id,
      name: level.name,
      created_at: level.createdAt,
      updated_at: level.createdAt // Using createdAt as updated_at since we don't track updates
    };

    // Move the student to the new level
    await moveStudentToLevel(studentId, studentLevel);
    
    // Reload students to ensure we have the latest data
    await loadStudents();
  };

  const getLatestExam = (studentId: string) => {
    const studentExams = itqonExams
      .filter(exam => exam.studentId === studentId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    return studentExams[0];
  };

  const getStudentsForLevel = (levelId: string): Student[] => {
    return students
      .filter(student => {
        // Apply status filter
        if (statusFilter === 'active' && !student.status) return false;
        if (statusFilter === 'inactive' && student.status) return false;
        
        // Apply class filter
        if (selectedClass && student.class_id !== selectedClass) return false;
        
        // Apply search filter
        if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        
        return student.level_id === levelId;
      });
  };

  // Only show active levels
  const activeLevels = levels
    .filter(level => level.status)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <input
          type="text"
          placeholder="Search students by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">All Classes</option>
          {classes.map(class_ => (
            <option key={class_.id} value={class_.id}>
              {class_.name}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">All Students</option>
          <option value="active">Active Students</option>
          <option value="inactive">Non-Active Students</option>
        </select>
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {activeLevels.map((level) => (
          <Level 
            key={level.id} 
            level={level.name} 
            levelId={level.id}
            students={getStudentsForLevel(level.id)}
            searchQuery={searchQuery}
            getLatestExam={getLatestExam}
          />
        ))}
      </DndContext>
    </div>
  );
}