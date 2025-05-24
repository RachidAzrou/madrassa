import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  LayoutDashboard,
  Building
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfWeek, endOfWeek, addDays, parseISO, isToday, isWithinInterval } from 'date-fns';
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
  const { data: groupEnrollments = [], isLoading: isEnrollmentsLoading } = useQuery({
    queryKey: ['/api/student-group-enrollments'],
    staleTime: 60000,
  });
  
  // Fetch lessons data
  const { data: lessonsData = [], isLoading: isLessonsLoading } = useQuery({
    queryKey: ['/api/lessons'],
    staleTime: 60000,
  });

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
    const count = (groupEnrollments as StudentGroupEnrollment[]).filter(
      enrollment => enrollment.studentGroupId === group.id
    ).length;
    
    return {
      name: group.name,
      count: count,
      maxCapacity: group.maxCapacity || 25, // Default to 25 if no maxCapacity
      percentageFilled: count / (group.maxCapacity || 25) // Calculate fill percentage
    };
  });
  
  // Add default data if no real data exists
  const chartData = studentCountsPerGroup.length > 0 ? studentCountsPerGroup : [
    { name: "Klas 1", count: 0, maxCapacity: 25, percentageFilled: 0 },
    { name: "Klas 2", count: 0, maxCapacity: 25, percentageFilled: 0 },
    { name: "Klas 3", count: 0, maxCapacity: 25, percentageFilled: 0 }
  ];
  
  // Filter lessons for the current week
  const currentWeekLessons = (lessonsData as Lesson[]).filter((lesson) => {
    if (!lesson.date) return false;
    const lessonDate = parseISO(lesson.date);
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 });
    return isWithinInterval(lessonDate, { start: weekStart, end: weekEnd });
  });
  
  // Navigatiefuncties
  const navigateToCalendar = () => setLocation('/calendar?view=week');
  const navigateToStudents = () => setLocation('/students');
  const navigateToCourses = () => setLocation('/courses');
  const navigateToTeachers = () => setLocation('/teachers');
  const navigateToGroups = () => setLocation('/student-groups');

  return (
    <div className="p-2 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
              <LayoutDashboard className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-base text-gray-500 mt-1">Overzicht van de belangrijkste statistieken en activiteiten</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
        <div className="bg-[#1e3a8a] text-white rounded-xl shadow-lg p-4 sm:p-6 relative overflow-hidden group hover:bg-[#1e3a8a]/90 transition-all">
          <div className="absolute right-0 top-0 opacity-20 group-hover:opacity-25 transition-opacity">
            <Users className="h-24 sm:h-28 w-24 sm:w-28 text-white" />
          </div>
          <h3 className="text-sm sm:text-base font-medium text-white/80 mb-2">Studenten</h3>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight">{stats.totalStudents}</p>
        </div>
        
        <div className="bg-[#1e3a8a] text-white rounded-xl shadow-lg p-4 sm:p-6 relative overflow-hidden group hover:bg-[#1e3a8a]/90 transition-all">
          <div className="absolute right-0 top-0 opacity-20 group-hover:opacity-25 transition-opacity">
            <ChalkBoard className="h-24 sm:h-28 w-24 sm:w-28 text-white" />
          </div>
          <h3 className="text-sm sm:text-base font-medium text-white/80 mb-2">Klassen</h3>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight">{stats.studentGroups}</p>
        </div>
        
        <div className="bg-[#1e3a8a] text-white rounded-xl shadow-lg p-4 sm:p-6 relative overflow-hidden group hover:bg-[#1e3a8a]/90 transition-all">
          <div className="absolute right-0 top-0 opacity-20 group-hover:opacity-25 transition-opacity">
            <GraduationCap className="h-24 sm:h-28 w-24 sm:w-28 text-white" />
          </div>
          <h3 className="text-sm sm:text-base font-medium text-white/80 mb-2">Docenten</h3>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight">{stats.totalTeachers}</p>
        </div>
        
        {/* Vakken widget */}
        <div className="bg-[#1e3a8a] text-white rounded-xl shadow-lg p-4 sm:p-6 relative overflow-hidden group hover:bg-[#1e3a8a]/90 transition-all">
          <div className="absolute right-0 top-0 opacity-20 group-hover:opacity-25 transition-opacity">
            <BookOpen className="h-24 sm:h-28 w-24 sm:w-28 text-white" />
          </div>
          <h3 className="text-sm sm:text-base font-medium text-white/80 mb-2">Vakken</h3>
          <p className="text-3xl sm:text-4xl font-bold tracking-tight">{stats.activeCourses}</p>
        </div>
      </div>



      {/* NOODKNOP VOOR LOKALEN TOEGANG */}
      <div className="mb-6 p-5 bg-red-600 rounded-lg border-4 border-black shadow-lg animate-pulse">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Building className="h-8 w-8 mr-3 text-white" />
            <h3 className="font-bold text-white text-xl">LOKALEN BEHEER - DIRECTE TOEGANG</h3>
          </div>
          <Button 
            variant="default"
            size="lg"
            onClick={() => window.location.href = "/rooms"}
            className="bg-white text-red-700 hover:bg-gray-100 font-bold border-2 border-black"
          >
            KLIK HIER VOOR LOKALEN
          </Button>
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
          
          {/* Studentengroepen data visualisatie - Horizontale staafdiagram */}
          {isGroupsLoading || isEnrollmentsLoading || isStatsLoading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : stats.totalStudents === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-500">
              <div className="text-[#1e3a8a] mb-2">
                <Users className="h-12 w-12 mx-auto opacity-30" />
              </div>
              <p className="text-sm font-medium">Geen studenten beschikbaar</p>
            </div>
          ) : (studentGroupsData as any[]).length === 0 ? (
            <div className="h-48 flex flex-col items-center justify-center text-gray-500">
              <div className="text-[#1e3a8a] mb-2">
                <ChalkBoard className="h-12 w-12 mx-auto opacity-30" />
              </div>
              <p className="text-sm font-medium">Geen klassen beschikbaar</p>
            </div>
          ) : (
            <div className="p-4">
              <div className="grid grid-cols-12 mb-2">
                <div className="col-span-3 text-xs text-gray-500 font-medium">Klas</div>
                <div className="col-span-7 text-xs text-gray-500 font-medium">Bezetting</div>
                <div className="col-span-2 text-xs text-gray-500 font-medium text-right">Aantal</div>
              </div>

              <div className="space-y-4">
                {chartData.map((item, index) => {
                  // Kies kleur op basis van vulgraad - gebruik de app kleuren
                  const barColor = item.percentageFilled < 0.5 
                    ? 'bg-sky-400' // lichtblauw voor weinig bezette klassen
                    : item.percentageFilled < 0.75 
                      ? 'bg-sky-500' // medium blauw voor gemiddeld bezette klassen 
                      : 'bg-blue-700'; // donkerblauw voor volle klassen
                      
                  const textColor = item.percentageFilled < 0.5 
                    ? 'text-sky-500' // lichtblauw
                    : item.percentageFilled < 0.75 
                      ? 'text-sky-600' // medium blauw
                      : 'text-blue-800'; // donkerblauw
                  
                  // Bereken breedte voor de balk
                  const barWidth = `${Math.max(5, Math.min(100, item.percentageFilled * 100))}%`;
                  
                  return (
                    <div key={index} className="group">
                      <div className="grid grid-cols-12 items-center gap-2">
                        {/* Klasnaam */}
                        <div className="col-span-3 font-medium text-gray-700 truncate" title={item.name}>
                          {item.name}
                        </div>
                        
                        {/* Staafdiagram */}
                        <div className="col-span-7 h-8 bg-gray-100 rounded-lg relative overflow-hidden">
                          {/* Voortgangsbalk */}
                          <div 
                            className={`h-full ${barColor} transition-all duration-1000 ease-out shadow-sm rounded-l-lg flex items-center justify-end px-2`}
                            style={{ width: barWidth }}
                          >
                            {item.percentageFilled > 0.25 && (
                              <span className="text-white text-xs font-medium">
                                {Math.round(item.percentageFilled * 100)}%
                              </span>
                            )}
                          </div>

                          {/* Info popup on hover */}
                          <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity z-10">
                            {item.count} van {item.maxCapacity} plekken bezet
                          </div>
                        </div>
                        
                        {/* Aantal studenten */}
                        <div className={`col-span-2 text-right ${textColor} font-semibold`}>
                          {item.count}/{item.maxCapacity}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Legenda */}
              <div className="flex justify-end mt-4 text-xs text-gray-500 gap-3">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-sky-400 rounded-sm mr-1"></div>
                  <span>&lt;50%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-sky-500 rounded-sm mr-1"></div>
                  <span>50-75%</span>
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-700 rounded-sm mr-1"></div>
                  <span>&gt;75%</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Lesrooster voor deze week */}
        <div className="bg-gradient-to-br from-white to-sky-50/30 rounded-xl shadow-md border border-sky-200 p-3 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 text-[#1e3a8a]" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">Lesrooster deze week</h3>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs sm:text-sm text-[#1e3a8a] hover:text-blue-700"
              onClick={navigateToCalendar}
            >
              Volledig rooster bekijken
            </Button>
          </div>
          
          {isLessonsLoading ? (
            <div className="h-32 sm:h-48 flex items-center justify-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {currentWeekLessons.length === 0 ? (
                <div className="h-32 flex flex-col items-center justify-center text-gray-500">
                  <div className="text-[#1e3a8a] mb-2">
                    <Calendar className="h-12 w-12 mx-auto opacity-30" />
                  </div>
                  <p className="text-sm font-medium">Geen lessen gepland voor deze week</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentWeekLessons.slice(0, 5).map((lesson, index) => (
                    <div 
                      key={index} 
                      className="p-3 sm:p-4 bg-white rounded-lg border border-gray-200 hover:border-blue-200 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-700">{lesson.title}</h4>
                          <p className="text-xs sm:text-sm text-gray-500 mt-1">{lesson.courseName}</p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs sm:text-sm font-medium text-gray-700">
                            {lesson.date && format(parseISO(lesson.date), 'EEEE d MMMM', { locale: nl })}
                          </div>
                          <div className="text-xs text-gray-500 mt-0.5">
                            {lesson.startTime} - {lesson.endTime}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {currentWeekLessons.length > 5 && (
                    <div className="text-center mt-2">
                      <Button 
                        variant="link" 
                        className="text-xs sm:text-sm text-[#1e3a8a]"
                        onClick={navigateToCalendar}
                      >
                        {currentWeekLessons.length - 5} meer lessen bekijken
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}