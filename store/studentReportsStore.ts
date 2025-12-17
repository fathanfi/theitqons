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
    score: Array<{ name: string; tahfidz_score: string; tahsin_score: string; customName: string }>;
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
  completion_status?: 'complete' | 'incomplete' | 'empty';
}

interface StudentReportsStore {
  currentReport: StudentReport | null;
  loadReport: (academicYearId: string, sessionId: number, studentId: string) => Promise<void>;
  saveReport: (report: Omit<StudentReport, 'id' | 'status'>) => Promise<{ error: any }>;
  updateReport: (report: StudentReport) => Promise<{ error: any }>;
  getPrincipalName: () => Promise<string>;
  getTeacherName: (studentId: string) => Promise<string>;
  getParentName: (studentId: string) => Promise<string>;
  getClassName: (classId: string) => Promise<string>;
  getLevelName: (levelId: string) => Promise<string>;
  getGroupName: (studentId: string) => Promise<string>;
  calculateCompletionStatus: (report: Omit<StudentReport, 'id' | 'status'>) => 'complete' | 'incomplete' | 'empty';
}

export const useStudentReportsStore = create<StudentReportsStore>((set, get) => ({
  currentReport: null,

  calculateCompletionStatus: (report) => {
    const { meta_values } = report;
    
    // Check if any field is filled
    const hasAnyData = 
      meta_values.ziyadah.adab.predicate ||
      meta_values.ziyadah.murajaah.predicate ||
      meta_values.ziyadah.tahsin.predicate ||
      meta_values.ziyadah.target.predicate ||
      meta_values.score.length > 0 ||
      meta_values.attendance.present > 0 ||
      meta_values.attendance.permit > 0 ||
      meta_values.attendance.absence > 0 ||
      meta_values.notes ||
      meta_values.signatures.place ||
      meta_values.signatures.parent ||
      meta_values.signatures.principal ||
      meta_values.signatures.teacher;

    if (!hasAnyData) return 'empty';

    // Check ziyadah completion
    const ziyadahComplete = 
      meta_values.ziyadah.adab.predicate &&
      meta_values.ziyadah.murajaah.predicate &&
      meta_values.ziyadah.tahsin.predicate &&
      meta_values.ziyadah.target.predicate &&
      meta_values.ziyadah.adab.description.split(' ').length <= 10 &&
      meta_values.ziyadah.murajaah.description.split(' ').length <= 10 &&
      meta_values.ziyadah.tahsin.description.split(' ').length <= 10 &&
      meta_values.ziyadah.target.description.split(' ').length <= 10;

    // Check score completion (minimum 1 score)
    const scoreComplete = meta_values.score.length >= 1 && meta_values.score.every(s => s.name && s.tahfidz_score && s.tahsin_score);

    // Check notes completion (20-60 words)
    const notesWordCount = meta_values.notes.trim().split(/\s+/).length;
    const notesComplete = notesWordCount >= 20 && notesWordCount <= 40;

    // Check attendance completion
    const attendanceComplete = 
      meta_values.attendance.present >= 0 &&
      meta_values.attendance.permit >= 0 &&
      meta_values.attendance.absence >= 0;

    // Check signatures completion
    const signaturesComplete = 
      meta_values.signatures.place &&
      meta_values.signatures.parent &&
      meta_values.signatures.principal &&
      meta_values.signatures.teacher;

    return (ziyadahComplete && scoreComplete && notesComplete && attendanceComplete && signaturesComplete) 
      ? 'complete' 
      : 'incomplete';
  },

  loadReport: async (academicYearId: string, sessionId: number, studentId: string) => {
    console.log('academicYearId', academicYearId);
    console.log('sessionId', sessionId);
    console.log('studentId', studentId);
    // Sanitize values to remove 'eq.' prefix if present
    const clean = (val: string | number) => typeof val === 'string' ? val.replace(/^eq\./, '') : val;
    try {
      // Use .maybeSingle() instead of .single() to handle cases where no record exists
      // If multiple records exist, get the most recent one
      const { data, error } = await supabase
        .from('student_reports')
        .select('*')
        .eq('academic_year_id', clean(academicYearId))
        .eq('session_id', clean(sessionId))
        .eq('student_id', clean(studentId))
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      
      // If multiple records exist, we got the most recent one
      // If no record exists, data will be null
      set({ currentReport: data || null });
    } catch (error) {
      console.error('Error loading report:', error);
      set({ currentReport: null });
    }
  },

  saveReport: async (report) => {
    try {
      const { completion_status, ...rest } = report;
      
      // First, check if a report already exists with the same academic_year_id, session_id, and student_id
      const { data: existingReport, error: checkError } = await supabase
        .from('student_reports')
        .select('id, status')
        .eq('academic_year_id', report.academic_year_id)
        .eq('session_id', report.session_id)
        .eq('student_id', report.student_id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found" which is fine
        throw checkError;
      }

      // If report exists, update it instead of inserting
      if (existingReport) {
        const { error: updateError } = await supabase
          .from('student_reports')
          .update({ ...rest, completion_status, updated_at: new Date().toISOString() })
          .eq('id', existingReport.id);

        if (updateError) throw updateError;
        return { error: null };
      }

      // If no report exists, insert a new one
      const { error: insertError } = await supabase
        .from('student_reports')
        .insert([{ ...rest, status: 'draft', completion_status }]);

      if (insertError) throw insertError;
      return { error: null };
    } catch (error) {
      console.error('Error saving report:', error);
      return { error };
    }
  },

  updateReport: async (report) => {
    try {
      const { completion_status, ...rest } = report;
      const { error } = await supabase
        .from('student_reports')
        .update({ ...rest, completion_status })
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
            id,
            created_at,
            teacher:teachers (
              name
            )
          )
        `)
        .eq('student_id', studentId);

      if (error) throw error;
      if (!data || data.length === 0) return '';

      // If there are multiple groups, sort by created_at (most recent first), then by id (highest)
      const sortedData = [...data].sort((a, b) => {
        const groupA = Array.isArray(a.groups) ? a.groups[0] : a.groups;
        const groupB = Array.isArray(b.groups) ? b.groups[0] : b.groups;
        
        // Sort by created_at descending (most recent first)
        const dateA = groupA?.created_at ? new Date(groupA.created_at).getTime() : 0;
        const dateB = groupB?.created_at ? new Date(groupB.created_at).getTime() : 0;
        
        if (dateB !== dateA) {
          return dateB - dateA; // Descending order (most recent first)
        }
        
        // If created_at is the same, sort by id (highest/UUID lexicographically)
        return (groupB?.id || '').localeCompare(groupA?.id || '');
      });

      const firstEntry = sortedData[0];
      const group = Array.isArray(firstEntry?.groups) ? firstEntry.groups[0] : firstEntry?.groups;
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

  getClassName: async (classId: string) => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('name')
        .eq('id', classId)
        .single();

      if (error) throw error;
      return data?.name || '';
    } catch (error) {
      console.error('Error getting class name:', error);
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
            id,
            created_at,
            name
          )
        `)
        .eq('student_id', studentId);

      if (error) throw error;
      if (!data || data.length === 0) return '';

      // If there are multiple groups, sort by created_at (most recent first), then by id (highest)
      const sortedData = [...data].sort((a, b) => {
        const groupA = Array.isArray(a.groups) ? a.groups[0] : a.groups;
        const groupB = Array.isArray(b.groups) ? b.groups[0] : b.groups;
        
        // Sort by created_at descending (most recent first)
        const dateA = groupA?.created_at ? new Date(groupA.created_at).getTime() : 0;
        const dateB = groupB?.created_at ? new Date(groupB.created_at).getTime() : 0;
        
        if (dateB !== dateA) {
          return dateB - dateA; // Descending order (most recent first)
        }
        
        // If created_at is the same, sort by id (highest/UUID lexicographically)
        return (groupB?.id || '').localeCompare(groupA?.id || '');
      });

      const firstEntry = sortedData[0];
      const group = Array.isArray(firstEntry?.groups) ? firstEntry.groups[0] : firstEntry?.groups;
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