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
  CreditCard,
  FileText,
  GraduationCap
} from "lucide-react";
import { Link } from "wouter";

interface GuardianStats {
  totalChildren: number;
  upcomingEvents: number;
  unreadMessages: number;
  pendingPayments: number;
  attendanceRate: number;
  recentGrades: number;
}

interface ChildOverview {
  id: number;
  firstName: string;
  lastName: string;
  class: string;
  attendanceRate: number;
  recentGrade: string;
  upcomingEvents: number;
}

interface RecentActivity {
  id: number;
  type: 'grade' | 'attendance' | 'payment' | 'message';
  description: string;
  timestamp: string;
  childName?: string;
}

export default function GuardianDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: GuardianStats }>({
    queryKey: ['/api/guardian/dashboard/stats'],
    retry: false,
  });

  const { data: childrenOverview } = useQuery<{ children: ChildOverview[] }>({
    queryKey: ['/api/guardian/children-overview'],
    retry: false,
  });

  const { data: recentActivity } = useQuery<{ activities: RecentActivity[] }>({
    queryKey: ['/api/guardian/recent-activity'],
    retry: false,
  });

  if (statsLoading) {
    return (
      <div className="p-6 bg-[#f7f9fc] min-h-screen">
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
    totalChildren: 0,
    upcomingEvents: 0,
    unreadMessages: 0,
    pendingPayments: 0,
    attendanceRate: 0,
    recentGrades: 0
  };

  return (
    <div className="bg-gradient-to-br from-[#f7f9fc] to-[#e7f3ff] min-h-screen">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-[#1e40af] via-[#3b82f6] to-[#1e40af] p-8 mb-8">
        <div className="absolute inset-0 bg-black/5"></div>
        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-6 lg:mb-0">
              <div className="flex items-center mb-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white mb-1">
                    Assalamu alaikum, {user?.firstName}!
                  </h1>
                  <p className="text-blue-100 text-lg">
                    Welkom bij uw voogd dashboard
                  </p>
                </div>
              </div>
              <p className="text-blue-50 max-w-2xl">
                Volg de voortgang van uw kinderen, bekijk belangrijke updates en blijf verbonden met hun islamitische onderwijs
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white border border-white/30 transition-all duration-200">
                <Calendar className="h-4 w-4 mr-2" />
                Afspraak Plannen
              </Button>
              <Button className="bg-white text-[#1e40af] hover:bg-gray-50 transition-all duration-200">
                <Bell className="h-4 w-4 mr-2" />
                Berichten ({dashboardStats.unreadMessages})
              </Button>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-12 -translate-x-12"></div>
      </div>

      <div className="px-6 pb-8">
        {/* Enhanced Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Children Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-blue-700 transition-colors">Mijn Kinderen</CardTitle>
                <p className="text-xs text-gray-500 mt-1">Ingeschreven leerlingen</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <Users className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-blue-600 group-hover:text-blue-700 transition-colors">
                {dashboardStats.totalChildren}
              </div>
              <div className="mt-2 flex items-center text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Actief ingeschreven
              </div>
            </CardContent>
          </Card>

          {/* Attendance Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-green-50/30 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-green-700 transition-colors">Aanwezigheid</CardTitle>
                <p className="text-xs text-gray-500 mt-1">Gemiddelde score</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <UserCheck className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-green-600 group-hover:text-green-700 transition-colors">
                {dashboardStats.attendanceRate}%
              </div>
              <div className="mt-2 flex items-center text-xs text-green-600">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                Uitstekende aanwezigheid
              </div>
            </CardContent>
          </Card>

          {/* Events Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-amber-50/30 border border-amber-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-amber-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-amber-700 transition-colors">Komende Events</CardTitle>
                <p className="text-xs text-gray-500 mt-1">Deze week</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <Calendar className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-amber-600 group-hover:text-amber-700 transition-colors">
                {dashboardStats.upcomingEvents}
              </div>
              <div className="mt-2 flex items-center text-xs text-amber-600">
                <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
                Geplande activiteiten
              </div>
            </CardContent>
          </Card>

          {/* Payments Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-pink-50/30 border border-pink-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-pink-500/5 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-pink-700 transition-colors">Openstaande Betalingen</CardTitle>
                <p className="text-xs text-gray-500 mt-1">Te betalen facturen</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-pink-500 to-pink-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <CreditCard className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-pink-600 group-hover:text-pink-700 transition-colors">
                {dashboardStats.pendingPayments}
              </div>
              <div className="mt-2 flex items-center text-xs text-pink-600">
                <div className="w-2 h-2 bg-pink-500 rounded-full mr-2"></div>
                {dashboardStats.pendingPayments > 0 ? 'Actie vereist' : 'Alles betaald'}
              </div>
            </CardContent>
          </Card>

          {/* Grades Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-purple-50/30 border border-purple-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-purple-700 transition-colors">Nieuwe Cijfers</CardTitle>
                <p className="text-xs text-gray-500 mt-1">Afgelopen week</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-purple-600 group-hover:text-purple-700 transition-colors">
                {dashboardStats.recentGrades}
              </div>
              <div className="mt-2 flex items-center text-xs text-purple-600">
                <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                Recente beoordelingen
              </div>
            </CardContent>
          </Card>

          {/* Messages Card */}
          <Card className="group relative overflow-hidden bg-gradient-to-br from-white to-red-50/30 border border-red-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-semibold text-gray-700 group-hover:text-red-700 transition-colors">Berichten</CardTitle>
                <p className="text-xs text-gray-500 mt-1">Ongelezen berichten</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-md group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                <Bell className="h-5 w-5 text-white" />
              </div>
            </CardHeader>
            <CardContent className="relative z-10">
              <div className="text-3xl font-bold text-red-600 group-hover:text-red-700 transition-colors">
                {dashboardStats.unreadMessages}
              </div>
              <div className="mt-2 flex items-center text-xs text-red-600">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2"></div>
                {dashboardStats.unreadMessages > 0 ? 'Nieuwe berichten' : 'Alle berichten gelezen'}
              </div>
            </CardContent>
          </Card>
        </div>

      {/* Content Grid - Admin Style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Children Overview - Admin Style */}
        <Card className="bg-white border border-[#e5e7eb] shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between border-b border-[#e5e7eb] pb-4">
            <CardTitle className="flex items-center text-[#1e40af] font-semibold">
              <Users className="h-5 w-5 mr-2 text-[#1e40af]" />
              Mijn Kinderen
            </CardTitle>
            <Link href="/guardian/children">
              <Button variant="ghost" size="sm" className="text-[#1e40af] hover:bg-[#eff6ff]">
                Alles bekijken <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="pt-4">
            {childrenOverview?.children?.length ? (
              <div className="space-y-4">
                {childrenOverview.children.map((child) => (
                  <div key={child.id} className="p-4 bg-[#f8fafc] rounded-lg border border-[#e5e7eb]">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-gray-900">{child.firstName} {child.lastName}</p>
                        <p className="text-sm text-gray-600">Klas {child.class}</p>
                      </div>
                      <Badge className="bg-[#eff6ff] text-[#1e40af] border-[#1e40af]">
                        {child.attendanceRate}% aanwezig
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Laatste cijfer:</span>
                        <span className="ml-2 font-medium">{child.recentGrade || 'Geen'}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Events:</span>
                        <span className="ml-2 font-medium">{child.upcomingEvents}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Geen kinderen gevonden
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity - Admin Style */}
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
                      activity.type === 'payment' ? 'bg-[#be185d]' : 'bg-[#7c3aed]'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      {activity.childName && (
                        <p className="text-xs text-gray-600">{activity.childName}</p>
                      )}
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
          <Link href="/guardian/attendance">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
              <UserCheck className="h-6 w-6 mb-1 text-[#1e40af]" />
              <span className="text-sm text-[#1e40af]">Aanwezigheid</span>
            </Button>
          </Link>
          
          <Link href="/guardian/grades">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
              <GraduationCap className="h-6 w-6 mb-1 text-[#1e40af]" />
              <span className="text-sm text-[#1e40af]">Cijfers</span>
            </Button>
          </Link>
          
          <Link href="/guardian/payments">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
              <CreditCard className="h-6 w-6 mb-1 text-[#1e40af]" />
              <span className="text-sm text-[#1e40af]">Betalingen</span>
            </Button>
          </Link>
          
          <Link href="/guardian/reports">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center border-[#e5e7eb] hover:bg-[#eff6ff] hover:border-[#1e40af]">
              <FileText className="h-6 w-6 mb-1 text-[#1e40af]" />
              <span className="text-sm text-[#1e40af]">Rapporten</span>
            </Button>
          </Link>
          </div>
        </div>
      </div>
    </div>
  );
}