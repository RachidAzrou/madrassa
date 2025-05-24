import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Filter, 
  FilePlus, GraduationCap, Palmtree, PartyPopper, Pencil, BookOpen, Timer,
  MapPin, Clock, Search, XCircle, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CustomDialogContent } from "@/components/ui/custom-dialog-content";
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
        filter,
        search: searchTerm
      }
    ],
    staleTime: 30000,
  });

  const events: CalendarEvent[] = data?.events || [];
  
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
      const dayEvents = events.filter(event => event.date.startsWith(dateStr));
      
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
      const dateStr = date.toISOString().split('T')[0];
      
      // Find events for this day
      const dayEvents = events.filter(event => event.date.startsWith(dateStr));
      
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
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
              <CalendarIcon className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Kalender</h1>
              <p className="text-base text-gray-500 mt-1">Beheer academische evenementen en schoolactiviteiten</p>
            </div>
          </div>
        </div>
      </div>
      
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
              className="bg-primary hover:bg-primary/90 flex items-center"
            >
              <Plus className="mr-2 h-4 w-4" />
              <span>Evenement Toevoegen</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-md px-4 py-4 border border-sky-200">
        <button 
          onClick={navigatePrevious}
          className="p-2 rounded-md text-sky-600 hover:bg-sky-50 transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <h2 className="text-xl font-semibold text-sky-900">
          {month} {year}
        </h2>
        <button 
          onClick={navigateNext}
          className="p-2 rounded-md text-sky-600 hover:bg-sky-50 transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Calendar Content */}
      {view === 'month' ? (
        <div className="bg-white rounded-lg shadow-md border border-sky-200 overflow-hidden">
          {/* Week days header */}
          <div className="grid grid-cols-7 border-b border-sky-200">
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, index) => (
              <div 
                key={day} 
                className={`py-3 text-center ${
                  index === 5 || index === 6 
                    ? 'bg-gradient-to-b from-sky-50 to-sky-100/40 text-sky-700' 
                    : 'bg-white text-gray-700'
                } text-sm font-semibold border-b border-sky-100`}
              >
                {day}
              </div>
            ))}
          </div>
          
          {/* Calendar grid */}
          <div className="grid grid-cols-7 grid-rows-6 divide-y divide-gray-100">
            {calendarDays.map((dayData, index) => {
              // Bepaal of het weekend is (zaterdag of zondag)
              const isWeekend = index % 7 === 5 || index % 7 === 6;
              
              // Bouw dynamische stijl op voor de cel
              let cellBaseClass = "min-h-[110px] p-2 relative transition-colors duration-200 cursor-pointer border";
              
              if (!dayData.day) {
                // Lege dag (zou niet meer moeten voorkomen met onze nieuwe genereerlogica)
                cellBaseClass += " bg-gray-50/40 border-gray-100";
              } else if (dayData.isToday) {
                // Huidige dag
                cellBaseClass += " bg-blue-50 hover:bg-blue-100/60 border-blue-300";
              } else if (!dayData.isCurrentMonth) {
                // Dag van vorige of volgende maand
                cellBaseClass += " bg-gray-50/30 hover:bg-gray-50 border-gray-100 opacity-70";
              } else if (isWeekend) {
                // Weekend dag
                cellBaseClass += " bg-sky-50/20 hover:bg-sky-50/50 border-sky-50";
              } else {
                // Normale dag in huidige maand
                cellBaseClass += " hover:bg-sky-50/50 border-sky-50";
              }
              
              return (
                <div 
                  key={index} 
                  className={cellBaseClass}
                  onClick={() => {
                    if (dayData.day && dayData.date) {
                      setCurrentDate(dayData.date);
                      setView('day');
                    }
                  }}
                >
                  {dayData.day && (
                    <>
                      <div className={`text-right ${
                        dayData.date && new Date().toDateString() === dayData.date.toDateString() 
                          ? 'bg-sky-500 text-white w-6 h-6 rounded-full flex items-center justify-center ml-auto' 
                          : 'font-medium text-gray-700'
                      }`}>
                        {dayData.date && new Date().toDateString() === dayData.date.toDateString() ? (
                          <span>{dayData.day}</span>
                        ) : (
                          dayData.day
                        )}
                      </div>
                      <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto">
                        {dayData.events.slice(0, 3).map((event) => (
                          <div 
                            key={event.id} 
                            className="px-2 py-1 text-xs rounded-md shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                            style={{ 
                              backgroundColor: getEventColors(event.type).bgColor,
                              borderLeft: `3px solid ${getEventColors(event.type).borderColor}`,
                            }}
                          >
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span className="font-medium">{event.startTime.slice(0, 5)}</span>
                            </div>
                            <div className="font-medium truncate mt-0.5">{event.title}</div>
                          </div>
                        ))}
                        
                        {/* Indicator voor meer evenementen */}
                        {dayData.events.length > 3 && (
                          <div className="text-xs bg-gray-50 text-gray-600 rounded-md p-1 text-center font-medium shadow-sm">
                            +{dayData.events.length - 3} meer
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : view === 'week' ? (
        <div className="bg-white rounded-lg shadow-md border border-sky-200 overflow-hidden">
          {/* Weekdagen header - Nieuwe stijl met tijden in aparte kolom */}
          <div className="grid grid-cols-8 bg-white">
            {/* Lege cel voor de tijdskolom */}
            <div className="text-center border-r border-b border-gray-200 py-2">
              <div className="text-sm font-medium text-gray-500">Tijd</div>
            </div>
          
            {/* Weekdagen */}
            {['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo'].map((day, index) => {
              // Bereken datum voor elke dag van de huidige week (maandag als start)
              const currentWeekDay = new Date(currentDate);
              // Pas aan voor maandag als startdag van de week (1 = Ma, 2 = Di, etc.)
              // Zondag wordt 0, dus bij zondag zorgen we dat het 7 wordt
              const currentDay = currentWeekDay.getDay() || 7; // Zondag van 0 naar 7
              const distanceFromMonday = currentDay - 1; // Verschil met maandag
              const mondayOfWeek = new Date(currentWeekDay);
              mondayOfWeek.setDate(currentWeekDay.getDate() - distanceFromMonday);
              
              // Nu berekenen we de datum voor elke weekdag, startend bij maandag (0 = ma, 1 = di, etc.)
              const targetDay = new Date(mondayOfWeek);
              targetDay.setDate(mondayOfWeek.getDate() + index);
              
              // Check of dag vandaag is
              const isToday = targetDay.toDateString() === new Date().toDateString();
              
              return (
                <div 
                  key={day} 
                  className={`text-center border-r border-b border-gray-200 py-2 ${isToday ? 'bg-sky-50' : ''}`}
                >
                  <div className={`text-sm font-medium ${isToday ? 'text-sky-600' : 'text-gray-600'}`}>{day} {targetDay.getDate()}</div>
                </div>
              );
            })}
          </div>
          
          {/* Week view tijdslots - Nieuwe stijl met tijden in aparte kolom */}
          <div className="grid grid-cols-8 overflow-hidden">
            {/* Tijdskolom */}
            <div className="border-r border-gray-200 relative">
              {Array.from({ length: 14 }).map((_, hourIndex) => {
                const hour = hourIndex + 7; // Start vanaf 7:00
                return (
                  <div 
                    key={hourIndex} 
                    className="h-12 border-b border-gray-200 relative"
                  >
                    <div className="h-full flex items-center justify-center">
                      <span className="text-xs text-gray-600 font-medium">
                        {hour}:00
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Weekdagen kolommen */}
            {Array.from({ length: 7 }).map((_, dayIndex) => {
              // Bereken datum voor elke dag startend op maandag
              const currentWeekDay = new Date(currentDate);
              // Pas aan voor maandag als startdag van de week
              const currentDay = currentWeekDay.getDay() || 7; // Zondag van 0 naar 7
              const distanceFromMonday = currentDay - 1; // Verschil met maandag
              const mondayOfWeek = new Date(currentWeekDay);
              mondayOfWeek.setDate(currentWeekDay.getDate() - distanceFromMonday);
              
              // Dan berekenen we de datum voor elke weekdag, startend bij maandag
              const targetDay = new Date(mondayOfWeek);
              targetDay.setDate(mondayOfWeek.getDate() + dayIndex);
              
              // Check of dag vandaag is
              const isToday = targetDay.toDateString() === new Date().toDateString();
              // Check of dag weekend is
              const isWeekend = dayIndex >= 5;
              
              // Filter evenementen voor deze dag
              const dayEvents = (events || []).filter(event => {
                const eventDate = new Date(event.date);
                return eventDate.toDateString() === targetDay.toDateString();
              });
              
              return (
                <div key={dayIndex} className="border-r border-gray-200 relative">
                  {/* Genereer tijdslots (7:00 - 20:00) */}
                  {Array.from({ length: 14 }).map((_, hourIndex) => {
                    const hour = hourIndex + 7; // Start vanaf 7:00
                    return (
                      <div key={hourIndex} className="h-12 border-b border-gray-200 relative" />
                    );
                  })}
                  
                  {/* Plaats evenementen - Nieuwe stijl */}
                  {dayEvents.map((event) => {
                    // Bereken positie gebaseerd op starttijd
                    const [hours, minutes] = event.startTime.split(':').map(Number);
                    const top = (hours - 7) * 48 + (minutes / 60) * 48; // 48px per uur
                    
                    // Bereken hoogte gebaseerd op duur
                    const [endHours, endMinutes] = event.endTime.split(':').map(Number);
                    const duration = (endHours - hours) + (endMinutes - minutes) / 60;
                    const height = Math.max(20, duration * 48); // Minimale hoogte
                    
                    // Bepaal de kleur gebaseerd op event type
                    let bgColor = "#E3F2FD"; // Default lichtblauw
                    let borderColor = "#1E88E5"; // Default blauw
                    
                    switch (event.type) {
                      case 'exam':
                        bgColor = "#FFEBEE"; // Lichtroze
                        borderColor = "#E53935"; // Rood
                        break;
                      case 'class':
                        bgColor = "#E3F2FD"; // Lichtblauw
                        borderColor = "#1E88E5"; // Blauw
                        break;
                      case 'holiday':
                        bgColor = "#E8F5E9"; // Lichtgroen
                        borderColor = "#43A047"; // Groen
                        break;
                      case 'event':
                        bgColor = "#FFF9C4"; // Lichtgeel
                        borderColor = "#FDD835"; // Geel
                        break;
                    }
                    
                    return (
                      <div 
                        key={event.id}
                        className="absolute w-[95%] overflow-hidden transition-shadow hover:shadow-md"
                        style={{ 
                          backgroundColor: bgColor,
                          top: `${top}px`, 
                          height: `${height}px`,
                          left: '2.5%',
                          borderLeft: `4px solid ${borderColor}`,
                        }}
                      >
                        <div className="px-2 py-1 h-full flex flex-col">
                          <div className="text-xs font-medium flex items-start text-gray-800 mb-1">
                            {event.title}
                          </div>
                          <div className="text-[10px] text-gray-700">
                            {event.startTime} - {event.endTime}
                          </div>
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
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Dag header */}
          <div className="p-4 text-center border-b border-gray-200">
            <div className="text-base font-medium text-gray-700">
              {formatDayDate(currentDate)}
            </div>
          </div>
          
          {/* Dag tijdslots in dezelfde stijl als de week */}
          <div className="min-h-[700px] relative grid grid-cols-8">
            {/* Tijdskolom */}
            <div className="border-r border-gray-200 relative">
              {Array.from({ length: 14 }).map((_, hourIndex) => {
                const hour = hourIndex + 7; // Start vanaf 7:00
                return (
                  <div key={hourIndex} className="h-12 border-b border-gray-200 relative">
                    <div className="h-full flex items-center justify-center">
                      <span className="text-xs text-gray-600 font-medium">
                        {hour}:00
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Contentkolom */}
            <div className="col-span-7 relative">
              {/* Uurlijnen */}
              {Array.from({ length: 14 }).map((_, hourIndex) => (
                <div key={hourIndex} className="h-12 border-b border-gray-200 relative" />
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
                  const top = (hours - 7) * 48 + (minutes / 60) * 48; // 48px per uur
                  
                  // Bereken hoogte gebaseerd op duur
                  const [endHours, endMinutes] = event.endTime.split(':').map(Number);
                  const duration = (endHours - hours) + (endMinutes - minutes) / 60;
                  const height = Math.max(30, duration * 48); // Minimale hoogte
                  
                  // Bepaal de kleur gebaseerd op event type
                  let bgColor = "#E3F2FD"; // Default lichtblauw
                  let borderColor = "#1E88E5"; // Default blauw
                  
                  switch (event.type) {
                    case 'exam':
                      bgColor = "#FFEBEE"; // Lichtroze
                      borderColor = "#E53935"; // Rood
                      break;
                    case 'class':
                      bgColor = "#E3F2FD"; // Lichtblauw
                      borderColor = "#1E88E5"; // Blauw
                      break;
                    case 'holiday':
                      bgColor = "#E8F5E9"; // Lichtgroen
                      borderColor = "#43A047"; // Groen
                      break;
                    case 'event':
                      bgColor = "#FFF9C4"; // Lichtgeel
                      borderColor = "#FDD835"; // Geel
                      break;
                  }
                  
                  return (
                    <div 
                      key={event.id}
                      className="absolute w-[98%] left-[1%] overflow-hidden transition-shadow hover:shadow-md"
                      style={{ 
                        backgroundColor: bgColor,
                        top: `${top}px`, 
                        height: `${height}px`,
                        borderLeft: `4px solid ${borderColor}`,
                      }}
                    >
                      <div className="px-3 py-1.5 h-full flex flex-col">
                        <div className="text-sm font-medium text-gray-800">
                          {event.title}
                        </div>
                        <div className="text-xs text-gray-700 mt-1">
                          {event.startTime} - {event.endTime}
                        </div>
                        {event.location && (
                          <div className="text-xs text-gray-700 mt-1">
                            <MapPin className="h-3 w-3 inline mr-1" />
                            {event.location}
                          </div>
                        )}
                        {event.description && (
                          <div className="text-xs mt-2 pt-1.5 border-t border-gray-200 text-gray-600">
                            {event.description}
                          </div>
                        )}
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
