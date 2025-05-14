import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Users, BookOpen, ListChecks, ClipboardList } from 'lucide-react';
import { StatCard } from '@/components/dashboard/StatCard';
import { EnrollmentChart } from '@/components/dashboard/EnrollmentChart';
import { EventList, Event } from '@/components/dashboard/EventList';
import { Avatar } from '@/components/ui/Avatar';

export default function Dashboard() {
  const [_, setLocation] = useLocation();

  // Fetch stats data
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    staleTime: 60000,
  });

  // Fetch enrollment data
  const { data: enrollmentData, isLoading: isEnrollmentLoading } = useQuery({
    queryKey: ['/api/dashboard/enrollment'],
    staleTime: 60000,
  });

  // Fetch events data
  const { data: eventsData, isLoading: isEventsLoading } = useQuery({
    queryKey: ['/api/dashboard/events'],
    staleTime: 60000,
  });

  // Fetch recent students data
  const { data: recentStudentsData, isLoading: isStudentsLoading } = useQuery({
    queryKey: ['/api/dashboard/recent-students'],
    staleTime: 60000,
  });

  // Mock data for development
  const stats = isStatsLoading ? {
    totalStudents: { value: 0, change: 0 },
    activeCourses: { value: 0, change: 0 },
    programs: { value: 0, change: 0 },
    attendanceRate: { value: 0, change: 0 }
  } : statsData;

  const enrollmentTrends = isEnrollmentLoading ? [] : enrollmentData || [
    { month: "Jan", value: 65 },
    { month: "Feb", value: 85 },
    { month: "Mar", value: 75 },
    { month: "Apr", value: 90 },
    { month: "May", value: 95 },
    { month: "Jun", value: 70 },
    { month: "Jul", value: 60 },
    { month: "Aug", value: 80 },
    { month: "Sep", value: 85 }
  ];

  const events = isEventsLoading ? [] : eventsData || [];
  const recentStudents = isStudentsLoading ? [] : recentStudentsData || [];

  const navigateToCalendar = () => {
    setLocation('/calendar');
  };

  const navigateToStudents = () => {
    setLocation('/students');
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Totaal Studenten"
          value={stats?.totalStudents.value || 0}
          icon={<Users className="h-5 w-5" />}
          changeValue={stats?.totalStudents.change || 0}
        />
        <StatCard
          title="Actieve Cursussen"
          value={stats?.activeCourses.value || 0}
          icon={<BookOpen className="h-5 w-5" />}
          changeValue={stats?.activeCourses.change || 0}
        />
        <StatCard
          title="Programma's"
          value={stats?.programs.value || 0}
          icon={<ListChecks className="h-5 w-5" />}
          changeValue={stats?.programs.change || 0}
        />
        <StatCard
          title="Aanwezigheid"
          value={`${stats?.attendanceRate.value || 0}%`}
          icon={<ClipboardList className="h-5 w-5" />}
          changeValue={stats?.attendanceRate.change || 0}
        />
      </div>

      {/* Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <EnrollmentChart data={enrollmentTrends} />
        <EventList events={events} onViewCalendar={navigateToCalendar} />
      </div>

      {/* Recent Students */}
      <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200 lg:col-span-2">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-semibold text-gray-800">Recent Ingeschreven Studenten</h2>
          <button 
            onClick={navigateToStudents}
            className="text-primary text-sm hover:underline"
          >
            Bekijk Alles
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programma</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {recentStudents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-center text-sm text-gray-500">
                    Geen recente studenten gevonden
                  </td>
                </tr>
              ) : (
                recentStudents.map((student: any) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar 
                          initials={`${student.firstName.charAt(0)}${student.lastName.charAt(0)}`} 
                          size="sm" 
                        />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-800">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-gray-500">{student.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{student.studentId}</td>
                    <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-600">{student.program}</td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.status === 'active' ? 'bg-green-100 text-green-800' : 
                        student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status === 'active' ? 'Actief' : 
                         student.status === 'pending' ? 'In afwachting' : 
                         student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap text-right text-sm">
                      <button 
                        onClick={() => setLocation(`/students/${student.id}`)}
                        className="text-primary hover:text-primary-dark mr-3"
                      >
                        Bekijken
                      </button>
                      <button className="text-gray-500 hover:text-gray-700">
                        Bewerken
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Campus Images Section */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Onze Campus</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <img 
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
            alt="Modern onderwijsgebouw" 
            className="rounded-lg shadow-sm h-48 w-full object-cover" 
          />
          <img 
            src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
            alt="Bibliotheek" 
            className="rounded-lg shadow-sm h-48 w-full object-cover" 
          />
          <img 
            src="https://images.unsplash.com/photo-1498243691581-b145c3f54a5a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
            alt="Campus plein" 
            className="rounded-lg shadow-sm h-48 w-full object-cover" 
          />
          <img 
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
            alt="Moderne collegezaal" 
            className="rounded-lg shadow-sm h-48 w-full object-cover" 
          />
        </div>
      </div>
    </div>
  );
}
