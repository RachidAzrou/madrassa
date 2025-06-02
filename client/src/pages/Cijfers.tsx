import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Save, Plus, X, Edit, Trash2, AlertCircle, Percent, XCircle, User, BookOpen, Calculator, CheckCircle, Star, ClipboardList, FileText, Award } from 'lucide-react';
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
import { Label } from "@/components/ui/label";
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
import { PremiumHeader } from '@/components/layout/premium-header';

export default function Cijfers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Haal echte programs/vakken op uit database
  const { data: programsData } = useQuery({
    queryKey: ['/api/programs'],
    staleTime: 300000,
  });

  // Alleen echte vakken (programs) tonen
  const subjects = (programsData?.programs || []).map((program: any) => ({ 
    id: program.id, 
    name: program.name 
  }));
  
  const [activeTab, setActiveTab] = useState('grades'); // 'grades' of 'behavior'
  const [selectedClass, setSelectedClass] = useState(''); 
  const [selectedSubject, setSelectedSubject] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  
  // Voor cijfers
  const [subjectGrades, setSubjectGrades] = useState<Record<string, Record<string, number>>>({});
  const [editGrade, setEditGrade] = useState<{
    studentId: string,
    subject: string,
    grade: number | null
  } | null>(null);
  const [isGradesModified, setIsGradesModified] = useState(false);
  
  // Voor gedrag
  const [behaviorScores, setBehaviorScores] = useState<Record<string, Record<string, number>>>({});
  const [behaviorRemarks, setBehaviorRemarks] = useState<Record<string, Record<string, string>>>({});
  const [editBehavior, setEditBehavior] = useState<{
    studentId: string,
    category: string,
    score: number | null,
    remark: string
  } | null>(null);
  const [isBehaviorModified, setIsBehaviorModified] = useState(false);
  
  // State voor dialogen
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [showAddScoreDialog, setShowAddScoreDialog] = useState(false);
  const [newScoreData, setNewScoreData] = useState({
    subject: '',
    assessmentType: '',
    assessmentName: '',
    points: '',
    maxPoints: '100',
    weight: '100'
  });
  
  // Query voor het ophalen van klassen
  const { data: classesData } = useQuery({
    queryKey: ['/api/student-groups'],
    staleTime: 60000,
  });
  
  const classes = classesData || [];
  
  // Query voor het ophalen van studenten in een klas
  const { data: classStudentsData, isLoading: isLoadingStudents } = useQuery({
    queryKey: ['/api/students/class', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      try {
        const response = await fetch(`/api/students/class/${selectedClass}`);
        if (!response.ok) {
          throw new Error('Failed to fetch students');
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.log("Kon geen studenten ophalen", error);
        return [];
      }
    },
    staleTime: 60000,
    enabled: !!selectedClass,
  });
  
  const students = classStudentsData || [];
  
  // Filter studenten op naam/id als er een filter is ingesteld
  const filteredStudents = Array.isArray(students) ? students.filter(student => {
    if (!studentFilter) return true;
    const searchTerm = studentFilter.toLowerCase();
    return (
      student.firstName.toLowerCase().includes(searchTerm) ||
      student.lastName.toLowerCase().includes(searchTerm) ||
      student.studentId.toLowerCase().includes(searchTerm)
    );
  }) : [];
  
  // Query voor het ophalen van cijfers voor een klas
  const { data: gradesData, isLoading: isLoadingGrades } = useQuery({
    queryKey: ['/api/grades/class', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      try {
        const response = await apiRequest(`/api/grades/class/${selectedClass}`);
        return response;
      } catch (error) {
        console.log("Kon geen cijfers ophalen, gebruik dummy data", error);
        // Alleen voor demo doeleinden - normaal zou je geen dummy data retourneren
        return []; // Laat ons de cijfers automatisch genereren in de effecten
      }
    },
    staleTime: 60000,
    enabled: !!selectedClass && activeTab === 'grades',
  });
  
  // Query voor het ophalen van gedragsbeoordelingen voor een klas
  const { data: behaviorData, isLoading: isLoadingBehavior } = useQuery({
    queryKey: ['/api/behavior-assessments/class', selectedClass],
    queryFn: async () => {
      if (!selectedClass) return [];
      try {
        const response = await apiRequest(`/api/behavior-assessments/class/${selectedClass}`);
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
  
  // Aanwezigheidsdata wordt alleen geladen uit echte bronnen
  
  // Effect om cijferdata te verwerken of dummy cijfers te genereren
  useEffect(() => {
    if (selectedClass && students && students.length > 0 && activeTab === 'grades') {
      // Als we cijfers hebben ontvangen, formatteer ze
      if (gradesData && gradesData.length > 0) {
        const newSubjectGrades: Record<string, Record<string, number>> = {};
        
        gradesData.forEach((grade: any) => {
          if (!newSubjectGrades[grade.studentId]) {
            newSubjectGrades[grade.studentId] = {};
          }
          // Find the program/subject name based on courseId
          const program = programsData?.programs?.find((p: any) => p.id === grade.courseId);
          const subjectName = program ? program.name : `Program ${grade.courseId}`;
          newSubjectGrades[grade.studentId][subjectName] = grade.score;
        });
        
        setSubjectGrades(newSubjectGrades);
      } 
      // Als er geen cijfers zijn, laat lege tabel zien
      else {
        setSubjectGrades({});
      }
    }
  }, [selectedClass, gradesData, students, activeTab, programsData]);
  
  // Effect om gedragsdata te verwerken of dummy gedragsbeoordelingen te genereren
  useEffect(() => {
    if (selectedClass && students && students.length > 0 && activeTab === 'behavior') {
      // Als we gedragsbeoordelingen hebben ontvangen, formatteer ze
      if (behaviorData && behaviorData.length > 0) {
        const newBehaviorScores: Record<string, Record<string, number>> = { ...behaviorScores };
        const newBehaviorRemarks: Record<string, Record<string, string>> = {};
        
        behaviorData.forEach((assessment: any) => {
          if (!newBehaviorScores[assessment.studentId]) {
            newBehaviorScores[assessment.studentId] = {};
          }
          if (!newBehaviorRemarks[assessment.studentId]) {
            newBehaviorRemarks[assessment.studentId] = {};
          }
          
          newBehaviorScores[assessment.studentId][assessment.category] = assessment.score;
          newBehaviorRemarks[assessment.studentId][assessment.category] = assessment.remark || '';
        });
        
        setBehaviorScores(newBehaviorScores);
        setBehaviorRemarks(newBehaviorRemarks);
      } 
      // Als er geen gedragsbeoordelingen zijn, laat lege tabel zien
      else {
        setBehaviorScores({});
        setBehaviorRemarks({});
      }
    }
  }, [selectedClass, behaviorData, students, activeTab, behaviorScores]);

  // Mutations voor het opslaan van cijfers
  const saveGradesMutation = useMutation({
    mutationFn: async (gradeData: any) => {
      return apiRequest('/api/grades/bulk-update', {
        method: 'POST',
        body: gradeData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/grades/class', selectedClass],
      });
      setIsGradesModified(false);
      
      toast({
        title: "Cijfers opgeslagen",
        description: "Alle wijzigingen zijn succesvol opgeslagen.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij opslaan",
        description: error.message || "Er is een fout opgetreden bij het opslaan van de cijfers.",
        variant: "destructive",
      });
    }
  });

  // Mutations voor het opslaan van gedragsbeoordelingen
  const saveBehaviorMutation = useMutation({
    mutationFn: async (behaviorData: any) => {
      return apiRequest('/api/behavior-assessments/bulk-update', {
        method: 'POST',
        body: behaviorData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['/api/behavior-assessments/class', selectedClass],
      });
      setIsBehaviorModified(false);
      
      toast({
        title: "Beoordelingen opgeslagen",
        description: "Alle wijzigingen zijn succesvol opgeslagen.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij opslaan",
        description: error.message || "Er is een fout opgetreden bij het opslaan van de gedragsbeoordelingen.",
        variant: "destructive",
      });
    }
  });

  // Helper functions
  const formatGradeWithCategory = (score: number): string => {
    if (score >= 90) return `${score}% (Uitstekend)`;
    if (score >= 80) return `${score}% (Zeer Goed)`;
    if (score >= 70) return `${score}% (Goed)`;
    if (score >= 60) return `${score}% (Voldoende)`;
    if (score >= 50) return `${score}% (Matig)`;
    return `${score}% (Onvoldoende)`;
  };

  const getGradeColor = (score: number): string => {
    if (score >= 90) return "text-green-700 bg-green-50";
    if (score >= 80) return "text-blue-700 bg-blue-50";
    if (score >= 70) return "text-indigo-700 bg-indigo-50";
    if (score >= 60) return "text-yellow-700 bg-yellow-50";
    if (score >= 50) return "text-orange-700 bg-orange-50";
    return "text-red-700 bg-red-50";
  };

  const getGradeCategory = (score: number): string => {
    if (score >= 90) return "Uitstekend";
    if (score >= 80) return "Zeer Goed";
    if (score >= 70) return "Goed";
    if (score >= 60) return "Voldoende";
    if (score >= 50) return "Matig";
    return "Onvoldoende";
  };

  // Handlers
  const handleEditGrade = (studentId: string, subject: string, grade: number | null) => {
    setEditGrade({ studentId, subject, grade });
  };

  const handleSaveGrade = async (newGrade: number) => {
    if (!editGrade) return;
    
    const { studentId, subject } = editGrade;
    
    try {
      // Find the program ID for this subject
      const program = subjects.find(s => s.name === subject);
      if (!program) {
        toast({
          title: "Fout",
          description: "Vak niet gevonden.",
          variant: "destructive",
        });
        return;
      }

      // Save to database - expect percentage input (0-100)
      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          studentId: parseInt(studentId),
          courseId: program.id,
          assessmentType: 'regular',
          assessmentName: 'Cijfer',
          score: Math.round(newGrade), // Store as percentage (0-100)
          maxScore: 100,
          weight: 100,
          date: new Date().toISOString().split('T')[0]
        }),
      });

      if (!response.ok) {
        throw new Error('Fout bij opslaan van cijfer');
      }

      setEditGrade(null);
      
      // Refresh data and wait for it to complete
      await queryClient.invalidateQueries({ queryKey: ['/api/grades/class', selectedClass] });
      await queryClient.refetchQueries({ queryKey: ['/api/grades/class', selectedClass] });

      toast({
        title: "Cijfer opgeslagen",
        description: `Cijfer ${newGrade} opgeslagen voor ${subject}`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Fout bij opslaan",
        description: "Er is een fout opgetreden bij het opslaan van het cijfer.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEditGrade = () => {
    setEditGrade(null);
  };

  const handleEditBehavior = (studentId: string, category: string, score: number | null, remark: string) => {
    setEditBehavior({ studentId, category, score, remark });
  };

  const handleSaveBehavior = (newScore: number, newRemark: string) => {
    if (!editBehavior) return;
    
    const { studentId, category } = editBehavior;
    
    // Update scores
    const updatedScores = { ...behaviorScores };
    if (!updatedScores[studentId]) {
      updatedScores[studentId] = {};
    }
    updatedScores[studentId][category] = newScore;
    
    // Update remarks
    const updatedRemarks = { ...behaviorRemarks };
    if (!updatedRemarks[studentId]) {
      updatedRemarks[studentId] = {};
    }
    updatedRemarks[studentId][category] = newRemark;
    
    setBehaviorScores(updatedScores);
    setBehaviorRemarks(updatedRemarks);
    setEditBehavior(null);
    setIsBehaviorModified(true);
  };

  const handleCancelEditBehavior = () => {
    setEditBehavior(null);
  };

  const handleSaveAllGrades = () => {
    const gradesArray = [];
    
    for (const studentId in subjectGrades) {
      for (const subject in subjectGrades[studentId]) {
        gradesArray.push({
          studentId,
          subject,
          score: subjectGrades[studentId][subject],
          date: new Date().toISOString()
        });
      }
    }
    
    saveGradesMutation.mutate({ grades: gradesArray, classId: selectedClass });
  };

  const handleSaveAllBehavior = () => {
    const behaviorArray = [];
    
    for (const studentId in behaviorScores) {
      for (const category in behaviorScores[studentId]) {
        behaviorArray.push({
          studentId,
          category,
          score: behaviorScores[studentId][category],
          remark: (behaviorRemarks[studentId] && behaviorRemarks[studentId][category]) || '',
          date: new Date().toISOString()
        });
      }
    }
    
    saveBehaviorMutation.mutate({ assessments: behaviorArray, classId: selectedClass });
  };

  // Bereken gemiddelde voor een student
  const calculateAverage = (studentId: string): number | null => {
    if (!subjectGrades[studentId]) return null;
    
    const grades = Object.values(subjectGrades[studentId]);
    if (grades.length === 0) return null;
    
    const sum = grades.reduce((acc, grade) => acc + grade, 0);
    return Math.round((sum / grades.length) * 10) / 10;
  };

  // Bereken gedragsscore voor een student (gemiddelde van alle categorieën)
  const calculateBehaviorScore = (studentId: string): number | null => {
    if (!behaviorScores[studentId]) return null;
    
    const scores = Object.values(behaviorScores[studentId]);
    if (scores.length === 0) return null;
    
    const sum = scores.reduce((acc, score) => acc + score, 0);
    return Math.round(sum / scores.length);
  };
  
  // Helper functie om gedragsscore om te zetten naar een tekst en kleur
  const getBehaviorLabel = (score: number | null) => {
    if (score === null) return { text: 'Niet beoordeeld', color: 'bg-gray-100 text-gray-800' };
    if (score >= 90) return { text: 'Uitstekend', color: 'bg-green-100 text-green-800' };
    if (score >= 80) return { text: 'Zeer goed', color: 'bg-emerald-100 text-emerald-800' };
    if (score >= 70) return { text: 'Goed', color: 'bg-blue-100 text-blue-800' };
    if (score >= 60) return { text: 'Voldoende', color: 'bg-yellow-100 text-yellow-800' };
    if (score >= 50) return { text: 'Matig', color: 'bg-orange-100 text-orange-800' };
    return { text: 'Onvoldoende', color: 'bg-red-100 text-red-800' };
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium header component */}
      <PremiumHeader 
        title="Cijfers" 
        path="Evaluatie > Cijfers" 
        icon={Percent}
        description="Voer cijfers in voor studenten, beheer beoordelingen en volg studievoortgang per klas"
      />
      
      <div className="px-6 py-6 flex-1 space-y-6">
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
                <TabsList className="grid w-full grid-cols-2 h-11">
                  <TabsTrigger value="grades" className="text-sm">Cijfers</TabsTrigger>
                  <TabsTrigger value="behavior" className="text-sm">Gedrag</TabsTrigger>
                </TabsList>
              </Tabs>
  
              <div className="flex flex-col md:flex-row gap-3 md:items-center">
                <div className="w-full md:w-64">
                  <Select
                    value={selectedClass}
                    onValueChange={(value) => {
                      // Controleer of er niet-opgeslagen wijzigingen zijn
                      if ((activeTab === 'grades' && isGradesModified) || 
                          (activeTab === 'behavior' && isBehaviorModified)) {
                        setShowConfirmSave(true);
                        // We slaan de nieuwe klas tijdelijk op maar passen het nog niet toe
                        return;
                      }
                      
                      setSelectedClass(value);
                      setSelectedSubject(''); // Reset vak selectie
                      // Reset de staat bij het veranderen van klas
                      setSubjectGrades({});
                      setBehaviorScores({});
                      setBehaviorRemarks({});
                      setIsGradesModified(false);
                      setIsBehaviorModified(false);
                      setStudentFilter('');
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een klas" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((cls: any) => (
                        <SelectItem key={cls.id} value={cls.id.toString()}>
                          {cls.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedClass && activeTab === 'grades' && (
                  <div className="w-full md:w-64">
                    <Select
                      value={selectedSubject}
                      onValueChange={(value) => {
                        setSelectedSubject(value);
                        // Reset de cijfers bij het veranderen van vak
                        setSubjectGrades({});
                        setIsGradesModified(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecteer een vak" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.name}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
  
                {selectedClass && (
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                      <Input
                        type="search"
                        placeholder="Zoek op naam of studentnummer..."
                        className="pl-8 bg-white"
                        value={studentFilter}
                        onChange={(e) => setStudentFilter(e.target.value)}
                      />
                      {studentFilter && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="absolute right-1 top-1 h-8 w-8 p-0" 
                          onClick={() => setStudentFilter('')}
                        >
                          <X className="h-4 w-4" />
                          <span className="sr-only">Clear</span>
                        </Button>
                      )}
                    </div>
                  </div>
                )}
  
                {(activeTab === 'grades' && isGradesModified) || (activeTab === 'behavior' && isBehaviorModified) ? (
                  <Button 
                    variant="default" 
                    className="bg-[#1e40af] hover:bg-[#1e40af]/90 w-full md:w-auto"
                    onClick={() => 
                      activeTab === 'grades' ? handleSaveAllGrades() : handleSaveAllBehavior()
                    }
                    disabled={saveGradesMutation.isPending || saveBehaviorMutation.isPending}
                  >
                    {saveGradesMutation.isPending || saveBehaviorMutation.isPending ? (
                      <>
                        <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                        Opslaan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Wijzigingen opslaan
                      </>
                    )}
                  </Button>
                ) : null}
              </div>
            </div>
          </div>
  
          {/* Content area */}
          {selectedClass ? (
            <>
              {/* Cijfers tab content */}
              {activeTab === 'grades' && (
                <div className="bg-white rounded-md border shadow-sm">
                  <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-lg font-medium text-gray-800">Cijferoverzicht</h2>
                    <div className="flex items-center gap-2">
                      {isGradesModified && (
                        <Button 
                          size="sm" 
                          className="h-8 bg-blue-600 hover:bg-blue-700 text-white"
                          onClick={handleSaveAllGrades}
                          disabled={saveGradesMutation.isPending}
                        >
                          {saveGradesMutation.isPending ? (
                            <>
                              <div className="animate-spin mr-2 h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
                              Opslaan...
                            </>
                          ) : (
                            <>
                              <Save className="mr-2 h-3 w-3" />
                              Cijfers opslaan
                            </>
                          )}
                        </Button>
                      )}
                      <Button variant="outline" size="sm" className="h-8">
                        <Download className="mr-2 h-4 w-4" />
                        Exporteren
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8"
                        onClick={() => setShowAddScoreDialog(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Nieuw cijfer
                      </Button>
                    </div>
                  </div>
  
                  {!selectedSubject ? (
                    <div className="p-8 text-center text-gray-500">
                      <BookOpen className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Selecteer een vak</h3>
                      <p>Kies een vak om de beoordelingen en cijfers te bekijken</p>
                    </div>
                  ) : isLoadingStudents || isLoadingGrades ? (
                    <div className="p-8 flex justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-[#1e3a8a] border-t-transparent rounded-full"></div>
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200">
                            <TableHead className="w-[250px] font-semibold text-gray-700 py-4">
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4" />
                                Student
                              </div>
                            </TableHead>
                            {/* Hier komen de beoordelingen voor het geselecteerde vak */}
                            <TableHead className="text-center font-semibold text-gray-700 py-4">
                              <div className="flex flex-col items-center gap-1">
                                <ClipboardList className="h-4 w-4 text-green-600" />
                                <span>Test 1</span>
                                <span className="text-xs text-gray-500 font-normal">40% - 100 ptn</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 py-4">
                              <div className="flex flex-col items-center gap-1">
                                <FileText className="h-4 w-4 text-blue-600" />
                                <span>Huiswerk 1</span>
                                <span className="text-xs text-gray-500 font-normal">20% - 50 ptn</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-center font-semibold text-gray-700 py-4">
                              <div className="flex flex-col items-center gap-1">
                                <Award className="h-4 w-4 text-purple-600" />
                                <span>Examen</span>
                                <span className="text-xs text-gray-500 font-normal">60% - 200 ptn</span>
                              </div>
                            </TableHead>
                            <TableHead className="text-right font-semibold text-gray-700 py-4">
                              <div className="flex items-center justify-end gap-2">
                                <Calculator className="h-4 w-4" />
                                Gemiddelde
                              </div>
                            </TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((student: any) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-[#1e3a8a] text-white text-xs">
                                      {student.firstName[0]}{student.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{student.firstName} {student.lastName}</div>
                                    <div className="text-xs text-gray-500">{student.studentId}</div>
                                  </div>
                                </div>
                              </TableCell>
                              
                              {/* Cijfercellen voor de beoordelingen van het geselecteerde vak */}
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-2 p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    placeholder="85"
                                    className="w-16 h-8 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value=""
                                    onChange={(e) => {
                                      // Hier zullen we de logica voor het opslaan van cijfers toevoegen
                                    }}
                                  />
                                  <span className="text-xs text-gray-500">85%</span>
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-2 p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="50"
                                    step="1"
                                    placeholder="42"
                                    className="w-16 h-8 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value=""
                                    onChange={(e) => {
                                      // Hier zullen we de logica voor het opslaan van cijfers toevoegen
                                    }}
                                  />
                                  <span className="text-xs text-gray-500">84%</span>
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-center">
                                <div className="flex flex-col items-center gap-2 p-2">
                                  <Input
                                    type="number"
                                    min="0"
                                    max="200"
                                    step="1"
                                    placeholder="165"
                                    className="w-16 h-8 text-center text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    value=""
                                    onChange={(e) => {
                                      // Hier zullen we de logica voor het opslaan van cijfers toevoegen
                                    }}
                                  />
                                  <span className="text-xs text-gray-500">83%</span>
                                </div>
                              </TableCell>
                              
                              <TableCell className="text-right font-medium">
                                <div className="flex items-center justify-end gap-2">
                                  <Badge className="bg-green-100 text-green-800 border-green-200">
                                    8.4
                                  </Badge>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-8 text-center text-gray-500">
                      <User className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium mb-2">Geen studenten gevonden</h3>
                      <p>Er zijn geen studenten in deze klas of ze voldoen niet aan de zoekfilters.</p>
                    </div>
                  )}
                }
              </TabsContent>

              <TabsContent value="behavior" className="mt-6">
                {selectedClass && (
                <div className="bg-white rounded-md border shadow-sm">
                  <div className="p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h2 className="text-lg font-medium text-gray-800">Gedragsbeoordelingen</h2>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="h-8">
                        <Download className="mr-2 h-4 w-4" />
                        Exporteren
                      </Button>
                    </div>
                  </div>
  
                  {isLoadingStudents || isLoadingBehavior ? (
                    <div className="p-8 flex justify-center">
                      <div className="animate-spin h-8 w-8 border-4 border-[#1e3a8a] border-t-transparent rounded-full"></div>
                    </div>
                  ) : filteredStudents.length > 0 ? (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[250px]">Student</TableHead>
                            <TableHead>Respect</TableHead>
                            <TableHead>Samenwerking</TableHead>
                            <TableHead>Inzet</TableHead>
                            <TableHead>Discipline</TableHead>
                            <TableHead>Punctualiteit</TableHead>
                            <TableHead className="text-right">Algehele score</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredStudents.map((student: any) => (
                            <TableRow key={student.id}>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-[#1e3a8a] text-white text-xs">
                                      {student.firstName[0]}{student.lastName[0]}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div>
                                    <div className="font-medium">{student.firstName} {student.lastName}</div>
                                    <div className="text-xs text-gray-500">{student.studentId}</div>
                                  </div>
                                </div>
                              </TableCell>
                              
                              {['respect', 'samenwerking', 'inzet', 'discipline', 'punctuality'].map((category) => (
                                <TableCell key={category}>
                                  {editBehavior && editBehavior.studentId === student.id && editBehavior.category === category ? (
                                    <div className="space-y-2">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-xs font-medium">
                                          {editBehavior.score || 0}%
                                        </span>
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          className="h-6 w-6 p-0" 
                                          onClick={handleCancelEditBehavior}
                                        >
                                          <X className="h-3 w-3" />
                                          <span className="sr-only">Cancel</span>
                                        </Button>
                                      </div>
                                      <Input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="1"
                                        defaultValue={editBehavior.score?.toString() || '0'}
                                        onChange={(e) => {
                                          const newScore = parseInt(e.target.value);
                                          if (!isNaN(newScore)) {
                                            setEditBehavior({
                                              ...editBehavior,
                                              score: newScore
                                            });
                                          }
                                        }}
                                        className="w-full h-1.5"
                                      />
                                      <Input
                                        placeholder="Opmerking..."
                                        className="text-xs mt-1"
                                        defaultValue={editBehavior.remark}
                                        onChange={(e) => {
                                          setEditBehavior({
                                            ...editBehavior,
                                            remark: e.target.value
                                          });
                                        }}
                                      />
                                      <Button 
                                        size="sm" 
                                        className="w-full h-7 text-xs mt-1"
                                        onClick={() => {
                                          if (editBehavior.score !== null) {
                                            handleSaveBehavior(
                                              editBehavior.score,
                                              editBehavior.remark
                                            );
                                          }
                                        }}
                                      >
                                        Opslaan
                                      </Button>
                                    </div>
                                  ) : (
                                    <div 
                                      className="cursor-pointer hover:bg-gray-50 p-1 rounded"
                                      onClick={() => handleEditBehavior(
                                        student.id, 
                                        category, 
                                        behaviorScores[student.id]?.[category] || null,
                                        behaviorRemarks[student.id]?.[category] || ''
                                      )}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-xs font-medium">
                                            {behaviorScores[student.id]?.[category] || 0}%
                                          </span>
                                          <Edit className="h-3 w-3 text-gray-400" />
                                        </div>
                                        <Progress value={behaviorScores[student.id]?.[category] || 0} className="h-1.5" />
                                        {behaviorRemarks[student.id]?.[category] && (
                                          <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                            {behaviorRemarks[student.id][category]}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                              ))}
                              
                              <TableCell className="text-right">
                                {calculateBehaviorScore(student.id) && (
                                  <Badge className={`font-normal ${getBehaviorLabel(calculateBehaviorScore(student.id)).color}`}>
                                    {getBehaviorLabel(calculateBehaviorScore(student.id)).text}
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <div className="p-8 text-center">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 mb-4">
                        <AlertCircle className="h-5 w-5 text-gray-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Geen studenten gevonden</h3>
                      <p className="text-gray-500">
                        {studentFilter ? 
                          "Er zijn geen studenten die aan je zoekcriteria voldoen." : 
                          "Deze klas heeft nog geen studenten of er is een fout opgetreden."}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white rounded-md border shadow-sm p-8 text-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 mb-4">
                <Percent className="h-6 w-6 text-gray-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Selecteer een klas</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                Selecteer een klas uit het dropdown menu om cijfers en gedragsbeoordelingen te bekijken en beheren.
              </p>
            </div>
          )}
        </div>
        
        {/* Confirm save dialog */}
        <Dialog open={showConfirmSave} onOpenChange={setShowConfirmSave}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Niet-opgeslagen wijzigingen</DialogTitle>
              <DialogDescription>
                Je hebt niet-opgeslagen wijzigingen. Wil je deze opslaan voordat je van klas wisselt?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                onClick={() => {
                  setShowConfirmSave(false);
                  // Hier zouden we van klas wisselen zonder op te slaan
                  // maar we hebben deze functionaliteit nog niet geïmplementeerd
                }}
              >
                Negeren
              </Button>
              <Button
                onClick={() => {
                  setShowConfirmSave(false);
                  if (activeTab === 'grades') {
                    handleSaveAllGrades();
                  } else {
                    handleSaveAllBehavior();
                  }
                  // Hier zouden we van klas wisselen na het opslaan
                  // maar we hebben deze functionaliteit nog niet geïmplementeerd
                }}
              >
                Opslaan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Add new assessment dialog */}
        <Dialog open={showAddScoreDialog} onOpenChange={setShowAddScoreDialog}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader className="pb-4">
              <DialogTitle className="text-xl font-semibold text-gray-800">Nieuwe beoordeling toevoegen</DialogTitle>
              <DialogDescription className="text-gray-600">
                Voeg een nieuwe beoordeling toe voor een vak. Deze wordt automatisch toegevoegd voor alle studenten in de klas.
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Vak selectie */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Vak <span className="text-red-500">*</span>
                </label>
                <Select
                  value={newScoreData.subject}
                  onValueChange={(value) => setNewScoreData({...newScoreData, subject: value})}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecteer een vak" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.name}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Type en naam */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Type <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={newScoreData.assessmentType}
                    onValueChange={(value) => setNewScoreData({...newScoreData, assessmentType: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">📝 Test</SelectItem>
                      <SelectItem value="taak">📋 Taak</SelectItem>
                      <SelectItem value="examen">🎓 Examen</SelectItem>
                      <SelectItem value="presentatie">🎤 Presentatie</SelectItem>
                      <SelectItem value="project">📁 Project</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Gewicht <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={newScoreData.weight}
                    onValueChange={(value) => setNewScoreData({...newScoreData, weight: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Gewicht" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="10">10% - Klein</SelectItem>
                      <SelectItem value="20">20% - Normaal</SelectItem>
                      <SelectItem value="30">30% - Belangrijk</SelectItem>
                      <SelectItem value="40">40% - Test</SelectItem>
                      <SelectItem value="50">50% - Groot</SelectItem>
                      <SelectItem value="60">60% - Examen</SelectItem>
                      <SelectItem value="100">100% - Volledig</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Naam */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Naam beoordeling <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="Bijv. Test Hoofdstuk 1, Huiswerk Oefeningen, Eindexamen..."
                  value={newScoreData.assessmentName}
                  onChange={(e) => setNewScoreData({...newScoreData, assessmentName: e.target.value})}
                  className="w-full"
                />
              </div>
              
              {/* Maximum punten */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Maximum punten <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="1000"
                    step="1"
                    placeholder="100"
                    className="w-24 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    value={newScoreData.maxPoints}
                    onChange={(e) => setNewScoreData({...newScoreData, maxPoints: e.target.value})}
                  />
                  <span className="text-sm text-gray-500">punten mogelijk</span>
                </div>
                <p className="text-xs text-gray-500">
                  Dit wordt gebruikt om percentages te berekenen (bijv. 8/10 = 80%)
                </p>
              </div>
              
              {/* Info box */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <div className="text-blue-600 mt-0.5">ℹ️</div>
                  <div className="text-sm text-blue-700">
                    <p className="font-medium mb-1">Hoe werkt dit?</p>
                    <p>Deze beoordeling wordt toegevoegd voor alle studenten in de geselecteerde klas. Docenten kunnen daarna individuele punten invoeren.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddScoreDialog(false)}
                className="order-2 sm:order-1"
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                className="order-1 sm:order-2 bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async () => {
                  if (!newScoreData.subject || !newScoreData.assessmentType || !newScoreData.assessmentName || !newScoreData.maxPoints) {
                    toast({
                      title: "Onvolledige gegevens",
                      description: "Vul alle velden in om een beoordeling toe te voegen.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  const points = parseFloat(newScoreData.points);
                  const maxPoints = parseFloat(newScoreData.maxPoints);
                  const weight = parseFloat(newScoreData.weight);
                  
                  if (isNaN(points) || points < 0 || points > maxPoints) {
                    toast({
                      title: "Ongeldige punten",
                      description: `Punten moeten tussen 0 en ${maxPoints} liggen.`,
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  if (isNaN(maxPoints) || maxPoints <= 0) {
                    toast({
                      title: "Ongeldige maximum punten",
                      description: "Maximum punten moet groter dan 0 zijn.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  try {
                    // Bereken percentage score
                    const score = Math.round((points / maxPoints) * 100);
                    
                    // Vind het program ID voor dit vak
                    const program = programsData?.programs?.find((p: any) => p.name === newScoreData.subject);
                    if (!program) {
                      toast({
                        title: "Fout",
                        description: "Vak niet gevonden.",
                        variant: "destructive",
                      });
                      return;
                    }
                    
                    // Voeg de beoordeling toe voor alle studenten in de klas
                    const savePromises = filteredStudents.map(async (student: any) => {
                      const response = await fetch('/api/grades', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                          studentId: parseInt(student.id),
                          courseId: program.id,
                          assessmentType: newScoreData.assessmentType,
                          assessmentName: newScoreData.assessmentName,
                          score: 0, // Start met 0, docent kan later invullen
                          maxScore: maxPoints,
                          weight: weight,
                          date: new Date().toISOString().split('T')[0]
                        }),
                      });

                      if (!response.ok) {
                        throw new Error(`Fout bij het toevoegen voor ${student.firstName} ${student.lastName}`);
                      }
                    });
                    
                    await Promise.all(savePromises);
                    
                    // Refresh de data
                    await queryClient.invalidateQueries({ queryKey: ['/api/grades/class', selectedClass] });
                    
                    setShowAddScoreDialog(false);
                    
                    // Reset het formulier
                    setNewScoreData({
                      subject: '',
                      assessmentType: '',
                      assessmentName: '',
                      points: '',
                      maxPoints: '100',
                      weight: '100'
                    });
                    
                    toast({
                      title: "Beoordeling toegevoegd",
                      description: `${newScoreData.assessmentType} "${newScoreData.assessmentName}" is toegevoegd voor alle studenten in de klas.`,
                      variant: "default",
                    });
                  } catch (error) {
                    console.error('Error adding assessment:', error);
                    toast({
                      title: "Fout",
                      description: "Er is een fout opgetreden bij het toevoegen van de beoordeling.",
                      variant: "destructive",
                    });
                  }
                }}
              >
                Toevoegen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}