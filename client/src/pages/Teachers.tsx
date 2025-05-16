import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Pencil, Trash2, Search, Plus, PlusCircle, Eye, User, Phone, MapPin, Briefcase, BookOpen } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDateToDisplayFormat } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type TeacherType = {
  id: number;
  teacherId: string;
  firstName: string;
  lastName: string;
  gender?: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  street?: string;
  houseNumber?: string;
  postalCode?: string;
  city?: string;
  isActive: boolean;
  hireDate?: Date;
  profession?: string; // Toegevoegd voor beroep
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// Interface voor de API respons met het volgende docent ID
interface NextTeacherIdResponse {
  nextTeacherId: string;
}

type AvailabilityType = {
  id: number;
  teacherId: number;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isBackup: boolean;
  notes?: string;
};

type LanguageType = {
  id: number;
  teacherId: number;
  language: string;
  proficiencyLevel: string;
};

type CourseAssignmentType = {
  id: number;
  teacherId: number;
  courseId: number;
  isActive: boolean;
  assignedDate: Date;
  notes?: string;
  courseName?: string; // Voor weergave
};

export default function Teachers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [teacherFormData, setTeacherFormData] = useState({
    teacherId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    dateOfBirth: '',
    profession: '',
    gender: '',
    notes: '',
    isActive: true
  });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query voor het ophalen van een nieuw docent ID
  const { 
    data: nextTeacherIdData,
    isLoading: isLoadingNextId 
  } = useQuery<NextTeacherIdResponse>({
    queryKey: ['/api/next-teacher-id'],
    enabled: isCreateDialogOpen, // Alleen ophalen wanneer het formulier open is
  });

  useEffect(() => {
    // Als er een nieuw ID is opgehaald, update dan het formulier
    if (nextTeacherIdData?.nextTeacherId && isCreateDialogOpen) {
      setTeacherFormData(prev => ({
        ...prev,
        teacherId: nextTeacherIdData.nextTeacherId
      }));
    }
  }, [nextTeacherIdData, isCreateDialogOpen]);

  // Fetching teachers data
  const {
    data: teachersResponse,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['/api/teachers', { page: currentPage, search: searchTerm }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: itemsPerPage.toString(),
        search: searchTerm,
      });
      
      try {
        return await apiRequest(`/api/teachers?${params.toString()}`);
      } catch (error) {
        console.error('Error fetching teachers:', error);
        return { teachers: [], totalCount: 0 };
      }
    },
  });

  // Extract teachers and total count from response
  const teachers = teachersResponse?.teachers || [];
  const totalTeachers = teachersResponse?.totalCount || 0;
  const totalPages = Math.ceil(totalTeachers / itemsPerPage);

  // Fetch availability data for selected teacher
  const {
    data: availabilityData = [],
    isLoading: isLoadingAvailabilityData,
  } = useQuery({
    queryKey: ['/api/teacher-availability', selectedTeacher?.id],
    queryFn: async () => {
      if (!selectedTeacher) return [];
      try {
        return await apiRequest(`/api/teacher-availability?teacherId=${selectedTeacher.id}`);
      } catch (error) {
        console.error('Error fetching teacher availability:', error);
        return [];
      }
    },
    enabled: !!selectedTeacher,
  });

  // Fetch language data for selected teacher
  const {
    data: languageData = [],
    isLoading: isLoadingLanguageData,
  } = useQuery({
    queryKey: ['/api/teacher-languages', selectedTeacher?.id],
    queryFn: async () => {
      if (!selectedTeacher) return [];
      try {
        return await apiRequest(`/api/teacher-languages?teacherId=${selectedTeacher.id}`);
      } catch (error) {
        console.error('Error fetching teacher languages:', error);
        return [];
      }
    },
    enabled: !!selectedTeacher,
  });

  // Fetch course assignments for selected teacher
  const {
    data: courseAssignmentsData = [],
    isLoading: isLoadingCourseAssignmentsData,
  } = useQuery({
    queryKey: ['/api/teacher-course-assignments', selectedTeacher?.id],
    queryFn: async () => {
      if (!selectedTeacher) return [];
      try {
        return await apiRequest(`/api/teacher-course-assignments?teacherId=${selectedTeacher.id}`);
      } catch (error) {
        console.error('Error fetching teacher course assignments:', error);
        return [];
      }
    },
    enabled: !!selectedTeacher,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      return await apiRequest(`/api/teachers/${teacherId}`, { method: 'DELETE' });
    },
    onSuccess: () => {
      toast({
        title: "Docent verwijderd",
        description: "De docent is succesvol verwijderd",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setSelectedTeacher(null);
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de docent",
        variant: "destructive",
      });
      console.error('Delete error:', error);
    },
  });

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Handle adding a new teacher
  const handleAddNewTeacher = () => {
    // Open add teacher dialog
    setIsCreateDialogOpen(true);
  };

  // Handle editing a teacher
  const handleEditTeacher = (teacher: TeacherType) => {
    // Implement edit teacher functionality
    console.log("Edit teacher:", teacher);
  };

  // Handle deleting a teacher
  const handleDeleteTeacher = (teacher: TeacherType) => {
    if (window.confirm(`Weet je zeker dat je ${teacher.firstName} ${teacher.lastName} wilt verwijderen?`)) {
      deleteMutation.mutate(teacher.id);
    }
  };

  // Handle viewing a teacher's details
  const handleViewTeacher = (teacher: TeacherType) => {
    setSelectedTeacher(teacher);
  };

  // Get day name from number
  const getDayName = (dayNumber: number): string => {
    const days = {
      0: "Zondag",
      1: "Maandag",
      2: "Dinsdag",
      3: "Woensdag",
      4: "Donderdag",
      5: "Vrijdag",
      6: "Zaterdag"
    };
    return days[dayNumber as keyof typeof days] || `Dag ${dayNumber}`;
  };

  // Get language proficiency level label
  const getLanguageProficiencyLabel = (level: string): string => {
    const levels = {
      "beginner": "Beginner",
      "intermediate": "Gemiddeld",
      "advanced": "Gevorderd",
      "native": "Moedertaal",
      "fluent": "Vloeiend",
    };
    return levels[level as keyof typeof levels] || level;
  };

  // Render teachers page
  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-2xl font-bold text-primary">Docentenbeheer</h1>
          <p className="text-sm text-gray-500 mt-1">Beheer en monitor alle docenten en hun vaardigheden</p>
        </div>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Input
              placeholder="Zoek docenten..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button onClick={handleAddNewTeacher} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Docent Toevoegen</span>
          </Button>
        </div>
      </div>
      
      {/* Docenten lijst */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-end items-center">
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              className="border-primary/30 text-primary hover:text-primary hover:bg-primary/5 hover:border-primary/50"
              onClick={() => refetch()}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-2 h-4 w-4"
              >
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
              Vernieuwen
            </Button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center justify-center">
                    Docent
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Telefoon</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-red-500">
                    Fout bij het laden van docenten. Probeer het opnieuw.
                  </td>
                </tr>
              ) : teachers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    Geen docenten gevonden.
                  </td>
                </tr>
              ) : (
                teachers.map((teacher: TeacherType) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-center">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{teacher.phone || 'Onbekend'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        teacher.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {teacher.isActive ? 'Actief' : 'Inactief'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleViewTeacher(teacher)}
                          title="Details bekijken"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4 text-gray-500" />
                          <span className="sr-only">Bekijken</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleEditTeacher(teacher)}
                          title="Docent bewerken"
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4 text-gray-500" />
                          <span className="sr-only">Bewerken</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          onClick={() => handleDeleteTeacher(teacher)}
                          title="Docent verwijderen"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Verwijderen</span>
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
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="bg-white mt-4 px-4 py-3 flex items-center justify-between border border-gray-200 rounded-lg sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Tonen <span className="font-medium">{(currentPage - 1) * 10 + 1}</span> tot <span className="font-medium">{Math.min(currentPage * 10, totalTeachers)}</span> van <span className="font-medium">{totalTeachers}</span> resultaten
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
                {[...Array(totalPages)].map((_, i) => (
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
      
      {/* Docent details dialoog */}
      <Dialog open={!!selectedTeacher} onOpenChange={() => setSelectedTeacher(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {selectedTeacher && `${selectedTeacher.firstName} ${selectedTeacher.lastName}`}
            </DialogTitle>
            <DialogDescription>
              Details en beheer van docentinformatie
            </DialogDescription>
          </DialogHeader>
          
          {selectedTeacher && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-md font-medium mb-2">Persoonlijke Informatie</h3>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="w-32 text-sm text-gray-500">Docent ID:</span>
                    <span>{selectedTeacher.teacherId || 'Niet beschikbaar'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-sm text-gray-500">Email:</span>
                    <span>{selectedTeacher.email}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-sm text-gray-500">Telefoon:</span>
                    <span>{selectedTeacher.phone || 'Niet beschikbaar'}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="w-32 text-sm text-gray-500">Status:</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      selectedTeacher.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedTeacher.isActive ? 'Actief' : 'Inactief'}
                    </span>
                  </div>
                  {selectedTeacher.gender && (
                    <div className="flex items-center">
                      <span className="w-32 text-sm text-gray-500">Geslacht:</span>
                      <span>{selectedTeacher.gender}</span>
                    </div>
                  )}
                  {selectedTeacher.dateOfBirth && (
                    <div className="flex items-center">
                      <span className="w-32 text-sm text-gray-500">Geboortedatum:</span>
                      <span>{formatDateToDisplayFormat(selectedTeacher.dateOfBirth.toString())}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-md font-medium mb-2">Adresgegevens</h3>
                <div className="space-y-2">
                  {selectedTeacher.street && (
                    <div className="flex items-center">
                      <span className="w-32 text-sm text-gray-500">Straat:</span>
                      <span>{selectedTeacher.street} {selectedTeacher.houseNumber || ''}</span>
                    </div>
                  )}
                  {selectedTeacher.postalCode && (
                    <div className="flex items-center">
                      <span className="w-32 text-sm text-gray-500">Postcode:</span>
                      <span>{selectedTeacher.postalCode}</span>
                    </div>
                  )}
                  {selectedTeacher.city && (
                    <div className="flex items-center">
                      <span className="w-32 text-sm text-gray-500">Plaats:</span>
                      <span>{selectedTeacher.city}</span>
                    </div>
                  )}
                </div>
                
                {selectedTeacher.hireDate && (
                  <div className="mt-6">
                    <h3 className="text-md font-medium mb-2">Werkgeversinformatie</h3>
                    <div className="flex items-center">
                      <span className="w-32 text-sm text-gray-500">In dienst sinds:</span>
                      <span>{formatDateToDisplayFormat(selectedTeacher.hireDate.toString())}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedTeacher && (
            <div className="mt-6">
              <Tabs defaultValue="beschikbaarheid">
                <TabsList className="mb-4">
                  <TabsTrigger value="beschikbaarheid">Beschikbaarheid</TabsTrigger>
                  <TabsTrigger value="talen">Talen</TabsTrigger>
                  <TabsTrigger value="cursussen">Cursussen</TabsTrigger>
                </TabsList>
                
                <TabsContent value="beschikbaarheid">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-md font-medium">Beschikbaarheid</h3>
                      <Button variant="outline" size="sm" className="h-8">
                        <Plus className="h-4 w-4 mr-1" />
                        Toevoegen
                      </Button>
                    </div>
                    
                    {isLoadingAvailabilityData ? (
                      <div className="flex justify-center my-8">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : availabilityData.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Geen beschikbaarheidsgegevens gevonden
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {availabilityData.map((availability: AvailabilityType) => (
                          <div key={availability.id} className="flex justify-between items-center p-3 bg-white rounded-md border">
                            <div>
                              <div className="font-medium text-sm">
                                {getDayName(availability.dayOfWeek)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {availability.startTime} - {availability.endTime}
                              </div>
                              {availability.isBackup && (
                                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                                  Reserve
                                </span>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Pencil className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="talen">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-md font-medium">Talen</h3>
                      <Button variant="outline" size="sm" className="h-8">
                        <Plus className="h-4 w-4 mr-1" />
                        Toevoegen
                      </Button>
                    </div>
                    
                    {isLoadingLanguageData ? (
                      <div className="flex justify-center my-8">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : languageData.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Geen taalgegevens gevonden
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {languageData.map((language: LanguageType) => (
                          <div key={language.id} className="flex justify-between items-center p-3 bg-white rounded-md border">
                            <div>
                              <div className="font-medium text-sm">
                                {language.language}
                              </div>
                              <div className="text-sm text-gray-500">
                                Niveau: {getLanguageProficiencyLabel(language.proficiencyLevel)}
                              </div>
                            </div>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Pencil className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
                
                <TabsContent value="cursussen">
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-md font-medium">Cursussen</h3>
                      <Button variant="outline" size="sm" className="h-8">
                        <Plus className="h-4 w-4 mr-1" />
                        Toevoegen
                      </Button>
                    </div>
                    
                    {isLoadingCourseAssignmentsData ? (
                      <div className="flex justify-center my-8">
                        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : courseAssignmentsData.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        Geen cursustoewijzingen gevonden
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {courseAssignmentsData.map((assignment: CourseAssignmentType) => (
                          <div key={assignment.id} className="flex justify-between items-center p-3 bg-white rounded-md border">
                            <div>
                              <div className="font-medium text-sm">
                                {assignment.courseName || 'Onbekende cursus'}
                              </div>
                              <div className="text-sm text-gray-500">
                                Toegewezen op: {formatDateToDisplayFormat(assignment.assignedDate.toString())}
                              </div>
                              {!assignment.isActive && (
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                                  Inactief
                                </span>
                              )}
                            </div>
                            <div className="flex space-x-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Pencil className="h-4 w-4 text-gray-500" />
                              </Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                <Trash2 className="h-4 w-4 text-red-500" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => setSelectedTeacher(null)}
            >
              Sluiten
            </Button>
            {selectedTeacher && (
              <Button 
                variant="default" 
                onClick={() => handleEditTeacher(selectedTeacher)}
              >
                Bewerken
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Teacher Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] sm:h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nieuwe Docent Toevoegen</DialogTitle>
            <DialogDescription>
              Vul de informatie in om een nieuwe docent toe te voegen aan het systeem.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="personal" className="mt-4">
            <TabsList className="grid grid-cols-5 mb-4">
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Persoonlijk</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>Contact</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Adres</span>
              </TabsTrigger>
              <TabsTrigger value="professional" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>Professioneel</span>
              </TabsTrigger>
              <TabsTrigger value="classes" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Klassen</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Persoonlijke informatie tab */}
            <TabsContent value="personal" className="space-y-6">
              <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-primary mb-4">Persoonlijke gegevens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="teacherId" className="text-sm font-medium text-gray-700">
                      Docent ID <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="teacherId"
                      value={teacherFormData.teacherId}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, teacherId: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="Automatisch gegenereerd..."
                      disabled={!!nextTeacherIdData?.nextTeacherId}
                    />
                    {isLoadingNextId && <div className="text-xs text-gray-500 mt-1">ID wordt geladen...</div>}
                  </div>
                  
                  <div>
                    <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Status <span className="text-primary">*</span>
                    </Label>
                    <Select
                      value={teacherFormData.isActive ? "actief" : "inactief"}
                      onValueChange={(value) => setTeacherFormData({ ...teacherFormData, isActive: value === "actief" })}
                    >
                      <SelectTrigger className="w-full mt-1 bg-white">
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="actief">Actief</SelectItem>
                        <SelectItem value="inactief">Inactief</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      Voornaam <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={teacherFormData.firstName}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, firstName: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="Voornaam"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Achternaam <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={teacherFormData.lastName}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, lastName: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="Achternaam"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                      Geslacht
                    </Label>
                    <Select
                      value={teacherFormData.gender}
                      onValueChange={(value) => setTeacherFormData({ ...teacherFormData, gender: value })}
                    >
                      <SelectTrigger className="w-full mt-1 bg-white">
                        <SelectValue placeholder="Selecteer geslacht" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="man">Man</SelectItem>
                        <SelectItem value="vrouw">Vrouw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                      Geboortedatum
                    </Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={teacherFormData.dateOfBirth || ''}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, dateOfBirth: e.target.value })}
                      className="mt-1 bg-white"
                    />
                  </div>
                  
                  <div className="md:col-span-2">
                    <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                      Notities
                    </Label>
                    <Textarea
                      id="notes"
                      value={teacherFormData.notes}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, notes: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="Voeg hier aanvullende informatie toe..."
                      rows={4}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Contact informatie tab */}
            <TabsContent value="contact" className="space-y-6">
              <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-primary mb-4">Contactgegevens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                      Email <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={teacherFormData.email}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="email@mymadrassa.nl"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                      Telefoonnummer <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="phone"
                      value={teacherFormData.phone}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="06 1234 5678"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Adres informatie tab */}
            <TabsContent value="address" className="space-y-6">
              <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-primary mb-4">Adresgegevens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="street" className="text-sm font-medium text-gray-700">
                      Straat
                    </Label>
                    <Input
                      id="street"
                      value={teacherFormData.street}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, street: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="Straatnaam"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="houseNumber" className="text-sm font-medium text-gray-700">
                      Huisnummer
                    </Label>
                    <Input
                      id="houseNumber"
                      value={teacherFormData.houseNumber}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, houseNumber: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="123"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
                      Postcode
                    </Label>
                    <Input
                      id="postalCode"
                      value={teacherFormData.postalCode}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, postalCode: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="1234 AB"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                      Plaats
                    </Label>
                    <Input
                      id="city"
                      value={teacherFormData.city}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, city: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="Amsterdam"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Professionele informatie tab */}
            <TabsContent value="professional" className="space-y-6">
              <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-primary mb-4">Professionele gegevens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="profession" className="text-sm font-medium text-gray-700">
                      Beroep
                    </Label>
                    <Input
                      id="profession"
                      value={teacherFormData.profession}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, profession: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="Bijv. Islamitische studies"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Klassen toewijzing tab */}
            <TabsContent value="classes" className="space-y-6">
              <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-primary mb-4">Klas Toewijzing</h3>
                <div className="space-y-6">
                  <p className="text-sm text-gray-500">
                    Wijs de docent toe aan klassen en vakken. Deze functionaliteit wordt later geïmplementeerd.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              type="submit" 
              onClick={() => {
                // Hier zou je normaal een createTeacherMutation aanroepen
                toast({
                  title: "Functie in ontwikkeling",
                  description: "Het toevoegen van docenten is nog niet volledig geïmplementeerd.",
                });
                setIsCreateDialogOpen(false);
              }}
            >
              Docent toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}