'use client';

import { useState, useEffect } from 'react';
import { useExamStore } from '@/store/examStore';
import { Exam } from '@/types/exam';
import { ExamForm } from './ExamForm';

export function ExamList() {
  const exams = useExamStore((state) => state.exams);
  const loadExams = useExamStore((state) => state.loadExams);
  const deleteExam = useExamStore((state) => state.deleteExam);
  const [editingExam, setEditingExam] = useState<Exam | null>(null);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-semibold mb-6">Exams List</h2>
      {editingExam && (
        <div className="mb-6">
          <ExamForm 
            editExam={editingExam} 
            onUpdate={() => setEditingExam(null)} 
          />
        </div>
      )}
      <div className="space-y-4">
        {exams.map((exam) => (
          <div key={exam.id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{exam.name}</h3>
                {exam.description && (
                  <p className="text-sm text-gray-500">{exam.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingExam(exam)}
                  className="text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteExam(exam.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
        {exams.length === 0 && (
          <p className="text-gray-500 text-center">No exams added yet.</p>
        )}
      </div>
    </div>
  );
}