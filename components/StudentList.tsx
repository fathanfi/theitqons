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
import { formatDate } from '@/lib/utils';
import { 
  PencilIcon, 
  TrashIcon, 
  CakeIcon, 
  PhoneIcon, 
  MapPinIcon, 
  AcademicCapIcon, 
  ChartBarIcon 
} from '@heroicons/react/24/outline';

type SortField = 'points' | 'name';
type SortDirection = 'asc' | 'desc';

export function StudentList() {
  const { students, loadStudents, deleteStudent, updateStudent } = useStore();
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentPoints, setStudentPoints] = useState<{[key: string]: number}>({});
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
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
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadStudents();
    loadClasses();
    loadLevels();
    loadStudentPoints();
  }, [loadStudents, loadClasses, loadLevels]);

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
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = 
      student.name.toLowerCase().includes(searchLower) ||
      student.address?.toLowerCase().includes(searchLower) ||
      student.father_name?.toLowerCase().includes(searchLower) ||
      student.mother_name?.toLowerCase().includes(searchLower) ||
      student.wali_name?.toLowerCase().includes(searchLower) ||
      student.school_info?.toLowerCase().includes(searchLower);
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

  const handleDelete = async (id: string) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    if (window.confirm('Are you sure you want to delete this student?')) {
      await deleteStudent(id);
    }
  };

  const calculateAge = (dateOfBirth: string) => {
    if (!dateOfBirth) return '-';
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleCancel = () => {
    setEditingStudent(null);
    setShowForm(false);
  };

  const handleSubmit = async (studentData: Student) => {
    if (editingStudent) {
      await updateStudent({ ...editingStudent, ...studentData });
    }
    setEditingStudent(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Students List</h2>
        
        <div className="mb-6 space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Search by name, address, or parent name..."
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

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class & Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Pages</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Points</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact & Address</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentStudents.map((student) => (
                <tr key={student.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{student.name}</div>
                    {student.dateOfBirth && (
                      <div className="text-sm text-gray-500 flex items-center">
                        <CakeIcon className="h-4 w-4 mr-1" />
                        {formatDate(student.dateOfBirth)} ({calculateAge(student.dateOfBirth)} years)
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="flex items-center space-x-2">
                      {student.class_id && (
                        <div className="flex items-center">
                          <AcademicCapIcon className="h-4 w-4 mr-1" />
                          {getClassName(student.class_id)}
                        </div>
                      )}
                      {student.level_id && (
                        <div className="flex items-center">
                          <ChartBarIcon className="h-4 w-4 mr-1" />
                          {getLevelName(student.level_id)}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.totalPages || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{studentPoints[student.id] || 0}</td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="space-y-1">
                      {student.phoneNumber && (
                        <div className="flex items-center">
                          <PhoneIcon className="h-4 w-4 mr-1 text-gray-500" />
                          <a
                            href={`https://wa.me/${student.phoneNumber.replace(/\D/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-indigo-600 hover:text-indigo-900"
                          >
                            {student.phoneNumber}
                          </a>
                        </div>
                      )}
                      {student.address && (
                        <div className="flex items-start">
                          <MapPinIcon className="h-4 w-4 mr-1 text-gray-500 mt-0.5" />
                          <span className="text-gray-600">{student.address}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => handleEdit(student)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(student.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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

      {/* Edit Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">
                {editingStudent ? 'Edit Student' : 'Add New Student'}
              </h3>
              <button
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <StudentForm
              onSubmit={handleSubmit}
              initialData={editingStudent}
              onCancel={handleCancel}
            />
          </div>
        </div>
      )}
    </div>
  );
}