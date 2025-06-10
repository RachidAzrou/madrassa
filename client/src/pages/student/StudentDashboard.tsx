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

  // Fetch upcoming lessons
  const { data: upcomingLessons } = useQuery({
    queryKey: ['/api/student/upcoming-lessons'],
    staleTime: 60000,
  });

  // Fetch recent grades
  const { data: recentGrades } = useQuery({
    queryKey: ['/api/student/recent-grades'],
    staleTime: 60000,
  });

  // Fetch recent activity
  const { data: recentActivity } = useQuery({
    queryKey: ['/api/student/recent-activity'],
    staleTime: 60000,
  });

  // Mock data with safe defaults
  const stats = {
    myClass: statsData?.stats?.myClass || "8A",
    totalSubjects: statsData?.stats?.totalSubjects || 6,
    attendanceRate: statsData?.stats?.attendanceRate || 95,
    recentGrades: statsData?.stats?.recentGrades || 2,
    unreadMessages: statsData?.stats?.unreadMessages || 5
  };

  return (
    <UnifiedLayout userRole="student">
      <div className="space-y-6">
        {/* Clean Page Header - Admin Style */}
        <PageHeader
          title="Dashboard"
          icon={<Home className="h-5 w-5 text-white" />}
          parent="Student"
          current="Dashboard"
        />
        
        {/* Stats Overview - Modern Style */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Mijn Klas */}
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

          {/* Vakken */}
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

          {/* Aanwezigheid */}
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

          {/* Berichten */}
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

        {/* Main dashboard content */}
        <div className="space-y-4">
          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Komende Lessen - Admin Style */}
            <div className="bg-white border border-[#e5e7eb] rounded-sm">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafc]">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5 text-[#1e40af]" />
                  <h3 className="text-xs font-medium text-gray-700 tracking-tight">Komende Lessen</h3>
                </div>
                <span className="text-xs text-gray-500">{upcomingLessons?.lessons?.length || 0}</span>
              </div>
              
              <div className="p-4">
                {upcomingLessons?.lessons?.length ? (
                  <div className="space-y-3">
                    {upcomingLessons.lessons.slice(0, 5).map((lesson: any) => (
                      <div key={lesson.id} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded border border-[#e5e7eb]">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{lesson.subject}</div>
                          <div className="text-xs text-gray-500 flex items-center mt-1">
                            <User className="h-3 w-3 mr-1" />
                            {lesson.teacher} • {lesson.room}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-medium text-[#1e40af]">{lesson.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Geen komende lessen vandaag</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recente Cijfers - Admin Style */}
            <div className="bg-white border border-[#e5e7eb] rounded-sm">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafc]">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-3.5 w-3.5 text-[#1e40af]" />
                  <h3 className="text-xs font-medium text-gray-700 tracking-tight">Recente Cijfers</h3>
                </div>
                <span className="text-xs text-gray-500">{recentGrades?.grades?.length || 0}</span>
              </div>
              
              <div className="p-4">
                {recentGrades?.grades?.length ? (
                  <div className="space-y-3">
                    {recentGrades.grades.slice(0, 5).map((grade: any) => (
                      <div key={grade.id} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded border border-[#e5e7eb]">
                        <div className="flex-1">
                          <div className="font-medium text-sm text-gray-900">{grade.subject}</div>
                          <div className="text-xs text-gray-500 mt-1">{grade.description}</div>
                          <div className="text-xs text-gray-400 mt-1">{grade.date}</div>
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
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
                  <div className="text-center py-8 text-gray-500">
                    <GraduationCap className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Geen recente cijfers</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Recent Activity - Admin Style */}
          <div className="bg-white border border-[#e5e7eb] rounded-sm">
            <div className="flex items-center justify-between px-4 py-2 border-b border-[#e5e7eb] bg-[#f9fafc]">
              <div className="flex items-center gap-2">
                <Activity className="h-3.5 w-3.5 text-[#1e40af]" />
                <h3 className="text-xs font-medium text-gray-700 tracking-tight">Recente Activiteit</h3>
              </div>
            </div>
            
            <div className="p-4">
              {recentActivity?.activities?.length ? (
                <div className="space-y-3">
                  {recentActivity.activities.slice(0, 8).map((activity: any) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 bg-[#f8fafc] rounded border border-[#e5e7eb]">
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
                <div className="text-center py-8 text-gray-500">
                  <Activity className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm">Geen recente activiteit</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      </div>
    </UnifiedLayout>
  );
}