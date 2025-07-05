export interface AcademicCalendarEvent {
  id: string;
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  eventType: 'general' | 'exam' | 'holiday' | 'meeting' | 'activity' | 'deadline';
  color: string;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrenceRule?: string;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  startDate: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  eventType: 'general' | 'exam' | 'holiday' | 'meeting' | 'activity' | 'deadline';
  color?: string;
  isAllDay: boolean;
  isRecurring: boolean;
  recurrenceRule?: string;
}

export interface UpdateEventData extends Partial<CreateEventData> {
  id: string;
} 