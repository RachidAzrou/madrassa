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
    <div className="p-6 bg-[#f7f9fc] min-h-screen">
      {/* Header - Admin Style */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-[#1e40af] mb-2">
              Welkom terug, {user?.firstName}!
            </h1>
            <p className="text-gray-600">
              Hier is een overzicht van de schoolprestaties van uw kinderen
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <Button className="bg-[#1e40af] hover:bg-[#1d3a8a] text-white">
              <Calendar className="h-4 w-4 mr-2" />
              Afspraak Maken
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Grid - Admin Style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Mijn Kinderen</CardTitle>
            <div className="p-2 bg-[#eff6ff] rounded-lg">
              <Users className="h-4 w-4 text-[#1e40af]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#1e40af]">{dashboardStats.totalChildren}</div>
            <p className="text-xs text-gray-600 mt-1">
              Ingeschreven kinderen
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Aanwezigheid</CardTitle>
            <div className="p-2 bg-[#f0fdf4] rounded-lg">
              <UserCheck className="h-4 w-4 text-[#16a34a]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#16a34a]">{dashboardStats.attendanceRate}%</div>
            <p className="text-xs text-gray-600 mt-1">
              Gemiddelde aanwezigheid
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Komende Events</CardTitle>
            <div className="p-2 bg-[#fef3c7] rounded-lg">
              <Calendar className="h-4 w-4 text-[#d97706]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#d97706]">{dashboardStats.upcomingEvents}</div>
            <p className="text-xs text-gray-600 mt-1">
              Deze week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Openstaande Betalingen</CardTitle>
            <div className="p-2 bg-[#fdf2f8] rounded-lg">
              <CreditCard className="h-4 w-4 text-[#be185d]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#be185d]">{dashboardStats.pendingPayments}</div>
            <p className="text-xs text-gray-600 mt-1">
              Te betalen facturen
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Nieuwe Cijfers</CardTitle>
            <div className="p-2 bg-[#f3e8ff] rounded-lg">
              <GraduationCap className="h-4 w-4 text-[#7c3aed]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#7c3aed]">{dashboardStats.recentGrades}</div>
            <p className="text-xs text-gray-600 mt-1">
              Afgelopen week
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#e5e7eb] shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">Berichten</CardTitle>
            <div className="p-2 bg-[#fef3c7] rounded-lg">
              <Bell className="h-4 w-4 text-[#dc2626]" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-[#dc2626]">{dashboardStats.unreadMessages}</div>
            <p className="text-xs text-gray-600 mt-1">
              Ongelezen berichten
            </p>
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
  );
}