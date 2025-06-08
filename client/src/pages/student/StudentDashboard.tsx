import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  BookOpen,
  Calendar,
  UserCheck,
  Clock,
  Bell,
  ChevronRight,
  GraduationCap,
  FileText,
  MessageCircle
} from "lucide-react";
import { Link } from "wouter";

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
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: StudentStats }>({
    queryKey: ['/api/student/dashboard/stats'],
    retry: false,
  });

  const { data: upcomingLessons } = useQuery<{ lessons: UpcomingLesson[] }>({
    queryKey: ['/api/student/upcoming-lessons'],
    retry: false,
  });

  const { data: recentGrades } = useQuery<{ grades: RecentGrade[] }>({
    queryKey: ['/api/student/recent-grades'],
    retry: false,
  });

  const { data: recentActivity } = useQuery<{ activities: RecentActivity[] }>({
    queryKey: ['/api/student/recent-activity'],
    retry: false,
  });

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dashboardStats = stats?.stats || {
    myClass: 'Onbekend',
    totalSubjects: 0,
    upcomingLessons: 0,
    attendanceRate: 0,
    recentGrades: 0,
    unreadMessages: 0
  };

  return (
    <div className="space-y-6">
      {/* Header - Admin Style */}
      <div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welkom terug, {user?.firstName}!
            </h1>
            <p className="text-gray-600">
              Hier is een overzicht van je schoolactiviteiten
            </p>
          </div>

        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">Mijn Klas</CardTitle>
            <div className="p-3 bg-blue-500 rounded-xl shadow-sm">
              <Users className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{dashboardStats.myClass}</div>
            <p className="text-xs text-blue-600 mt-1">
              Huidige klas
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-sm hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-green-700">Mijn Vakken</CardTitle>
            <div className="p-3 bg-green-500 rounded-xl shadow-sm">
              <BookOpen className="h-5 w-5 text-white" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{dashboardStats.totalSubjects}</div>
            <p className="text-xs text-green-600 mt-1">
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
            <div className="text-2xl font-bold text-[#d97706]">{dashboardStats.attendanceRate}%</div>
            <p className="text-xs text-gray-600 mt-1">
              Dit schooljaar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Komende Lessen</CardTitle>
            <div className="p-2 bg-[#fdf2f8] rounded-lg">
              <Calendar className="h-4 w-4 text-[#be185d]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#be185d]">{dashboardStats.upcomingLessons}</div>
            <p className="text-xs text-gray-600 mt-1">
              Vandaag en morgen
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Nieuwe Cijfers</CardTitle>
            <div className="p-2 bg-[#f3e8ff] rounded-lg">
              <GraduationCap className="h-4 w-4 text-[#7c3aed]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#7c3aed]">{dashboardStats.recentGrades}</div>
            <p className="text-xs text-gray-600 mt-1">
              Afgelopen week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Berichten</CardTitle>
            <div className="p-2 bg-[#fef3c7] rounded-lg">
              <Bell className="h-4 w-4 text-[#dc2626]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#dc2626]">{dashboardStats.unreadMessages}</div>
            <p className="text-xs text-gray-600 mt-1">
              Ongelezen berichten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid - Admin Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Lessons - Admin Style */}
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <Clock className="h-5 w-5 mr-2 text-[#1e40af]" />
              Komende Lessen
            </CardTitle>
            <Link href="/student/schedule">
              <Button variant="ghost" size="sm" className="text-[#1e40af] hover:bg-[#eff6ff]">
                Volledig rooster <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {upcomingLessons?.lessons?.length ? (
              <div className="space-y-3">
                {upcomingLessons.lessons.slice(0, 4).map((lesson) => (
                  <div key={lesson.id} className="p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{lesson.subject}</p>
                        <p className="text-sm text-gray-600">{lesson.teacher}</p>
                        <p className="text-sm text-gray-500">{lesson.time} • {lesson.room}</p>
                      </div>
                      <Badge className="bg-[#eff6ff] text-[#1e40af] border-[#1e40af]">
                        Vandaag
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Geen komende lessen gepland
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades - Admin Style */}
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <GraduationCap className="h-5 w-5 mr-2 text-[#1e40af]" />
              Recente Cijfers
            </CardTitle>
            <Link href="/student/grades">
              <Button variant="ghost" size="sm" className="text-[#1e40af] hover:bg-[#eff6ff]">
                Alle cijfers <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {recentGrades?.grades?.length ? (
              <div className="space-y-3">
                {recentGrades.grades.slice(0, 4).map((grade) => (
                  <div key={grade.id} className="p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{grade.subject}</p>
                        <p className="text-sm text-gray-600">{grade.description}</p>
                      </div>
                      <Badge className={`${
                        parseFloat(grade.grade) >= 8 ? 'bg-[#f0fdf4] text-[#16a34a] border-[#16a34a]' :
                        parseFloat(grade.grade) >= 6 ? 'bg-[#fef3c7] text-[#d97706] border-[#d97706]' :
                        'bg-[#fef2f2] text-[#dc2626] border-[#dc2626]'
                      }`}>
                        {grade.grade}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500">{grade.date}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Geen recente cijfers
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity - Admin Style */}
      <div className="mt-6">
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <Bell className="h-5 w-5 mr-2 text-[#1e40af]" />
              Recente Activiteit
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            {recentActivity?.activities?.length ? (
              <div className="space-y-3">
                {recentActivity.activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'grade' ? 'bg-[#1e40af]' :
                      activity.type === 'attendance' ? 'bg-[#16a34a]' :
                      activity.type === 'assignment' ? 'bg-[#d97706]' : 'bg-[#7c3aed]'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      <p className="text-xs text-gray-500">{activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Geen recente activiteit
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - Admin Style */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-[#1e40af] mb-4">Snelle Acties</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/student/attendance">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
              <UserCheck className="h-6 w-6 mb-1 text-[#1e40af]" />
              <span className="text-sm text-[#1e40af]">Aanwezigheid</span>
            </Button>
          </Link>
          
          <Link href="/student/grades">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
              <GraduationCap className="h-6 w-6 mb-1 text-[#1e40af]" />
              <span className="text-sm text-[#1e40af]">Cijfers</span>
            </Button>
          </Link>
          
          <Link href="/student/subjects">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
              <BookOpen className="h-6 w-6 mb-1 text-[#1e40af]" />
              <span className="text-sm text-[#1e40af]">Vakken</span>
            </Button>
          </Link>
          
          <Link href="/student/communications">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
              <MessageCircle className="h-6 w-6 mb-1 text-[#1e40af]" />
              <span className="text-sm text-[#1e40af]">Berichten</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}