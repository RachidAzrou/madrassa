import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Users, 
  BookOpen, 
  School, 
  GraduationCap, 
  Calendar, 
  BarChart3, 
  Clock, 
  CheckCircle, 
  User, 
  BookText
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format, startOfWeek, endOfWeek, addDays, parseISO, isToday, isWithinInterval } from 'date-fns';
import { nl } from 'date-fns/locale';

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

export default function Dashboard() {
  const [_, setLocation] = useLocation();
  const weekdays = getCurrentWeekDays();

  // Fetch stats data
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 60000,
  });

  // Fetch enrollment data
  const { data: enrollmentData, isLoading: isEnrollmentLoading } = useQuery({
    queryKey: ['/api/dashboard/enrollment'],
    staleTime: 60000,
  });

  // Fetch events data
  const { data: eventsData, isLoading: isEventsLoading } = useQuery({
    queryKey: ['/api/dashboard/events'],
    staleTime: 60000,
  });

  // Fetch recent students data
  const { data: recentStudentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['/api/dashboard/recent-students'],
    staleTime: 60000,
  });
  
  // Fetch lessons data (nieuw)
  const { data: lessonsData = [], isLoading: isLessonsLoading } = useQuery({
    queryKey: ['/api/lessons'],
    staleTime: 60000,
  });

  // Interfaces voor typering
  interface StatsData {
    totalStudents: number;
    activeCourses: number;
    activePrograms: number;
    totalTeachers: number;
    studentGroups: number;
  }

  interface Student {
    id: number;
    studentId: string;
    firstName: string;
    lastName: string;
    program?: string;
    status: string;
    enrollmentDate: string;
  }

  interface Event {
    id: number;
    title: string;
    date: string;
    location: string;
    type: string;
  }

  interface Lesson {
    id: number;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    courseName: string;
  }

  interface EnrollmentPoint {
    month: string;
    count: number;
  }

  // Bereid data voor met veilige defaults als de data nog niet geladen is
  const stats = {
    totalStudents: (statsData as StatsData)?.totalStudents || 0,
    activeCourses: (statsData as StatsData)?.activeCourses || 0,
    programs: (statsData as StatsData)?.activePrograms || 0, 
    totalTeachers: (statsData as StatsData)?.totalTeachers || 0,
    studentGroups: (statsData as StatsData)?.studentGroups || 0,
    attendanceRate: 95 // Vaste waarde voor aanwezigheidsgraad
  };

  const enrollmentTrend = (enrollmentData as { enrollmentTrend: EnrollmentPoint[] })?.enrollmentTrend || [];
  const events = (eventsData as Event[]) || [];
  const recentStudents = (recentStudentsData as Student[]) || [];
  
  // Lessen voor de huidige week
  const currentWeekLessons = (lessonsData as Lesson[]).filter((lesson) => {
    if (!lesson.date) return false;
    const lessonDate = parseISO(lesson.date);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    return isWithinInterval(lessonDate, { start: weekStart, end: weekEnd });
  });

  // Navigatiefuncties
  const navigateToCalendar = () => setLocation('/calendar');
  const navigateToStudents = () => setLocation('/students');
  const navigateToCourses = () => setLocation('/courses');
  const navigateToTeachers = () => setLocation('/teachers');
  const navigateToGroups = () => setLocation('/student-groups');

  // Helper functies voor statusklassen
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'active':
      case 'actief':
        return 'bg-green-100 text-green-800';
      case 'pending':
      case 'in afwachting':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
      case 'inactief':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const translateStatus = (status: string) => {
    switch (status) {
      case 'active': return 'Actief';
      case 'pending': return 'In afwachting';
      case 'inactive': return 'Inactief';
      case 'graduated': return 'Afgestudeerd';
      default: return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overzicht van de belangrijkste statistieken en activiteiten</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Totaal Studenten</p>
            <h2 className="text-2xl font-bold mt-1">{stats.totalStudents}</h2>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <BookOpen className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Actieve Cursussen</p>
            <h2 className="text-2xl font-bold mt-1">{stats.activeCourses}</h2>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <GraduationCap className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Vakken</p>
            <h2 className="text-2xl font-bold mt-1">{stats.programs}</h2>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Docenten</p>
            <h2 className="text-2xl font-bold mt-1">{stats.totalTeachers}</h2>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <School className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Klassen</p>
            <h2 className="text-2xl font-bold mt-1">{stats.studentGroups}</h2>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <CheckCircle className="h-5 w-5 text-primary" />
              </div>
            </div>
            <p className="text-sm text-gray-500">Aanwezigheid</p>
            <h2 className="text-2xl font-bold mt-1">{stats.attendanceRate}%</h2>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Inschrijvingstrend Grafiek - Links (4 kolommen) */}
        <Card className="lg:col-span-4">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Inschrijvingstrend</span>
                </div>
              </CardTitle>
              <Button variant="link" className="p-0 h-auto text-sm" asChild>
                <div onClick={() => setLocation('/admissions')}>Details bekijken</div>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isEnrollmentLoading ? (
              <div className="h-48 flex items-center justify-center">
                <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : (
              <div className="h-48 relative">
                <div className="flex justify-between items-end h-40 pt-4">
                  {enrollmentTrend.map((item: EnrollmentPoint, index: number) => (
                    <div key={index} className="flex flex-col items-center">
                      <div 
                        className="w-8 md:w-12 bg-primary rounded-t transition-all duration-500 ease-out"
                        style={{ 
                          height: `${Math.max(8, (item.count / Math.max(...enrollmentTrend.map((d) => d.count))) * 130)}px` 
                        }}
                      ></div>
                      <div className="text-xs text-gray-500 mt-2">{item.month}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Students - Rechts (3 kolommen) */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  <span>Recente Studenten</span>
                </div>
              </CardTitle>
              <Button variant="link" className="p-0 h-auto text-sm" asChild>
                <div onClick={navigateToStudents}>Bekijk alle</div>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isStudentsLoading ? (
              <div className="flex justify-center p-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : recentStudents.length === 0 ? (
              <p className="text-center py-4 text-gray-500">Geen recente studenten gevonden</p>
            ) : (
              <div className="space-y-3">
                {recentStudents.slice(0, 4).map((student: Student) => (
                  <div key={student.id} className="flex items-center p-2 hover:bg-gray-50 rounded-md">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback>
                        {student.firstName?.[0]}{student.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="ml-3 flex-grow">
                      <p className="text-sm font-medium">{student.firstName} {student.lastName}</p>
                      <p className="text-xs text-gray-500">{student.program || 'Geen programma'}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClass(student.status)}`}>
                      {translateStatus(student.status)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Lesrooster huidige week - Onder */}
        <Card className="lg:col-span-7">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>Lesrooster Deze Week</span>
                </div>
              </CardTitle>
              <Button variant="link" className="p-0 h-auto text-sm" asChild>
                <div onClick={navigateToCalendar}>Bekijk volledige planning</div>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {weekdays.map((day, index) => (
                <div 
                  key={index} 
                  className={`text-center p-2 ${day.isToday ? 'bg-primary/10 rounded-md' : ''}`}
                >
                  <p className="text-xs font-medium">{day.dayShort}</p>
                  <p className={`text-sm mt-1 ${day.isToday ? 'font-bold' : ''}`}>{day.dayNumber}</p>
                </div>
              ))}
            </div>
            <Separator className="my-4" />
            
            {/* Lessen voor deze week */}
            {isLessonsLoading ? (
              <div className="flex justify-center p-4">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : currentWeekLessons.length === 0 ? (
              <p className="text-center py-4 text-gray-500">Geen lessen gevonden voor deze week</p>
            ) : (
              <div className="space-y-3">
                {currentWeekLessons.slice(0, 5).map((lesson: any, index: number) => (
                  <div key={index} className="flex items-center p-3 hover:bg-gray-50 rounded-md border border-gray-100">
                    <div className="bg-primary/10 p-2 rounded-md">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="ml-3 flex-grow">
                      <p className="text-sm font-medium">{lesson.title || 'Les ' + (index + 1)}</p>
                      <p className="text-xs text-gray-500">
                        {lesson.date ? format(parseISO(lesson.date), 'EEEE d MMMM', { locale: nl }) : ''} 
                        {lesson.startTime && lesson.endTime ? ` • ${lesson.startTime} - ${lesson.endTime}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <div className="bg-primary/5 p-1 rounded mr-2">
                        <BookText className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{lesson.courseName || 'Onbekende cursus'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
