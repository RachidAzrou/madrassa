import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: number;
  name: string;
  code: string;
  description: string | null;
  programId: number | null;
  credits: number;
  instructor: string | null;
  maxStudents: number | null;
  isActive: boolean;
  // Nieuwe velden voor uitgebreide cursusinformatie
  learningObjectives: string | null; // Lesdoelen
  materials: string | null; // Benodigde lesmaterialen
  competencies: string | null; // Eindcompetenties wat studenten moeten kunnen
  prerequisites: string | null; // Voorwaarden voor deelname
}

export default function Courses() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [department, setDepartment] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  
  // State voor cursus dialogen
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [courseFormData, setCourseFormData] = useState({
    name: '',
    code: '',
    programId: null as number | null,
    description: '',
    credits: 6,
    instructor: '',
    maxStudents: 30,
    isActive: true,
    // Nieuwe velden
    learningObjectives: '',
    materials: '',
    competencies: '',
    prerequisites: '',
  });

  // Fetch courses with filters
  const { data, isLoading, isError } = useQuery<{ courses: Course[], totalCount: number }>({
    queryKey: ['/api/courses', { searchTerm, department, page: currentPage }],
    staleTime: 30000,
  });

  const courses = data?.courses || [];
  const totalCourses = data?.totalCount || 0;
  const totalPages = Math.ceil(totalCourses / 10); // Assuming 10 courses per page

  // Mutatie om een cursus toe te voegen
  const createCourseMutation = useMutation({
    mutationFn: async (courseData: typeof courseFormData) => {
      return apiRequest('POST', '/api/courses', courseData);
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      
      // Reset form and close dialog
      setCourseFormData({
        name: '',
        code: '',
        programId: null,
        description: '',
        credits: 6,
        instructor: '',
        maxStudents: 30,
        isActive: true,
        // Reset nieuwe velden
        learningObjectives: '',
        materials: '',
        competencies: '',
        prerequisites: '',
      });
      setIsAddDialogOpen(false);
      
      // Toon succes melding
      toast({
        title: "Cursus toegevoegd",
        description: "De cursus is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de cursus.",
        variant: "destructive",
      });
    }
  });

  const handleAddCourse = () => {
    // Open het toevoeg-dialoogvenster
    setIsAddDialogOpen(true);
  };
  
  const handleSubmitCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    createCourseMutation.mutate(courseFormData);
  };
  
  const handleEditCourse = (course: Course) => {
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
      // Nieuwe velden
      learningObjectives: course.learningObjectives || '',
      materials: course.materials || '',
      competencies: course.competencies || '',
      prerequisites: course.prerequisites || '',
    });
    setIsEditDialogOpen(true);
  };
  
  // Mutatie voor het bijwerken van een cursus
  const updateCourseMutation = useMutation({
    mutationFn: async (data: { id: number; courseData: typeof courseFormData }) => {
      return apiRequest('PUT', `/api/courses/${data.id}`, data.courseData);
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      
      // Reset form and close dialog
      setIsEditDialogOpen(false);
      setSelectedCourse(null);
      
      // Toon succes melding
      toast({
        title: "Cursus bijgewerkt",
        description: "De cursus is succesvol bijgewerkt.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de cursus.",
        variant: "destructive",
      });
    }
  });

  const handleSubmitEditCourse = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedCourse) {
      updateCourseMutation.mutate({
        id: selectedCourse.id,
        courseData: courseFormData
      });
    }
  };
  
  const handleViewCourse = (id: string) => {
    console.log(`Viewing course with ID: ${id}`);
    toast({
      title: "Cursus details",
      description: `Details bekijken voor cursus met ID: ${id}`,
      variant: "default",
    });
  };
  
  const handleDeleteCourse = (course: Course) => {
    setSelectedCourse(course);
    setIsDeleteDialogOpen(true);
  };

  // Mutatie voor het verwijderen van een cursus
  const deleteCourseMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest('DELETE', `/api/courses/${id}`);
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      
      // Reset form and close dialog
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
      
      // Toon succes melding
      toast({
        title: "Cursus verwijderd",
        description: "De cursus is succesvol verwijderd uit het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de cursus.",
        variant: "destructive",
      });
    }
  });

  const confirmDeleteCourse = () => {
    if (selectedCourse) {
      deleteCourseMutation.mutate(selectedCourse.id);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleDepartmentChange = (value: string) => {
    setDepartment(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Campus afbeelding met collegezaal */}
      <div className="relative rounded-xl overflow-hidden h-48 md:h-64">
        <img 
          src="https://images.unsplash.com/photo-1427504494785-3a9ca7044f45?ixlib=rb-4.0.3&auto=format&fit=crop&w=1500&h=500" 
          alt="Universiteitslokaal" 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-r from-gray-900/60 to-gray-900/30 flex items-center">
          <div className="px-6 md:px-10">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Cursusbeheer</h1>
            <p className="text-gray-200 max-w-xl">Beheer de cursuscatalogus, inschrijvingen en roosters van uw instelling op één plek.</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Zoek cursussen..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Select value={department} onValueChange={handleDepartmentChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Alle Afdelingen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Afdelingen</SelectItem>
              <SelectItem value="cs">Informatica</SelectItem>
              <SelectItem value="bus">Bedrijfskunde</SelectItem>
              <SelectItem value="eng">Techniek</SelectItem>
              <SelectItem value="arts">Kunst</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddCourse} className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Nieuwe Cursus Toevoegen</span>
        </Button>
      </div>

      {/* Course Cards */}
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
            Geen cursussen gevonden. Pas uw filters aan.
          </div>
        ) : (
          courses.map((course: any) => (
            <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              <div className="p-5">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-800">{course.name}</h3>
                    <p className="text-gray-500 text-sm mt-1">{course.code} • {course.credits} Studiepunten</p>
                  </div>
                  <span className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-0.5 rounded">
                    {course.programId === 1 ? 'Informatica' : 
                    course.programId === 2 ? 'Bedrijfskunde' : 
                    course.programId === 3 ? 'Techniek' : 'Algemeen'}
                  </span>
                </div>
                <p className="mt-3 text-gray-600 text-sm">{course.description || 'Geen beschrijving beschikbaar'}</p>
                
                {/* Toon de nieuwe velden indien beschikbaar */}
                {course.learningObjectives && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-700">Lesdoelen:</h4>
                    <p className="text-gray-600 text-xs mt-1">{course.learningObjectives}</p>
                  </div>
                )}
                
                {course.materials && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-700">Lesmateriaal:</h4>
                    <p className="text-gray-600 text-xs mt-1">{course.materials}</p>
                  </div>
                )}
                
                {course.competencies && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-700">Eindcompetenties:</h4>
                    <p className="text-gray-600 text-xs mt-1">{course.competencies}</p>
                  </div>
                )}
                
                {course.prerequisites && (
                  <div className="mt-3">
                    <h4 className="text-xs font-semibold text-gray-700">Voorwaarden:</h4>
                    <p className="text-gray-600 text-xs mt-1">{course.prerequisites}</p>
                  </div>
                )}
                
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
                <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center">
                  <div className="flex items-center text-gray-500 text-xs">
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                    </svg>
                    <span>{course.enrolledStudents || 0} studenten ingeschreven</span>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-primary hover:text-primary-dark"
                      onClick={() => handleEditCourse(course)}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      <span>Bewerken</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-gray-500 hover:text-gray-700"
                      onClick={() => handleViewCourse(course.id)}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      <span>Bekijken</span>
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700"
                      onClick={() => handleDeleteCourse(course)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
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
      {!isLoading && !isError && totalPages > 0 && (
        <div className="flex items-center justify-center mt-8">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
            <button
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="sr-only">Vorige</span>
              &larr;
            </button>
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i}
                onClick={() => handlePageChange(i + 1)}
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
              onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              <span className="sr-only">Volgende</span>
              &rarr;
            </button>
          </nav>
        </div>
      )}

      {/* Add Course Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nieuwe Cursus Toevoegen</DialogTitle>
            <DialogDescription>
              Vul de cursusinformatie in om een nieuwe cursus toe te voegen aan het systeem.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitCourse}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="name" className="text-right">
                    Cursusnaam
                  </Label>
                  <Input
                    id="name"
                    required
                    value={courseFormData.name}
                    onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="code" className="text-right">
                    Cursuscode
                  </Label>
                  <Input
                    id="code"
                    required
                    value={courseFormData.code}
                    onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="programId" className="text-right">
                    Programma
                  </Label>
                  <Select
                    value={courseFormData.programId?.toString() || ''}
                    onValueChange={(value) => setCourseFormData({ ...courseFormData, programId: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer programma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Informatica</SelectItem>
                      <SelectItem value="2">Bedrijfskunde</SelectItem>
                      <SelectItem value="3">Techniek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="credits" className="text-right">
                    Studiepunten
                  </Label>
                  <Select
                    value={courseFormData.credits.toString()}
                    onValueChange={(value) => setCourseFormData({ ...courseFormData, credits: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer studiepunten" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 ECTS</SelectItem>
                      <SelectItem value="6">6 ECTS</SelectItem>
                      <SelectItem value="9">9 ECTS</SelectItem>
                      <SelectItem value="12">12 ECTS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="description" className="text-right">
                    Beschrijving
                  </Label>
                  <Input
                    id="description"
                    value={courseFormData.description || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Nieuwe velden */}
              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="learningObjectives" className="text-right">
                    Lesdoelen
                  </Label>
                  <textarea
                    id="learningObjectives"
                    value={courseFormData.learningObjectives || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, learningObjectives: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    rows={3}
                    placeholder="Beschrijf de lesdoelen van deze cursus..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="materials" className="text-right">
                    Lesmateriaal
                  </Label>
                  <textarea
                    id="materials"
                    value={courseFormData.materials || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, materials: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    rows={3}
                    placeholder="Welk lesmateriaal is nodig voor deze cursus?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="competencies" className="text-right">
                    Eindcompetenties
                  </Label>
                  <textarea
                    id="competencies"
                    value={courseFormData.competencies || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, competencies: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    rows={3}
                    placeholder="Wat moeten studenten kunnen na afloop van de cursus?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="prerequisites" className="text-right">
                    Voorwaarden
                  </Label>
                  <textarea
                    id="prerequisites"
                    value={courseFormData.prerequisites || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, prerequisites: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    rows={3}
                    placeholder="Welke voorkennis of andere cursussen zijn vereist?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="instructor" className="text-right">
                    Docent
                  </Label>
                  <Input
                    id="instructor"
                    value={courseFormData.instructor || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, instructor: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="maxStudents" className="text-right">
                    Maximum aantal studenten
                  </Label>
                  <Input
                    id="maxStudents"
                    type="number"
                    value={courseFormData.maxStudents || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, maxStudents: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="isActive" className="text-right mr-2">
                    Status
                  </Label>
                  <Select
                    value={courseFormData.isActive ? "true" : "false"}
                    onValueChange={(value) => setCourseFormData({ ...courseFormData, isActive: value === "true" })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Actief</SelectItem>
                      <SelectItem value="false">Inactief</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsAddDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                disabled={createCourseMutation.isPending}
              >
                {createCourseMutation.isPending ? 'Bezig met toevoegen...' : 'Cursus toevoegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Course Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cursus bewerken</DialogTitle>
            <DialogDescription>
              Bewerk de cursusinformatie en klik op opslaan om de wijzigingen toe te passen.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEditCourse}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="edit-name" className="text-right">
                    Cursusnaam
                  </Label>
                  <Input
                    id="edit-name"
                    required
                    value={courseFormData.name}
                    onChange={(e) => setCourseFormData({ ...courseFormData, name: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="edit-code" className="text-right">
                    Cursuscode
                  </Label>
                  <Input
                    id="edit-code"
                    required
                    value={courseFormData.code}
                    onChange={(e) => setCourseFormData({ ...courseFormData, code: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="edit-programId" className="text-right">
                    Programma
                  </Label>
                  <Select
                    value={courseFormData.programId?.toString() || ''}
                    onValueChange={(value) => setCourseFormData({ ...courseFormData, programId: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer programma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Informatica</SelectItem>
                      <SelectItem value="2">Bedrijfskunde</SelectItem>
                      <SelectItem value="3">Techniek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="edit-credits" className="text-right">
                    Studiepunten
                  </Label>
                  <Select
                    value={courseFormData.credits.toString()}
                    onValueChange={(value) => setCourseFormData({ ...courseFormData, credits: parseInt(value) })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer studiepunten" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 ECTS</SelectItem>
                      <SelectItem value="6">6 ECTS</SelectItem>
                      <SelectItem value="9">9 ECTS</SelectItem>
                      <SelectItem value="12">12 ECTS</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="edit-description" className="text-right">
                    Beschrijving
                  </Label>
                  <Input
                    id="edit-description"
                    value={courseFormData.description || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, description: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Nieuwe velden voor het bewerkformulier */}
              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="edit-learningObjectives" className="text-right">
                    Lesdoelen
                  </Label>
                  <textarea
                    id="edit-learningObjectives"
                    value={courseFormData.learningObjectives || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, learningObjectives: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    rows={3}
                    placeholder="Beschrijf de lesdoelen van deze cursus..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="edit-materials" className="text-right">
                    Lesmateriaal
                  </Label>
                  <textarea
                    id="edit-materials"
                    value={courseFormData.materials || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, materials: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    rows={3}
                    placeholder="Welk lesmateriaal is nodig voor deze cursus?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="edit-competencies" className="text-right">
                    Eindcompetenties
                  </Label>
                  <textarea
                    id="edit-competencies"
                    value={courseFormData.competencies || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, competencies: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    rows={3}
                    placeholder="Wat moeten studenten kunnen na afloop van de cursus?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="edit-prerequisites" className="text-right">
                    Voorwaarden
                  </Label>
                  <textarea
                    id="edit-prerequisites"
                    value={courseFormData.prerequisites || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, prerequisites: e.target.value })}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                    rows={3}
                    placeholder="Welke voorkennis of andere cursussen zijn vereist?"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="edit-instructor" className="text-right">
                    Docent
                  </Label>
                  <Input
                    id="edit-instructor"
                    value={courseFormData.instructor || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, instructor: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="edit-maxStudents" className="text-right">
                    Maximum aantal studenten
                  </Label>
                  <Input
                    id="edit-maxStudents"
                    type="number"
                    value={courseFormData.maxStudents || ''}
                    onChange={(e) => setCourseFormData({ ...courseFormData, maxStudents: parseInt(e.target.value) })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                disabled={updateCourseMutation.isPending}
              >
                {updateCourseMutation.isPending ? 'Bezig met bijwerken...' : 'Wijzigingen opslaan'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Course Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Cursus verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze cursus wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <div className="my-4">
            {selectedCourse && (
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="font-semibold">{selectedCourse.name}</p>
                <p className="text-sm text-gray-500">Code: {selectedCourse.code}</p>
                <p className="text-sm text-gray-500">Studiepunten: {selectedCourse.credits} ECTS</p>
              </div>
            )}
          </div>
          <DialogFooter>
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
              onClick={confirmDeleteCourse}
              disabled={deleteCourseMutation.isPending}
            >
              {deleteCourseMutation.isPending ? 'Bezig met verwijderen...' : 'Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
