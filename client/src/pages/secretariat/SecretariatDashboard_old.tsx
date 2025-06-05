import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  UserPlus,
  GraduationCap,
  Calendar,
  CreditCard,
  MessageSquare,
  Clock,
  Bell,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  FileText
} from "lucide-react";
import { Link } from "wouter";

interface SecretariatStats {
  totalStudents: number;
  totalGuardians: number;
  activeClasses: number;
  pendingPayments: number;
  unreadMessages: number;
  todayAppointments: number;
  pendingTasks: number;
}



interface PendingTask {
  id: number;
  type: 'payment' | 'admission' | 'message' | 'schedule';
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
}

interface UpcomingAppointment {
  id: number;
  type: string;
  description: string;
  time: string;
  attendees: string[];
}

export default function SecretariatDashboard() {
  const { user } = useAuth();

  const { data: stats, isLoading: statsLoading } = useQuery<{ stats: SecretariatStats }>({
    queryKey: ['/api/secretariat/dashboard/stats'],
    retry: false,
  });



  const { data: pendingTasks } = useQuery<{ tasks: PendingTask[] }>({
    queryKey: ['/api/secretariat/pending-tasks'],
    retry: false,
  });

  const { data: upcomingAppointments } = useQuery<{ appointments: UpcomingAppointment[] }>({
    queryKey: ['/api/secretariat/upcoming-appointments'],
    retry: false,
  });

  if (statsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const dashboardStats = stats?.stats || {
    totalStudents: 0,
    totalGuardians: 0,
    activeClasses: 0,
    pendingPayments: 0,
    unreadMessages: 0,
    todayAppointments: 0,
    pendingTasks: 0
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welkom, {user?.firstName}!
        </h1>
        <p className="text-gray-600 mt-2">
          Overzicht van administratieve taken en schoolactiviteiten
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Studenten</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalStudents}</div>
            <p className="text-xs text-muted-foreground">
              Totaal aantal studenten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Voogden</CardTitle>
            <UserPlus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.totalGuardians}</div>
            <p className="text-xs text-muted-foreground">
              Geregistreerde voogden
            </p>
          </CardContent>
        </Card>



        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Klassen</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.activeClasses}</div>
            <p className="text-xs text-muted-foreground">
              Actieve klassen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Betalingen</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">
              Openstaande betalingen
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Berichten</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">
              Ongelezen berichten
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vandaag</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Afspraken vandaag
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taken</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardStats.pendingTasks}</div>
            <p className="text-xs text-muted-foreground">
              Openstaande taken
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Messages Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Recente Berichten
            </CardTitle>
            <CardDescription>
              Overzicht van nieuwe en openstaande berichten
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Welkom bij het nieuwe schooljaar</p>
                  <p className="text-sm text-gray-500">Van: Administratie • Vandaag</p>
                </div>
                <Badge variant="secondary">Nieuw</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Schoolgeld herinnering</p>
                  <p className="text-sm text-gray-500">Van: Financiën • Gisteren</p>
                </div>
                <Badge variant="outline">Gelezen</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Pending Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Openstaande Taken
            </CardTitle>
            <CardDescription>
              Overzicht van belangrijke taken en deadlines
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pendingTasks?.tasks?.length ? (
              <div className="space-y-3">
                {pendingTasks.tasks.slice(0, 5).map((task) => (
                  <div key={task.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      task.priority === 'high' ? 'bg-red-500' :
                      task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">{task.description}</p>
                      <p className="text-xs text-gray-500">Vervaldatum: {task.dueDate}</p>
                    </div>
                    <Badge variant="outline">
                      {task.type === 'payment' ? 'Betaling' :
                       task.type === 'admission' ? 'Aanmelding' :
                       task.type === 'message' ? 'Bericht' : 'Rooster'}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">
                Geen openstaande taken
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      {upcomingAppointments?.appointments && upcomingAppointments.appointments.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Komende Afspraken
            </CardTitle>
            <CardDescription>
              Overzicht van geplande vergaderingen en afspraken
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {upcomingAppointments.appointments.slice(0, 3).map((appointment) => (
                <div key={appointment.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{appointment.description}</p>
                    <p className="text-sm text-gray-600">{appointment.time}</p>
                    <p className="text-xs text-gray-500">
                      Deelnemers: {appointment.attendees.join(', ')}
                    </p>
                  </div>
                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                    {appointment.type}
                  </Badge>
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
          <Link href="/secretariat/students">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <Users className="h-6 w-6 mb-1" />
              <span className="text-sm">Studenten</span>
            </Button>
          </Link>
          
          <Link href="/secretariat/admissions">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <FileText className="h-6 w-6 mb-1" />
              <span className="text-sm">Aanmeldingen</span>
            </Button>
          </Link>
          
          <Link href="/secretariat/payments">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <CreditCard className="h-6 w-6 mb-1" />
              <span className="text-sm">Betalingen</span>
            </Button>
          </Link>
          
          <Link href="/secretariat/communication">
            <Button variant="outline" className="h-16 flex flex-col items-center justify-center">
              <MessageSquare className="h-6 w-6 mb-1" />
              <span className="text-sm">Communicatie</span>
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}