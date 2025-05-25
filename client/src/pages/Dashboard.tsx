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
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Desktop application header bar - Professionele stijl - Premium variant */}
      <header className="bg-white border-b border-[#e5e7eb] shadow-sm">
        <div className="flex flex-col">
          <div className="bg-[#1e40af] px-6 py-3.5 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <LayoutDashboard className="h-5 w-5 text-white" />
              <h1 className="text-base font-medium text-white tracking-tight">Dashboard</h1>
            </div>
            <div className="text-xs text-white opacity-70 flex items-center">
              <span className="mr-1">Beheer</span>
              <ChevronRight className="h-3 w-3 mx-0.5" />
              <span>Dashboard</span>
            </div>
          </div>
        </div>
      </header>
      
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
            <div className="p-0">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-[#f7f9fc] border-t border-b border-[#e5e7eb]">
                    <th className="py-1.5 px-4 text-left font-medium text-gray-500 w-1/5">Klas</th>
                    <th className="py-1.5 px-4 text-left font-medium text-gray-500 w-3/5">Bezetting</th>
                    <th className="py-1.5 px-4 text-right font-medium text-gray-500 w-1/5">Aantal</th>
                  </tr>
                </thead>
                <tbody>
                  {chartData.map((item, index) => {
                    // Gebruik de huisstijl kleuren
                    const barColor = item.percentageFilled < 0.5 
                      ? 'bg-blue-400' 
                      : item.percentageFilled < 0.75 
                        ? 'bg-[#1e3a8a]' 
                        : 'bg-[#1e40af]';
                    
                    // Bereken breedte voor de balk
                    const barWidth = `${Math.max(3, Math.min(100, item.percentageFilled * 100))}%`;
                    
                    return (
                      <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#f9fafc]'} hover:bg-gray-50`}>
                        <td className="py-1.5 px-4 text-left font-medium text-gray-700">{item.name}</td>
                        <td className="py-1.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-5 bg-[#f0f0f0] rounded-none overflow-hidden relative">
                              <div 
                                className={`absolute top-0 left-0 h-full ${barColor}`} 
                                style={{ width: barWidth }}>
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-500 w-8 text-right">
                              {Math.round(item.percentageFilled * 100)}%
                            </span>
                          </div>
                        </td>
                        <td className="py-1.5 px-4 text-right text-gray-700 font-medium">
                          {item.count}/{item.maxCapacity}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              
              {/* Totalen en legenda (footer) */}
              <div className="flex items-center justify-between px-4 py-2 border-t border-[#e5e7eb] bg-[#f9fafc] text-[10px] text-gray-500">
                <div>
                  Totaal: {stats.totalStudents} studenten verdeeld over {stats.studentGroups} klassen
                </div>
                <div className="flex gap-3">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-blue-400 mr-1"></div>
                    <span>&lt;50%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-[#1e3a8a] mr-1"></div>
                    <span>50-75%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-[#1e40af] mr-1"></div>
                    <span>&gt;75%</span>
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
              {weekdays.map((day, index) => (
                <div 
                  key={index}
                  className={`text-center py-2 ${index < 6 ? 'border-r' : ''} border-[#e5e7eb] ${day.isToday ? 'bg-[#f0f4ff]' : ''}`}
                >
                  <div className="text-[10px] uppercase font-medium mb-1 text-gray-500">{day.dayShort}</div>
                  <div className={`${day.isToday ? 'text-[#1e40af] font-semibold' : 'text-gray-700'} text-sm`}>
                    {day.dayNumber}
                  </div>
                </div>
              ))}
            </div>
            
            {/* Lessons for this week - Desktop app stijl lesrooster */}
            <div>
              {isLessonsLoading ? (
                <div className="h-24 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : currentWeekLessons.length === 0 ? (
                <div className="h-24 flex flex-col items-center justify-center py-3">
                  <div className="p-1.5 bg-[#f7f9fc] text-[#1e40af] mb-2 border border-[#e5e7eb] rounded-sm">
                    <Calendar className="h-4 w-4 opacity-70" />
                  </div>
                  <p className="text-xs text-gray-500">Geen lessen gepland deze week</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2 text-[10px] h-6 border-[#e5e7eb] text-gray-600 hover:bg-gray-50 rounded-sm" 
                    onClick={navigateToCalendar}
                  >
                    Les plannen
                  </Button>
                </div>
              ) : (
                <div>
                  <table className="w-full text-xs border-collapse">
                    <tbody>
                      {currentWeekLessons.slice(0, 5).map((lesson, index) => (
                        <tr key={index} className={`${index % 2 === 0 ? 'bg-white' : 'bg-[#f9fafc]'} hover:bg-gray-50 border-b border-[#e5e7eb] last:border-b-0`}>
                          <td className="py-2 px-3 text-left">
                            <div className="flex items-center">
                              <Clock className="h-3 w-3 text-[#1e40af] mr-2 flex-shrink-0" />
                              <span className="font-medium text-gray-700">{lesson.title || lesson.courseName}</span>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-left text-gray-500">
                            {format(parseISO(lesson.date), 'EEE d MMM', { locale: nl })}
                          </td>
                          <td className="py-2 px-3 text-right whitespace-nowrap text-gray-500">
                            {lesson.startTime} - {lesson.endTime}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  {currentWeekLessons.length > 5 && (
                    <div className="px-3 py-2 text-right bg-[#f9fafc] border-t border-[#e5e7eb]">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-[10px] h-6 px-2 rounded-sm text-gray-500 hover:bg-gray-100"
                        onClick={navigateToCalendar}
                      >
                        {currentWeekLessons.length - 5} meer lessen
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