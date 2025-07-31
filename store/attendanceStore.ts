import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { Attendance, AttendanceFormData, AttendanceByWeek } from '@/types/attendance';

interface AttendanceStore {
  attendanceRecords: Attendance[];
  attendanceByWeek: AttendanceByWeek;
  isLoading: boolean;
  error: string | null;
  
  // Load attendance for a specific week and group
  loadAttendanceByWeek: (academicYearId: string, groupId: string, weekNumber: number, year: number) => Promise<void>;
  
  // Insert new attendance record
  insertAttendance: (data: AttendanceFormData) => Promise<void>;
  
  // Update existing attendance record
  updateAttendance: (id: string, data: Partial<AttendanceFormData>) => Promise<void>;
  
  // Upsert attendance (insert or update)
  upsertAttendance: (data: AttendanceFormData) => Promise<void>;
  
  // Get attendance status for a student on a specific day
  getAttendanceStatus: (studentId: string, dayIndex: number) => 'present' | 'sick' | 'permit' | 'absent';
  
  // Clear error
  clearError: () => void;
  
  // Clear all attendance data
  clearAttendanceData: () => void;
}

export const useAttendanceStore = create<AttendanceStore>((set, get) => ({
  attendanceRecords: [],
  attendanceByWeek: {},
  isLoading: false,
  error: null,

  loadAttendanceByWeek: async (academicYearId: string, groupId: string, weekNumber: number, year: number) => {
    set({ isLoading: true, error: null });
    
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('academic_year_id', academicYearId)
        .eq('group_id', groupId)
        .eq('week_number', weekNumber)
        .eq('year', year);

      if (error) throw error;

      // Transform data into AttendanceByWeek format
      const newAttendanceByWeek: AttendanceByWeek = {};
      
      data?.forEach((record: Attendance) => {
        if (!newAttendanceByWeek[record.student_id]) {
          newAttendanceByWeek[record.student_id] = {};
        }
        newAttendanceByWeek[record.student_id][record.day_index] = record.status;
      });

      // Clear existing data for this specific week and group, then add new data
      set(state => {
        // Remove existing records for this week/group combination
        const filteredRecords = state.attendanceRecords.filter(r => 
          !(r.academic_year_id === academicYearId && r.group_id === groupId && r.week_number === weekNumber && r.year === year)
        );
        
        // Create a new attendanceByWeek object without the old data for this week/group
        const filteredAttendanceByWeek: AttendanceByWeek = {};
        Object.keys(state.attendanceByWeek).forEach(studentId => {
          const studentData = state.attendanceByWeek[studentId];
          if (studentData) {
            // Only keep data that's not from this specific week/group
            // We'll add the new data below
            filteredAttendanceByWeek[studentId] = { ...studentData };
          }
        });
        
        return {
          attendanceRecords: [...filteredRecords, ...(data || [])],
          attendanceByWeek: { ...filteredAttendanceByWeek, ...newAttendanceByWeek },
          isLoading: false 
        };
      });
    } catch (error) {
      console.error('Error loading attendance:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to load attendance',
        isLoading: false 
      });
    }
  },

  insertAttendance: async (data: AttendanceFormData) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('attendance')
        .insert([data]);

      if (error) throw error;

      // Reload attendance data
      await get().loadAttendanceByWeek(data.academic_year_id, data.group_id, data.week_number, data.year);
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error inserting attendance:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to insert attendance',
        isLoading: false 
      });
    }
  },

  updateAttendance: async (id: string, data: Partial<AttendanceFormData>) => {
    set({ isLoading: true, error: null });
    
    try {
      const { error } = await supabase
        .from('attendance')
        .update(data)
        .eq('id', id);

      if (error) throw error;

      // Reload attendance data
      const currentRecord = get().attendanceRecords.find(r => r.id === id);
      if (currentRecord) {
        await get().loadAttendanceByWeek(
          currentRecord.academic_year_id, 
          currentRecord.group_id, 
          currentRecord.week_number, 
          currentRecord.year
        );
      }
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Error updating attendance:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to update attendance',
        isLoading: false 
      });
    }
  },

  upsertAttendance: async (data: AttendanceFormData) => {
    try {
      // Check if record already exists
      const { data: existingRecord, error: selectError } = await supabase
        .from('attendance')
        .select('id')
        .eq('student_id', data.student_id)
        .eq('academic_year_id', data.academic_year_id)
        .eq('group_id', data.group_id)
        .eq('week_number', data.week_number)
        .eq('year', data.year)
        .eq('day_index', data.day_index)
        .maybeSingle();

      if (selectError && selectError.code !== 'PGRST116') { // PGRST116 is "not found"
        throw selectError;
      }

      if (existingRecord) {
        // Update existing record
        await get().updateAttendance(existingRecord.id, data);
      } else {
        // Insert new record
        await get().insertAttendance(data);
      }
      
      // Refresh the attendance data for this week and group
      await get().loadAttendanceByWeek(data.academic_year_id, data.group_id, data.week_number, data.year);
      
    } catch (error) {
      console.error('Error upserting attendance:', error);
      set({ 
        error: error instanceof Error ? error.message : 'Failed to save attendance'
      });
    }
  },

  getAttendanceStatus: (studentId: string, dayIndex: number) => {
    try {
      const { attendanceByWeek } = get();
      return attendanceByWeek[studentId]?.[dayIndex] || 'absent';
    } catch (error) {
      console.error('Error getting attendance status:', error);
      return 'absent';
    }
  },

  clearError: () => set({ error: null }),
  
  clearAttendanceData: () => set({ attendanceRecords: [], attendanceByWeek: {}, error: null }),
})); 