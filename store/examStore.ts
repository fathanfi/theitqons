import { create } from 'zustand';
import { Exam, ItqonExam } from '@/types/exam';
import { supabase } from '@/lib/supabase';

interface ExamStore {
  exams: Exam[];
  itqonExams: ItqonExam[];
  loadExams: () => Promise<void>;
  loadItqonExams: () => Promise<void>;
  addExam: (exam: Omit<Exam, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateExam: (exam: Exam) => Promise<void>;
  deleteExam: (id: string) => Promise<void>;
  addItqonExam: (exam: Omit<ItqonExam, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateItqonExam: (exam: ItqonExam) => Promise<void>;
  deleteItqonExam: (id: string) => Promise<void>;
}

export const useExamStore = create<ExamStore>((set) => ({
  exams: [],
  itqonExams: [],

  loadExams: async () => {
    const { data } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      set({ exams: data });
    }
  },

  loadItqonExams: async () => {
    const { data } = await supabase
      .from('itqon_exams')
      .select(`
        *,
        exam:exams(*),
        student:students(id, name),
        teacher:teachers(id, name)
      `)
      .order('exam_date', { ascending: false });

    if (data) {
      set({
        itqonExams: data.map(exam => ({
          id: exam.id,
          examId: exam.exam_id,
          studentId: exam.student_id,
          teacherId: exam.teacher_id,
          examDate: exam.exam_date,
          tahfidzScore: exam.tahfidz_score,
          tajwidScore: exam.tajwid_score,
          status: exam.status,
          createdAt: exam.created_at,
          updatedAt: exam.updated_at,
          exam: exam.exam,
          student: exam.student,
          teacher: exam.teacher
        }))
      });
    }
  },

  addExam: async (exam) => {
    const { data, error } = await supabase
      .from('exams')
      .insert([exam])
      .select()
      .single();

    if (data && !error) {
      set(state => ({
        exams: [data, ...state.exams]
      }));
    }
  },

  updateExam: async (exam) => {
    const { error } = await supabase
      .from('exams')
      .update({
        name: exam.name,
        description: exam.description,
        updated_at: new Date().toISOString()
      })
      .eq('id', exam.id);

    if (!error) {
      set(state => ({
        exams: state.exams.map(e =>
          e.id === exam.id ? exam : e
        )
      }));
    }
  },

  deleteExam: async (id) => {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);

    if (!error) {
      set(state => ({
        exams: state.exams.filter(exam => exam.id !== id)
      }));
    }
  },

  addItqonExam: async (exam) => {
    const { data, error } = await supabase
      .from('itqon_exams')
      .insert([{
        exam_id: exam.examId,
        student_id: exam.studentId,
        teacher_id: exam.teacherId,
        exam_date: exam.examDate,
        tahfidz_score: exam.tahfidzScore,
        tajwid_score: exam.tajwidScore,
        status: exam.status
      }])
      .select(`
        *,
        exam:exams(*),
        student:students(id, name),
        teacher:teachers(id, name)
      `)
      .single();

    if (data && !error) {
      const newExam: ItqonExam = {
        id: data.id,
        examId: data.exam_id,
        studentId: data.student_id,
        teacherId: data.teacher_id,
        examDate: data.exam_date,
        tahfidzScore: data.tahfidz_score,
        tajwidScore: data.tajwid_score,
        status: data.status,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        exam: data.exam,
        student: data.student,
        teacher: data.teacher
      };

      set(state => ({
        itqonExams: [newExam, ...state.itqonExams]
      }));
    }
  },

  updateItqonExam: async (exam) => {
    const { error } = await supabase
      .from('itqon_exams')
      .update({
        exam_id: exam.examId,
        student_id: exam.studentId,
        teacher_id: exam.teacherId,
        exam_date: exam.examDate,
        tahfidz_score: exam.tahfidzScore,
        tajwid_score: exam.tajwidScore,
        status: exam.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', exam.id);

    if (!error) {
      set(state => ({
        itqonExams: state.itqonExams.map(e =>
          e.id === exam.id ? exam : e
        )
      }));
    }
  },

  deleteItqonExam: async (id) => {
    const { error } = await supabase
      .from('itqon_exams')
      .delete()
      .eq('id', id);

    if (!error) {
      set(state => ({
        itqonExams: state.itqonExams.filter(exam => exam.id !== id)
      }));
    }
  }
}));