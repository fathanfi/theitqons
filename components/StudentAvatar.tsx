'use client';

import { Student } from '@/types/student';
import { useDraggable } from '@dnd-kit/core';

interface StudentAvatarProps {
  student: Student;
  searchQuery: string;
}

export function StudentAvatar({ student, searchQuery }: StudentAvatarProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: student.id,
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length === 1) return words[0].charAt(0);
    
    // Handle names with prefixes like "M." or "Muhammad"
    let initials = '';
    if (words[0].toLowerCase() === 'm.' || words[0].toLowerCase().startsWith('muhammad')) {
      initials = words.slice(1, 3).map(word => word.charAt(0)).join('');
    } else {
      initials = words.slice(0, 2).map(word => word.charAt(0)).join('');
    }
    
    return initials.toUpperCase();
  };

  const highlightName = (name: string) => {
    if (!searchQuery) return name;
    
    const regex = new RegExp(`(${searchQuery})`, 'gi');
    return name.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`relative cursor-move ${isDragging ? 'opacity-50' : ''}`}
    >
      <div className="group relative flex flex-col items-center">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-semibold ${
          student.gender === 'Akhwat' ? 'bg-pink-200 text-pink-800' : 'bg-blue-200 text-blue-800'
        }`}>
          {getInitials(student.name)}
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="bg-black bg-opacity-50 text-white text-xs p-1 rounded">
            {student.name}
          </div>
        </div>
        <div className="absolute -top-2 -right-2 flex flex-wrap gap-1 max-w-[120px] justify-end">
          {student.badges.map((badge, index) => (
            <span
              key={badge.id}
              className="text-lg"
              title={badge.description}
            >
              {badge.icon}
            </span>
          ))}
        </div>
        <span 
          className="mt-2 text-xs text-gray-700 text-center"
          dangerouslySetInnerHTML={{ __html: highlightName(student.name) }}
        />
      </div>
    </div>
  );
}