import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import UnifiedLayout from "@/components/layout/UnifiedLayout";
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
  Percent,
  BookOpen,
  GraduationCap
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
  date: string;
}

interface RecentActivity {
  id: number;
  type: 'grade' | 'attendance' | 'message';
  description: string;
  timestamp: string;
  className?: string;
}

interface PendingTask {
  id: number;
  type: 'grading' | 'attendance' | 'report';
  description: string;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  const { data: statsData } = useQuery<{ stats: TeacherStats }>({
    queryKey: ['/api/teacher/dashboard/stats'],
    staleTime: 60000,
  });

  const { data: upcomingLessons } = useQuery<{ lessons: UpcomingLesson[] }>({
    queryKey: ['/api/teacher/upcoming-lessons'],
    staleTime: 60000,
  });

  const { data: recentActivity } = useQuery<{ activities: RecentActivity[] }>({
    queryKey: ['/api/teacher/recent-activity'],
    staleTime: 60000,
  });

  const { data: pendingTasks } = useQuery<{ tasks: PendingTask[] }>({
    queryKey: ['/api/teacher/pending-tasks'],
    staleTime: 60000,
  });

  const stats = statsData?.stats;

  return (
    <UnifiedLayout userRole="teacher">
      <div className="space-y-6">
        {/* Hero Header - Admin Style */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#1e40af] via-[#3b82f6] to-[#1e40af] p-8 rounded-lg">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center mb-3">
                  <GraduationCap className="h-8 w-8 text-white mr-3" />
                  <h1 className="text-3xl font-bold text-white">Docent Dashboard</h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Welkom, {user?.firstName}! Beheer uw klassen, studenten en lessen
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats?.myClasses || 0}</div>
                    <div className="text-sm text-blue-100">Klassen</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats?.totalStudents || 0}</div>
                    <div className="text-sm text-blue-100">Studenten</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
        </div>

        {/* Enhanced Stats Grid - Admin Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Classes Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Mijn Klassen</CardTitle>
                <div className="text-2xl font-bold text-[#1e40af] mt-1">{stats?.myClasses || 0}</div>
              </div>
              <div className="p-2 bg-[#1e40af]/10 rounded-lg">
                <School className="h-4 w-4 text-[#1e40af]" />
              </div>
            </CardHeader>
          </Card>

          {/* Students Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-green-50/30 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Totaal Studenten</CardTitle>
                <div className="text-2xl font-bold text-green-600 mt-1">{stats?.totalStudents || 0}</div>
              </div>
              <div className="p-2 bg-green-600/10 rounded-lg">
                <Users className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
          </Card>

          {/* Upcoming Lessons Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-orange-50/30 border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Komende Lessen</CardTitle>
                <div className="text-2xl font-bold text-orange-600 mt-1">{stats?.upcomingLessons || 0}</div>
              </div>
              <div className="p-2 bg-orange-600/10 rounded-lg">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
          </Card>

          {/* Pending Grades Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-red-50/30 border border-red-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Te Beoordelen</CardTitle>
                <div className="text-2xl font-bold text-red-600 mt-1">{stats?.pendingGrades || 0}</div>
              </div>
              <div className="p-2 bg-red-600/10 rounded-lg">
                <ClipboardCheck className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Main Content Grid - Admin Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Lessons - Admin Style */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white">
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Komende Lessen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {upcomingLessons?.lessons?.map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-[#1e40af]/10 rounded-lg">
                        <BookOpen className="h-4 w-4 text-[#1e40af]" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{lesson.subject}</h3>
                        <p className="text-sm text-gray-600">{lesson.className}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {lesson.room}
                          </Badge>
                          <span className="text-xs text-gray-500">{lesson.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-[#1e40af]">{lesson.time}</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Geen komende lessen</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Tasks - Admin Style */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white">
              <CardTitle className="flex items-center">
                <ClipboardCheck className="h-5 w-5 mr-2" />
                Openstaande Taken
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {pendingTasks?.tasks?.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-orange-600/10 rounded-lg">
                        {task.type === 'grading' && <Award className="h-4 w-4 text-orange-600" />}
                        {task.type === 'attendance' && <Users className="h-4 w-4 text-orange-600" />}
                        {task.type === 'report' && <BarChart3 className="h-4 w-4 text-orange-600" />}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{task.description}</h3>
                        <p className="text-sm text-gray-600">Deadline: {task.dueDate}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge 
                        variant={task.priority === 'high' ? 'destructive' : task.priority === 'medium' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Alle taken voltooid</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity - Admin Style */}
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white">
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Recente Activiteiten
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              {recentActivity?.activities?.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex-shrink-0">
                    {activity.type === 'grade' && <Award className="h-5 w-5 text-green-600" />}
                    {activity.type === 'attendance' && <Users className="h-5 w-5 text-blue-600" />}
                    {activity.type === 'message' && <MessageCircle className="h-5 w-5 text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    {activity.className && (
                      <p className="text-xs text-gray-500 mt-1">Klas: {activity.className}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{activity.timestamp}</p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8 text-gray-500">
                  <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Geen recente activiteiten</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Admin Style */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link href="/teacher/students">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-blue-50 hover:border-blue-300 transition-colors">
              <Users className="h-6 w-6 text-[#1e40af]" />
              <span className="text-sm font-medium">Studenten</span>
            </Button>
          </Link>
          
          <Link href="/teacher/classes">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-green-50 hover:border-green-300 transition-colors">
              <School className="h-6 w-6 text-green-600" />
              <span className="text-sm font-medium">Klassen</span>
            </Button>
          </Link>
          
          <Link href="/teacher/grades">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-orange-50 hover:border-orange-300 transition-colors">
              <Award className="h-6 w-6 text-orange-600" />
              <span className="text-sm font-medium">Cijfers</span>
            </Button>
          </Link>
          
          <Link href="/teacher/reports">
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center space-y-2 hover:bg-purple-50 hover:border-purple-300 transition-colors">
              <BarChart3 className="h-6 w-6 text-purple-600" />
              <span className="text-sm font-medium">Rapporten</span>
            </Button>
          </Link>
        </div>
      </div>
    </UnifiedLayout>
  );
}