import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  LayoutDashboard,
  Building,
  PieChart,
  Clock,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Topbar } from '@/components/layout/topbar';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, endOfWeek, addDays, parseISO, isToday, isWithinInterval, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';

// Aangepast ChalkBoard icoon
const ChalkBoard = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="14" rx="2" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="6" y1="12" x2="6" y2="20" />
    <line x1="18" y1="12" x2="18" y2="20" />
    <ellipse cx="12" cy="18" rx="3" ry="2" />
    <path d="M10 4h4" />
    <path d="M8 8h8" />
  </svg>
);

// Hulpfunctie om dagen van de week te krijgen
function getCurrentWeekDays() {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 }); // Week begint op maandag
  
  return Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(start, i);
    return {
      date,
      dayName: format(date, 'EEEE', { locale: nl }),
      dayShort: format(date, 'EEE', { locale: nl }),
      dayNumber: format(date, 'd'),
      isToday: isToday(date)
    };
  });
}

// Interfaces voor typering
interface StatsData {
  totalStudents: number;
  activeCourses: number;
  activePrograms: number;
  totalTeachers: number;
  studentGroups: number;
}

interface Lesson {
  id: number;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  courseName: string;
}

interface StudentGroup {
  id: number;
  name: string;
  maxCapacity?: number;
}

interface StudentGroupEnrollment {
  id: number;
  studentId: number;
  studentGroupId: number;
}

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const weekdays = getCurrentWeekDays();
  
  // Fetch stats data
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 60000,
  });

  // Fetch student groups data
  const { data: studentGroupsData = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ['/api/student-groups'],
    staleTime: 60000,
  });
  
  // Fetch group enrollments
  const { data: studentGroupEnrollmentsData = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/student-group-enrollments'],
    staleTime: 60000,
  });
  
  // Fetch calendar events data
  const { data: calendarData, isLoading: isEventsLoading } = useQuery<{ events: any[] }>({
    queryKey: ['/api/calendar/events'],
    staleTime: 60000,
  });

  const events = calendarData?.events || [];

  // Bereid data voor met veilige defaults als de data nog niet geladen is
  const stats = {
    totalStudents: (statsData as StatsData)?.totalStudents || 0,
    activeCourses: (statsData as StatsData)?.activeCourses || 0,
    programs: (statsData as StatsData)?.activePrograms || 0, 
    totalTeachers: (statsData as StatsData)?.totalTeachers || 0,
    studentGroups: (statsData as StatsData)?.studentGroups || 0,
  };
  
  // Calculate student counts per group and track max capacity
  const studentCountsPerGroup = (studentGroupsData as StudentGroup[]).map((group) => {
    const count = (studentGroupEnrollmentsData as StudentGroupEnrollment[]).filter(
      enrollment => enrollment.studentGroupId === group.id
    ).length;
    
    return {
      name: group.name,
      count: count,
      maxCapacity: group.maxCapacity || 30, // Default to 30 if no maxCapacity
      percentageFilled: count / (group.maxCapacity || 30) // Calculate fill percentage
    };
  });
  
  // Filter events for the current week
  const currentWeekEvents = events.filter((event) => {
    if (!event.date) return false;
    const eventDate = parseISO(event.date);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
  });

  // Filter events for the selected date
  const selectedDateEvents = events.filter((event) => {
    if (!event.date) return false;
    const eventDate = parseISO(event.date);
    return format(eventDate, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd');
  });
  
  // Navigatiefuncties
  const navigateToCalendar = () => setLocation('/calendar?view=week');
  const navigateToStudents = () => setLocation('/students');
  const navigateToCourses = () => setLocation('/courses');
  const navigateToTeachers = () => setLocation('/teachers');
  const navigateToGroups = () => setLocation('/student-groups');

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Desktop application header bar - Professionele stijl - Premium variant */}
      <PageHeader
        title="Dashboard"
        icon={<LayoutDashboard className="h-5 w-5 text-white" />}
        parent="Beheer"
        current="Dashboard"
      />
      
      {/* Main content area */}
      <div className="px-6 py-6 max-w-7xl mx-auto">

      {/* Stats Overview - Desktop-applicatie stijl */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Studenten kaart */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex h-full">
            <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
              <Users className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500">Studenten</h3>
                <p className="text-lg font-medium text-gray-800 mt-1">{stats.totalStudents}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Klassen kaart */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex h-full">
            <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
              <ChalkBoard className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500">Klassen</h3>
                <p className="text-lg font-medium text-gray-800 mt-1">{stats.studentGroups}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Docenten kaart */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex h-full">
            <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
              <GraduationCap className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500">Docenten</h3>
                <p className="text-lg font-medium text-gray-800 mt-1">{stats.totalTeachers}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Vakken kaart */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex h-full">
            <div className="flex items-center justify-center w-14 bg-[#f5f7fc] border-r border-[#e5e7eb]">
              <BookOpen className="h-5 w-5 text-[#1e40af]" />
            </div>
            <div className="flex-1 p-3">
              <div className="flex flex-col">
                <h3 className="text-xs font-medium text-gray-500">Vakken</h3>
                <p className="text-lg font-medium text-gray-800 mt-1">{stats.activeCourses}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main dashboard content - fullwidth design */}
      <div className="space-y-4">
        {/* Studenten per klas grafiek - Desktop application styling */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafc]">
            <div className="flex items-center gap-2">
              <PieChart className="h-3.5 w-3.5 text-[#1e40af]" />
              <h3 className="text-xs font-medium text-gray-700 tracking-tight">Klasbezetting</h3>
            </div>

          </div>
          
          {/* Studentengroepen data visualisatie - Tabel met voortgangsbalken */}
          {isGroupsLoading || isEnrollmentsLoading || isStatsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : stats.totalStudents === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center p-4">
              <div className="p-2 bg-[#f7f9fc] text-[#1e40af] mb-3 border border-[#e5e7eb] rounded-sm">
                <Users className="h-6 w-6 opacity-60" />
              </div>
              <p className="text-xs text-gray-500">Geen studenten beschikbaar</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 text-[10px] h-6 border-[#e5e7eb] text-gray-600 hover:bg-gray-50 rounded-sm" 
                onClick={navigateToStudents}
              >
                Voeg studenten toe
              </Button>
            </div>
          ) : (studentGroupsData as any[]).length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center p-4">
              <div className="p-2 bg-[#f7f9fc] text-[#1e40af] mb-3 border border-[#e5e7eb] rounded-sm">
                <ChalkBoard className="h-6 w-6 opacity-60" />
              </div>
              <p className="text-xs text-gray-500">Geen klassen beschikbaar</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2 text-[10px] h-6 border-[#e5e7eb] text-gray-600 hover:bg-gray-50 rounded-sm" 
                onClick={navigateToGroups}
              >
                Maak een klas aan
              </Button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {/* Toon alle klassen, ook lege klassen */}
              {(studentGroupsData as any[]).map((group, index) => {
                // Zoek hoeveel studenten er in deze klas zitten
                const enrolledStudents = (studentGroupEnrollmentsData as any[]).filter(
                  enrollment => enrollment.studentGroupId === group.id
                ).length;
                
                // Gebruik een standaard capaciteit als er geen is ingesteld
                const maxCapacity = group.maxCapacity || 30;
                const percentageFilled = maxCapacity > 0 ? enrolledStudents / maxCapacity : 0;
                
                // Gebruik de huisstijl kleuren
                const getStatusColor = (percentage: number) => {
                  if (percentage < 0.5) return { bg: 'bg-yellow-100', border: 'border-yellow-200', text: 'text-yellow-800', bar: 'bg-yellow-500' };
                  if (percentage < 0.75) return { bg: 'bg-blue-100', border: 'border-blue-200', text: 'text-blue-800', bar: 'bg-blue-500' };
                  if (percentage < 0.9) return { bg: 'bg-green-100', border: 'border-green-200', text: 'text-green-800', bar: 'bg-green-500' };
                  return { bg: 'bg-red-100', border: 'border-red-200', text: 'text-red-800', bar: 'bg-red-500' };
                };

                const getStatusLabel = (percentage: number) => {
                  if (percentage < 0.5) return 'Lage bezetting';
                  if (percentage < 0.75) return 'Gemiddelde bezetting';
                  if (percentage < 0.9) return 'Goede bezetting';
                  return 'Vol';
                };

                const colors = getStatusColor(percentageFilled);
                const statusLabel = getStatusLabel(percentageFilled);
                const barWidth = `${Math.max(3, Math.min(100, percentageFilled * 100))}%`;
                
                return (
                  <div key={index} className="bg-white border border-[#e5e7eb] rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-[#f0f4ff] border border-[#e5e7eb] rounded-lg">
                          <ChalkBoard className="h-5 w-5 text-[#1e40af]" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">{group.name}</h4>
                          <p className="text-xs text-gray-500">{enrolledStudents} van {maxCapacity} studenten</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${colors.bg} ${colors.border} ${colors.text}`}>
                          {statusLabel}
                        </span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Bezetting</span>
                        <span className="font-medium text-gray-700">{Math.round(percentageFilled * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className={`h-full ${colors.bar} rounded-full transition-all duration-500 ease-out`}
                          style={{ width: barWidth }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {/* Samenvatting */}
              <div className="bg-[#f9fafc] border border-[#e5e7eb] rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-[#1e40af]" />
                    <span className="text-xs font-medium text-gray-700">Totaal overzicht</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-gray-900">{stats.totalStudents} studenten</div>
                    <div className="text-xs text-gray-500">{stats.studentGroups} klassen</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Weekkalender - Desktop application styling */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm">
          <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafc]">
            <div className="flex items-center gap-2">
              <Calendar className="h-3.5 w-3.5 text-[#1e40af]" />
              <h3 className="text-xs font-medium text-gray-700 tracking-tight">Weekplanning</h3>
            </div>

          </div>
          
          {/* Week view - Desktop app stijl weekkalender */}
          <div className="px-0 py-0">
            <div className="grid grid-cols-7 border-b border-[#e5e7eb]">
              {weekdays.map((day, index) => {
                const dayEvents = events.filter(event => {
                  if (!event.date) return false;
                  const eventDate = parseISO(event.date);
                  return isSameDay(eventDate, day.date);
                });
                
                const isSelected = isSameDay(day.date, selectedDate);
                
                return (
                  <div 
                    key={index}
                    onClick={() => setSelectedDate(day.date)}
                    className={`text-center py-2 cursor-pointer transition-colors ${index < 6 ? 'border-r' : ''} border-[#e5e7eb] ${
                      isSelected 
                        ? 'bg-[#1e40af] text-white' 
                        : day.isToday 
                          ? 'bg-[#f0f4ff] hover:bg-[#e6edff]' 
                          : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className={`text-[10px] uppercase font-medium mb-1 ${
                      isSelected ? 'text-white/80' : 'text-gray-500'
                    }`}>
                      {day.dayShort}
                    </div>
                    <div className={`text-sm mb-1 ${
                      isSelected 
                        ? 'text-white font-semibold' 
                        : day.isToday 
                          ? 'text-[#1e40af] font-semibold' 
                          : 'text-gray-700'
                    }`}>
                      {day.dayNumber}
                    </div>
                    {dayEvents.length > 0 && (
                      <div className="flex justify-center">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          isSelected ? 'bg-white/80' : 'bg-[#1e40af]'
                        }`}></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Events for selected day - Desktop app stijl evenementenrooster */}
            <div className="p-3">
              {isEventsLoading ? (
                <div className="h-24 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : selectedDateEvents.length === 0 ? (
                <div className="h-24 flex flex-col items-center justify-center py-3">
                  <div className="p-1.5 bg-[#f7f9fc] text-[#1e40af] mb-2 border border-[#e5e7eb] rounded-sm">
                    <Calendar className="h-4 w-4 opacity-70" />
                  </div>
                  <p className="text-xs text-gray-500">Geen evenementen op deze dag</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 text-[10px] h-6 border-[#e5e7eb] text-gray-600 hover:bg-gray-50 rounded-sm" 
                    onClick={navigateToCalendar}
                  >
                    Evenement plannen
                  </Button>
                </div>
              ) : (
                <div>
                  <div className="space-y-2">
                    {selectedDateEvents.map((event, index) => {
                      const getEventTypeColor = (type: string) => {
                        switch(type) {
                          case 'class': return 'bg-blue-100 text-blue-800 border-blue-200';
                          case 'exam': return 'bg-red-100 text-red-800 border-red-200';
                          case 'holiday': return 'bg-green-100 text-green-800 border-green-200';
                          case 'event': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
                          default: return 'bg-gray-100 text-gray-800 border-gray-200';
                        }
                      };

                      const getEventTypeLabel = (type: string) => {
                        switch(type) {
                          case 'class': return 'Les';
                          case 'exam': return 'Examen';
                          case 'holiday': return 'Vakantie';
                          case 'event': return 'Evenement';
                          default: return 'Onbekend';
                        }
                      };

                      return (
                        <div key={index} className="bg-white border border-[#e5e7eb] rounded-sm p-3 hover:shadow-sm transition-shadow">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium border ${getEventTypeColor(event.type)}`}>
                                  {getEventTypeLabel(event.type)}
                                </span>
                                <span className="text-xs font-medium text-gray-900">{event.title || event.courseName}</span>
                              </div>
                              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  <span>{format(parseISO(event.date), 'EEEE d MMMM', { locale: nl })}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  <span>{event.startTime} - {event.endTime}</span>
                                </div>
                              </div>
                              {event.location && (
                                <div className="mt-1 text-[10px] text-gray-500">
                                  📍 {event.location}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  {selectedDateEvents.length > 3 && (
                    <div className="pt-2 text-center border-t border-[#e5e7eb]">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] h-6 px-2 rounded-sm text-gray-500 hover:bg-gray-100"
                        onClick={navigateToCalendar}
                      >
                        Alle evenementen bekijken
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}