'use client';

import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { DndContext, DragEndEvent, closestCenter } from '@dnd-kit/core';
import { Level as LevelType, Student } from '@/types/student';
import { Level } from './Level';
import { useEffect } from 'react';

export function LevelBoard() {
  const students = useStore((state) => state.students);
  const moveStudentToLevel = useStore((state) => state.moveStudentToLevel);
  const levels = useSchoolStore((state) => state.levels);
  const loadLevels = useSchoolStore((state) => state.loadLevels);

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) return;

    const studentId = active.id as string;
    const newLevel = over.id as LevelType;

    moveStudentToLevel(studentId, newLevel);
  };

  const getStudentsForLevel = (level: LevelType): Student[] => {
    return students
      .filter(student => student.status && student.level === level);
  };

  // Only show active levels
  const activeLevels = levels
    .filter(level => level.status)
    .sort((a, b) => a.order - b.order)
    .map(level => level.name as LevelType);

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {activeLevels.map((level) => (
          <Level 
            key={level} 
            level={level} 
            students={getStudentsForLevel(level)} 
          />
        ))}
      </div>
    </DndContext>
  );
}