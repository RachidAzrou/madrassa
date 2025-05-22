import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Pencil, Trash2, Search, Plus, PlusCircle, Eye, User, Phone, MapPin, Briefcase, BookOpen, GraduationCap, Book, X, UserCircle, Users, Upload, Image, BookText, XCircle } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import ManageTeacherAssignments from "@/components/teachers/ManageTeacherAssignments";

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
  isPrimary: boolean;
  startDate: Date;
  endDate?: Date;
  notes?: string;
  courseName?: string; // Voor weergave
};

export default function Teachers() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherType | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isAssignmentsDialogOpen, setIsAssignmentsDialogOpen] = useState(false);
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
    education: '',
    gender: '',
    notes: '',
    isActive: true,
    assignedSubjects: [] as number[],
    assignedClasses: [] as number[]
  });
  
  // State voor beschikbare vakken en klassen
  const [availableSubjects, setAvailableSubjects] = useState<{id: number, name: string}[]>([]);
  const [availableClasses, setAvailableClasses] = useState<{id: number, name: string}[]>([]);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query voor het ophalen van een nieuw docent ID
  const { 
    data: nextTeacherIdData,
    isLoading: isLoadingNextId,
    isError: isNextIdError
  } = useQuery<NextTeacherIdResponse>({
    queryKey: ['/api/next-teacher-id'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/next-teacher-id');
      } catch (error) {
        console.error('Error fetching next teacher ID:', error);
        toast({
          title: "Fout bij ophalen docent ID",
          description: "Kon geen nieuw docent ID genereren. Probeer het later opnieuw.",
          variant: "destructive",
        });
        return { nextTeacherId: '' };
      }
    },
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
  
  // Query voor het ophalen van beschikbare programma's (als vakken)
  const { 
    data: programsData,
    isLoading: isLoadingPrograms,
    isError: isErrorPrograms
  } = useQuery({
    queryKey: ['/api/programs'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/programs');
      } catch (error) {
        console.error('Error fetching programs:', error);
        toast({
          title: "Fout bij ophalen programma's",
          description: "Kon de vakgegevens niet laden voor de docent.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: isCreateDialogOpen,
  });
  
  // Query voor het ophalen van beschikbare klassen (student groups)
  const { 
    data: classesData,
    isLoading: isLoadingClasses,
    isError: isErrorClasses
  } = useQuery({
    queryKey: ['/api/student-groups'],
    queryFn: async () => {
      try {
        return await apiRequest('/api/student-groups');
      } catch (error) {
        console.error('Error fetching student groups:', error);
        toast({
          title: "Fout bij ophalen klasgroepen",
          description: "Kon de klasgroepgegevens niet laden voor de docent.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: isCreateDialogOpen,
  });
  
  // Effect voor het verwerken van opgehaalde programma's en klassen
  useEffect(() => {
    if (programsData && Array.isArray(programsData)) {
      setAvailableSubjects(programsData.map((program: any) => ({
        id: program.id,
        name: program.name
      })));
    }
    
    if (classesData && Array.isArray(classesData)) {
      setAvailableClasses(classesData.map((group: any) => ({
        id: group.id,
        name: group.name || `Groep ${group.id}`
      })));
    }
  }, [programsData, classesData]);

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
        toast({
          title: "Fout bij ophalen docenten",
          description: "Er is een probleem opgetreden bij het laden van de docentengegevens. Probeer het later opnieuw.",
          variant: "destructive",
        });
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
    isError: isAvailabilityError,
  } = useQuery({
    queryKey: ['/api/teacher-availability', selectedTeacher?.id],
    queryFn: async () => {
      if (!selectedTeacher) return [];
      try {
        return await apiRequest(`/api/teacher-availability?teacherId=${selectedTeacher.id}`);
      } catch (error) {
        console.error('Error fetching teacher availability:', error);
        toast({
          title: "Fout bij ophalen beschikbaarheid",
          description: "Kon de beschikbaarheidsgegevens van de docent niet laden.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!selectedTeacher,
  });

  // Fetch language data for selected teacher
  const {
    data: languageData = [],
    isLoading: isLoadingLanguageData,
    isError: isLanguageError,
  } = useQuery({
    queryKey: ['/api/teacher-languages', selectedTeacher?.id],
    queryFn: async () => {
      if (!selectedTeacher) return [];
      try {
        return await apiRequest(`/api/teacher-languages?teacherId=${selectedTeacher.id}`);
      } catch (error) {
        console.error('Error fetching teacher languages:', error);
        toast({
          title: "Fout bij ophalen taalvaardigheden",
          description: "Kon de taalvaardigheidsgegevens van de docent niet laden.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!selectedTeacher,
  });

  // Fetch course assignments for selected teacher
  const {
    data: courseAssignmentsData = [],
    isLoading: isLoadingCourseAssignmentsData,
    isError: isCourseAssignmentsError,
  } = useQuery({
    queryKey: ['/api/teacher-course-assignments', selectedTeacher?.id],
    queryFn: async () => {
      if (!selectedTeacher) return [];
      try {
        return await apiRequest(`/api/teacher-course-assignments?teacherId=${selectedTeacher.id}`);
      } catch (error) {
        console.error('Error fetching teacher course assignments:', error);
        toast({
          title: "Fout bij ophalen curriculum",
          description: "Kon de cursustoewijzingen van de docent niet laden.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!selectedTeacher,
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: async (teacherId: number) => {
      try {
        return await apiRequest(`/api/teachers/${teacherId}`, { method: 'DELETE' });
      } catch (error: any) {
        console.error('Delete teacher error:', error);
        throw new Error(error?.message || 'Fout bij het verwijderen van docent');
      }
    },
    onSuccess: (_, teacherId) => {
      toast({
        title: "Docent verwijderd",
        description: "De docent is succesvol verwijderd uit het systeem",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      // Ook gerelateerde docent-data invalideren
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-availability'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-languages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-course-assignments'] });
      setSelectedTeacher(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error?.message || "Er is een fout opgetreden bij het verwijderen van de docent. Mogelijk zijn er nog actieve relaties met andere gegevens.",
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

  // Create Teacher Mutation
  const createTeacherMutation = useMutation({
    mutationFn: async (formData: any) => {
      try {
        return await apiRequest('/api/teachers', {
          method: 'POST',
          body: formData
        });
      } catch (error: any) {
        console.error('Create teacher error:', error);
        throw new Error(error?.message || 'Fout bij het aanmaken van docent');
      }
    },
    onSuccess: () => {
      toast({
        title: "Docent toegevoegd",
        description: "De nieuwe docent is succesvol toegevoegd aan het systeem",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setIsCreateDialogOpen(false);
      resetTeacherForm();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error?.message || "Er is een fout opgetreden bij het toevoegen van de docent. Controleer de ingevoerde gegevens en probeer het opnieuw.",
        variant: "destructive",
      });
      console.error('Create error:', error);
    },
  });
  
  // Update Teacher Mutation
  const updateTeacherMutation = useMutation({
    mutationFn: async (data: { id: number, formData: any }) => {
      try {
        return await apiRequest(`/api/teachers/${data.id}`, {
          method: 'PUT',
          body: data.formData
        });
      } catch (error: any) {
        console.error('Update teacher error:', error);
        throw new Error(error?.message || 'Fout bij het bijwerken van docent');
      }
    },
    onSuccess: (_, variables) => {
      const teacherName = `${variables.formData.firstName} ${variables.formData.lastName}`;
      toast({
        title: "Docent bijgewerkt",
        description: `Docent ${teacherName} is succesvol bijgewerkt`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-availability', selectedTeacher?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-languages', selectedTeacher?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/teacher-course-assignments', selectedTeacher?.id] });
      setIsCreateDialogOpen(false);
      resetTeacherForm();
      setSelectedTeacher(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken",
        description: error?.message || "Er is een fout opgetreden bij het bijwerken van de docent. Controleer de ingevoerde gegevens en probeer het opnieuw.",
        variant: "destructive",
      });
      console.error('Update error:', error);
    },
  });

  // Reset teacher form
  const resetTeacherForm = () => {
    setTeacherFormData({
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
      education: '',
      gender: '',
      notes: '',
      isActive: true,
      assignedSubjects: [],
      assignedClasses: []
    });
  };

  // Handle form input change
  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setTeacherFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox change
  const handleCheckboxChange = (checked: boolean) => {
    setTeacherFormData(prev => ({
      ...prev,
      isActive: checked
    }));
  };

  // Handle subject selection
  const handleSubjectSelection = (subjectId: number) => {
    setTeacherFormData(prev => {
      const currentSubjects = [...prev.assignedSubjects];
      
      if (currentSubjects.includes(subjectId)) {
        return {
          ...prev,
          assignedSubjects: currentSubjects.filter(id => id !== subjectId)
        };
      } else {
        return {
          ...prev,
          assignedSubjects: [...currentSubjects, subjectId]
        };
      }
    });
  };

  // Handle class selection
  const handleClassSelection = (classId: number) => {
    setTeacherFormData(prev => {
      const currentClasses = [...prev.assignedClasses];
      
      if (currentClasses.includes(classId)) {
        return {
          ...prev,
          assignedClasses: currentClasses.filter(id => id !== classId)
        };
      } else {
        return {
          ...prev,
          assignedClasses: [...currentClasses, classId]
        };
      }
    });
  };

  // Handle form submission
  const handleSubmitTeacherForm = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Uitgebreide validatie van verplichte velden
    const requiredFields = {
      firstName: "Voornaam",
      lastName: "Achternaam",
      email: "E-mailadres"
    };
    
    const missingFields: string[] = [];
    
    Object.entries(requiredFields).forEach(([field, label]) => {
      if (!teacherFormData[field as keyof typeof teacherFormData]) {
        missingFields.push(label);
      }
    });
    
    if (missingFields.length > 0) {
      toast({
        title: "Ontbrekende verplichte velden",
        description: `Vul de volgende verplichte velden in: ${missingFields.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    // E-mail validatie
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(teacherFormData.email)) {
      toast({
        title: "Ongeldig e-mailadres",
        description: "Voer een geldig e-mailadres in",
        variant: "destructive",
      });
      return;
    }
    
    // Laat gebruiker weten dat we bezig zijn met verwerken
    toast({
      title: selectedTeacher ? "Docent bijwerken..." : "Docent toevoegen...",
      description: "Een moment geduld terwijl we uw verzoek verwerken",
    });
    
    if (selectedTeacher) {
      // Update existing teacher
      updateTeacherMutation.mutate({
        id: selectedTeacher.id,
        formData: teacherFormData
      });
    } else {
      // Create new teacher
      createTeacherMutation.mutate(teacherFormData);
    }
  };

  // Handle adding a new teacher
  const handleAddNewTeacher = () => {
    // Reset form and open dialog
    resetTeacherForm();
    setSelectedTeacher(null);
    setIsCreateDialogOpen(true);
  };

  // Handle editing a teacher
  const handleEditTeacher = (teacher: TeacherType) => {
    setSelectedTeacher(teacher);
    
    // Populate form with teacher data
    setTeacherFormData({
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone || '',
      street: teacher.street || '',
      houseNumber: teacher.houseNumber || '',
      postalCode: teacher.postalCode || '',
      city: teacher.city || '',
      dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth).toISOString().split('T')[0] : '',
      profession: teacher.profession || '',
      education: '',
      gender: teacher.gender || '',
      notes: teacher.notes || '',
      isActive: teacher.isActive,
      assignedSubjects: [],
      assignedClasses: []
    });
    
    // Open edit dialog
    setIsCreateDialogOpen(true);
  };

  // State voor bevestigingsdialoog
  const [teacherToDelete, setTeacherToDelete] = useState<TeacherType | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Handle het openen van de bevestigingsdialoog voor het verwijderen
  const handleDeleteTeacher = (teacher: TeacherType) => {
    setTeacherToDelete(teacher);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle de daadwerkelijke verwijdering na bevestiging
  const confirmDeleteTeacher = () => {
    if (teacherToDelete) {
      toast({
        title: "Bezig met verwijderen...",
        description: `Docent ${teacherToDelete.firstName} ${teacherToDelete.lastName} wordt verwijderd`,
      });
      deleteMutation.mutate(teacherToDelete.id);
      setIsDeleteDialogOpen(false);
      setTeacherToDelete(null);
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
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <GraduationCap className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Docenten</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Beheer en monitor alle docenten en hun vaardigheden
          </p>
        </div>
        
        <Button 
          onClick={handleAddNewTeacher} 
          variant="default" 
          size="default" 
          className="bg-primary hover:bg-primary/90 flex items-center"
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Docent Toevoegen</span>
        </Button>
      </div>
      
      {/* Zoekbalk - onder de paginatitel geplaatst */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Zoek docenten..."
            className="pl-8 bg-white"
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
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
                  <td colSpan={5} className="px-6 py-8">
                    <div className="h-48 flex flex-col items-center justify-center text-gray-500">
                      <div className="text-[#1e3a8a] mb-2">
                        <GraduationCap className="h-12 w-12 mx-auto opacity-30" />
                      </div>
                      <p className="text-sm font-medium">Geen docenten beschikbaar</p>
                    </div>
                  </td>
                </tr>
              ) : (
                teachers.map((teacher: TeacherType) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-[#1e3a8a] text-white">
                            {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</div>
                          <div className="text-xs text-gray-500">ID: {teacher.teacherId}</div>
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
          
      {/* Docent vakken beheren dialoog */}
      {selectedTeacher && (
        <ManageTeacherAssignments
          teacherId={selectedTeacher.id}
          onClose={() => setIsAssignmentsDialogOpen(false)}
          open={isAssignmentsDialogOpen}
        />
      )}
          
          {selectedTeacher && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-md font-medium">Persoonlijke Informatie</h3>
                <Button 
                  onClick={() => setIsAssignmentsDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-1"
                >
                  <BookText className="h-4 w-4 text-[#1e3a8a]" />
                  <span>Vakken beheren</span>
                </Button>
              </div>
              <div>
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
                <TabsList className="mb-4 p-1 bg-blue-900/10">
                  <TabsTrigger value="beschikbaarheid" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">Beschikbaarheid</TabsTrigger>
                  <TabsTrigger value="talen" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">Talen</TabsTrigger>
                  <TabsTrigger value="cursussen" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">Cursussen</TabsTrigger>
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
                      <h3 className="text-md font-medium">Curriculum</h3>
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
                                Startdatum: {assignment.startDate ? formatDateToDisplayFormat(assignment.startDate.toString()) : 'Niet ingesteld'}
                              </div>
                              {!assignment.isPrimary && (
                                <span className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full mt-1 inline-block">
                                  Secundair
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
            <DialogTitle className="text-xl font-bold text-primary flex items-center">
              <User className="mr-2 h-5 w-5" />
              Nieuwe Docent Toevoegen
            </DialogTitle>
            <DialogDescription>
              Vul alle benodigde informatie in om een nieuwe docent toe te voegen aan het systeem.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="personal" className="mt-4">
            <TabsList className="grid grid-cols-7 mb-4">
              <TabsTrigger value="photo" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span>Foto</span>
              </TabsTrigger>
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
              <TabsTrigger value="subjects" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                <span>Vakken</span>
              </TabsTrigger>
              <TabsTrigger value="classes" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                <span>Klassen</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Foto upload tab */}
            <TabsContent value="photo" className="space-y-6">
              <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-primary mb-4">Foto uploaden</h3>
                <div className="flex flex-col items-center justify-center gap-4">
                  <div className="w-40 h-40 border-2 border-dashed border-gray-300 rounded-full flex items-center justify-center overflow-hidden bg-gray-50 relative group cursor-pointer">
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="h-8 w-8 text-gray-500" />
                      <p className="text-sm text-gray-500 mt-2">Bestand kiezen</p>
                    </div>
                    <img id="teacher-photo-preview" src="" alt="" className="w-full h-full object-cover hidden" />
                    <div id="teacher-photo-placeholder" className="flex flex-col items-center justify-center">
                      <User className="h-12 w-12 text-gray-300" />
                      <p className="text-sm text-gray-400 mt-2">Geen foto</p>
                    </div>
                  </div>
                  
                  <input 
                    type="file" 
                    id="teacher-photo" 
                    accept="image/*" 
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = function(event) {
                          const photoPreview = document.getElementById('teacher-photo-preview') as HTMLImageElement;
                          const photoPlaceholder = document.getElementById('teacher-photo-placeholder');
                          
                          if (photoPreview && photoPlaceholder && event.target?.result) {
                            photoPreview.src = event.target.result as string;
                            photoPreview.classList.remove('hidden');
                            photoPlaceholder.classList.add('hidden');
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2"
                      onClick={() => {
                        const fileInput = document.getElementById('teacher-photo') as HTMLInputElement;
                        fileInput?.click();
                      }}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Foto uploaden
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => {
                        const photoPreview = document.getElementById('teacher-photo-preview') as HTMLImageElement;
                        const photoPlaceholder = document.getElementById('teacher-photo-placeholder');
                        const fileInput = document.getElementById('teacher-photo') as HTMLInputElement;
                        
                        if (photoPreview && photoPlaceholder && fileInput) {
                          photoPreview.src = '';
                          photoPreview.classList.add('hidden');
                          photoPlaceholder.classList.remove('hidden');
                          fileInput.value = '';
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Verwijderen
                    </Button>
                  </div>

                  <div className="w-full mt-4">
                    <Label className="text-sm font-medium text-gray-700">
                      Richtlijnen voor foto's
                    </Label>
                    <ul className="mt-2 text-sm text-gray-600 space-y-1 list-disc list-inside">
                      <li>Upload een duidelijke, recente foto</li>
                      <li>Foto moet het volledige gezicht tonen</li>
                      <li>Neutrale achtergrond</li>
                      <li>Maximum bestandsgrootte: 5MB</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Persoonlijke informatie tab */}
            <TabsContent value="personal" className="space-y-6">
              <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-primary mb-4">Persoonlijke gegevens</h3>
                <div className="flex mb-4 justify-end gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center border border-gray-300"
                    onClick={() => {
                      // Get access to toast context within this function
                      const localToast = toast;
                      
                      localToast({
                        title: "eID detectie",
                        description: "Zoeken naar eID-kaartlezer...",
                      });
                      
                      // Simuleer eID detectie (in werkelijkheid zou dit een echte API-integratie zijn)
                      setTimeout(() => {
                        localToast({
                          title: "eID gedetecteerd",
                          description: "Gegevens worden geladen van de identiteitskaart...",
                        });
                        
                        // Simuleer laden van eID gegevens na 2 seconden
                        setTimeout(() => {
                          // Hier zouden we de kaartgegevens verwerken
                          // In een echte implementatie zou dit komen van de eID API
                          const eidData = {
                            firstName: "Ahmed",
                            lastName: "El Khatib",
                            birthDate: "1985-08-21",
                            nationalRegisterNumber: "850821378914",
                            gender: "Mannelijk",
                            street: "Leuvensestraat",
                            houseNumber: "12B",
                            postalCode: "1030",
                            city: "Schaarbeek",
                            photoUrl: "https://placehold.co/400x400/eee/31316a?text=Foto+eID"
                          };
                          
                          // Simuleer het laden van de foto uit de eID
                          const photoPreview = document.getElementById('teacher-photo-preview') as HTMLImageElement;
                          const photoPlaceholder = document.getElementById('teacher-photo-placeholder');
                          
                          if (photoPreview && photoPlaceholder) {
                            photoPreview.src = eidData.photoUrl;
                            photoPreview.classList.remove('hidden');
                            photoPlaceholder.classList.add('hidden');
                          }
                          
                          // Vul het formulier in met eID-gegevens
                          setTeacherFormData({
                            ...teacherFormData,
                            firstName: eidData.firstName,
                            lastName: eidData.lastName,
                            dateOfBirth: eidData.birthDate,
                            gender: eidData.gender === "Mannelijk" ? "man" : "vrouw",
                            street: eidData.street,
                            houseNumber: eidData.houseNumber,
                            postalCode: eidData.postalCode,
                            city: eidData.city
                          });
                          
                          // Voeg een extra bericht toe dat de foto ook beschikbaar is in de foto-tab
                          localToast({
                            title: "Gegevens geladen",
                            description: "De gegevens van de eID zijn succesvol ingeladen. De foto is ook zichtbaar in de foto-tab.",
                          });
                          
                          // Toon een visuele hint dat er ook naar de foto tab gekeken moet worden
                          const photoTabTrigger = document.querySelector('button[value="photo"]');
                          if (photoTabTrigger) {
                            photoTabTrigger.classList.add('animate-pulse');
                            setTimeout(() => {
                              photoTabTrigger.classList.remove('animate-pulse');
                            }, 3000);
                          }
                        }, 2000);
                      }, 1500);
                    }}
                  >
                    <span className="mr-2 bg-[#77CC9A] text-white rounded-md px-1 font-bold text-xs py-0.5">be|ID</span>
                    Gegevens laden via eID
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center border border-gray-300"
                    onClick={() => {
                      // Get access to toast context within this function
                      const localToast = toast;
                      
                      localToast({
                        title: "itsme® app",
                        description: "Open de itsme® app op uw smartphone om verder te gaan...",
                      });
                      
                      // Simuleer itsme detectie
                      setTimeout(() => {
                        localToast({
                          title: "itsme® verbinding",
                          description: "Verbinding gemaakt met itsme®. Gegevens worden opgehaald...",
                        });
                        
                        // Simuleer laden van itsme gegevens na 2 seconden
                        setTimeout(() => {
                          // Hier zouden we de itsme-gegevens verwerken
                          // In een echte implementatie zou dit komen van de itsme API
                          const itsmeData = {
                            firstName: "Mohamed",
                            lastName: "Ben Ali",
                            birthDate: "1980-03-12",
                            nationalRegisterNumber: "80031215987",
                            gender: "Mannelijk",
                            street: "Antwerpsesteenweg",
                            houseNumber: "24",
                            postalCode: "2800",
                            city: "Mechelen",
                            photoUrl: "https://placehold.co/400x400/eee/FF4D27?text=Foto+itsme"
                          };
                          
                          // Simuleer het laden van de foto uit itsme
                          const photoPreview = document.getElementById('teacher-photo-preview') as HTMLImageElement;
                          const photoPlaceholder = document.getElementById('teacher-photo-placeholder');
                          
                          if (photoPreview && photoPlaceholder) {
                            photoPreview.src = itsmeData.photoUrl;
                            photoPreview.classList.remove('hidden');
                            photoPlaceholder.classList.add('hidden');
                          }
                          
                          // Vul het formulier in met itsme-gegevens
                          setTeacherFormData({
                            ...teacherFormData,
                            firstName: itsmeData.firstName,
                            lastName: itsmeData.lastName,
                            dateOfBirth: itsmeData.birthDate,
                            gender: itsmeData.gender === "Mannelijk" ? "man" : "vrouw",
                            street: itsmeData.street,
                            houseNumber: itsmeData.houseNumber,
                            postalCode: itsmeData.postalCode,
                            city: itsmeData.city
                          });
                          
                          // Voeg een extra bericht toe dat de foto ook beschikbaar is in de foto-tab
                          localToast({
                            title: "Gegevens geladen",
                            description: "De itsme® gegevens zijn succesvol ingeladen. De foto is ook zichtbaar in de foto-tab.",
                          });
                          
                          // Toon een visuele hint dat er ook naar de foto tab gekeken moet worden
                          const photoTabTrigger = document.querySelector('button[value="photo"]');
                          if (photoTabTrigger) {
                            photoTabTrigger.classList.add('animate-pulse');
                            setTimeout(() => {
                              photoTabTrigger.classList.remove('animate-pulse');
                            }, 3000);
                          }
                        }, 2500);
                      }, 2000);
                    }}
                  >
                    <span className="mr-2 bg-[#FF4D27] text-white rounded-md px-2 font-bold text-xs py-0.5">itsme</span>
                    Gegevens laden via itsme®
                  </Button>
                </div>
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
                  
                  <div>
                    <Label htmlFor="education" className="text-sm font-medium text-gray-700">
                      Gevolgde opleiding
                    </Label>
                    <Input
                      id="education"
                      value={teacherFormData.education}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, education: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="Bijv. Islamitische theologie"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
            
            {/* Vakken tab */}
            <TabsContent value="subjects" className="space-y-6">
              <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-primary mb-4">Vakken</h3>
                <div className="space-y-6">
                  <p className="text-sm text-gray-500">
                    Selecteer de vakken die deze docent zal geven.
                  </p>
                  
                  {availableSubjects.length > 0 ? (
                    <div className="space-y-4">
                      {availableSubjects.map(subject => (
                        <div key={subject.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50">
                          <Checkbox 
                            id={`subject-${subject.id}`}
                            checked={teacherFormData.assignedSubjects.includes(subject.id)}
                            onCheckedChange={(checked) => {
                              const newAssignedSubjects = checked 
                                ? [...teacherFormData.assignedSubjects, subject.id]
                                : teacherFormData.assignedSubjects.filter(id => id !== subject.id);
                              
                              setTeacherFormData({
                                ...teacherFormData,
                                assignedSubjects: newAssignedSubjects
                              });
                            }}
                          />
                          <Label htmlFor={`subject-${subject.id}`} className="cursor-pointer w-full">
                            {subject.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-200 rounded-md p-4 text-center text-gray-500">
                      <Book className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Geen vakken beschikbaar</p>
                    </div>
                  )}
                  
                  {teacherFormData.assignedSubjects.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Geselecteerde vakken:</p>
                      <div className="flex flex-wrap gap-2">
                        {teacherFormData.assignedSubjects.map(subjectId => {
                          const subject = availableSubjects.find(s => s.id === subjectId);
                          return (
                            <Badge key={subjectId} variant="outline" className="flex items-center gap-1">
                              {subject?.name}
                              <Button 
                                type="button" 
                                variant="ghost" 
                                className="h-4 w-4 p-0 text-gray-500 hover:text-red-500"
                                onClick={() => {
                                  setTeacherFormData({
                                    ...teacherFormData,
                                    assignedSubjects: teacherFormData.assignedSubjects.filter(id => id !== subjectId)
                                  });
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            {/* Klassen toewijzing tab */}
            <TabsContent value="classes" className="space-y-6">
              <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-primary mb-4">Klas Toewijzing</h3>
                <div className="space-y-6">
                  <p className="text-sm text-gray-500">
                    Selecteer de klassen waar deze docent les zal geven.
                  </p>
                  
                  {availableClasses.length > 0 ? (
                    <div className="space-y-4">
                      {availableClasses.map(classItem => (
                        <div key={classItem.id} className="flex items-center space-x-2 p-2 border rounded-md hover:bg-gray-50">
                          <Checkbox 
                            id={`class-${classItem.id}`}
                            checked={teacherFormData.assignedClasses.includes(classItem.id)}
                            onCheckedChange={(checked) => {
                              const newAssignedClasses = checked 
                                ? [...teacherFormData.assignedClasses, classItem.id]
                                : teacherFormData.assignedClasses.filter(id => id !== classItem.id);
                              
                              setTeacherFormData({
                                ...teacherFormData,
                                assignedClasses: newAssignedClasses
                              });
                            }}
                          />
                          <Label htmlFor={`class-${classItem.id}`} className="cursor-pointer w-full">
                            {classItem.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="border border-dashed border-gray-200 rounded-md p-4 text-center text-gray-500">
                      <BookOpen className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Geen klassen beschikbaar</p>
                    </div>
                  )}
                  
                  {teacherFormData.assignedClasses.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-700 mb-2">Geselecteerde klassen:</p>
                      <div className="flex flex-wrap gap-2">
                        {teacherFormData.assignedClasses.map(classId => {
                          const classItem = availableClasses.find(c => c.id === classId);
                          return (
                            <Badge key={classId} variant="outline" className="flex items-center gap-1">
                              {classItem?.name}
                              <Button 
                                type="button" 
                                variant="ghost" 
                                className="h-4 w-4 p-0 text-gray-500 hover:text-red-500"
                                onClick={() => {
                                  setTeacherFormData({
                                    ...teacherFormData,
                                    assignedClasses: teacherFormData.assignedClasses.filter(id => id !== classId)
                                  });
                                }}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          );
                        })}
                      </div>
                    </div>
                  )}
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

      {/* Verwijderbevestiging Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold text-red-600">
              Docent verwijderen
            </DialogTitle>
            <DialogDescription>
              {teacherToDelete && (
                <p>
                  Weet u zeker dat u docent <span className="font-semibold">{teacherToDelete.firstName} {teacherToDelete.lastName}</span> wilt verwijderen? 
                  Deze actie kan niet ongedaan worden gemaakt.
                </p>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 flex flex-col space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-amber-700 text-sm">
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 mr-2 mt-0.5 text-amber-500">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
                <div>
                  Als deze docent nog gerelateerd is aan klassen, vakken of andere gegevens, zal de verwijdering mogelijk niet kunnen worden uitgevoerd zonder eerst die relaties te verbreken.
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex flex-row space-x-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteTeacher}
              className="bg-red-600 hover:bg-red-700"
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}