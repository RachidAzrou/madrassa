import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { 
  Users, 
  BookOpen, 
  GraduationCap, 
  Calendar,
  LayoutDashboard
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
  const navigateToCalendar = () => setLocation('/calendar');
  const navigateToStudents = () => setLocation('/students');
  const navigateToCourses = () => setLocation('/courses');
  const navigateToTeachers = () => setLocation('/teachers');
  const navigateToGroups = () => setLocation('/student-groups');

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
          
          {/* Studentengroepen data visualisatie - Taartdiagram */}
          {isGroupsLoading || isEnrollmentsLoading ? (
            <div className="h-56 sm:h-64 flex items-center justify-center">
              <div className="w-6 h-6 sm:w-8 sm:h-8 border-3 sm:border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-56 sm:h-64 flex items-center justify-center text-gray-500 text-sm">
              Geen klasgegevens beschikbaar
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
              {/* Taartdiagram met CSS */}
              <div className="flex justify-center items-center">
                <div className="relative w-44 h-44">
                  {/* Cirkeldiagram maken met conic-gradient */}
                  <div 
                    className="w-full h-full rounded-full shadow-md" 
                    style={{
                      background: `conic-gradient(
                        ${chartData.map((item, index, array) => {
                          // Bereken de kleuren en percentages voor de gradient
                          const percentage = item.count / chartData.reduce((sum, i) => sum + i.count, 0) * 100;
                          const startPercentage = array.slice(0, index).reduce((sum, i) => 
                            sum + (i.count / chartData.reduce((s, i) => s + i.count, 0) * 100), 0);
                          
                          // Kies kleur op basis van vulgraad
                          let color;
                          if (item.percentageFilled < 0.5) color = '#4ade80'; // light green
                          else if (item.percentageFilled < 0.75) color = '#fbbf24'; // light amber 
                          else color = '#f87171'; // light red
                          
                          return `${color} ${startPercentage}% ${startPercentage + percentage}%`;
                        }).join(', ')
                      }`
                    }}
                  >
                    {/* Centrale cirkel voor donut effect */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-lg font-bold text-gray-800">
                            {chartData.reduce((sum, item) => sum + item.count, 0)}
                          </div>
                          <div className="text-xs text-gray-500">studenten</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Legenda en details */}
              <div className="flex flex-col justify-center">
                <h4 className="text-sm font-medium text-gray-600 mb-3">Verdeling per klas</h4>
                <div className="space-y-3">
                  {chartData.map((item, index) => {
                    // Kies kleur op basis van vulgraad
                    const dotColor = item.percentageFilled < 0.5 
                      ? 'bg-green-400' 
                      : item.percentageFilled < 0.75 
                        ? 'bg-amber-400' 
                        : 'bg-red-400';
                        
                    const textColor = item.percentageFilled < 0.5 
                      ? 'text-green-500' 
                      : item.percentageFilled < 0.75 
                        ? 'text-amber-500' 
                        : 'text-red-500';
                        
                    return (
                      <div key={index} className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 ${dotColor} rounded-full`}></div>
                          <span className="text-sm text-gray-700">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${textColor}`}>{item.count}/{item.maxCapacity}</span>
                          <span className="text-xs text-gray-500 hidden group-hover:inline-block">
                            ({Math.round(item.percentageFilled * 100)}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
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
                <div className="h-32 flex items-center justify-center text-gray-500 text-sm">
                  Geen lessen gepland voor deze week
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