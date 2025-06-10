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
  User,
  Home,
  Clock,
  TrendingUp,
  Award,
  Bell
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import UnifiedLayout from "@/components/layout/UnifiedLayout";

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
  date: string;
}

interface RecentGrade {
  id: number;
  subject: string;
  grade: string;
  description: string;
  date: string;
  teacher: string;
}

interface RecentActivityItem {
  id: number;
  type: 'lesson' | 'grade' | 'assignment' | 'message';
  description: string;
  time: string;
  subject?: string;
}

export default function StudentDashboard() {
  const { data: statsData } = useQuery<{ stats: StudentStats }>({
    queryKey: ['/api/student/dashboard/stats'],
    staleTime: 60000,
  });

  const { data: upcomingLessons } = useQuery<{ lessons: UpcomingLesson[] }>({
    queryKey: ['/api/student/upcoming-lessons'],
    staleTime: 60000,
  });

  const { data: recentGrades } = useQuery<{ grades: RecentGrade[] }>({
    queryKey: ['/api/student/recent-grades'],
    staleTime: 60000,
  });

  const { data: recentActivity } = useQuery<{ activities: RecentActivityItem[] }>({
    queryKey: ['/api/student/recent-activity'],
    staleTime: 60000,
  });

  const stats = statsData?.stats;

  return (
    <UnifiedLayout userRole="student">
      <div className="space-y-6">
        {/* Hero Header - Admin Style */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#1e40af] via-[#3b82f6] to-[#1e40af] p-8 rounded-lg">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center mb-3">
                  <GraduationCap className="h-8 w-8 text-white mr-3" />
                  <h1 className="text-3xl font-bold text-white">Student Dashboard</h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Welkom terug! Bekijk uw lessen, cijfers en schoolactiviteiten
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats?.myClass || 'N/A'}</div>
                    <div className="text-sm text-blue-100">Mijn Klas</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats?.attendanceRate || 0}%</div>
                    <div className="text-sm text-blue-100">Aanwezigheid</div>
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
          {/* Subjects Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Mijn Vakken</CardTitle>
                <div className="text-2xl font-bold text-[#1e40af] mt-1">{stats?.totalSubjects || 0}</div>
              </div>
              <div className="p-2 bg-[#1e40af]/10 rounded-lg">
                <BookOpen className="h-4 w-4 text-[#1e40af]" />
              </div>
            </CardHeader>
          </Card>

          {/* Upcoming Lessons Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-green-50/30 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Komende Lessen</CardTitle>
                <div className="text-2xl font-bold text-green-600 mt-1">{stats?.upcomingLessons || 0}</div>
              </div>
              <div className="p-2 bg-green-600/10 rounded-lg">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
          </Card>

          {/* Attendance Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-orange-50/30 border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Aanwezigheid</CardTitle>
                <div className="text-2xl font-bold text-orange-600 mt-1">{stats?.attendanceRate || 0}%</div>
              </div>
              <div className="p-2 bg-orange-600/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
          </Card>

          {/* Messages Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Ongelezen Berichten</CardTitle>
                <div className="text-2xl font-bold text-purple-600 mt-1">{stats?.unreadMessages || 0}</div>
              </div>
              <div className="p-2 bg-purple-600/10 rounded-lg">
                <Mail className="h-4 w-4 text-purple-600" />
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
                        <p className="text-sm text-gray-600">{lesson.teacher}</p>
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

          {/* Recent Grades - Admin Style */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white">
              <CardTitle className="flex items-center">
                <Award className="h-5 w-5 mr-2" />
                Recente Cijfers
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {recentGrades?.grades?.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-600/10 rounded-lg">
                        <Award className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{grade.subject}</h3>
                        <p className="text-sm text-gray-600">{grade.description}</p>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-gray-500">{grade.teacher}</span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">{grade.date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="text-lg font-bold">
                        {grade.grade}
                      </Badge>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Geen recente cijfers</p>
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
                    {activity.type === 'lesson' && <Clock className="h-5 w-5 text-blue-600" />}
                    {activity.type === 'grade' && <Award className="h-5 w-5 text-green-600" />}
                    {activity.type === 'assignment' && <BookOpen className="h-5 w-5 text-orange-600" />}
                    {activity.type === 'message' && <Mail className="h-5 w-5 text-purple-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{activity.description}</p>
                    {activity.subject && (
                      <p className="text-xs text-gray-500 mt-1">Vak: {activity.subject}</p>
                    )}
                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
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
      </div>
    </UnifiedLayout>
  );
}