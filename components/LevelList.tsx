'use client';

import { useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { Level } from '@/types/school';
import { LevelForm } from './LevelForm';
import { 
  DndContext, 
  DragEndEvent, 
  closestCenter, 
  useSensor, 
  useSensors, 
  PointerSensor,
  DragStartEvent,
  DragOverEvent 
} from '@dnd-kit/core';
import { 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable,
  arrayMove
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAuthStore } from '@/store/authStore';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';

function SortableLevel({ level, onStatusChange, onEdit }: { 
  level: Level; 
  onStatusChange: (id: string, status: boolean) => void;
  onEdit: (level: Level) => void;
}) {
  const { user } = useAuthStore();
  const { showUnauthorized } = useUnauthorized();
  const isAdmin = user?.role === 'admin';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: level.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: isAdmin ? 'move' : 'default',
  };

  // Only apply drag listeners/attributes for admin
  const dragProps = isAdmin ? { ...attributes, ...listeners } : {};

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={`border rounded-lg p-4${isAdmin ? ' cursor-move' : ''} ${isDragging ? 'border-indigo-500 bg-indigo-50' : ''}`}
      {...dragProps}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">{level.name}</h3>
          {level.description && (
            <p className="text-sm text-gray-500">{level.description}</p>
          )}
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={level.status}
              onChange={(e) => {
                e.stopPropagation();
                if (!isAdmin) {
                  showUnauthorized();
                  return;
                }
                onStatusChange(level.id, e.target.checked);
              }}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
            <span className="ml-2 text-sm text-gray-700">Active</span>
          </label>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEdit(level);
            }}
            className="text-indigo-600 hover:text-indigo-800"
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}

export function LevelList() {
  const levels = useSchoolStore((state) => state.levels);
  const loadLevels = useSchoolStore((state) => state.loadLevels);
  const setLevelStatus = useSchoolStore((state) => state.setLevelStatus);
  const reorderLevel = useSchoolStore((state) => state.reorderLevel);
  const [editingLevel, setEditingLevel] = useState<Level | null>(null);
  const { user } = useAuthStore();
  const { showUnauthorized } = useUnauthorized();

  useEffect(() => {
    loadLevels();
  }, [loadLevels]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }

    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const oldIndex = levels.findIndex(level => level.id === active.id);
    const newIndex = levels.findIndex(level => level.id === over.id);
    
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = levels[newIndex].order;
    await reorderLevel(active.id as string, newOrder);
  };

  const handleStatusChange = (id: string, status: boolean) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    setLevelStatus(id, status);
  };

  const sortedLevels = [...levels].sort((a, b) => a.order - b.order);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Levels List</h2>
      {editingLevel && (
        <div className="mb-6">
          <LevelForm 
            editLevel={editingLevel} 
            onUpdate={() => setEditingLevel(null)} 
          />
        </div>
      )}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedLevels.map(level => level.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {sortedLevels.map((level) => (
              <SortableLevel
                key={level.id}
                level={level}
                onStatusChange={handleStatusChange}
                onEdit={setEditingLevel}
              />
            ))}
            {levels.length === 0 && (
              <p className="text-gray-500 text-center">No levels added yet.</p>
            )}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}