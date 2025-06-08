import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Users,
  BookOpen,
  UserCheck,
  Calendar,
  MessageCircle,
  GraduationCap,
  ClipboardList
} from "lucide-react";

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
      {/* Header - Admin Style */}
      <div className="border-b border-[#e5e7eb] pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
            <p className="text-gray-600 mt-1">Overzicht van je schoolactiviteiten</p>
          </div>
        </div>
      </div>

      {/* Stats Grid - Admin Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Mijn Klas</CardTitle>
            <div className="p-2 bg-[#eff6ff] rounded-lg">
              <Users className="h-4 w-4 text-[#1e40af]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1e40af]">{stats.myClass}</div>
            <p className="text-xs text-gray-600 mt-1">
              Huidige klas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Mijn Vakken</CardTitle>
            <div className="p-2 bg-[#f0fdf4] rounded-lg">
              <BookOpen className="h-4 w-4 text-[#16a34a]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#16a34a]">{stats.totalSubjects}</div>
            <p className="text-xs text-gray-600 mt-1">
              Actieve vakken
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Aanwezigheid</CardTitle>
            <div className="p-2 bg-[#fef3c7] rounded-lg">
              <UserCheck className="h-4 w-4 text-[#d97706]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#d97706]">{stats.attendanceRate}%</div>
            <p className="text-xs text-gray-600 mt-1">
              Dit schooljaar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Berichten</CardTitle>
            <div className="p-2 bg-[#f5f3ff] rounded-lg">
              <MessageCircle className="h-4 w-4 text-[#7c3aed]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#7c3aed]">{stats.unreadMessages}</div>
            <p className="text-xs text-gray-600 mt-1">
              Ongelezen berichten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Two Column Layout - Admin Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Lessons */}
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <Calendar className="h-5 w-5 mr-2 text-[#1e40af]" />
              Komende Lessen
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {upcomingLessons?.lessons?.length ? (
              <div className="space-y-3">
                {upcomingLessons.lessons.slice(0, 5).map((lesson: any) => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{lesson.subject}</p>
                      <p className="text-sm text-gray-600">{lesson.teacher}</p>
                      <p className="text-xs text-gray-500">{lesson.room}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-[#1e40af]">{lesson.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Geen komende lessen</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <GraduationCap className="h-5 w-5 mr-2 text-[#1e40af]" />
              Recente Cijfers
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentGrades?.grades?.length ? (
              <div className="space-y-3">
                {recentGrades.grades.slice(0, 5).map((grade: any) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{grade.subject}</p>
                      <p className="text-sm text-gray-600">{grade.description}</p>
                      <p className="text-xs text-gray-500">{grade.date}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        parseFloat(grade.grade) >= 7.0 
                          ? 'bg-green-100 text-green-800'
                          : parseFloat(grade.grade) >= 5.5
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {grade.grade}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">Geen recente cijfers</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Admin Style */}
      <Card className="bg-white border border-[#e5e7eb] shadow-sm">
        <CardHeader className="border-b border-[#e5e7eb] pb-4">
          <CardTitle className="flex items-center text-[#1e40af] font-semibold">
            <ClipboardList className="h-5 w-5 mr-2 text-[#1e40af]" />
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