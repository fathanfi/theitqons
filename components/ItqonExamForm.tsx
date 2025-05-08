'use client';

import { useState, useEffect } from 'react';
import { useExamStore } from '@/store/examStore';
import { useStore } from '@/store/useStore';
import { useSchoolStore } from '@/store/schoolStore';
import { ItqonExam } from '@/types/exam';
import Select from 'react-select';

const SCORE_OPTIONS = [
  'Outstanding',
  'Very Good',
  'Good',
  'Need Improvement',
  'Bad',
  'Very Bad'
] as const;

const STATUS_OPTIONS = [
  'Passed',
  'Failed',
  'Re-schedule'
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

  useEffect(() => {
    loadExams();
    loadStudents();
    loadTeachers();
  }, [loadExams, loadStudents, loadTeachers]);

  const [formData, setFormData] = useState<Partial<ItqonExam>>(
    editExam || {
      examDate: new Date().toISOString().slice(0, 16),
      examId: '',
      studentId: '',
      teacherId: '',
      tahfidzScore: undefined,
      tajwidScore: undefined,
      status: undefined
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editExam) {
      await updateItqonExam({ ...editExam, ...formData } as ItqonExam);
      onUpdate?.();
    } else {
      await addItqonExam(formData as Omit<ItqonExam, 'id' | 'createdAt' | 'updatedAt'>);
      setFormData({
        examDate: new Date().toISOString().slice(0, 16),
        examId: '',
        studentId: '',
        teacherId: '',
        tahfidzScore: undefined,
        tajwidScore: undefined,
        status: undefined
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      <h2 className="text-2xl font-semibold mb-6">
        {editExam ? 'Edit Itqon Exam' : 'Add New Itqon Exam'}
      </h2>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Date and Time</label>
          <input
            type="datetime-local"
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