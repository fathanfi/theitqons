'use client';

import { useState, useEffect } from 'react';
import { useExamStore } from '@/store/examStore';
import { ItqonExam } from '@/types/exam';
import { ItqonExamForm } from './ItqonExamForm';
import { useAuthStore } from '@/store/authStore';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { formatDate } from '@/lib/utils';

export function ItqonExamList() {
  const { itqonExams, loadItqonExams, deleteItqonExam } = useExamStore();
  const [editingExam, setEditingExam] = useState<ItqonExam | null>(null);
  const { user } = useAuthStore();
  const { showUnauthorized } = useUnauthorized();

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [examFilter, setExamFilter] = useState('');
  const [examinerFilter, setExaminerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    loadItqonExams();
  }, [loadItqonExams]);

  const handleDelete = async (id: string) => {
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }
    if (window.confirm('Are you sure you want to delete this exam?')) {
      await deleteItqonExam(id);
    }
  };

  // Filter exams based on all criteria
  const filteredExams = itqonExams.filter(exam => {
    const matchesSearch = exam.student?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDate = !dateFilter || exam.examDate.startsWith(dateFilter);
    const matchesExam = !examFilter || exam.exam?.name === examFilter;
    const matchesExaminer = !examinerFilter || exam.teacher?.name === examinerFilter;
    const matchesStatus = !statusFilter || exam.status === statusFilter;

    return matchesSearch && matchesDate && matchesExam && matchesExaminer && matchesStatus;
  });

  // Get unique values for filters
  const uniqueExams = Array.from(new Set(itqonExams.map(exam => exam.exam?.name).filter(Boolean)));
  const uniqueExaminers = Array.from(new Set(itqonExams.map(exam => exam.teacher?.name).filter(Boolean)));
  const uniqueStatuses = Array.from(new Set(itqonExams.map(exam => exam.status)));

  return (
    <div className="space-y-6">
      {/* Filters Section */}
      <div className="bg-white p-4 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-semibold mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Exam</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Examiner</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tahfidz</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tajwid</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExams.map((exam) => (
                <tr key={exam.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.student?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.exam?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{formatDate(exam.examDate)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.teacher?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.tahfidzScore || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{exam.tajwidScore || '-'}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      exam.status === 'Passed' ? 'bg-green-100 text-green-800' :
                      exam.status === 'Failed' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {exam.status}
                    </span>
                  </td>
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