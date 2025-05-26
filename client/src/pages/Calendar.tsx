import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Filter, 
  FilePlus, GraduationCap, Palmtree, PartyPopper, Pencil, BookOpen, Timer,
  MapPin, Clock, Search, XCircle, FileText, RotateCcw, Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  CustomDialog, 
  DialogHeaderWithIcon, 
  DialogFormContainer, 
  DialogFooterContainer,
  SectionContainer,
  FormLabel,
  StyledSelect,
  StyledSelectItem
} from "@/components/ui/custom-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/hooks/use-toast';
import { Switch } from "@/components/ui/switch";
import { PremiumHeader } from '@/components/layout/premium-header';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";

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

export default function Calendar() {
  const { toast } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [filter, setFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isAddEventDialogOpen, setIsAddEventDialogOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '10:00',
    location: '',
    type: 'event' as 'exam' | 'class' | 'holiday' | 'event',
    description: '',
    courseId: '',
    courseName: '',
    classId: '',
    className: '',
    teacherId: '',
    teacherName: '',
    isRecurring: false,
    recurrencePattern: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurrenceEndDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0] // 3 maanden vooruit als standaard
  });
  
  const [activeTab, setActiveTab] = useState<'exam' | 'class' | 'holiday' | 'event'>('event');
  const [isEventDetailDialogOpen, setIsEventDetailDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  // Functie om alle velden te resetten
  const resetEventForm = () => {
    setNewEvent({
      title: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '09:00',
      endTime: '10:00',
      location: '',
      type: 'event' as 'exam' | 'class' | 'holiday' | 'event',
      description: '',
      courseId: '',
      courseName: '',
      classId: '',
      className: '',
      teacherId: '',
      teacherName: '',
      isRecurring: false,
      recurrencePattern: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
      recurrenceEndDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
    });
    setActiveTab('event');
  };

  // Functie om event details te tonen
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEventDetailDialogOpen(true);
  };



  // Get month name, year - in Dutch
  const monthNames = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", 
                      "Juli", "Augustus", "September", "Oktober", "November", "December"];
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  // Gebruik localStorage voor persistentie van kalender evenementen
  const getStoredEvents = (): CalendarEvent[] => {
    try {
      const stored = localStorage.getItem('calendarEvents');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const saveEventsToStorage = (events: CalendarEvent[]) => {
    localStorage.setItem('calendarEvents', JSON.stringify(events));
  };

  // Fetch calendar events for the current month/view
  const { data, isLoading, isError } = useQuery<{ events: CalendarEvent[] }>({
    queryKey: ['/api/calendar/events', 
      { 
        year: currentDate.getFullYear(), 
        month: currentDate.getMonth() + 1,
        view,
        filter,
        search: searchTerm
      }
    ],
    staleTime: 30000,
  });

  // Combineer server data met localStorage data
  const serverEvents: CalendarEvent[] = data?.events || [];
  const storedEvents: CalendarEvent[] = getStoredEvents();
  const events: CalendarEvent[] = [...serverEvents, ...storedEvents];
  
  // Debug logging om te zien welke events we krijgen
  console.log("Events received:", events);
  console.log("Current date:", currentDate.toISOString().split('T')[0]);
  
  // Filter evenementen gebaseerd op filter en zoekterm
  const filteredEvents = events.filter(event => {
    // Eerst filteren op type
    const typeMatch = filter === 'all' || event.type === filter;
    
    // Dan filteren op zoekterm als er een is
    const searchMatch = !searchTerm || 
      event.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (event.description && event.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.location && event.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.courseName && event.courseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (event.className && event.className.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return typeMatch && searchMatch;
  });

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
    
    // Correct for Monday as first day of week (European standard)
    // Sunday is 0 in JS Date, we want to display Monday (1) as first day
    let startingDayOfWeek = firstDay.getDay() - 1; // subtract 1 to start from Monday
    if (startingDayOfWeek === -1) startingDayOfWeek = 6; // If Sunday (0-1=-1), make it the 7th column (index 6)
    
    const daysInMonth = lastDay.getDate();
    
    // Create array of day objects
    const days = [];
    
    // Add empty cells for days before the first day of month
    for (let i = 0; i < startingDayOfWeek; i++) {
      // Als eerste dag van de maand niet op maandag valt, voeg dagen toe van vorige maand
      const prevMonthLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
      const prevMonthDay = new Date(prevMonthLastDay);
      prevMonthDay.setDate(prevMonthLastDay.getDate() - startingDayOfWeek + i + 1);
      
      const dateStr = prevMonthDay.toISOString().split('T')[0];
      const dayEvents = events.filter(event => {
        const eventDate = event.date.split('T')[0];
        return eventDate === dateStr;
      });
      
      days.push({ 
        day: prevMonthDay.getDate(), 
        date: prevMonthDay, 
        events: dayEvents,
        isCurrentMonth: false 
      });
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
      // Gebruik lokale datum string om tijdzone problemen te voorkomen
      const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      
      // Find events for this day
      const dayEvents = events.filter(event => {
        // Normaliseer beide datums naar YYYY-MM-DD formaat
        const eventDate = event.date.split('T')[0]; // Voor het geval er een tijd component is
        return eventDate === dateStr;
      });
      
      // Check if this is today
      const isToday = new Date().toDateString() === date.toDateString();
      
      days.push({
        day,
        date,
        events: dayEvents,
        isCurrentMonth: true,
        isToday
      });
    }
    
    // Add days from next month to complete the calendar grid (42 cells for 6 rows)
    const remainingCells = 42 - days.length;
    if (remainingCells > 0) {
      for (let day = 1; day <= remainingCells; day++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, day);
        const dateStr = date.toISOString().split('T')[0];
        
        // Find events for this day
        const dayEvents = events.filter(event => event.date.startsWith(dateStr));
        
        days.push({
          day,
          date,
          events: dayEvents,
          isCurrentMonth: false
        });
      }
    }
    
    return days;
  };

  // Mutation voor het maken van een nieuw event
  const createEventMutation = useMutation({
    mutationFn: (eventData: typeof newEvent) => {
      return apiRequest('/api/calendar/events', {
        method: 'POST',
        body: eventData
      });
    },
    onSuccess: (response, eventData) => {
      // Voeg het nieuwe evenement toe aan localStorage
      const currentStoredEvents = getStoredEvents();
      const newEventWithId = {
        ...eventData,
        id: `local-${Date.now()}`, // Unieke ID voor localStorage
      };
      currentStoredEvents.push(newEventWithId);
      saveEventsToStorage(currentStoredEvents);
      
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({
        queryKey: ['/api/calendar/events'],
      });
      
      // Reset form and close dialog
      resetEventForm();
      setIsAddEventDialogOpen(false);
      
      // Toon succesmelding
      toast({
        title: "Evenement toegevoegd",
        description: "Het evenement is succesvol toegevoegd aan de kalender.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het evenement.",
        variant: "destructive",
      });
    }
  });

  // Mutation voor het verwijderen van een event
  const deleteEventMutation = useMutation({
    mutationFn: (eventId: string) => {
      return apiRequest(`/api/calendar/events/${eventId}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      toast({
        title: "Evenement verwijderd",
        description: "Het evenement is succesvol verwijderd uit de kalender.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van het evenement.",
        variant: "destructive",
      });
    }
  });

  const handleDeleteEvent = (event: CalendarEvent) => {
    if (event.id) {
      // Remove from localStorage for local events
      if (event.id.startsWith('local-')) {
        const savedEvents = JSON.parse(localStorage.getItem('calendarEvents') || '[]');
        const updatedEvents = savedEvents.filter((e: CalendarEvent) => e.id !== event.id);
        localStorage.setItem('calendarEvents', JSON.stringify(updatedEvents));
        
        // Trigger a refetch to update the UI
        queryClient.invalidateQueries({ queryKey: ['/api/calendar/events'] });
      } else {
        // For backend events, use the delete mutation
        deleteEventMutation.mutate(event.id);
      }
      
      setIsEventDetailDialogOpen(false);
      setSelectedEvent(null);
    }
  };

  const handleAddEvent = () => {
    // Open dialoogvenster
    setIsAddEventDialogOpen(true);
  };
  
  const handleTabChange = (tab: 'exam' | 'class' | 'holiday' | 'event') => {
    setActiveTab(tab);
    setNewEvent({
      ...newEvent,
      type: tab
    });
  };
  
  const handleSubmitEvent = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newEvent.title || !newEvent.date) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul een titel en datum in om het evenement toe te voegen.",
        variant: "destructive",
      });
      return;
    }
    
    // Extra validatie voor examen of les
    if ((newEvent.type === 'exam' || newEvent.type === 'class') && 
        (!newEvent.courseId || !newEvent.classId)) {
      toast({
        title: "Onvolledige gegevens",
        description: `Selecteer een vak en klas voor dit ${newEvent.type === 'exam' ? 'examen' : 'les'}.`,
        variant: "destructive",
      });
      return;
    }
    
    // Validatie voor wekelijkse herhaling
    if (newEvent.isRecurring) {
      if (!newEvent.recurrenceEndDate) {
        toast({
          title: "Onvolledige gegevens",
          description: "Selecteer een einddatum voor de herhaling.",
          variant: "destructive",
        });
        return;
      }
      
      // Controleer of einddatum na startdatum ligt
      const startDate = new Date(newEvent.date);
      const endDate = new Date(newEvent.recurrenceEndDate);
      
      if (endDate <= startDate) {
        toast({
          title: "Ongeldige datums",
          description: "De einddatum van de herhaling moet na de startdatum liggen.",
          variant: "destructive",
        });
        return;
      }
    }
    
    createEventMutation.mutate(newEvent);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
  };

  // Get event colors based on event type
  const getEventColors = (type: string) => {
    switch (type) {
      case 'exam':
        return { 
          bgColor: "#FFEBEE", // Lichtroze 
          borderColor: "#E53935" // Rood
        };
      case 'class':
        return { 
          bgColor: "#E3F2FD", // Lichtblauw
          borderColor: "#1E88E5" // Blauw
        };
      case 'holiday':
        return { 
          bgColor: "#E8F5E9", // Lichtgroen
          borderColor: "#43A047" // Groen
        };
      case 'event':
        return { 
          bgColor: "#FFF9C4", // Lichtgeel
          borderColor: "#FDD835" // Geel
        };
      default:
        return { 
          bgColor: "#E0E0E0", // Lichtgrijs
          borderColor: "#757575" // Grijs
        };
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium header component */}
      <PremiumHeader 
        title="Rooster" 
        path="Evaluatie > Rooster" 
        icon={CalendarIcon}
        description="Beheer schoolevenementen, bekijk lessen en belangrijke data in een overzichtelijke roosterweergave"
      />
      
      <div className="px-6 py-6 flex-1 space-y-6">


        {/* Zoekbalk - onder de paginatitel geplaatst */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Zoek evenementen..."
              className="pl-8 bg-white"
              value={searchTerm || ""}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <XCircle
                className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
                onClick={() => setSearchTerm("")}
              />
            )}
          </div>
        </div>
        
        {/* Controls and filters - onder de zoekbalk */}
        <div className="flex flex-col gap-4 mb-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex border rounded-md overflow-hidden">
                <button 
                  onClick={() => setView('month')}
                  className={`px-4 py-2 text-sm font-medium ${view === 'month' 
                    ? 'bg-[#1e40af] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Maand
                </button>
                <button 
                  onClick={() => setView('week')}
                  className={`px-4 py-2 text-sm font-medium ${view === 'week' 
                    ? 'bg-[#1e40af] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Week
                </button>
                <button 
                  onClick={() => setView('day')}
                  className={`px-4 py-2 text-sm font-medium ${view === 'day' 
                    ? 'bg-[#1e40af] text-white' 
                    : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  Dag
                </button>
              </div>
            </div>
            <div className="flex items-center space-x-3 flex-wrap gap-3">
              <Select value={filter} onValueChange={handleFilterChange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter Evenementen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Evenementen</SelectItem>
                  <SelectItem value="exam">Examens</SelectItem>
                  <SelectItem value="class">Lessen</SelectItem>
                  <SelectItem value="holiday">Vakanties</SelectItem>
                  <SelectItem value="event">Activiteiten</SelectItem>
                </SelectContent>
              </Select>
              <Button 
                onClick={handleAddEvent}
                variant="default"
                size="default"
                className="bg-[#1e40af] hover:bg-[#1e40af]/90 flex items-center"
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>Evenement Toevoegen</span>
              </Button>
            </div>
          </div>
         
          {/* Calendar navigation header */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-md border border-gray-200">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigatePrevious}
              className="border-0 bg-white shadow-sm"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <h2 className="text-base font-medium text-gray-800">
              {view === 'month' 
                ? `${month} ${year}` 
                : view === 'week'
                  ? `Week van ${formatDate(currentDate)} - ${formatDate(new Date(currentDate.getTime() + 6 * 24 * 60 * 60 * 1000))}`
                  : formatDayDate(currentDate)
              }
            </h2>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={navigateNext}
              className="border-0 bg-white shadow-sm"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Legende */}
          <div className="bg-white p-3 rounded-md border border-gray-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm border" style={{backgroundColor: "#E3F2FD", borderColor: "#1E88E5"}}></div>
                <span className="text-xs text-gray-700">Les</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm border" style={{backgroundColor: "#FFEBEE", borderColor: "#E53935"}}></div>
                <span className="text-xs text-gray-700">Examen</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm border" style={{backgroundColor: "#E8F5E9", borderColor: "#43A047"}}></div>
                <span className="text-xs text-gray-700">Vakantie</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-sm border" style={{backgroundColor: "#FFF9C4", borderColor: "#FDD835"}}></div>
                <span className="text-xs text-gray-700">Evenement</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Calendar view */}
        <div className="bg-white rounded-sm shadow-sm border border-gray-200">
          {/* Month View */}
          {view === 'month' && (
            <div className="grid grid-cols-7 divide-x divide-y divide-gray-200">
              {/* Weekdays header */}
              {['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'].map((day, index) => (
                <div key={index} className="py-2 text-center font-medium text-xs text-gray-500 bg-gray-50">
                  {day}
                </div>
              ))}
              
              {/* Calendar days */}
              {calendarDays.map((day, index) => (
                <div 
                  key={index} 
                  className={`p-2 h-32 sm:h-40 overflow-y-auto ${
                    day.isCurrentMonth ? 'bg-white' : 'bg-gray-50'
                  } ${day.isToday ? 'border-t-2 border-[#1e40af]' : ''}`}
                >
                  <div className="text-xs text-gray-500 mb-1">
                    {day.day}
                  </div>
                  
                  {/* Events for this day */}
                  <div className="space-y-1">
                    {day.events.map((event, idx) => {
                      const colors = getEventColors(event.type);
                      return (
                        <div 
                          key={idx} 
                          className="px-1.5 py-0.5 text-xs font-medium truncate rounded-sm flex items-center cursor-pointer hover:opacity-80 transition-opacity"
                          style={{ 
                            backgroundColor: colors.bgColor,
                            borderLeft: `2px solid ${colors.borderColor}`
                          }}
                          onClick={() => handleEventClick(event)}
                        >
                          <span className="truncate">{event.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Week View */}
          {view === 'week' && (
            <div className="divide-y divide-gray-200">
              {/* Time slots for each day */}
              <div className="grid grid-cols-8 divide-x divide-gray-200">
                {/* Empty header for time column */}
                <div className="py-2 text-center font-medium text-xs text-gray-500 bg-gray-50">
                  Uur
                </div>
                
                {/* Headers for days of the week */}
                {Array.from({ length: 7 }, (_, i) => {
                  const day = new Date(currentDate);
                  day.setDate(day.getDate() + i);
                  return (
                    <div key={i} className="py-2 text-center font-medium text-xs text-gray-500 bg-gray-50">
                      {day.toLocaleDateString('nl-NL', { weekday: 'short' })} {day.getDate()}
                    </div>
                  );
                })}
              </div>
              
              {/* Time slots */}
              {Array.from({ length: 14 }, (_, i) => i + 8).map(hour => (
                <div key={hour} className="grid grid-cols-8 divide-x divide-gray-200">
                  {/* Time column */}
                  <div className="py-2 text-center text-xs text-gray-500 bg-gray-50">
                    {hour}:00
                  </div>
                  
                  {/* Event cells for each day at this hour */}
                  {Array.from({ length: 7 }, (_, i) => {
                    const day = new Date(currentDate);
                    day.setDate(day.getDate() + i);
                    const dateStr = day.toISOString().split('T')[0];
                    const hourEvents = events.filter(event => {
                      return event.date === dateStr && 
                             parseInt(event.startTime.split(':')[0]) <= hour && 
                             parseInt(event.endTime.split(':')[0]) > hour;
                    });
                    
                    return (
                      <div key={i} className="min-h-[3rem] relative">
                        {hourEvents.map((event, idx) => {
                          const colors = getEventColors(event.type);
                          return (
                            <div 
                              key={idx} 
                              className="absolute top-0 left-0 right-0 mx-1 my-0.5 px-1 py-0.5 text-xs font-medium rounded-sm overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                              style={{ 
                                backgroundColor: colors.bgColor,
                                borderLeft: `2px solid ${colors.borderColor}`,
                                zIndex: idx + 1
                              }}
                              onClick={() => handleEventClick(event)}
                            >
                              <div className="truncate">{event.title}</div>
                              <div className="truncate text-[10px] text-gray-600">
                                {event.startTime} - {event.endTime}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
          
          {/* Day View */}
          {view === 'day' && (
            <div className="divide-y divide-gray-200">
              <div className="py-2 text-center font-medium text-sm text-gray-700 bg-gray-50">
                {formatDayDate(currentDate)}
              </div>
              
              {/* Time slots */}
              {Array.from({ length: 14 }, (_, i) => i + 8).map(hour => {
                const dateStr = currentDate.toISOString().split('T')[0];
                const hourEvents = events.filter(event => {
                  return event.date === dateStr && 
                         parseInt(event.startTime.split(':')[0]) <= hour && 
                         parseInt(event.endTime.split(':')[0]) > hour;
                });
                
                return (
                  <div key={hour} className="grid grid-cols-8 divide-x divide-gray-200">
                    {/* Time column */}
                    <div className="py-2 px-3 text-right text-xs text-gray-500 bg-gray-50">
                      {hour}:00
                    </div>
                    
                    {/* Events for this hour */}
                    <div className="col-span-7 min-h-[5rem] relative p-1">
                      {hourEvents.map((event, idx) => {
                        const colors = getEventColors(event.type);
                        return (
                          <div 
                            key={idx} 
                            className="p-2 mb-1 text-sm rounded-sm cursor-pointer hover:opacity-80 transition-opacity"
                            style={{ 
                              backgroundColor: colors.bgColor,
                              borderLeft: `3px solid ${colors.borderColor}`,
                            }}
                            onClick={() => handleEventClick(event)}
                          >
                            <div className="font-medium">{event.title}</div>
                            <div className="text-xs text-gray-600 mt-1">
                              {event.startTime} - {event.endTime} • {event.location}
                            </div>
                            {event.description && (
                              <div className="text-xs mt-1 text-gray-700">
                                {event.description}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      
      {/* Add Event Dialog */}
      <CustomDialog 
        open={isAddEventDialogOpen} 
        onOpenChange={(open) => {
          if (!open) {
            resetEventForm();
          }
          setIsAddEventDialogOpen(open);
        }} 
        maxWidth="600px"
      >
        <DialogHeaderWithIcon 
          title="Evenement Toevoegen"
          description="Voeg een nieuw evenement toe aan de rooster"
          icon={<Plus className="h-5 w-5" />}
        />
        
        <DialogFormContainer onSubmit={handleSubmitEvent}>
          {/* Tab Navigation */}
          <div className="flex border-b mb-6">
            <button
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'class' ? 'border-[#1e40af] text-[#1e40af]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('class')}
              type="button"
            >
              <div className="flex items-center">
                <BookOpen className="mr-2 h-4 w-4" />
                Les
              </div>
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'exam' ? 'border-[#1e40af] text-[#1e40af]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('exam')}
              type="button"
            >
              <div className="flex items-center">
                <FilePlus className="mr-2 h-4 w-4" />
                Examen
              </div>
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'holiday' ? 'border-[#1e40af] text-[#1e40af]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('holiday')}
              type="button"
            >
              <div className="flex items-center">
                <Palmtree className="mr-2 h-4 w-4" />
                Vakantie
              </div>
            </button>
            <button
              className={`px-3 py-2 text-sm font-medium border-b-2 ${
                activeTab === 'event' ? 'border-[#1e40af] text-[#1e40af]' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => handleTabChange('event')}
              type="button"
            >
              <div className="flex items-center">
                <PartyPopper className="mr-2 h-4 w-4" />
                Activiteit
              </div>
            </button>
          </div>

          {/* Basis Informatie */}
          <SectionContainer title="Basis Informatie" icon={<Timer className="h-4 w-4" />}>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="title">Titel</FormLabel>
                  <Input
                    id="title"
                    value={newEvent.title}
                    onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                    className="mt-1"
                    placeholder={activeTab === 'class' ? "Wordt automatisch ingevuld bij vak selectie" : "Voer een titel in"}
                    required={activeTab !== 'class'}
                  />
                  {activeTab === 'class' && (
                    <p className="text-xs text-gray-500 mt-1">
                      Titel wordt automatisch de naam van het geselecteerde vak
                    </p>
                  )}
                </div>
                <div>
                  <FormLabel htmlFor="location">Locatie</FormLabel>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    className="mt-1"
                    placeholder="Wordt automatisch ingevuld bij klas selectie"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Locatie wordt automatisch ingevuld bij klas keuze, maar kan handmatig aangepast worden
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <FormLabel htmlFor="date">Datum</FormLabel>
                  <Input
                    id="date"
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <FormLabel htmlFor="startTime">Starttijd</FormLabel>
                  <Input
                    id="startTime"
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <FormLabel htmlFor="endTime">Eindtijd</FormLabel>
                  <Input
                    id="endTime"
                    type="time"
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="mt-1"
                    required
                  />
                </div>
              </div>
            </div>
          </SectionContainer>

          {/* Onderwijs Details (alleen voor les en examen) */}
          {(activeTab === 'class' || activeTab === 'exam') && (
            <SectionContainer title="Onderwijs Details" icon={<GraduationCap className="h-4 w-4" />} className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel htmlFor="courseId">Vak</FormLabel>
                  <StyledSelect 
                    value={newEvent.courseId || ""} 
                    onValueChange={(value) => {
                      // Auto-select teacher based on course
                      let autoTeacher = "";
                      let autoTeacherName = "";
                      if (value === "1") { // Arabisch
                        autoTeacher = "1";
                        autoTeacherName = "Ahmed Al-Mansouri";
                      } else if (value === "2") { // Islamitische Geschiedenis
                        autoTeacher = "2"; 
                        autoTeacherName = "Fatima Hassan";
                      } else if (value === "3") { // Koran Memorisatie
                        autoTeacher = "3";
                        autoTeacherName = "Omar Ibn Khattab";
                      }
                      
                      const courseName = value === "1" ? "Arabisch" : value === "2" ? "Islamitische Geschiedenis" : "Koran Memorisatie";
                      
                      setNewEvent({ 
                        ...newEvent, 
                        courseId: value,
                        courseName: courseName,
                        title: courseName, // Automatisch titel invullen voor lessen
                        teacherId: autoTeacher,
                        teacherName: autoTeacherName
                      });
                    }}
                    placeholder="Selecteer een vak"
                    className="mt-1"
                  >
                    <StyledSelectItem value="1">Arabisch</StyledSelectItem>
                    <StyledSelectItem value="2">Islamitische Geschiedenis</StyledSelectItem>
                    <StyledSelectItem value="3">Koran Memorisatie</StyledSelectItem>
                  </StyledSelect>
                </div>
                
                <div>
                  <FormLabel htmlFor="classId">Klas</FormLabel>
                  <StyledSelect 
                    value={newEvent.classId || ""} 
                    onValueChange={(value) => {
                      // Auto-select location based on class
                      let autoLocation = "";
                      let className = "";
                      if (value === "1") { // Klas 1A
                        autoLocation = "Lokaal A1 - Begane grond";
                        className = "Klas 1A";
                      } else if (value === "2") { // Klas 2B
                        autoLocation = "Lokaal B2 - Eerste verdieping";
                        className = "Klas 2B";
                      } else if (value === "3") { // Klas 3C
                        autoLocation = "Lokaal C3 - Tweede verdieping";
                        className = "Klas 3C";
                      }
                      
                      setNewEvent({ 
                        ...newEvent, 
                        classId: value,
                        className: className,
                        location: autoLocation
                      });
                    }}
                    placeholder="Selecteer een klas"
                    className="mt-1"
                  >
                    <StyledSelectItem value="1">Klas 1A</StyledSelectItem>
                    <StyledSelectItem value="2">Klas 2B</StyledSelectItem>
                    <StyledSelectItem value="3">Klas 3C</StyledSelectItem>
                  </StyledSelect>
                </div>
              </div>
              
              {/* Teacher field - only for lessons */}
              {activeTab === 'class' && (
                <div className="mt-4">
                  <FormLabel htmlFor="teacherId">Docent</FormLabel>
                  <StyledSelect 
                    value={newEvent.teacherId || ""} 
                    onValueChange={(value) => {
                      let teacherName = "";
                      if (value === "1") teacherName = "Ahmed Al-Mansouri";
                      else if (value === "2") teacherName = "Fatima Hassan";
                      else if (value === "3") teacherName = "Omar Ibn Khattab";
                      else if (value === "4") teacherName = "Aisha Bint Abu Bakr";
                      
                      setNewEvent({ 
                        ...newEvent, 
                        teacherId: value,
                        teacherName: teacherName
                      });
                    }}
                    placeholder="Selecteer een docent"
                    className="mt-1"
                  >
                    <StyledSelectItem value="1">Ahmed Al-Mansouri (Arabisch)</StyledSelectItem>
                    <StyledSelectItem value="2">Fatima Hassan (Islamitische Geschiedenis)</StyledSelectItem>
                    <StyledSelectItem value="3">Omar Ibn Khattab (Koran Memorisatie)</StyledSelectItem>
                    <StyledSelectItem value="4">Aisha Bint Abu Bakr (Fiqh)</StyledSelectItem>
                  </StyledSelect>
                  <p className="text-xs text-gray-500 mt-1">
                    Docent wordt automatisch geselecteerd op basis van het vak, maar kan aangepast worden
                  </p>
                </div>
              )}
            </SectionContainer>
          )}

          {/* Aanvullende Informatie */}
          <SectionContainer title="Aanvullende Informatie" icon={<FileText className="h-4 w-4" />} className="mt-4">
            <div className="space-y-4">
              <div>
                <FormLabel htmlFor="description">Beschrijving</FormLabel>
                <Textarea
                  id="description"
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="mt-1"
                  placeholder="Optionele beschrijving van het evenement"
                  rows={3}
                />
              </div>
              
              <div className="flex items-center space-x-3">
                <Switch
                  id="recurring"
                  checked={newEvent.isRecurring}
                  onCheckedChange={(checked) => setNewEvent({ ...newEvent, isRecurring: checked })}
                />
                <FormLabel htmlFor="recurring">Herhalend evenement</FormLabel>
              </div>
              
              {newEvent.isRecurring && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <FormLabel htmlFor="recurrencePattern">Herhalingspatroon</FormLabel>
                    <StyledSelect 
                      value={newEvent.recurrencePattern || ""} 
                      onValueChange={(value) => setNewEvent({ 
                        ...newEvent, 
                        recurrencePattern: value as any
                      })}
                      placeholder="Kies een patroon"
                      className="mt-1"
                    >
                      <StyledSelectItem value="daily">Dagelijks</StyledSelectItem>
                      <StyledSelectItem value="weekly">Wekelijks</StyledSelectItem>
                      <StyledSelectItem value="monthly">Maandelijks</StyledSelectItem>
                    </StyledSelect>
                  </div>
                  
                  <div>
                    <FormLabel htmlFor="recurrenceEndDate">Einddatum herhaling</FormLabel>
                    <Input
                      id="recurrenceEndDate"
                      type="date"
                      value={newEvent.recurrenceEndDate}
                      onChange={(e) => setNewEvent({ ...newEvent, recurrenceEndDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>
          </SectionContainer>
        </DialogFormContainer>

        <DialogFooterContainer 
          onCancel={() => {
            resetEventForm();
            setIsAddEventDialogOpen(false);
          }}
          cancelText="Annuleren"
          submitText={createEventMutation.isPending ? "Toevoegen..." : "Toevoegen"}
        >
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => {
              resetEventForm();
              setIsAddEventDialogOpen(false);
            }}
            className="w-full sm:w-auto mt-2 sm:mt-0"
          >
            Annuleren
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmitEvent}
            className="bg-[#1e40af] hover:bg-[#1e40af]/90 w-full sm:w-auto"
            disabled={createEventMutation.isPending}
          >
            {createEventMutation.isPending ? (
              <>
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Toevoegen...
              </>
            ) : (
              'Toevoegen'
            )}
          </Button>
        </DialogFooterContainer>
      </CustomDialog>

      {/* Event Detail Popup */}
      <CustomDialog 
        open={isEventDetailDialogOpen} 
        onOpenChange={setIsEventDetailDialogOpen} 
        maxWidth="400px"
      >
        {selectedEvent && (
          <>
            <div className="sr-only">
              <h2 id="dialog-title">Event Details</h2>
              <p id="dialog-description">Details for calendar event</p>
            </div>
            <div 
              className="relative p-4 rounded-lg border-l-4 backdrop-blur-sm transition-all duration-300 transform"
              style={{
                backgroundColor: getEventColors(selectedEvent.type).bgColor + '20',
                borderLeftColor: getEventColors(selectedEvent.type).borderColor,
                backdropFilter: 'blur(8px)',
                transform: isEventDetailDialogOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(-10px)',
                opacity: isEventDetailDialogOpen ? 1 : 0,
                transformOrigin: 'center top'
              }}
              aria-labelledby="dialog-title"
              aria-describedby="dialog-description"
            >
              {/* Event Title */}
              <div className="mb-3">
                <h3 className="text-lg font-semibold text-gray-900">{selectedEvent.title}</h3>
                <span className="text-xs font-medium uppercase tracking-wide text-gray-700">
                  {selectedEvent.type === 'class' ? 'Les' : 
                   selectedEvent.type === 'exam' ? 'Examen' :
                   selectedEvent.type === 'holiday' ? 'Vakantie' : 'Evenement'}
                </span>
              </div>
              
              {/* Basic Info */}
              <div className="space-y-2 text-sm text-gray-800">
                <div className="flex items-center">
                  <CalendarIcon className="h-4 w-4 mr-2 text-gray-600" />
                  {new Date(selectedEvent.date + 'T00:00:00').toLocaleDateString('nl-NL', { 
                    weekday: 'short', 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </div>
                
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-2 text-gray-600" />
                  {selectedEvent.startTime} - {selectedEvent.endTime}
                </div>
                
                {selectedEvent.location && (
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-gray-600" />
                    {selectedEvent.location}
                  </div>
                )}

                {/* Course and Class info for lessons/exams */}
                {(selectedEvent.type === 'class' || selectedEvent.type === 'exam') && (
                  <>
                    {selectedEvent.courseName && (
                      <div className="flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-gray-600" />
                        {selectedEvent.courseName}
                      </div>
                    )}
                    {selectedEvent.className && (
                      <div className="flex items-center">
                        <GraduationCap className="h-4 w-4 mr-2 text-gray-600" />
                        {selectedEvent.className}
                      </div>
                    )}
                  </>
                )}
                
                {/* Description if available */}
                {selectedEvent.description && (
                  <div className="mt-3 pt-2 border-t border-gray-400">
                    <p className="text-sm text-gray-700">{selectedEvent.description}</p>
                  </div>
                )}
              </div>

              {/* Delete button */}
              <div className="absolute bottom-2 right-2">
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteEvent(selectedEvent)}
                  className="h-6 w-6 p-0 text-gray-500 hover:text-red-600 hover:bg-red-50/50 transition-colors duration-200"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </>
        )}
      </CustomDialog>
    </div>
  );
}