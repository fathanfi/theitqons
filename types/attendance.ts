export interface Attendance {
  id: string;
  student_id: string;
  academic_year_id: string;
  group_id: string;
  week_number: number;
  year: number;
  day_index: number; // 0 = Monday, 1 = Tuesday, etc.
  status: 'present' | 'sick' | 'permit' | 'absent';
  created_at: string;
  updated_at: string;
}

export interface AttendanceFormData {
  student_id: string;
  academic_year_id: string;
  group_id: string;
  week_number: number;
  year: number;
  day_index: number;
  status: 'present' | 'sick' | 'permit' | 'absent';
}

export interface AttendanceByWeek {
  [studentId: string]: {
    [dayIndex: number]: 'present' | 'sick' | 'permit' | 'absent';
  };
} 