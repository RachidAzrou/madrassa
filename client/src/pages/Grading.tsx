import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, Download, PlusCircle, History, Save, Plus, X, Edit, Trash2, AlertCircle } from 'lucide-react';
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
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

// Assessment schema
const assessmentSchema = z.object({
  courseId: z.coerce.number({
    required_error: "Selecteer een cursus",
  }),
  name: z.string().min(2, {
    message: "Naam moet minimaal 2 tekens bevatten",
  }),
  type: z.string({
    required_error: "Selecteer een beoordelingstype",
  }),
  maxScore: z.coerce.number().min(1, {
    message: "Maximale score moet minstens 1 zijn",
  }),
  weight: z.coerce.number().min(1).max(100, {
    message: "Gewicht moet tussen 1 en 100 procent zijn",
  }),
  dueDate: z.date({
    required_error: "Selecteer een deadline",
  }),
  description: z.string().optional(),
});

type AssessmentFormValues = z.infer<typeof assessmentSchema>;

// Grade schema
const gradeSchema = z.object({
  studentId: z.coerce.number({
    required_error: "Student ID is verplicht",
  }),
  courseId: z.coerce.number({
    required_error: "Cursus ID is verplicht",
  }),
  assessmentId: z.coerce.number({
    required_error: "Beoordeling ID is verplicht",
  }),
  score: z.coerce.number().min(0, {
    message: "Score moet minimaal 0 zijn",
  }),
  remark: z.string().optional(),
  date: z.date({
    required_error: "Datum is verplicht",
  }),
});

type GradeFormValues = z.infer<typeof gradeSchema>;

export default function Grading() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [activeTab, setActiveTab] = useState('grades');
  const [selectedCourse, setSelectedCourse] = useState('');
  const [selectedAssessment, setSelectedAssessment] = useState('');
  const [studentFilter, setStudentFilter] = useState('');
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [isGradesModified, setIsGradesModified] = useState(false);
  
  // Dialog controls
  const [isAddAssessmentOpen, setIsAddAssessmentOpen] = useState(false);
  const [isEditAssessmentOpen, setIsEditAssessmentOpen] = useState(false);
  const [isDeleteAssessmentOpen, setIsDeleteAssessmentOpen] = useState(false);
  const [selectedAssessmentItem, setSelectedAssessmentItem] = useState<any>(null);

  // Fetch courses for dropdown
  const { data: coursesData } = useQuery<any[]>({
    queryKey: ['/api/courses'],
    staleTime: 300000,
  });

  const courses = coursesData || [];

  // Fetch assessments for selected course
  const { data: assessmentsData } = useQuery<any[]>({
    queryKey: ['/api/assessments', { courseId: selectedCourse }],
    staleTime: 60000,
    enabled: !!selectedCourse,
  });

  const assessments = assessmentsData || [];

  // Fetch students
  const { data: studentsData } = useQuery<any[]>({
    queryKey: ['/api/students'],
    staleTime: 300000,
  });

  const students = studentsData || [];
  
  // Filter students based on search
  const filteredStudents = studentFilter 
    ? students.filter(student => 
        student.firstName.toLowerCase().includes(studentFilter.toLowerCase()) ||
        student.lastName.toLowerCase().includes(studentFilter.toLowerCase()) ||
        `${student.firstName} ${student.lastName}`.toLowerCase().includes(studentFilter.toLowerCase())
      )
    : students;

  // Fetch grades for selected course and assessment
  const { data: gradesData, isLoading, isError } = useQuery<any[]>({
    queryKey: ['/api/grades', { courseId: selectedCourse, assessmentId: selectedAssessment }],
    staleTime: 60000,
    enabled: !!selectedCourse && !!selectedAssessment,
  });

  const studentGrades = gradesData || [];
  
  // Assessment form
  const assessmentForm = useForm<AssessmentFormValues>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      name: '',
      type: 'exam',
      maxScore: 100,
      weight: 100,
      description: '',
    },
  });
  
  // Grade batch update form
  const batchGradesForm = useForm({
    defaultValues: {
      grades: {} as Record<string, string>,
    },
  });

  // Mutation for creating a new assessment
  const createAssessmentMutation = useMutation({
    mutationFn: async (values: AssessmentFormValues) => {
      return await apiRequest('POST', '/api/assessments', {
        ...values,
        dueDate: values.dueDate.toISOString().split('T')[0], // Format date for API
      });
    },
    onSuccess: () => {
      toast({
        title: 'Beoordeling aangemaakt',
        description: 'De nieuwe beoordeling is succesvol aangemaakt.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      setIsAddAssessmentOpen(false);
      assessmentForm.reset();
    },
    onError: () => {
      toast({
        title: 'Fout bij aanmaken beoordeling',
        description: 'Er is een fout opgetreden bij het aanmaken van de beoordeling.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for updating an assessment
  const updateAssessmentMutation = useMutation({
    mutationFn: async (values: AssessmentFormValues & { id: number }) => {
      const { id, ...data } = values;
      return await apiRequest('PUT', `/api/assessments/${id}`, {
        ...data,
        dueDate: data.dueDate.toISOString().split('T')[0], // Format date for API
      });
    },
    onSuccess: () => {
      toast({
        title: 'Beoordeling bijgewerkt',
        description: 'De beoordeling is succesvol bijgewerkt.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      setIsEditAssessmentOpen(false);
    },
    onError: () => {
      toast({
        title: 'Fout bij bijwerken beoordeling',
        description: 'Er is een fout opgetreden bij het bijwerken van de beoordeling.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for deleting an assessment
  const deleteAssessmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/assessments/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Beoordeling verwijderd',
        description: 'De beoordeling is succesvol verwijderd.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/assessments'] });
      setIsDeleteAssessmentOpen(false);
    },
    onError: () => {
      toast({
        title: 'Fout bij verwijderen beoordeling',
        description: 'Er is een fout opgetreden bij het verwijderen van de beoordeling.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutation for saving grades
  const batchSaveGradesMutation = useMutation({
    mutationFn: async (grades: any[]) => {
      return await apiRequest('POST', '/api/grades/batch', grades);
    },
    onSuccess: () => {
      toast({
        title: 'Cijfers opgeslagen',
        description: 'Studentcijfers zijn succesvol bijgewerkt.',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/grades'] });
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

  const handleCourseChange = (value: string) => {
    setSelectedCourse(value);
    setSelectedAssessment('');
    setGrades({});
    setIsGradesModified(false);
  };

  const handleAssessmentChange = (value: string) => {
    setSelectedAssessment(value);
    setGrades({});
    setIsGradesModified(false);
  };

  const handleGradeChange = (studentId: string, value: string) => {
    const numericValue = parseFloat(value);
    
    if (!isNaN(numericValue)) {
      setGrades(prev => ({
        ...prev,
        [studentId]: numericValue
      }));
      setIsGradesModified(true);
    }
  };
  
  const handleOpenAddAssessment = () => {
    assessmentForm.reset({
      courseId: parseInt(selectedCourse),
      name: '',
      type: 'exam',
      maxScore: 100,
      weight: 100,
      description: '',
      dueDate: new Date(),
    });
    setIsAddAssessmentOpen(true);
  };
  
  const handleOpenEditAssessment = (assessment: any) => {
    setSelectedAssessmentItem(assessment);
    assessmentForm.reset({
      courseId: assessment.courseId,
      name: assessment.name,
      type: assessment.type,
      maxScore: assessment.maxScore,
      weight: assessment.weight,
      description: assessment.description || '',
      dueDate: new Date(assessment.dueDate),
    });
    setIsEditAssessmentOpen(true);
  };
  
  const handleOpenDeleteAssessment = (assessment: any) => {
    setSelectedAssessmentItem(assessment);
    setIsDeleteAssessmentOpen(true);
  };
  
  const handleCreateAssessment = (values: AssessmentFormValues) => {
    createAssessmentMutation.mutate(values);
  };
  
  const handleEditAssessment = (values: AssessmentFormValues) => {
    if (!selectedAssessmentItem) return;
    updateAssessmentMutation.mutate({
      id: selectedAssessmentItem.id,
      ...values
    });
  };
  
  const handleDeleteAssessment = () => {
    if (!selectedAssessmentItem) return;
    deleteAssessmentMutation.mutate(selectedAssessmentItem.id);
  };

  const handleSaveGrades = () => {
    const gradesToSave = Object.entries(grades).map(([studentId, score]) => {
      const assessment = assessments.find(a => a.id === parseInt(selectedAssessment));
      if (!assessment) return null;
      
      return {
        studentId: parseInt(studentId),
        courseId: parseInt(selectedCourse),
        assessmentId: parseInt(selectedAssessment),
        assessmentType: assessment.type,
        assessmentName: assessment.name,
        score: score,
        maxScore: assessment.maxScore,
        weight: assessment.weight,
        date: new Date().toISOString().split('T')[0],
      };
    }).filter(Boolean);
    
    if (gradesToSave.length > 0) {
      batchSaveGradesMutation.mutate(gradesToSave as any[]);
    }
  };

  // Calculate grade percentage
  const calculateGrade = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100;
    return percentage.toFixed(1);
  };

  // Calculate letter grade and color based on score percentage
  const getGradeInfo = (percentage: number) => {
    if (percentage >= 90) return { letter: 'A', color: 'bg-green-100 text-green-800' };
    if (percentage >= 80) return { letter: 'B', color: 'bg-green-100 text-green-800' };
    if (percentage >= 70) return { letter: 'C', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage >= 60) return { letter: 'D', color: 'bg-yellow-100 text-yellow-800' };
    if (percentage >= 55) return { letter: 'D-', color: 'bg-orange-100 text-orange-800' };
    return { letter: 'F', color: 'bg-red-100 text-red-800' };
  };
  
  // Get Dutch grade (1-10 scale)
  const getDutchGrade = (percentage: number) => {
    // Convert percentage (0-100) to Dutch scale (1-10)
    // 100% = 10, 0% = 1
    const grade = 1 + (percentage / 100) * 9;
    return Math.max(1, Math.min(10, Math.round(grade * 10) / 10));
  };
  
  // Get student name initials
  const getInitials = (firstName: string = '', lastName: string = '') => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Beoordelingsbeheer</h1>
        <div className="flex items-center space-x-3">
          <Button variant="outline" className="flex items-center">
            <Download className="mr-2 h-4 w-4" />
            Cijfers Exporteren
          </Button>
          <Button 
            className="flex items-center"
            onClick={handleOpenAddAssessment}
            disabled={!selectedCourse}
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            Nieuwe Beoordeling
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="grades" value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full md:w-[400px]">
          <TabsTrigger value="grades">Cijfers</TabsTrigger>
          <TabsTrigger value="assessments">Beoordelingen</TabsTrigger>
          <TabsTrigger value="reports">Rapporten</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grades" className="space-y-4">
          {/* Course and assessment selector */}
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
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name || course.title} ({course.courseCode})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={selectedAssessment} 
                  onValueChange={handleAssessmentChange}
                  disabled={!selectedCourse}
                >
                  <SelectTrigger className="w-full sm:w-[300px]">
                    <SelectValue placeholder="Selecteer beoordeling" />
                  </SelectTrigger>
                  <SelectContent>
                    {assessments.length === 0 ? (
                      <SelectItem value="loading" disabled>
                        {!selectedCourse ? "Selecteer eerst een cursus" : "Geen beoordelingen gevonden"}
                      </SelectItem>
                    ) : (
                      assessments.map((assessment: any) => (
                        <SelectItem key={assessment.id} value={assessment.id.toString()}>
                          {assessment.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Input 
                    type="text" 
                    placeholder="Zoek studenten..." 
                    className="w-full md:w-64 pl-10"
                    value={studentFilter}
                    onChange={(e) => setStudentFilter(e.target.value)}
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>

          {/* Grading table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {!selectedCourse || !selectedAssessment ? (
              <div className="p-8 text-center">
                <h3 className="text-gray-500 text-lg font-medium">
                  {!selectedCourse 
                    ? "Selecteer een cursus" 
                    : "Selecteer een beoordeling"}
                </h3>
              </div>
            ) : isLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : isError ? (
              <div className="text-center py-12 text-red-500">
                Fout bij het laden van cijfergegevens. Probeer het opnieuw.
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                Geen studenten gevonden voor deze criteria.
              </div>
            ) : (
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
                        Cijfer (1-10)
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opmerkingen
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredStudents.map((student) => {
                      const assessment = assessments.find(a => a.id === parseInt(selectedAssessment));
                      const maxScore = assessment ? assessment.maxScore : 100;
                      
                      // Find existing grade for this student and assessment
                      const existingGrade = studentGrades.find(
                        (g: any) => g.studentId === student.id && g.assessmentId === parseInt(selectedAssessment)
                      );
                      
                      // Use existing grade or the one from temporary state
                      const studentGrade = grades[student.id] !== undefined 
                        ? grades[student.id] 
                        : (existingGrade ? existingGrade.score : 0);
                      
                      const percentage = (studentGrade / maxScore) * 100;
                      const { letter, color } = getGradeInfo(percentage);
                      const dutchGrade = getDutchGrade(percentage);
                      
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="flex-shrink-0 h-10 w-10">
                                <Avatar>
                                  <AvatarFallback>
                                    {getInitials(student.firstName, student.lastName)}
                                  </AvatarFallback>
                                </Avatar>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">
                                  {student.firstName} {student.lastName}
                                </div>
                                <div className="text-sm text-gray-500">
                                  {student.email}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {student.studentId || student.id}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
                                {dutchGrade.toFixed(1)}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <Input
                                type="number"
                                className="w-20"
                                value={studentGrade}
                                onChange={(e) => handleGradeChange(student.id.toString(), e.target.value)}
                                min={0}
                                max={maxScore}
                              />
                              <span className="ml-2 text-xs text-gray-500">/ {maxScore}</span>
                              <Progress 
                                value={percentage} 
                                max={100} 
                                className="w-20 h-2 ml-2" 
                              />
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            <Input
                              placeholder="Opmerkingen"
                              className="w-full"
                              defaultValue={existingGrade?.remark || ''}
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Action buttons for grades tab */}
          <div className="flex justify-end space-x-2">
            <Button 
              variant="default" 
              disabled={!isGradesModified || !selectedCourse || !selectedAssessment || batchSaveGradesMutation.isPending}
              onClick={handleSaveGrades}
            >
              {batchSaveGradesMutation.isPending ? (
                <>Opslaan...</>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Opslaan
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Assessments Tab */}
        <TabsContent value="assessments" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <Select value={selectedCourse} onValueChange={handleCourseChange}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Selecteer cursus" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name || course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleOpenAddAssessment} disabled={!selectedCourse}>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe beoordeling
            </Button>
          </div>

          {!selectedCourse && (
            <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-sm text-yellow-700">
                Selecteer eerst een cursus om beoordelingen te beheren.
              </p>
            </div>
          )}

          {selectedCourse && assessments.length === 0 && (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-lg border border-dashed border-gray-300">
              <div className="mb-4 rounded-full bg-gray-100 p-3">
                <AlertCircle className="h-6 w-6 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Geen beoordelingen</h3>
              <p className="mt-2 text-sm text-gray-500 max-w-md">
                Er zijn nog geen beoordelingen voor deze cursus. Maak een nieuwe beoordeling aan om te beginnen.
              </p>
              <Button onClick={handleOpenAddAssessment} className="mt-4" variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe beoordeling
              </Button>
            </div>
          )}

          {selectedCourse && assessments.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {assessments.map(assessment => (
                <Card key={assessment.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <Badge variant={assessment.type === 'exam' ? 'default' : 'secondary'}>
                          {assessment.type === 'exam' ? 'Examen' : 
                           assessment.type === 'quiz' ? 'Quiz' : 
                           assessment.type === 'assignment' ? 'Opdracht' : 
                           assessment.type}
                        </Badge>
                        <CardTitle className="mt-2 text-lg">{assessment.name}</CardTitle>
                      </div>
                      <div className="flex space-x-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleOpenEditAssessment(assessment)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleOpenDeleteAssessment(assessment)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 space-y-2">
                      <div className="flex justify-between">
                        <span>Max. score:</span>
                        <span className="font-medium">{assessment.maxScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gewicht:</span>
                        <span className="font-medium">{assessment.weight}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Datum:</span>
                        <span className="font-medium">
                          {assessment.dueDate ? format(new Date(assessment.dueDate), 'd MMM yyyy', { locale: nl }) : 'Niet ingesteld'}
                        </span>
                      </div>
                    </div>
                    {assessment.description && (
                      <p className="mt-2 text-sm">
                        {assessment.description}
                      </p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      variant="outline" 
                      className="w-full" 
                      onClick={() => {
                        setSelectedAssessment(assessment.id.toString());
                        setActiveTab('grades');
                      }}
                    >
                      Cijfers invoeren
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Reports Tab */}
        <TabsContent value="reports" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <Select value={selectedCourse} onValueChange={handleCourseChange}>
                <SelectTrigger className="w-[250px]">
                  <SelectValue placeholder="Selecteer cursus" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map(course => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name || course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exporteer rapport
            </Button>
          </div>

          {!selectedCourse && (
            <div className="flex items-center p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="h-5 w-5 text-yellow-500 mr-2" />
              <p className="text-sm text-yellow-700">
                Selecteer een cursus om de rapporten te bekijken.
              </p>
            </div>
          )}

          {selectedCourse && (
            <div className="bg-white border rounded-lg p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Cursusoverzicht</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Totaal studenten</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{filteredStudents.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Beoordelingen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{assessments.length}</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Gem. cijfer</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">7,5</p>
                  </CardContent>
                </Card>
              </div>
              
              <p className="text-gray-500 text-sm italic mb-4">
                Dit tabblad toont een samenvatting van de cursusprestaties. 
                Selecteer een cursus voor gedetailleerde rapporten.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Assessment Dialog */}
      <Dialog open={isAddAssessmentOpen} onOpenChange={setIsAddAssessmentOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Nieuwe beoordeling</DialogTitle>
            <DialogDescription>
              Maak een nieuwe beoordeling aan voor de geselecteerde cursus.
            </DialogDescription>
          </DialogHeader>
          <Form {...assessmentForm}>
            <form onSubmit={assessmentForm.handleSubmit(handleCreateAssessment)} className="space-y-4">
              <FormField
                control={assessmentForm.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cursus</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een cursus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name || course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={assessmentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naam</FormLabel>
                    <FormControl>
                      <Input placeholder="Tentamen 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={assessmentForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="exam">Examen</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="assignment">Opdracht</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="other">Anders</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={assessmentForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Datum</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={
                                "w-full pl-3 text-left font-normal"
                              }
                            >
                              {field.value ? (
                                format(field.value, "d MMM yyyy", { locale: nl })
                              ) : (
                                <span>Kies een datum</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={assessmentForm.control}
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximale score</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={assessmentForm.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gewicht (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={assessmentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschrijving (optioneel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Beschrijving of instructies" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddAssessmentOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={createAssessmentMutation.isPending}>
                  {createAssessmentMutation.isPending ? "Bezig met opslaan..." : "Opslaan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Edit Assessment Dialog */}
      <Dialog open={isEditAssessmentOpen} onOpenChange={setIsEditAssessmentOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Beoordeling bewerken</DialogTitle>
            <DialogDescription>
              Werk de geselecteerde beoordeling bij.
            </DialogDescription>
          </DialogHeader>
          <Form {...assessmentForm}>
            <form onSubmit={assessmentForm.handleSubmit(handleEditAssessment)} className="space-y-4">
              <FormField
                control={assessmentForm.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cursus</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value?.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een cursus" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {courses.map((course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name || course.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={assessmentForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naam</FormLabel>
                    <FormControl>
                      <Input placeholder="Tentamen 1" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={assessmentForm.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="exam">Examen</SelectItem>
                          <SelectItem value="quiz">Quiz</SelectItem>
                          <SelectItem value="assignment">Opdracht</SelectItem>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="other">Anders</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={assessmentForm.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Datum</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={
                                "w-full pl-3 text-left font-normal"
                              }
                            >
                              {field.value ? (
                                format(field.value, "d MMM yyyy", { locale: nl })
                              ) : (
                                <span>Kies een datum</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) =>
                              date < new Date("1900-01-01")
                            }
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={assessmentForm.control}
                  name="maxScore"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maximale score</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={assessmentForm.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gewicht (%)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="100" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={assessmentForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschrijving (optioneel)</FormLabel>
                    <FormControl>
                      <Input placeholder="Beschrijving of instructies" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditAssessmentOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" disabled={updateAssessmentMutation.isPending}>
                  {updateAssessmentMutation.isPending ? "Bezig met opslaan..." : "Opslaan"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Assessment Dialog */}
      <Dialog open={isDeleteAssessmentOpen} onOpenChange={setIsDeleteAssessmentOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Beoordeling verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze beoordeling wilt verwijderen? 
              Dit zal ook alle bijbehorende cijfers verwijderen. Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsDeleteAssessmentOpen(false)}>
              Annuleren
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDeleteAssessment}
              disabled={deleteAssessmentMutation.isPending}
            >
              {deleteAssessmentMutation.isPending ? "Bezig met verwijderen..." : "Verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}