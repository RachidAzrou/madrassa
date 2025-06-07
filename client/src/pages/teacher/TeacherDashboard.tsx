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
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";

interface TeacherStats {
  myClasses: number;
  totalStudents: number;
  mySubjects: number;
  upcomingLessons: number;
  pendingGrades: number;
  unreadMessages: number;
}

interface UpcomingLesson {
  id: number;
  className: string;
  subject: string;
  time: string;
  room: string;
}

interface RecentActivity {
  id: number;
  type: 'grade' | 'attendance' | 'message';
  description: string;
  timestamp: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: TeacherStats }>({
    queryKey: ['/api/teacher/dashboard/stats'],
    retry: false,
  });

  const { data: upcomingLessons } = useQuery<{ lessons: UpcomingLesson[] }>({
    queryKey: ['/api/teacher/upcoming-lessons'],
    retry: false,
  });

  const { data: recentActivity } = useQuery<{ activities: RecentActivity[] }>({
    queryKey: ['/api/teacher/recent-activity'],
    retry: false,
  });

  if (statsLoading) {
    return (
      <div className="p-6">
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
    myClasses: 0,
    totalStudents: 0,
    mySubjects: 0,
    upcomingLessons: 0,
    pendingGrades: 0,
    unreadMessages: 0
  };

  return (
    <div className="p-6 bg-[#f7f9fc] min-h-screen">
      {/* Header - Admin Style */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e40af] mb-2">
              Welkom terug, {user?.firstName}!
            </h1>
            <p className="text-gray-600">
              Hier is een overzicht van je klassen en activiteiten
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button className="bg-[#1e40af] hover:bg-[#1d3a8a] text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Nieuw Rooster
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid - Admin Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Mijn Klassen</CardTitle>
            <div className="p-2 bg-[#eff6ff] rounded-lg">
              <Users className="h-4 w-4 text-[#1e40af]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1e40af]">{dashboardStats.myClasses}</div>
            <p className="text-xs text-gray-600 mt-1">
              Actieve klassen dit schooljaar
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Mijn Studenten</CardTitle>
            <div className="p-2 bg-[#f0fdf4] rounded-lg">
              <Users className="h-4 w-4 text-[#16a34a]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#16a34a]">{dashboardStats.totalStudents}</div>
            <p className="text-xs text-gray-600 mt-1">
              Studenten in al mijn klassen
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Mijn Vakken</CardTitle>
            <div className="p-2 bg-[#fef3c7] rounded-lg">
              <BookOpen className="h-4 w-4 text-[#d97706]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#d97706]">{dashboardStats.mySubjects}</div>
            <p className="text-xs text-gray-600 mt-1">
              Vakken die ik geef
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
            <CardTitle className="text-sm font-medium text-gray-700">Te Beoordelen</CardTitle>
            <div className="p-2 bg-[#f3e8ff] rounded-lg">
              <UserCheck className="h-4 w-4 text-[#7c3aed]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#7c3aed]">{dashboardStats.pendingGrades}</div>
            <p className="text-xs text-gray-600 mt-1">
              Openstaande beoordelingen
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
            <Link href="/teacher/schedule">
              <Button variant="ghost" size="sm" className="text-[#1e40af] hover:bg-[#eff6ff]">
                Alles bekijken <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingLessons?.lessons?.length ? (
              <div className="space-y-3">
                {upcomingLessons.lessons.slice(0, 4).map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{lesson.className} - {lesson.subject}</p>
                      <p className="text-sm text-gray-500">{lesson.time} • {lesson.room}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Vandaag
                    </Badge>
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

        {/* Recent Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Bell className="h-5 w-5 mr-2 text-green-600" />
              Recente Activiteit
            </CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity?.activities?.length ? (
              <div className="space-y-3">
                {recentActivity.activities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      activity.type === 'grade' ? 'bg-blue-500' :
                      activity.type === 'attendance' ? 'bg-green-500' : 'bg-purple-500'
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

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Snelle Acties</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/teacher/attendance">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <UserCheck className="h-6 w-6 mb-1" />
              <span className="text-sm">Aanwezigheid</span>
            </Button>
          </Link>
          
          <Link href="/teacher/grades">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <BookOpen className="h-6 w-6 mb-1" />
              <span className="text-sm">Cijfers</span>
            </Button>
          </Link>
          
          <Link href="/teacher/reports">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <Users className="h-6 w-6 mb-1" />
              <span className="text-sm">Rapporten</span>
            </Button>
          </Link>
          
          <Link href="/teacher/schedule">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <Calendar className="h-6 w-6 mb-1" />
              <span className="text-sm">Rooster</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}