'use client';

import { useState, useEffect } from 'react';
import { useSchoolStore } from '@/store/schoolStore';
import { useStore } from '@/store/useStore';
import { Group } from '@/types/school';
import { Student } from '@/types/student';
import { useSession } from '@/components/SessionProvider';
import { GroupForm } from '@/components/GroupForm';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

export default function GroupsPage() {
  const { currentAcademicYear } = useSession();
  const router = useRouter();
  const groups = useSchoolStore((state) => state.groups);
  const loadGroups = useSchoolStore((state) => state.loadGroups);
  const classes = useSchoolStore((state) => state.classes);
  const students = useStore((state) => state.students);
  const levels = useSchoolStore((state) => state.levels);
  const academicYears = useSchoolStore((state) => state.academicYears);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);
  const loadAcademicYears = useSchoolStore((state) => state.loadAcademicYears);
  const loadLevels = useSchoolStore((state) => state.loadLevels);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('ALL');
  const [studentSortOrder, setStudentSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showInactive, setShowInactive] = useState(false);
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();

  useEffect(() => {
    if (currentAcademicYear) {
      loadGroups(currentAcademicYear.id);
      loadClasses();
      loadTeachers();
      loadAcademicYears();
      loadLevels();
    }
  }, [currentAcademicYear, loadGroups, loadClasses, loadTeachers, loadAcademicYears, loadLevels]);

  const handleDelete = async (groupId: string) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }

    if (confirm('Are you sure you want to delete this group?')) {
      const { error } = await supabase
        .from('groups')
        .delete()
        .eq('id', groupId);

      if (error) {
        console.error('Error deleting group:', error);
        return;
      }

      loadGroups(currentAcademicYear?.id || '');
    }
  };

  const handleEdit = (group: Group) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    setEditingGroup(group);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    setIsFormOpen(true);
  };

  const handleUpdate = () => {
    setEditingGroup(undefined);
    setIsFormOpen(false);
    loadGroups(currentAcademicYear?.id || '');
  };

  // Filter groups based on search query and selected class
  const filteredGroups = groups.filter(group => {
    const matchesSearch = searchQuery === '' || 
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (group.students || []).some(studentId => {
        const student = students.find(s => s.id === studentId);
        return student?.name.toLowerCase().includes(searchQuery.toLowerCase());
      });
    
    const matchesClass = selectedClass === 'ALL' || group.classId === selectedClass;
    const matchesAcademicYear = selectedAcademicYear === 'ALL' || group.academicYearId === selectedAcademicYear;
    
    return matchesSearch && matchesClass && matchesAcademicYear;
  });

  // Sort students within each group
  const getSortedStudents = (studentIds: string[] = []) => {
    return studentIds
      .map(id => students.find(s => s.id === id))
      .filter((student): student is Student => student !== undefined)
      .filter(student => showInactive || student.status)
      .sort((a, b) => {
        const comparison = a.name.localeCompare(b.name);
        return studentSortOrder === 'asc' ? comparison : -comparison;
      });
  };

  if (!currentAcademicYear) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-center text-gray-500">Please select an academic year first</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Groups</h1>
        <button
          onClick={handleAddNew}
          className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
        >
          Add New Group
        </button>
      </div>

      {/* Search and Filter Controls */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow p-4 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <input
              type="text"
              placeholder="Search groups or students..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            />
            <label className="flex items-center space-x-2 text-sm text-gray-600 whitespace-nowrap">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
                className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Show Inactive Students</span>
            </label>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <select
              value={selectedAcademicYear}
              onChange={(e) => setSelectedAcademicYear(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              <option value="ALL">All Academic Years</option>
              {academicYears.map(year => (
                <option key={year.id} value={year.id}>
                  {year.name} {year.status ? '(Active)' : ''}
                </option>
              ))}
            </select>
            <div className="flex gap-4">
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              >
                <option value="ALL">All Classes</option>
                {classes.map(class_ => (
                  <option key={class_.id} value={class_.id}>
                    {class_.name}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setStudentSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
                className={`px-4 py-2 rounded whitespace-nowrap ${
                  studentSortOrder === 'asc' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'
                }`}
              >
                Sort Students {studentSortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <GroupForm
              editGroup={editingGroup}
              onUpdate={handleUpdate}
            />
            <button
              onClick={() => {
                setIsFormOpen(false);
                setEditingGroup(undefined);
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredGroups.map((group) => {
          const class_ = classes.find(c => c.id === group.classId);
          const teacher = useSchoolStore.getState().teachers.find(t => t.id === group.teacherId);
          const sortedStudents = getSortedStudents(group.students);
          const totalStudents = group.students?.length || 0;
          const visibleStudents = sortedStudents.length;

          return (
            <div key={group.id} className="rounded-lg shadow-md p-6 bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 text-white">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{group.name}</h3>
                  <p className="text-sm text-gray-300 flex items-center gap-2 flex-wrap">
                    {class_ ? class_.name : 'No Class'} • {teacher ? teacher.name : 'No Teacher'}
                    <span className="text-xs text-blue-300 font-bold">• {visibleStudents}</span>
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(group)}
                    className="text-indigo-300 hover:text-indigo-100 p-1"
                    title="Edit"
                  >
                    <PencilSquareIcon className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(group.id)}
                    className="text-red-400 hover:text-red-200 p-1"
                    title="Delete"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="font-medium text-gray-200">Students:</h4>
                <ul className="space-y-1">
                  {sortedStudents.map((student, index) => {
                    const level = levels.find(l => l.id === student.level_id);
                    return (
                      <li 
                        key={student.id} 
                        className={`text-sm flex items-center gap-2 ${
                          !student.status ? 'text-gray-400' : 'text-gray-100'
                        }`}
                      >
                        <span className="text-gray-400 w-6">{index + 1}.</span>
                        <span>{student.name}</span>
                        {!student.status && (
                          <span className="text-xs text-gray-400">(Inactive)</span>
                        )}
                        {level && (
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 text-white shadow-md">
                            {level.name}
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
                {sortedStudents.length > 0 && (
                  <p className="text-sm text-gray-300 mt-2 font-semibold">
                    Total Students: {visibleStudents}
                    {!showInactive && totalStudents > visibleStudents && (
                      <span className="ml-2 text-gray-400">
                        ({totalStudents - visibleStudents} inactive hidden)
                      </span>
                    )}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}