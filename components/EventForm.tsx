'use client';

import { useState, useEffect } from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import { AcademicCalendarEvent, CreateEventData } from '@/types/calendar';

interface EventFormProps {
  event?: AcademicCalendarEvent | null;
  onClose: () => void;
  onSuccess: () => void;
}

// Helper function to get current date in YYYY-MM-DD format for Jakarta
const getJakartaDate = (date?: Date) => {
  const jakartaDate = date ? new Date(date) : new Date();
  // Use the date as-is without timezone conversion to avoid shifts
  const year = jakartaDate.getFullYear();
  const month = String(jakartaDate.getMonth() + 1).padStart(2, '0');
  const day = String(jakartaDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to format time for Jakarta timezone
const getJakartaTime = (time?: string) => {
  if (!time) return '';
  // Ensure time is in Jakarta timezone format
  return time;
};

export function EventForm({ event, onClose, onSuccess }: EventFormProps) {
  const { addEvent, updateEvent, loading, error } = useCalendarStore();
  
  const [formData, setFormData] = useState<CreateEventData>({
    title: '',
    description: '',
    startDate: getJakartaDate(),
    endDate: '',
    startTime: '',
    endTime: '',
    location: '',
    eventType: 'general',
    color: '#3B82F6',
    isAllDay: false,
    isRecurring: false,
    recurrenceRule: ''
  });

  useEffect(() => {
    if (event) {
      // Use the event dates as-is without timezone conversion
      setFormData({
        title: event.title,
        description: event.description || '',
        startDate: event.startDate,
        endDate: event.endDate || '',
        startTime: event.startTime || '',
        endTime: event.endTime || '',
        location: event.location || '',
        eventType: event.eventType,
        color: event.color,
        isAllDay: event.isAllDay,
        isRecurring: event.isRecurring,
        recurrenceRule: event.recurrenceRule || ''
      });
    }
  }, [event]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Submit data as-is without timezone conversion
      const submitData = {
        ...formData,
        startDate: formData.startDate,
        endDate: formData.endDate || undefined,
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
      };

      if (event) {
        await updateEvent({ id: event.id, ...submitData });
      } else {
        await addEvent(submitData);
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving event:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const eventTypeColors = {
    general: '#3B82F6',
    exam: '#EF4444',
    holiday: '#10B981',
    meeting: '#F59E0B',
    activity: '#8B5CF6',
    deadline: '#EC4899'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold">
            {event ? 'Edit Event' : 'Add New Event'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Start Date *
              </label>
              <input
                type="date"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                min={formData.startDate}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              name="isAllDay"
              checked={formData.isAllDay}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              All Day Event
            </label>
          </div>

          {!formData.isAllDay && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Time
                </label>
                <input
                  type="time"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Time
                </label>
                <input
                  type="time"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  min={formData.startTime}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Event Type
              </label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="general">General</option>
                <option value="exam">Exam</option>
                <option value="holiday">Holiday</option>
                <option value="meeting">Meeting</option>
                <option value="activity">Activity</option>
                <option value="deadline">Deadline</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Color
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  name="color"
                  value={formData.color}
                  onChange={handleChange}
                  className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                />
                <select
                  value={formData.color}
                  onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="#3B82F6">Blue (General)</option>
                  <option value="#EF4444">Red (Exam)</option>
                  <option value="#10B981">Green (Holiday)</option>
                  <option value="#F59E0B">Orange (Meeting)</option>
                  <option value="#8B5CF6">Purple (Activity)</option>
                  <option value="#EC4899">Pink (Deadline)</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              name="isRecurring"
              checked={formData.isRecurring}
              onChange={handleChange}
              className="mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Recurring Event
            </label>
          </div>

          {formData.isRecurring && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Recurrence Rule
              </label>
              <input
                type="text"
                name="recurrenceRule"
                value={formData.recurrenceRule}
                onChange={handleChange}
                placeholder="e.g., FREQ=WEEKLY;INTERVAL=1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Use iCalendar RRULE format (optional)
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (event ? 'Update Event' : 'Create Event')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 