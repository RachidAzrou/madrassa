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

      {/* Stats Overview - met dezelfde stijl als in Students.tsx */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <Users className="h-20 w-20 text-sky-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Totaal studenten</h3>
          <p className="text-2xl font-bold text-sky-700">{stats.totalStudents}</p>
          <div className="flex justify-between mt-2 text-xs text-sky-600">
            <span>Actieve studenten</span>
            <span>Ingeschreven</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <GraduationCap className="h-20 w-20 text-sky-500" />
          </div>
          <div className="flex justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Vakken</h3>
              <p className="text-2xl font-bold text-sky-700">{stats.programs}</p>
            </div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-sky-600">
            <span>Actieve vakken</span>
            <span>Curriculum</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <School className="h-20 w-20 text-sky-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Klassen</h3>
          <p className="text-2xl font-bold text-sky-700">{stats.studentGroups}</p>
          <div className="flex justify-between mt-2 text-xs text-sky-600">
            <span>Actieve klassen</span>
            <span>Studiegroepen</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <User className="h-20 w-20 text-sky-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Docenten</h3>
          <p className="text-2xl font-bold text-sky-700">{stats.totalTeachers}</p>
          <div className="flex justify-between mt-2 text-xs text-sky-600">
            <span>Actieve docenten</span>
            <span>Personeelsleden</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
        {/* Studenten per klas grafiek - Links (4 kolommen) */}
        <div className="bg-gradient-to-br from-white to-sky-50/30 rounded-xl shadow-md border border-sky-200 p-5 lg:col-span-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-sky-700" />
              <h3 className="text-lg font-semibold text-sky-800">Studenten per klas</h3>
            </div>
            <Button variant="outline" size="sm" className="border-sky-200 text-sky-700 hover:bg-sky-50" asChild>
              <div onClick={() => setLocation('/student-groups')}>Details bekijken</div>
            </Button>
          </div>
          
          {/* Fetch studentGroups data */}
          {(() => {
            // We gebruiken de student-groups API om de data op te halen
            const { data: studentGroupsData = [], isLoading: isGroupsLoading } = useQuery({
              queryKey: ['/api/student-groups'],
              staleTime: 60000,
            });
            
            // We gebruiken de students API om alle studenten op te halen
            const { data: allStudents = [], isLoading: isAllStudentsLoading } = useQuery({
              queryKey: ['/api/students'],
              staleTime: 60000,
            });
            
            // Interface voor studentengroep
            interface StudentGroup {
              id: number;
              name: string;
              // andere velden...
            }
            
            // Interface voor student-groep enrollments
            interface StudentGroupEnrollment {
              id: number;
              studentId: number;
              studentGroupId: number;
              // andere velden...
            }
            
            // Haal groepsinschrijvingen op
            const { data: groupEnrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
              queryKey: ['/api/student-group-enrollments'],
              staleTime: 60000,
            });
            
            // Tel het aantal studenten per groep
            const studentCountsPerGroup = (studentGroupsData as StudentGroup[]).map((group) => {
              const count = (groupEnrollments as StudentGroupEnrollment[]).filter(
                enrollment => enrollment.studentGroupId === group.id
              ).length;
              
              return {
                name: group.name,
                count: count
              };
            });
            
            // Voeg dummy data toe als er geen echte data is
            const chartData = studentCountsPerGroup.length > 0 ? studentCountsPerGroup : [
              { name: "Klas 1", count: 0 },
              { name: "Klas 2", count: 0 },
              { name: "Klas 3", count: 0 }
            ];
            
            // Bereken de maximumwaarde voor het schalen van de grafiek
            const maxCount = Math.max(...chartData.map(item => item.count), 1);
            
            return (
              <div>
                {isGroupsLoading || isAllStudentsLoading || isEnrollmentsLoading ? (
                  <div className="h-48 flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-48 flex items-center justify-center text-gray-500">
                    Geen klasgegevens beschikbaar
                  </div>
                ) : (
                  <div className="h-48 relative">
                    <div className="flex justify-between items-end h-40 pt-4">
                      {chartData.map((item, index) => (
                        <div key={index} className="flex flex-col items-center">
                          <div className="bg-gradient-to-t from-sky-600 to-sky-400 rounded-t shadow-md transition-all duration-500 ease-out px-2 md:px-6 relative group">
                            <div 
                              className="absolute inset-0 bg-white opacity-0 group-hover:opacity-20 transition-opacity duration-300"
                            ></div>
                            <div
                              className="absolute bottom-full mb-2 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            >
                              {item.count} studenten
                            </div>
                            <div
                              style={{ 
                                height: `${Math.max(30, (item.count / maxCount) * 130)}px`
                              }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-2 max-w-[80px] text-center truncate" title={item.name}>
                            {item.name}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>

        {/* Recent Students - Rechts (3 kolommen) */}
        <div className="bg-gradient-to-br from-white to-sky-50/30 rounded-xl shadow-md border border-sky-200 p-5 lg:col-span-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-sky-700" />
              <h3 className="text-lg font-semibold text-sky-800">Recente Studenten</h3>
            </div>
            <Button variant="outline" size="sm" className="border-sky-200 text-sky-700 hover:bg-sky-50" asChild>
              <div onClick={navigateToStudents}>Bekijk alle</div>
            </Button>
          </div>
          
          {isStudentsLoading ? (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : recentStudents.length === 0 ? (
            <p className="text-center py-4 text-gray-500">Geen recente studenten gevonden</p>
          ) : (
            <div className="space-y-3">
              {recentStudents.slice(0, 4).map((student: Student) => (
                <div key={student.id} className="flex items-center p-2 hover:bg-sky-50/50 rounded-md transition-colors duration-200">
                  <Avatar className="h-9 w-9 border border-sky-200">
                    <AvatarFallback className="bg-gradient-to-br from-sky-50 to-sky-100 text-sky-700">
                      {student.firstName?.[0]}{student.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-3 flex-grow">
                    <p className="text-sm font-medium text-gray-800">{student.firstName} {student.lastName}</p>
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
        <div className="bg-gradient-to-br from-white to-sky-50/30 rounded-xl shadow-md border border-sky-200 p-5 lg:col-span-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-sky-700" />
              <h3 className="text-lg font-semibold text-sky-800">Lesrooster Deze Week</h3>
            </div>
            <Button variant="outline" size="sm" className="border-sky-200 text-sky-700 hover:bg-sky-50" asChild>
              <div onClick={navigateToCalendar}>Bekijk volledige planning</div>
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 bg-white rounded-md p-2 mb-3 shadow-sm">
            {weekdays.map((day, index) => (
              <div 
                key={index} 
                className={`text-center p-2 ${day.isToday ? 'bg-sky-50 rounded-md' : ''}`}
              >
                <p className="text-xs font-medium text-sky-800">{day.dayShort}</p>
                <p className={`text-sm mt-1 ${day.isToday ? 'font-bold text-sky-700' : 'text-gray-600'}`}>{day.dayNumber}</p>
              </div>
            ))}
          </div>
          
          {/* Lessen voor deze week */}
          {isLessonsLoading ? (
            <div className="flex justify-center p-4">
              <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : currentWeekLessons.length === 0 ? (
            <div className="text-center py-4 space-y-2">
              <p className="text-gray-500">Geen lessen gevonden voor deze week</p>
              <Button variant="outline" size="sm" className="border-sky-200 text-sky-700 hover:bg-sky-50" asChild>
                <div onClick={() => setLocation('/lessons/new')}>Les toevoegen</div>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentWeekLessons.slice(0, 5).map((lesson: Lesson, index: number) => (
                <div key={index} className="flex items-center p-3 hover:bg-sky-50/50 rounded-md border border-sky-100 shadow-sm transition-colors duration-200">
                  <div className="bg-gradient-to-br from-sky-50 to-sky-100 p-2 rounded-md border border-sky-200 shadow-sm">
                    <Clock className="h-5 w-5 text-sky-700" />
                  </div>
                  <div className="ml-3 flex-grow">
                    <p className="text-sm font-medium text-gray-800">{lesson.title || 'Les ' + (index + 1)}</p>
                    <p className="text-xs text-gray-500">
                      {lesson.date ? format(parseISO(lesson.date), 'EEEE d MMMM', { locale: nl }) : ''} 
                      {lesson.startTime && lesson.endTime ? ` • ${lesson.startTime} - ${lesson.endTime}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center bg-sky-50 px-2 py-1 rounded-md border border-sky-100">
                    <BookText className="h-4 w-4 text-sky-600 mr-1" />
                    <span className="text-sm text-sky-700">{lesson.courseName || 'Onbekende cursus'}</span>
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
