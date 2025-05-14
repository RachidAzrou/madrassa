import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, Download, Filter, CheckCircle, XCircle, Clock, ArrowLeft, ArrowRight, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
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

interface Course {
  id: number;
  name: string;
  code: string;
}

export default function Attendance() {
  const { toast } = useToast();
  
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentAttendance, setStudentAttendance] = useState<Record<string, string>>({});

  // Fetch courses for dropdown
  const { data: coursesData } = useQuery<Course[]>({
    queryKey: ['/api/courses'],
    staleTime: 300000,
  });

  const courses: Course[] = coursesData || [];

  // Fetch attendance data for selected course and date
  const { data: attendanceRecords, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/attendance', { courseId: selectedCourse, date: selectedDate }],
    staleTime: 60000,
    enabled: !!selectedCourse,
  });

  // API retourneert een array, dus we moeten het omzetten naar de juiste formaten
  const students: Student[] = attendanceRecords ? 
    Array.isArray(attendanceRecords) ? 
      attendanceRecords.map((record: any) => ({
        id: record.studentId ? record.studentId.toString() : '',
        firstName: record.studentName?.split(' ')[0] || 'Onbekend',
        lastName: record.studentName?.split(' ').slice(1).join(' ') || '',
        email: record.studentEmail || '',
        studentId: record.studentId ? record.studentId.toString() : '',
        attendanceRate: record.attendanceRate || 0,
        lastStatus: record.status || 'unknown'
      })) : [] 
    : [];
  
  // Sessie-informatie samenstellen op basis van geselecteerde cursus
  const session: AttendanceSession | null = selectedCourse ? {
    id: `session-${selectedCourse}-${selectedDate}`,
    courseId: selectedCourse,
    courseName: Array.isArray(courses) ? 
      courses.find((c: Course) => c.id.toString() === selectedCourse)?.name || 'Onbekende cursus' : 
      'Onbekende cursus',
    date: selectedDate
  } : null;

  // Mutation for saving attendance
  const saveMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/attendance/save', {
        sessionId: session?.id,
        courseId: selectedCourse,
        date: selectedDate,
        attendance: studentAttendance,
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
    setStudentAttendance({});
  };

  const handleDateChange = (increment: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + increment);
    setSelectedDate(current.toISOString().split('T')[0]);
    setStudentAttendance({});
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };

  const handleMarkAll = (status: string) => {
    const newData: Record<string, string> = {};
    students.forEach(student => {
      newData[student.id] = status;
    });
    setStudentAttendance(newData);
  };

  const handleSaveAttendance = () => {
    saveMutation.mutate();
  };

  // Format date as "Day Month Year" in Dutch format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Load initial attendance data from records if available
  useEffect(() => {
    if (attendanceRecords && Array.isArray(attendanceRecords) && attendanceRecords.length > 0) {
      const initialAttendance: Record<string, string> = {};
      attendanceRecords.forEach((record: any) => {
        if (record.studentId && record.status) {
          initialAttendance[record.studentId.toString()] = record.status;
        }
      });
      setStudentAttendance(initialAttendance);
    }
  }, [attendanceRecords]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Aanwezigheidsregistratie</h1>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm" onClick={() => handleDateChange(-1)}>
            <ArrowLeft className="h-4 w-4 mr-1" /> Vorige dag
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleDateChange(1)}>
            Volgende dag <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Selection and filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cursus</label>
            <Select value={selectedCourse} onValueChange={handleCourseChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer cursus" />
              </SelectTrigger>
              <SelectContent>
                {courses.map(course => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="flex items-end space-x-2">
            <Button onClick={() => handleMarkAll('present')} variant="outline" className="flex items-center">
              <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
              Allen aanwezig
            </Button>
            <Button onClick={() => handleMarkAll('absent')} variant="outline" className="flex items-center">
              <XCircle className="h-4 w-4 mr-1 text-red-500" />
              Allen afwezig
            </Button>
          </div>
        </div>
      </div>

      {/* Session info */}
      {session && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-medium text-blue-800">{session.courseName}</h2>
            <p className="text-blue-600">{formatDate(session.date)}</p>
          </div>
          <div className="mt-3 md:mt-0">
            <Button onClick={handleSaveAttendance} disabled={saveMutation.isPending} className="flex items-center">
              <Save className="h-4 w-4 mr-1" />
              Aanwezigheid opslaan
            </Button>
          </div>
        </div>
      )}

      {/* Loading and error states */}
      {isLoading && (
        <div className="text-center p-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full inline-block mb-3"></div>
          <p className="text-gray-600">Gegevens laden...</p>
        </div>
      )}

      {isError && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg">
          <p>Er is een fout opgetreden bij het ophalen van de aanwezigheidsgegevens. Probeer de pagina te vernieuwen.</p>
        </div>
      )}

      {/* Student attendance list */}
      {!isLoading && !isError && selectedCourse && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student ID
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Aanwezigheid
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Totaal Aanwezigheid
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {students.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      Geen studenten gevonden voor deze cursus/datum.
                    </td>
                  </tr>
                ) : (
                  students.map(student => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <Avatar>
                              <div className="bg-blue-100 text-blue-800 flex items-center justify-center h-full rounded-full">
                                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                              </div>
                            </Avatar>
                          </div>
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
                        <div className="flex space-x-2">
                          <Button 
                            variant={studentAttendance[student.id] === 'present' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleStatusChange(student.id, 'present')}
                            className={studentAttendance[student.id] === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aanwezig
                          </Button>
                          <Button 
                            variant={studentAttendance[student.id] === 'absent' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleStatusChange(student.id, 'absent')}
                            className={studentAttendance[student.id] === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Afwezig
                          </Button>
                          <Button 
                            variant={studentAttendance[student.id] === 'late' ? 'default' : 'outline'} 
                            size="sm" 
                            onClick={() => handleStatusChange(student.id, 'late')}
                            className={studentAttendance[student.id] === 'late' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}
                          >
                            <Clock className="h-4 w-4 mr-1" />
                            Te laat
                          </Button>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Progress 
                            value={student.attendanceRate} 
                            className="w-24 h-2 mr-2" 
                          />
                          <span className="text-sm text-gray-700">{student.attendanceRate}%</span>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance summary */}
      {!isLoading && !isError && selectedCourse && students.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
          <h3 className="font-medium text-gray-700 mb-3">Aanwezigheidsoverzicht</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Aanwezig</p>
              <p className="text-2xl font-bold text-green-600">
                {Object.values(studentAttendance).filter(status => status === 'present').length}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Afwezig</p>
              <p className="text-2xl font-bold text-red-600">
                {Object.values(studentAttendance).filter(status => status === 'absent').length}
              </p>
            </div>
            <div className="bg-white p-3 rounded shadow-sm border border-gray-100">
              <p className="text-sm text-gray-500">Te laat</p>
              <p className="text-2xl font-bold text-yellow-600">
                {Object.values(studentAttendance).filter(status => status === 'late').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}