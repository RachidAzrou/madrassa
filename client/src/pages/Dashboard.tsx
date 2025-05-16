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
  ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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

  // Fetch studenten per klas data
  const { data: studentsByGroupData = [], isLoading: isStudentsByGroupLoading } = useQuery({
    queryKey: ['/api/dashboard/students-by-group'],
    staleTime: 60000,
  });

  // Fetch recent students data
  const { data: recentStudentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['/api/dashboard/recent-students'],
    staleTime: 60000,
  });
  
  // Fetch lessons data
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

  interface Lesson {
    id: number;
    title: string;
    date: string;
    startTime: string;
    endTime: string;
    courseName: string;
  }

  interface GroupStudentCount {
    groupId: number;
    groupName: string;
    studentCount: number;
  }

  // Bereid data voor met veilige defaults als de data nog niet geladen is
  const stats = {
    totalStudents: (statsData as StatsData)?.totalStudents || 0,
    activeCourses: (statsData as StatsData)?.activeCourses || 0,
    programs: (statsData as StatsData)?.activePrograms || 0, 
    totalTeachers: (statsData as StatsData)?.totalTeachers || 0,
    studentGroups: (statsData as StatsData)?.studentGroups || 0
  };

  const recentStudents = (recentStudentsData as Student[]) || [];
  const studentsByGroup = (studentsByGroupData as GroupStudentCount[]) || [];
  
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
    <div className="container p-4 md:p-6 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-gray-200 pb-4">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-full bg-sky-500 flex items-center justify-center">
            <BarChart3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-black">my</span>
              <span className="text-sky-700">Madrassa</span>
              <span className="mx-2 text-gray-400">|</span>
              <span className="text-sky-700">Dashboard</span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">Overzicht van de belangrijkste statistieken en activiteiten</p>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Studenten statistiek */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <Users className="h-20 w-20 text-sky-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Totaal studenten</h3>
          <p className="text-2xl font-bold text-sky-700">{stats.totalStudents}</p>
          <div className="mt-3 flex justify-end">
            <Button 
              variant="link" 
              className="px-0 h-auto text-sky-600 hover:underline"
              onClick={navigateToStudents}
            >
              Bekijk alle studenten
            </Button>
          </div>
        </div>
        
        {/* Vakken statistiek */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <GraduationCap className="h-20 w-20 text-sky-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Totaal vakken</h3>
          <p className="text-2xl font-bold text-sky-700">{stats.programs}</p>
          <div className="mt-3 flex justify-end">
            <Button 
              variant="link" 
              className="px-0 h-auto text-sky-600 hover:underline"
              onClick={() => setLocation('/programs')}
            >
              Bekijk alle vakken
            </Button>
          </div>
        </div>
        
        {/* Klassen statistiek */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <School className="h-20 w-20 text-sky-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Totaal klassen</h3>
          <p className="text-2xl font-bold text-sky-700">{stats.studentGroups}</p>
          <div className="mt-3 flex justify-end">
            <Button 
              variant="link" 
              className="px-0 h-auto text-sky-600 hover:underline"
              onClick={navigateToGroups}
            >
              Bekijk alle klassen
            </Button>
          </div>
        </div>
        
        {/* Docenten statistiek */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <BookOpen className="h-20 w-20 text-sky-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Totaal docenten</h3>
          <p className="text-2xl font-bold text-sky-700">{stats.totalTeachers}</p>
          <div className="mt-3 flex justify-end">
            <Button 
              variant="link" 
              className="px-0 h-auto text-sky-600 hover:underline"
              onClick={navigateToTeachers}
            >
              Bekijk alle docenten
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Studenten per klas grafiek - Links */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-sky-700">
              Studenten per Klas
            </h2>
            <Button 
              variant="link" 
              className="px-0 h-auto text-sky-600 hover:underline"
              onClick={navigateToGroups}
            >
              Bekijk alle klassen
            </Button>
          </div>
          
          {isStudentsByGroupLoading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : studentsByGroup.length === 0 ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-gray-500">Geen klasgegevens beschikbaar</p>
            </div>
          ) : (
            <div className="h-64 flex items-end justify-between pt-4 pb-8">
              {studentsByGroup.map((group: GroupStudentCount, index: number) => {
                const maxStudents = Math.max(...studentsByGroup.map(g => g.studentCount));
                const heightPercentage = maxStudents > 0 
                  ? (group.studentCount / maxStudents) * 100 
                  : 0;
                
                return (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="w-16 bg-sky-500 rounded-t transition-all duration-500 ease-out"
                      style={{ 
                        height: `${Math.max(5, heightPercentage)}%` 
                      }}
                    ></div>
                    <p className="text-xs text-center text-gray-600 mt-2 w-20 truncate" title={group.groupName}>
                      {group.groupName}
                    </p>
                    <p className="text-xs font-bold text-sky-700">
                      {group.studentCount}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Students - Rechts */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-sky-700">
              Recente Studenten
            </h2>
            <Button 
              variant="link" 
              className="px-0 h-auto text-sky-600 hover:underline" 
              onClick={navigateToStudents}
            >
              Bekijk alle studenten
            </Button>
          </div>
          
          {isStudentsLoading ? (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : recentStudents.length === 0 ? (
            <p className="text-center py-4 text-gray-500">Geen recente studenten gevonden</p>
          ) : (
            <div className="space-y-3">
              {recentStudents.slice(0, 4).map((student: Student) => (
                <div key={student.id} className="flex items-center p-2 hover:bg-sky-50 rounded-md bg-white/70">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="bg-sky-500 text-white">
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
        </div>
        
        {/* Lesrooster huidige week - Onder */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-sky-700">
              Lesrooster Deze Week
            </h2>
            <Button 
              variant="link" 
              className="px-0 h-auto text-sky-600 hover:underline"
              onClick={navigateToCalendar}
            >
              Bekijk volledige planning
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 mb-4">
            {weekdays.map((day, index) => (
              <div 
                key={index} 
                className={`text-center p-2 ${day.isToday ? 'bg-sky-100 rounded-md' : ''}`}
              >
                <p className="text-xs font-medium">{day.dayShort}</p>
                <p className={`text-sm mt-1 ${day.isToday ? 'font-bold text-sky-700' : ''}`}>{day.dayNumber}</p>
              </div>
            ))}
          </div>
          <Separator className="my-4 bg-sky-200/50" />
          
          {/* Lessen voor deze week */}
          {isLessonsLoading ? (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : currentWeekLessons.length === 0 ? (
            <p className="text-center py-4 text-gray-500">Geen lessen gevonden voor deze week</p>
          ) : (
            <div className="space-y-3">
              {currentWeekLessons.slice(0, 5).map((lesson: Lesson, index: number) => (
                <div key={index} className="flex items-center p-3 hover:bg-sky-50 rounded-md border border-sky-200 bg-white/70">
                  <div className="bg-sky-100 p-2 rounded-md">
                    <Clock className="h-5 w-5 text-sky-500" />
                  </div>
                  <div className="ml-3 flex-grow">
                    <p className="text-sm font-medium">{lesson.title || 'Les ' + (index + 1)}</p>
                    <p className="text-xs text-gray-500">
                      {lesson.date ? format(parseISO(lesson.date), 'EEEE d MMMM', { locale: nl }) : ''} 
                      {lesson.startTime && lesson.endTime ? ` • ${lesson.startTime} - ${lesson.endTime}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}