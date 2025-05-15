'use client';

import { useState, useEffect } from 'react';
import { useExamStore } from '@/store/examStore';
import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { ItqonExam } from '@/types/exam';
import Select from 'react-select';
import { useUnauthorized } from '@/contexts/UnauthorizedContext';
import { useAuthStore } from '@/store/authStore';

const SCORE_OPTIONS = [
  'Outstanding',
  'Very Good',
  'Good',
  'Need Improvement',
  'Bad',
  'Very Bad'
] as const;

const STATUS_OPTIONS = [
  'Scheduled',
  'Passed',
  'Failed'
] as const;

export function ItqonExamForm({ editExam, onUpdate }: { editExam?: ItqonExam; onUpdate?: () => void }) {
  const exams = useExamStore((state) => state.exams);
  const loadExams = useExamStore((state) => state.loadExams);
  const addItqonExam = useExamStore((state) => state.addItqonExam);
  const updateItqonExam = useExamStore((state) => state.updateItqonExam);
  
  const students = useStore((state) => state.students);
  const loadStudents = useStore((state) => state.loadStudents);
  
  const teachers = useSchoolStore((state) => state.teachers);
  const loadTeachers = useSchoolStore((state) => state.loadTeachers);

  const { showUnauthorized } = useUnauthorized();
  const { user } = useAuthStore();

  useEffect(() => {
    loadExams();
    loadStudents();
    loadTeachers();
  }, [loadExams, loadStudents, loadTeachers]);

  const [formData, setFormData] = useState<Partial<ItqonExam>>(
    editExam || {
      studentId: '',
      examId: '08c8f7c4-0f23-4aec-9a70-d951fa6da9f6', // Default to Itqon 1
      examDate: '2024-11-01', // Remove time, just date
      status: 'Passed',
      tahfidzScore: 'Good',
      tajwidScore: 'Good',
      examNotes: '',
      teacherId: '01c32d4c-a1a9-46ba-a6ad-f27c3dbfee7f' // Default examiner
    }
  );

  useEffect(() => {
    if (editExam) {
      // Ensure the date is in the correct format for date input
      const examDate = editExam.examDate ? new Date(editExam.examDate).toISOString().split('T')[0] : '';
      setFormData({
        ...editExam,
        examDate
      });
    }
  }, [editExam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || user.role !== 'admin') {
      showUnauthorized();
      return;
    }

    // Set time to start of day (00:00:00)
    const localDate = new Date(formData.examDate || '');
    localDate.setHours(0, 0, 0, 0);
    const utcDate = new Date(localDate.getTime() - (localDate.getTimezoneOffset() * 60000));

    const submitData = {
      ...formData,
      status: formData.status || 'Scheduled',
      examDate: utcDate.toISOString()
    };

    if (editExam) {
      await updateItqonExam({ ...editExam, ...submitData } as ItqonExam);
      onUpdate?.();
    } else {
      const newExam = await addItqonExam(submitData as Omit<ItqonExam, 'id' | 'createdAt' | 'updatedAt'>);
      // Reset form with default values
      setFormData({
        studentId: '',
        examId: 'itqon-1', // Reset to default exam
        examDate: '2024-11-01', // Reset to default date
        status: 'Passed',
        tahfidzScore: 'Good',
        tajwidScore: 'Good',
        examNotes: '',
        teacherId: '01c32d4c-a1a9-46ba-a6ad-f27c3dbfee7f' // Reset to default examiner
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const studentOptions = students.map(student => ({
    value: student.id,
    label: student.name
  }));

  const teacherOptions = teachers
    .filter(teacher => teacher.status)
    .map(teacher => ({
      value: teacher.id,
      label: teacher.name
    }));

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold">
          {editExam ? 'Edit Itqon Exam' : 'Add New Itqon Exam'}
        </h2>
        {editExam && (
          <button
            type="button"
            onClick={() => onUpdate?.()}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
        )}
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date</label>
          <input
            type="date"
            name="examDate"
            value={formData.examDate}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Student</label>
          <Select
            options={studentOptions}
            value={studentOptions.find(option => option.value === formData.studentId)}
            onChange={(selected) => setFormData(prev => ({ ...prev, studentId: selected?.value || '' }))}
            className="mt-1"
            placeholder="Search and select student..."
            isClearable
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Exam</label>
          <select
            name="examId"
            value={formData.examId}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            required
          >
            <option value="">Select Exam</option>
            {exams.map(exam => (
              <option key={exam.id} value={exam.id}>
                {exam.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Examiner</label>
          <Select
            options={teacherOptions}
            value={teacherOptions.find(option => option.value === formData.teacherId)}
            onChange={(selected) => setFormData(prev => ({ ...prev, teacherId: selected?.value || '' }))}
            className="mt-1"
            placeholder="Search and select teacher..."
            isClearable
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tahfidz Score</label>
          <select
            name="tahfidzScore"
            value={formData.tahfidzScore}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="">Select Score</option>
            {SCORE_OPTIONS.map(score => (
              <option key={score} value={score}>
                {score}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Tajwid Score</label>
          <select
            name="tajwidScore"
            value={formData.tajwidScore}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="">Select Score</option>
            {SCORE_OPTIONS.map(score => (
              <option key={score} value={score}>
                {score}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
          >
            <option value="">Select Status</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Exam Notes</label>
          <textarea
            name="examNotes"
            value={formData.examNotes}
            onChange={handleChange}
            rows={4}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            placeholder="Add any notes about the exam..."
          />
        </div>

        <button
          type="submit"
          className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          {editExam ? 'Update Exam' : 'Add Exam'}
        </button>
      </div>
    </form>
  );
}