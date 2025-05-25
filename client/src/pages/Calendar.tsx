import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Filter, 
  FilePlus, GraduationCap, Palmtree, PartyPopper, Pencil, BookOpen, Timer,
  MapPin, Clock, Search, XCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Switch } from "@/components/ui/switch";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

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
  courseId?: string; // Voor examen of les
  courseName?: string;
  classId?: string; // Voor examen of les
  className?: string;
  isRecurring?: boolean; // Geeft aan of het een terugkerend evenement is
  recurrencePattern?: 'daily' | 'weekly' | 'monthly' | 'yearly'; // Type herhaling
  recurrenceEndDate?: string; // Einddatum van de herhaling
}

// Helper functies voor datumformatering
const formatDate = (date: Date): string => {
  return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'numeric' });
};

const formatDayDate = (date: Date): string => {
  return date.toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
};

const formatMonthYear = (date: Date): string => {
  return date.toLocaleDateString('nl-NL', { month: 'long', year: 'numeric' });
};

const daysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

const firstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

// Generate dates for calendar
const generateCalendarDays = (year: number, month: number) => {
  const days = [];
  const daysCount = daysInMonth(year, month);
  const firstDay = firstDayOfMonth(year, month);

  // Add previous month days to fill first week
  for (let i = 0; i < firstDay; i++) {
    const prevMonthDay = new Date(year, month, 0 - (firstDay - i - 1));
    days.push({
      date: prevMonthDay,
      isCurrentMonth: false,
      isToday: false,
      hasEvents: false,
      events: []
    });
  }

  // Add current month days
  const today = new Date();
  for (let i = 1; i <= daysCount; i++) {
    const date = new Date(year, month, i);
    days.push({
      date,
      isCurrentMonth: true,
      isToday: 
        date.getDate() === today.getDate() && 
        date.getMonth() === today.getMonth() && 
        date.getFullYear() === today.getFullYear(),
      hasEvents: false,
      events: []
    });
  }

  // Add next month days to fill last week
  const totalDays = days.length;
  const remainingCells = 42 - totalDays; // Always show 6 weeks
  for (let i = 1; i <= remainingCells; i++) {
    const nextMonthDay = new Date(year, month + 1, i);
    days.push({
      date: nextMonthDay,
      isCurrentMonth: false,
      isToday: false,
      hasEvents: false,
      events: []
    });
  }

  return days;
};

export default function Calendar() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [eventFormData, setEventFormData] = useState<Partial<CalendarEvent>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    type: 'class',
    description: '',
    isRecurring: false,
    recurrencePattern: 'weekly'
  });
  const [viewMode, setViewMode] = useState<'month' | 'day' | 'list'>('month');
  const [eventTypeFilter, setEventTypeFilter] = useState<string>('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  // Generate calendar days
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();
  const calendarDays = generateCalendarDays(currentYear, currentMonth);
  
  // Fetch events from API
  const { data: eventsData = { events: [] }, isLoading: isLoadingEvents } = useQuery({
    queryKey: ['/api/events', { month: currentMonth, year: currentYear }],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({
          month: currentMonth.toString(),
          year: currentYear.toString()
        });
        
        if (eventTypeFilter !== 'all') {
          params.append('type', eventTypeFilter);
        }
        
        const response = await apiRequest(`/api/events?${params.toString()}`);
        return response;
      } catch (error) {
        console.error('Error fetching events:', error);
        return { events: [] };
      }
    }
  });

  // Fetch courses for dropdown
  const { data: coursesData = { courses: [] } } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/courses');
        return response;
      } catch (error) {
        console.error('Error fetching courses:', error);
        return { courses: [] };
      }
    }
  });

  // Fetch class groups for dropdown
  const { data: classGroupsData = { groups: [] } } = useQuery({
    queryKey: ['/api/student-groups'],
    queryFn: async () => {
      try {
        const response = await apiRequest('/api/student-groups');
        return response;
      } catch (error) {
        console.error('Error fetching class groups:', error);
        return { groups: [] };
      }
    }
  });

  // Map events to calendar days
  const events = eventsData.events || [];
  const calendarDaysWithEvents = calendarDays.map(day => {
    const dayEvents = events.filter((event: CalendarEvent) => {
      const eventDate = new Date(event.date);
      return (
        eventDate.getDate() === day.date.getDate() &&
        eventDate.getMonth() === day.date.getMonth() &&
        eventDate.getFullYear() === day.date.getFullYear()
      );
    });
    
    return {
      ...day,
      hasEvents: dayEvents.length > 0,
      events: dayEvents
    };
  });

  // For day view
  const selectedDateEvents = selectedDate 
    ? events.filter((event: CalendarEvent) => {
        const eventDate = new Date(event.date);
        return (
          eventDate.getDate() === selectedDate.getDate() &&
          eventDate.getMonth() === selectedDate.getMonth() &&
          eventDate.getFullYear() === selectedDate.getFullYear()
        );
      })
    : [];

  // Mutations
  const createEventMutation = useMutation({
    mutationFn: async (eventData: Partial<CalendarEvent>) => {
      const response = await apiRequest('/api/events', {
        method: 'POST',
        body: eventData
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Evenement toegevoegd",
        description: "Het evenement is succesvol toegevoegd aan de kalender.",
      });
      setShowDialog(false);
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het evenement.",
        variant: "destructive",
      });
    }
  });

  // Navigation handlers
  const goToPreviousMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() - 1);
      return newDate;
    });
  };

  const goToNextMonth = () => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate);
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  // Dialog handlers
  const openAddEventDialog = (date?: Date) => {
    if (date) {
      setEventFormData(prev => ({
        ...prev,
        date: date.toISOString().split('T')[0]
      }));
    }
    setShowDialog(true);
  };

  const handleFormChange = (field: keyof CalendarEvent, value: any) => {
    setEventFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (!eventFormData.title || !eventFormData.date || !eventFormData.startTime || !eventFormData.endTime) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }
    
    createEventMutation.mutate(eventFormData);
  };

  // View handlers
  const handleDayClick = (day: typeof calendarDays[0]) => {
    setSelectedDate(day.date);
    setViewMode('day');
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'exam':
        return <GraduationCap className="h-3.5 w-3.5" />;
      case 'class':
        return <BookOpen className="h-3.5 w-3.5" />;
      case 'holiday':
        return <Palmtree className="h-3.5 w-3.5" />;
      case 'event':
        return <PartyPopper className="h-3.5 w-3.5" />;
      default:
        return <CalendarIcon className="h-3.5 w-3.5" />;
    }
  };

  const getEventTypeBadge = (type: string) => {
    switch (type) {
      case 'exam':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 text-xs">
            Examen
          </Badge>
        );
      case 'class':
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
            Les
          </Badge>
        );
      case 'holiday':
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
            Vakantie
          </Badge>
        );
      case 'event':
        return (
          <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200 text-xs">
            Evenement
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 text-xs">
            Onbekend
          </Badge>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Page header - Professionele desktop stijl */}
      <header className="bg-white border-b border-[#e5e7eb] shadow-sm">
        <div className="flex flex-col">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-base font-medium text-gray-800 tracking-tight">Kalender</h1>
            </div>
            <div className="flex items-center">
              <div className="text-xs text-gray-500 font-medium">
                {new Date().toLocaleDateString('nl-NL', {day: 'numeric', month: 'long', year: 'numeric'})}
              </div>
            </div>
          </div>
          <div className="px-6 py-2 bg-[#f9fafc] border-t border-[#e5e7eb] flex items-center">
            <div className="text-xs text-gray-500">Planning &gt; Kalender</div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="px-6 py-6 flex-1">
        {/* Kalender navigatie - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4">
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Navigatie en view controls */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={goToPreviousMonth}
                className="h-7 text-xs rounded-sm border-[#e5e7eb]"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToToday}
                className="h-7 text-xs rounded-sm border-[#e5e7eb]"
              >
                Vandaag
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={goToNextMonth}
                className="h-7 text-xs rounded-sm border-[#e5e7eb]"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
              
              <h2 className="text-sm font-medium mx-2">
                {formatMonthYear(currentDate)}
              </h2>
            </div>
            
            {/* View toggles and actions */}
            <div className="flex items-center gap-2">
              <Tabs 
                value={viewMode} 
                onValueChange={(value) => setViewMode(value as 'month' | 'day' | 'list')}
                className="h-7"
              >
                <TabsList className="h-7 bg-[#f9fafc] p-0.5">
                  <TabsTrigger value="month" className="text-xs h-6 px-3 data-[state=active]:bg-white">Maand</TabsTrigger>
                  <TabsTrigger value="day" className="text-xs h-6 px-3 data-[state=active]:bg-white">Dag</TabsTrigger>
                  <TabsTrigger value="list" className="text-xs h-6 px-3 data-[state=active]:bg-white">Lijst</TabsTrigger>
                </TabsList>
              </Tabs>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterOptions(!showFilterOptions)}
                className="h-7 text-xs rounded-sm border-[#e5e7eb]"
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filters
                {showFilterOptions ? 
                  <ChevronUp className="h-3.5 w-3.5 ml-1" /> : 
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                }
              </Button>
              
              <Button
                size="sm"
                onClick={() => openAddEventDialog()}
                className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Nieuw Evenement
              </Button>
            </div>
          </div>
          
          {/* Filter opties */}
          {showFilterOptions && (
            <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-wrap gap-3 items-center">
              <div className="flex items-center">
                {eventTypeFilter !== 'all' && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setEventTypeFilter('all')}
                    className="h-7 text-xs text-blue-600 p-0 mr-3"
                  >
                    Filters wissen
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select 
                  value={eventTypeFilter} 
                  onValueChange={setEventTypeFilter}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Type evenement" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle types</SelectItem>
                    <SelectItem value="class">Lessen</SelectItem>
                    <SelectItem value="exam">Examens</SelectItem>
                    <SelectItem value="holiday">Vakantiedagen</SelectItem>
                    <SelectItem value="event">Evenementen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        
        {/* Kalender weergave */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm overflow-hidden">
          <TabsContent value="month" className="m-0">
            <div className="grid grid-cols-7 bg-[#f9fafc] border-b border-[#e5e7eb]">
              {["Ma", "Di", "Wo", "Do", "Vr", "Za", "Zo"].map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-xs font-medium text-gray-700"
                >
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 grid-rows-6 h-[calc(100vh-270px)]">
              {calendarDaysWithEvents.map((day, i) => (
                <div
                  key={i}
                  className={`relative border-b border-r border-[#e5e7eb] p-1 overflow-hidden
                    ${!day.isCurrentMonth ? 'bg-[#f9fafc] text-gray-400' : ''}
                    ${day.isToday ? 'bg-blue-50' : ''}
                    ${selectedDate && 
                      day.date.getDate() === selectedDate.getDate() && 
                      day.date.getMonth() === selectedDate.getMonth() && 
                      day.date.getFullYear() === selectedDate.getFullYear()
                        ? 'ring-2 ring-inset ring-[#1e40af]' 
                        : ''
                    }
                    hover:bg-gray-50 cursor-pointer
                  `}
                  onClick={() => handleDayClick(day)}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${day.isToday ? 'font-bold text-[#1e40af]' : ''}`}>
                        {day.date.getDate()}
                      </span>
                      {day.hasEvents && (
                        <Button
                          variant="ghost" 
                          size="sm"
                          className="h-5 w-5 p-0 rounded-full hover:bg-blue-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            openAddEventDialog(day.date);
                          }}
                        >
                          <Plus className="h-3 w-3 text-[#1e40af]" />
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex-1 overflow-y-auto text-xs mt-1 space-y-1">
                      {day.events.slice(0, 3).map((event: CalendarEvent) => (
                        <div 
                          key={event.id} 
                          className={`px-1 py-0.5 rounded-sm truncate flex items-center gap-1
                            ${event.type === 'exam' ? 'bg-red-50 text-red-700' : ''}
                            ${event.type === 'class' ? 'bg-blue-50 text-blue-700' : ''}
                            ${event.type === 'holiday' ? 'bg-green-50 text-green-700' : ''}
                            ${event.type === 'event' ? 'bg-purple-50 text-purple-700' : ''}
                          `}
                        >
                          {getEventTypeIcon(event.type)}
                          <span className="truncate text-xs">{event.title}</span>
                        </div>
                      ))}
                      {day.events.length > 3 && (
                        <div className="text-xs text-gray-500 pl-1">
                          +{day.events.length - 3} meer
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="day" className="m-0">
            {selectedDate ? (
              <div className="divide-y divide-[#e5e7eb]">
                <div className="px-4 py-3 bg-[#f9fafc]">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-medium text-gray-800">
                      {formatDayDate(selectedDate)}
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openAddEventDialog(selectedDate)}
                      className="h-7 text-xs text-[#1e40af]"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Evenement toevoegen
                    </Button>
                  </div>
                </div>
                
                <div className="overflow-auto h-[calc(100vh-300px)] p-4">
                  {selectedDateEvents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                      <CalendarIcon className="h-12 w-12 text-gray-300 mb-2" />
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Geen evenementen</h3>
                      <p className="text-sm text-center max-w-md mb-4">
                        Er zijn geen evenementen gepland voor deze dag.
                      </p>
                      <Button
                        size="sm"
                        onClick={() => openAddEventDialog(selectedDate)}
                        className="h-8 text-xs rounded-sm bg-[#1e40af]"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Evenement toevoegen
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedDateEvents
                        .sort((a: CalendarEvent, b: CalendarEvent) => a.startTime.localeCompare(b.startTime))
                        .map((event: CalendarEvent) => (
                          <div 
                            key={event.id} 
                            className="border border-[#e5e7eb] rounded-sm p-3 hover:bg-gray-50"
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <div className="font-medium text-sm">{event.title}</div>
                                <div className="text-xs text-gray-500">
                                  {event.courseName && `${event.courseName} · `}
                                  {event.className && `${event.className} · `}
                                  {getEventTypeBadge(event.type)}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 p-0 text-gray-500"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                              <div className="flex items-center text-xs text-gray-500">
                                <Clock className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                <span>{event.startTime} - {event.endTime}</span>
                              </div>
                              
                              {event.location && (
                                <div className="flex items-center text-xs text-gray-500">
                                  <MapPin className="h-3.5 w-3.5 mr-1.5 text-gray-400" />
                                  <span>{event.location}</span>
                                </div>
                              )}
                            </div>
                            
                            {event.description && (
                              <div className="mt-2 text-xs text-gray-600 border-t border-[#e5e7eb] pt-2">
                                {event.description}
                              </div>
                            )}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <CalendarIcon className="h-12 w-12 text-gray-300 mb-2" />
                <h3 className="text-base font-medium">Selecteer een dag</h3>
                <p className="text-sm mt-1">Klik op een dag in de kalender om de details te bekijken.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="list" className="m-0">
            <div className="px-4 py-3 bg-[#f9fafc] border-b border-[#e5e7eb]">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-medium text-gray-800">
                  Alle evenementen in {formatMonthYear(currentDate)}
                </h2>
              </div>
            </div>
            
            <div className="overflow-auto h-[calc(100vh-300px)] p-4">
              {events.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <CalendarIcon className="h-12 w-12 text-gray-300 mb-2" />
                  <h3 className="text-lg font-medium text-gray-900 mb-1">Geen evenementen</h3>
                  <p className="text-sm text-center max-w-md mb-4">
                    Er zijn geen evenementen gepland voor deze maand.
                  </p>
                  <Button
                    size="sm"
                    onClick={() => openAddEventDialog()}
                    className="h-8 text-xs rounded-sm bg-[#1e40af]"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Evenement toevoegen
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {Object.entries(
                    events.reduce((acc: { [key: string]: CalendarEvent[] }, event: CalendarEvent) => {
                      const date = new Date(event.date).toISOString().split('T')[0];
                      if (!acc[date]) acc[date] = [];
                      acc[date].push(event);
                      return acc;
                    }, {})
                  )
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, dayEvents]) => (
                      <div key={date}>
                        <h3 className="text-xs font-medium text-gray-600 mb-2 sticky top-0 bg-white py-1">
                          {formatDayDate(new Date(date))}
                        </h3>
                        <div className="space-y-2 ml-4">
                          {dayEvents
                            .sort((a: CalendarEvent, b: CalendarEvent) => a.startTime.localeCompare(b.startTime))
                            .map((event: CalendarEvent) => (
                              <div 
                                key={event.id} 
                                className="border border-[#e5e7eb] rounded-sm p-3 hover:bg-gray-50"
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex items-start gap-3">
                                    <div className="bg-[#f9fafc] border border-[#e5e7eb] rounded-sm p-1.5 text-center min-w-[50px]">
                                      <div className="text-xs text-gray-700">{event.startTime}</div>
                                      <div className="text-xs text-gray-500">{event.endTime}</div>
                                    </div>
                                    
                                    <div>
                                      <div className="font-medium text-sm flex items-center gap-2">
                                        {event.title} 
                                        {getEventTypeBadge(event.type)}
                                      </div>
                                      <div className="text-xs text-gray-500 mt-1">
                                        {event.location && (
                                          <div className="flex items-center">
                                            <MapPin className="h-3 w-3 mr-1 text-gray-400" />
                                            <span>{event.location}</span>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 w-7 p-0 text-gray-500"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </TabsContent>
        </div>
      </div>

      {/* Evenement dialoog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Evenement toevoegen</DialogTitle>
            <DialogDescription>
              Vul de gegevens in voor het nieuwe evenement.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddEvent} className="space-y-4 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="title" className="text-xs">Titel</Label>
                <Input 
                  id="title"
                  value={eventFormData.title}
                  onChange={(e) => handleFormChange('title', e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Titel van het evenement"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs">Datum</Label>
                <Input 
                  id="date"
                  type="date"
                  value={eventFormData.date}
                  onChange={(e) => handleFormChange('date', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type" className="text-xs">Type</Label>
                <Select 
                  value={eventFormData.type} 
                  onValueChange={(value) => handleFormChange('type', value)}
                >
                  <SelectTrigger id="type" className="h-8 text-xs">
                    <SelectValue placeholder="Selecteer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="class">Les</SelectItem>
                    <SelectItem value="exam">Examen</SelectItem>
                    <SelectItem value="holiday">Vakantie</SelectItem>
                    <SelectItem value="event">Evenement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-xs">Starttijd</Label>
                <Input 
                  id="startTime"
                  type="time"
                  value={eventFormData.startTime}
                  onChange={(e) => handleFormChange('startTime', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-xs">Eindtijd</Label>
                <Input 
                  id="endTime"
                  type="time"
                  value={eventFormData.endTime}
                  onChange={(e) => handleFormChange('endTime', e.target.value)}
                  className="h-8 text-xs"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="location" className="text-xs">Locatie</Label>
                <Input 
                  id="location"
                  value={eventFormData.location}
                  onChange={(e) => handleFormChange('location', e.target.value)}
                  className="h-8 text-xs"
                  placeholder="Locatie"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="isRecurring" className="text-xs">Terugkerend evenement</Label>
                  <Switch
                    id="isRecurring"
                    checked={eventFormData.isRecurring}
                    onCheckedChange={(checked) => handleFormChange('isRecurring', checked)}
                  />
                </div>
              </div>
              
              {eventFormData.isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurrencePattern" className="text-xs">Herhalingspatroon</Label>
                  <Select 
                    value={eventFormData.recurrencePattern} 
                    onValueChange={(value) => handleFormChange('recurrencePattern', value)}
                  >
                    <SelectTrigger id="recurrencePattern" className="h-8 text-xs">
                      <SelectValue placeholder="Selecteer patroon" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Dagelijks</SelectItem>
                      <SelectItem value="weekly">Wekelijks</SelectItem>
                      <SelectItem value="monthly">Maandelijks</SelectItem>
                      <SelectItem value="yearly">Jaarlijks</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {eventFormData.isRecurring && (
                <div className="space-y-2">
                  <Label htmlFor="recurrenceEndDate" className="text-xs">Einddatum herhaling</Label>
                  <Input 
                    id="recurrenceEndDate"
                    type="date"
                    value={eventFormData.recurrenceEndDate || ''}
                    onChange={(e) => handleFormChange('recurrenceEndDate', e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              )}
              
              {(eventFormData.type === 'class' || eventFormData.type === 'exam') && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="courseId" className="text-xs">Vak</Label>
                    <Select 
                      value={eventFormData.courseId} 
                      onValueChange={(value) => handleFormChange('courseId', value)}
                    >
                      <SelectTrigger id="courseId" className="h-8 text-xs">
                        <SelectValue placeholder="Selecteer vak" />
                      </SelectTrigger>
                      <SelectContent>
                        {coursesData.courses.map((course: any) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="classId" className="text-xs">Klas</Label>
                    <Select 
                      value={eventFormData.classId} 
                      onValueChange={(value) => handleFormChange('classId', value)}
                    >
                      <SelectTrigger id="classId" className="h-8 text-xs">
                        <SelectValue placeholder="Selecteer klas" />
                      </SelectTrigger>
                      <SelectContent>
                        {classGroupsData.groups.map((group: any) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              
              <div className="space-y-2 col-span-2">
                <Label htmlFor="description" className="text-xs">Beschrijving</Label>
                <Textarea 
                  id="description"
                  value={eventFormData.description || ''}
                  onChange={(e) => handleFormChange('description', e.target.value)}
                  className="min-h-[80px] text-xs"
                  placeholder="Beschrijving van het evenement (optioneel)"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowDialog(false)}
                className="h-8 text-xs rounded-sm"
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
              >
                Evenement toevoegen
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}