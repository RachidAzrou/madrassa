import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  GraduationCap, 
  CreditCard, 
  AlertCircle, 
  Calendar, 
  CheckCircle, 
  Clock,
  Euro,
  FileText,
  Phone,
  Mail,
  UserCheck,
  BookOpen,
  TrendingUp,
  Activity
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRBAC, RESOURCES } from '@/hooks/useRBAC';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  pendingEnrollments: number;
  totalRevenue: number;
  pendingPayments: number;
  activeClasses: number;
  completedTasks: number;
  pendingTasks: number;
}

interface PendingTask {
  id: number;
  type: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  studentName?: string;
  amount?: string;
}

interface UpcomingAppointment {
  id: number;
  type: string;
  description: string;
  datetime: string;
  studentName?: string;
  guardianName?: string;
  phone?: string;
}

export default function SecretariatDashboard() {
  const { user } = useAuth();
  const { canRead, canCreate, canUpdate, canDelete, canManage } = useRBAC();

  // Stats query
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/secretariat/dashboard/stats']
  });

  // Pending tasks query
  const { data: tasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['/api/secretariat/pending-tasks']
  });

  // Upcoming appointments query
  const { data: appointmentsData, isLoading: appointmentsLoading } = useQuery({
    queryKey: ['/api/secretariat/upcoming-appointments']
  });

  const stats: DashboardStats = statsData?.stats || {
    totalStudents: 0,
    totalTeachers: 0,
    pendingEnrollments: 0,
    totalRevenue: 0,
    pendingPayments: 0,
    activeClasses: 0,
    completedTasks: 0,
    pendingTasks: 0
  };

  const tasks: PendingTask[] = tasksData?.tasks || [];
  const appointments: UpcomingAppointment[] = appointmentsData?.appointments || [];

  // Calculate completion rate
  const totalTasks = stats.completedTasks + stats.pendingTasks;
  const completionRate = totalTasks > 0 ? (stats.completedTasks / totalTasks) * 100 : 0;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('nl-NL', {
      style: 'currency',
      currency: 'EUR'
    }).format(amount);
  };

  const formatDateTime = (datetime: string) => {
    return new Intl.DateTimeFormat('nl-NL', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(datetime));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Secretariaat Dashboard</h1>
              <p className="text-sm text-gray-600 mt-1">
                Welkom terug, {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                <UserCheck className="w-3 h-3 mr-1" />
                Secretariaat
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Studenten</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}</div>
              <p className="text-xs text-gray-600 mt-1">Actieve inschrijvingen</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Docenten</CardTitle>
              <GraduationCap className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</div>
              <p className="text-xs text-gray-600 mt-1">Actieve medewerkers</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Maandelijkse Inkomsten</CardTitle>
              <Euro className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(stats.totalRevenue)}
              </div>
              <p className="text-xs text-gray-600 mt-1">Deze maand</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Openstaande Betalingen</CardTitle>
              <AlertCircle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">{stats.pendingPayments}</div>
              <p className="text-xs text-gray-600 mt-1">Vereist opvolging</p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {canRead(RESOURCES.ENROLLMENTS) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Nieuwe Aanmeldingen</CardTitle>
                <BookOpen className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.pendingEnrollments}</div>
                <p className="text-xs text-gray-600 mt-1">Te beoordelen</p>
              </CardContent>
            </Card>
          )}

          {canRead(RESOURCES.CLASSES) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Actieve Klassen</CardTitle>
                <Activity className="h-4 w-4 text-indigo-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-gray-900">{stats.activeClasses}</div>
                <p className="text-xs text-gray-600 mt-1">Dit semester</p>
              </CardContent>
            </Card>
          )}

          {canRead(RESOURCES.TASKS) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taakvoortgang</CardTitle>
                <TrendingUp className="h-4 w-4 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-2">
                  <div className="text-2xl font-bold text-gray-900">{completionRate.toFixed(0)}%</div>
                  <div className="text-sm text-gray-600">
                    {stats.completedTasks}/{totalTasks}
                  </div>
                </div>
                <Progress value={completionRate} className="h-2" />
                <p className="text-xs text-gray-600 mt-1">Voltooiingspercentage</p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pending Tasks */}
          {canRead(RESOURCES.TASKS) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-orange-600" />
                  Openstaande Taken
                </CardTitle>
                <CardDescription>
                  Taken die aandacht vereisen ({tasks.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {tasksLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
                    <p>Alle taken zijn voltooid!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tasks.slice(0, 5).map((task) => (
                      <div key={task.id} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                              {task.priority === 'high' ? 'Hoog' : task.priority === 'medium' ? 'Gemiddeld' : 'Laag'}
                            </Badge>
                            <span className="text-sm font-medium text-gray-900">{task.type}</span>
                          </div>
                          <p className="text-sm text-gray-600 mb-1">{task.description}</p>
                          {task.studentName && (
                            <p className="text-xs text-gray-500">Student: {task.studentName}</p>
                          )}
                          {task.amount && (
                            <p className="text-xs text-gray-500">Bedrag: {task.amount}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {new Date(task.dueDate).toLocaleDateString('nl-NL')}
                        </div>
                      </div>
                    ))}
                    {tasks.length > 5 && (
                      <Button variant="outline" className="w-full">
                        Alle taken bekijken ({tasks.length - 5} meer)
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
          
          {/* Upcoming Appointments */}
          {canRead(RESOURCES.APPOINTMENTS) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-600" />
                  Komende Afspraken
                </CardTitle>
                <CardDescription>
                  Geplande gesprekken en activiteiten ({appointments.length})
                </CardDescription>
              </CardHeader>
              <CardContent>
                {appointmentsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full" />
                  </div>
                ) : appointments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p>Geen afspraken gepland</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {appointments.slice(0, 5).map((appointment) => (
                      <div key={appointment.id} className="flex items-start justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-xs bg-blue-100 text-blue-700 border-blue-200">
                              {appointment.type}
                            </Badge>
                          </div>
                          <p className="text-sm font-medium text-gray-900 mb-1">{appointment.description}</p>
                          {appointment.studentName && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                              <Users className="h-3 w-3" />
                              Student: {appointment.studentName}
                            </div>
                          )}
                          {appointment.guardianName && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 mb-1">
                              <UserCheck className="h-3 w-3" />
                              Voogd: {appointment.guardianName}
                            </div>
                          )}
                          {appointment.phone && (
                            <div className="flex items-center gap-1 text-xs text-blue-600">
                              <Phone className="h-3 w-3" />
                              {appointment.phone}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-gray-500 text-right">
                          {formatDateTime(appointment.datetime)}
                        </div>
                      </div>
                    ))}
                    {appointments.length > 5 && (
                      <Button variant="outline" className="w-full">
                        Alle afspraken bekijken ({appointments.length - 5} meer)
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-green-600" />
              Snelle Acties
            </CardTitle>
            <CardDescription>
              Veelgebruikte functies voor secretariaat
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Users className="h-6 w-6" />
                <span className="text-sm">Studentenbeheer</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <CreditCard className="h-6 w-6" />
                <span className="text-sm">Betalingen</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <BookOpen className="h-6 w-6" />
                <span className="text-sm">Aanmeldingen</span>
              </Button>
              
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center gap-2">
                <Mail className="h-6 w-6" />
                <span className="text-sm">Berichten</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}