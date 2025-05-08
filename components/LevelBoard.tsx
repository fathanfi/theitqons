'use client';

import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { Student } from '@/types/student';
import { Level as SchoolLevel } from '@/types/school';
import { Level } from './Level';
import { useEffect } from 'react';

export function LevelBoard() {
  const students = useStore((state) => state.students);
  const moveStudentToLevel = useStore((state) => state.moveStudentToLevel);
  const levels = useSchoolStore((state) => state.levels);
  const loadLevels = useSchoolStore((state) => state.loadLevels);
  const loadStudents = useStore((state) => state.loadStudents);

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
      .filter(student => student.status && student.level_id === levelId);
  };

  // Only show active levels
  const activeLevels = levels
    .filter(level => level.status)
    .sort((a, b) => a.order - b.order);

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {activeLevels.map((level) => (
          <Level 
            key={level.id} 
            level={level.name} 
            levelId={level.id}
            students={getStudentsForLevel(level.id)} 
          />
        ))}
      </div>
    </DndContext>
  );
}