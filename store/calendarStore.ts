import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { AcademicCalendarEvent, CreateEventData, UpdateEventData } from '@/types/calendar';

interface CalendarStore {
  events: AcademicCalendarEvent[];
  loading: boolean;
  error: string | null;
  
  // Actions
  loadEvents: () => Promise<void>;
  addEvent: (eventData: CreateEventData) => Promise<void>;
  updateEvent: (eventData: UpdateEventData) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  getEventsByDateRange: (startDate: string, endDate: string) => AcademicCalendarEvent[];
  clearError: () => void;
}

export const useCalendarStore = create<CalendarStore>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  loadEvents: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('academic_calendar_events')
        .select('*')
        .order('start_date', { ascending: true });

      if (error) throw error;

      const transformedEvents: AcademicCalendarEvent[] = data.map(event => ({
        id: event.id,
        title: event.title,
        description: event.description,
        startDate: event.start_date,
        endDate: event.end_date,
        startTime: event.start_time,
        endTime: event.end_time,
        location: event.location,
        eventType: event.event_type,
        color: event.color,
        isAllDay: event.is_all_day,
        isRecurring: event.is_recurring,
        recurrenceRule: event.recurrence_rule,
        createdBy: event.created_by,
        createdAt: event.created_at,
        updatedAt: event.updated_at
      }));

      set({ events: transformedEvents, loading: false });
    } catch (error) {
      console.error('Error loading events:', error);
      set({ error: 'Failed to load events', loading: false });
    }
  },

  addEvent: async (eventData: CreateEventData) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('academic_calendar_events')
        .insert([{
          title: eventData.title,
          description: eventData.description,
          start_date: eventData.startDate,
          end_date: eventData.endDate,
          start_time: eventData.startTime,
          end_time: eventData.endTime,
          location: eventData.location,
          event_type: eventData.eventType,
          color: eventData.color || '#3B82F6',
          is_all_day: eventData.isAllDay,
          is_recurring: eventData.isRecurring,
          recurrence_rule: eventData.recurrenceRule
        }])
        .select()
        .single();

      if (error) throw error;

      const newEvent: AcademicCalendarEvent = {
        id: data.id,
        title: data.title,
        description: data.description,
        startDate: data.start_date,
        endDate: data.end_date,
        startTime: data.start_time,
        endTime: data.end_time,
        location: data.location,
        eventType: data.event_type,
        color: data.color,
        isAllDay: data.is_all_day,
        isRecurring: data.is_recurring,
        recurrenceRule: data.recurrence_rule,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      set(state => ({
        events: [...state.events, newEvent],
        loading: false
      }));
    } catch (error) {
      console.error('Error adding event:', error);
      set({ error: 'Failed to add event', loading: false });
    }
  },

  updateEvent: async (eventData: UpdateEventData) => {
    set({ loading: true, error: null });
    try {
      const updateData: any = {};
      if (eventData.title !== undefined) updateData.title = eventData.title;
      if (eventData.description !== undefined) updateData.description = eventData.description;
      if (eventData.startDate !== undefined) updateData.start_date = eventData.startDate;
      if (eventData.endDate !== undefined) updateData.end_date = eventData.endDate;
      if (eventData.startTime !== undefined) updateData.start_time = eventData.startTime;
      if (eventData.endTime !== undefined) updateData.end_time = eventData.endTime;
      if (eventData.location !== undefined) updateData.location = eventData.location;
      if (eventData.eventType !== undefined) updateData.event_type = eventData.eventType;
      if (eventData.color !== undefined) updateData.color = eventData.color;
      if (eventData.isAllDay !== undefined) updateData.is_all_day = eventData.isAllDay;
      if (eventData.isRecurring !== undefined) updateData.is_recurring = eventData.isRecurring;
      if (eventData.recurrenceRule !== undefined) updateData.recurrence_rule = eventData.recurrenceRule;

      const { data, error } = await supabase
        .from('academic_calendar_events')
        .update(updateData)
        .eq('id', eventData.id)
        .select()
        .single();

      if (error) throw error;

      const updatedEvent: AcademicCalendarEvent = {
        id: data.id,
        title: data.title,
        description: data.description,
        startDate: data.start_date,
        endDate: data.end_date,
        startTime: data.start_time,
        endTime: data.end_time,
        location: data.location,
        eventType: data.event_type,
        color: data.color,
        isAllDay: data.is_all_day,
        isRecurring: data.is_recurring,
        recurrenceRule: data.recurrence_rule,
        createdBy: data.created_by,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      set(state => ({
        events: state.events.map(event => 
          event.id === eventData.id ? updatedEvent : event
        ),
        loading: false
      }));
    } catch (error) {
      console.error('Error updating event:', error);
      set({ error: 'Failed to update event', loading: false });
    }
  },

  deleteEvent: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('academic_calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set(state => ({
        events: state.events.filter(event => event.id !== id),
        loading: false
      }));
    } catch (error) {
      console.error('Error deleting event:', error);
      set({ error: 'Failed to delete event', loading: false });
    }
  },

  getEventsByDateRange: (startDate: string, endDate: string) => {
    const { events } = get();
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      const rangeStart = new Date(startDate);
      const rangeEnd = new Date(endDate);
      
      return eventStart <= rangeEnd && eventEnd >= rangeStart;
    });
  },

  clearError: () => set({ error: null })
})); 