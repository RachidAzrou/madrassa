import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, Save, Plus, X, Edit, Trash2, AlertCircle, Percent, XCircle, User, BookOpen, Calculator, CheckCircle, Star } from 'lucide-react';
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
    studentId: '',
    subject: '',
    grade: '',
    category: '',
    score: '',
    remark: ''
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
  
                  {isLoadingStudents || isLoadingGrades ? (
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
                            {subjects.map((subject) => (
                              <TableHead key={subject.id} className="text-center font-semibold text-gray-700 py-4">
                                <div className="flex flex-col items-center gap-1">
                                  <BookOpen className="h-4 w-4 text-blue-600" />
                                  <span>{subject.name}</span>
                                  <span className="text-xs text-gray-500 font-normal">{subject.code}</span>
                                </div>
                              </TableHead>
                            ))}
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
                              
                              {subjects.map((subject) => (
                                <TableCell key={subject.id}>
                                  {editGrade && editGrade.studentId === student.id && editGrade.subject === subject.name ? (
                                    <div className="flex flex-col items-center gap-2 p-3 bg-white border border-blue-300 rounded shadow-sm">
                                      <Input
                                        type="number"
                                        min="0"
                                        max="100"
                                        step="1"
                                        placeholder="bijv. 75"
                                        className="w-20 h-10 text-center text-lg font-medium border-2 border-blue-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-200"
                                        defaultValue={editGrade.grade?.toString() || ''}
                                        onChange={(e) => {
                                          const value = parseFloat(e.target.value);
                                          if (!isNaN(value) && value >= 0 && value <= 100) {
                                            setEditGrade({...editGrade, grade: value});
                                          } else if (e.target.value === '') {
                                            setEditGrade({...editGrade, grade: null});
                                          }
                                        }}
                                        onBlur={(e) => {
                                          const value = parseFloat(e.target.value);
                                          if (!isNaN(value) && value >= 0 && value <= 100) {
                                            handleSaveGrade(value);
                                          } else {
                                            handleCancelEditGrade();
                                          }
                                        }}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const value = parseFloat(e.currentTarget.value);
                                            if (!isNaN(value) && value >= 0 && value <= 100) {
                                              handleSaveGrade(value);
                                            } else {
                                              handleCancelEditGrade();
                                            }
                                          } else if (e.key === 'Escape') {
                                            handleCancelEditGrade();
                                          }
                                        }}
                                        autoFocus
                                      />
                                      <div className="text-center space-y-1">
                                        <div className="text-xs text-gray-500">Enter = opslaan • Esc = annuleren</div>
                                        {editGrade.grade !== null && editGrade.grade >= 0 && editGrade.grade <= 100 && (
                                          <div className={`text-xs font-medium px-2 py-1 rounded ${getGradeColor(editGrade.grade)}`}>
                                            {getGradeCategory(editGrade.grade)}
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ) : (
                                    <div 
                                      className="cursor-pointer hover:bg-blue-50 p-2 rounded-md transition-all duration-200 border border-transparent hover:border-blue-200 flex items-center justify-center min-h-[40px]"
                                      onClick={() => handleEditGrade(
                                        student.id, 
                                        subject.name, 
                                        subjectGrades[student.id]?.[subject.name] || null
                                      )}
                                    >
                                      <div className="flex flex-col items-center gap-1">
                                        {subjectGrades[student.id]?.[subject.name] ? (
                                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(subjectGrades[student.id][subject.name])}`}>
                                            {formatGradeWithCategory(subjectGrades[student.id][subject.name])}
                                          </div>
                                        ) : (
                                          <span className="text-gray-400 font-medium text-lg">-</span>
                                        )}
                                        <Edit className="h-3 w-3 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                      </div>
                                    </div>
                                  )}
                                </TableCell>
                              ))}
                              
                              <TableCell className="text-right">
                                <div className="flex items-center justify-end gap-2">
                                  {calculateAverage(student.id) ? (
                                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${getGradeColor(calculateAverage(student.id)!)}`}>
                                      {formatGradeWithCategory(calculateAverage(student.id)!)}
                                    </div>
                                  ) : (
                                    <span className="bg-gray-100 text-gray-500 font-semibold text-lg px-3 py-1 rounded-full">-</span>
                                  )}
                                </div>
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
  
              {/* Gedrag tab content */}
              {activeTab === 'behavior' && (
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
        
        {/* Add new score dialog */}
        <Dialog open={showAddScoreDialog} onOpenChange={setShowAddScoreDialog}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Nieuw cijfer toevoegen</DialogTitle>
              <DialogDescription>
                Voeg een nieuw cijfer toe voor een student en vak.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right font-medium text-sm">
                  Student
                </div>
                <div className="col-span-3">
                  <Select
                    value={newScoreData.studentId}
                    onValueChange={(value) => setNewScoreData({...newScoreData, studentId: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een student" />
                    </SelectTrigger>
                    <SelectContent>
                      {filteredStudents.map((student: any) => (
                        <SelectItem key={student.id} value={student.id.toString()}>
                          {student.firstName} {student.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right font-medium text-sm">
                  Vak
                </div>
                <div className="col-span-3">
                  <Select
                    value={newScoreData.subject}
                    onValueChange={(value) => setNewScoreData({...newScoreData, subject: value})}
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
              </div>
              
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="text-right font-medium text-sm">
                  Cijfer
                </div>
                <Input
                  id="grade"
                  type="number"
                  min="1"
                  max="10"
                  step="0.1"
                  className="col-span-3"
                  value={newScoreData.grade}
                  onChange={(e) => setNewScoreData({...newScoreData, grade: e.target.value})}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddScoreDialog(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                onClick={() => {
                  if (!newScoreData.studentId || !newScoreData.subject || !newScoreData.grade) {
                    toast({
                      title: "Onvolledige gegevens",
                      description: "Vul alle velden in om een cijfer toe te voegen.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  const grade = parseFloat(newScoreData.grade);
                  if (isNaN(grade) || grade < 1 || grade > 10) {
                    toast({
                      title: "Ongeldig cijfer",
                      description: "Cijfer moet tussen 1 en 10 liggen.",
                      variant: "destructive",
                    });
                    return;
                  }
                  
                  // Voeg het cijfer toe aan de state
                  const updatedGrades = { ...subjectGrades };
                  if (!updatedGrades[newScoreData.studentId]) {
                    updatedGrades[newScoreData.studentId] = {};
                  }
                  updatedGrades[newScoreData.studentId][newScoreData.subject] = grade;
                  
                  setSubjectGrades(updatedGrades);
                  setIsGradesModified(true);
                  setShowAddScoreDialog(false);
                  
                  // Reset het formulier
                  setNewScoreData({
                    studentId: '',
                    subject: '',
                    grade: '',
                    category: '',
                    score: '',
                    remark: ''
                  });
                  
                  toast({
                    title: "Cijfer toegevoegd",
                    description: "Het cijfer is succesvol toegevoegd. Klik op 'Wijzigingen opslaan' om de wijzigingen permanent te maken.",
                    variant: "default",
                  });
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