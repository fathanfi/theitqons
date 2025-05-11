'use client';

import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { useState, useEffect } from 'react';
import { StudentForm } from './StudentForm';
import { Student } from '@/types/student';
import { supabase } from '@/lib/supabase';
import React from 'react';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

type SortField = 'points' | 'name';
type SortDirection = 'asc' | 'desc';

export function StudentList() {
  const students = useStore((state) => state.students);
  const deleteStudent = useStore((state) => state.deleteStudent);
  const updateStudent = useStore((state) => state.updateStudent);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentPoints, setStudentPoints] = useState<{[key: string]: number}>({});
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  
  const classes = useSchoolStore((state) => state.classes);
  const levels = useSchoolStore((state) => state.levels);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const loadLevels = useSchoolStore((state) => state.loadLevels);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [showInactive, setShowInactive] = useState(true);

  useEffect(() => {
    loadClasses();
    loadLevels();
    loadStudentPoints();
  }, [loadClasses, loadLevels]);

  const loadStudentPoints = async () => {
    const { data } = await supabase
      .from('student_total_points')
      .select('*');
    
    if (data) {
      const points = data.reduce((acc: {[key: string]: number}, curr) => {
        acc[curr.student_id] = curr.earned_points;
        return acc;
      }, {});
      setStudentPoints(points);
    }
  };

  const getInitials = (name: string) => {
    const words = name.split(' ');
    if (words.length === 1) return words[0].charAt(0);
    
    let initials = '';
    if (words[0].toLowerCase() === 'm.' || words[0].toLowerCase().startsWith('muhammad')) {
      initials = words.slice(1, 3).map(word => word.charAt(0)).join('');
    } else {
      initials = words.slice(0, 2).map(word => word.charAt(0)).join('');
    }
    
    return initials.toUpperCase();
  };

  const sortStudents = (students: Student[]) => {
    return [...students].sort((a, b) => {
      if (sortField === 'points') {
        const pointsA = studentPoints[a.id] || 0;
        const pointsB = studentPoints[b.id] || 0;
        return sortDirection === 'asc' ? pointsA - pointsB : pointsB - pointsA;
      } else {
        return sortDirection === 'asc' 
          ? a.name.localeCompare(b.name)
          : b.name.localeCompare(a.name);
      }
    });
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = !selectedClass || student.class_id === selectedClass;
    const matchesLevel = !selectedLevel || student.level_id === selectedLevel;
    const matchesStatus = showInactive || student.status;
    return matchesSearch && matchesClass && matchesLevel && matchesStatus;
  });

  const sortedStudents = sortStudents(filteredStudents);

  // Pagination
  const totalPages = Math.ceil(sortedStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentStudents = sortedStudents.slice(startIndex, endIndex);

  const getClassName = (classId: string) => {
    const class_ = classes.find(c => c.id === classId);
    return class_ ? class_.name : classId;
  };

  const getLevelName = (levelId: string) => {
    const level = levels.find(l => l.id === levelId);
    return level ? level.name : levelId;
  };

  const handleStatusChange = (student: Student) => {
    if (!isAdmin) {
      showUnauthorized();
      return;
    }
    updateStudent({ ...student, status: !student.status });
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Students List</h2>
      
      <div className="mb-6 space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 border rounded-md"
          />
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50 mr-2"
            />
            Show Inactive Students
          </label>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <select
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">All Classes</option>
            {classes.map(class_ => (
              <option key={class_.id} value={class_.id}>
                {class_.name}
              </option>
            ))}
          </select>

          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">All Levels</option>
            {levels.map(level => (
              <option key={level.id} value={level.id}>
                {level.name}
              </option>
            ))}
          </select>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => toggleSort('name')}
            className={`px-4 py-2 rounded ${
              sortField === 'name' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'
            }`}
          >
            Sort by Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
          <button
            onClick={() => toggleSort('points')}
            className={`px-4 py-2 rounded ${
              sortField === 'points' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100'
            }`}
          >
            Sort by Points {sortField === 'points' && (sortDirection === 'asc' ? '↑' : '↓')}
          </button>
        </div>
      </div>

      {editingStudent && (
        <div className="mb-6">
          <StudentForm 
            editStudent={editingStudent} 
            onUpdate={() => setEditingStudent(null)} 
          />
        </div>
      )}
      
      <div className="space-y-4">
        {currentStudents.map((student) => (
          <div 
            key={student.id} 
            className={`border rounded-lg p-4 ${!student.status ? 'bg-gray-50' : ''}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-semibold ${
                  student.gender === 'Akhwat' ? 'bg-pink-200 text-pink-800' : 'bg-blue-200 text-blue-800'
                }`}>
                  {getInitials(student.name)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold">{student.name}</h3>
                    {!student.status && (
                      <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">Level: {getLevelName(student.level_id)}</p>
                  <p className="text-sm text-gray-500">
                    Class: {getClassName(student.class_id)}
                  </p>
                  <p className="text-sm text-indigo-600 font-medium">
                    Earned Points: {studentPoints[student.id] || 0}
                  </p>
                  {student.father_name && (
                    <p className="text-sm text-gray-500">
                      Father: {student.father_name}
                    </p>
                  )}
                  {student.mother_name && (
                    <p className="text-sm text-gray-500">
                      Mother: {student.mother_name}
                    </p>
                  )}
                  {student.wali_name && (
                    <p className="text-sm text-gray-500">
                      Wali: {student.wali_name}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setEditingStudent(student)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleStatusChange(student)}
                  className={`text-sm px-2 py-1 rounded ${
                    student.status 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                  disabled={!isAdmin}
                >
                  {student.status ? 'Active' : 'Inactive'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between border-t pt-4">
          <div className="text-sm text-gray-700 mb-4 sm:mb-0">
            Showing {startIndex + 1} to {Math.min(endIndex, sortedStudents.length)} of {sortedStudents.length} students
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Previous
            </button>
            <div className="flex items-center gap-1 overflow-x-auto max-w-[300px]">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Show first page, last page, current page, and pages around current page
                  const showAroundCurrent = Math.abs(page - currentPage) <= 1;
                  const isFirstOrLast = page === 1 || page === totalPages;
                  return showAroundCurrent || isFirstOrLast;
                })
                .map((page, index, array) => (
                  <React.Fragment key={page}>
                    {index > 0 && array[index - 1] !== page - 1 && (
                      <span className="px-2 text-gray-500">...</span>
                    )}
                    <button
                      onClick={() => setCurrentPage(page)}
                      className={`min-w-[32px] px-3 py-1 rounded ${
                        currentPage === page
                          ? 'bg-indigo-600 text-white'
                          : 'border hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}