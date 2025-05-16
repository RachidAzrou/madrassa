import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Eye, Pencil, Trash2, BookOpen, GraduationCap, Glasses, Upload, FileText, Calendar, BookMarked, FileUp } from 'lucide-react';
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
  // Uitgebreide cursusinformatie
  learningObjectives: string | null; // Lesdoelen
  materials: string | null; // Benodigde lesmaterialen
  competencies: string | null; // Eindcompetenties
  prerequisites: string | null; // Voorwaarden voor deelname
  enrolledStudents?: number;
};

type ProgramType = {
  id: number;
  name: string;
  code: string;
};

export default function Courses() {
  // States
  const [searchTerm, setSearchTerm] = useState('');
  const [programFilter, setProgramFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(6);
  const [selectedCourse, setSelectedCourse] = useState<CourseType | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'material' | 'assignment' | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [courseFormData, setCourseFormData] = useState({
    name: '',
    code: '',
    programId: null as number | null,
    description: '',
    credits: 6,
    instructor: '',
    maxStudents: 30,
    isActive: true,
    learningObjectives: '',
    materials: '',
    competencies: '',
    prerequisites: '',
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch courses data
  const {
    data: coursesResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['/api/courses', { page: currentPage, search: searchTerm, program: programFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
      });
      
      if (programFilter !== 'all') {
        params.append('programId', programFilter);
      }
      
      try {
        return await apiRequest('GET', `/api/courses?${params.toString()}`);
      } catch (error) {
        console.error('Error fetching courses:', error);
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
        return await apiRequest('GET', '/api/programs');
      } catch (error) {
        console.error('Error fetching programs:', error);
        return [];
      }
    }
  });

  // Extract courses and total count from response
  const courses = coursesResponse?.courses || [];
  const totalCourses = coursesResponse?.totalCount || 0;
  const totalPages = Math.ceil(totalCourses / itemsPerPage);
  // Zorg ervoor dat programsData een array is
  const programs = Array.isArray(programsData) ? programsData : [];

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data: typeof courseFormData) => {
      return await apiRequest('POST', '/api/courses', data);
    },
    onSuccess: () => {
      toast({
        title: "Cursus toegevoegd",
        description: "De cursus is succesvol toegevoegd",
      });
      setIsAddDialogOpen(false);
      resetFormData();
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de cursus",
        variant: "destructive",
      });
      console.error('Error creating course:', error);
    },
  });

  // Update course mutation
  const updateCourseMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: typeof courseFormData }) => {
      return await apiRequest('PUT', `/api/courses/${id}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Cursus bijgewerkt",
        description: "De cursus is succesvol bijgewerkt",
      });
      setIsEditDialogOpen(false);
      resetFormData();
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van de cursus",
        variant: "destructive",
      });
      console.error('Error updating course:', error);
    },
  });

  // Delete course mutation
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/courses/${id}`);
    },
    onSuccess: () => {
      toast({
        title: "Cursus verwijderd",
        description: "De cursus is succesvol verwijderd",
      });
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de cursus",
        variant: "destructive",
      });
      console.error('Error deleting course:', error);
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
      prerequisites: '',
    });
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Handle program filter change
  const handleProgramFilterChange = (value: string) => {
    setProgramFilter(value);
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
      prerequisites: course.prerequisites || '',
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
    const program = programs.find((p: any) => p.id === id);
    return program ? program.name : 'Onbekend';
  };

  // Render courses page
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <BookOpen className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Cursussen</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Beheer het cursusaanbod en de inschrijvingen
          </p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Input
              placeholder="Zoek cursussen..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          <Button 
            onClick={handleAddCourse} 
            variant="default"
            size="default"
            className="bg-primary hover:bg-primary/90 flex items-center"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Cursus Toevoegen</span>
          </Button>
        </div>
      </div>
      
      {/* Cursus overzicht */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full flex justify-center py-8">
            <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : isError ? (
          <div className="col-span-full text-center py-8 text-red-500">
            Fout bij het laden van cursussen. Probeer het opnieuw.
          </div>
        ) : courses.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            Geen cursussen gevonden. Pas uw filters aan of voeg een nieuwe cursus toe.
          </div>
        ) : (
          courses.map((course: CourseType) => (
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
                <p className="mt-3 text-gray-600 text-sm line-clamp-2">{course.description || 'Geen beschrijving beschikbaar'}</p>
                
                <div className="mt-4 flex items-center">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {course.instructor ? course.instructor.charAt(0) : 'D'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-2">
                    <p className="text-xs font-medium text-gray-800">{course.instructor || 'Nog geen docent toegewezen'}</p>
                    <p className="text-xs text-gray-500">Docent</p>
                  </div>
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                  <Badge variant="outline" className="text-xs">
                    {getProgramNameById(course.programId)}
                  </Badge>
                  
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleViewCourse(course)}
                      title="Details bekijken"
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4 text-gray-500" />
                      <span className="sr-only">Bekijken</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => handleEditCourse(course)}
                      title="Cursus bewerken"
                      className="h-8 w-8 p-0"
                    >
                      <Pencil className="h-4 w-4 text-gray-500" />
                      <span className="sr-only">Bewerken</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteCourse(course)}
                      title="Cursus verwijderen"
                    >
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Verwijderen</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white mt-4 px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Tonen <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> tot <span className="font-medium">{Math.min(currentPage * itemsPerPage, totalCourses)}</span> van <span className="font-medium">{totalCourses}</span> resultaten
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginering">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Vorige</span>
                  &larr;
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      currentPage === i + 1
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Volgende</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      )}
      
      {/* Cursus detail dialoog */}
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
              
              <div className="mt-6">
                <Tabs defaultValue="details">
                  <TabsList className="mb-4">
                    <TabsTrigger value="details">Details</TabsTrigger>
                    <TabsTrigger value="content">Inhoud</TabsTrigger>
                    <TabsTrigger value="requirements">Vereisten</TabsTrigger>
                    <TabsTrigger value="materials">Lesmateriaal</TabsTrigger>
                    <TabsTrigger value="curriculum">Leerplan</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-md font-medium mb-3">Cursusinformatie</h3>
                        <div className="space-y-3">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Naam</span>
                            <span className="font-medium">{selectedCourse.name}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Code</span>
                            <span>{selectedCourse.code}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Programma</span>
                            <span>{getProgramNameById(selectedCourse.programId)}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Studiepunten</span>
                            <span>{selectedCourse.credits}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Status</span>
                            <Badge variant={selectedCourse.isActive ? "default" : "secondary"} className="w-fit mt-1">
                              {selectedCourse.isActive ? "Actief" : "Inactief"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h3 className="text-md font-medium mb-3">Onderwijsinformatie</h3>
                        <div className="space-y-3">
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Docent</span>
                            <span>{selectedCourse.instructor || 'Nog niet toegewezen'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Maximaal aantal studenten</span>
                            <span>{selectedCourse.maxStudents || 'Onbeperkt'}</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm text-gray-500">Ingeschreven studenten</span>
                            <span>{selectedCourse.enrolledStudents || 0} studenten</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <h3 className="text-md font-medium mb-3">Beschrijving</h3>
                      <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-md border border-gray-100">
                        {selectedCourse.description || 'Geen beschrijving beschikbaar'}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="content">
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-md font-medium mb-3">Leerdoelen</h3>
                        <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-md border border-gray-100">
                          {selectedCourse.learningObjectives || 'Geen leerdoelen gespecificeerd'}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-md font-medium mb-3">Lesmateriaal</h3>
                        <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-md border border-gray-100">
                          {selectedCourse.materials || 'Geen lesmateriaal gespecificeerd'}
                        </p>
                      </div>
                      
                      <div>
                        <h3 className="text-md font-medium mb-3">Competenties</h3>
                        <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-md border border-gray-100">
                          {selectedCourse.competencies || 'Geen competenties gespecificeerd'}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="requirements">
                    <div>
                      <h3 className="text-md font-medium mb-3">Vereisten voor deelname</h3>
                      <p className="text-gray-700 text-sm bg-gray-50 p-4 rounded-md border border-gray-100">
                        {selectedCourse.prerequisites || 'Geen vereisten gespecificeerd'}
                      </p>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="materials">
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-md font-medium">Studiemateriaal</h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-8 px-2"
                            onClick={() => {
                              setUploadType('material');
                              setIsUploadDialogOpen(true);
                            }}
                          >
                            <FileUp className="h-3 w-3 mr-1" /> Toevoegen
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded-md p-4 bg-white">
                            <div className="flex justify-between">
                              <div className="flex items-center">
                                <div className="bg-blue-100 rounded-full p-2 mr-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-700">
                                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path>
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">Hoofdboek Arabische Grammatica</h4>
                                  <p className="text-xs text-gray-500">PDF • 4.2 MB</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                              </Button>
                            </div>
                          </div>
                          
                          <div className="border rounded-md p-4 bg-white">
                            <div className="flex justify-between">
                              <div className="flex items-center">
                                <div className="bg-purple-100 rounded-full p-2 mr-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-purple-700">
                                    <path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <path d="M2 15h10"></path>
                                    <path d="M9 18l3-3-3-3"></path>
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">Oefeningen Week 1-5</h4>
                                  <p className="text-xs text-gray-500">Word • 568 KB</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-md font-medium">Opdrachten en Toetsen</h3>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-xs h-8 px-2"
                            onClick={() => {
                              setUploadType('assignment');
                              setIsUploadDialogOpen(true);
                            }}
                          >
                            <FileText className="h-3 w-3 mr-1" /> Toevoegen
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded-md p-4 bg-white">
                            <div className="flex justify-between">
                              <div className="flex items-center">
                                <div className="bg-red-100 rounded-full p-2 mr-3">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-700">
                                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                    <polyline points="14 2 14 8 20 8"></polyline>
                                    <line x1="16" y1="13" x2="8" y2="13"></line>
                                    <line x1="16" y1="17" x2="8" y2="17"></line>
                                    <polyline points="10 9 9 9 8 9"></polyline>
                                  </svg>
                                </div>
                                <div>
                                  <h4 className="font-medium text-sm">Halfjaarexamen 2025</h4>
                                  <p className="text-xs text-gray-500">PDF • 1.3 MB</p>
                                </div>
                              </div>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-500">
                                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                  <polyline points="7 10 12 15 17 10"></polyline>
                                  <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="curriculum">
                    <div className="space-y-6">
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-md font-medium">Leerdoelen per periode</h3>
                          <Button variant="outline" size="sm" className="text-xs h-8 px-2">
                            <span className="mr-1">+</span> Toevoegen
                          </Button>
                        </div>
                        
                        <div className="border rounded-md overflow-hidden">
                          <div className="bg-gray-50 p-3 border-b">
                            <h4 className="font-medium text-sm">Leerplan overzicht</h4>
                          </div>
                          <div className="p-4">
                            <div className="space-y-4">
                              <div className="border-l-4 border-blue-500 pl-3 py-1">
                                <h5 className="font-medium text-sm">Periode 1: Introductie en Basisprincipes</h5>
                                <p className="text-xs text-gray-600 mt-1">
                                  Na deze periode kan de student de fundamentele concepten uitleggen en eenvoudige oefeningen zelfstandig uitvoeren.
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  <Badge variant="outline" className="text-xs">Basis grammatica</Badge>
                                  <Badge variant="outline" className="text-xs">Eenvoudige constructies</Badge>
                                </div>
                              </div>
                              
                              <div className="border-l-4 border-green-500 pl-3 py-1">
                                <h5 className="font-medium text-sm">Periode 2: Verdieping en Praktijk</h5>
                                <p className="text-xs text-gray-600 mt-1">
                                  Student kan na deze periode complexere structuren herkennen en toepassen in praktische situaties.
                                </p>
                                <div className="mt-2 flex flex-wrap gap-1">
                                  <Badge variant="outline" className="text-xs">Gevorderde constructies</Badge>
                                  <Badge variant="outline" className="text-xs">Praktijkopdrachten</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <h3 className="text-md font-medium">In- en uitstroomcriteria</h3>
                          <Button variant="outline" size="sm" className="text-xs h-8 px-2">
                            <span className="mr-1">+</span> Bewerken
                          </Button>
                        </div>
                        
                        <div className="border rounded-md p-4 space-y-4">
                          <div>
                            <h4 className="text-sm font-medium mb-2">Instroom (voorkennis)</h4>
                            <div className="pl-3 border-l-2 border-gray-200">
                              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                                <li>Basiskennis Arabisch alfabet</li>
                                <li>Introductiecursus Arabisch afgerond</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Doorstroom (vervolgcursussen)</h4>
                            <div className="pl-3 border-l-2 border-gray-200">
                              <ul className="text-sm text-gray-600 space-y-1 list-disc pl-4">
                                <li>Arabisch Conversatie Niveau 2</li>
                                <li>Arabische Literatuur Inleiding</li>
                              </ul>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="text-sm font-medium mb-2">Uitstroom (eindniveau)</h4>
                            <div className="pl-3 border-l-2 border-gray-200">
                              <p className="text-sm text-gray-600">
                                Na succesvolle afronding kan de student eenvoudige gesprekken voeren over alledaagse onderwerpen en beschikt over
                                een woordenschat van ongeveer 1000 woorden.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              
              <DialogFooter className="mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsViewDialogOpen(false)}
                >
                  Sluiten
                </Button>
                <Button 
                  variant="default" 
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
      
      {/* Toevoegen/bewerken dialoog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          isAddDialogOpen ? setIsAddDialogOpen(false) : setIsEditDialogOpen(false);
          resetFormData();
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {isAddDialogOpen ? 'Nieuwe Cursus Toevoegen' : 'Cursus Bewerken'}
            </DialogTitle>
            <DialogDescription>
              Vul de onderstaande velden in om {isAddDialogOpen ? 'een nieuwe cursus toe te voegen' : 'de cursus bij te werken'}.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={isAddDialogOpen ? handleSubmitCourse : handleSubmitEditCourse} className="space-y-6 pt-4">
            <Tabs defaultValue="basic">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Basisinformatie</TabsTrigger>
                <TabsTrigger value="advanced">Geavanceerd</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-right">
                        Cursusnaam <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="name"
                        value={courseFormData.name}
                        onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="code" className="text-right">
                        Cursuscode <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="code"
                        value={courseFormData.code}
                        onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="programId" className="text-right">
                        Programma
                      </Label>
                      <Select 
                        value={courseFormData.programId?.toString() || ''} 
                        onValueChange={(val) => setCourseFormData({ 
                          ...courseFormData, 
                          programId: val ? parseInt(val) : null 
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Selecteer een programma" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Geen programma</SelectItem>
                          {programs.map((program: any) => (
                            <SelectItem key={program.id} value={program.id.toString()}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="credits" className="text-right">
                        Studiepunten <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="credits"
                        type="number"
                        min="0"
                        max="60"
                        value={courseFormData.credits}
                        onChange={(e) => setCourseFormData({ ...courseFormData, credits: parseInt(e.target.value) })}
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="instructor" className="text-right">
                        Docent
                      </Label>
                      <Input
                        id="instructor"
                        value={courseFormData.instructor}
                        onChange={(e) => setCourseFormData({ ...courseFormData, instructor: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="maxStudents" className="text-right">
                        Maximaal Aantal Studenten
                      </Label>
                      <Input
                        id="maxStudents"
                        type="number"
                        min="1"
                        value={courseFormData.maxStudents}
                        onChange={(e) => setCourseFormData({ ...courseFormData, maxStudents: parseInt(e.target.value) })}
                        className="mt-1"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="isActive" className="text-right">
                        Status
                      </Label>
                      <Select 
                        value={courseFormData.isActive ? "true" : "false"} 
                        onValueChange={(val) => setCourseFormData({ 
                          ...courseFormData, 
                          isActive: val === "true" 
                        })}
                      >
                        <SelectTrigger className="mt-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">Actief</SelectItem>
                          <SelectItem value="false">Inactief</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="description" className="text-right">
                        Beschrijving
                      </Label>
                      <Textarea
                        id="description"
                        value={courseFormData.description}
                        onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                        className="mt-1"
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="advanced">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="learningObjectives" className="text-right">
                      Leerdoelen
                    </Label>
                    <Textarea
                      id="learningObjectives"
                      value={courseFormData.learningObjectives}
                      onChange={(e) => setCourseFormData({ ...courseFormData, learningObjectives: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="materials" className="text-right">
                      Lesmateriaal
                    </Label>
                    <Textarea
                      id="materials"
                      value={courseFormData.materials}
                      onChange={(e) => setCourseFormData({ ...courseFormData, materials: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="competencies" className="text-right">
                      Competenties
                    </Label>
                    <Textarea
                      id="competencies"
                      value={courseFormData.competencies}
                      onChange={(e) => setCourseFormData({ ...courseFormData, competencies: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="prerequisites" className="text-right">
                      Vereisten voor deelname
                    </Label>
                    <Textarea
                      id="prerequisites"
                      value={courseFormData.prerequisites}
                      onChange={(e) => setCourseFormData({ ...courseFormData, prerequisites: e.target.value })}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => isAddDialogOpen ? setIsAddDialogOpen(false) : setIsEditDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit" 
                disabled={createCourseMutation.isPending || updateCourseMutation.isPending}
              >
                {(createCourseMutation.isPending || updateCourseMutation.isPending) && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isAddDialogOpen ? 'Toevoegen' : 'Opslaan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete confirmation dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">Cursus verwijderen</DialogTitle>
            <DialogDescription>
              Weet u zeker dat u de cursus "{selectedCourse?.name}" wilt verwijderen? 
              Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedCourse) {
                  deleteCourseMutation.mutate(selectedCourse.id);
                }
              }}
              disabled={deleteCourseMutation.isPending}
            >
              {deleteCourseMutation.isPending && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Bestand upload dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {uploadType === 'material' ? 'Lesmateriaal toevoegen' : 'Opdracht of toets toevoegen'}
            </DialogTitle>
            <DialogDescription>
              Upload een bestand om toe te voegen aan de cursus
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fileTitle">Titel</Label>
              <Input id="fileTitle" placeholder="Voer een titel in voor dit bestand" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fileDescription">Beschrijving (optioneel)</Label>
              <Textarea id="fileDescription" placeholder="Geef een korte beschrijving van dit bestand" className="resize-none h-20" />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="fileType">Bestandstype</Label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue placeholder="Selecteer bestandstype" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Document</SelectItem>
                  <SelectItem value="doc">Word Document</SelectItem>
                  <SelectItem value="ppt">PowerPoint Presentatie</SelectItem>
                  <SelectItem value="xls">Excel Werkblad</SelectItem>
                  <SelectItem value="other">Ander bestandstype</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="border-2 border-dashed rounded-md p-6 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
              />
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
              <p className="text-sm font-medium">Klik om een bestand te kiezen of sleep het hier naartoe</p>
              <p className="text-xs text-gray-500 mt-1">PDF, Word, PowerPoint, Excel tot 10MB</p>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md flex items-center">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                </svg>
              </div>
              <div className="text-sm text-blue-700">
                Bestanden worden geüpload naar de cursus en zijn zichtbaar voor alle studenten die zijn ingeschreven.
              </div>
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsUploadDialogOpen(false)}>
              Annuleren
            </Button>
            <Button type="button">
              Uploaden
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}