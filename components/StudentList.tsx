'use client';

import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { useState, useEffect } from 'react';
import { StudentForm } from './StudentForm';
import { Student } from '@/types/student';
import { supabase } from '@/lib/supabase';
import Select from 'react-select';

type SortField = 'points' | 'name';
type SortDirection = 'asc' | 'desc';

export function StudentList() {
  const students = useStore((state) => state.students);
  const deleteStudent = useStore((state) => state.deleteStudent);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [studentPoints, setStudentPoints] = useState<{[key: string]: number}>({});
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  
  const teachers = useSchoolStore((state) => state.teachers);
  const classes = useSchoolStore((state) => state.classes);
  const levels = useSchoolStore((state) => state.levels);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);
  const loadClasses = useSchoolStore((state) => state.loadClasses);
  const loadLevels = useSchoolStore((state) => state.loadLevels);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [showInactive, setShowInactive] = useState(true);

  useEffect(() => {
    loadTeachers();
    loadClasses();
    loadLevels();
    loadStudentPoints();
  }, [loadTeachers, loadClasses, loadLevels]);

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
    const matchesClass = !selectedClass || student.class === selectedClass;
    const matchesLevel = !selectedLevel || student.level === selectedLevel;
    const matchesTeacher = !selectedTeacher || student.teacher === selectedTeacher;
    const matchesStatus = showInactive || student.status;
    return matchesSearch && matchesClass && matchesLevel && matchesTeacher && matchesStatus;
  });

  const sortedStudents = sortStudents(filteredStudents);

  const getTeacherName = (teacherId: string) => {
    const teacher = teachers.find(t => t.id === teacherId);
    return teacher ? teacher.name : teacherId;
  };

  const getClassName = (classId: string) => {
    const class_ = classes.find(c => c.id === classId);
    return class_ ? class_.name : classId;
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
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <option key={level.id} value={level.name}>
                {level.name}
              </option>
            ))}
          </select>

          <select
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacher(e.target.value)}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="">All Teachers</option>
            {teachers.map(teacher => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
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
        {sortedStudents.map((student) => (
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
                  <p className="text-sm text-gray-500">Level: {student.level}</p>
                  <p className="text-sm text-indigo-600 font-medium">
                    Earned Points: {studentPoints[student.id] || 0}
                  </p>
                  <p className="text-sm text-gray-500">
                    Teacher: {getTeacherName(student.teacher)} | Class: {getClassName(student.class)}
                  </p>
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
                  onClick={() => deleteStudent(student.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
            {student.badges.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-medium text-gray-700 mb-1">Badges:</p>
                <div className="flex gap-2">
                  {student.badges.map((badge) => (
                    <div
                      key={badge.id}
                      className="flex items-center bg-gray-100 rounded-full px-3 py-1"
                      title={badge.description}
                    >
                      <span className="mr-1">{badge.icon}</span>
                      <span className="text-sm">{badge.description}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {sortedStudents.length === 0 && (
          <p className="text-gray-500 text-center">No students found.</p>
        )}
      </div>
    </div>
  );
}