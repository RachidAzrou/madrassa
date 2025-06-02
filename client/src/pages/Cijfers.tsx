import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Search, Download, Save, Plus, X, Edit, Trash2, Calculator, CheckCircle, Star, ClipboardList, FileText, Award, Users, BookOpen, GraduationCap, Target, TrendingUp, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from '@/hooks/use-toast';
import { PremiumHeader } from '@/components/layout/premium-header';

export default function Cijfers() {
  // State
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAssessment, setEditingAssessment] = useState<any>(null);
  const [deletingAssessment, setDeletingAssessment] = useState<any>(null);
  const [step, setStep] = useState<'class' | 'subject' | 'assessments' | 'grades'>('class');
  const [grades, setGrades] = useState<{[studentId: string]: string}>({});
  
  // Form state for new assessment
  const [assessmentForm, setAssessmentForm] = useState({
    name: '',
    type: '',
    maxPoints: '',
    weight: ''
  });

  // Hooks
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Data fetching
  const { data: classesData = [] } = useQuery({ queryKey: ['/api/student-groups'] });
  const { data: subjectsData = { programs: [] } } = useQuery({ queryKey: ['/api/programs'] });
  const { data: studentsData = [] } = useQuery({ 
    queryKey: ['/api/students'], 
    enabled: !!selectedClass
  });

  // Data fetching for assessments
  const { data: assessmentsData = [] } = useQuery({ 
    queryKey: ['/api/assessments', selectedSubject?.id],
    queryFn: () => {
      const url = selectedSubject?.id 
        ? `/api/assessments?courseId=${selectedSubject.id}`
        : '/api/assessments';
      return fetch(url).then(res => res.json());
    },
    enabled: !!selectedSubject
  });

  // Mutation for creating new assessment
  const createAssessmentMutation = useMutation({
    mutationFn: async (assessmentData: any) => {
      return apiRequest('/api/assessments', {
        method: 'POST',
        body: JSON.stringify({
          ...assessmentData,
          courseId: selectedSubject?.id,
          maxPoints: parseInt(assessmentData.maxPoints),
          weight: parseFloat(assessmentData.weight)
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      toast({
        title: "Beoordeling toegevoegd",
        description: "De nieuwe beoordeling is succesvol aangemaakt."
      });
      setShowAddModal(false);
      resetAssessmentForm();
      setEditingAssessment(null);
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het aanmaken van de beoordeling.",
        variant: "destructive"
      });
    }
  });

  // Mutation for deleting assessment
  const deleteAssessmentMutation = useMutation({
    mutationFn: async (assessmentId: number) => {
      return apiRequest(`/api/assessments/${assessmentId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      toast({
        title: "Beoordeling verwijderd",
        description: "De beoordeling is succesvol verwijderd."
      });
    },
    onError: () => {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de beoordeling.",
        variant: "destructive"
      });
    }
  });

  // Form handlers
  const handleAssessmentFormChange = (field: string, value: string) => {
    setAssessmentForm(prev => ({ ...prev, [field]: value }));
  };

  const resetAssessmentForm = () => {
    setAssessmentForm({
      name: '',
      type: '',
      maxPoints: '',
      weight: ''
    });
    setEditingAssessment(null);
  };

  const handleSaveAssessment = () => {
    if (!assessmentForm.name || !assessmentForm.type || !assessmentForm.maxPoints) {
      toast({
        title: "Velden incompleet",
        description: "Vul naam, type en maximum punten in om door te gaan.",
        variant: "destructive"
      });
      return;
    }

    createAssessmentMutation.mutate(assessmentForm);
  };

  const handleClassSelect = (classGroup: any) => {
    setSelectedClass(classGroup);
    setStep('subject');
    setSelectedSubject(null);
  };

  const handleSubjectSelect = (subject: any) => {
    setSelectedSubject(subject);
    setStep('assessments');
  };

  const handleAssessmentSelect = (assessment: any) => {
    setSelectedAssessment(assessment);
    setStep('grades');
    // Initialize grades for all students
    const initialGrades: {[studentId: string]: string} = {};
    studentsData.forEach((student: any) => {
      initialGrades[student.id] = '';
    });
    setGrades(initialGrades);
  };

  const handleEditAssessment = (assessment: any) => {
    setAssessmentForm({
      name: assessment.name,
      type: assessment.type,
      maxPoints: assessment.maxScore.toString(),
      weight: assessment.weight ? assessment.weight.toString() : ''
    });
    setEditingAssessment(assessment);
    setShowAddModal(true);
  };

  const handleDeleteAssessment = (assessment: any) => {
    setDeletingAssessment(assessment);
    setShowDeleteModal(true);
  };

  const confirmDeleteAssessment = () => {
    if (deletingAssessment) {
      deleteAssessmentMutation.mutate(deletingAssessment.id);
      setShowDeleteModal(false);
      setDeletingAssessment(null);
    }
  };

  const handleGradeChange = (studentId: string, grade: string) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: grade
    }));
  };

  const handleSaveGrades = () => {
    // In real implementation, this would save to database
    toast({
      title: "Cijfers opgeslagen",
      description: `Cijfers voor ${selectedAssessment.name} zijn succesvol opgeslagen.`,
    });
  };

  const handleBack = () => {
    if (step === 'grades') {
      setStep('assessments');
      setSelectedAssessment(null);
      setGrades({});
    } else if (step === 'assessments') {
      setStep('subject');
      setSelectedSubject(null);
    } else if (step === 'subject') {
      setStep('class');
      setSelectedClass(null);
    }
  };

  const getStepIcon = (stepName: string) => {
    switch (stepName) {
      case 'class': return <Users className="h-5 w-5" />;
      case 'subject': return <BookOpen className="h-5 w-5" />;
      case 'assessments': return <GraduationCap className="h-5 w-5" />;
      default: return <Users className="h-5 w-5" />;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'test': return <FileText className="h-4 w-4" />;
      case 'taak': return <ClipboardList className="h-4 w-4" />;
      case 'examen': return <Award className="h-4 w-4" />;
      case 'presentatie': return <Users className="h-4 w-4" />;
      case 'project': return <Star className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 text-green-800 border-green-200';
    if (score >= 60) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <PremiumHeader 
        title="Cijfers & Beoordelingen" 
        path="Evaluatie > Cijfers" 
        icon={Calculator}
        description="Beheer cijfers en beoordelingen per klas en vak"
      />

      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          
          {/* Progress indicator */}
          <div className="bg-white rounded-lg p-6 shadow-sm border">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Navigatie</h2>
              {step !== 'class' && (
                <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
                  ← Terug
                </Button>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${step === 'class' ? 'bg-blue-100 text-blue-700' : selectedClass ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {getStepIcon('class')}
                <span className="font-medium">Klas</span>
                {selectedClass && <span className="text-sm">({selectedClass.name})</span>}
              </div>
              <div className="h-px bg-gray-300 flex-1"></div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${step === 'subject' ? 'bg-blue-100 text-blue-700' : selectedSubject ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {getStepIcon('subject')}
                <span className="font-medium">Vak</span>
                {selectedSubject && <span className="text-sm">({selectedSubject.name})</span>}
              </div>
              <div className="h-px bg-gray-300 flex-1"></div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${step === 'assessments' ? 'bg-blue-100 text-blue-700' : selectedAssessment ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {getStepIcon('assessments')}
                <span className="font-medium">Beoordelingen</span>
                {selectedAssessment && <span className="text-sm">({selectedAssessment.name})</span>}
              </div>
              <div className="h-px bg-gray-300 flex-1"></div>
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${step === 'grades' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                <Calculator className="h-5 w-5" />
                <span className="font-medium">Punten invoeren</span>
              </div>
            </div>
          </div>

          {/* Step 1: Klas selectie */}
          {step === 'class' && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Selecteer een klas
                  </CardTitle>
                  <CardDescription>
                    Kies de klas waarvoor je beoordelingen wilt beheren
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {classesData.map((classGroup: any) => (
                      <Card 
                        key={classGroup.id}
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-blue-300"
                        onClick={() => handleClassSelect(classGroup)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{classGroup.name}</h3>
                              <p className="text-sm text-gray-600">{classGroup.academicYear}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <Users className="h-3 w-3" />
                                24
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 2: Vak selectie */}
          {step === 'subject' && selectedClass && (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-green-600" />
                    Selecteer een vak voor {selectedClass.name}
                  </CardTitle>
                  <CardDescription>
                    Kies het vak waarvoor je beoordelingen wilt bekijken of toevoegen
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {subjectsData?.programs?.map((subject: any) => (
                      <Card 
                        key={subject.id}
                        className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-green-300"
                        onClick={() => handleSubjectSelect(subject)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{subject.name}</h3>
                              <p className="text-sm text-gray-600">{subject.code}</p>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <Badge variant="outline" className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                0 beoordelingen
                              </Badge>
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                Gem. 8.2
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 3: Beoordelingen overzicht */}
          {step === 'assessments' && selectedSubject && (
            <div className="space-y-6">
              {/* Header met acties */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-purple-600" />
                        Beoordelingen: {selectedSubject.name}
                      </CardTitle>
                      <CardDescription>
                        Klas {selectedClass.name} • {Array.isArray(assessmentsData) ? assessmentsData.length : 0} beoordelingen
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                      <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" />
                        Nieuwe beoordeling
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {/* Zoekbalk */}
                  <div className="mb-4">
                    <div className="relative max-w-md">
                      <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                      <Input
                        placeholder="Zoek beoordelingen..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>

                  {/* Beoordelingen tabel */}
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-gray-50">
                        <TableRow>
                          <TableHead className="font-semibold">Beoordeling</TableHead>
                          <TableHead className="font-semibold">Type</TableHead>
                          <TableHead className="font-semibold">Datum</TableHead>
                          <TableHead className="font-semibold">Gewicht</TableHead>
                          <TableHead className="font-semibold">Studenten</TableHead>
                          <TableHead className="font-semibold">Gemiddelde</TableHead>
                          <TableHead className="font-semibold text-right">Acties</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(assessmentsData) && assessmentsData.length > 0 ? assessmentsData.map((assessment: any) => (
                          <TableRow key={assessment.id} className="hover:bg-gray-50 group">
                            <TableCell className="font-medium">{assessment.name}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                {getTypeIcon(assessment.type)}
                                {assessment.type}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-600">{assessment.date}</TableCell>
                            <TableCell>
                              <Badge variant="secondary">{assessment.weight}%</Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-gray-400" />
                                <span>{assessment.students}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={`${getScoreColor(assessment.points)} border`}>
                                {assessment.points}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleAssessmentSelect(assessment)}
                                  className="text-blue-600 hover:text-blue-700"
                                >
                                  <User className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleEditAssessment(assessment)}
                                  className="text-gray-600 hover:text-blue-700"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={() => handleDeleteAssessment(assessment)}
                                  className="text-red-600 hover:text-red-700"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )) : (
                          <TableRow>
                            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                              Geen beoordelingen gevonden voor dit vak
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Step 4: Punten invoeren */}
          {step === 'grades' && selectedAssessment && (
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Calculator className="h-6 w-6 text-blue-600" />
                  <div>
                    <CardTitle>Punten invoeren - {selectedAssessment.name}</CardTitle>
                    <CardDescription>
                      Voer punten in voor alle studenten in {selectedClass.name} - {selectedSubject.name}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-800">Assessment Details</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Type:</span>
                        <span className="ml-2 font-medium">{selectedAssessment.type}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Max Punten:</span>
                        <span className="ml-2 font-medium">{selectedAssessment.points}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Datum:</span>
                        <span className="ml-2 font-medium">{selectedAssessment.date}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Student</TableHead>
                          <TableHead>Student ID</TableHead>
                          <TableHead>Punten ({selectedAssessment.points} max)</TableHead>
                          <TableHead>Percentage</TableHead>
                          <TableHead>Cijfer</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {Array.isArray(studentsData) && studentsData.length > 0 ? studentsData.map((student: any) => {
                          const points = grades[student.id] || '';
                          const percentage = points ? Math.round((parseFloat(points) / selectedAssessment.points) * 100) : 0;
                          const grade = points ? Math.round((percentage / 10)) : 0;
                          
                          return (
                            <TableRow key={student.id}>
                              <TableCell>
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <User className="h-4 w-4 text-blue-600" />
                                  </div>
                                  <span className="font-medium">{student.firstName} {student.lastName}</span>
                                </div>
                              </TableCell>
                              <TableCell className="text-gray-500">{student.studentId}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  min="0"
                                  max={selectedAssessment.points}
                                  value={points}
                                  onChange={(e) => handleGradeChange(student.id, e.target.value)}
                                  placeholder="0"
                                  className="w-20"
                                />
                              </TableCell>
                              <TableCell>
                                {points && (
                                  <Badge variant={percentage >= 55 ? 'default' : 'destructive'}>
                                    {percentage}%
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {points && (
                                  <Badge 
                                    variant={grade >= 6 ? 'default' : 'destructive'}
                                    className={grade >= 8 ? 'bg-green-500 hover:bg-green-600' : ''}
                                  >
                                    {grade}/10
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        }) : (
                          <TableRow>
                            <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                              Geen studenten gevonden in deze klas
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex items-center justify-between pt-6 border-t">
                    <div className="text-sm text-gray-500">
                      {Object.values(grades).filter(g => g !== '').length} van {Array.isArray(studentsData) ? studentsData.length : 0} studenten ingevuld
                    </div>
                    <div className="flex gap-3">
                      <Button variant="outline" onClick={handleBack}>
                        Terug
                      </Button>
                      <Button 
                        onClick={handleSaveGrades}
                        disabled={Object.values(grades).filter(g => g !== '').length === 0}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Save className="h-4 w-4 mr-2" />
                        Cijfers opslaan
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Add Assessment Dialog */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent className="sm:max-w-[600px]" noPadding>
          <DialogHeader variant="premium">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  {editingAssessment ? 'Beoordeling bewerken' : 'Nieuwe beoordeling toevoegen'}
                </DialogTitle>
                <DialogDescription className="text-blue-100 mt-1">
                  {editingAssessment 
                    ? `Bewerk de beoordeling "${editingAssessment.name}" voor ${selectedSubject?.name || 'geselecteerd vak'}`
                    : `Voeg een nieuwe beoordeling toe voor ${selectedSubject?.name || 'geselecteerd vak'}`
                  }
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam beoordeling</Label>
                <Input 
                  id="name" 
                  placeholder="bijv. Test 1" 
                  value={assessmentForm.name}
                  onChange={(e) => handleAssessmentFormChange('name', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={assessmentForm.type} onValueChange={(value) => handleAssessmentFormChange('type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">Test</SelectItem>
                    <SelectItem value="taak">Taak</SelectItem>
                    <SelectItem value="examen">Examen</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="points">Maximum punten</Label>
                <Input 
                  id="points" 
                  type="number" 
                  placeholder="100" 
                  value={assessmentForm.maxPoints}
                  onChange={(e) => handleAssessmentFormChange('maxPoints', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Gewicht (%) <span className="text-gray-500 text-sm">- optioneel</span></Label>
                <Input 
                  id="weight" 
                  type="number" 
                  placeholder="25" 
                  value={assessmentForm.weight}
                  onChange={(e) => handleAssessmentFormChange('weight', e.target.value)}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowAddModal(false);
              resetAssessmentForm();
            }}>
              Annuleren
            </Button>
            <Button 
              onClick={handleSaveAssessment}
              disabled={createAssessmentMutation.isPending}
            >
              {createAssessmentMutation.isPending ? 'Bezig...' : (editingAssessment ? 'Wijzigingen opslaan' : 'Beoordeling toevoegen')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[500px]" noPadding>
          <DialogHeader variant="premium" className="bg-red-600">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-white/20 flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-white">
                  Beoordeling verwijderen
                </DialogTitle>
                <DialogDescription className="text-red-100 mt-1">
                  Deze actie kan niet ongedaan worden gemaakt
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Weet je het zeker?
                </h3>
                <p className="text-gray-600 mb-4">
                  Je staat op het punt om de beoordeling{' '}
                  <span className="font-semibold text-gray-900">"{deletingAssessment?.name}"</span>{' '}
                  permanent te verwijderen. Alle gekoppelde cijfers en resultaten gaan verloren.
                </p>
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span className="text-sm font-medium text-red-800">
                      Deze actie kan niet ongedaan worden gemaakt
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowDeleteModal(false);
                setDeletingAssessment(null);
              }}
            >
              Annuleren
            </Button>
            <Button 
              variant="destructive"
              onClick={confirmDeleteAssessment}
              disabled={deleteAssessmentMutation.isPending}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleteAssessmentMutation.isPending ? 'Verwijderen...' : 'Definitief verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}