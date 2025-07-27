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
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const [examFilter, setExamFilter] = useState<'all' | 'with_exam' | 'without_exam'>('all');
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

        // Apply exam filter
        const hasExam = getLatestExam(student.id);
        if (examFilter === 'with_exam' && !hasExam) return false;
        if (examFilter === 'without_exam' && hasExam) return false;
        
        return student.level_id === levelId;
      });
  };

  // Calculate totals
  const totalStudents = students.length;
  const studentsWithExams = students.filter(student => getLatestExam(student.id)).length;
  const filteredStudents = students.filter(student => {
    if (statusFilter === 'active' && !student.status) return false;
    if (statusFilter === 'inactive' && student.status) return false;
    if (selectedClass && student.class_id !== selectedClass) return false;
    if (searchQuery && !student.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    const hasExam = getLatestExam(student.id);
    if (examFilter === 'with_exam' && !hasExam) return false;
    if (examFilter === 'without_exam' && hasExam) return false;
    return true;
  }).length;

  // Only show active levels
  const activeLevels = levels
    .filter(level => level.status)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {/* Report Section */}
      <div className="mb-6 flex flex-col gap-4 md:flex-row">
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Total Santri</p>
            <p className="text-2xl font-bold">{totalStudents}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Santri Itqon</p>
            <p className="text-2xl font-bold">{studentsWithExams}</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600">Filtered</p>
            <p className="text-2xl font-bold">{filteredStudents}</p>
          </div>
        </div>
      </div>

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
        <select
          value={examFilter}
          onChange={(e) => setExamFilter(e.target.value as 'all' | 'with_exam' | 'without_exam')}
          className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="all">Semua Status</option>
          <option value="with_exam">Sudah Itqon</option>
          <option value="without_exam">Belum Itqon</option>
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