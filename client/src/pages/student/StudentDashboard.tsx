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
  Home
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from '@/components/layout/page-header';
import UnifiedLayout from "@/components/layout/UnifiedLayout";

interface StudentStats {
  myClass: string;
  totalSubjects: number;
  upcomingLessons: number;
  attendanceRate: number;
  recentGrades: number;
  unreadMessages: number;
}

export default function StudentDashboard() {
  // Fetch student dashboard stats
  const { data: statsData } = useQuery<{ stats: StudentStats }>({
    queryKey: ['/api/student/dashboard/stats'],
    staleTime: 60000,
  });

  const { data: upcomingLessons } = useQuery<any>({
    queryKey: ['/api/student/upcoming-lessons'],
    staleTime: 300000,
  });

  const { data: recentGrades } = useQuery<any>({
    queryKey: ['/api/student/recent-grades'],
    staleTime: 300000,
  });

  const { data: recentActivity } = useQuery<any>({
    queryKey: ['/api/student/recent-activity'],
    staleTime: 300000,
  });

  const stats: StudentStats = {
    myClass: statsData?.stats?.myClass || "3A",
    totalSubjects: statsData?.stats?.totalSubjects || 6,
    upcomingLessons: statsData?.stats?.upcomingLessons || 3,
    attendanceRate: statsData?.stats?.attendanceRate || 95,
    recentGrades: statsData?.stats?.recentGrades || 2,
    unreadMessages: statsData?.stats?.unreadMessages || 5
  };

  return (
    <UnifiedLayout userRole="student">
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          icon={<Home className="h-5 w-5 text-white" />}
          parent="Student"
          current="Dashboard"
        />
        
        {/* Stats Overview */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="premium-card border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mijn Klas</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.myClass}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Vakken</p>
                  <p className="text-2xl font-bold text-green-600">{stats.totalSubjects}</p>
                </div>
                <BookOpen className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Aanwezigheid</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.attendanceRate}%</p>
                </div>
                <UserCheck className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="premium-card border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Berichten</p>
                  <p className="text-2xl font-bold text-red-600">{stats.unreadMessages}</p>
                </div>
                <Mail className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Aankomende Lessen */}
          <Card className="premium-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <Calendar className="h-5 w-5 mr-2 text-[#1e40af]" />
                Aankomende Lessen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingLessons?.lessons?.length > 0 ? 
                  upcomingLessons.lessons.map((lesson: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-[#1e40af] rounded-full flex items-center justify-center">
                          <BookOpen className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{lesson.subject || 'Arabisch'}</h4>
                          <p className="text-sm text-gray-500">{lesson.time || '09:00 - 10:30'}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {lesson.status || 'Vandaag'}
                      </Badge>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-900 mb-2">Geen lessen gepland</h3>
                      <p className="text-gray-500">Er zijn geen aankomende lessen.</p>
                    </div>
                  )
                }
              </div>
            </CardContent>
          </Card>

          {/* Recente Cijfers */}
          <Card className="premium-card">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center text-lg">
                <GraduationCap className="h-5 w-5 mr-2 text-[#1e40af]" />
                Recente Cijfers
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentGrades?.grades?.length > 0 ? 
                  recentGrades.grades.map((grade: any, index: number) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center space-x-3">
                        <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                          <GraduationCap className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                          <h4 className="font-medium text-gray-900">{grade.subject || 'Arabisch'}</h4>
                          <p className="text-sm text-gray-500">{grade.description || 'Toets'}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-bold">
                        {grade.grade || '8.5'}
                      </Badge>
                    </div>
                  )) : (
                    <div className="text-center py-8">
                      <GraduationCap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="font-medium text-gray-900 mb-2">Geen recente cijfers</h3>
                      <p className="text-gray-500">Er zijn nog geen cijfers beschikbaar.</p>
                    </div>
                  )
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="premium-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center text-lg">
              <Activity className="h-5 w-5 mr-2 text-[#1e40af]" />
              Recente Activiteiten
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentActivity?.activities?.length > 0 ? 
                recentActivity.activities.map((activity: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <Activity className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900">{activity.title || 'Nieuwe activiteit'}</h4>
                        <p className="text-sm text-gray-500">{activity.description || 'Beschrijving van activiteit'}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{activity.time || '2 uur geleden'}</span>
                  </div>
                )) : (
                  <div className="text-center py-8">
                    <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="font-medium text-gray-900 mb-2">Geen recente activiteiten</h3>
                    <p className="text-gray-500">Er zijn nog geen activiteiten.</p>
                  </div>
                )
              }
            </div>
          </CardContent>
        </Card>
      </div>
    </UnifiedLayout>
  );
}