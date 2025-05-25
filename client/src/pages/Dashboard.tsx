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
  ArrowRight
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
    <div className="bg-gray-50 min-h-screen">
      {/* Desktop-like header bar */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 flex items-center justify-center rounded bg-[#1e40af] text-white">
              <LayoutDashboard className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-medium text-gray-900">Dashboard</h1>
              <p className="text-sm text-gray-500">Overzicht van de belangrijkste statistieken en activiteiten</p>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main content area */}
      <div className="px-6 py-6 max-w-7xl mx-auto">

      {/* Stats Overview - Zakelijke desktop-stijl kaarten */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-7">
        {/* Studenten kaart */}
        <div className="bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-[#1e40af]" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-500">Actief</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Studenten</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalStudents}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-[#1e40af] w-full justify-start px-0 hover:bg-transparent hover:text-blue-700" 
                onClick={navigateToStudents}
              >
                Studenten bekijken
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Klassen kaart */}
        <div className="bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                <ChalkBoard className="h-5 w-5 text-[#1e40af]" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-500">Actief</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Klassen</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.studentGroups}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-[#1e40af] w-full justify-start px-0 hover:bg-transparent hover:text-blue-700" 
                onClick={navigateToGroups}
              >
                Klassen bekijken
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Docenten kaart */}
        <div className="bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                <GraduationCap className="h-5 w-5 text-[#1e40af]" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-500">Actief</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Docenten</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalTeachers}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-[#1e40af] w-full justify-start px-0 hover:bg-transparent hover:text-blue-700" 
                onClick={navigateToTeachers}
              >
                Docenten bekijken
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
        
        {/* Vakken kaart */}
        <div className="bg-white border border-gray-200 rounded shadow-sm hover:shadow-md transition-shadow">
          <div className="p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded bg-gray-100 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-[#1e40af]" />
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-500">Actief</span>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Vakken</h3>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeCourses}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-100">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-[#1e40af] w-full justify-start px-0 hover:bg-transparent hover:text-blue-700" 
                onClick={navigateToCourses}
              >
                Vakken bekijken
                <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main dashboard content - 2 columns op desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Linker kolom - 2/3 breedte */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Studenten per klas grafiek - Professional desktop styling */}
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                  <PieChart className="h-4 w-4 text-[#1e40af]" />
                </div>
                <h3 className="text-sm font-medium text-gray-700">Klasbezetting</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-[#1e40af]"
                onClick={navigateToGroups}
              >
                Alle klassen
              </Button>
            </div>
            
            {/* Studentengroepen data visualisatie - Horizontale staafdiagram */}
            {isGroupsLoading || isEnrollmentsLoading || isStatsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <div className="w-8 h-8 border-3 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : stats.totalStudents === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center p-6">
                <div className="p-4 rounded bg-gray-50 text-[#1e40af] mb-3">
                  <Users className="h-8 w-8 opacity-60" />
                </div>
                <p className="text-sm font-medium text-gray-500">Geen studenten beschikbaar</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 text-xs border-[#1e40af] text-[#1e40af] hover:bg-[#1e40af]/5" 
                  onClick={navigateToStudents}
                >
                  Voeg studenten toe
                </Button>
              </div>
            ) : (studentGroupsData as any[]).length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center p-6">
                <div className="p-4 rounded bg-gray-50 text-[#1e40af] mb-3">
                  <ChalkBoard className="h-8 w-8 opacity-60" />
                </div>
                <p className="text-sm font-medium text-gray-500">Geen klassen beschikbaar</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-3 text-xs border-[#1e40af] text-[#1e40af] hover:bg-[#1e40af]/5" 
                  onClick={navigateToGroups}
                >
                  Maak een klas aan
                </Button>
              </div>
            ) : (
              <div className="p-5">
                <div className="grid grid-cols-12 mb-3 px-1">
                  <div className="col-span-3 text-xs text-gray-500 font-medium">Klas</div>
                  <div className="col-span-7 text-xs text-gray-500 font-medium">Bezetting</div>
                  <div className="col-span-2 text-xs text-gray-500 font-medium text-right">Aantal</div>
                </div>

                <div className="space-y-4">
                  {chartData.map((item, index) => {
                    // Gebruik de huisstijl kleuren
                    const barColor = item.percentageFilled < 0.5 
                      ? 'bg-blue-400' 
                      : item.percentageFilled < 0.75 
                        ? 'bg-[#1e3a8a]' 
                        : 'bg-[#1e40af]';
                        
                    const textColor = item.percentageFilled < 0.5 
                      ? 'text-blue-500'
                      : item.percentageFilled < 0.75 
                        ? 'text-[#1e3a8a]'
                        : 'text-[#1e40af]';
                    
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
                          <div className="col-span-7 h-8 bg-gray-100 rounded relative overflow-hidden">
                            {/* Voortgangsbalk */}
                            <div 
                              className={`h-full ${barColor} transition-all duration-700 ease-out shadow-sm rounded-l flex items-center justify-end px-2`}
                              style={{ width: barWidth }}
                            >
                              {item.percentageFilled > 0.25 && (
                                <span className="text-white text-xs font-medium">
                                  {Math.round(item.percentageFilled * 100)}%
                                </span>
                              )}
                            </div>

                            {/* Info popup on hover */}
                            <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded whitespace-nowrap transition-opacity z-10">
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
                <div className="flex justify-end mt-5 text-xs text-gray-500 gap-3 border-t border-gray-100 pt-3">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-400 rounded-sm mr-1"></div>
                    <span>&lt;50%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#1e3a8a] rounded-sm mr-1"></div>
                    <span>50-75%</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-[#1e40af] rounded-sm mr-1"></div>
                    <span>&gt;75%</span>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Weekkalender - Professional desktop styling */}
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded bg-gray-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-[#1e40af]" />
                </div>
                <h3 className="text-sm font-medium text-gray-700">Weekplanning</h3>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-xs text-[#1e40af]"
                onClick={navigateToCalendar}
              >
                Volledige kalender
              </Button>
            </div>
            
            {/* Week view */}
            <div className="p-4">
              <div className="grid grid-cols-7 gap-1 mb-4">
                {weekdays.map((day, index) => (
                  <div 
                    key={index}
                    className={`text-center p-2 ${day.isToday ? 'bg-[#1e40af]/10 text-[#1e40af] font-medium rounded' : ''}`}
                  >
                    <div className="text-xs uppercase tracking-wide mb-1 text-gray-500">{day.dayShort}</div>
                    <div className={`text-lg ${day.isToday ? 'text-[#1e40af] font-semibold' : 'text-gray-700'}`}>{day.dayNumber}</div>
                  </div>
                ))}
              </div>
              
              {/* Lessons for this week */}
              <div className="mt-3">
                {isLessonsLoading ? (
                  <div className="h-32 flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : currentWeekLessons.length === 0 ? (
                  <div className="h-32 flex flex-col items-center justify-center p-4 bg-gray-50 rounded">
                    <div className="p-3 rounded bg-white text-[#1e40af] mb-3 border border-gray-200">
                      <Calendar className="h-6 w-6 opacity-60" />
                    </div>
                    <p className="text-sm font-medium text-gray-500">Geen lessen gepland deze week</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-3 text-xs border-[#1e40af] text-[#1e40af] hover:bg-[#1e40af]/5" 
                      onClick={navigateToCalendar}
                    >
                      Plan lessen
                    </Button>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {currentWeekLessons.slice(0, 5).map((lesson, index) => (
                      <div key={index} className="py-2 first:pt-0 last:pb-0">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className="h-8 w-8 mt-1 rounded bg-gray-100 flex items-center justify-center flex-shrink-0">
                              <Clock className="h-4 w-4 text-[#1e40af]" />
                            </div>
                            <div>
                              <h4 className="text-sm font-medium text-gray-800">{lesson.title || lesson.courseName}</h4>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {format(parseISO(lesson.date), 'EEEE d MMMM', { locale: nl })}
                              </p>
                            </div>
                          </div>
                          <div className="text-xs font-medium text-gray-500">
                            {lesson.startTime} - {lesson.endTime}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {currentWeekLessons.length > 5 && (
                      <div className="pt-3 text-center">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="text-xs text-[#1e40af]"
                          onClick={navigateToCalendar}
                        >
                          Bekijk alle {currentWeekLessons.length} lessen
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Rechter kolom - 1/3 breedte */}
        <div className="space-y-6">
          {/* Snelle acties - Professional desktop styling */}
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700">Snelle acties</h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left text-xs h-10 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
                  onClick={navigateToStudents}
                >
                  <Users className="h-4 w-4 mr-2 text-gray-500" />
                  Student toevoegen
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left text-xs h-10 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
                  onClick={navigateToTeachers}
                >
                  <GraduationCap className="h-4 w-4 mr-2 text-gray-500" />
                  Docent toevoegen
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left text-xs h-10 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
                  onClick={navigateToGroups}
                >
                  <ChalkBoard className="h-4 w-4 mr-2 text-gray-500" />
                  Klas aanmaken
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left text-xs h-10 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
                  onClick={navigateToCourses}
                >
                  <BookOpen className="h-4 w-4 mr-2 text-gray-500" />
                  Vak toevoegen
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full justify-start text-left text-xs h-10 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-900"
                  onClick={navigateToCalendar}
                >
                  <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                  Les plannen
                </Button>
              </div>
            </div>
          </div>
          
          {/* Systeem status - Professional desktop styling */}
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h3 className="text-sm font-medium text-gray-700">Systeem status</h3>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-700">Database verbinding</span>
                  </div>
                  <span className="text-xs font-medium text-green-600">Actief</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-700">API services</span>
                  </div>
                  <span className="text-xs font-medium text-green-600">Operationeel</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-700">Opslagruimte</span>
                  </div>
                  <span className="text-xs font-medium text-green-600">64% beschikbaar</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-xs text-gray-700">Laatste backup</span>
                  </div>
                  <span className="text-xs font-medium text-green-600">Vandaag 03:00</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  Systeem versie: <span className="font-medium">v2.4.1</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Laatste update: <span className="font-medium">{format(new Date(), 'd MMMM yyyy', { locale: nl })}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  );
}