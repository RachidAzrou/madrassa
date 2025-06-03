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
  GraduationCap,
  FileText,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { Link } from "wouter";

interface GuardianStats {
  childName: string;
  childClass: string;
  totalSubjects: number;
  attendanceRate: number;
  upcomingLessons: number;
  pendingReports: number;
  averageGrade: number;
  outstandingPayments: number;
}

interface UpcomingLesson {
  id: number;
  subject: string;
  teacher: string;
  time: string;
  room: string;
}

interface RecentGrade {
  id: number;
  subject: string;
  grade: number;
  description: string;
  date: string;
}

interface PaymentAlert {
  id: number;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
}

export default function GuardianDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: GuardianStats }>({
    queryKey: ['/api/guardian/dashboard/stats'],
    retry: false,
  });

  const { data: upcomingLessons } = useQuery<{ lessons: UpcomingLesson[] }>({
    queryKey: ['/api/guardian/upcoming-lessons'],
    retry: false,
  });

  const { data: recentGrades } = useQuery<{ grades: RecentGrade[] }>({
    queryKey: ['/api/guardian/recent-grades'],
    retry: false,
  });

  const { data: paymentAlerts } = useQuery<{ payments: PaymentAlert[] }>({
    queryKey: ['/api/guardian/payment-alerts'],
    retry: false,
  });

  if (statsLoading) {
    return (
      <div className="p-6">
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
    childName: '',
    childClass: '',
    totalSubjects: 0,
    attendanceRate: 0,
    upcomingLessons: 0,
    pendingReports: 0,
    averageGrade: 0,
    outstandingPayments: 0
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welkom, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Overzicht van {dashboardStats.childName} ({dashboardStats.childClass})
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kind</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.childName || 'Niet geselecteerd'}</div>
            <p className="text-xs text-muted-foreground">
              Klas: {dashboardStats.childClass || 'Onbekend'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vakken</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalSubjects}</div>
            <p className="text-xs text-muted-foreground">
              Vakken dit schooljaar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aanwezigheid</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.attendanceRate}%</div>
            <p className="text-xs text-muted-foreground">
              Aanwezigheidspercentage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Komende Lessen</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.upcomingLessons}</div>
            <p className="text-xs text-muted-foreground">
              Vandaag en morgen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gemiddeld Cijfer</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.averageGrade.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Dit schooljaar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Openstaande Betalingen</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.outstandingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Te betalen rekeningen
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Lessons */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-600" />
              Komende Lessen
            </CardTitle>
            <Link href="/guardian/subjects">
              <Button variant="ghost" size="sm">
                Alles bekijken <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingLessons?.lessons?.length ? (
              <div className="space-y-3">
                {upcomingLessons.lessons.slice(0, 4).map((lesson) => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{lesson.subject}</p>
                      <p className="text-sm text-gray-500">{lesson.teacher} • {lesson.time} • {lesson.room}</p>
                    </div>
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      Vandaag
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Geen komende lessen gepland
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <GraduationCap className="h-5 w-5 mr-2 text-green-600" />
              Laatste Cijfers
            </CardTitle>
            <Link href="/guardian/grades">
              <Button variant="ghost" size="sm">
                Alles bekijken <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentGrades?.grades?.length ? (
              <div className="space-y-3">
                {recentGrades.grades.slice(0, 5).map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{grade.subject}</p>
                      <p className="text-sm text-gray-500">{grade.description}</p>
                      <p className="text-xs text-gray-400">{grade.date}</p>
                    </div>
                    <Badge variant={grade.grade >= 7 ? "default" : grade.grade >= 5.5 ? "secondary" : "destructive"}>
                      {grade.grade.toFixed(1)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Nog geen cijfers beschikbaar
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payment Alerts */}
      {paymentAlerts?.payments?.length > 0 && (
        <Card className="mt-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
              Betalingsherinneringen
            </CardTitle>
            <Link href="/guardian/payments">
              <Button variant="ghost" size="sm">
                Alles bekijken <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {paymentAlerts.payments.slice(0, 3).map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{payment.description}</p>
                    <p className="text-sm text-gray-600">Vervaldatum: {payment.dueDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">€{payment.amount.toFixed(2)}</p>
                    <Badge variant="outline" className="bg-orange-100 text-orange-800 border-orange-300">
                      {payment.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Snelle Acties</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/guardian/attendance">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <UserCheck className="h-6 w-6 mb-1" />
              <span className="text-sm">Aanwezigheid</span>
            </Button>
          </Link>
          
          <Link href="/guardian/grades">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <GraduationCap className="h-6 w-6 mb-1" />
              <span className="text-sm">Cijfers</span>
            </Button>
          </Link>
          
          <Link href="/guardian/reports">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <FileText className="h-6 w-6 mb-1" />
              <span className="text-sm">Rapporten</span>
            </Button>
          </Link>
          
          <Link href="/guardian/payments">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <CreditCard className="h-6 w-6 mb-1" />
              <span className="text-sm">Betalingen</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}