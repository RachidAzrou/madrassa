import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Eye, Pencil, Trash2, BookOpen, Users, XCircle, X } from 'lucide-react';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
              <BookOpen className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Curriculum</h1>
              <p className="text-base text-gray-500 mt-1">Beheer het curriculum en de inschrijvingen</p>
            </div>
          </div>
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
      
      {/* Spacing element */}
      <div className="mb-5 mt-6"></div>
      
      <div className="w-full">
        {/* Table with Courses and Student Groups */}
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-medium">Naam</TableHead>
                <TableHead className="font-medium">Soort</TableHead>
                <TableHead className="font-medium">Aanmaakdatum</TableHead>
                <TableHead className="font-medium">Status</TableHead>
                <TableHead className="text-right font-medium">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="flex justify-center">
                      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : isError ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-red-500">
                    Fout bij het laden van curriculum. Probeer het opnieuw.
                  </TableCell>
                </TableRow>
              ) : courses.length === 0 && studentGroups.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10">
                    <div className="h-32 flex flex-col items-center justify-center text-gray-500">
                      <div className="text-[#1e3a8a] mb-2">
                        <BookOpen className="h-12 w-12 mx-auto opacity-30" />
                      </div>
                      <p className="text-sm font-medium">Geen curriculum beschikbaar</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {/* Courses rows */}
                  {courses.map((course) => (
                    <TableRow 
                      key={`course-${course.id}`} 
                      className="hover:bg-gray-50 group"
                    >
                      <TableCell className="font-medium flex items-center gap-2">
                        <div className="flex flex-col">
                          <span>{course.name}</span>
                          <span className="text-xs text-gray-500">{course.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-blue-50 border-blue-200 text-blue-800">
                          Vak
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {course.createdAt ? new Date(course.createdAt).toLocaleDateString('nl-NL') : 'Onbekend'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={course.isActive ? "default" : "secondary"}>
                          {course.isActive ? "Actief" : "Inactief"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                      </TableCell>
                    </TableRow>
                  ))}
                  
                  {/* Student Groups rows */}
                  {studentGroups.map((group) => (
                    <TableRow 
                      key={`group-${group.id}`} 
                      className="hover:bg-gray-50 group"
                    >
                      <TableCell className="font-medium flex items-center gap-2">
                        <div className="flex flex-col">
                          <span>{group.name}</span>
                          <span className="text-xs text-gray-500">{group.academicYear}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-green-50 border-green-200 text-green-800">
                          Klas
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {group.createdAt ? new Date(group.createdAt).toLocaleDateString('nl-NL') : 'Onbekend'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={group.isActive ? "default" : "secondary"}>
                          {group.isActive ? "Actief" : "Inactief"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {/* Handle view group */}}
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Bekijken</span>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {/* Handle edit group */}}
                            className="h-8 w-8 p-0"
                          >
                            <span className="sr-only">Bewerken</span>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {/* Handle delete group */}}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <span className="sr-only">Verwijderen</span>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              )}
            </TableBody>
          </Table>
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
      </div>
      
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
                <div className="md:col-span-2">
                  <Tabs defaultValue="info" className="w-full">
                    <TabsList className="mb-4">
                      <TabsTrigger value="info">Algemene info</TabsTrigger>
                      <TabsTrigger value="requirements">Vereisten</TabsTrigger>
                      <TabsTrigger value="curriculum">Leerplan</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="info" className="space-y-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-500 mb-1">Beschrijving</h3>
                        <p className="text-gray-800 text-sm">
                          {selectedCourse.description || 'Geen beschrijving beschikbaar'}
                        </p>
                      </div>
                      
                      {selectedCourse.materials && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Studiemateriaal</h3>
                          <p className="text-gray-800 text-sm">
                            {selectedCourse.materials}
                          </p>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="requirements" className="space-y-6">
                      {selectedCourse.prerequisites && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Instroomvereisten</h3>
                          <div className="bg-gray-50 p-4 rounded border border-gray-100">
                            <p className="text-gray-800 text-sm whitespace-pre-wrap">
                              {selectedCourse.prerequisites}
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {selectedCourse.competencies && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Uitstroomvereisten</h3>
                          <div className="bg-gray-50 p-4 rounded border border-gray-100">
                            <p className="text-gray-800 text-sm whitespace-pre-wrap">
                              {selectedCourse.competencies}
                            </p>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                    
                    <TabsContent value="curriculum" className="space-y-6">
                      {selectedCourse.learningObjectives && (
                        <div>
                          <h3 className="text-sm font-medium text-gray-500 mb-1">Leerdoelen / Leerplan</h3>
                          <div className="bg-gray-50 p-4 rounded border border-gray-100">
                            <p className="text-gray-800 text-sm whitespace-pre-wrap">
                              {selectedCourse.learningObjectives}
                            </p>
                          </div>
                        </div>
                      )}
                    </TabsContent>
                  </Tabs>
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
        <DialogContent className="sm:max-w-[95vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] sm:h-[85vh] p-0 gap-0 bg-white overflow-hidden [&>button>svg]:text-white">
          <DialogHeader className="p-6 border-b bg-gradient-to-r from-[#1e3a8a] to-[#4268c7] text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="h-6 w-6" />
                <DialogTitle className="text-xl">
                  {isEditDialogOpen ? 'Curriculum Bewerken' : 'Nieuw Curriculum Toevoegen'}
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-white/80 mt-2">
              {isEditDialogOpen
                ? 'Bewerk de gegevens van dit curriculum hieronder.'
                : 'Vul de onderstaande velden in om een nieuw curriculum toe te voegen.'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 130px)' }}>
              <div className="space-y-2 mb-6">
                <Label htmlFor="selectExistingCourse" className="text-[#1e3a8a] font-medium">Selecteer een bestaand vak</Label>
                <Select
                  onValueChange={(value) => {
                    const selectedCourse = courses.find((c) => c.id.toString() === value);
                    if (selectedCourse) {
                      setCourseFormData({
                        ...selectedCourse,
                        programId: selectedCourse.programId || undefined,
                      });
                    }
                  }}
                  value={isEditDialogOpen && selectedCourse ? selectedCourse.id.toString() : undefined}
                >
                  <SelectTrigger className="w-full border-gray-300">
                    <SelectValue placeholder="Kies een vak" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses.length > 0 ? (
                      courses.map((course) => (
                        <SelectItem key={course.id} value={course.id.toString()}>
                          {course.name} ({course.code})
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Geen vakken beschikbaar</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2 mb-6">
                <Label htmlFor="selectExistingGroup" className="text-[#1e3a8a] font-medium">Of selecteer een klas</Label>
                <Select
                  onValueChange={(value) => {
                    const selectedGroup = studentGroups.find((g) => g.id.toString() === value);
                    if (selectedGroup) {
                      // Logic to load the class data into the form
                      // This is placeholder logic, actual implementation depends on your data structure
                      const courseForGroup = courses.find((c) => c.id === selectedGroup.courseId);
                      if (courseForGroup) {
                        setCourseFormData({
                          ...courseForGroup,
                          programId: courseForGroup.programId || undefined,
                        });
                      }
                    }
                  }}
                >
                  <SelectTrigger className="w-full border-gray-300">
                    <SelectValue placeholder="Kies een klas" />
                  </SelectTrigger>
                  <SelectContent>
                    {studentGroups.length > 0 ? (
                      studentGroups.map((group) => (
                        <SelectItem key={group.id} value={group.id.toString()}>
                          {group.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Geen klassen beschikbaar</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-6 border-t border-gray-200 pt-6 mt-6">
                <div className="flex items-center gap-2 mb-3">
                  <BookOpen className="h-5 w-5 text-[#1e3a8a]" />
                  <h3 className="text-lg font-semibold text-[#1e3a8a]">Curriculum details</h3>
                </div>
                
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="prerequisites" className="text-[#1e3a8a]">Instroomvereisten</Label>
                    <Textarea
                      id="prerequisites"
                      value={courseFormData.prerequisites || ''}
                      onChange={(e) => setCourseFormData({ ...courseFormData, prerequisites: e.target.value })}
                      rows={3}
                      placeholder="Welke kennis of vaardigheden moeten studenten bezitten voor aanvang?"
                      className="border-gray-300 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Beschrijf wat studenten moeten weten of kunnen voordat ze aan dit curriculum beginnen
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="competencies" className="text-[#1e3a8a]">Uitstroomvereisten</Label>
                    <Textarea
                      id="competencies"
                      value={courseFormData.competencies || ''}
                      onChange={(e) => setCourseFormData({ ...courseFormData, competencies: e.target.value })}
                      rows={3}
                      placeholder="Welke kennis of vaardigheden moeten studenten beheersen na afronding?"
                      className="border-gray-300 resize-none"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Beschrijf welke competenties studenten moeten hebben na afronding
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="learningObjectives" className="text-[#1e3a8a]">Leerdoelen / Leerplan</Label>
                    <Textarea
                      id="learningObjectives"
                      value={courseFormData.learningObjectives || ''}
                      onChange={(e) => setCourseFormData({ ...courseFormData, learningObjectives: e.target.value })}
                      rows={3}
                      placeholder="Beschrijf de leerdoelen en het leerplan voor dit curriculum"
                      className="border-gray-300 resize-none"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="materials" className="text-[#1e3a8a]">Studiemateriaal</Label>
                    <Textarea
                      id="materials"
                      value={courseFormData.materials || ''}
                      onChange={(e) => setCourseFormData({ ...courseFormData, materials: e.target.value })}
                      rows={3}
                      placeholder="Beschrijf het benodigde studiemateriaal voor dit vak"
                      className="border-gray-300 resize-none"
                    />
                  </div>
                </div>
              </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t bg-gray-50">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
              }}
              className="border-gray-300"
            >
              Annuleren
            </Button>
            <Button
              type="button"
              onClick={isEditDialogOpen ? handleSubmitEditCourse : handleSubmitCourse}
              disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
              className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90"
            >
              {(createCourseMutation.isPending || updateCourseMutation.isPending) && (
                <div className="mr-2 h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              )}
              {isEditDialogOpen ? 'Opslaan' : 'Toevoegen'}
            </Button>
          </DialogFooter>
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