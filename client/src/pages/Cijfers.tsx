import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Save, Plus, X, Edit, Trash2, AlertCircle, Percent } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Progress } from "@/components/ui/progress";

export default function Cijfers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('grades'); // 'grades' of 'behavior'
  const [selectedClass, setSelectedClass] = useState(''); 
  const [studentFilter, setStudentFilter] = useState('');
  
  // Voor cijfers
  const [subjectGrades, setSubjectGrades] = useState<Record<string, Record<string, number>>>({});
  const [isGradesModified, setIsGradesModified] = useState(false);
  
  // Voor gedragsbeoordelingen
  const [behaviorScores, setBehaviorScores] = useState<Record<string, number>>({});
  const [behaviorRemarks, setBehaviorRemarks] = useState<Record<string, string>>({});
  const [isBehaviorModified, setIsBehaviorModified] = useState(false);
  
  // Fetch klassen voor dropdown
  const { data: classesData } = useQuery<any>({
    queryKey: ['/api/student-groups'],
    staleTime: 300000,
  });
  
  const classes = classesData?.studentGroups || [];

  // Fetch vakken
  const { data: coursesData } = useQuery<any>({
    queryKey: ['/api/courses'],
    staleTime: 300000,
  });

  const courses = coursesData?.courses || [];
  
  // Fetch studenten voor de geselecteerde klas
  const { data: classStudentsData, isLoading: isLoadingClassStudents } = useQuery<any[]>({
    queryKey: ['/api/student-groups', selectedClass, 'students'],
    queryFn: async () => {
      if (!selectedClass) return [];
      const response = await apiRequest('GET', `/api/student-groups/${selectedClass}/students`);
      return response;
    },
    staleTime: 60000,
    enabled: !!selectedClass,
  });
  
  const students = classStudentsData || [];
    
  // Filter studenten op basis van zoekopdracht
  const filteredStudents = studentFilter 
    ? students.filter(student => 
        student.firstName.toLowerCase().includes(studentFilter.toLowerCase()) ||
        student.lastName.toLowerCase().includes(studentFilter.toLowerCase()) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(studentFilter.toLowerCase())
      )
    : students;

  // Fetch cijfers voor de geselecteerde klas
  const { data: gradesData, isLoading: isLoadingGrades } = useQuery<any[]>({
    queryKey: ['/api/grades/class', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      // Dit is een voorbeeld eindpunt, moet mogelijk aangepast worden aan de API
      const response = await apiRequest('GET', `/api/grades/class/${selectedClass}`);
      return response;
    },
    staleTime: 60000,
    enabled: !!selectedClass,
  });
  
  // Fetch gedragsbeoordelingen voor de geselecteerde klas
  const { data: behaviorData, isLoading: isLoadingBehavior } = useQuery<any[]>({
    queryKey: ['/api/behavior-assessments/class', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      // Dit is een voorbeeld eindpunt, moet mogelijk aangepast worden aan de API
      const response = await apiRequest('GET', `/api/behavior-assessments/class/${selectedClass}`);
      return response;
    },
    staleTime: 60000,
    enabled: !!selectedClass && activeTab === 'behavior',
  });
  
  // Effect om aanwezigheidsdata te laden voor punctualiteitsberekening
  useEffect(() => {
    if (selectedClass && students.length > 0 && activeTab === 'behavior') {
      const loadAttendanceData = async () => {
        const newBehaviorScores = { ...behaviorScores };
        const newBehaviorRemarks = { ...behaviorRemarks };
        
        for (const student of students) {
          try {
            // Hier zou de echte aanwezigheidsdata worden opgehaald
            const attendanceData = await fetchAttendanceForStudent(student.id);
            
            // Berekenen van punctualiteit op basis van aanwezigheidsgegevens
            const punctualityScore = calculatePunctualityScore(attendanceData);
            
            // Alleen bijwerken als er nog geen score is
            if (!behaviorScores[student.id]) {
              newBehaviorScores[student.id] = punctualityScore;
              newBehaviorRemarks[student.id] = getPunctualityRemark(punctualityScore);
            }
          } catch (error) {
            console.error(`Error loading attendance for student ${student.id}:`, error);
          }
        }
        
        setBehaviorScores(newBehaviorScores);
        setBehaviorRemarks(newBehaviorRemarks);
      };
      
      loadAttendanceData();
    }
  }, [selectedClass, students, activeTab]);
  
  // Effect om bestaande cijferdata te laden
  useEffect(() => {
    if (gradesData && gradesData.length > 0) {
      const newGrades: Record<string, Record<string, number>> = {};
      
      gradesData.forEach((grade: any) => {
        const { studentId, courseId, score } = grade;
        
        if (!newGrades[studentId]) {
          newGrades[studentId] = {};
        }
        
        newGrades[studentId][courseId] = score;
      });
      
      setSubjectGrades(newGrades);
    }
  }, [gradesData]);
  
  // Mutation voor het opslaan van cijfers
  const saveGradesMutation = useMutation({
    mutationFn: async (grades: any[]) => {
      return await apiRequest('POST', '/api/grades/batch', grades);
    },
    onSuccess: () => {
      toast({
        title: 'Cijfers opgeslagen',
        description: 'Studentcijfers zijn succesvol bijgewerkt.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grades/class'] });
      setIsGradesModified(false);
    },
    onError: () => {
      toast({
        title: 'Fout bij opslaan van cijfers',
        description: 'Er is een fout opgetreden bij het opslaan van cijfers. Probeer het opnieuw.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation voor het opslaan van gedragsbeoordelingen
  const saveBehaviorAssessmentsMutation = useMutation({
    mutationFn: async (assessments: any[]) => {
      return await apiRequest('POST', '/api/behavior-assessments/batch', assessments);
    },
    onSuccess: () => {
      toast({
        title: 'Beoordelingen opgeslagen',
        description: 'Gedragsbeoordelingen zijn succesvol bijgewerkt.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/behavior-assessments/class'] });
      setIsBehaviorModified(false);
    },
    onError: () => {
      toast({
        title: 'Fout bij opslaan van beoordelingen',
        description: 'Er is een fout opgetreden bij het opslaan van gedragsbeoordelingen. Probeer het opnieuw.',
        variant: 'destructive',
      });
    },
  });

  const handleClassChange = (value: string) => {
    setSelectedClass(value);
    setSubjectGrades({});
    setBehaviorScores({});
    setBehaviorRemarks({});
    setIsGradesModified(false);
    setIsBehaviorModified(false);
  };

  const handleGradeChange = (studentId: string, courseId: string, value: string) => {
    const numericValue = parseFloat(value);
    
    if (!isNaN(numericValue)) {
      setSubjectGrades(prev => {
        const studentGrades = prev[studentId] || {};
        return {
          ...prev,
          [studentId]: {
            ...studentGrades,
            [courseId]: numericValue
          }
        };
      });
      setIsGradesModified(true);
    }
  };
  
  const handleBehaviorScoreChange = (studentId: string, value: string) => {
    const numericValue = parseInt(value);
    
    if (!isNaN(numericValue) && numericValue >= 1 && numericValue <= 5) {
      setBehaviorScores(prev => ({
        ...prev,
        [studentId]: numericValue
      }));
      
      // Automatische opmerking genereren
      const remark = getAutomaticBehaviorRemark(numericValue);
      setBehaviorRemarks(prev => ({
        ...prev,
        [studentId]: remark
      }));
      
      setIsBehaviorModified(true);
    }
  };
  
  const handleBehaviorRemarkChange = (studentId: string, value: string) => {
    setBehaviorRemarks(prev => ({
      ...prev,
      [studentId]: value
    }));
    setIsBehaviorModified(true);
  };
  
  // Fetch attendance data for student attendance analysis
  const fetchAttendanceForStudent = async (studentId: string) => {
    try {
      // Dit is een voorbeeld eindpunt, moet mogelijk aangepast worden aan de API
      const attendance = await apiRequest('GET', `/api/students/${studentId}/attendance`);
      return attendance || [];
    } catch (error) {
      console.error("Error fetching attendance:", error);
      return [];
    }
  };
  
  // Calculate punctuality score based on attendance
  const calculatePunctualityScore = (attendanceData: any[]): number => {
    if (!Array.isArray(attendanceData) || attendanceData.length === 0) {
      return 3; // Default score when no data available
    }
    
    // Count absences and lates
    const totalRecords = attendanceData.length;
    let lateCount = 0;
    let absentCount = 0;
    
    attendanceData.forEach((record: any) => {
      if (record.status === 'Late') {
        lateCount++;
      } else if (record.status === 'Absent') {
        absentCount++;
      }
    });
    
    // Calculate percentages
    const absentPercentage = (absentCount / totalRecords) * 100;
    const latePercentage = (lateCount / totalRecords) * 100;
    
    // Determine score based on percentages
    if (absentPercentage === 0 && latePercentage <= 5) return 5;
    if (absentPercentage <= 5 && latePercentage <= 10) return 4;
    if (absentPercentage <= 10 && latePercentage <= 20) return 3;
    if (absentPercentage <= 20 && latePercentage <= 30) return 2;
    return 1;
  };
  
  // Generate behavior remarks
  const getAutomaticBehaviorRemark = (score: number): string => {
    switch(score) {
      case 1:
        return "Gedrag is zorgwekkend. Student vertoont regelmatig storend gedrag en heeft moeite met het volgen van instructies.";
      case 2:
        return "Gedrag moet verbeteren. Student moet werken aan houding in de klas en respect voor medeleerlingen.";
      case 3:
        return "Gedrag is voldoende. Student volgt meestal de regels maar heeft soms aanmoediging nodig.";
      case 4:
        return "Gedrag is goed. Student toont respect en werkt constructief samen met anderen.";
      case 5:
        return "Uitstekend gedrag. Student is een rolmodel voor anderen en toont constant respect en verantwoordelijkheid.";
      default:
        return "";
    }
  };
  
  // Generate punctuality remarks
  const getPunctualityRemark = (score: number): string => {
    switch(score) {
      case 1:
        return "Zeer vaak afwezig of te laat. Dit heeft een ernstige impact op het leerproces.";
      case 2:
        return "Regelmatig afwezig of te laat. Dit verstoort de continuïteit van het leerproces.";
      case 3:
        return "Aanwezigheid kan beter. Soms te laat of afwezig, maar niet problematisch.";
      case 4:
        return "Goede aanwezigheid. Zelden afwezig of te laat.";
      case 5:
        return "Uitstekende aanwezigheid. Altijd op tijd en zelden of nooit afwezig.";
      default:
        return "";
    }
  };
  
  // Determine grade status text and color
  const getGradeStatus = (score: number) => {
    if (score >= 80) return { text: 'Uitstekend', color: 'bg-green-100 text-green-800' };
    if (score >= 70) return { text: 'Goed', color: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { text: 'Voldoende', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 50) return { text: 'Matig', color: 'bg-orange-100 text-orange-800' };
    return { text: 'Onvoldoende', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <Percent className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Cijfers</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Beheer cijfers en gedragsbeoordelingen van studenten
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Rapportages Exporteren
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="space-y-5">
        {/* Tab selector en filters */}
        <div className="flex flex-col lg:flex-row lg:items-start gap-4">
          <div className="flex-1 space-y-4">
            <Tabs
              defaultValue={activeTab}
              className="w-full"
              onValueChange={(value) => {
                setActiveTab(value);
                setSelectedClass('');
                setSubjectGrades({});
                setBehaviorScores({});
                setBehaviorRemarks({});
                setIsGradesModified(false);
                setIsBehaviorModified(false);
              }}
            >
              <TabsList className="grid w-full max-w-md grid-cols-2">
                <TabsTrigger value="grades">Cijfers</TabsTrigger>
                <TabsTrigger value="behavior">Gedragsbeoordelingen</TabsTrigger>
              </TabsList>

              <TabsContent value="grades" className="pt-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-1/3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Klas</label>
                      <Select value={selectedClass} onValueChange={handleClassChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een klas" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.length === 0 ? (
                            <SelectItem value="empty-class">Geen klassen gevonden</SelectItem>
                          ) : (
                            classes.map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full md:w-1/3">
                      <div className="relative flex items-center mt-6">
                        <Search className="absolute left-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type="search"
                          placeholder="Zoek studenten..."
                          className="pl-8"
                          value={studentFilter}
                          onChange={(e) => setStudentFilter(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cijferstabel */}
                  <div className="bg-white shadow rounded-lg border overflow-hidden">
                    {!selectedClass ? (
                      <div className="p-8 text-center text-gray-500">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium">Geen gegevens beschikbaar</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Selecteer een klas om cijfers te beheren.
                        </p>
                      </div>
                    ) : isLoadingClassStudents || isLoadingGrades ? (
                      <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-[#1e3a8a]"></div>
                        <p className="mt-2 text-sm text-gray-500">Gegevens laden...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-[200px]">Student</TableHead>
                              {courses.map((course: any) => (
                                <TableHead key={course.id} className="text-center">
                                  {course.name}
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStudents.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={courses.length + 1} className="text-center text-sm text-gray-500">
                                  Geen studenten gevonden voor deze klas of zoekopdracht.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredStudents.map((student: any) => (
                                <TableRow key={student.id}>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <Avatar className="h-8 w-8 mr-3">
                                        <AvatarFallback className="bg-[#1e3a8a] text-white">
                                          {student.firstName.charAt(0)}
                                          {student.lastName.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div>
                                        <div className="text-sm font-medium text-gray-900">
                                          {student.firstName} {student.lastName}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                          ID: {student.studentId}
                                        </div>
                                      </div>
                                    </div>
                                  </TableCell>
                                  
                                  {courses.map((course: any) => {
                                    const courseId = course.id.toString();
                                    const studentGrades = subjectGrades[student.id] || {};
                                    const grade = studentGrades[courseId];
                                    
                                    return (
                                      <TableCell key={`${student.id}-${courseId}`} className="text-center">
                                        <div className="flex flex-col items-center">
                                          <Input
                                            type="number"
                                            min="0"
                                            max="100"
                                            className="w-20 text-center"
                                            value={grade !== undefined ? grade : ''}
                                            onChange={(e) => handleGradeChange(student.id, courseId, e.target.value)}
                                          />
                                          {grade !== undefined && (
                                            <Badge className={`mt-1 ${getGradeStatus(grade).color}`}>
                                              {getGradeStatus(grade).text}
                                            </Badge>
                                          )}
                                        </div>
                                      </TableCell>
                                    );
                                  })}
                                </TableRow>
                              ))
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                    
                    {/* Save button for grades */}
                    {selectedClass && filteredStudents.length > 0 && courses.length > 0 && (
                      <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                        <Button
                          onClick={() => {
                            const gradesToSave: any[] = [];
                            
                            // Convert the subjectGrades state to an array of grade objects
                            Object.entries(subjectGrades).forEach(([studentId, grades]) => {
                              Object.entries(grades).forEach(([courseId, score]) => {
                                gradesToSave.push({
                                  studentId: parseInt(studentId),
                                  courseId: parseInt(courseId),
                                  score: score,
                                  date: new Date().toISOString().split('T')[0]
                                });
                              });
                            });
                            
                            if (gradesToSave.length > 0) {
                              saveGradesMutation.mutate(gradesToSave);
                            } else {
                              toast({
                                title: 'Geen wijzigingen',
                                description: 'Er zijn geen cijferwijzigingen om op te slaan.',
                              });
                            }
                          }}
                          disabled={!isGradesModified || saveGradesMutation.isPending}
                          className="bg-[#1e3a8a] hover:bg-blue-800 flex items-center"
                        >
                          {saveGradesMutation.isPending ? (
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent"></div>
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Cijfers Opslaan
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="behavior" className="pt-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="w-full md:w-1/3">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Klas</label>
                      <Select value={selectedClass} onValueChange={handleClassChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een klas" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.length === 0 ? (
                            <SelectItem value="empty-class">Geen klassen gevonden</SelectItem>
                          ) : (
                            classes.map((cls: any) => (
                              <SelectItem key={cls.id} value={cls.id.toString()}>
                                {cls.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-full md:w-1/3">
                      <div className="relative flex items-center mt-6">
                        <Search className="absolute left-2.5 h-4 w-4 text-gray-500" />
                        <Input
                          type="search"
                          placeholder="Zoek studenten..."
                          className="pl-8"
                          value={studentFilter}
                          onChange={(e) => setStudentFilter(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Gedragstabel */}
                  <div className="bg-white shadow rounded-lg border overflow-hidden">
                    {!selectedClass ? (
                      <div className="p-8 text-center text-gray-500">
                        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium">Geen gegevens beschikbaar</h3>
                        <p className="mt-1 text-sm text-gray-500">
                          Selecteer een klas om gedragsbeoordelingen te beheren.
                        </p>
                      </div>
                    ) : isLoadingClassStudents || isLoadingBehavior ? (
                      <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-[#1e3a8a]"></div>
                        <p className="mt-2 text-sm text-gray-500">Studenten laden...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Student
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Punctualiteit 
                                <span className="ml-1 text-gray-400">(Auto)</span>
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <span>Afwezig</span>
                                  <span className="ml-2 inline-block w-3 h-3 rounded-full bg-orange-400"></span>
                                </div>
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                <div className="flex items-center">
                                  <span>Te Laat</span>
                                  <span className="ml-2 inline-block w-3 h-3 rounded-full bg-red-400"></span>
                                </div>
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Gedrag (1-5)
                              </th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Opmerking
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredStudents.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                                  Geen studenten gevonden voor deze klas.
                                </td>
                              </tr>
                            ) : (
                              filteredStudents.map((student: any) => {
                                // Get behavior score or default to 3
                                const behaviorScore = behaviorScores[student.id] || 3;
                                const behaviorRemark = behaviorRemarks[student.id] || getAutomaticBehaviorRemark(behaviorScore);
                                
                                // Get attendance counts (these would normally come from the API)
                                // Voor demo doeleinden gebruiken we willekeurige getallen
                                const absentCount = student.absentCount || Math.floor(Math.random() * 5);
                                const lateCount = student.lateCount || Math.floor(Math.random() * 8);
                                
                                return (
                                  <tr key={student.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center">
                                        <Avatar className="h-8 w-8 mr-3">
                                          <AvatarFallback className="bg-[#1e3a8a] text-white">
                                            {student.firstName.charAt(0)}
                                            {student.lastName.charAt(0)}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <div className="text-sm font-medium text-gray-900">
                                            {student.firstName} {student.lastName}
                                          </div>
                                          <div className="text-xs text-gray-500">
                                            ID: {student.studentId}
                                          </div>
                                        </div>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <div className="flex items-center space-x-2">
                                        <Progress value={behaviorScore * 20} className="w-20 h-2" />
                                        <span className="text-sm font-medium">
                                          {behaviorScore}/5
                                        </span>
                                      </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                                        {absentCount}x
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                        {lateCount}x
                                      </Badge>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <Select 
                                        value={behaviorScore.toString()} 
                                        onValueChange={(value) => handleBehaviorScoreChange(student.id, value)}
                                      >
                                        <SelectTrigger className="w-16">
                                          <SelectValue placeholder="Score" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="1">1</SelectItem>
                                          <SelectItem value="2">2</SelectItem>
                                          <SelectItem value="3">3</SelectItem>
                                          <SelectItem value="4">4</SelectItem>
                                          <SelectItem value="5">5</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </td>
                                    <td className="px-6 py-4">
                                      <Input
                                        placeholder="Opmerkingen..."
                                        className="max-w-xs"
                                        value={behaviorRemark}
                                        onChange={(e) => handleBehaviorRemarkChange(student.id, e.target.value)}
                                      />
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                    
                    {/* Save button for behavior assessments */}
                    {selectedClass && filteredStudents.length > 0 && (
                      <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
                        <Button
                          onClick={() => {
                            const assessmentsToSave = Object.entries(behaviorScores).map(([studentId, score]) => ({
                              studentId: parseInt(studentId),
                              classId: parseInt(selectedClass),
                              date: new Date().toISOString().split('T')[0],
                              category: 'behavior',
                              score: score,
                              comments: behaviorRemarks[studentId] || '',
                            }));
                            
                            if (assessmentsToSave.length > 0) {
                              saveBehaviorAssessmentsMutation.mutate(assessmentsToSave);
                            } else {
                              toast({
                                title: 'Geen wijzigingen',
                                description: 'Er zijn geen beoordelingswijzigingen om op te slaan.',
                              });
                            }
                          }}
                          disabled={!isBehaviorModified || saveBehaviorAssessmentsMutation.isPending}
                          className="bg-[#1e3a8a] hover:bg-blue-800 flex items-center"
                        >
                          {saveBehaviorAssessmentsMutation.isPending ? (
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-e-transparent"></div>
                          ) : (
                            <Save className="mr-2 h-4 w-4" />
                          )}
                          Beoordelingen Opslaan
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}