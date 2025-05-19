import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

interface StudentReport {
  id?: string;
  academic_year_id: string;
  session_id: number;
  student_id: string;
  meta_values: {
    ziyadah: {
      adab: { predicate: string; description: string };
      murajaah: { predicate: string; description: string };
      tahsin: { predicate: string; description: string };
      target: { predicate: string; description: string };
    };
    score: Array<{ name: string; value: string; predicate: string }>;
    attendance: { present: number; permit: number; absence: number };
    notes: string;
    signatures: {
      place: string;
      date: string;
      parent: string;
      principal: string;
      teacher: string;
    };
  };
  status?: string;
}

interface StudentReportsStore {
  currentReport: StudentReport | null;
  loadReport: (academicYearId: string, sessionId: number, studentId: string) => Promise<void>;
  saveReport: (report: Omit<StudentReport, 'id' | 'status'>) => Promise<{ error: any }>;
  updateReport: (report: StudentReport) => Promise<{ error: any }>;
  getPrincipalName: () => Promise<string>;
  getTeacherName: (studentId: string) => Promise<string>;
  getParentName: (studentId: string) => Promise<string>;
  getLevelName: (levelId: string) => Promise<string>;
  getGroupName: (studentId: string) => Promise<string>;
}

export const useStudentReportsStore = create<StudentReportsStore>((set, get) => ({
  currentReport: null,

  loadReport: async (academicYearId: string, sessionId: number, studentId: string) => {
    console.log('academicYearId', academicYearId);
    console.log('sessionId', sessionId);
    console.log('studentId', studentId);
    // Sanitize values to remove 'eq.' prefix if present
    const clean = (val: string | number) => typeof val === 'string' ? val.replace(/^eq\./, '') : val;
    try {
      const { data, error } = await supabase
        .from('student_reports')
        .select('*')
        .eq('academic_year_id', clean(academicYearId))
        .eq('session_id', clean(sessionId))
        .eq('student_id', clean(studentId))
        .single();

      if (error) throw error;
      set({ currentReport: data });
    } catch (error) {
      console.error('Error loading report:', error);
      set({ currentReport: null });
    }
  },

  saveReport: async (report) => {
    try {
      const { error } = await supabase
        .from('student_reports')
        .insert([{ ...report, status: 'draft' }]);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error saving report:', error);
      return { error };
    }
  },

  updateReport: async (report) => {
    try {
      const { error } = await supabase
        .from('student_reports')
        .update(report)
        .eq('id', report.id);

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('Error updating report:', error);
      return { error };
    }
  },

  getPrincipalName: async () => {
    try {
      const { data, error } = await supabase
        .from('school_settings')
        .select('principal_name')
        .single();

      if (error) throw error;
      return data?.principal_name || '';
    } catch (error) {
      console.error('Error getting principal name:', error);
      return '';
    }
  },

  getTeacherName: async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_students')
        .select(`
          groups!inner (
            teacher:teachers (
              name
            )
          )
        `)
        .eq('student_id', studentId)
        .single();

      if (error) throw error;
      // groups is likely an array or object with teacher as array
      const group = Array.isArray(data?.groups) ? data.groups[0] : data?.groups;
      const teacher = group?.teacher;
      if (Array.isArray(teacher)) {
        // Explicitly cast as any to avoid TS inferring never
        return teacher.length > 0 && typeof teacher[0] === 'object' && teacher[0] !== null && 'name' in teacher[0] ? (teacher[0] as any).name : '';
      } else if (teacher && typeof teacher === 'object' && 'name' in teacher) {
        return (teacher as any).name;
      } else {
        return '';
      }
    } catch (error) {
      console.error('Error getting teacher name:', error);
      return '';
    }
  },

  getParentName: async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('father_name')
        .eq('id', studentId)
        .single();

      if (error) throw error;
      return data?.father_name || '';
    } catch (error) {
      console.error('Error getting parent name:', error);
      return '';
    }
  },

  getLevelName: async (levelId: string) => {
    try {
      const { data, error } = await supabase
        .from('levels')
        .select('name')
        .eq('id', levelId)
        .single();

      if (error) throw error;
      return data?.name || '';
    } catch (error) {
      console.error('Error getting level name:', error);
      return '';
    }
  },

  getGroupName: async (studentId: string) => {
    try {
      const { data, error } = await supabase
        .from('group_students')
        .select(`
          groups!inner (
            name
          )
        `)
        .eq('student_id', studentId)
        .single();

      if (error) throw error;
      const group = Array.isArray(data?.groups) ? data.groups[0] : data?.groups;
      if (group && typeof group === 'object' && 'name' in group) {
        return group.name;
      } else {
        return '';
      }
    } catch (error) {
      console.error('Error getting group name:', error);
      return '';
    }
  },
})); 