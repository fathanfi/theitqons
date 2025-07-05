'use client';

import { useState, useEffect } from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import { useAuthStore } from '@/store/authStore';
import { AcademicCalendarEvent } from '@/types/calendar';
import { EventForm } from './EventForm';

// Helper function to format date for display
const formatDate = (date: Date) => {
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'short', 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('id-ID', options);
};

// Helper function to get month name in Indonesian
const getIndonesianMonthName = (month: number) => {
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return months[month];
};

// Helper function to get day name in Indonesian
const getIndonesianDayName = (day: number) => {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return days[day];
};

// View-only Event Modal Component
function EventViewModal({ event, onClose }: { event: AcademicCalendarEvent; onClose: () => void }) {
  const formatEventDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Event Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Title</label>
            <p className="text-gray-900 font-medium">{event.title}</p>
          </div>

          {event.description && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
              <p className="text-gray-900">{event.description}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Date</label>
            <p className="text-gray-900">
              {formatEventDate(event.startDate)}
              {event.endDate && event.endDate !== event.startDate && 
                ` - ${formatEventDate(event.endDate)}`
              }
            </p>
          </div>

          {!event.isAllDay && event.startTime && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Time</label>
              <p className="text-gray-900">
                {event.startTime}
                {event.endTime && ` - ${event.endTime}`}
              </p>
            </div>
          )}

          {event.location && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Location</label>
              <p className="text-gray-900">{event.location}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
            <span 
              className="inline-block px-2 py-1 text-xs font-medium rounded-full"
              style={{ backgroundColor: event.color + '20', color: event.color }}
            >
              {event.eventType}
            </span>
          </div>

          {event.isRecurring && event.recurrenceRule && (
            <div>
              <label className="block text-sm font-medium text-gray-500 mb-1">Recurrence</label>
              <p className="text-gray-900 text-sm">{event.recurrenceRule}</p>
            </div>
          )}
        </div>

        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export function Calendar() {
  const { events, loadEvents, deleteEvent, loading } = useCalendarStore();
  const { user, isAdmin } = useAuthStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventForm, setShowEventForm] = useState(false);
  const [showEventView, setShowEventView] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<AcademicCalendarEvent | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
  const [monthView, setMonthView] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  // Generate calendar data for each month
  const generateMonthCalendar = (startMonth: number, startYear: number) => {
    const firstDayOfMonth = new Date(startYear, startMonth, 1);
    const lastDayOfMonth = new Date(startYear, startMonth + 1, 0);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const calendarDays = [];
    const currentDateCopy = new Date(startDate);
    
    while (currentDateCopy <= lastDayOfMonth || currentDateCopy.getDay() !== 0) {
      calendarDays.push(new Date(currentDateCopy));
      currentDateCopy.setDate(currentDateCopy.getDate() + 1);
    }

    return {
      year: startYear,
      month: startMonth,
      days: calendarDays,
      monthName: getIndonesianMonthName(startMonth)
    };
  };

  // Get events for a specific date
  const getEventsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter(event => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : eventStart;
      const checkDate = new Date(dateStr);
      
      return checkDate >= eventStart && checkDate <= eventEnd;
    });
  };

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  // Check if a date is in current month
  const isCurrentMonth = (date: Date, month: number, year: number) => {
    return date.getMonth() === month && date.getFullYear() === year;
  };

  const handleDateClick = (date: Date) => {
    if (!isAdmin()) {
      // Non-admin users can't add events
      return;
    }
    setSelectedDate(date);
    setShowEventForm(true);
    setSelectedEvent(null);
  };

  const handleEventClick = (event: AcademicCalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    
    if (isAdmin()) {
      // Admin users can edit events
      setShowEventForm(true);
    } else {
      // Non-admin users can only view events
      setShowEventView(true);
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    if (!isAdmin()) {
      return;
    }
    if (confirm('Are you sure you want to delete this event?')) {
      await deleteEvent(eventId);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - monthView);
      } else {
        newDate.setMonth(newDate.getMonth() + monthView);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Generate months data based on current date and month view
  const generateMonthsData = () => {
    const months = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    for (let i = 0; i < monthView; i++) {
      const currentMonth = month + i;
      const currentYear = year + Math.floor(currentMonth / 12);
      const adjustedMonth = currentMonth % 12;
      months.push(generateMonthCalendar(adjustedMonth, currentYear));
    }
    
    return months;
  };

  const monthsData = generateMonthsData();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            {monthView === 1 
              ? `${monthsData[0].monthName} ${monthsData[0].year}`
              : `${monthsData[0].monthName} ${monthsData[0].year} - ${monthsData[monthsData.length - 1].monthName} ${monthsData[monthsData.length - 1].year}`
            }
          </h1>
          <div className="flex gap-2">
            <button
              onClick={() => navigateMonth('prev')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => navigateMonth('next')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Today
          </button>
        </div>
        
        <div className="flex items-center gap-4">
          {/* Month View Filter */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700">View:</span>
            <div className="flex bg-gray-100 rounded-lg p-1">
              {[1, 2, 3].map((months) => (
                <button
                  key={months}
                  onClick={() => setMonthView(months as 1 | 2 | 3)}
                  className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                    monthView === months
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {months} Month{months > 1 ? 's' : ''}
                </button>
              ))}
            </div>
          </div>
          
          {/* Only show Add Event button for admins */}
          {isAdmin() && (
            <button
              onClick={() => {
                setSelectedEvent(null);
                setShowEventForm(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Event
            </button>
          )}
        </div>
      </div>

      {/* User Role Info */}
      {!isAdmin() && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm text-blue-800">
              <strong>View Only Mode:</strong> You can view event details by clicking on events. Only administrators can add or edit events.
            </span>
          </div>
        </div>
      )}

      {/* Calendar Grid - Multiple Months */}
      <div className={`grid gap-6 ${monthView === 1 ? 'grid-cols-1' : monthView === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
        {monthsData.map((monthData, monthIndex) => (
          <div key={`${monthData.year}-${monthData.month}`} className="bg-gray-50 rounded-lg p-4">
            {/* Month Header */}
            <h2 className="text-lg font-semibold text-gray-800 mb-4 text-center">
              {monthData.monthName} {monthData.year}
            </h2>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map(day => (
                <div key={day} className="p-1 text-center font-semibold text-gray-600 text-xs">
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-1">
              {monthData.days.map((date, index) => {
                const dayEvents = getEventsForDate(date);
                const isTodayDate = isToday(date);
                const isCurrentMonthDate = isCurrentMonth(date, monthData.month, monthData.year);
                
                return (
                  <div
                    key={index}
                    onClick={() => handleDateClick(date)}
                    className={`
                      min-h-[80px] p-1 border border-gray-200 transition-colors
                      ${isTodayDate ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'}
                      ${!isCurrentMonthDate ? 'bg-gray-100 text-gray-400' : 'bg-white'}
                      ${isAdmin() ? 'cursor-pointer' : 'cursor-default'}
                    `}
                  >
                    <div className={`
                      text-sm font-medium mb-1
                      ${isTodayDate ? 'text-blue-600' : isCurrentMonthDate ? 'text-gray-900' : 'text-gray-400'}
                    `}>
                      {date.getDate()}
                    </div>
                    
                    <div className="space-y-1">
                      {dayEvents.slice(0, 3).map(event => (
                        <div
                          key={event.id}
                          onClick={(e) => handleEventClick(event, e)}
                          className="text-xs p-1 rounded cursor-pointer truncate"
                          style={{ 
                            backgroundColor: event.color + '20', 
                            color: event.color,
                            border: `1px solid ${event.color}40`
                          }}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayEvents.length - 3}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Event Form Modal - Admin Only */}
      {showEventForm && isAdmin() && (
        <EventForm
          event={selectedEvent}
          onClose={() => {
            setShowEventForm(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          onSuccess={() => {
            setShowEventForm(false);
            setSelectedEvent(null);
            setSelectedDate(null);
            loadEvents();
          }}
        />
      )}

      {/* Event View Modal - Non-Admin Users */}
      {showEventView && selectedEvent && (
        <EventViewModal
          event={selectedEvent}
          onClose={() => {
            setShowEventView(false);
            setSelectedEvent(null);
          }}
        />
      )}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-lg">Loading...</div>
        </div>
      )}
    </div>
  );
} 