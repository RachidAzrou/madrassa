import { useState, useEffect } from 'react';
import { 
  Filter, CheckCircle, XCircle, Clock, 
  ArrowLeft, ArrowRight, Save,
  ClipboardCheck, GraduationCap, Users2,
  Loader2, Users, Building, CalendarCheck
} from 'lucide-react';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  studentId: string;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  teacherId: string;
}

interface Program {
  id: number;
  name: string;
  code: string;
}

interface StudentGroup {
  id: number;
  name: string;
}

interface AttendanceRecord {
  id?: number;
  studentId: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  courseId?: number | null;
  classId?: number | null;
  notes?: string;
}

interface TeacherAttendanceRecord {
  id?: number;
  teacherId: number;
  date: string;
  status: 'present' | 'absent';
  courseId?: number | null;
  notes?: string;
}

export default function Attendance() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedType, setSelectedType] = useState<'klas'>('klas');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentAttendance, setStudentAttendance] = useState<Record<number, AttendanceRecord>>({});
  const [teacherAttendance, setTeacherAttendance] = useState<Record<number, TeacherAttendanceRecord>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch courses/programs
  const { data: programsResponse, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/programs'],
    staleTime: 60000,
  });
  
  const coursesData = programsResponse?.programs || [];
  
  // Fetch classes/student groups
  const { data: classesData, isLoading: isLoadingClasses } = useQuery<StudentGroup[]>({
    queryKey: ['/api/student-groups'],
    staleTime: 60000,
  });
  
  // Fetch students
  const { data: studentsResponse, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students'],
    staleTime: 60000,
  });
  
  const studentsData = studentsResponse?.students || [];
  
  // Fetch teachers
  const { data: teachersResponse, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['/api/teachers'],
    staleTime: 60000,
  });
  
  const teachersData = teachersResponse?.teachers || [];
  
  // Fetch attendance for selected date and course/class
  const { data: attendanceData, isLoading: isLoadingAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['/api/attendance/date', selectedDate, selectedType, selectedCourse, selectedClass],
    enabled: !!selectedDate && ((false && !!selectedCourse) || (selectedType === 'klas' && !!selectedClass)),
    staleTime: 0, // Always refetch when parameters change
  });
  
  // Fetch teacher attendance for selected date
  const { data: teacherAttendanceData, isLoading: isLoadingTeacherAttendance, refetch: refetchTeacherAttendance } = useQuery({
    queryKey: ['/api/teacher-attendance/date', selectedDate],
    enabled: !!selectedDate,
    staleTime: 0, // Always refetch when date changes
  });
  
  const saveMutation = useMutation({
    mutationFn: async (data: { studentRecords: AttendanceRecord[], teacherRecords: TeacherAttendanceRecord[] }) => {
      setIsSaving(true);
      // Save student attendance
      if (data.studentRecords.length > 0) {
        await apiRequest('/api/attendance/batch', {
          method: 'POST',
          body: data.studentRecords
        });
      }
      
      // Save teacher attendance
      if (data.teacherRecords.length > 0) {
        for (const record of data.teacherRecords) {
          await apiRequest('/api/teacher-attendance', {
            method: 'POST',
            body: record
          });
        }
      }
      
      return { success: true };
    },
    onSuccess: () => {
      toast({
        title: "Aanwezigheid opgeslagen",
        description: "De aanwezigheidsgegevens zijn succesvol opgeslagen.",
      });
      
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/attendance/date'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-attendance/date'] });
      
      // Reset state
      setStudentAttendance({});
      setTeacherAttendance({});
      setIsSaving(false);
      
      // Refetch data
      refetchAttendance();
      refetchTeacherAttendance();
    },
    onError: (error) => {
      console.error("Error saving attendance:", error);
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van de aanwezigheidsgegevens.",
        variant: "destructive",
      });
      setIsSaving(false);
    }
  });
  
  // Process attendance data when it changes
  useEffect(() => {
    if (attendanceData && Array.isArray(attendanceData)) {
      const attendanceMap: Record<number, AttendanceRecord> = {};
      
      attendanceData.forEach((record: AttendanceRecord) => {
        if (record.studentId) {
          attendanceMap[record.studentId] = record;
        }
      });
      
      setStudentAttendance(attendanceMap);
    }
  }, [attendanceData]);
  
  // Process teacher attendance data when it changes
  useEffect(() => {
    if (teacherAttendanceData && Array.isArray(teacherAttendanceData)) {
      const attendanceMap: Record<number, TeacherAttendanceRecord> = {};
      
      teacherAttendanceData.forEach((record: TeacherAttendanceRecord) => {
        if (record.teacherId) {
          attendanceMap[record.teacherId] = record;
        }
      });
      
      setTeacherAttendance(attendanceMap);
    }
  }, [teacherAttendanceData]);

  const handleDateChange = (increment: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + increment);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    setSelectedType('examen');
    setSelectedClass('');
    // Reset attendance records when selection changes
    setStudentAttendance({});
    setTeacherAttendance({});
  };
  
  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSelectedType('klas');
    setSelectedCourse('');
    // Reset attendance records when selection changes
    setStudentAttendance({});
    setTeacherAttendance({});
  };

  // Format date as "Day Month Year" in Dutch format
  const formatDate = (dateInput: string | Date) => {
    const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
    return date.toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  };
  
  // Mark student present
  const markStudentPresent = (studentId: number) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: {
        studentId,
        date: selectedDate,
        status: 'present',
        ...(selectedClass ? { classId: parseInt(selectedClass) } : {}),
        ...(selectedType === 'klas' && selectedClass ? { classId: parseInt(selectedClass) } : {})
      }
    }));
  };
  
  // Mark student late
  const markStudentLate = (studentId: number) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: {
        studentId,
        date: selectedDate,
        status: 'late',
        ...(selectedClass ? { classId: parseInt(selectedClass) } : {}),
        ...(selectedType === 'klas' && selectedClass ? { classId: parseInt(selectedClass) } : {})
      }
    }));
  };
  
  // Mark student absent
  const markStudentAbsent = (studentId: number) => {
    setStudentAttendance(prev => ({
      ...prev,
      [studentId]: {
        studentId,
        date: selectedDate,
        status: 'absent',
        ...(selectedClass ? { classId: parseInt(selectedClass) } : {}),
        ...(selectedType === 'klas' && selectedClass ? { classId: parseInt(selectedClass) } : {})
      }
    }));
  };
  
  // Mark teacher present
  const markTeacherPresent = (teacherId: number) => {
    setTeacherAttendance(prev => ({
      ...prev,
      [teacherId]: {
        teacherId,
        date: selectedDate,
        status: 'present',
        ...(selectedClass ? { classId: parseInt(selectedClass) } : {})
      }
    }));
  };
  
  // Mark teacher absent
  const markTeacherAbsent = (teacherId: number) => {
    setTeacherAttendance(prev => ({
      ...prev,
      [teacherId]: {
        teacherId,
        date: selectedDate,
        status: 'absent',
        ...(selectedClass ? { classId: parseInt(selectedClass) } : {})
      }
    }));
  };
  
  // Mark all students present
  const markAllStudentsPresent = () => {
    const newAttendance: Record<number, AttendanceRecord> = {};
    
    if (studentsData && Array.isArray(studentsData)) {
      studentsData.forEach((student: Student) => {
        newAttendance[student.id] = {
          studentId: student.id,
          date: selectedDate,
          status: 'present',
          ...(selectedClass ? { classId: parseInt(selectedClass) } : {}),
          ...(selectedType === 'klas' && selectedClass ? { classId: parseInt(selectedClass) } : {})
        };
      });
    }
    
    setStudentAttendance(newAttendance);
  };
  
  // Mark all students absent
  const markAllStudentsAbsent = () => {
    const newAttendance: Record<number, AttendanceRecord> = {};
    
    if (studentsData && Array.isArray(studentsData)) {
      studentsData.forEach((student: Student) => {
        newAttendance[student.id] = {
          studentId: student.id,
          date: selectedDate,
          status: 'absent',
          ...(selectedClass ? { classId: parseInt(selectedClass) } : {}),
          ...(selectedType === 'klas' && selectedClass ? { classId: parseInt(selectedClass) } : {})
        };
      });
    }
    
    setStudentAttendance(newAttendance);
  };
  
  // Mark all teachers present
  const markAllTeachersPresent = () => {
    const newAttendance: Record<number, TeacherAttendanceRecord> = {};
    
    if (teachersData && Array.isArray(teachersData)) {
      teachersData.forEach((teacher: Teacher) => {
        newAttendance[teacher.id] = {
          teacherId: teacher.id,
          date: selectedDate,
          status: 'present',
          ...(selectedClass ? { classId: parseInt(selectedClass) } : {})
        };
      });
    }
    
    setTeacherAttendance(newAttendance);
  };
  
  // Mark all teachers absent
  const markAllTeachersAbsent = () => {
    const newAttendance: Record<number, TeacherAttendanceRecord> = {};
    
    if (teachersData && Array.isArray(teachersData)) {
      teachersData.forEach((teacher: Teacher) => {
        newAttendance[teacher.id] = {
          teacherId: teacher.id,
          date: selectedDate,
          status: 'absent',
          ...(selectedClass ? { classId: parseInt(selectedClass) } : {})
        };
      });
    }
    
    setTeacherAttendance(newAttendance);
  };
  
  // Handle save button click
  const handleSave = () => {
    // Format student attendance records for API
    const studentRecords = Object.values(studentAttendance);
    
    // Format teacher attendance records for API
    const teacherRecords = Object.values(teacherAttendance);
    
    // Save records
    saveMutation.mutate({ studentRecords, teacherRecords });
  };

  // Helper to determine button styling based on attendance status
  const getStudentButtonStyle = (studentId: number, status: 'present' | 'absent' | 'late') => {
    const record = studentAttendance[studentId];
    if (!record) return {};
    
    if (record.status === status) {
      return status === 'present' 
        ? { className: "bg-green-600 hover:bg-green-700 text-white" }
        : status === 'late'
          ? { className: "bg-amber-600 hover:bg-amber-700 text-white border-amber-600" }
          : { className: "bg-red-600 hover:bg-red-700 text-white border-red-600" };
    }
    
    return status === 'present'
      ? { className: "border-green-600 text-green-600 hover:bg-green-50" }
      : status === 'late'
        ? { className: "border-amber-600 text-amber-600 hover:bg-amber-50" }
        : { className: "border-red-600 text-red-600 hover:bg-red-50" };
  };
  
  // Helper to determine button styling based on teacher attendance status
  const getTeacherButtonStyle = (teacherId: number, status: 'present' | 'absent') => {
    const record = teacherAttendance[teacherId];
    if (!record) return {};
    
    if (record.status === status) {
      return status === 'present'
        ? { className: "bg-green-600 hover:bg-green-700 text-white" }
        : { className: "bg-red-600 hover:bg-red-700 text-white border-red-600" };
    }
    
    return status === 'present'
      ? { className: "border-green-600 text-green-600 hover:bg-green-50" }
      : { className: "border-red-600 text-red-600 hover:bg-red-50" };
  };

  return (
    <div className="space-y-6">
      <PremiumHeader
        title="Aanwezigheid"
        path="Evaluatie > Aanwezigheid"
        icon={CalendarCheck}
        description="Registreer en beheer aanwezigheid van studenten, bekijk absentiegeschiedenis en identificeer trends"
      />
      {/* Attendance Content */}
      <Card className="mt-6 border-0 shadow-md overflow-hidden">
        <CardHeader className="pb-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
          <CardTitle className="text-blue-900 flex items-center text-lg">
            <div className="mr-3 h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
              <ClipboardCheck className="h-4 w-4 text-blue-800" />
            </div>
            Aanwezigheidsregistratie
          </CardTitle>
          <p className="text-sm text-gray-600">Registreer en beheer de aanwezigheid van studenten en docenten</p>
        </CardHeader>
        <CardContent className="p-6 bg-white">
          {/* Clean Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            {/* Date Navigation */}
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDateChange(-1)}
                className="h-9 px-3"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              
              <div className="px-4 py-2 bg-gray-50 border border-gray-200 rounded text-center min-w-[140px]">
                <span className="text-sm font-medium text-gray-900">{formatDate(selectedDate)}</span>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handleDateChange(1)}
                className="h-9 px-3"
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
              

            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <Select value={selectedClass} onValueChange={handleClassChange}>
                <SelectTrigger className="h-9 w-[240px] border-[#e5e7eb] bg-white">
                  <SelectValue placeholder="Selecteer klas" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#e5e7eb]">
                  {isLoadingClasses ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center">
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Klassen laden...
                      </div>
                    </SelectItem>
                  ) : classesData && Array.isArray(classesData) ? (
                    classesData.map((classroom: StudentGroup) => (
                      <SelectItem key={classroom.id} value={classroom.id.toString()} className="focus:bg-blue-200 hover:bg-blue-100">
                        {classroom.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>Geen klassen gevonden</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center">
              <Tabs defaultValue="students" className="w-full">
                <div className="flex justify-between items-center">
                  <TabsList className="w-3/4 grid grid-cols-2 bg-blue-900/10 rounded-md">
                    <TabsTrigger value="students" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">
                      <Users2 className="h-4 w-4 mr-2" />
                      Studenten
                    </TabsTrigger>
                    <TabsTrigger value="teachers" className="data-[state=active]:bg-white data-[state=active]:text-blue-900 data-[state=active]:shadow-sm">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Docenten
                    </TabsTrigger>
                  </TabsList>
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-blue-700 hover:bg-blue-800 text-white shadow-sm flex items-center gap-2"
                    onClick={handleSave}
                    disabled={isSaving || (Object.keys(studentAttendance).length === 0 && Object.keys(teacherAttendance).length === 0)}
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Opslaan
                  </Button>
                </div>

                <TabsContent value="students">
                  <div className="space-y-4 mt-6">
                    <div className="bg-white p-5 rounded-md border border-gray-200 mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="p-2 bg-[#1e40af] rounded-md">
                            <Users2 className="h-5 w-5 text-white" />
                          </div>
                          <div className="text-base font-medium text-gray-800 mb-1 sm:mb-0">Groepsacties</div>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
                          <div className="text-xs px-3 py-1.5 bg-white text-gray-800 rounded-sm border border-gray-200 font-medium">
                            Klas: {classesData?.find((c: any) => c.id.toString() === selectedClass)?.name || ''}
                          </div>
                          <div className="text-xs px-3 py-1.5 bg-white text-gray-800 rounded-sm border border-gray-200 font-medium">
                            Datum: {formatDate(selectedDate)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={markAllStudentsPresent} 
                          className="bg-white border-gray-300 text-[#1e40af] hover:bg-gray-50 flex-1 font-medium"
                          disabled={!studentsData || !Array.isArray(studentsData) || studentsData.length === 0}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Allen aanwezig
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={markAllStudentsAbsent} 
                          className="bg-white border-gray-300 text-[#1e40af] hover:bg-gray-50 flex-1 font-medium"
                          disabled={!studentsData || !Array.isArray(studentsData) || studentsData.length === 0}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Allen afwezig
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50 flex-1"
                          disabled={!studentsData || !Array.isArray(studentsData) || studentsData.length === 0}
                        >
                          <Clock className="h-4 w-4 mr-2" />
                          Allen te laat
                        </Button>
                      </div>
                    </div>
                    
                    {isLoadingStudents ? (
                      <div className="py-10 text-center bg-white rounded-md border border-gray-200">
                        <div className="h-12 w-12 mx-auto bg-[#1e40af] rounded-md flex items-center justify-center mb-3">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                        <p className="text-sm font-medium text-gray-800">Studenten laden...</p>
                        <p className="mt-1 text-xs text-gray-500">Even geduld a.u.b.</p>
                      </div>
                    ) : studentsData && Array.isArray(studentsData) && studentsData.length > 0 ? (
                      <div className="rounded-md border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 p-3 border-b border-gray-200 text-sm font-medium text-gray-700 grid grid-cols-12">
                          <div className="col-span-4 sm:col-span-4">Student</div>
                          <div className="hidden sm:block col-span-3">Studentnummer</div>
                          <div className="col-span-8 sm:col-span-5 text-right">Aanwezigheidsstatus</div>
                        </div>
                        <div className="divide-y divide-gray-100 bg-white">
                          {studentsData.map((student: Student) => {
                            const status = studentAttendance[student.id]?.status;
                            const statusBadge = status === 'present' 
                              ? <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-green-50 text-green-700 border border-green-100"><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Aanwezig</span>
                              : status === 'late'
                                ? <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100"><Clock className="h-3.5 w-3.5 mr-1.5" /> Te laat</span>
                                : status === 'absent'
                                  ? <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-red-50 text-red-700 border border-red-100"><XCircle className="h-3.5 w-3.5 mr-1.5" /> Afwezig</span>
                                  : <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">Niet ingevuld</span>;
                            
                            return (
                              <div key={student.id} className="grid grid-cols-12 items-center p-4 hover:bg-gray-50 transition-colors">
                                <div className="col-span-4 sm:col-span-4 font-medium flex items-center">
                                  <div className="h-10 w-10 rounded-md bg-gray-100 text-[#1e40af] flex items-center justify-center text-xs font-medium mr-3 border border-gray-200">
                                    {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-800">{student.firstName} {student.lastName}</div>
                                    <div className="text-xs text-gray-500 sm:hidden mt-0.5">{student.studentId}</div>
                                  </div>
                                </div>
                                
                                <div className="hidden sm:block col-span-3 text-sm text-gray-600 font-medium">
                                  {student.studentId}
                                </div>
                                
                                <div className="col-span-8 sm:col-span-5 flex flex-wrap justify-end gap-2">
                                  <div className="flex-shrink-0 sm:hidden mb-2 mr-auto ml-1">
                                    {statusBadge}
                                  </div>
                                  <div className="hidden sm:block mr-auto">
                                    {statusBadge}
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    {...getStudentButtonStyle(student.id, 'present')}
                                    onClick={() => markStudentPresent(student.id)}
                                    className="flex-1 sm:flex-initial max-w-[90px] border-gray-200 rounded-sm hover:bg-gray-50 hover:text-[#1e40af]"
                                  >
                                    <CheckCircle className="h-4 w-4 sm:mr-1.5" />
                                    <span className="hidden sm:inline font-medium">Aanwezig</span>
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    {...getStudentButtonStyle(student.id, 'late')}
                                    onClick={() => markStudentLate(student.id)}
                                    className="flex-1 sm:flex-initial max-w-[90px] border-gray-200 rounded-sm hover:bg-gray-50 hover:text-[#1e40af]"
                                  >
                                    <Clock className="h-4 w-4 sm:mr-1.5" />
                                    <span className="hidden sm:inline font-medium">Te laat</span>
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    {...getStudentButtonStyle(student.id, 'absent')}
                                    onClick={() => markStudentAbsent(student.id)}
                                    className="flex-1 sm:flex-initial max-w-[90px] border-gray-200 rounded-sm hover:bg-gray-50 hover:text-[#1e40af]"
                                  >
                                    <XCircle className="h-4 w-4 sm:mr-1.5" />
                                    <span className="hidden sm:inline font-medium">Afwezig</span>
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 flex flex-col items-center justify-center text-gray-500">
                        <div className="text-[#1e3a8a] mb-2">
                          <Users className="h-12 w-12 mx-auto opacity-30" />
                        </div>
                        <p className="text-sm font-medium">Geen studenten gevonden</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="teachers">
                  <div className="space-y-4 mt-6">
                    <div className="bg-slate-50 p-4 rounded-md border shadow-sm mb-6">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-3">
                        <div className="text-base font-medium text-gray-800 mb-2 sm:mb-0">Docentacties</div>
                        
                        <div className="flex items-center space-x-2">
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-sm border border-gray-200">
                            Klas: {classesData?.find((c) => c.id.toString() === selectedClass)?.name || ''}
                          </span>
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-sm border border-gray-200">
                            Datum: {formatDate(selectedDate)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row gap-3">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={markAllTeachersPresent} 
                          className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#1e40af] flex-1 rounded-sm"
                          disabled={!teachersData || teachersData.length === 0}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Allen aanwezig
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={markAllTeachersAbsent} 
                          className="bg-white border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-[#1e40af] flex-1 rounded-sm"
                          disabled={!teachersData || teachersData.length === 0}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Allen afwezig
                        </Button>
                      </div>
                    </div>
                    
                    {isLoadingTeachers ? (
                      <div className="py-10 text-center bg-white rounded-md border border-gray-200">
                        <div className="h-12 w-12 mx-auto bg-[#1e40af] rounded-md flex items-center justify-center mb-3">
                          <Loader2 className="h-6 w-6 text-white animate-spin" />
                        </div>
                        <p className="text-sm font-medium text-gray-800">Docenten laden...</p>
                        <p className="mt-1 text-xs text-gray-500">Even geduld a.u.b.</p>
                      </div>
                    ) : teachersData && teachersData.length > 0 ? (
                      <div className="rounded-md border border-gray-200 overflow-hidden">
                        <div className="bg-gray-50 p-3 border-b border-gray-200 text-sm font-medium text-gray-700 grid grid-cols-12">
                          <div className="col-span-5 sm:col-span-4">Docent</div>
                          <div className="hidden sm:block col-span-3">Docentnummer</div>
                          <div className="col-span-7 sm:col-span-5 text-right">Aanwezigheidsstatus</div>
                        </div>
                        <div className="divide-y divide-gray-100 bg-white">
                          {teachersData.map((teacher) => {
                            const status = teacherAttendance[teacher.id]?.status;
                            const statusBadge = status === 'present' 
                              ? <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-green-50 text-green-700 border border-green-100"><CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Aanwezig</span>
                              : status === 'absent'
                                ? <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-red-50 text-red-700 border border-red-100"><XCircle className="h-3.5 w-3.5 mr-1.5" /> Afwezig</span>
                                : <span className="inline-flex items-center px-2.5 py-1 rounded-sm text-xs font-medium bg-gray-50 text-gray-600 border border-gray-100">Niet ingevuld</span>;
                            
                            return (
                              <div key={teacher.id} className="grid grid-cols-12 items-center p-4 hover:bg-gray-50 transition-colors">
                                <div className="col-span-5 sm:col-span-4 font-medium flex items-center">
                                  <div className="h-10 w-10 rounded-md bg-gray-100 text-[#1e40af] flex items-center justify-center text-xs font-medium mr-3 border border-gray-200">
                                    {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-800">{teacher.firstName} {teacher.lastName}</div>
                                    <div className="text-xs text-gray-500 sm:hidden mt-0.5">{teacher.teacherId}</div>
                                  </div>
                                </div>
                                
                                <div className="hidden sm:block col-span-3 text-sm text-gray-600 font-medium">
                                  {teacher.teacherId}
                                </div>
                                
                                <div className="col-span-7 sm:col-span-5 flex flex-wrap justify-end gap-2">
                                  <div className="flex-shrink-0 sm:hidden mb-2 mr-auto ml-1">
                                    {statusBadge}
                                  </div>
                                  <div className="hidden sm:block mr-auto">
                                    {statusBadge}
                                  </div>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    {...getTeacherButtonStyle(teacher.id, 'present')}
                                    onClick={() => markTeacherPresent(teacher.id)}
                                    className="flex-1 sm:flex-initial max-w-[100px] border-gray-200 rounded-sm hover:bg-gray-50 hover:text-[#1e40af]"
                                  >
                                    <CheckCircle className="h-4 w-4 sm:mr-1.5" />
                                    <span className="hidden sm:inline font-medium">Aanwezig</span>
                                  </Button>
                                  <Button 
                                    variant="outline" 
                                    size="sm" 
                                    {...getTeacherButtonStyle(teacher.id, 'absent')}
                                    onClick={() => markTeacherAbsent(teacher.id)}
                                    className="flex-1 sm:flex-initial max-w-[100px] border-gray-200 rounded-sm hover:bg-gray-50 hover:text-[#1e40af]"
                                  >
                                    <XCircle className="h-4 w-4 sm:mr-1.5" />
                                    <span className="hidden sm:inline font-medium">Afwezig</span>
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <div className="h-48 flex flex-col items-center justify-center text-gray-500">
                        <div className="text-[#1e3a8a] mb-2">
                          <GraduationCap className="h-12 w-12 mx-auto opacity-30" />
                        </div>
                        <p className="text-sm font-medium">Geen docenten gevonden</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}