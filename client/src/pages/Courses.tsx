import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Eye, Pencil, Trash2, BookOpen, Users, XCircle, X, GraduationCap, FileText, Save, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { CustomDialogContent } from '@/components/ui/custom-dialog-content';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { PremiumHeader } from '@/components/layout/premium-header';

// Type definities
type CourseType = {
  id: number;
  name: string;
  code: string;
  description: string | null;
  programId: number | null;
  credits: number;
  instructor: string | null;
  maxStudents: number | null;
  isActive: boolean;
  learningObjectives: string | null;
  materials: string | null;
  competencies: string | null;
  prerequisites: string | null;
  enrolledStudents?: number;
  createdAt?: string;
};

type ProgramType = {
  id: number;
  name: string;
  code: string;
};

type StudentGroupType = {
  id: number;
  name: string;
  academicYear: string;
  programId: number;
  programName: string;
};

export default function Courses() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCourses, setSelectedCourses] = useState<number[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCourseDialog, setShowCourseDialog] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState("general");
  const [filterProgram, setFilterProgram] = useState<string>('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
  // Formulier state
  const [formData, setFormData] = useState<Partial<CourseType>>({
    name: '',
    code: '',
    description: '',
    programId: null,
    credits: 0,
    instructor: '',
    maxStudents: 30,
    isActive: true,
    learningObjectives: '',
    materials: '',
    competencies: '',
    prerequisites: ''
  });

  // Data fetching
  const { data: coursesData = { courses: [], totalCount: 0 }, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/courses', { searchTerm, program: filterProgram }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterProgram !== 'all') params.append('programId', filterProgram);
      
      const response = await apiRequest(`/api/courses?${params.toString()}`);
      return response;
    }
  });

  const { data: programsData = { programs: [] } } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      const response = await apiRequest('/api/programs');
      return response;
    }
  });

  // Mutations
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: Partial<CourseType>) => {
      const response = await apiRequest('/api/courses', {
        method: 'POST',
        body: courseData
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Vak toegevoegd",
        description: "Het vak is succesvol toegevoegd.",
      });
      setShowCourseDialog(false);
      resetFormData();
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van het vak.",
        variant: "destructive",
      });
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, courseData }: { id: number, courseData: Partial<CourseType> }) => {
      const response = await apiRequest(`/api/courses/${id}`, {
        method: 'PATCH',
        body: courseData
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Vak bijgewerkt",
        description: "Het vak is succesvol bijgewerkt.",
      });
      setShowCourseDialog(false);
      setSelectedCourse(null);
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van het vak.",
        variant: "destructive",
      });
    }
  });

  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/courses/${id}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Vak verwijderd",
        description: "Het vak is succesvol verwijderd.",
      });
      setShowConfirmDialog(false);
      setSelectedCourse(null);
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van het vak.",
        variant: "destructive",
      });
    }
  });

  // Event handlers
  const handleAddCourse = () => {
    resetFormData();
    setIsViewMode(false);
    setIsEditMode(false);
    setShowCourseDialog(true);
  };

  const handleViewCourse = (course: CourseType) => {
    setSelectedCourse(course);
    setFormData({
      ...course
    });
    setIsViewMode(true);
    setIsEditMode(false);
    setShowCourseDialog(true);
  };

  const handleEditCourse = (course: CourseType) => {
    setSelectedCourse(course);
    setFormData({
      ...course
    });
    setIsViewMode(false);
    setIsEditMode(true);
    setShowCourseDialog(true);
  };

  const handleDeleteCourse = (course: CourseType) => {
    setSelectedCourse(course);
    setShowConfirmDialog(true);
  };

  const confirmDeleteCourse = () => {
    if (selectedCourse) {
      deleteCourseMutation.mutate(selectedCourse.id);
    }
  };

  const handleFormChange = (field: keyof CourseType, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validatie
    if (!formData.name || !formData.code) {
      toast({
        title: "Vul alle verplichte velden in",
        description: "Naam en code zijn verplicht.",
        variant: "destructive",
      });
      return;
    }
    
    if (isEditMode && selectedCourse) {
      updateCourseMutation.mutate({ id: selectedCourse.id, courseData: formData });
    } else {
      createCourseMutation.mutate(formData);
    }
  };

  const resetFormData = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      programId: null,
      credits: 0,
      instructor: '',
      maxStudents: 30,
      isActive: true,
      learningObjectives: '',
      materials: '',
      competencies: '',
      prerequisites: ''
    });
    setActiveTab("general");
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const toggleCourseSelection = (id: number) => {
    setSelectedCourses(prev => 
      prev.includes(id) 
        ? prev.filter(courseId => courseId !== id) 
        : [...prev, id]
    );
  };

  const handleSelectAllCourses = () => {
    if (coursesData.courses.length === selectedCourses.length) {
      setSelectedCourses([]);
    } else {
      setSelectedCourses(coursesData.courses.map((course: CourseType) => course.id));
    }
  };

  const getProgramName = (programId: number | null) => {
    if (!programId) return "Geen programma";
    const program = programsData.programs.find((p: ProgramType) => p.id === programId);
    return program ? program.name : "Onbekend programma";
  };

  // Render the page
  return (
    <div className="flex-1 flex flex-col h-full">
      <div className="fixed top-0 left-64 right-0 z-30">
        <PremiumHeader 
          title="Curriculum" 
          icon={BookOpen}
          description="Beheer alle vakken, leerdoelen en lesmateriaal voor de verschillende programma's"
          breadcrumbs={{
            parent: "Evaluatie",
            current: "Curriculum"
          }}
        />
      </div>
      <div className="mt-[115px] flex-1 overflow-auto bg-gray-50">

      {/* Main content area */}
      <div className="px-6 py-6 flex-1">
        {/* Zoek- en actiebalk - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4">
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Zoekbalk */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Zoek op naam of code..."
                className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            {/* Acties */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterOptions(!showFilterOptions)}
                className="h-7 text-xs rounded-sm border-[#e5e7eb]"
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filters
                {showFilterOptions ? 
                  <ChevronUp className="h-3.5 w-3.5 ml-1" /> : 
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                }
              </Button>
              
              <Button
                size="sm"
                onClick={handleAddCourse}
                className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Nieuw Vak
              </Button>
            </div>
          </div>
          
          {/* Filter opties */}
          {showFilterOptions && (
            <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-wrap gap-3 items-center">
              <div className="flex items-center">
                {filterProgram !== 'all' && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setFilterProgram('all')}
                    className="h-7 text-xs text-blue-600 p-0 mr-3"
                  >
                    Filters wissen
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select 
                  value={filterProgram} 
                  onValueChange={setFilterProgram}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Programma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle programma's</SelectItem>
                    {programsData?.programs?.map((program: ProgramType) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
        
        {/* Tabel van vakken */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e5e7eb]">
              <thead className="bg-[#f9fafc]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left w-10">
                    <Checkbox 
                      checked={selectedCourses.length > 0 && selectedCourses.length === coursesData.courses.length && coursesData.courses.length > 0}
                      onCheckedChange={handleSelectAllCourses}
                      className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Naam</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Code</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Programma</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Credits</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Studenten</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Status</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right w-[120px]">
                    <span className="text-xs font-medium text-gray-700">Acties</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e5e7eb]">
                {isLoadingCourses ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-500">Laden...</span>
                      </div>
                    </td>
                  </tr>
                ) : coursesData.courses.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-4 text-center">
                      <div className="py-6">
                        <div className="flex flex-col items-center justify-center">
                          <BookOpen className="h-12 w-12 text-gray-300 mb-2" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Geen vakken gevonden</h3>
                          <p className="text-sm text-gray-500 max-w-md text-center mb-4">
                            {searchTerm || filterProgram !== 'all' 
                              ? 'Er zijn geen vakken die voldoen aan de huidige filters.' 
                              : 'Er zijn nog geen vakken toegevoegd in het systeem.'}
                          </p>
                          {(searchTerm || filterProgram !== 'all') && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSearchTerm('');
                                setFilterProgram('all');
                              }}
                              className="h-8 text-xs rounded-sm"
                            >
                              Filters wissen
                            </Button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  coursesData.courses.map((course: CourseType) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedCourses.includes(course.id)}
                          onCheckedChange={() => toggleCourseSelection(course.id)}
                          className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-gray-900">{course.name}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{course.code}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">
                        {getProgramName(course.programId)}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{course.credits}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <Users className="h-3.5 w-3.5 text-gray-500 mr-1" />
                          <span className="text-xs text-gray-500">{course.enrolledStudents || 0}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant="outline"
                          className={course.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}
                        >
                          {course.isActive ? "Actief" : "Inactief"}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewCourse(course)}
                            className="h-7 w-7 p-0 text-gray-500"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditCourse(course)}
                            className="h-7 w-7 p-0 text-gray-500"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCourse(course)}
                            className="h-7 w-7 p-0 text-gray-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialogen */}

      {/* Vak toevoegen/bewerken dialog */}
      <Dialog open={showCourseDialog} onOpenChange={setShowCourseDialog}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {isViewMode 
                ? "Vak details" 
                : isEditMode 
                  ? "Vak bewerken" 
                  : "Nieuw vak toevoegen"}
            </DialogTitle>
            <DialogDescription>
              {isViewMode 
                ? "Details van het geselecteerde vak." 
                : isEditMode 
                  ? "Werk de gegevens van dit vak bij."
                  : "Vul de gegevens in voor het nieuwe vak."}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleFormSubmit}>
            <Tabs defaultValue="general" value={activeTab} onValueChange={setActiveTab} className="mt-2">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="general" className="text-xs">Algemeen</TabsTrigger>
                <TabsTrigger value="content" className="text-xs">Inhoud</TabsTrigger>
                <TabsTrigger value="requirements" className="text-xs">Vereisten</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-xs">Naam</Label>
                    <Input 
                      id="name"
                      value={formData.name || ''}
                      onChange={(e) => handleFormChange('name', e.target.value)}
                      disabled={isViewMode}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-xs">Code</Label>
                    <Input 
                      id="code"
                      value={formData.code || ''}
                      onChange={(e) => handleFormChange('code', e.target.value)}
                      disabled={isViewMode}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="program" className="text-xs">Programma</Label>
                    <Select 
                      value={formData.programId?.toString() || ''}
                      onValueChange={(value) => handleFormChange('programId', value ? parseInt(value) : null)}
                      disabled={isViewMode}
                    >
                      <SelectTrigger id="program" className="h-8 text-xs">
                        <SelectValue placeholder="Selecteer programma" />
                      </SelectTrigger>
                      <SelectContent>
                        {programsData?.programs?.map((program: ProgramType) => (
                          <SelectItem key={program.id} value={program.id.toString()} className="text-xs">
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credits" className="text-xs">Credits</Label>
                    <Input 
                      id="credits"
                      type="number"
                      value={formData.credits || 0}
                      onChange={(e) => handleFormChange('credits', parseInt(e.target.value))}
                      disabled={isViewMode}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="instructor" className="text-xs">Docent</Label>
                    <Input 
                      id="instructor"
                      value={formData.instructor || ''}
                      onChange={(e) => handleFormChange('instructor', e.target.value)}
                      disabled={isViewMode}
                      className="h-8 text-xs"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStudents" className="text-xs">Maximum aantal studenten</Label>
                    <Input 
                      id="maxStudents"
                      type="number"
                      value={formData.maxStudents || 0}
                      onChange={(e) => handleFormChange('maxStudents', parseInt(e.target.value))}
                      disabled={isViewMode}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleFormChange('isActive', checked === true)}
                    disabled={isViewMode}
                    className="h-3.5 w-3.5 rounded-sm"
                  />
                  <Label htmlFor="isActive" className="text-xs">Actief</Label>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-xs">Beschrijving</Label>
                  <Textarea 
                    id="description"
                    value={formData.description || ''}
                    onChange={(e) => handleFormChange('description', e.target.value)}
                    disabled={isViewMode}
                    className="min-h-[100px] text-xs"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="learningObjectives" className="text-xs">Leerdoelen</Label>
                  <Textarea 
                    id="learningObjectives"
                    value={formData.learningObjectives || ''}
                    onChange={(e) => handleFormChange('learningObjectives', e.target.value)}
                    disabled={isViewMode}
                    className="min-h-[100px] text-xs"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="materials" className="text-xs">Materialen</Label>
                  <Textarea 
                    id="materials"
                    value={formData.materials || ''}
                    onChange={(e) => handleFormChange('materials', e.target.value)}
                    disabled={isViewMode}
                    className="min-h-[100px] text-xs"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="requirements" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="competencies" className="text-xs">Competenties</Label>
                  <Textarea 
                    id="competencies"
                    value={formData.competencies || ''}
                    onChange={(e) => handleFormChange('competencies', e.target.value)}
                    disabled={isViewMode}
                    className="min-h-[100px] text-xs"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="prerequisites" className="text-xs">Voorvereisten</Label>
                  <Textarea 
                    id="prerequisites"
                    value={formData.prerequisites || ''}
                    onChange={(e) => handleFormChange('prerequisites', e.target.value)}
                    disabled={isViewMode}
                    className="min-h-[100px] text-xs"
                  />
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowCourseDialog(false);
                  resetFormData();
                }}
                className="h-8 text-xs rounded-sm"
              >
                {isViewMode ? "Sluiten" : "Annuleren"}
              </Button>
              
              {isViewMode ? (
                <Button
                  type="button"
                  onClick={() => {
                    setIsViewMode(false);
                    setIsEditMode(true);
                  }}
                  className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
                >
                  <Pencil className="h-3.5 w-3.5 mr-1" />
                  Bewerken
                </Button>
              ) : (
                <Button 
                  type="submit"
                  className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
                  disabled={isViewMode}
                >
                  <Save className="h-3.5 w-3.5 mr-1" />
                  {isEditMode ? "Opslaan" : "Toevoegen"}
                </Button>
              )}
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bevestiging dialog */}
      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Vak verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je dit vak wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          {selectedCourse && (
            <div className="py-4">
              <div className="bg-gray-50 border rounded-sm p-4">
                <p className="font-medium">{selectedCourse.name}</p>
                <p className="text-sm text-gray-500">Code: {selectedCourse.code}</p>
                <p className="text-sm text-gray-500 mt-1">Programma: {getProgramName(selectedCourse.programId)}</p>
                <Badge 
                  variant="outline" 
                  className={`mt-2 ${selectedCourse.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-700 border-gray-200"}`}>
                  {selectedCourse.isActive ? "Actief" : "Inactief"}
                </Badge>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowConfirmDialog(false)}
              className="h-8 text-xs rounded-sm"
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteCourse}
              className="h-8 text-xs rounded-sm"
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}