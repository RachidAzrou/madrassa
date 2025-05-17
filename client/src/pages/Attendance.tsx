import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { 
  Search, Download, Filter, CheckCircle, XCircle, Clock, 
  ArrowLeft, ArrowRight, Save, User, UserPlus, MessageSquare, 
  AlertCircle, UserCheck, ClipboardCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar } from '@/components/ui/avatar';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

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

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  specialty?: string;
}

interface StudentAttendanceRecord {
  id: number;
  studentId: number;
  courseId?: number;
  classId?: number;
  date: string;
  status: string; // aanwezig, afwezig, te laat
  notes?: string;
  teacherId: number; // docent die de aanwezigheid heeft geregistreerd
}

interface TeacherAttendanceRecord {
  id: number;
  teacherId: number;
  courseId?: number;
  classId?: number;
  date: string;
  status: string; // aanwezig, afwezig
  notes?: string;
}

interface AttendanceSession {
  id: string;
  courseId?: string;
  courseName?: string;
  classId?: string;
  className?: string;
  date: string;
  type: 'vak' | 'klas';
}

interface Course {
  id: number;
  name: string;
  code: string;
}

interface Class {
  id: number;
  name: string;
  code: string;
}

interface AttendanceNote {
  studentId: string;
  note: string;
}

export default function Attendance() {
  const { toast } = useToast();
  
  // Algemene state
  const [selectedTab, setSelectedTab] = useState<'students' | 'teachers'>('students');
  const [selectedType, setSelectedType] = useState<'vak' | 'klas'>('vak');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  
  // Student aanwezigheid state
  const [studentAttendance, setStudentAttendance] = useState<Record<string, string>>({});
  const [studentNotes, setStudentNotes] = useState<Record<string, string>>({});
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  
  // Docent aanwezigheid state
  const [teacherAttendance, setTeacherAttendance] = useState<string>('present');
  const [teacherNote, setTeacherNote] = useState<string>('');

  // Fetch courses for dropdown
  const { data: coursesData } = useQuery<{ courses: Course[] }>({
    queryKey: ['/api/courses'],
    staleTime: 300000,
  });

  const courses: Course[] = coursesData?.courses || [];
  
  // Fetch classes for dropdown
  const { data: classesData } = useQuery<Class[]>({
    queryKey: ['/api/student-groups'],
    staleTime: 300000,
  });
  
  const classes: Class[] = classesData || [];
  
  // Fetch teachers for replacement dropdown
  const { data: teachersData } = useQuery<{ teachers: Teacher[], totalCount: number }>({
    queryKey: ['/api/teachers'],
    staleTime: 300000,
  });
  
  const teachers: Teacher[] = teachersData?.teachers || [];

  // Fetch student attendance data based on selected type (vak or klas)
  const { 
    data: attendanceRecords, 
    isLoading: isLoadingStudentAttendance, 
    isError: isErrorStudentAttendance, 
    refetch: refetchStudentAttendance 
  } = useQuery({
    queryKey: [
      selectedType === 'vak' ? '/api/courses' : '/api/student-groups', 
      selectedType === 'vak' ? selectedCourse : selectedClass, 
      'attendance', 
      'date', 
      selectedDate
    ],
    queryFn: async () => {
      let url = '';
      if (selectedType === 'vak' && selectedCourse) {
        url = `/api/courses/${selectedCourse}/attendance/date/${selectedDate}`;
      } else if (selectedType === 'klas' && selectedClass) {
        url = `/api/student-groups/${selectedClass}/attendance/date/${selectedDate}`;
      }
      
      if (!url) return [];
      
      const response = await apiRequest('GET', url);
      return response;
    },
    staleTime: 60000,
    enabled: (!!selectedCourse || !!selectedClass) && selectedTab === 'students',
  });
  
  // Fetch teacher attendance data based on selected type (vak or klas)
  const {
    data: teacherAttendanceRecord,
    isLoading: isLoadingTeacherAttendance,
    isError: isErrorTeacherAttendance,
    refetch: refetchTeacherAttendance
  } = useQuery({
    queryKey: [
      selectedType === 'vak' ? '/api/courses' : '/api/student-groups', 
      selectedType === 'vak' ? selectedCourse : selectedClass, 
      'teacher-attendance', 
      'date', 
      selectedDate
    ],
    queryFn: async () => {
      let url = '';
      if (selectedType === 'vak' && selectedCourse) {
        url = `/api/courses/${selectedCourse}/teacher-attendance/date/${selectedDate}`;
      } else if (selectedType === 'klas' && selectedClass) {
        url = `/api/student-groups/${selectedClass}/teacher-attendance/date/${selectedDate}`;
      }
      
      if (!url) return [];
      
      const response = await apiRequest('GET', url);
      return response;
    },
    staleTime: 60000,
    enabled: (!!selectedCourse || !!selectedClass) && selectedTab === 'teachers',
  });

  // API retourneert een array, dus we moeten het omzetten naar de juiste formaten
  const students: Student[] = attendanceRecords ? 
    Array.isArray(attendanceRecords) ? 
      attendanceRecords.map((record: any) => ({
        id: record.studentId ? record.studentId.toString() : '',
        firstName: record.firstName || record.studentName?.split(' ')[0] || 'Onbekend',
        lastName: record.lastName || record.studentName?.split(' ').slice(1).join(' ') || '',
        email: record.email || record.studentEmail || '',
        studentId: record.studentId ? record.studentId.toString() : '',
        attendanceRate: record.attendanceRate || 0,
        lastStatus: record.status || 'unknown'
      })) : [] 
    : [];
  
  // Sessie-informatie samenstellen op basis van geselecteerd vak/klas
  const session: AttendanceSession | null = selectedType === 'vak' ? 
    (selectedCourse ? {
      id: `session-course-${selectedCourse}-${selectedDate}`,
      courseId: selectedCourse,
      courseName: Array.isArray(courses) && courses.length > 0 ? 
        (courses.find((c: Course) => c.id.toString() === selectedCourse)?.name || 'Onbekend vak') : 
        'Onbekend vak',
      date: selectedDate,
      type: 'vak'
    } : null) :
    (selectedClass ? {
      id: `session-class-${selectedClass}-${selectedDate}`,
      classId: selectedClass,
      className: Array.isArray(classes) && classes.length > 0 ?
        (classes.find((c: Class) => c.id.toString() === selectedClass)?.name || 'Onbekende klas') :
        'Onbekende klas',
      date: selectedDate,
      type: 'klas'
    } : null);

  // Mutation for saving student attendance
  const saveStudentAttendanceMutation = useMutation({
    mutationFn: async () => {
      // Verzamel de attendance records voor batch verwerking
      const attendanceRecords = Object.entries(studentAttendance).map(([studentId, status]) => {
        const record: any = {
          studentId: parseInt(studentId),
          date: selectedDate,
          status,
          notes: studentNotes[studentId] || null,
          teacherId: 1, // Momenteel hardcoded, later uit sessie halen
        };
        
        if (selectedType === 'vak' && selectedCourse) {
          record.courseId = parseInt(selectedCourse);
        } else if (selectedType === 'klas' && selectedClass) {
          record.classId = parseInt(selectedClass);
        }
        
        return record;
      });
      
      return await apiRequest('POST', '/api/attendance/batch', attendanceRecords);
    },
    onSuccess: () => {
      toast({
        title: 'Aanwezigheid opgeslagen',
        description: 'Aanwezigheidsregistraties zijn succesvol bijgewerkt.',
        variant: 'default',
      });
      
      // Invalidate the correct query path based on selected type
      if (selectedType === 'vak') {
        queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse, 'attendance'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/student-groups', selectedClass, 'attendance'] });
      }
    },
    onError: (error) => {
      toast({
        title: 'Fout bij opslaan aanwezigheid',
        description: error.message || 'Er is iets misgegaan. Probeer het opnieuw.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for saving teacher attendance
  const saveTeacherAttendanceMutation = useMutation({
    mutationFn: async () => {
      const teacherAttendanceData: any = {
        teacherId: 1, // Hardcoded voor nu, later uit sessie halen
        date: selectedDate,
        status: teacherAttendance,
        notes: teacherNote || null,
      };
      
      if (selectedType === 'vak' && selectedCourse) {
        teacherAttendanceData.courseId = parseInt(selectedCourse);
      } else if (selectedType === 'klas' && selectedClass) {
        teacherAttendanceData.classId = parseInt(selectedClass);
      }
      
      return await apiRequest('POST', '/api/teacher-attendance', teacherAttendanceData);
    },
    onSuccess: () => {
      toast({
        title: 'Docent aanwezigheid opgeslagen',
        description: 'Uw aanwezigheid is succesvol geregistreerd.',
        variant: 'default',
      });
      
      // Invalidate the correct query path based on selected type
      if (selectedType === 'vak') {
        queryClient.invalidateQueries({ queryKey: ['/api/courses', selectedCourse, 'teacher-attendance'] });
      } else {
        queryClient.invalidateQueries({ queryKey: ['/api/student-groups', selectedClass, 'teacher-attendance'] });
      }
    },
    onError: (error) => {
      toast({
        title: 'Fout bij opslaan docent aanwezigheid',
        description: error.message || 'Er is iets misgegaan. Probeer het opnieuw.',
        variant: 'destructive',
      });
    },
  });

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    setSelectedType('vak');
    setSelectedClass('');
    setStudentAttendance({});
    setStudentNotes({});
    setTeacherAttendance('present');
    setTeacherNote('');
  };
  
  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedType('klas');
    setSelectedCourse('');
    setStudentAttendance({});
    setStudentNotes({});
    setTeacherAttendance('present');
    setTeacherNote('');
  };

  const handleDateChange = (increment: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + increment);
    setSelectedDate(current.toISOString().split('T')[0]);
    setStudentAttendance({});
    setStudentNotes({});
    setTeacherAttendance('present');
    setTeacherNote('');
  };

  const handleStatusChange = (studentId: string, status: string) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: status
    }));
  };
  
  const handleStudentNoteClick = (studentId: string) => {
    setSelectedStudentId(studentId);
    setNoteDialogOpen(true);
  };
  
  const handleStudentNoteChange = (note: string) => {
    if (selectedStudentId) {
      setStudentNotes(prev => ({
        ...prev,
        [selectedStudentId]: note
      }));
    }
  };
  
  const handleSaveStudentNote = () => {
    setNoteDialogOpen(false);
    setSelectedStudentId(null);
  };
  
  const handleTeacherAttendanceChange = (status: string) => {
    setTeacherAttendance(status);
  };
  
  // Vervanging functionaliteit is verwijderd
  
  const handleTeacherNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setTeacherNote(e.target.value);
  };

  const handleMarkAll = (status: string) => {
    const newData: Record<string, string> = {};
    students.forEach(student => {
      newData[student.id] = status;
    });
    setStudentAttendance(newData);
  };

  const handleSaveStudentAttendance = () => {
    // Controleer of er minimaal één student aanwezigheid is ingesteld
    if (Object.keys(studentAttendance).length === 0) {
      toast({
        title: 'Geen aanwezigheid geregistreerd',
        description: 'Registreer eerst aanwezigheid voor minimaal één student.',
        variant: 'destructive',
      });
      return;
    }
    
    saveStudentAttendanceMutation.mutate();
  };
  
  const handleSaveTeacherAttendance = () => {
    saveTeacherAttendanceMutation.mutate();
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
      const initialNotes: Record<string, string> = {};
      
      attendanceRecords.forEach((record: any) => {
        if (record.studentId && record.status) {
          initialAttendance[record.studentId.toString()] = record.status;
          
          // Sla eventuele notities ook op
          if (record.notes) {
            initialNotes[record.studentId.toString()] = record.notes;
          }
        }
      });
      
      setStudentAttendance(initialAttendance);
      setStudentNotes(initialNotes);
    }
  }, [attendanceRecords]);
  
  // Load initial teacher attendance data if available
  useEffect(() => {
    if (teacherAttendanceRecord && Array.isArray(teacherAttendanceRecord) && teacherAttendanceRecord.length > 0) {
      const record = teacherAttendanceRecord[0];
      
      if (record) {
        setTeacherAttendance(record.status || 'present');
        setTeacherNote(record.notes || '');
      }
    }
  }, [teacherAttendanceRecord]);

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <ClipboardCheck className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Aanwezigheid</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Registreer en beheer aanwezigheid van studenten en docenten
          </p>
        </div>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <Select value={selectedType} onValueChange={(value) => setSelectedType(value as 'vak' | 'klas')}>
              <SelectTrigger>
                <SelectValue placeholder="Selecteer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="vak">Vak</SelectItem>
                <SelectItem value="klas">Klas</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {selectedType === 'vak' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Vak</label>
              <Select value={selectedCourse} onValueChange={handleCourseChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer vak" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(courses) && courses.length > 0 ? (
                    courses.map(course => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.code} - {course.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>Geen vakken beschikbaar</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
          
          {selectedType === 'klas' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Klas</label>
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer klas" />
                </SelectTrigger>
                <SelectContent>
                  {Array.isArray(classes) && classes.length > 0 ? (
                    classes.map(cls => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.code} - {cls.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>Geen klassen beschikbaar</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
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
            <Tabs
              value={selectedTab}
              onValueChange={(value) => setSelectedTab(value as 'students' | 'teachers')}
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 p-1 bg-blue-900/10">
                <TabsTrigger value="students" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                  <User className="h-4 w-4" />
                  Studenten
                </TabsTrigger>
                <TabsTrigger value="teachers" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                  <UserCheck className="h-4 w-4" />
                  Docent
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Session info */}
      {session && (
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            {session.type === 'vak' ? (
              <h2 className="text-lg font-medium text-blue-800">Vak: {session.courseName}</h2>
            ) : (
              <h2 className="text-lg font-medium text-blue-800">Klas: {session.className}</h2>
            )}
            <p className="text-blue-600">{formatDate(session.date)}</p>
          </div>
        </div>
      )}
      
      <Tabs value={selectedTab} className="w-full">
        {/* Student Attendance Tab Content */}
        <TabsContent value="students" className="mt-0">
          {/* Mark All Buttons for Students */}
          {(selectedCourse || selectedClass) && (
            <div className="flex flex-wrap gap-2 mb-4">
              <Button onClick={() => handleMarkAll('present')} variant="outline" className="flex items-center">
                <CheckCircle className="h-4 w-4 mr-1 text-green-500" />
                Allen aanwezig
              </Button>
              <Button onClick={() => handleMarkAll('absent')} variant="outline" className="flex items-center">
                <XCircle className="h-4 w-4 mr-1 text-red-500" />
                Allen afwezig
              </Button>
              <Button onClick={() => handleMarkAll('late')} variant="outline" className="flex items-center">
                <Clock className="h-4 w-4 mr-1 text-yellow-500" />
                Allen te laat
              </Button>
              <Button onClick={handleSaveStudentAttendance} 
                disabled={saveStudentAttendanceMutation.isPending} 
                className="ml-auto flex items-center bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-4 w-4 mr-1" />
                Aanwezigheid opslaan
              </Button>
            </div>
          )}
          
          {/* Loading and error states */}
          {isLoadingStudentAttendance && (
            <div className="text-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full inline-block mb-3"></div>
              <p className="text-gray-600">Gegevens laden...</p>
            </div>
          )}

          {isErrorStudentAttendance && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg">
              <p>Er is een fout opgetreden bij het ophalen van de aanwezigheidsgegevens. Probeer de pagina te vernieuwen.</p>
            </div>
          )}

          {/* Student attendance list */}
          {!isLoadingStudentAttendance && !isErrorStudentAttendance && (selectedCourse || selectedClass) && (
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
                        Notities
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Statistiek
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                          {selectedType === 'vak' 
                            ? 'Geen studenten gevonden voor dit vak/datum.'
                            : 'Geen studenten gevonden voor deze klas/datum.'}
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
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => handleStudentNoteClick(student.id)}
                              className="flex items-center text-gray-600"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              {studentNotes[student.id] ? 'Notitie bekijken' : 'Notitie toevoegen'}
                              {studentNotes[student.id] && (
                                <Badge className="ml-2 bg-blue-100 text-blue-800 hover:bg-blue-200">1</Badge>
                              )}
                            </Button>
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

          {/* Student Attendance summary */}
          {!isLoadingStudentAttendance && !isErrorStudentAttendance && selectedCourse && students.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 mt-6">
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
        </TabsContent>
        
        {/* Teacher Attendance Tab Content */}
        <TabsContent value="teachers" className="mt-0">
          {isLoadingTeacherAttendance && (
            <div className="text-center p-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full inline-block mb-3"></div>
              <p className="text-gray-600">Gegevens laden...</p>
            </div>
          )}

          {isErrorTeacherAttendance && (
            <div className="bg-red-50 text-red-800 p-4 rounded-lg">
              <p>Er is een fout opgetreden bij het ophalen van de docentaanwezigheidsgegevens. Probeer de pagina te vernieuwen.</p>
            </div>
          )}
          
          {!isLoadingTeacherAttendance && !isErrorTeacherAttendance && (selectedCourse || selectedClass) && (
            <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h3 className="text-lg font-medium text-gray-800">
                  {selectedType === 'vak' 
                    ? `Uw aanwezigheid voor ${session?.courseName}`
                    : `Uw aanwezigheid voor ${session?.className}`}
                </h3>
                <Button 
                  onClick={handleSaveTeacherAttendance} 
                  disabled={saveTeacherAttendanceMutation.isPending}
                  className="flex items-center bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Save className="h-4 w-4 mr-1" />
                  Aanwezigheid opslaan
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Uw status voor deze les</label>
                  <div className="flex flex-wrap gap-3">
                    <Button 
                      variant={teacherAttendance === 'present' ? 'default' : 'outline'} 
                      onClick={() => handleTeacherAttendanceChange('present')}
                      className={teacherAttendance === 'present' ? 'bg-green-600 hover:bg-green-700' : ''}
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Aanwezig
                    </Button>
                    <Button 
                      variant={teacherAttendance === 'absent' ? 'default' : 'outline'} 
                      onClick={() => handleTeacherAttendanceChange('absent')}
                      className={teacherAttendance === 'absent' ? 'bg-red-600 hover:bg-red-700' : ''}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Afwezig
                    </Button>
                  </div>
                </div>
                
                {/* Verwijderd: Vervanging optie zoals verzocht */}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notities (optioneel)</label>
                  <Textarea
                    placeholder="Bijv. technische problemen, opmerking over de les..."
                    value={teacherNote}
                    onChange={handleTeacherNoteChange}
                    className="resize-y min-h-[100px]"
                  />
                </div>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
      
      {/* Notes Dialog */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Notitie toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een notitie toe over de aanwezigheid van deze student
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <Textarea
              placeholder="Bijv. reden voor afwezigheid, laat komen..."
              value={selectedStudentId ? studentNotes[selectedStudentId] || '' : ''}
              onChange={(e) => handleStudentNoteChange(e.target.value)}
              className="resize-y min-h-[150px]"
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Annuleren</Button>
            <Button onClick={handleSaveStudentNote}>Opslaan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}