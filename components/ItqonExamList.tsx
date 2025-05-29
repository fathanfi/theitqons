'use client';

import { useState, useEffect } from 'react';
import { useExamStore } from '@/store/examStore';
import { ItqonExam } from '@/types/exam';
import { ItqonExamForm } from './ItqonExamForm';
import { useAuthStore } from '@/store/authStore';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { formatDate } from '@/lib/utils';
import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';

type SortField = 'student' | 'exam' | 'date' | 'examiner' | 'class';
type SortDirection = 'asc' | 'desc';

export function ItqonExamList() {
  const { itqonExams, loadItqonExams, deleteItqonExam } = useExamStore();
  const [editingExam, setEditingExam] = useState<ItqonExam | null>(null);
  const { user } = useAuthStore();
  const { showUnauthorized } = useUnauthorized();
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  const classes = useSchoolStore((state) => state.classes);
  const loadClasses = useSchoolStore((state) => state.loadClasses);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [examinerFilter, setExaminerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Sort states
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Ensure classes and students are loaded
  useEffect(() => {
    if (classes.length === 0) loadClasses();
    if (students.length === 0) loadStudents();
    loadItqonExams();
  }, [loadClasses, loadStudents, loadItqonExams]);

  const isLoading = classes.length === 0 || students.length === 0;

  const handleDelete = async (id: string) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    if (window.confirm('Are you sure you want to delete this exam?')) {
      await deleteItqonExam(id);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Helper to get class name from studentId
  const getStudentClass = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return '-';
    const class_ = classes.find(c => c.id === student.class_id);
    return class_?.name || '-';
  };

  // Filter exams based on all criteria
  const filteredExams = itqonExams.filter(exam => {
    const matchesSearch = exam.student?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || exam.examDate.startsWith(dateFilter);
    const matchesExam = !examFilter || exam.exam?.name === examFilter;
    const matchesExaminer = !examinerFilter || exam.teacher?.name === examinerFilter;
    const matchesStatus = !statusFilter || exam.status === statusFilter;
    const matchesClass = !classFilter || getStudentClass(exam.studentId) === classFilter;
    // Date range filter
    const matchesFrom = !dateFrom || exam.examDate >= dateFrom;
    const matchesTo = !dateTo || exam.examDate <= dateTo;
    return matchesSearch && matchesDate && matchesExam && matchesExaminer && matchesStatus && matchesClass && matchesFrom && matchesTo;
  });

  // Sort filtered exams
  const sortedExams = [...filteredExams].sort((a, b) => {
    const direction = sortDirection === 'asc' ? 1 : -1;
    switch (sortField) {
      case 'student':
        return direction * (a.student?.name || '').localeCompare(b.student?.name || '');
      case 'exam':
        return direction * (a.exam?.name || '').localeCompare(b.exam?.name || '');
      case 'date':
        return direction * (new Date(a.examDate).getTime() - new Date(b.examDate).getTime());
      case 'examiner':
        return direction * (a.teacher?.name || '').localeCompare(b.teacher?.name || '');
      case 'class':
        return direction * getStudentClass(a.studentId).localeCompare(getStudentClass(b.studentId));
      default:
        return 0;
    }
  });

  // Get unique values for filters
  const uniqueExams = Array.from(new Set(itqonExams.map(exam => exam.exam?.name).filter(Boolean)));
  const uniqueExaminers = Array.from(new Set(itqonExams.map(exam => exam.teacher?.name).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(itqonExams.map(exam => exam.status)));
  const uniqueClasses = Array.from(new Set(students.map(s => {
    const class_ = classes.find(c => c.id === s.class_id);
    return class_?.name;
  }).filter(Boolean)));

  // Report info (use filteredExams for all counts)
  const totalExams = filteredExams.length;
  const totalPassed = filteredExams.filter(e => e.status === 'Passed').length;
  const totalScheduled = filteredExams.filter(e => e.status === 'Scheduled').length;
  const totalFailed = filteredExams.filter(e => e.status === 'Failed').length;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <span className="text-lg text-gray-500">Loading data...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Cards */}
      <div className="flex flex-wrap gap-6 mb-6">
        <div className="rounded-xl bg-indigo-50 px-8 py-6 min-w-[180px]">
          <div className="text-lg font-semibold text-indigo-600 mb-1">Total Exams</div>
          <div className="text-3xl font-bold text-indigo-700">{totalExams}</div>
        </div>
        <div className="rounded-xl bg-green-50 px-8 py-6 min-w-[180px]">
          <div className="text-lg font-semibold text-green-600 mb-1">Passed</div>
          <div className="text-3xl font-bold text-green-700">{totalPassed}</div>
        </div>
        <div className="rounded-xl bg-yellow-50 px-8 py-6 min-w-[180px]">
          <div className="text-lg font-semibold text-yellow-700 mb-1">Scheduled</div>
          <div className="text-3xl font-bold text-yellow-800">{totalScheduled}</div>
        </div>
        <div className="rounded-xl bg-red-50 px-8 py-6 min-w-[180px]">
          <div className="text-lg font-semibold text-red-600 mb-1">Failed</div>
          <div className="text-3xl font-bold text-red-700">{totalFailed}</div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search by Name</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search student name..."
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Exam</label>
            <select
              value={examFilter}
              onChange={(e) => setExamFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">All Exams</option>
              {uniqueExams.map(exam => (
                <option key={exam} value={exam}>{exam}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Class</label>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">All Classes</option>
              {uniqueClasses.map(className => (
                <option key={className} value={className}>{className}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Examiner</label>
            <select
              value={examinerFilter}
              onChange={(e) => setExaminerFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">All Examiners</option>
              {uniqueExaminers.map(examiner => (
                <option key={examiner} value={examiner}>{examiner}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">All Statuses</option>
              {uniqueStatuses.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Exam List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('student')}
                >
                  Student Name {sortField === 'student' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('class')}
                >
                  Class {sortField === 'class' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('exam')}
                >
                  Exam {sortField === 'exam' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahfidz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tajwid</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('examiner')}
                >
                  Examiner {sortField === 'examiner' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  Date {sortField === 'date' && (sortDirection === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedExams.map((exam, index) => (
                <tr key={exam.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{index + 1}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      exam.status === 'Passed' ? 'bg-green-100 text-green-800' :
                      exam.status === 'Failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {exam.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.student?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{getStudentClass(exam.studentId)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.exam?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.tahfidzScore || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.tajwidScore || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.teacher?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(exam.examDate)}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                    {exam.examNotes || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setEditingExam(exam)}
                      className="text-indigo-600 hover:text-indigo-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(exam.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Form Modal */}
      {editingExam && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <ItqonExamForm
              editExam={editingExam}
              onUpdate={() => setEditingExam(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}