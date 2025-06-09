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
    <div className="bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 min-h-screen">
      {/* Modern Elegant Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Home className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Welkom terug!
                </h1>
                <p className="text-slate-600 text-sm font-medium">Je persoonlijke leeromgeving</p>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-3">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-700">Vandaag</p>
                <p className="text-xs text-slate-500">{new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div className="px-6 py-8 max-w-7xl mx-auto">
        
        {/* Beautiful Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Mijn Klas */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <div className="relative bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-lg">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="px-3 py-1 bg-blue-50 rounded-full">
                  <span className="text-xs font-medium text-blue-700">Actief</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">Mijn Klas</h3>
              <p className="text-2xl font-bold text-slate-800">{stats.myClass}</p>
            </div>
          </div>

          {/* Vakken */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <div className="relative bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl shadow-lg">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div className="px-3 py-1 bg-emerald-50 rounded-full">
                  <span className="text-xs font-medium text-emerald-700">Studie</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">Vakken</h3>
              <p className="text-2xl font-bold text-slate-800">{stats.totalSubjects}</p>
            </div>
          </div>

          {/* Aanwezigheid */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <div className="relative bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl shadow-lg">
                  <UserCheck className="h-5 w-5 text-white" />
                </div>
                <div className="px-3 py-1 bg-purple-50 rounded-full">
                  <span className="text-xs font-medium text-purple-700">Uitstekend</span>
                </div>
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">Aanwezigheid</h3>
              <p className="text-2xl font-bold text-slate-800">{stats.attendanceRate}%</p>
            </div>
          </div>

          {/* Berichten */}
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-orange-500 rounded-2xl opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
            <div className="relative bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl shadow-lg">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                {stats.unreadMessages > 0 && (
                  <div className="px-3 py-1 bg-red-50 rounded-full animate-pulse">
                    <span className="text-xs font-medium text-red-700">Nieuw</span>
                  </div>
                )}
              </div>
              <h3 className="text-sm font-medium text-slate-600 mb-1">Nieuwe Berichten</h3>
              <p className="text-2xl font-bold text-slate-800">{stats.unreadMessages}</p>
            </div>
          </div>
        </div>

        {/* Main dashboard content */}
        <div className="space-y-4">
          {/* Two column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            
            {/* Komende Lessen - Modern Style */}
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                    <Calendar className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Komende Lessen</h3>
                </div>
                <div className="px-3 py-1 bg-blue-50 rounded-full">
                  <span className="text-sm font-medium text-blue-700">{upcomingLessons?.lessons?.length || 0} vandaag</span>
                </div>
              </div>
              
              <div className="p-6">
                {upcomingLessons?.lessons?.length ? (
                  <div className="space-y-4">
                    {upcomingLessons.lessons.slice(0, 5).map((lesson: any) => (
                      <div key={lesson.id} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-indigo-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 group-hover:border-blue-200/50 transition-all duration-300">
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800 mb-1">{lesson.subject}</div>
                            <div className="text-sm text-slate-600 flex items-center">
                              <User className="h-4 w-4 mr-2" />
                              {lesson.teacher} • {lesson.room}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-bold text-blue-600">{lesson.time}</div>
                            <div className="text-xs text-slate-500 mt-1">Vandaag</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl inline-block mb-4">
                      <Calendar className="h-12 w-12 text-blue-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Geen lessen vandaag</h4>
                    <p className="text-slate-600">Geniet van je vrije dag!</p>
                  </div>
                )}
              </div>
            </div>

            {/* Recente Cijfers - Modern Style */}
            <div className="bg-white/70 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between p-6 border-b border-slate-200/50">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-800">Recente Cijfers</h3>
                </div>
                <div className="px-3 py-1 bg-emerald-50 rounded-full">
                  <span className="text-sm font-medium text-emerald-700">{recentGrades?.grades?.length || 0} nieuwe</span>
                </div>
              </div>
              
              <div className="p-6">
                {recentGrades?.grades?.length ? (
                  <div className="space-y-4">
                    {recentGrades.grades.slice(0, 5).map((grade: any) => (
                      <div key={grade.id} className="group relative">
                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-green-500/5 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative flex items-center justify-between p-4 bg-slate-50/50 rounded-xl border border-slate-200/50 group-hover:border-emerald-200/50 transition-all duration-300">
                          <div className="flex-1">
                            <div className="font-semibold text-slate-800 mb-1">{grade.subject}</div>
                            <div className="text-sm text-slate-600 mb-1">{grade.description}</div>
                            <div className="text-xs text-slate-500">{grade.date}</div>
                          </div>
                          <div className="text-right">
                            <div className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-bold ${
                              parseFloat(grade.grade) >= 8.0 
                                ? 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200'
                                : parseFloat(grade.grade) >= 7.0
                                ? 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200'
                                : parseFloat(grade.grade) >= 6.0
                                ? 'bg-gradient-to-r from-yellow-100 to-orange-100 text-yellow-800 border border-yellow-200'
                                : 'bg-gradient-to-r from-red-100 to-pink-100 text-red-800 border border-red-200'
                            }`}>
                              {grade.grade}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-2xl inline-block mb-4">
                      <GraduationCap className="h-12 w-12 text-emerald-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-slate-800 mb-2">Geen nieuwe cijfers</h4>
                    <p className="text-slate-600">Je cijfers verschijnen hier zodra ze beschikbaar zijn</p>
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
  );
}