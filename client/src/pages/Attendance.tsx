import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Download, Filter, CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/Avatar';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Define types
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  studentId: string;
  attendanceRate: number;
  lastStatus: string;
}

interface AttendanceSession {
  id: string;
  courseId: string;
  courseName: string;
  date: string;
}

export default function Attendance() {
  const { toast } = useToast();
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState<Record<string, string>>({});

  // Fetch courses for dropdown
  const { data: coursesData } = useQuery({
    queryKey: ['/api/courses/list'],
    staleTime: 300000,
  });

  const courses = coursesData?.courses || [];

  // Fetch attendance data for selected course and date
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/attendance', { courseId: selectedCourse, date: selectedDate }],
    staleTime: 60000,
    enabled: !!selectedCourse,
  });

  const students: Student[] = data?.students || [];
  const session: AttendanceSession | null = data?.session || null;

  // Mutation for saving attendance
  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/attendance/save', {
        sessionId: session?.id,
        courseId: selectedCourse,
        date: selectedDate,
        attendance: attendanceData,
      });
    },
    onSuccess: () => {
      toast({
        title: 'Aanwezigheid opgeslagen',
        description: 'Aanwezigheidsregistraties zijn succesvol bijgewerkt.',
        variant: 'default',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
    },
    onError: (error) => {
      toast({
        title: 'Fout bij opslaan aanwezigheid',
        description: error.message || 'Er is iets misgegaan. Probeer het opnieuw.',
        variant: 'destructive',
      });
    },
  });

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    setAttendanceData({});
  };

  const handleDateChange = (increment: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + increment);
    setSelectedDate(current.toISOString().split('T')[0]);
    setAttendanceData({});
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status: string) => {
    const newData: Record<string, string> = {};
    students.forEach(student => {
      newData[student.id] = status;
    });
    setAttendanceData(newData);
  };

  const handleSaveAttendance = () => {
    saveMutation.mutate();
  };

  // Format date as "Day Month Year" in Dutch format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Load initial attendance data when it becomes available
  useState(() => {
    if (data?.attendance && Object.keys(attendanceData).length === 0) {
      setAttendanceData(data.attendance);
    }
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Aanwezigheidsregistratie</h1>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Rapport Exporteren
          </Button>
          <Button className="flex items-center">
            <CheckCircle className="mr-2 h-4 w-4" />
            Nieuwe Sessie
          </Button>
        </div>
      </div>

      {/* Course and date selector */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Select value={selectedCourse} onValueChange={handleCourseChange}>
              <SelectTrigger className="w-full sm:w-[300px]">
                <SelectValue placeholder="Selecteer een cursus" />
              </SelectTrigger>
              <SelectContent>
                {courses.length === 0 ? (
                  <SelectItem value="loading" disabled>Cursussen laden...</SelectItem>
                ) : (
                  courses.map((course: any) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title} ({course.courseCode})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDateChange(-1)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm font-medium">{formatDate(selectedDate)}</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDateChange(1)}
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
              onClick={() => handleMarkAll('present')}
            >
              <CheckCircle className="mr-1.5 h-4 w-4" />
              Allen Aanwezig
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
              onClick={() => handleMarkAll('absent')}
            >
              <XCircle className="mr-1.5 h-4 w-4" />
              Allen Afwezig
            </Button>
          </div>
        </div>
      </div>

      {/* Attendance table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {!selectedCourse ? (
          <div className="p-8 text-center">
            <h3 className="text-gray-500 text-lg font-medium">Selecteer een cursus om aanwezigheid te bekijken</h3>
          </div>
        ) : isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : isError ? (
          <div className="text-center py-12 text-red-500">
            Fout bij het laden van aanwezigheidsgegevens. Probeer het opnieuw.
          </div>
        ) : students.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            Geen studenten ingeschreven voor deze cursus.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aanwezigheidspercentage
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Laatste Les
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {students.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar 
                            initials={`${student.firstName.charAt(0)}${student.lastName.charAt(0)}`} 
                            size="md" 
                          />
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                            <div className="text-sm text-gray-500">{student.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Select 
                          value={attendanceData[student.id] || ''} 
                          onValueChange={(value) => handleStatusChange(student.id, value)}
                        >
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Selecteer status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="present">Aanwezig</SelectItem>
                            <SelectItem value="absent">Afwezig</SelectItem>
                            <SelectItem value="late">Te Laat</SelectItem>
                            <SelectItem value="excused">Geëxcuseerd</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Progress 
                            value={student.attendanceRate} 
                            className="w-16 mr-2"
                            indicatorColor={
                              student.attendanceRate >= 90 ? 'bg-green-500' :
                              student.attendanceRate >= 75 ? 'bg-yellow-500' :
                              'bg-red-500'
                            }
                          />
                          <span className="text-sm text-gray-500">{student.attendanceRate}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student.lastStatus.charAt(0).toUpperCase() + student.lastStatus.slice(1)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-primary hover:text-primary-dark"
                        >
                          Bekijk Geschiedenis
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-start sm:items-center sm:justify-between gap-4">
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-1">Sessie Samenvatting</h4>
                <div className="flex flex-wrap gap-2">
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Aanwezig: {Object.values(attendanceData).filter(v => v === 'present').length}
                  </span>
                  <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full">
                    Afwezig: {Object.values(attendanceData).filter(v => v === 'absent').length}
                  </span>
                  <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                    Te Laat: {Object.values(attendanceData).filter(v => v === 'late').length}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    Geëxcuseerd: {Object.values(attendanceData).filter(v => v === 'excused').length}
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={handleSaveAttendance} 
                disabled={saveMutation.isPending}
                className="flex items-center"
              >
                {saveMutation.isPending ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Aanwezigheid Opslaan
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Attendance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Aanwezigheidsoverzicht</h3>
            <p className="text-sm text-gray-500 mt-1">Aanwezigheidsstatistieken huidige semester</p>
          </div>
          <div className="p-6">
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-gray-700">Algemene Aanwezigheidsgraad</h4>
                <span className="text-sm font-medium text-gray-700">85%</span>
              </div>
              <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-primary rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-800">Informatica</p>
                  <span className="text-sm text-gray-700">92%</span>
                </div>
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-green-500 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-800">Bedrijfskunde</p>
                  <span className="text-sm text-gray-700">78%</span>
                </div>
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-yellow-500 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-800">Techniek</p>
                  <span className="text-sm text-gray-700">85%</span>
                </div>
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-800">Geneeskunde</p>
                  <span className="text-sm text-gray-700">95%</span>
                </div>
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-green-500 rounded-full" style={{ width: '95%' }}></div>
                </div>
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-gray-800">Psychology</p>
                  <span className="text-sm text-gray-700">75%</span>
                </div>
                <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="absolute top-0 left-0 h-full bg-yellow-500 rounded-full" style={{ width: '75%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200">
          <div className="p-6 border-b border-gray-100">
            <h3 className="text-lg font-semibold text-gray-800">Low Attendance Alerts</h3>
            <p className="text-sm text-gray-500 mt-1">Students with attendance concerns</p>
          </div>
          <div className="p-6">
            <ul className="divide-y divide-gray-200">
              <li className="py-3 flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-red-100 text-red-600">
                    <XCircle className="h-4 w-4" />
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">James Kim</p>
                    <p className="text-sm text-gray-500">Business Management</p>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <p className="text-sm text-gray-500">Missed 5 out of last 10 classes</p>
                    <p className="text-sm font-medium text-red-600">58% Attendance</p>
                  </div>
                  <div className="mt-2">
                    <Button variant="link" size="sm" className="text-primary hover:text-primary-dark p-0 h-auto">
                      Send Reminder
                    </Button>
                  </div>
                </div>
              </li>
              
              <li className="py-3 flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 text-yellow-600">
                    <Clock className="h-4 w-4" />
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Aisha Thompson</p>
                    <p className="text-sm text-gray-500">Psychology</p>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <p className="text-sm text-gray-500">Missed 3 out of last 10 classes</p>
                    <p className="text-sm font-medium text-yellow-600">70% Attendance</p>
                  </div>
                  <div className="mt-2">
                    <Button variant="link" size="sm" className="text-primary hover:text-primary-dark p-0 h-auto">
                      Send Reminder
                    </Button>
                  </div>
                </div>
              </li>
              
              <li className="py-3 flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-yellow-100 text-yellow-600">
                    <Clock className="h-4 w-4" />
                  </span>
                </div>
                <div className="ml-3 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">Daniel Lee</p>
                    <p className="text-sm text-gray-500">Computer Science</p>
                  </div>
                  <div className="mt-1 flex justify-between">
                    <p className="text-sm text-gray-500">Missed 2 out of last 10 classes</p>
                    <p className="text-sm font-medium text-yellow-600">75% Attendance</p>
                  </div>
                  <div className="mt-2">
                    <Button variant="link" size="sm" className="text-primary hover:text-primary-dark p-0 h-auto">
                      Send Reminder
                    </Button>
                  </div>
                </div>
              </li>
            </ul>
            
            <div className="mt-4">
              <Button variant="link" className="text-primary hover:text-primary-dark p-0 h-auto">
                View all attendance issues
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
