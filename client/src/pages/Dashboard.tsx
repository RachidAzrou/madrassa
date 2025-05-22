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
  BookText,
  LayoutDashboard
} from 'lucide-react';

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
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
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

  // Actieve cursussen ophalen
  const { data: activeCourses = [], isLoading: isActiveCoursesLoading } = useQuery({
    queryKey: ['/api/dashboard/active-courses'],
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

  interface Course {
    id: number;
    name: string;
    code: string;
    description: string;
    credits: number;
    programId: number | null;
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
    const statusLower = status.toLowerCase();
    if (statusLower === 'active' || statusLower === 'actief') {
      return 'bg-green-100 text-green-800';
    } else if (statusLower === 'pending' || statusLower === 'in afwachting') {
      return 'bg-yellow-100 text-yellow-800';
    } else if (statusLower === 'inactive' || statusLower === 'inactief') {
      return 'bg-red-100 text-red-800';
    } else if (statusLower === 'graduated' || statusLower === 'afgestudeerd') {
      return 'bg-blue-100 text-blue-800';
    } else {
      return 'bg-gray-100 text-gray-800';
    }
  };

  const translateStatus = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'active' || statusLower === 'actief') {
      return 'Actief';
    } else if (statusLower === 'pending' || statusLower === 'in afwachting') {
      return 'In afwachting';
    } else if (statusLower === 'inactive' || statusLower === 'inactief') {
      return 'Inactief';
    } else if (statusLower === 'graduated' || statusLower === 'afgestudeerd') {
      return 'Afgestudeerd';
    } else {
      return status.charAt(0).toUpperCase() + status.slice(1);
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-2 sm:mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-1.5 sm:p-2">
              <LayoutDashboard className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <h1 className="text-xl sm:text-2xl font-semibold text-[#1e3a8a]">Dashboard</h1>
          </div>
          <p className="text-gray-500 text-xs sm:text-sm mt-1 ml-9 sm:ml-11">
            Overzicht van de belangrijkste statistieken en activiteiten
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-3 sm:p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <Users className="h-16 sm:h-20 w-16 sm:w-20 text-sky-500" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Studenten</h3>
          <p className="text-xl sm:text-2xl font-bold text-sky-700">{stats.totalStudents}</p>
        </div>
        
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-3 sm:p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <ChalkBoard className="h-16 sm:h-20 w-16 sm:w-20 text-sky-500" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Klassen</h3>
          <p className="text-xl sm:text-2xl font-bold text-sky-700">{stats.studentGroups}</p>
        </div>
        
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-3 sm:p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <GraduationCap className="h-16 sm:h-20 w-16 sm:w-20 text-sky-500" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Docenten</h3>
          <p className="text-xl sm:text-2xl font-bold text-sky-700">{stats.totalTeachers}</p>
        </div>
        
        {/* Vakken widget */}
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-3 sm:p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <BookOpen className="h-16 sm:h-20 w-16 sm:w-20 text-sky-500" />
          </div>
          <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Vakken</h3>
          <p className="text-xl sm:text-2xl font-bold text-sky-700">{stats.activeCourses}</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6">
        {/* Studenten per klas grafiek */}
        <div className="bg-gradient-to-br from-white to-sky-50/30 rounded-xl shadow-md border border-sky-200 p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex items-center gap-2">
              <ChalkBoard className="h-4 w-4 sm:h-5 sm:w-5 text-[#1e3a8a]" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Studenten per klas</h3>
            </div>

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
              maxCapacity?: number;
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
            
            // Tel het aantal studenten per groep en houd ook de maximale capaciteit bij
            const studentCountsPerGroup = (studentGroupsData as StudentGroup[]).map((group) => {
              const count = (groupEnrollments as StudentGroupEnrollment[]).filter(
                enrollment => enrollment.studentGroupId === group.id
              ).length;
              
              return {
                name: group.name,
                count: count,
                maxCapacity: group.maxCapacity || 25, // Default naar 25 als er geen maxCapacity is
                percentageFilled: count / (group.maxCapacity || 25) // Bereken bezettingspercentage
              };
            });
            
            // Voeg dummy data toe als er geen echte data is
            const chartData = studentCountsPerGroup.length > 0 ? studentCountsPerGroup : [
              { name: "Klas 1", count: 0, maxCapacity: 25, percentageFilled: 0 },
              { name: "Klas 2", count: 0, maxCapacity: 25, percentageFilled: 0 },
              { name: "Klas 3", count: 0, maxCapacity: 25, percentageFilled: 0 }
            ];
            
            // Bereken de maximumwaarde voor het schalen van de grafiek
            // Nu niet meer nodig omdat we percentages gebruiken, maar behouden voor compatibiliteit
            const maxCount = Math.max(...chartData.map(item => item.count), 1);
            
            return (
              <div>
                {isGroupsLoading || isAllStudentsLoading || isEnrollmentsLoading ? (
                  <div className="h-32 sm:h-48 flex items-center justify-center">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : chartData.length === 0 ? (
                  <div className="h-32 sm:h-48 flex items-center justify-center text-gray-500 text-sm">
                    Geen klasgegevens beschikbaar
                  </div>
                ) : (
                  <div className="h-56 sm:h-64 relative">
                    <div className="flex flex-col sm:flex-row h-full w-full">
                      {/* Piechart */}
                      <div className="h-40 sm:h-full w-full sm:w-1/2 relative flex items-center justify-center">
                        <div className="relative h-32 w-32 sm:h-44 sm:w-44">
                          {/* Donut chart met animatie */}
                          <svg viewBox="0 0 100 100" className="transform -rotate-90 w-full h-full">
                            {/* Achtergrond cirkel */}
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="45" 
                              fill="transparent" 
                              stroke="#f3f4f6" 
                              strokeWidth="10"
                            />
                            
                            {/* Kleurrijke segmenten */}
                            {(() => {
                              // Bereken totale studenten
                              const totalStudents = chartData.reduce((sum, item) => sum + item.count, 0);
                              
                              // Als er geen studenten zijn, toon geen segmenten
                              if (totalStudents === 0) {
                                return (
                                  <circle 
                                    cx="50" 
                                    cy="50" 
                                    r="45" 
                                    fill="transparent" 
                                    stroke="#e5e7eb" 
                                    strokeWidth="10"
                                  />
                                );
                              }
                              
                              // Definieer kleuren voor de segmenten
                              const colors = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#2563eb'];
                              
                              // Sterk startpunt op 0
                              let cumulativePercent = 0;
                              
                              return chartData.map((item, index) => {
                                // Sla segmenten over die 0 studenten hebben
                                if (item.count === 0) return null;
                                
                                // Bereken percentage van het totaal
                                const percent = (item.count / totalStudents) * 100;
                                
                                // Bereken de circumference (omtrek) van de cirkel
                                const circumference = 2 * Math.PI * 45;
                                
                                // Bereken stroke-dasharray en stroke-dashoffset
                                const strokeDasharray = circumference;
                                const strokeDashoffset = circumference - (percent / 100) * circumference;
                                
                                // Bereken de startpositie voor dit segment
                                const startPercent = cumulativePercent;
                                cumulativePercent += percent;
                                
                                // Bereken start positie langs de omtrek
                                const startOffset = (startPercent / 100) * circumference;
                                
                                return (
                                  <circle 
                                    key={index}
                                    cx="50" 
                                    cy="50" 
                                    r="45" 
                                    fill="transparent" 
                                    stroke={colors[index % colors.length]} 
                                    strokeWidth="10"
                                    strokeDasharray={`${circumference}`}
                                    strokeDashoffset={strokeDashoffset}
                                    style={{
                                      transform: `rotate(${startPercent * 3.6}deg)`,
                                      transformOrigin: 'center',
                                      transition: 'all 1s ease-out'
                                    }}
                                    className="hover:opacity-80 transition-opacity"
                                  />
                                );
                              });
                            })()}
                            
                            {/* Binnenste cirkel voor donut effect */}
                            <circle 
                              cx="50" 
                              cy="50" 
                              r="35" 
                              fill="white" 
                              className="drop-shadow-sm" 
                            />
                          </svg>
                          
                          {/* Centrale tekst */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                            <span className="text-xs sm:text-sm text-gray-500">Totaal</span>
                            <span className="text-lg sm:text-xl font-bold text-gray-800">
                              {chartData.reduce((sum, item) => sum + item.count, 0)}
                            </span>
                            <span className="text-xs text-gray-500">studenten</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Legenda */}
                      <div className="h-full w-full sm:w-1/2 pt-2 sm:pt-4 flex flex-col justify-center">
                        <div className="space-y-2 px-4">
                          {chartData.map((item, index) => {
                            // Definieer kleuren voor de legenda items
                            const colors = ['#1e3a8a', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#2563eb'];
                            
                            // Bereken totaal voor percentages
                            const totalStudents = chartData.reduce((sum, item) => sum + item.count, 0);
                            const percent = totalStudents === 0 ? 0 : Math.round((item.count / totalStudents) * 100);
                            
                            return (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center">
                                  <div 
                                    className="w-3 h-3 sm:w-4 sm:h-4 rounded-sm mr-2" 
                                    style={{ backgroundColor: colors[index % colors.length] }}
                                  ></div>
                                  <span className="text-xs sm:text-sm text-gray-600 font-medium">{item.name}</span>
                                </div>
                                <div className="text-xs sm:text-sm text-gray-500">
                                  <span className="font-medium">{item.count}</span>
                                  <span className="text-gray-400 ml-1">({percent}%)</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="text-xs text-gray-500 mt-3 px-4">
                          * Percentage vertegenwoordigt het aandeel studenten per klas ten opzichte van het totaal
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>


        
        {/* Lesrooster huidige week */}
        <div className="bg-gradient-to-br from-white to-sky-50/30 rounded-xl shadow-md border border-sky-200 p-3 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3 sm:mb-4 gap-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#1e3a8a]" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Lesrooster Deze Week</h3>
            </div>
            <Button variant="outline" size="sm" className="border-sky-200 text-sky-700 hover:bg-sky-50 w-full sm:w-auto text-xs sm:text-sm" asChild>
              <div onClick={navigateToCalendar}>Bekijk volledige planning</div>
            </Button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 bg-white rounded-md p-1 sm:p-2 mb-3 shadow-sm">
            {weekdays.map((day, index) => (
              <div 
                key={index} 
                className={`text-center p-1 sm:p-2 ${day.isToday ? 'bg-sky-50 rounded-md' : ''}`}
              >
                <p className="text-xs font-medium text-sky-800">{day.dayShort}</p>
                <p className={`text-xs sm:text-sm mt-0.5 sm:mt-1 ${day.isToday ? 'font-bold text-sky-700' : 'text-gray-600'}`}>{day.dayNumber}</p>
              </div>
            ))}
          </div>
          
          {/* Lessen voor deze week */}
          {isLessonsLoading ? (
            <div className="flex justify-center p-3 sm:p-4">
              <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : currentWeekLessons.length === 0 ? (
            <div className="text-center py-3 sm:py-4">
              <p className="text-gray-500 text-sm">Geen lessen gevonden voor deze week</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {currentWeekLessons.slice(0, 5).map((lesson: Lesson, index: number) => (
                <div key={index} className="flex flex-col sm:flex-row sm:items-center p-2 sm:p-3 hover:bg-sky-50/50 rounded-md border border-sky-100 shadow-sm transition-colors duration-200 gap-2">
                  <div className="flex items-center">
                    <div className="bg-gradient-to-br from-sky-50 to-sky-100 p-1.5 sm:p-2 rounded-md border border-sky-200 shadow-sm">
                      <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-[#1e3a8a]" />
                    </div>
                    <div className="ml-2 sm:ml-3 flex-grow">
                      <p className="text-xs sm:text-sm font-medium text-gray-800">{lesson.title || 'Les ' + (index + 1)}</p>
                      <p className="text-xs text-gray-500">
                        {lesson.date ? format(parseISO(lesson.date), 'EEEE d MMMM', { locale: nl }) : ''} 
                        {lesson.startTime && lesson.endTime ? ` • ${lesson.startTime} - ${lesson.endTime}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center bg-sky-50 px-2 py-1 rounded-md border border-sky-100 text-xs sm:text-sm mt-1 sm:mt-0 self-start sm:self-auto">
                    <BookText className="h-3 w-3 sm:h-4 sm:w-4 text-[#1e3a8a] mr-1" />
                    <span className="text-sky-700 truncate max-w-[120px] sm:max-w-none">{lesson.courseName || 'Onbekende cursus'}</span>
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
