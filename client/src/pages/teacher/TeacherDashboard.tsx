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
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welkom terug, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Hier is een overzicht van je klassen en activiteiten
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mijn Klassen</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.myClasses}</div>
            <p className="text-xs text-muted-foreground">
              Actieve klassen dit schooljaar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mijn Studenten</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Studenten in al mijn klassen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mijn Vakken</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.mySubjects}</div>
            <p className="text-xs text-muted-foreground">
              Vakken die ik geef
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Komende Lessen</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.upcomingLessons}</div>
            <p className="text-xs text-muted-foreground">
              Vandaag en morgen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Te Beoordelen</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.pendingGrades}</div>
            <p className="text-xs text-muted-foreground">
              Openstaande beoordelingen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Berichten</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              Ongelezen berichten
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Lessons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Komende Lessen
            </CardTitle>
            <Link href="/teacher/schedule">
              <Button variant="ghost" size="sm">
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