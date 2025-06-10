import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, BookOpen, Calendar, CheckCircle, Clock, TrendingUp, MessageSquare, FileText } from "lucide-react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";

interface TeacherStats {
  totalStudents: number;
  totalCourses: number;
  upcomingClasses: number;
  gradedAssignments: number;
  pendingGrading: number;
  attendanceRate: number;
  unreadMessages: number;
}

interface ClassOverview {
  id: number;
  name: string;
  code: string;
  studentCount: number;
  nextClass?: {
    date: string;
    time: string;
    room: string;
  };
  averageGrade?: number;
  attendanceRate: number;
}

interface RecentActivity {
  id: number;
  type: 'assignment' | 'attendance' | 'grade' | 'message';
  description: string;
  timestamp: string;
  className?: string;
}

export default function TeacherDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: TeacherStats }>({
    queryKey: ["/api/teacher/dashboard/stats"],
    retry: false,
  });

  const { data: classes, isLoading: classesLoading } = useQuery<{ classes: ClassOverview[] }>({
    queryKey: ["/api/teacher/classes"],
    retry: false,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<{ activities: RecentActivity[] }>({
    queryKey: ["/api/teacher/recent-activities"],
    retry: false,
  });

  const isLoading = statsLoading || classesLoading || activitiesLoading;

  if (isLoading) {
    return (
      <UnifiedLayout userRole="teacher">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e40af]"></div>
        </div>
      </UnifiedLayout>
    );
  }

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
                  <BookOpen className="h-8 w-8 text-white mr-3" />
                  <h1 className="text-3xl font-bold text-white">Docent Dashboard</h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Beheer uw klassen, studenten en beoordelingen
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats?.stats?.totalStudents || 0}</div>
                    <div className="text-sm text-blue-100">Studenten</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats?.stats?.totalCourses || 0}</div>
                    <div className="text-sm text-blue-100">Vakken</div>
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
          {/* Students Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Totaal Studenten</CardTitle>
                <div className="text-2xl font-bold text-[#1e40af] mt-1">{stats?.stats?.totalStudents || 0}</div>
              </div>
              <div className="p-2 bg-[#1e40af]/10 rounded-lg">
                <Users className="h-4 w-4 text-[#1e40af]" />
              </div>
            </CardHeader>
          </Card>

          {/* Courses Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-green-50/30 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Mijn Vakken</CardTitle>
                <div className="text-2xl font-bold text-green-600 mt-1">{stats?.stats?.totalCourses || 0}</div>
              </div>
              <div className="p-2 bg-green-600/10 rounded-lg">
                <BookOpen className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
          </Card>

          {/* Upcoming Classes */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-orange-50/30 border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Komende Lessen</CardTitle>
                <div className="text-2xl font-bold text-orange-600 mt-1">{stats?.stats?.upcomingClasses || 0}</div>
              </div>
              <div className="p-2 bg-orange-600/10 rounded-lg">
                <Calendar className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
          </Card>

          {/* Pending Grading */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-red-50/30 border border-red-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Te Beoordelen</CardTitle>
                <div className="text-2xl font-bold text-red-600 mt-1">{stats?.stats?.pendingGrading || 0}</div>
              </div>
              <div className="p-2 bg-red-600/10 rounded-lg">
                <FileText className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Classes Overview and Recent Activities - Admin Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Classes Overview */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white">
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Mijn Klassen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {classes?.classes?.map((classItem) => (
                  <div key={classItem.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <h3 className="font-semibold text-gray-900">{classItem.name}</h3>
                      <p className="text-sm text-gray-600">Code: {classItem.code}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center text-sm">
                          <Users className="h-4 w-4 text-blue-600 mr-1" />
                          <span className="text-gray-600">{classItem.studentCount} studenten</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-gray-600">{classItem.attendanceRate}% aanwezigheid</span>
                        </div>
                      </div>
                      {classItem.nextClass && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-xs">
                            Volgende les: {classItem.nextClass.date} om {classItem.nextClass.time}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      {classItem.averageGrade && (
                        <div className="text-lg font-bold text-green-600">{classItem.averageGrade.toFixed(1)}</div>
                      )}
                      <div className="text-sm text-gray-600">Gemiddeld</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Geen klassen gevonden</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activities - Admin Style */}
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white">
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Recente Activiteiten
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {activities?.activities?.map((activity) => (
                  <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <div className="flex-shrink-0">
                      {activity.type === 'assignment' && <FileText className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'attendance' && <CheckCircle className="h-5 w-5 text-green-600" />}
                      {activity.type === 'grade' && <TrendingUp className="h-5 w-5 text-orange-600" />}
                      {activity.type === 'message' && <MessageSquare className="h-5 w-5 text-purple-600" />}
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
                    <Clock className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Geen recente activiteiten</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions - Admin Style */}
        <Card className="shadow-lg border-gray-200">
          <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white">
            <CardTitle>Snelle Acties</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-blue-900">Aanwezigheid Registreren</h3>
                    <p className="text-sm text-blue-700">Registreer student aanwezigheid</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-green-50 rounded-lg border border-green-200 hover:bg-green-100 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-green-900">Cijfers Invoeren</h3>
                    <p className="text-sm text-green-700">Voer student beoordelingen in</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-colors cursor-pointer">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-orange-100 rounded-full">
                    <Calendar className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-medium text-orange-900">Les Plannen</h3>
                    <p className="text-sm text-orange-700">Maak een nieuwe les aan</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
}