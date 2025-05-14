import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest } from '@/lib/queryClient';

// Define types
interface CalendarEvent {
  id: string;
  title: string;
  date: string; // ISO format date
  startTime: string;
  endTime: string;
  location: string;
  type: 'exam' | 'class' | 'holiday' | 'event';
  description?: string;
}

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [filter, setFilter] = useState<string>('all');

  // Get month name, year
  const monthNames = ["January", "February", "March", "April", "May", "June", 
                      "July", "August", "September", "October", "November", "December"];
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  // Fetch calendar events for the current month/view
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/calendar/events', 
      { 
        year: currentDate.getFullYear(), 
        month: currentDate.getMonth() + 1,
        view,
        filter
      }
    ],
    staleTime: 30000,
  });

  const events: CalendarEvent[] = data?.events || [];

  // Navigate to previous/next period based on current view
  const navigatePrevious = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else {
      newDate.setDate(newDate.getDate() - 1);
    }
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setCurrentDate(newDate);
  };

  // Generate calendar days for the month view
  const generateCalendarDays = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const daysInMonth = lastDay.getDate();
    
    // Create array of day objects
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push({ day: null, date: null, events: [] });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      const dateStr = date.toISOString().split('T')[0];
      
      // Find events for this day
      const dayEvents = events.filter(event => event.date.startsWith(dateStr));
      
      days.push({
        day,
        date,
        events: dayEvents
      });
    }
    
    return days;
  };

  const handleAddEvent = () => {
    // Implementation will be added for event creation
    console.log('Add event clicked');
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  // Get event color based on event type
  const getEventColor = (type: string) => {
    switch (type) {
      case 'exam': return 'bg-red-100 text-red-800 border-red-200';
      case 'class': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'holiday': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'event': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gray-800">Academic Calendar</h1>
          <div className="flex rounded-md shadow-sm">
            <button 
              onClick={() => setView('month')} 
              className={`px-3 py-1 text-sm font-medium rounded-l-md ${
                view === 'month' 
                  ? 'bg-primary text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Month
            </button>
            <button 
              onClick={() => setView('week')} 
              className={`px-3 py-1 text-sm font-medium ${
                view === 'week' 
                  ? 'bg-primary text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border-t border-b border-gray-300'
              }`}
            >
              Week
            </button>
            <button 
              onClick={() => setView('day')} 
              className={`px-3 py-1 text-sm font-medium rounded-r-md ${
                view === 'day' 
                  ? 'bg-primary text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              Day
            </button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Select value={filter} onValueChange={handleFilterChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Filter Events" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="exam">Exams</SelectItem>
              <SelectItem value="class">Classes</SelectItem>
              <SelectItem value="holiday">Holidays</SelectItem>
              <SelectItem value="event">Events</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAddEvent} className="flex items-center">
            <Plus className="mr-2 h-4 w-4" />
            <span>Add Event</span>
          </Button>
        </div>
      </div>

      {/* Calendar navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm px-4 py-3 border border-gray-200">
        <button 
          onClick={navigatePrevious}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-gray-800">
          {month} {year}
        </h2>
        <button 
          onClick={navigateNext}
          className="p-1.5 rounded-md text-gray-500 hover:bg-gray-100"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Content */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : isError ? (
        <div className="text-center py-12 text-red-500">
          Error loading calendar events. Please try again.
        </div>
      ) : view === 'month' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Week days header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="py-2 text-center text-gray-500 text-sm font-medium">
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 grid-rows-6 divide-x divide-y divide-gray-200">
            {calendarDays.map((dayData, index) => (
              <div key={index} className={`min-h-24 p-1 ${dayData.day ? 'bg-white' : 'bg-gray-50'}`}>
                {dayData.day && (
                  <>
                    <div className={`text-sm font-medium ${
                      new Date().toDateString() === dayData.date?.toDateString() 
                        ? 'bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center' 
                        : 'text-gray-700'
                    }`}>
                      {dayData.day}
                    </div>
                    <div className="mt-1 space-y-1 max-h-20 overflow-y-auto">
                      {dayData.events.map((event) => (
                        <div 
                          key={event.id} 
                          className={`px-1.5 py-0.5 text-xs truncate rounded border ${getEventColor(event.type)}`}
                        >
                          {event.startTime.slice(0, 5)} {event.title}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Coming Soon</h3>
          <p className="mt-1 text-sm text-gray-500">
            Week and day views are under development. Please use the month view for now.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm mr-1.5"></span>
            <span className="text-xs text-gray-600">Exams</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-sm mr-1.5"></span>
            <span className="text-xs text-gray-600">Classes</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-purple-100 border border-purple-200 rounded-sm mr-1.5"></span>
            <span className="text-xs text-gray-600">Holidays</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm mr-1.5"></span>
            <span className="text-xs text-gray-600">Events</span>
          </div>
        </div>
      </div>
    </div>
  );
}
