'use client';

import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { Student } from '@/types/student';
import { Level as SchoolLevel } from '@/types/school';
import { Level } from './Level';
import { useEffect, useState } from 'react';

export function LevelBoard() {
  const students = useStore((state) => state.students);
  const moveStudentToLevel = useStore((state) => state.moveStudentToLevel);
  const levels = useSchoolStore((state) => state.levels);
  const loadLevels = useSchoolStore((state) => state.loadLevels);
  const loadStudents = useStore((state) => state.loadStudents);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadLevels();
    loadStudents();
  }, [loadLevels, loadStudents]);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

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

  const getStudentsForLevel = (levelId: string): Student[] => {
    return students
      .filter(student => student.status && student.level_id === levelId)
      .filter(student => {
        if (!searchQuery) return true;
        return student.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
  };

  // Only show active levels
  const activeLevels = levels
    .filter(level => level.status)
    .sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search students by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        {activeLevels.map((level) => (
          <Level 
            key={level.id} 
            level={level.name} 
            levelId={level.id}
            students={getStudentsForLevel(level.id)}
            searchQuery={searchQuery}
          />
        ))}
      </DndContext>
    </div>
  );
}