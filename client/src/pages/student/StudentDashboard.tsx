import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  BookOpen,
  UserCheck,
  Calendar,
  Mail,
  GraduationCap,
  Activity,
  User
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface StudentStats {
  myClass: string;
  totalSubjects: number;
  upcomingLessons: number;
  attendanceRate: number;
  recentGrades: number;
  unreadMessages: number;
}

interface UpcomingLesson {
  id: number;
  subject: string;
  teacher: string;
  time: string;
  room: string;
}

interface RecentGrade {
  id: number;
  subject: string;
  grade: string;
  description: string;
  date: string;
}

interface RecentActivity {
  id: number;
  type: 'grade' | 'attendance' | 'assignment' | 'message';
  description: string;
  timestamp: string;
}

export default function StudentDashboard() {
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<{ stats: StudentStats }>({
    queryKey: ['/api/student/dashboard/stats'],
    staleTime: 30000,
  });

  const { data: upcomingLessons } = useQuery<{ lessons: UpcomingLesson[] }>({
    queryKey: ['/api/student/upcoming-lessons'],
    staleTime: 30000,
  });

  const { data: recentGrades } = useQuery<{ grades: RecentGrade[] }>({
    queryKey: ['/api/student/recent-grades'],
    staleTime: 30000,
  });

  const { data: recentActivity } = useQuery<{ activities: RecentActivity[] }>({
    queryKey: ['/api/student/recent-activity'],
    staleTime: 30000,
  });

  if (statsLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  const stats = dashboardStats?.stats || {
    myClass: 'Klas 6A',
    totalSubjects: 8,
    upcomingLessons: 3,
    attendanceRate: 92,
    recentGrades: 2,
    unreadMessages: 5
  };

  return (
    <div className="space-y-8">
      {/* Enhanced Header - Admin Style */}
      <div className="border-b border-gray-200 pb-8 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600 text-lg">Welkom terug! Hier is je overzicht van vandaag.</p>
          </div>
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 py-2 rounded-lg shadow-sm">
              <div className="text-sm font-medium">Vandaag</div>
              <div className="text-xs opacity-90">{new Date().toLocaleDateString('nl-NL', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-blue-200 rounded-full -mr-10 -mt-10 opacity-50"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-blue-800">Mijn Klas</CardTitle>
            <div className="p-3 bg-blue-500 rounded-xl shadow-md">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-blue-900 mb-1">{stats.myClass}</div>
            <p className="text-sm text-blue-700 font-medium">
              Huidige klas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-green-200 rounded-full -mr-10 -mt-10 opacity-50"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-green-800">Mijn Vakken</CardTitle>
            <div className="p-3 bg-green-500 rounded-xl shadow-md">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-green-900 mb-1">{stats.totalSubjects}</div>
            <p className="text-sm text-green-700 font-medium">
              Actieve vakken
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-amber-200 rounded-full -mr-10 -mt-10 opacity-50"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-amber-800">Aanwezigheid</CardTitle>
            <div className="p-3 bg-amber-500 rounded-xl shadow-md">
              <UserCheck className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-amber-900 mb-1">{stats.attendanceRate}%</div>
            <p className="text-sm text-amber-700 font-medium">
              Dit schooljaar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-purple-200 rounded-full -mr-10 -mt-10 opacity-50"></div>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 relative z-10">
            <CardTitle className="text-sm font-semibold text-purple-800">Berichten</CardTitle>
            <div className="p-3 bg-purple-500 rounded-xl shadow-md">
              <Mail className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-3xl font-bold text-purple-900 mb-1">{stats.unreadMessages}</div>
            <p className="text-sm text-purple-700 font-medium">
              Ongelezen berichten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout - Admin Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Enhanced Upcoming Lessons */}
        <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b border-gray-100 pb-4 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="flex items-center text-blue-800 font-bold text-lg">
              <div className="p-2 bg-blue-500 rounded-lg mr-3 shadow-md">
                <Calendar className="h-5 w-5 text-white" />
              </div>
              Komende Lessen
              <span className="ml-auto bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                {upcomingLessons?.lessons?.length || 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {upcomingLessons?.lessons?.length ? (
              <div className="space-y-4">
                {upcomingLessons.lessons.slice(0, 5).map((lesson: any) => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-blue-100 hover:shadow-md transition-all duration-200">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg">{lesson.subject}</div>
                      <div className="text-sm text-gray-600 flex items-center mt-1">
                        <User className="h-4 w-4 mr-1" />
                        {lesson.teacher}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">{lesson.room}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{lesson.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="bg-gray-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-lg font-medium">Geen komende lessen vandaag</p>
                <p className="text-sm text-gray-400">Geniet van je vrije tijd!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Enhanced Recent Grades */}
        <Card className="bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardHeader className="border-b border-gray-100 pb-4 bg-gradient-to-r from-green-50 to-emerald-50">
            <CardTitle className="flex items-center text-green-800 font-bold text-lg">
              <div className="p-2 bg-green-500 rounded-lg mr-3 shadow-md">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              Recente Cijfers
              <span className="ml-auto bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                {recentGrades?.grades?.length || 0}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {recentGrades?.grades?.length ? (
              <div className="space-y-4">
                {recentGrades.grades.slice(0, 5).map((grade: any) => (
                  <div key={grade.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-green-50 rounded-xl border border-green-100 hover:shadow-md transition-all duration-200">
                    <div className="flex-1">
                      <div className="font-bold text-gray-900 text-lg">{grade.subject}</div>
                      <div className="text-sm text-gray-600 mt-1">{grade.description}</div>
                      <div className="text-xs text-gray-500 mt-1 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {grade.date}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-bold shadow-sm ${
                        parseFloat(grade.grade) >= 7.0 
                          ? 'bg-green-500 text-white'
                          : parseFloat(grade.grade) >= 5.5
                          ? 'bg-amber-500 text-white'
                          : 'bg-red-500 text-white'
                      }`}>
                        {grade.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <div className="bg-gray-100 p-4 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                  <GraduationCap className="h-10 w-10 text-gray-400" />
                </div>
                <p className="text-lg font-medium">Geen recente cijfers</p>
                <p className="text-sm text-gray-400">Cijfers verschijnen hier zodra ze beschikbaar zijn</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Admin Style */}
      <Card className="bg-white border border-[#e5e7eb] shadow-sm">
        <CardHeader className="border-b border-[#e5e7eb] pb-4">
          <CardTitle className="flex items-center text-[#1e40af] font-semibold">
            <Activity className="h-5 w-5 mr-2 text-[#1e40af]" />
            Recente Activiteit
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          {recentActivity?.activities?.length ? (
            <div className="space-y-4">
              {recentActivity.activities.slice(0, 8).map((activity: any) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                  <div className={`flex-shrink-0 w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'grade' ? 'bg-green-400' :
                    activity.type === 'attendance' ? 'bg-blue-400' :
                    activity.type === 'assignment' ? 'bg-yellow-400' :
                    'bg-purple-400'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Geen recente activiteit</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}