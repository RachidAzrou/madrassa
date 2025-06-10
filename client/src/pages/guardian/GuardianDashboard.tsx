import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, MessageSquare, CreditCard, TrendingUp, BookOpen, Clock, Bell } from "lucide-react";
import UnifiedLayout from "@/components/layout/UnifiedLayout";

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
  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: GuardianStats }>({
    queryKey: ["/api/guardian/dashboard/stats"],
    retry: false,
  });

  const { data: children, isLoading: childrenLoading } = useQuery<{ children: ChildOverview[] }>({
    queryKey: ["/api/guardian/children"],
    retry: false,
  });

  const { data: activities, isLoading: activitiesLoading } = useQuery<{ activities: RecentActivity[] }>({
    queryKey: ["/api/guardian/recent-activities"],
    retry: false,
  });

  const isLoading = statsLoading || childrenLoading || activitiesLoading;

  if (isLoading) {
    return (
      <UnifiedLayout userRole="guardian">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#1e40af]"></div>
        </div>
      </UnifiedLayout>
    );
  }

  return (
    <UnifiedLayout userRole="guardian">
      <div className="space-y-6">
        {/* Hero Header - Admin Style */}
        <div className="relative overflow-hidden bg-gradient-to-r from-[#1e40af] via-[#3b82f6] to-[#1e40af] p-8 rounded-lg">
          <div className="absolute inset-0 bg-black/5"></div>
          <div className="relative z-10">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
              <div className="mb-6 lg:mb-0">
                <div className="flex items-center mb-3">
                  <Users className="h-8 w-8 text-white mr-3" />
                  <h1 className="text-3xl font-bold text-white">Voogd Dashboard</h1>
                </div>
                <p className="text-blue-100 text-lg">
                  Volg de voortgang van uw kinderen en blijf op de hoogte van schoolactiviteiten
                </p>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20">
                <div className="flex items-center space-x-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats?.stats?.totalChildren || 0}</div>
                    <div className="text-sm text-blue-100">Kinderen</div>
                  </div>
                  <div className="w-px h-12 bg-white/20"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{stats?.stats?.attendanceRate || 0}%</div>
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
          {/* Children Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-blue-50/30 border border-blue-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Mijn Kinderen</CardTitle>
                <div className="text-2xl font-bold text-[#1e40af] mt-1">{stats?.stats?.totalChildren || 0}</div>
              </div>
              <div className="p-2 bg-[#1e40af]/10 rounded-lg">
                <Users className="h-4 w-4 text-[#1e40af]" />
              </div>
            </CardHeader>
          </Card>

          {/* Events Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-green-50/30 border border-green-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-green-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Komende Evenementen</CardTitle>
                <div className="text-2xl font-bold text-green-600 mt-1">{stats?.stats?.upcomingEvents || 0}</div>
              </div>
              <div className="p-2 bg-green-600/10 rounded-lg">
                <Calendar className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
          </Card>

          {/* Messages Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-orange-50/30 border border-orange-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-orange-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Ongelezen Berichten</CardTitle>
                <div className="text-2xl font-bold text-orange-600 mt-1">{stats?.stats?.unreadMessages || 0}</div>
              </div>
              <div className="p-2 bg-orange-600/10 rounded-lg">
                <MessageSquare className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
          </Card>

          {/* Payments Card */}
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-red-50/30 border border-red-100 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-red-600/10 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 relative z-10">
              <div>
                <CardTitle className="text-sm font-medium text-gray-600">Openstaande Betalingen</CardTitle>
                <div className="text-2xl font-bold text-red-600 mt-1">{stats?.stats?.pendingPayments || 0}</div>
              </div>
              <div className="p-2 bg-red-600/10 rounded-lg">
                <CreditCard className="h-4 w-4 text-red-600" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Children Overview - Admin Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="shadow-lg border-gray-200">
            <CardHeader className="bg-gradient-to-r from-[#1e40af] to-[#3b82f6] text-white">
              <CardTitle className="flex items-center">
                <BookOpen className="h-5 w-5 mr-2" />
                Mijn Kinderen
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                {children?.children?.map((child) => (
                  <div key={child.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div>
                      <h3 className="font-semibold text-gray-900">{child.firstName} {child.lastName}</h3>
                      <p className="text-sm text-gray-600">Klas: {child.class}</p>
                      <div className="flex items-center mt-2 space-x-4">
                        <div className="flex items-center text-sm">
                          <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                          <span className="text-gray-600">Aanwezigheid: {child.attendanceRate}%</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Laatste cijfer: {child.recentGrade}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">{child.upcomingEvents} evenementen</div>
                    </div>
                  </div>
                )) || (
                  <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>Geen kinderen gevonden</p>
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
                      {activity.type === 'grade' && <TrendingUp className="h-5 w-5 text-green-600" />}
                      {activity.type === 'attendance' && <Users className="h-5 w-5 text-blue-600" />}
                      {activity.type === 'payment' && <CreditCard className="h-5 w-5 text-red-600" />}
                      {activity.type === 'message' && <MessageSquare className="h-5 w-5 text-orange-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{activity.description}</p>
                      {activity.childName && (
                        <p className="text-xs text-gray-500 mt-1">Kind: {activity.childName}</p>
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
        </div>
      </div>
    </UnifiedLayout>
  );
}