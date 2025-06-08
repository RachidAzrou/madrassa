import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { PremiumHeader } from "@/components/layout/premium-header";
import {
  Users,
  BookText,
  Calendar,
  ClipboardCheck,
  Clock,
  Bell,
  ChevronRight,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  MessageCircle,
  BookMarked,
  School,
  BarChart3,
  Award,
  Target,
  Activity,
  Percent
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

  const teacherStats = stats?.stats || {
    myClasses: 0,
    totalStudents: 0,
    mySubjects: 0,
    upcomingLessons: 0,
    pendingGrades: 0,
    unreadMessages: 0
  };

  const lessons = upcomingLessons?.lessons || [];
  const activities = recentActivity?.activities || [];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'grade':
        return <Percent className="h-4 w-4 text-blue-600" />;
      case 'attendance':
        return <ClipboardCheck className="h-4 w-4 text-green-600" />;
      case 'message':
        return <MessageCircle className="h-4 w-4 text-purple-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'grade':
        return 'bg-blue-50 border-blue-200';
      case 'attendance':
        return 'bg-green-50 border-green-200';
      case 'message':
        return 'bg-purple-50 border-purple-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      <PremiumHeader 
        title="Docent Dashboard" 
        icon={School}
        description={`Welkom terug, ${user?.firstName || 'Docent'}! Hier is uw overzicht voor vandaag.`}
        breadcrumbs={{
          parent: "Docent",
          current: "Dashboard"
        }}
      />
      
      <div className="px-6 py-6 space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">Mijn Klassen</p>
                  <p className="text-2xl font-bold text-blue-900">{teacherStats.myClasses}</p>
                </div>
                <div className="h-12 w-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <School className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">Studenten</p>
                  <p className="text-2xl font-bold text-green-900">{teacherStats.totalStudents}</p>
                </div>
                <div className="h-12 w-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-600 text-sm font-medium">Vakken</p>
                  <p className="text-2xl font-bold text-purple-900">{teacherStats.mySubjects}</p>
                </div>
                <div className="h-12 w-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <BookText className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">Komende Lessen</p>
                  <p className="text-2xl font-bold text-orange-900">{teacherStats.upcomingLessons}</p>
                </div>
                <div className="h-12 w-12 bg-orange-500 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">Te Beoordelen</p>
                  <p className="text-2xl font-bold text-red-900">{teacherStats.pendingGrades}</p>
                </div>
                <div className="h-12 w-12 bg-red-500 rounded-lg flex items-center justify-center">
                  <Percent className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-600 text-sm font-medium">Berichten</p>
                  <p className="text-2xl font-bold text-indigo-900">{teacherStats.unreadMessages}</p>
                </div>
                <div className="h-12 w-12 bg-indigo-500 rounded-lg flex items-center justify-center">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2/3 width */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quick Actions Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-blue-600" />
                  Snelle Acties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link href="/teacher/attendance">
                    <Button variant="outline" className="w-full h-16 flex-col gap-2 hover:bg-blue-50 hover:border-blue-300">
                      <ClipboardCheck className="h-5 w-5 text-blue-600" />
                      <span className="text-sm">Aanwezigheid</span>
                    </Button>
                  </Link>
                  
                  <Link href="/teacher/grades">
                    <Button variant="outline" className="w-full h-16 flex-col gap-2 hover:bg-green-50 hover:border-green-300">
                      <BarChart3 className="h-5 w-5 text-green-600" />
                      <span className="text-sm">Cijfers</span>
                    </Button>
                  </Link>
                  
                  <Link href="/teacher/reports">
                    <Button variant="outline" className="w-full h-16 flex-col gap-2 hover:bg-purple-50 hover:border-purple-300">
                      <BookMarked className="h-5 w-5 text-purple-600" />
                      <span className="text-sm">Rapporten</span>
                    </Button>
                  </Link>
                  
                  <Link href="/teacher/classes">
                    <Button variant="outline" className="w-full h-16 flex-col gap-2 hover:bg-orange-50 hover:border-orange-300">
                      <School className="h-5 w-5 text-orange-600" />
                      <span className="text-sm">Klassen</span>
                    </Button>
                  </Link>
                  
                  <Link href="/teacher/subjects">
                    <Button variant="outline" className="w-full h-16 flex-col gap-2 hover:bg-indigo-50 hover:border-indigo-300">
                      <BookText className="h-5 w-5 text-indigo-600" />
                      <span className="text-sm">Vakken</span>
                    </Button>
                  </Link>
                  
                  <Link href="/teacher/communications">
                    <Button variant="outline" className="w-full h-16 flex-col gap-2 hover:bg-pink-50 hover:border-pink-300">
                      <MessageCircle className="h-5 w-5 text-pink-600" />
                      <span className="text-sm">Berichten</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - 1/3 width */}
          <div className="space-y-6">
            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Prestatie Overzicht
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Klassen beheerd</span>
                  <Badge variant="secondary">{teacherStats.myClasses}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Totaal studenten</span>
                  <Badge variant="secondary">{teacherStats.totalStudents}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Vakken onderwezen</span>
                  <Badge variant="secondary">{teacherStats.mySubjects}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Aanwezigheidspercentage</span>
                  <Badge className="bg-green-100 text-green-800">85%</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-purple-600" />
                  Recente Activiteit
                </CardTitle>
                <Button variant="ghost" size="sm">
                  Alles bekijken
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardHeader>
              <CardContent>
                {activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.slice(0, 6).map((activity) => (
                      <div key={activity.id} className={`p-3 rounded-lg border ${getActivityColor(activity.type)}`}>
                        <div className="flex items-start space-x-3">
                          <div className="mt-0.5">
                            {getActivityIcon(activity.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-900 mb-1">{activity.description}</p>
                            <p className="text-xs text-gray-500">{activity.timestamp}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <Activity className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">Geen recente activiteit</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Full Width Agenda Section */}
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-green-600" />
              Mijn Agenda
            </CardTitle>
            <Link href="/teacher/calendar">
              <Button variant="ghost" size="sm">
                Alle lessen
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {lessons.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {lessons.map((lesson) => (
                  <div key={lesson.id} className="p-4 bg-gray-50 rounded-lg border hover:shadow-md transition-shadow">
                    <div className="flex items-start space-x-4">
                      <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <BookText className="h-6 w-6 text-green-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 mb-1">{lesson.subject}</h4>
                        <p className="text-sm text-gray-600 mb-2">{lesson.className}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {lesson.time}
                          </span>
                          <span>{lesson.room}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">Geen lessen gepland</h3>
                <p className="text-gray-500">Er zijn vandaag geen lessen ingepland.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}