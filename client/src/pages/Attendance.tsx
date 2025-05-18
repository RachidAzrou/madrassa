import { useState, useEffect } from 'react';
import { 
  Filter, CheckCircle, XCircle, Clock, 
  ArrowLeft, ArrowRight, Save,
  ClipboardCheck, GraduationCap, Users2,
  Loader2
} from 'lucide-react';
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
  const [selectedType, setSelectedType] = useState<'vak' | 'klas'>('vak');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [studentAttendance, setStudentAttendance] = useState<Record<number, AttendanceRecord>>({});
  const [teacherAttendance, setTeacherAttendance] = useState<Record<number, TeacherAttendanceRecord>>({});
  const [isSaving, setIsSaving] = useState(false);
  
  // Fetch courses/programs
  const { data: coursesData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/programs'],
    staleTime: 60000,
  });
  
  // Fetch classes/student groups
  const { data: classesData, isLoading: isLoadingClasses } = useQuery({
    queryKey: ['/api/student-groups'],
    staleTime: 60000,
  });
  
  // Fetch students
  const { data: studentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students'],
    staleTime: 60000,
  });
  
  // Fetch teachers
  const { data: teachersData, isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['/api/teachers'],
    staleTime: 60000,
  });
  
  // Fetch attendance for selected date and course/class
  const { data: attendanceData, isLoading: isLoadingAttendance, refetch: refetchAttendance } = useQuery({
    queryKey: ['/api/attendance/date', selectedDate, selectedType, selectedCourse, selectedClass],
    enabled: !!selectedDate && ((selectedType === 'vak' && !!selectedCourse) || (selectedType === 'klas' && !!selectedClass)),
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
    setSelectedType('vak');
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
        ...(selectedType === 'vak' && selectedCourse ? { courseId: parseInt(selectedCourse) } : {}),
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
        ...(selectedType === 'vak' && selectedCourse ? { courseId: parseInt(selectedCourse) } : {}),
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
        ...(selectedType === 'vak' && selectedCourse ? { courseId: parseInt(selectedCourse) } : {}),
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
        ...(selectedType === 'vak' && selectedCourse ? { courseId: parseInt(selectedCourse) } : {})
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
        ...(selectedType === 'vak' && selectedCourse ? { courseId: parseInt(selectedCourse) } : {})
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
          ...(selectedType === 'vak' && selectedCourse ? { courseId: parseInt(selectedCourse) } : {}),
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
          ...(selectedType === 'vak' && selectedCourse ? { courseId: parseInt(selectedCourse) } : {}),
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
          ...(selectedType === 'vak' && selectedCourse ? { courseId: parseInt(selectedCourse) } : {})
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
          ...(selectedType === 'vak' && selectedCourse ? { courseId: parseInt(selectedCourse) } : {})
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
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4">
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
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Datum selectie paneel */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-900 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-900" />
              Datum
            </CardTitle>
            <p className="text-sm font-medium text-gray-700">{formatDate(selectedDate)}</p>
            <p className="text-sm text-gray-500">Selecteer een datum om aanwezigheid te registreren</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col space-y-4">
              <div className="flex space-x-3">
                <Button variant="outline" size="sm" onClick={() => handleDateChange(-1)} className="flex-1">
                  <ArrowLeft className="h-4 w-4 mr-1" /> 
                  <span>Vorige dag</span>
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDateChange(1)} className="flex-1">
                  <span>Volgende dag</span> <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              <div className="mt-3 text-center p-2 bg-blue-50 border border-blue-100 rounded-md">
                <span className="text-blue-900 font-medium">{formatDate(selectedDate)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Filters */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-900 flex items-center">
              <Filter className="h-5 w-5 mr-2 text-blue-900" />
              Filters
            </CardTitle>
            <p className="text-sm text-gray-500">Selecteer gegevens om de aanwezigheid te filteren</p>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="vak" onValueChange={(value) => setSelectedType(value as 'vak' | 'klas')}>
              <TabsList className="w-full mb-4 bg-blue-900/10">
                <TabsTrigger value="vak">Vak</TabsTrigger>
                <TabsTrigger value="klas">Klas</TabsTrigger>
              </TabsList>
              
              <TabsContent value="vak">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vak</label>
                  <Select value={selectedCourse} onValueChange={handleCourseChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecteer vak" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingCourses ? (
                        <SelectItem value="loading" disabled>Vakken laden...</SelectItem>
                      ) : coursesData && Array.isArray(coursesData) ? (
                        coursesData.map((course: Program) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.code} - {course.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>Geen vakken gevonden</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
              
              <TabsContent value="klas">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Klas</label>
                  <Select value={selectedClass} onValueChange={handleClassChange}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecteer klas" />
                    </SelectTrigger>
                    <SelectContent>
                      {isLoadingClasses ? (
                        <SelectItem value="loading" disabled>Klassen laden...</SelectItem>
                      ) : classesData && Array.isArray(classesData) ? (
                        classesData.map((classroom: StudentGroup) => (
                          <SelectItem key={classroom.id} value={classroom.id.toString()}>
                            {classroom.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>Geen klassen gevonden</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Content */}
      <Card className="mt-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-blue-900 flex items-center">
            <ClipboardCheck className="h-5 w-5 mr-2 text-blue-900" />
            Aanwezigheidsregistratie
          </CardTitle>
          <p className="text-sm text-gray-500">Registreer en beheer de aanwezigheid van studenten en docenten</p>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-6">
            <div className="flex justify-between items-center">
              <Tabs defaultValue="students" className="w-full">
                <div className="flex justify-between items-center">
                  <TabsList className="w-3/4 grid grid-cols-2 bg-blue-900/10">
                    <TabsTrigger value="students">
                      <Users2 className="h-4 w-4 mr-2" />
                      Studenten
                    </TabsTrigger>
                    <TabsTrigger value="teachers">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Docenten
                    </TabsTrigger>
                  </TabsList>
                  
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="bg-blue-900 hover:bg-blue-800" 
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
                    <div className="bg-slate-50 p-3 px-4 rounded-md border shadow-sm mb-6">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 mb-3">Groepsacties</div>
                      </div>
                      <div className="flex gap-3 justify-around">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={markAllStudentsPresent} 
                          className="bg-white border-green-600 text-green-600 hover:bg-green-50 flex-1"
                          disabled={!studentsData || !Array.isArray(studentsData) || studentsData.length === 0}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Allen aanwezig
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={markAllStudentsAbsent} 
                          className="bg-white border-red-600 text-red-600 hover:bg-red-50 flex-1"
                          disabled={!studentsData || !Array.isArray(studentsData) || studentsData.length === 0}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Allen afwezig
                        </Button>
                      </div>
                    </div>
                    
                    {isLoadingStudents ? (
                      <div className="py-8 text-center">
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                        <p className="mt-2 text-sm text-gray-500">Studenten laden...</p>
                      </div>
                    ) : studentsData && Array.isArray(studentsData) && studentsData.length > 0 ? (
                      <div className="rounded-md border shadow-sm overflow-hidden">
                        <div className="grid grid-cols-2 bg-slate-100 p-3 text-xs font-medium text-slate-700">
                          <div>Student</div>
                          <div className="text-right">Acties</div>
                        </div>
                        <div className="divide-y bg-white">
                          {studentsData.map((student: Student) => (
                            <div key={student.id} className="grid grid-cols-2 items-center p-3 hover:bg-gray-50">
                              <div className="font-medium">
                                {student.firstName} {student.lastName}
                                <span className="ml-2 text-xs text-gray-500">{student.studentId}</span>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant={studentAttendance[student.id]?.status === 'present' ? 'default' : 'outline'} 
                                  size="sm" 
                                  {...getStudentButtonStyle(student.id, 'present')}
                                  onClick={() => markStudentPresent(student.id)}
                                >
                                  Aanwezig
                                </Button>
                                <Button 
                                  variant={studentAttendance[student.id]?.status === 'late' ? 'default' : 'outline'} 
                                  size="sm" 
                                  {...getStudentButtonStyle(student.id, 'late')}
                                  onClick={() => markStudentLate(student.id)}
                                >
                                  Te laat
                                </Button>
                                <Button 
                                  variant={studentAttendance[student.id]?.status === 'absent' ? 'default' : 'outline'} 
                                  size="sm" 
                                  {...getStudentButtonStyle(student.id, 'absent')}
                                  onClick={() => markStudentAbsent(student.id)}
                                >
                                  Afwezig
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center border rounded-md">
                        <p className="text-sm text-gray-500">Geen studenten gevonden</p>
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="teachers">
                  <div className="space-y-4 mt-6">
                    <div className="bg-slate-50 p-3 px-4 rounded-md border shadow-sm mb-6">
                      <div className="text-center">
                        <div className="text-sm font-medium text-gray-700 mb-3">Groepsacties</div>
                      </div>
                      <div className="flex gap-3 justify-around">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={markAllTeachersPresent} 
                          className="bg-white border-green-600 text-green-600 hover:bg-green-50 flex-1"
                          disabled={!teachersData || !Array.isArray(teachersData) || teachersData.length === 0}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Allen aanwezig
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={markAllTeachersAbsent} 
                          className="bg-white border-red-600 text-red-600 hover:bg-red-50 flex-1"
                          disabled={!teachersData || !Array.isArray(teachersData) || teachersData.length === 0}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Allen afwezig
                        </Button>
                      </div>
                    </div>
                    
                    {isLoadingTeachers ? (
                      <div className="py-8 text-center">
                        <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                        <p className="mt-2 text-sm text-gray-500">Docenten laden...</p>
                      </div>
                    ) : teachersData && Array.isArray(teachersData) && teachersData.length > 0 ? (
                      <div className="rounded-md border shadow-sm overflow-hidden">
                        <div className="grid grid-cols-2 bg-slate-100 p-3 text-xs font-medium text-slate-700">
                          <div>Docent</div>
                          <div className="text-right">Acties</div>
                        </div>
                        <div className="divide-y bg-white">
                          {teachersData.map((teacher: Teacher) => (
                            <div key={teacher.id} className="grid grid-cols-2 items-center p-3 hover:bg-gray-50">
                              <div className="font-medium">
                                {teacher.firstName} {teacher.lastName}
                                <span className="ml-2 text-xs text-gray-500">{teacher.teacherId}</span>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button 
                                  variant={teacherAttendance[teacher.id]?.status === 'present' ? 'default' : 'outline'} 
                                  size="sm" 
                                  {...getTeacherButtonStyle(teacher.id, 'present')}
                                  onClick={() => markTeacherPresent(teacher.id)}
                                >
                                  Aanwezig
                                </Button>
                                <Button 
                                  variant={teacherAttendance[teacher.id]?.status === 'absent' ? 'default' : 'outline'} 
                                  size="sm" 
                                  {...getTeacherButtonStyle(teacher.id, 'absent')}
                                  onClick={() => markTeacherAbsent(teacher.id)}
                                >
                                  Afwezig
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center border rounded-md">
                        <p className="text-sm text-gray-500">Geen docenten gevonden</p>
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