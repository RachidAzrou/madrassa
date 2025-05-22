import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Eye, Pencil, Trash2, BookOpen, Users, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

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
  programId: number | null;
  isActive: boolean;
  enrolledStudents?: number;
};

export default function Courses() {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('courses');
  
  const [courseFormData, setCourseFormData] = useState<Partial<CourseType>>({
    name: '',
    code: '',
    programId: null,
    description: '',
    credits: 6,
    instructor: '',
    maxStudents: 30,
    isActive: true,
    learningObjectives: '',
    materials: '',
    competencies: '',
    prerequisites: ''
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch courses data
  const {
    data: coursesResponse,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['/api/courses', { page: currentPage, search: searchTerm, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
      });
      
      if (statusFilter !== 'all') {
        params.append('isActive', statusFilter === 'active' ? 'true' : 'false');
      }
      
      try {
        return await apiRequest(`/api/courses?${params.toString()}`, {
          method: 'GET'
        });
      } catch (error: any) {
        console.error('Error fetching courses:', error);
        toast({
          title: "Fout bij ophalen van data",
          description: error?.message || "Er is een fout opgetreden bij het ophalen van de curriculum gegevens.",
          variant: "destructive",
        });
        return { courses: [], totalCount: 0 };
      }
    },
  });

  // Fetch programs for dropdown
  const {
    data: programsData,
  } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/programs', {
          method: 'GET'
        });
      } catch (error: any) {
        console.error('Error fetching programs:', error);
        toast({
          title: "Fout bij ophalen van programma's",
          description: error?.message || "Er is een fout opgetreden bij het ophalen van de programma's.",
          variant: "destructive",
        });
        return [];
      }
    }
  });
  
  // Fetch student groups for classes tab
  const {
    data: studentGroupsData,
    isLoading: isLoadingGroups,
    isError: isErrorGroups,
  } = useQuery({
    queryKey: ['/api/student-groups'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/student-groups', {
          method: 'GET'
        });
      } catch (error: any) {
        console.error('Error fetching student groups:', error);
        toast({
          title: "Fout bij ophalen van klassen",
          description: error?.message || "Er is een fout opgetreden bij het ophalen van de klassen.",
          variant: "destructive",
        });
        return [];
      }
    }
  });

  // Parse data
  const courses = coursesResponse?.courses || [];
  const totalCourses = coursesResponse?.totalCount || 0;
  const totalPages = Math.ceil(totalCourses / itemsPerPage);
  const programs = Array.isArray(programsData) ? programsData : [];
  const studentGroups = studentGroupsData || [];

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data: typeof courseFormData) => {
      try {
        return await apiRequest('/api/courses', {
          method: 'POST',
          body: data
        });
      } catch (error: any) {
        console.error('Error creating course:', error);
        throw new Error(error?.message || 'Fout bij het aanmaken van de cursus');
      }
    },
    onSuccess: () => {
      toast({
        title: "Cursus toegevoegd",
        description: "De cursus is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
      setIsAddDialogOpen(false);
      resetFormData();
      
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de cursus.",
        variant: "destructive",
      });
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: typeof courseFormData }) => {
      try {
        return await apiRequest(`/api/courses/${id}`, {
          method: 'PUT',
          body: data
        });
      } catch (error: any) {
        console.error('Error updating course:', error);
        throw new Error(error?.message || 'Fout bij het bijwerken van de cursus');
      }
    },
    onSuccess: () => {
      toast({
        title: "Cursus bijgewerkt",
        description: "De cursus is succesvol bijgewerkt in het systeem.",
        variant: "default",
      });
      setIsEditDialogOpen(false);
      resetFormData();
      
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de cursus.",
        variant: "destructive",
      });
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await apiRequest(`/api/courses/${id}`, {
          method: 'DELETE'
        });
      } catch (error: any) {
        console.error('Error deleting course:', error);
        throw new Error(error?.message || 'Fout bij het verwijderen van de cursus');
      }
    },
    onSuccess: () => {
      toast({
        title: "Cursus verwijderd",
        description: "De cursus is succesvol verwijderd uit het systeem.",
        variant: "default",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
      
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de cursus.",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  // Reset form data
  const resetFormData = () => {
    setCourseFormData({
      name: '',
      code: '',
      programId: null,
      description: '',
      credits: 6,
      instructor: '',
      maxStudents: 30,
      isActive: true,
      learningObjectives: '',
      materials: '',
      competencies: '',
      prerequisites: ''
    });
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };
  
  // Handle status filter change
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  // Handle adding new course
  const handleAddCourse = () => {
    resetFormData();
    setIsAddDialogOpen(true);
  };

  // Handle submit course form
  const handleSubmitCourse = (e: React.FormEvent) => {
    e.preventDefault();
    createCourseMutation.mutate(courseFormData);
  };

  // Handle editing course
  const handleEditCourse = (course: CourseType) => {
    setSelectedCourse(course);
    setCourseFormData({
      name: course.name,
      code: course.code,
      programId: course.programId,
      description: course.description || '',
      credits: course.credits,
      instructor: course.instructor || '',
      maxStudents: course.maxStudents || 30,
      isActive: course.isActive,
      learningObjectives: course.learningObjectives || '',
      materials: course.materials || '',
      competencies: course.competencies || '',
      prerequisites: course.prerequisites || ''
    });
    setIsEditDialogOpen(true);
  };

  // Handle submit edit course form
  const handleSubmitEditCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourse) {
      updateCourseMutation.mutate({
        id: selectedCourse.id,
        data: courseFormData
      });
    }
  };

  // Handle viewing course details
  const handleViewCourse = (course: CourseType) => {
    setSelectedCourse(course);
    setIsViewDialogOpen(true);
  };

  // Handle deleting course
  const handleDeleteCourse = (course: CourseType) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  // Get program name by id
  const getProgramNameById = (id: number | null): string => {
    if (!id) return 'Onbekend';
    const program = programs.find((p: ProgramType) => p.id === id);
    return program ? program.name : 'Onbekend';
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Curriculum</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Beheer het curriculum en de inschrijvingen
          </p>
        </div>
      </div>
      
      {/* Zoekbalk - onder de paginatitel geplaatst */}
      <div className="space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Zoek curricula..."
            className="pl-8 bg-white w-full"
            value={searchTerm}
            onChange={handleSearchChange}
          />
          {searchTerm && (
            <XCircle
              className="absolute right-3 top-2.5 h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600"
              onClick={() => setSearchTerm("")}
            />
          )}
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={handleAddCourse} 
            variant="default"
            size="default"
            className="bg-primary hover:bg-primary/90 flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Curriculum Toevoegen</span>
          </Button>
        </div>
      </div>
      
      {/* Main Tabs for Courses/Classes and Filter Tabs for Status */}
      <div className="flex flex-col md:flex-row md:items-center gap-4 mb-5 mt-6">
        <Tabs defaultValue="courses" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="p-1 bg-blue-900/10 mb-0 flex w-auto">
            <TabsTrigger value="courses" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
              Vakken
            </TabsTrigger>
            <TabsTrigger value="classes" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
              Klassen
            </TabsTrigger>
          </TabsList>
        </Tabs>
        
        <Tabs defaultValue="active" className="w-auto">
          <TabsList className="p-1 bg-blue-900/10 mb-0 flex w-auto">
            <TabsTrigger 
              value="active" 
              className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md"
              onClick={() => handleStatusFilterChange('active')}
            >
              Actief
            </TabsTrigger>
            <TabsTrigger 
              value="inactive" 
              className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md"
              onClick={() => handleStatusFilterChange('inactive')}
            >
              Inactief
            </TabsTrigger>
            <TabsTrigger 
              value="all" 
              className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md"
              onClick={() => handleStatusFilterChange('all')}
            >
              Alle vakken
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Content Tabs */}
      <Tabs defaultValue="courses" className="w-full" value={activeTab}>
        
        {/* Courses Tab Content */}
        <TabsContent value="courses">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoading ? (
              <div className="col-span-full flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : isError ? (
              <div className="col-span-full text-center py-8 text-red-500">
                Fout bij het laden van curriculum. Probeer het opnieuw.
              </div>
            ) : courses.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                Geen curriculum gevonden. Pas uw filters aan of voeg een nieuw curriculum toe.
              </div>
            ) : (
              courses.map((course) => (
                <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">{course.name}</h3>
                        <p className="text-gray-500 text-sm mt-1">{course.code} • {course.credits} Studiepunten</p>
                      </div>
                      <Badge variant={course.isActive ? "default" : "secondary"}>
                        {course.isActive ? "Actief" : "Inactief"}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span>{getProgramNameById(course.programId)}</span>
                      </div>
                      
                      {course.instructor && (
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-2" />
                          <span>{course.instructor}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="px-5 py-3 bg-gray-50 border-t flex justify-end space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewCourse(course)}
                      className="h-8 w-8 p-0"
                    >
                      <span className="sr-only">Bekijken</span>
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditCourse(course)}
                      className="h-8 w-8 p-0"
                    >
                      <span className="sr-only">Bewerken</span>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteCourse(course)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <span className="sr-only">Verwijderen</span>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
          
          {/* Pagination */}
          {!isLoading && !isError && totalPages > 1 && (
            <div className="flex justify-center mt-8">
              <div className="flex space-x-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Vorige
                </Button>
                
                {[...Array(totalPages)].map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </Button>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  Volgende
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
        
        {/* Classes Tab Content */}
        <TabsContent value="classes">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {isLoadingGroups ? (
              <div className="col-span-full flex justify-center py-8">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : isErrorGroups ? (
              <div className="col-span-full text-center py-8 text-red-500">
                Fout bij het laden van klassen. Probeer het opnieuw.
              </div>
            ) : studentGroups.length === 0 ? (
              <div className="col-span-full text-center py-8 text-gray-500">
                Geen klassen gevonden. Voeg een nieuwe klas toe.
              </div>
            ) : (
              studentGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-lg text-gray-800">{group.name}</h3>
                        <p className="text-gray-500 text-sm mt-1">Schooljaar: {group.academicYear}</p>
                      </div>
                      <Badge variant={group.isActive ? "default" : "secondary"}>
                        {group.isActive ? "Actief" : "Inactief"}
                      </Badge>
                    </div>
                    
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center text-sm text-gray-500">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span>{getProgramNameById(group.programId)}</span>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <Users className="h-4 w-4 mr-2" />
                        <span>{group.enrolledStudents || 0} studenten</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* View Course Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          {selectedCourse && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-semibold flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  {selectedCourse.name}
                </DialogTitle>
                <DialogDescription className="flex items-center mt-1">
                  <Badge className="mr-2">{selectedCourse.code}</Badge>
                  <span className="text-gray-500">{selectedCourse.credits} Studiepunten</span>
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-1">Beschrijving</h3>
                    <p className="text-gray-800 text-sm">
                      {selectedCourse.description || 'Geen beschrijving beschikbaar'}
                    </p>
                  </div>
                  
                  {selectedCourse.learningObjectives && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Leerdoelen</h3>
                      <p className="text-gray-800 text-sm">
                        {selectedCourse.learningObjectives}
                      </p>
                    </div>
                  )}
                  
                  {selectedCourse.competencies && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Competenties</h3>
                      <p className="text-gray-800 text-sm">
                        {selectedCourse.competencies}
                      </p>
                    </div>
                  )}
                  
                  {selectedCourse.prerequisites && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Voorvereisten</h3>
                      <p className="text-gray-800 text-sm">
                        {selectedCourse.prerequisites}
                      </p>
                    </div>
                  )}
                  
                  {selectedCourse.materials && (
                    <div>
                      <h3 className="text-sm font-medium text-gray-500 mb-1">Studiemateriaal</h3>
                      <p className="text-gray-800 text-sm">
                        {selectedCourse.materials}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h3 className="text-sm font-medium text-gray-500 mb-3">Cursus Informatie</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-gray-500">Status</p>
                        <Badge variant={selectedCourse.isActive ? "default" : "secondary"} className="mt-1">
                          {selectedCourse.isActive ? "Actief" : "Inactief"}
                        </Badge>
                      </div>
                      
                      <div>
                        <p className="text-xs text-gray-500">Programma</p>
                        <p className="text-sm font-medium">{getProgramNameById(selectedCourse.programId)}</p>
                      </div>
                      
                      {selectedCourse.instructor && (
                        <div>
                          <p className="text-xs text-gray-500">Instructeur</p>
                          <p className="text-sm font-medium">{selectedCourse.instructor}</p>
                        </div>
                      )}
                      
                      {selectedCourse.maxStudents && (
                        <div>
                          <p className="text-xs text-gray-500">Maximum aantal studenten</p>
                          <p className="text-sm font-medium">{selectedCourse.maxStudents}</p>
                        </div>
                      )}
                      
                      <div>
                        <p className="text-xs text-gray-500">Ingeschreven studenten</p>
                        <p className="text-sm font-medium">{selectedCourse.enrolledStudents || 0} / {selectedCourse.maxStudents || 'Onbeperkt'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter className="mt-8 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Sluiten
                </Button>
                <Button
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEditCourse(selectedCourse);
                  }}
                >
                  Bewerken
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Add/Edit Course Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? 'Curriculum Bewerken' : 'Nieuw Curriculum Toevoegen'}
            </DialogTitle>
            <DialogDescription>
              {isEditDialogOpen
                ? 'Bewerk de gegevens van dit curriculum hieronder.'
                : 'Vul de onderstaande velden in om een nieuw curriculum toe te voegen.'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={isEditDialogOpen ? handleSubmitEditCourse : handleSubmitCourse} className="space-y-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Naam *</Label>
                <Input
                  id="name"
                  value={courseFormData.name}
                  onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="code">Code *</Label>
                <Input
                  id="code"
                  value={courseFormData.code}
                  onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="programId">Programma</Label>
                <Select
                  value={courseFormData.programId?.toString() || ''}
                  onValueChange={(value) => setCourseFormData({ ...courseFormData, programId: value ? parseInt(value) : null })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecteer een programma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Geen programma</SelectItem>
                    {programs.map((program: ProgramType) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="credits">Studiepunten *</Label>
                <Input
                  id="credits"
                  type="number"
                  min="0"
                  value={courseFormData.credits?.toString() || '0'}
                  onChange={(e) => setCourseFormData({ ...courseFormData, credits: parseInt(e.target.value) })}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="instructor">Instructeur</Label>
                <Input
                  id="instructor"
                  value={courseFormData.instructor || ''}
                  onChange={(e) => setCourseFormData({ ...courseFormData, instructor: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxStudents">Maximum aantal studenten</Label>
                <Input
                  id="maxStudents"
                  type="number"
                  min="0"
                  value={courseFormData.maxStudents?.toString() || ''}
                  onChange={(e) => setCourseFormData({ ...courseFormData, maxStudents: parseInt(e.target.value) })}
                />
                <p className="text-xs text-gray-500">Laat leeg voor onbeperkt</p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Beschrijving</Label>
              <Textarea
                id="description"
                value={courseFormData.description || ''}
                onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="learningObjectives">Leerdoelen</Label>
              <Textarea
                id="learningObjectives"
                value={courseFormData.learningObjectives || ''}
                onChange={(e) => setCourseFormData({ ...courseFormData, learningObjectives: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="competencies">Competenties</Label>
                <Textarea
                  id="competencies"
                  value={courseFormData.competencies || ''}
                  onChange={(e) => setCourseFormData({ ...courseFormData, competencies: e.target.value })}
                  rows={3}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="prerequisites">Voorvereisten</Label>
                <Textarea
                  id="prerequisites"
                  value={courseFormData.prerequisites || ''}
                  onChange={(e) => setCourseFormData({ ...courseFormData, prerequisites: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="materials">Studiemateriaal</Label>
              <Textarea
                id="materials"
                value={courseFormData.materials || ''}
                onChange={(e) => setCourseFormData({ ...courseFormData, materials: e.target.value })}
                rows={3}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={courseFormData.isActive || false}
                onChange={(e) => setCourseFormData({ ...courseFormData, isActive: e.target.checked })}
                className="rounded border-gray-300 focus:ring-primary h-4 w-4 text-primary"
              />
              <Label htmlFor="isActive" className="cursor-pointer">Actief</Label>
            </div>
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
              >
                {(createCourseMutation.isPending || updateCourseMutation.isPending) && (
                  <div className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                )}
                {isEditDialogOpen ? 'Opslaan' : 'Toevoegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Bevestig Verwijdering</DialogTitle>
            <DialogDescription>
              Weet u zeker dat u het curriculum <span className="font-semibold">{selectedCourse?.name}</span> wilt verwijderen?
              Dit kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="gap-2 sm:justify-start">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => {
                if (selectedCourse) {
                  deleteCourseMutation.mutate(selectedCourse.id);
                }
              }}
              disabled={deleteCourseMutation.isPending}
            >
              {deleteCourseMutation.isPending && (
                <div className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}