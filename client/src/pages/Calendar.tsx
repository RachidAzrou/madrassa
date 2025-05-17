import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Filter, 
  FilePlus, GraduationCap, Palmtree, PartyPopper, Pencil, BookOpen, Timer  
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
    isRecurring: false,
    recurrencePattern: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurrenceEndDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0] // 3 maanden vooruit als standaard
  });
  
  const [activeTab, setActiveTab] = useState<'exam' | 'class' | 'holiday' | 'event'>('event');

  // Get month name, year - in Dutch
  const monthNames = ["Januari", "Februari", "Maart", "April", "Mei", "Juni", 
                      "Juli", "Augustus", "September", "Oktober", "November", "December"];
  const month = monthNames[currentDate.getMonth()];
  const year = currentDate.getFullYear();

  // Fetch calendar events for the current month/view
  const { data, isLoading, isError } = useQuery<{ events: CalendarEvent[] }>({
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
  
  // Filter evenementen gebaseerd op filter
  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    return event.type === filter;
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

  // Mutation voor het maken van een nieuw event
  const createEventMutation = useMutation({
    mutationFn: (eventData: typeof newEvent) => {
      return apiRequest('/api/calendar/events', {
        method: 'POST',
        body: eventData
      });
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({
        queryKey: ['/api/calendar/events'],
      });
      
      // Reset form and close dialog
      setNewEvent({
        title: '',
        date: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '10:00',
        location: '',
        type: 'event',
        description: '',
        courseId: '',
        courseName: '',
        classId: '',
        className: '',
        isRecurring: false,
        recurrencePattern: 'weekly' as 'daily' | 'weekly' | 'monthly' | 'yearly',
        recurrenceEndDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0]
      });
      setActiveTab('event');
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
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <CalendarIcon className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Kalender</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Beheer academische evenementen en schoolactiviteiten
          </p>
        </div>
      </div>
      
      {/* Controls and filters - onder de streep */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <Tabs value={view} onValueChange={(value) => setView(value as 'month' | 'week' | 'day')}>
              <TabsList className="p-1 bg-blue-900/10">
                <TabsTrigger 
                  value="month" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md"
                >
                  Maand
                </TabsTrigger>
                <TabsTrigger 
                  value="week" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md"
                >
                  Week
                </TabsTrigger>
                <TabsTrigger 
                  value="day" 
                  className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md"
                >
                  Dag
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center space-x-3">
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
              className="bg-primary hover:bg-primary/90 flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Evenement Toevoegen</span>
            </Button>
          </div>
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
      {view === 'month' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Week days header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map((day) => (
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
      ) : view === 'week' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Weekdagen header */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'].map((day, index) => {
              // Bereken datum voor elke dag van de huidige week
              const currentWeekDay = new Date(currentDate);
              const firstDayOfWeek = new Date(currentWeekDay);
              const diff = currentWeekDay.getDay() - index;
              firstDayOfWeek.setDate(currentWeekDay.getDate() - diff);
              
              return (
                <div key={day} className="p-2 text-center border-b border-gray-200 bg-gray-50">
                  <div className="text-sm font-medium text-gray-700">{day}</div>
                  <div className="text-xs text-gray-500">
                    {formatDate(firstDayOfWeek)}
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Week view tijdslots */}
          <div className="grid grid-cols-7 divide-x divide-gray-200">
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              // Bereken datum voor elke dag
              const currentWeekDay = new Date(currentDate);
              const targetDay = new Date(currentWeekDay);
              const diff = currentWeekDay.getDay() - dayIndex;
              targetDay.setDate(currentWeekDay.getDate() - diff);
              
              // Filter evenementen voor deze dag
              const dayEvents = (events || []).filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.toDateString() === targetDay.toDateString();
              });
              
              // Genereer tijdslots (8:00 - 20:00)
              return (
                <div key={dayIndex} className="min-h-[600px] relative">
                  {Array.from({ length: 13 }).map((_, hourIndex) => {
                    const hour = hourIndex + 8; // Start vanaf 8:00
                    return (
                      <div 
                        key={hourIndex} 
                        className="h-12 border-b border-gray-200 relative px-1"
                      >
                        <div className="absolute left-0 -translate-y-1/2 text-xs text-gray-400 w-8 pl-1">
                          {hour}:00
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Plaats evenementen */}
                  {dayEvents.map((event) => {
                    // Bereken positie gebaseerd op starttijd
                    const [hours, minutes] = event.startTime.split(':').map(Number);
                    const top = (hours - 8) * 48 + (minutes / 60) * 48; // 48px per uur
                    
                    // Bereken hoogte gebaseerd op duur
                    const [endHours, endMinutes] = event.endTime.split(':').map(Number);
                    const duration = (endHours - hours) + (endMinutes - minutes) / 60;
                    const height = duration * 48;
                    
                    return (
                      <div 
                        key={event.id}
                        className={`absolute rounded px-1 py-0.5 text-xs w-[95%] overflow-hidden shadow-sm ${getEventColor(event.type)}`}
                        style={{ top: `${top}px`, height: `${height}px` }}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-xs truncate">
                          {event.startTime} - {event.endTime}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      ) : view === 'day' ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Dag header */}
          <div className="p-3 text-center border-b border-gray-200 bg-gray-50">
            <div className="text-base font-medium text-gray-800">
              {formatDayDate(currentDate)}
            </div>
          </div>
          
          {/* Dag tijdslots */}
          <div className="min-h-[700px] relative p-4">
            {/* Tijdsaanduidingen */}
            <div className="absolute top-0 left-0 w-12 bottom-0 border-r border-gray-200">
              {Array.from({ length: 13 }).map((_, index) => {
                const hour = index + 8; // Start vanaf 8:00
                return (
                  <div key={index} className="h-14 relative">
                    <div className="absolute right-2 top-0 -translate-y-1/2 text-xs text-gray-500">
                      {hour}:00
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Horizontale lijnen voor de uren */}
            <div className="ml-12 relative">
              {Array.from({ length: 13 }).map((_, index) => (
                <div key={index} className="h-14 border-b border-gray-100"></div>
              ))}
              
              {/* Evenementen van deze dag */}
              {(events || [])
                .filter(event => {
                  const eventDate = new Date(event.date);
                  return eventDate.toDateString() === currentDate.toDateString();
                })
                .map((event) => {
                  // Bereken positie gebaseerd op starttijd
                  const [hours, minutes] = event.startTime.split(':').map(Number);
                  const top = (hours - 8) * 56 + (minutes / 60) * 56; // 56px per uur
                  
                  // Bereken hoogte gebaseerd op duur
                  const [endHours, endMinutes] = event.endTime.split(':').map(Number);
                  const duration = (endHours - hours) + (endMinutes - minutes) / 60;
                  const height = duration * 56;
                  
                  return (
                    <div 
                      key={event.id}
                      className={`absolute left-14 right-4 rounded px-3 py-2 ${getEventColor(event.type)}`}
                      style={{ top: `${top}px`, height: `${height}px` }}
                    >
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs">
                        {event.startTime} - {event.endTime}
                        {event.location && ` • ${event.location}`}
                      </div>
                    </div>
                  );
                })
              }
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center">
          <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Geen Weergave Geselecteerd</h3>
          <p className="mt-1 text-sm text-gray-500">
            Selecteer maand, week of dag om de kalender te bekijken.
          </p>
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center">
            <span className="w-3 h-3 bg-red-100 border border-red-200 rounded-sm mr-1.5"></span>
            <span className="text-xs text-gray-600">Examens</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-blue-100 border border-blue-200 rounded-sm mr-1.5"></span>
            <span className="text-xs text-gray-600">Lessen</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-purple-100 border border-purple-200 rounded-sm mr-1.5"></span>
            <span className="text-xs text-gray-600">Vakanties</span>
          </div>
          <div className="flex items-center">
            <span className="w-3 h-3 bg-green-100 border border-green-200 rounded-sm mr-1.5"></span>
            <span className="text-xs text-gray-600">Activiteiten</span>
          </div>
        </div>
      </div>

      {/* Add Event Dialog */}
      <Dialog open={isAddEventDialogOpen} onOpenChange={setIsAddEventDialogOpen}>
        <DialogContent className="max-w-[95vw] w-[720px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Evenement Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuw evenement toe aan de academische kalender
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={(value) => handleTabChange(value as 'exam' | 'class' | 'holiday' | 'event')}>
            <TabsList className="grid grid-cols-4 mt-2 p-1 bg-blue-900/10">
              <TabsTrigger value="exam" className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                <FilePlus className="h-4 w-4" />
                <span>Examen</span>
              </TabsTrigger>
              <TabsTrigger value="class" className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                <BookOpen className="h-4 w-4" />
                <span>Les</span>
              </TabsTrigger>
              <TabsTrigger value="holiday" className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                <Palmtree className="h-4 w-4" />
                <span>Vakantie</span>
              </TabsTrigger>
              <TabsTrigger value="event" className="flex items-center justify-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                <PartyPopper className="h-4 w-4" />
                <span>Activiteit</span>
              </TabsTrigger>
            </TabsList>
            
            <form onSubmit={handleSubmitEvent}>
              <div className="space-y-4 mt-4">
                {/* Gemeenschappelijke velden */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="eventTitle">Titel<span className="text-red-500">*</span></Label>
                    <Input
                      id="eventTitle"
                      value={newEvent.title}
                      onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                      placeholder="Voer een titel in"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="eventDate">Datum<span className="text-red-500">*</span></Label>
                    <Input
                      id="eventDate"
                      type="date"
                      value={newEvent.date}
                      onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Starttijd</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={newEvent.startTime}
                      onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endTime">Eindtijd</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={newEvent.endTime}
                      onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="location">Locatie</Label>
                  <Input
                    id="location"
                    value={newEvent.location}
                    onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                    placeholder="Bijv. Lokaal A1.02 of Online"
                  />
                </div>
                
                {/* Specifieke velden per type evenement */}
                <TabsContent value="exam" className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium flex items-center mb-2">
                    <FilePlus className="mr-2 h-5 w-5 text-primary" />
                    Examen details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseExam">Vak<span className="text-red-500">*</span></Label>
                      <Select
                        value={newEvent.courseId}
                        onValueChange={(value) => setNewEvent({ 
                          ...newEvent, 
                          courseId: value,
                          courseName: value // In werkelijkheid zou je hier de naam opzoeken
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer vak" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Arabisch</SelectItem>
                          <SelectItem value="2">Islamitische studies</SelectItem>
                          <SelectItem value="3">Koran</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="classExam">Klas<span className="text-red-500">*</span></Label>
                      <Select
                        value={newEvent.classId}
                        onValueChange={(value) => setNewEvent({ 
                          ...newEvent, 
                          classId: value,
                          className: value // In werkelijkheid zou je hier de naam opzoeken
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer klas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Klas 1A</SelectItem>
                          <SelectItem value="2">Klas 2B</SelectItem>
                          <SelectItem value="3">Klas 3C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="class" className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium flex items-center mb-2">
                    <BookOpen className="mr-2 h-5 w-5 text-primary" />
                    Les details
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseClass">Vak<span className="text-red-500">*</span></Label>
                      <Select
                        value={newEvent.courseId}
                        onValueChange={(value) => setNewEvent({ 
                          ...newEvent, 
                          courseId: value,
                          courseName: value // In werkelijkheid zou je hier de naam opzoeken
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer vak" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Arabisch</SelectItem>
                          <SelectItem value="2">Islamitische studies</SelectItem>
                          <SelectItem value="3">Koran</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="classClass">Klas<span className="text-red-500">*</span></Label>
                      <Select
                        value={newEvent.classId}
                        onValueChange={(value) => setNewEvent({ 
                          ...newEvent, 
                          classId: value,
                          className: value // In werkelijkheid zou je hier de naam opzoeken
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer klas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">Klas 1A</SelectItem>
                          <SelectItem value="2">Klas 2B</SelectItem>
                          <SelectItem value="3">Klas 3C</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="holiday" className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium flex items-center mb-2">
                    <Palmtree className="mr-2 h-5 w-5 text-primary" />
                    Vakantie details
                  </h3>
                </TabsContent>
                
                <TabsContent value="event" className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium flex items-center mb-2">
                    <PartyPopper className="mr-2 h-5 w-5 text-primary" />
                    Activiteit details
                  </h3>
                </TabsContent>
                
                {/* Beschrijving veld */}
                <div className="space-y-2">
                  <Label htmlFor="description">Beschrijving</Label>
                  <Textarea
                    id="description"
                    value={newEvent.description}
                    onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                    placeholder="Optionele beschrijving"
                    rows={3}
                  />
                </div>
                
                {/* Herhalingsopties - beschikbaar voor alle evenementtypes */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-medium flex items-center mb-2">
                    <Timer className="mr-2 h-5 w-5 text-primary" />
                    Herhaling
                  </h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      checked={newEvent.isRecurring}
                      onCheckedChange={(checked) => setNewEvent({ ...newEvent, isRecurring: checked })}
                      id="isRecurring"
                    />
                    <Label htmlFor="isRecurring">Dit is een terugkerend evenement</Label>
                  </div>
                  
                  {newEvent.isRecurring && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-6 border-l-2 border-l-gray-200 mt-2">
                      <div className="space-y-2">
                        <Label htmlFor="recurrencePattern">Herhalingspatroon</Label>
                        <Select
                          value={newEvent.recurrencePattern}
                          onValueChange={(value: 'daily' | 'weekly' | 'monthly' | 'yearly') => setNewEvent({
                            ...newEvent,
                            recurrencePattern: value
                          })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Kies patroon" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Dagelijks</SelectItem>
                            <SelectItem value="weekly">Wekelijks</SelectItem>
                            <SelectItem value="monthly">Maandelijks</SelectItem>
                            <SelectItem value="yearly">Jaarlijks</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="recurrenceEndDate">Einddatum herhaling</Label>
                        <Input
                          id="recurrenceEndDate"
                          type="date"
                          value={newEvent.recurrenceEndDate}
                          onChange={(e) => setNewEvent({ ...newEvent, recurrenceEndDate: e.target.value })}
                          min={newEvent.date}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                <DialogFooter className="pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsAddEventDialogOpen(false)}
                  >
                    Annuleren
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createEventMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {createEventMutation.isPending ? 'Bezig met toevoegen...' : 'Evenement toevoegen'}
                  </Button>
                </DialogFooter>
              </div>
            </form>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
