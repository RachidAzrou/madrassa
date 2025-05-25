import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Save, Plus, X, Edit, Trash2, AlertCircle, Percent, XCircle } from 'lucide-react';
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
  
  // Dummy data voor klassen
  const dummyClasses = [
    { id: 1, name: "Klas 1A", grade: "Eerste Jaar" },
    { id: 2, name: "Klas 2B", grade: "Tweede Jaar" },
    { id: 3, name: "Klas 3C", grade: "Derde Jaar" },
  ];
  
  // Dummy data voor vakken
  const dummySubjects = [
    { id: 1, name: "Arabisch", code: "ARB1" },
    { id: 2, name: "Islamitische Studies", code: "ISL1" },
    { id: 3, name: "Koran", code: "KOR1" },
    { id: 4, name: "Fiqh", code: "FQH1" }
  ];
  
  // Dummy data voor studenten
  const dummyStudents = [
    { id: 1, studentId: "ST-001", firstName: "Mohammed", lastName: "El Amrani", status: "Actief" },
    { id: 2, studentId: "ST-002", firstName: "Fatima", lastName: "Benali", status: "Actief" },
    { id: 3, studentId: "ST-003", firstName: "Youssef", lastName: "Azzouzi", status: "Actief" },
    { id: 4, studentId: "ST-004", firstName: "Noor", lastName: "El Haddaoui", status: "Actief" },
    { id: 5, studentId: "ST-005", firstName: "Ibrahim", lastName: "Tahiri", status: "Actief" }
  ];
  
  // Dummy data voor aanwezigheid
  const dummyAttendance = {
    1: { absent: 2, late: 3 },
    2: { absent: 0, late: 1 },
    3: { absent: 5, late: 2 },
    4: { absent: 1, late: 0 },
    5: { absent: 3, late: 4 }
  };

  // Fetch klassen voor dropdown
  const { data: classesData } = useQuery<any>({
    queryKey: ['/api/student-groups'],
    staleTime: 300000,
  });
  
  // Gebruik dummy data als er geen echte data is
  const classes = classesData?.studentGroups?.length > 0 ? classesData.studentGroups : dummyClasses;

  // Fetch vakken
  const { data: coursesData } = useQuery<any>({
    queryKey: ['/api/courses'],
    staleTime: 300000,
  });

  // Gebruik dummy data als er geen echte data is
  const courses = coursesData?.courses?.length > 0 ? coursesData.courses : dummySubjects;
  
  // Fetch studenten voor de geselecteerde klas
  const { data: classStudentsData, isLoading: isLoadingClassStudents } = useQuery<any[]>({
    queryKey: ['/api/student-groups', selectedClass, 'students'],
    queryFn: async () => {
      if (!selectedClass) return [];
      try {
        const response = await apiRequest('GET', `/api/student-groups/${selectedClass}/students`);
        return response;
      } catch (error) {
        console.log("Kon geen studenten ophalen, gebruik dummy data", error);
        // Alleen voor demo doeleinden - normaal zou je geen dummy data retourneren
        return dummyStudents;
      }
    },
    staleTime: 60000,
    enabled: !!selectedClass,
  });
  
  // Gebruik dummy data als er geen klas is geselecteerd, anders gebruik het resultaat van de query
  const students = !selectedClass ? [] : (classStudentsData?.length > 0 ? classStudentsData : dummyStudents);
    
  // Filter studenten op basis van zoekopdracht
  const filteredStudents = studentFilter 
    ? students.filter(student => 
        student.firstName.toLowerCase().includes(studentFilter.toLowerCase()) ||
        student.lastName.toLowerCase().includes(studentFilter.toLowerCase()) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(studentFilter.toLowerCase())
      )
    : students;

  // Genereer dummy cijfers voor de demo
  const generateDummyGrades = () => {
    const grades: any[] = [];
    // Voor elke student, genereer een cijfer voor elk vak
    dummyStudents.forEach(student => {
      dummySubjects.forEach(subject => {
        // Genereer een willekeurig cijfer tussen 50 en 100
        const score = Math.floor(Math.random() * 51) + 50;
        grades.push({
          studentId: student.id,
          courseId: subject.id,
          score: score,
          date: new Date().toISOString().split('T')[0]
        });
      });
    });
    return grades;
  };

  // Fetch cijfers voor de geselecteerde klas
  const { data: gradesData, isLoading: isLoadingGrades } = useQuery<any[]>({
    queryKey: ['/api/grades/class', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      try {
        const response = await apiRequest('GET', `/api/grades/class/${selectedClass}`);
        return response;
      } catch (error) {
        console.log("Kon geen cijfers ophalen, gebruik dummy data", error);
        // Alleen voor demo doeleinden - normaal zou je geen dummy data retourneren
        return generateDummyGrades();
      }
    },
    staleTime: 60000,
    enabled: !!selectedClass,
  });
  
  // Fetch gedragsbeoordelingen voor de geselecteerde klas
  const { data: behaviorData, isLoading: isLoadingBehavior } = useQuery<any[]>({
    queryKey: ['/api/behavior-assessments/class', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      try {
        const response = await apiRequest('GET', `/api/behavior-assessments/class/${selectedClass}`);
        return response;
      } catch (error) {
        console.log("Kon geen gedragsbeoordelingen ophalen, gebruik dummy data", error);
        // Alleen voor demo doeleinden - normaal zou je geen dummy data retourneren
        return []; // Laat ons de gedragsbeoordelingen automatisch genereren in de effecten
      }
    },
    staleTime: 60000,
    enabled: !!selectedClass && activeTab === 'behavior',
  });
  
  // Effect om aanwezigheidsdata te laden voor punctualiteitsberekening
  useEffect(() => {
    if (selectedClass && students && students.length > 0 && activeTab === 'behavior') {
      const loadAttendanceData = async () => {
        console.log("Berekenen punctualiteitsscores op basis van afwezigheid en te laat komen");
        const newBehaviorScores = { ...behaviorScores };
        const newBehaviorRemarks = { ...behaviorRemarks };
        
        // Evaluatiegegevens berekenen o.b.v. afwezigheid en te laat komen
        for (const student of students) {
          try {
            // Consistente afwezigheids- en te laat getallen op basis van studentId
            const studentIdNum = parseInt(student.id.toString());
            const absentCount = (studentIdNum * 7) % 5; // 0-4 dagen afwezig
            const lateCount = (studentIdNum * 3) % 8; // 0-7 keer te laat
            
            // Bereken punctualiteitsscore op basis van afwezigheid en te laat
            const score = calculatePunctualityScore(absentCount, lateCount);
            
            // Alleen bijwerken als er nog geen score is
            if (!behaviorScores[student.id]) {
              newBehaviorScores[student.id] = score;
              newBehaviorRemarks[student.id] = getPunctualityRemark(score);
            }
          } catch (error) {
            console.error(`Error calculating score for student ${student.id}:`, error);
            newBehaviorScores[student.id] = 3; // Standaard middelmatige score
            newBehaviorRemarks[student.id] = getPunctualityRemark(3);
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
      setIsGradesModified(false);  // Reset gewijzigd vlag nadat gegevens zijn geladen
    }
  }, [gradesData]);
  
  // Effect om dummy aanwezigheidsdata te laden voor de gedragsbeoordelingen
  useEffect(() => {
    if (selectedClass && students.length > 0 && activeTab === 'behavior') {
      const newBehaviorScores: Record<string, number> = {};
      const newBehaviorRemarks: Record<string, string> = {};
      
      students.forEach((student: any) => {
        // Genereer een willekeurige gedragsscore of gebruik een bestaande
        const behaviorScore = behaviorScores[student.id] || Math.floor(Math.random() * 5) + 1;
        newBehaviorScores[student.id] = behaviorScore;
        
        // Genereer een opmerking op basis van de score
        newBehaviorRemarks[student.id] = behaviorRemarks[student.id] || getAutomaticBehaviorRemark(behaviorScore);
      });
      
      setBehaviorScores(newBehaviorScores);
      setBehaviorRemarks(newBehaviorRemarks);
      setIsBehaviorModified(false);  // Reset gewijzigd vlag nadat gegevens zijn geladen
    }
  }, [selectedClass, students, activeTab]);
  
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
    // Sta alleen getallen en lege waarden toe
    if (value !== '' && !/^\d*\.?\d*$/.test(value)) {
      return;
    }
    
    if (value === '') {
      // Leeg veld is toegestaan - we slaan het op als een lege string
      setSubjectGrades(prev => {
        const studentGrades = prev[studentId] || {};
        // We maken een kopie van de bestaande cijfers
        const newGrades = { ...studentGrades };
        // We verwijderen het cijfer voor deze cursus
        delete newGrades[courseId];
        
        return {
          ...prev,
          [studentId]: newGrades
        };
      });
      setIsGradesModified(true);
      return;
    }
    
    // Converteer naar getal en valideer
    let numericValue = parseFloat(value);
    
    // Valideer binnen bereik 0-100
    if (numericValue < 0) numericValue = 0;
    if (numericValue > 100) numericValue = 100;
    
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
  
  // Genereer aanwezigheidsdata voor student (demo functie)
  const fetchAttendanceForStudent = async (studentId: string) => {
    try {
      console.log("Genereer aanwezigheidsdata voor demo");
      
      const totalSessions = 20;
      
      // Gebruik een vaste seed voor studentId om consistente resultaten te krijgen
      const studentIdNum = parseInt(studentId) || 0;
      let lateCount = (studentIdNum * 3) % 8; // 0-7 keer te laat, afhankelijk van studentId
      let absentCount = (studentIdNum * 7) % 5; // 0-4 keer afwezig, afhankelijk van studentId
      
      // Zorg ervoor dat het aantal te laat en afwezig niet groter is dan het totaal aantal sessies
      if (lateCount + absentCount > totalSessions) {
        lateCount = Math.floor(totalSessions * 0.2);
        absentCount = Math.floor(totalSessions * 0.1);
      }
      
      // Genereer sessies
      const attendanceRecords = [];
      for (let i = 0; i < totalSessions; i++) {
        let status = 'Present';
        if (i < lateCount) {
          status = 'Late';
        } else if (i >= lateCount && i < lateCount + absentCount) {
          status = 'Absent';
        }
        
        const date = new Date();
        date.setDate(date.getDate() - i * 7); // Een sessie per week terug in de tijd
        
        attendanceRecords.push({
          id: i + 1,
          studentId: studentIdNum,
          date: date.toISOString().split('T')[0],
          status: status
        });
      }
      
      return attendanceRecords;
    } catch (error) {
      console.error("Fout bij genereren aanwezigheidsdata:", error);
      return []; // Leeg array teruggeven bij fouten
    }
  };
  
  // Calculate punctuality score based on absences and lates count directly
  const calculatePunctualityScore = (absentCount: number, lateCount: number): number => {
    // Parameter voor berekening van punctualiteit
    const maxSessionsPerMonth = 20; // Aanname: ongeveer 20 sessies per maand
    const absentWeight = 2.0; // Afwezigheid telt 2x zo zwaar als te laat komen
    const lateWeight = 1.0;
    
    // Weging van problemen met aanwezigheid
    const totalWeightedIssues = (absentCount * absentWeight) + (lateCount * lateWeight);
    
    // Bereken percentage gewogen problemen t.o.v. maximum aantal sessies
    const problemPercentage = (totalWeightedIssues / maxSessionsPerMonth) * 100;
    
    // Bepaal score op basis van gewogen percentage (5=uitstekend tot 1=slecht)
    if (problemPercentage <= 5) return 5;  // Bijna perfect aanwezig
    if (problemPercentage <= 15) return 4; // Goed aanwezig
    if (problemPercentage <= 25) return 3; // Gemiddelde aanwezigheid
    if (problemPercentage <= 40) return 2; // Problematische aanwezigheid
    return 1; // Zeer problematisch aanwezigheidspatroon
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
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <div className="p-3 rounded-md bg-[#1e40af] text-white">
              <Percent className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Cijfers</h1>
              <p className="text-base text-gray-500 mt-1">Beheer cijfers en gedragsbeoordelingen van studenten</p>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4 md:mt-0 md:ml-auto">
            <span className="text-sm text-gray-500 font-medium">
              {new Date().toLocaleDateString('nl-NL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
          </div>
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
                // Behoud de geselecteerde klas bij het wisselen van tabs
                setSubjectGrades({});
                setBehaviorScores({});
                setBehaviorRemarks({});
                setIsGradesModified(false);
                setIsBehaviorModified(false);
              }}
            >
              <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="w-full md:w-auto order-2 md:order-1">
                    <div className="flex border rounded-md overflow-hidden w-full md:w-[350px]">
                      <button 
                        onClick={() => setActiveTab('grades')}
                        className={`px-4 py-2 text-sm font-medium flex-1 ${activeTab === 'grades' 
                          ? 'bg-[#1e40af] text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        Cijfers
                      </button>
                      <button 
                        onClick={() => setActiveTab('behavior')}
                        className={`px-4 py-2 text-sm font-medium flex-1 ${activeTab === 'behavior' 
                          ? 'bg-[#1e40af] text-white' 
                          : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                      >
                        Gedragsbeoordelingen
                      </button>
                    </div>
                  </div>
                  <div className="w-full md:w-auto max-w-md order-1 md:order-2">
                    <div className="flex items-center">
                      <label className="block text-sm font-medium text-gray-700 mr-2">Klas:</label>
                      <Select value={selectedClass} onValueChange={handleClassChange}>
                        <SelectTrigger className="w-full md:w-[220px]">
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
                  </div>
                </div>
                
                <Button variant="outline" className="flex items-center">
                  <Download className="mr-2 h-4 w-4" />
                  Exporteren
                </Button>
              </div>

              <TabsContent value="grades" className="pt-4">
                <div className="flex flex-col space-y-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    {selectedClass && (
                      <div className="w-full md:w-[350px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student zoeken</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            type="search"
                            placeholder="Zoek op naam..."
                            className="w-full pl-9 pr-9 border-gray-300 focus:border-blue-500"
                            value={studentFilter}
                            onChange={(e) => setStudentFilter(e.target.value)}
                          />
                          {studentFilter && (
                            <XCircle
                              className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
                              onClick={() => setStudentFilter('')}
                            />
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Cijferstabel */}
                  <div className="bg-white shadow rounded-lg border overflow-hidden">
                    {!selectedClass ? (
                      <div className="p-8 text-center">
                        <div className="h-48 flex flex-col items-center justify-center text-gray-500">
                          <div className="text-[#1e3a8a] mb-2">
                            <Percent className="h-12 w-12 mx-auto opacity-30" />
                          </div>
                          <p className="text-sm font-medium">Selecteer een klas om cijfers te beheren</p>
                        </div>
                      </div>
                    ) : isLoadingClassStudents || isLoadingGrades ? (
                      <div className="p-8 text-center">
                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-e-transparent align-[-0.125em] text-[#1e3a8a]"></div>
                        <p className="mt-2 text-sm text-gray-500">Gegevens laden...</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <Table className="border-collapse">
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="w-[240px] bg-blue-900/5 sticky left-0 z-10 border-r border-gray-200">Student</TableHead>
                              {courses.map((course: any) => (
                                <TableHead key={course.id} className="text-center px-6 min-w-[120px]">
                                  <div className="font-semibold">{course.name}</div>
                                  <div className="text-xs text-gray-500 font-normal">{course.code}</div>
                                </TableHead>
                              ))}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStudents.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={courses.length + 1} className="text-center text-sm text-gray-500 py-8">
                                  Geen studenten gevonden voor deze klas of zoekopdracht.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredStudents.map((student: any) => (
                                <TableRow key={student.id} className="hover:bg-blue-900/5">
                                  <TableCell className="bg-white sticky left-0 z-10 border-r border-gray-200 shadow-sm">
                                    <div className="flex items-center">
                                      <Avatar className="h-10 w-10 mr-3">
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
                                      <TableCell key={`${student.id}-${courseId}`} className="text-center p-4">
                                        <div className="flex flex-col items-center">
                                          <Input
                                            type="text"
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            min="0"
                                            max="100"
                                            className="w-16 h-10 text-center text-base font-medium border-gray-300 focus:border-blue-500"
                                            value={grade !== undefined ? grade : ''}
                                            onChange={(e) => handleGradeChange(student.id, courseId, e.target.value)}
                                          />
                                          {grade !== undefined && (
                                            <Badge className={`mt-2 ${getGradeStatus(grade).color}`}>
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
                    {selectedClass && (
                      <div className="w-full md:w-[350px]">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Student zoeken</label>
                        <div className="relative">
                          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                          <Input
                            type="search"
                            placeholder="Zoek op naam..."
                            className="w-full pl-9 pr-9 border-gray-300 focus:border-blue-500"
                            value={studentFilter}
                            onChange={(e) => setStudentFilter(e.target.value)}
                          />
                          {studentFilter && (
                            <XCircle
                              className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
                              onClick={() => setStudentFilter('')}
                            />
                          )}
                        </div>
                      </div>
                    )}
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
                        <Table className="border-collapse">
                          <TableHeader>
                            <TableRow className="bg-gray-50">
                              <TableHead className="w-[240px] bg-blue-900/5 sticky left-0 z-10 border-r border-gray-200">
                                Student
                              </TableHead>
                              <TableHead className="text-left px-6 min-w-[150px]">
                                <div className="flex items-center">
                                  Punctualiteit
                                  <span className="ml-2 text-gray-400 text-xs">(Auto)</span>
                                </div>
                              </TableHead>
                              <TableHead className="text-left px-6 min-w-[100px]">
                                <div className="flex items-center">
                                  <span>Afwezig</span>
                                  <span className="ml-2 inline-block w-3 h-3 rounded-full bg-orange-400"></span>
                                </div>
                              </TableHead>
                              <TableHead className="text-left px-6 min-w-[100px]">
                                <div className="flex items-center">
                                  <span>Te Laat</span>
                                  <span className="ml-2 inline-block w-3 h-3 rounded-full bg-red-400"></span>
                                </div>
                              </TableHead>
                              <TableHead className="text-left px-6 min-w-[120px]">
                                Gedrag (1-5)
                              </TableHead>
                              <TableHead className="text-left px-6 min-w-[300px]">
                                Opmerking
                              </TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredStudents.length === 0 ? (
                              <TableRow>
                                <TableCell colSpan={6} className="text-center text-sm text-gray-500 py-8">
                                  Geen studenten gevonden voor deze klas.
                                </TableCell>
                              </TableRow>
                            ) : (
                              filteredStudents.map((student: any) => {
                                // Get behavior score or default to 3
                                const behaviorScore = behaviorScores[student.id] || 3;
                                const behaviorRemark = behaviorRemarks[student.id] || getAutomaticBehaviorRemark(behaviorScore);
                                
                                // Consistente afwezigheids- en te laat getallen op basis van studentId
                                const studentIdNum = parseInt(student.id.toString());
                                const absentCount = (studentIdNum * 7) % 5; // 0-4 dagen afwezig
                                const lateCount = (studentIdNum * 3) % 8; // 0-7 keer te laat
                                
                                return (
                                  <TableRow key={student.id} className="hover:bg-blue-900/5">
                                    <TableCell className="bg-white sticky left-0 z-10 border-r border-gray-200 shadow-sm">
                                      <div className="flex items-center">
                                        <Avatar className="h-10 w-10 mr-3">
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
                                    <TableCell>
                                      <div className="flex items-center space-x-3">
                                        {/* Bereken score op basis van afwezigheid en te laat */}
                                        {(() => {
                                          // Bereken de score direct in de render functie zodat deze altijd actueel is
                                          const calculatedScore = calculatePunctualityScore(absentCount, lateCount);
                                          return (
                                            <>
                                              <Progress value={calculatedScore * 20} className="w-24 h-3" />
                                              <span className="text-sm font-medium">
                                                {calculatedScore}/5
                                              </span>
                                            </>
                                          );
                                        })()}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200 px-2 py-1 text-sm">
                                        {absentCount}x
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 px-2 py-1 text-sm">
                                        {lateCount}x
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <Select 
                                        value={behaviorScore.toString() || calculatePunctualityScore(absentCount, lateCount).toString()} 
                                        onValueChange={(value) => handleBehaviorScoreChange(student.id, value)}
                                      >
                                        <SelectTrigger className="w-20 border-gray-300 focus:border-blue-500">
                                          <SelectValue placeholder="Score" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          <SelectItem value="1">1 - Slecht</SelectItem>
                                          <SelectItem value="2">2 - Matig</SelectItem>
                                          <SelectItem value="3">3 - Voldoende</SelectItem>
                                          <SelectItem value="4">4 - Goed</SelectItem>
                                          <SelectItem value="5">5 - Uitstekend</SelectItem>
                                        </SelectContent>
                                      </Select>
                                    </TableCell>
                                    <TableCell>
                                      <Input
                                        placeholder="Opmerkingen..."
                                        className="w-full border-gray-300 focus:border-blue-500"
                                        value={behaviorRemark}
                                        onChange={(e) => handleBehaviorRemarkChange(student.id, e.target.value)}
                                      />
                                    </TableCell>
                                  </TableRow>
                                );
                              })
                            )}
                          </TableBody>
                        </Table>
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