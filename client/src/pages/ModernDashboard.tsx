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
  ChevronRight,
  TrendingUp,
  Award,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { format, startOfWeek, endOfWeek, addDays, parseISO, isToday, isWithinInterval, isSameDay } from 'date-fns';
import { nl } from 'date-fns/locale';

// Custom ChalkBoard icon
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

// Helper function to get current week days
function getCurrentWeekDays() {
  const now = new Date();
  const start = startOfWeek(now, { weekStartsOn: 1 }); // Week starts on Monday
  
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

// Interfaces for typing
interface StatsData {
  totalStudents: number;
  activeCourses: number;
  activePrograms: number;
  totalTeachers: number;
  studentGroups: number;
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

export default function ModernDashboard() {
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

  // Fetch academic years data
  const { data: academicYearsData = [], isLoading: isAcademicYearsLoading } = useQuery({
    queryKey: ['/api/academic-years'],
    staleTime: 60000,
  });

  // Fetch holidays data
  const { data: holidaysData = [], isLoading: isHolidaysLoading } = useQuery({
    queryKey: ['/api/holidays'],
    staleTime: 60000,
  });

  const events = calendarData?.events || [];

  // Prepare data with safe defaults
  const stats = {
    totalStudents: (statsData as StatsData)?.totalStudents || 0,
    activeCourses: (statsData as StatsData)?.activeCourses || 0,
    programs: (statsData as StatsData)?.activePrograms || 0, 
    totalTeachers: (statsData as StatsData)?.totalTeachers || 0,
    studentGroups: (statsData as StatsData)?.studentGroups || 0,
  };
  
  // Calculate student counts per group
  const studentCountsPerGroup = (studentGroupsData as StudentGroup[]).map((group) => {
    const count = (studentGroupEnrollmentsData as StudentGroupEnrollment[]).filter(
      enrollment => enrollment.studentGroupId === group.id
    ).length;
    
    return {
      id: group.id,
      name: group.name,
      count: count,
      maxCapacity: group.maxCapacity || 30,
      percentage: group.maxCapacity ? Math.round((count / group.maxCapacity) * 100) : 0
    };
  });

  // Filter events for today and this week
  const todayEvents = events.filter(event => {
    if (!event.date) return false;
    const eventDate = parseISO(event.date);
    return isSameDay(eventDate, new Date());
  });

  const thisWeekEvents = events.filter(event => {
    if (!event.date) return false;
    const eventDate = parseISO(event.date);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    return isWithinInterval(eventDate, { start: weekStart, end: weekEnd });
  });
  
  // Navigation functions
  const navigateToCalendar = () => setLocation('/calendar?view=week');
  const navigateToStudents = () => setLocation('/students');
  const navigateToCourses = () => setLocation('/courses');
  const navigateToTeachers = () => setLocation('/teachers');
  const navigateToGroups = () => setLocation('/student-groups');

  return (
    <div className="space-y-8">
      {/* Modern Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
          <p className="text-lg text-slate-600">
            Overzicht van uw onderwijsinstelling - {new Date().toLocaleDateString('nl-NL', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="mt-4 lg:mt-0 flex gap-3">
          <Button 
            onClick={navigateToCalendar}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-xl shadow-lg shadow-blue-600/25 transition-all duration-200"
          >
            <Calendar className="mr-2 h-5 w-5" />
            Kalender
          </Button>
        </div>
      </div>

      {/* Modern Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Students Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg shadow-blue-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-700">Studenten</p>
                <p className="text-3xl font-bold text-blue-900">{stats.totalStudents}</p>
                <p className="text-xs text-blue-600 mt-1">Actieve studenten</p>
              </div>
              <div className="h-12 w-12 bg-blue-600 rounded-xl flex items-center justify-center">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Classes Card */}
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg shadow-green-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-700">Klassen</p>
                <p className="text-3xl font-bold text-green-900">{stats.studentGroups}</p>
                <p className="text-xs text-green-600 mt-1">Actieve klassen</p>
              </div>
              <div className="h-12 w-12 bg-green-600 rounded-xl flex items-center justify-center">
                <ChalkBoard className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Teachers Card */}
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg shadow-purple-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-700">Docenten</p>
                <p className="text-3xl font-bold text-purple-900">{stats.totalTeachers}</p>
                <p className="text-xs text-purple-600 mt-1">Actieve docenten</p>
              </div>
              <div className="h-12 w-12 bg-purple-600 rounded-xl flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Subjects Card */}
        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg shadow-orange-100/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-700">Vakken</p>
                <p className="text-3xl font-bold text-orange-900">{stats.activeCourses}</p>
                <p className="text-xs text-orange-600 mt-1">Actieve vakken</p>
              </div>
              <div className="h-12 w-12 bg-orange-600 rounded-xl flex items-center justify-center">
                <BookOpen className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Class Overview */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Class Occupancy Chart */}
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl font-semibold text-slate-900">Klasbezetting</CardTitle>
                  <CardDescription className="text-slate-600">Overzicht van studentenaantallen per klas</CardDescription>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-700"
                  onClick={navigateToGroups}
                >
                  Alle klassen
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {isGroupsLoading || isEnrollmentsLoading || isStatsLoading ? (
                <div className="h-48 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {studentCountsPerGroup.slice(0, 6).map((group) => (
                    <div key={group.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                          <span className="font-medium text-slate-900">{group.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-600">{group.count}/{group.maxCapacity}</span>
                          <Badge variant={group.percentage > 90 ? 'destructive' : group.percentage > 70 ? 'default' : 'secondary'}>
                            {group.percentage}%
                          </Badge>
                        </div>
                      </div>
                      <Progress value={group.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-slate-900">Snelle acties</CardTitle>
              <CardDescription className="text-slate-600">Veel gebruikte functies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 border-slate-200 hover:bg-slate-50 hover:border-blue-300"
                  onClick={navigateToStudents}
                >
                  <Users className="h-6 w-6 text-slate-600" />
                  <span className="text-sm">Studenten</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 border-slate-200 hover:bg-slate-50 hover:border-blue-300"
                  onClick={navigateToTeachers}
                >
                  <GraduationCap className="h-6 w-6 text-slate-600" />
                  <span className="text-sm">Docenten</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 border-slate-200 hover:bg-slate-50 hover:border-blue-300"
                  onClick={navigateToCourses}
                >
                  <BookOpen className="h-6 w-6 text-slate-600" />
                  <span className="text-sm">Vakken</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2 border-slate-200 hover:bg-slate-50 hover:border-blue-300"
                  onClick={navigateToCalendar}
                >
                  <Calendar className="h-6 w-6 text-slate-600" />
                  <span className="text-sm">Kalender</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          
          {/* Today's Events */}
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Vandaag</CardTitle>
              <CardDescription className="text-slate-600">
                {format(new Date(), 'EEEE d MMMM', { locale: nl })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isEventsLoading ? (
                <div className="h-24 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : todayEvents.length > 0 ? (
                <div className="space-y-3">
                  {todayEvents.slice(0, 3).map((event, index) => (
                    <div key={index} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-slate-900 text-sm">{event.title}</h4>
                          <p className="text-xs text-slate-600 mt-1">
                            {event.startTime} - {event.endTime}
                          </p>
                        </div>
                        <Clock className="h-4 w-4 text-slate-400" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6">
                  <Calendar className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500">Geen evenementen vandaag</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* This Week Overview */}
          <Card className="shadow-xl border-slate-200">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold text-slate-900">Deze week</CardTitle>
              <CardDescription className="text-slate-600">Overzicht komende dagen</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {weekdays.slice(0, 5).map((day, index) => (
                  <div key={index} className={`p-3 rounded-lg border transition-colors ${
                    day.isToday 
                      ? 'bg-blue-50 border-blue-200' 
                      : 'bg-slate-50 border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <span className={`text-sm font-medium ${
                          day.isToday ? 'text-blue-900' : 'text-slate-900'
                        }`}>
                          {day.dayShort} {day.dayNumber}
                        </span>
                        {day.isToday && (
                          <Badge variant="default" className="ml-2 text-xs">Vandaag</Badge>
                        )}
                      </div>
                      <span className="text-xs text-slate-500">
                        {thisWeekEvents.filter(event => 
                          event.date && isSameDay(parseISO(event.date), day.date)
                        ).length} events
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full mt-4 text-blue-600 hover:text-blue-700"
                onClick={navigateToCalendar}
              >
                Volledige kalender
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}