import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { 
  Form,
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { CalendarIcon, Check, Filter, GraduationCap, Loader2, MoreHorizontal, Pencil, PlusCircle, Search, Trash2, X } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { cn } from "@/lib/utils";

// Standaardformulier schema voor docenten
const teacherFormSchema = z.object({
  teacherId: z.string().optional(),
  firstName: z.string().min(2, { message: "Voornaam moet minimaal 2 karakters lang zijn" }),
  lastName: z.string().min(2, { message: "Achternaam moet minimaal 2 karakters lang zijn" }),
  gender: z.string().optional(),
  email: z.string().email({ message: "Ongeldig e-mailadres" }),
  phone: z.string().optional(),
  dateOfBirth: z.date().optional(),
  street: z.string().optional(),
  houseNumber: z.string().optional(),
  postalCode: z.string().optional(),
  city: z.string().optional(),
  isActive: z.boolean().default(true),
  hireDate: z.date().optional(),
  notes: z.string().optional(),
});

// Beschikbaarheid schema
const availabilitySchema = z.object({
  teacherId: z.number(),
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  isBackup: z.boolean().default(false),
  notes: z.string().optional(),
});

// Talenkennis schema
const languageSchema = z.object({
  teacherId: z.number(),
  language: z.string().min(2, { message: "Taal is verplicht" }),
  proficiencyLevel: z.enum(["beginner", "intermediate", "advanced", "native"]),
});

// Vak toewijzing schema
const courseAssignmentSchema = z.object({
  teacherId: z.number(),
  courseId: z.number(),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
});

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
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

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
  const { toast } = useToast();
  
  // States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherType | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAvailabilityDialogOpen, setIsAvailabilityDialogOpen] = useState(false);
  const [isLanguageDialogOpen, setIsLanguageDialogOpen] = useState(false);
  const [isCourseDialogOpen, setIsCourseDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  
  // Haal docenten op met filters
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/teachers', { searchTerm, page: currentPage }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      params.append("page", currentPage.toString());
      
      const response = await apiRequest('GET', `/api/teachers?${params.toString()}`);
      return response;
    }
  });
  
  const teachers = data?.teachers || [];
  const totalTeachers = data?.totalCount || 0;
  const totalPages = Math.ceil(totalTeachers / 10);
  
  // Haal beschikbaarheden op voor geselecteerde docent
  const { data: availabilityData, isLoading: isLoadingAvailability } = useQuery({
    queryKey: ['/api/teacher-availability', { teacherId: selectedTeacher?.id }],
    queryFn: async () => {
      if (!selectedTeacher?.id) return [];
      return await apiRequest('GET', `/api/teacher-availability?teacherId=${selectedTeacher.id}`);
    },
    enabled: !!selectedTeacher?.id
  });
  
  // Haal talenkennis op voor geselecteerde docent
  const { data: languageData, isLoading: isLoadingLanguages } = useQuery({
    queryKey: ['/api/teacher-languages', { teacherId: selectedTeacher?.id }],
    queryFn: async () => {
      if (!selectedTeacher?.id) return [];
      return await apiRequest('GET', `/api/teacher-languages?teacherId=${selectedTeacher.id}`);
    },
    enabled: !!selectedTeacher?.id
  });
  
  // Haal vak toewijzingen op voor geselecteerde docent
  const { data: courseAssignmentsData, isLoading: isLoadingCourses } = useQuery({
    queryKey: ['/api/teacher-course-assignments', { teacherId: selectedTeacher?.id }],
    queryFn: async () => {
      if (!selectedTeacher?.id) return [];
      return await apiRequest('GET', `/api/teacher-course-assignments?teacherId=${selectedTeacher.id}`);
    },
    enabled: !!selectedTeacher?.id
  });
  
  // Haal alle vakken op voor het toewijzen van vakken
  const { data: coursesData, isLoading: isLoadingAllCourses } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      return await apiRequest('GET', '/api/courses');
    }
  });
  
  // Form setup voor docent toevoegen/wijzigen
  const form = useForm<z.infer<typeof teacherFormSchema>>({
    resolver: zodResolver(teacherFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      gender: "male",
      email: "",
      phone: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      isActive: true,
      notes: ""
    }
  });
  
  // Form setup voor beschikbaarheid
  const availabilityForm = useForm<z.infer<typeof availabilitySchema>>({
    resolver: zodResolver(availabilitySchema),
    defaultValues: {
      teacherId: 0,
      dayOfWeek: 1, // Maandag standaard
      startTime: "09:00",
      endTime: "17:00",
      isBackup: false,
      notes: ""
    }
  });
  
  // Form setup voor talenkennis
  const languageForm = useForm<z.infer<typeof languageSchema>>({
    resolver: zodResolver(languageSchema),
    defaultValues: {
      teacherId: 0,
      language: "",
      proficiencyLevel: "intermediate"
    }
  });
  
  // Form setup voor vak toewijzing
  const courseAssignmentForm = useForm<z.infer<typeof courseAssignmentSchema>>({
    resolver: zodResolver(courseAssignmentSchema),
    defaultValues: {
      teacherId: 0,
      courseId: 0,
      isActive: true,
      notes: ""
    }
  });
  
  // Mutatie voor het aanmaken van een nieuwe docent
  const createTeacherMutation = useMutation({
    mutationFn: async (data: z.infer<typeof teacherFormSchema>) => {
      // Convert dates to ISO strings
      const formattedData = {
        ...data,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString() : undefined,
        hireDate: data.hireDate ? data.hireDate.toISOString() : undefined,
      };
      return await apiRequest('POST', '/api/teachers', formattedData);
    },
    onSuccess: () => {
      toast({
        title: 'Docent toegevoegd',
        description: 'De docent is succesvol aangemaakt.',
      });
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
    },
    onError: () => {
      toast({
        title: 'Fout bij aanmaken',
        description: 'Er is een fout opgetreden bij het aanmaken van de docent.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutatie voor het bijwerken van een docent
  const updateTeacherMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof teacherFormSchema> }) => {
      // Convert dates to ISO strings
      const formattedData = {
        ...data,
        dateOfBirth: data.dateOfBirth ? data.dateOfBirth.toISOString() : undefined,
        hireDate: data.hireDate ? data.hireDate.toISOString() : undefined,
      };
      return await apiRequest('PUT', `/api/teachers/${id}`, formattedData);
    },
    onSuccess: () => {
      toast({
        title: 'Docent bijgewerkt',
        description: 'De docent is succesvol bijgewerkt.',
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      
      if (selectedTeacher) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/teachers', selectedTeacher.id]
        });
      }
    },
    onError: () => {
      toast({
        title: 'Fout bij bijwerken',
        description: 'Er is een fout opgetreden bij het bijwerken van de docent.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutatie voor het verwijderen van een docent
  const deleteTeacherMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/teachers/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Docent verwijderd',
        description: 'De docent is succesvol verwijderd.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedTeacher(null);
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
    },
    onError: () => {
      toast({
        title: 'Fout bij verwijderen',
        description: 'Er is een fout opgetreden bij het verwijderen van de docent.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutatie voor het toevoegen van beschikbaarheid
  const createAvailabilityMutation = useMutation({
    mutationFn: async (data: z.infer<typeof availabilitySchema>) => {
      return await apiRequest('POST', '/api/teacher-availability', data);
    },
    onSuccess: () => {
      toast({
        title: 'Beschikbaarheid toegevoegd',
        description: 'De beschikbaarheid is succesvol toegevoegd.',
      });
      setIsAvailabilityDialogOpen(false);
      availabilityForm.reset();
      if (selectedTeacher?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/teacher-availability', { teacherId: selectedTeacher.id }]
        });
      }
    },
    onError: () => {
      toast({
        title: 'Fout bij toevoegen',
        description: 'Er is een fout opgetreden bij het toevoegen van beschikbaarheid.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutatie voor het toevoegen van talenkennis
  const createLanguageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof languageSchema>) => {
      return await apiRequest('POST', '/api/teacher-languages', data);
    },
    onSuccess: () => {
      toast({
        title: 'Taal toegevoegd',
        description: 'De taal is succesvol toegevoegd.',
      });
      setIsLanguageDialogOpen(false);
      languageForm.reset();
      if (selectedTeacher?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/teacher-languages', { teacherId: selectedTeacher.id }]
        });
      }
    },
    onError: () => {
      toast({
        title: 'Fout bij toevoegen',
        description: 'Er is een fout opgetreden bij het toevoegen van talenkennis.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutatie voor het toewijzen van vakken
  const createCourseAssignmentMutation = useMutation({
    mutationFn: async (data: z.infer<typeof courseAssignmentSchema>) => {
      return await apiRequest('POST', '/api/teacher-course-assignments', data);
    },
    onSuccess: () => {
      toast({
        title: 'Vak toegewezen',
        description: 'Het vak is succesvol toegewezen aan de docent.',
      });
      setIsCourseDialogOpen(false);
      courseAssignmentForm.reset();
      if (selectedTeacher?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/teacher-course-assignments', { teacherId: selectedTeacher.id }]
        });
      }
    },
    onError: () => {
      toast({
        title: 'Fout bij toewijzen',
        description: 'Er is een fout opgetreden bij het toewijzen van het vak.',
        variant: 'destructive',
      });
    },
  });

  // Mutatie voor het verwijderen van beschikbaarheid
  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/teacher-availability/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Beschikbaarheid verwijderd',
        description: 'De beschikbaarheid is succesvol verwijderd.',
      });
      if (selectedTeacher?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/teacher-availability', { teacherId: selectedTeacher.id }]
        });
      }
    },
    onError: () => {
      toast({
        title: 'Fout bij verwijderen',
        description: 'Er is een fout opgetreden bij het verwijderen van beschikbaarheid.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutatie voor het verwijderen van talenkennis
  const deleteLanguageMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/teacher-languages/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Taal verwijderd',
        description: 'De taal is succesvol verwijderd.',
      });
      if (selectedTeacher?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/teacher-languages', { teacherId: selectedTeacher.id }]
        });
      }
    },
    onError: () => {
      toast({
        title: 'Fout bij verwijderen',
        description: 'Er is een fout opgetreden bij het verwijderen van talenkennis.',
        variant: 'destructive',
      });
    },
  });
  
  // Mutatie voor het verwijderen van vak toewijzing
  const deleteCourseAssignmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/teacher-course-assignments/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Vak toewijzing verwijderd',
        description: 'Het vak is succesvol verwijderd van de docent.',
      });
      if (selectedTeacher?.id) {
        queryClient.invalidateQueries({ 
          queryKey: ['/api/teacher-course-assignments', { teacherId: selectedTeacher.id }]
        });
      }
    },
    onError: () => {
      toast({
        title: 'Fout bij verwijderen',
        description: 'Er is een fout opgetreden bij het verwijderen van vak toewijzing.',
        variant: 'destructive',
      });
    },
  });
  
  // Form submits
  const onSubmit = (data: z.infer<typeof teacherFormSchema>) => {
    if (isEditDialogOpen && selectedTeacher) {
      updateTeacherMutation.mutate({ id: selectedTeacher.id, data });
    } else {
      createTeacherMutation.mutate(data);
    }
  };
  
  const onSubmitAvailability = (data: z.infer<typeof availabilitySchema>) => {
    if (selectedTeacher) {
      createAvailabilityMutation.mutate({
        ...data,
        teacherId: selectedTeacher.id
      });
    }
  };
  
  const onSubmitLanguage = (data: z.infer<typeof languageSchema>) => {
    if (selectedTeacher) {
      createLanguageMutation.mutate({
        ...data,
        teacherId: selectedTeacher.id
      });
    }
  };
  
  const onSubmitCourseAssignment = (data: z.infer<typeof courseAssignmentSchema>) => {
    if (selectedTeacher) {
      createCourseAssignmentMutation.mutate({
        ...data,
        teacherId: selectedTeacher.id
      });
    }
  };
  
  // Handlers
  const handleEditTeacher = (teacher: TeacherType) => {
    setSelectedTeacher(teacher);
    
    form.reset({
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      gender: teacher.gender || "male",
      email: teacher.email,
      phone: teacher.phone || "",
      dateOfBirth: teacher.dateOfBirth ? new Date(teacher.dateOfBirth) : undefined,
      street: teacher.street || "",
      houseNumber: teacher.houseNumber || "",
      postalCode: teacher.postalCode || "",
      city: teacher.city || "",
      isActive: teacher.isActive,
      hireDate: teacher.hireDate ? new Date(teacher.hireDate) : undefined,
      notes: teacher.notes || ""
    });
    
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteTeacher = (teacher: TeacherType) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };
  
  const handleViewTeacher = (teacher: TeacherType) => {
    setSelectedTeacher(teacher);
  };
  
  const handleAddAvailability = () => {
    if (selectedTeacher) {
      availabilityForm.reset({
        teacherId: selectedTeacher.id,
        dayOfWeek: 1,
        startTime: "09:00",
        endTime: "17:00",
        isBackup: false,
        notes: ""
      });
      setIsAvailabilityDialogOpen(true);
    }
  };
  
  const handleAddLanguage = () => {
    if (selectedTeacher) {
      languageForm.reset({
        teacherId: selectedTeacher.id,
        language: "",
        proficiencyLevel: "intermediate"
      });
      setIsLanguageDialogOpen(true);
    }
  };
  
  const handleAddCourseAssignment = () => {
    if (selectedTeacher) {
      courseAssignmentForm.reset({
        teacherId: selectedTeacher.id,
        courseId: 0,
        isActive: true,
        notes: ""
      });
      setIsCourseDialogOpen(true);
    }
  };
  
  const handleAddNewTeacher = () => {
    form.reset({
      firstName: "",
      lastName: "",
      gender: "male",
      email: "",
      phone: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      isActive: true,
      notes: ""
    });
    setIsAddDialogOpen(true);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setCurrentPage(1);
  };
  
  // Helper function to get day name
  const getDayName = (dayNumber: number) => {
    const days = ["Zondag", "Maandag", "Dinsdag", "Woensdag", "Donderdag", "Vrijdag", "Zaterdag"];
    return days[dayNumber];
  };
  
  // Helper function to get proficiency name
  const getProficiencyName = (level: string) => {
    const levels = {
      beginner: "Basis",
      intermediate: "Gemiddeld",
      advanced: "Gevorderd",
      native: "Moedertaal"
    };
    return levels[level as keyof typeof levels] || level;
  };
  
  // Render teachers table
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Docenten</h1>
          <p className="text-gray-500 mt-1">
            Beheer docenten, beschikbaarheden en taalkennis
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      
      {/* Main content area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Docenten lijst */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Docenten</CardTitle>
              <CardDescription>
                {totalTeachers} docenten geregistreerd
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-hidden">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : isError ? (
                  <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
                    <p className="text-red-500 mb-2">Er is een fout opgetreden bij het laden van docenten.</p>
                    <Button variant="outline" onClick={() => refetch()}>
                      Opnieuw proberen
                    </Button>
                  </div>
                ) : teachers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-64 px-4 text-center">
                    <p className="text-gray-500 mb-2">Geen docenten gevonden.</p>
                    <Button variant="outline" onClick={handleAddNewTeacher}>
                      Docent Toevoegen
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] w-full">
                    <div className="divide-y">
                      {teachers.map((teacher: TeacherType) => (
                        <div 
                          key={teacher.id} 
                          className={cn(
                            "flex items-center p-3 cursor-pointer hover:bg-gray-50",
                            selectedTeacher?.id === teacher.id && "bg-gray-50"
                          )}
                          onClick={() => handleViewTeacher(teacher)}
                        >
                          <Avatar className="h-10 w-10 mr-3">
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {teacher.firstName[0]}{teacher.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                            <div className="text-sm text-gray-500 truncate">{teacher.email}</div>
                          </div>
                          <Badge className={
                            teacher.isActive 
                              ? "bg-green-100 text-green-800 hover:bg-green-100 ml-2" 
                              : "bg-gray-100 text-gray-800 hover:bg-gray-100 ml-2"
                          }>
                            {teacher.isActive ? "Actief" : "Inactief"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </CardContent>
            {totalPages > 1 && (
              <CardFooter className="flex justify-between pt-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(page => Math.max(page - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Vorige
                </Button>
                <div className="text-sm text-gray-500">
                  Pagina {currentPage} van {totalPages}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage(page => Math.min(page + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Volgende
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
        
        {/* Docentdetails */}
        <div className="md:col-span-2">
          {selectedTeacher ? (
            <Card className="h-full">
              <CardHeader className="pb-2 flex flex-row items-start justify-between space-y-0">
                <div>
                  <CardTitle>{selectedTeacher.firstName} {selectedTeacher.lastName}</CardTitle>
                  <CardDescription>
                    Docent ID: {selectedTeacher.teacherId || 'Niet beschikbaar'}
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleEditTeacher(selectedTeacher)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Bewerken
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleDeleteTeacher(selectedTeacher)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Verwijderen
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="general">
                  <TabsList className="mb-4">
                    <TabsTrigger value="general">Algemene Gegevens</TabsTrigger>
                    <TabsTrigger value="availability">Beschikbaarheid</TabsTrigger>
                    <TabsTrigger value="courses">Vakken</TabsTrigger>
                    <TabsTrigger value="languages">Talenkennis</TabsTrigger>
                  </TabsList>
                  
                  {/* Algemene Gegevens Tab */}
                  <TabsContent value="general" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Contactgegevens</h3>
                        <div className="rounded-md border p-3 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Email:</span>
                            <span>{selectedTeacher.email}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Telefoon:</span>
                            <span>{selectedTeacher.phone || 'Niet ingevuld'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Geslacht:</span>
                            <span>{selectedTeacher.gender === 'male' ? 'Man' : 
                                   selectedTeacher.gender === 'female' ? 'Vrouw' : 
                                   selectedTeacher.gender === 'other' ? 'Anders' : 
                                   'Niet ingevuld'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Geboortedatum:</span>
                            <span>{selectedTeacher.dateOfBirth ? 
                                   format(new Date(selectedTeacher.dateOfBirth), 'd MMMM yyyy', { locale: nl }) : 
                                   'Niet ingevuld'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Adresgegevens</h3>
                        <div className="rounded-md border p-3 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Straat:</span>
                            <span>{selectedTeacher.street || 'Niet ingevuld'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Huisnummer:</span>
                            <span>{selectedTeacher.houseNumber || 'Niet ingevuld'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Postcode:</span>
                            <span>{selectedTeacher.postalCode || 'Niet ingevuld'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Stad:</span>
                            <span>{selectedTeacher.city || 'Niet ingevuld'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Werkgegevens</h3>
                        <div className="rounded-md border p-3 space-y-1">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Status:</span>
                            <Badge className={selectedTeacher.isActive ? 
                                    "bg-green-100 text-green-800 hover:bg-green-100" : 
                                    "bg-gray-100 text-gray-800 hover:bg-gray-100"}>
                              {selectedTeacher.isActive ? "Actief" : "Inactief"}
                            </Badge>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">In dienst sinds:</span>
                            <span>{selectedTeacher.hireDate ? 
                                   format(new Date(selectedTeacher.hireDate), 'd MMMM yyyy', { locale: nl }) : 
                                   'Niet ingevuld'}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h3 className="text-sm font-medium">Notities</h3>
                        <div className="rounded-md border p-3 min-h-[100px]">
                          {selectedTeacher.notes || 'Geen notities beschikbaar'}
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Beschikbaarheid Tab */}
                  <TabsContent value="availability" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Beschikbaarheid</h3>
                      <Button onClick={handleAddAvailability} size="sm">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Toevoegen
                      </Button>
                    </div>
                    
                    {isLoadingAvailability ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !availabilityData || availabilityData.length === 0 ? (
                      <div className="text-center py-8 border rounded-md">
                        <p className="text-gray-500">Geen beschikbaarheid ingesteld</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddAvailability}
                          className="mt-2"
                        >
                          Beschikbaarheid toevoegen
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {availabilityData.map((availability: AvailabilityType) => (
                          <div 
                            key={availability.id} 
                            className="flex items-center justify-between p-3 border rounded-md"
                          >
                            <div>
                              <div className="font-medium">
                                {getDayName(availability.dayOfWeek)}
                                {availability.isBackup && (
                                  <Badge className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
                                    Back-up
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                {availability.startTime} - {availability.endTime}
                              </div>
                              {availability.notes && (
                                <div className="text-sm text-gray-500 italic mt-1">
                                  {availability.notes}
                                </div>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteAvailabilityMutation.mutate(availability.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Vakken Tab */}
                  <TabsContent value="courses" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Toegewezen Vakken</h3>
                      <Button onClick={handleAddCourseAssignment} size="sm">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Vak toewijzen
                      </Button>
                    </div>
                    
                    {isLoadingCourses ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !courseAssignmentsData || courseAssignmentsData.length === 0 ? (
                      <div className="text-center py-8 border rounded-md">
                        <p className="text-gray-500">Geen vakken toegewezen</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddCourseAssignment}
                          className="mt-2"
                        >
                          Vak toewijzen
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {courseAssignmentsData.map((assignment: CourseAssignmentType) => (
                          <div 
                            key={assignment.id} 
                            className="flex items-center justify-between p-3 border rounded-md"
                          >
                            <div>
                              <div className="font-medium">
                                {assignment.courseName || `Vak ID: ${assignment.courseId}`}
                                {!assignment.isActive && (
                                  <Badge className="ml-2 bg-gray-100 text-gray-800 hover:bg-gray-100">
                                    Inactief
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-gray-500">
                                Toegewezen op: {format(new Date(assignment.assignedDate), 'd MMMM yyyy', { locale: nl })}
                              </div>
                              {assignment.notes && (
                                <div className="text-sm text-gray-500 italic mt-1">
                                  {assignment.notes}
                                </div>
                              )}
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteCourseAssignmentMutation.mutate(assignment.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  {/* Talenkennis Tab */}
                  <TabsContent value="languages" className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Talenkennis</h3>
                      <Button onClick={handleAddLanguage} size="sm">
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Taal toevoegen
                      </Button>
                    </div>
                    
                    {isLoadingLanguages ? (
                      <div className="flex justify-center py-8">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      </div>
                    ) : !languageData || languageData.length === 0 ? (
                      <div className="text-center py-8 border rounded-md">
                        <p className="text-gray-500">Geen talenkennis geregistreerd</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={handleAddLanguage}
                          className="mt-2"
                        >
                          Taal toevoegen
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {languageData.map((language: LanguageType) => (
                          <div 
                            key={language.id} 
                            className="flex items-center justify-between p-3 border rounded-md"
                          >
                            <div>
                              <div className="font-medium">{language.language}</div>
                              <div className="text-sm text-gray-500">
                                Niveau: {getProficiencyName(language.proficiencyLevel)}
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => deleteLanguageMutation.mutate(language.id)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card className="h-full flex flex-col items-center justify-center text-center p-8">
              <GraduationCap className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium mb-2">Geen docent geselecteerd</h3>
              <p className="text-gray-500 mb-4 max-w-md">
                Selecteer een docent uit de lijst om details te bekijken of maak een nieuwe docent aan.
              </p>
              <Button onClick={handleAddNewTeacher}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Docent Toevoegen
              </Button>
            </Card>
          )}
        </div>
      </div>
      
      {/* Dialog voor het toevoegen/bewerken van docenten */}
      <Dialog 
        open={isAddDialogOpen || isEditDialogOpen} 
        onOpenChange={(isOpen) => {
          if (isEditDialogOpen) {
            setIsEditDialogOpen(isOpen);
          } else {
            setIsAddDialogOpen(isOpen);
          }
        }}
      >
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Docent bewerken" : "Nieuwe docent aanmaken"}
            </DialogTitle>
            <DialogDescription>
              Vul de onderstaande gegevens in om een {isEditDialogOpen ? "bestaande" : "nieuwe"} docent {isEditDialogOpen ? "bij te werken" : "aan te maken"}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Voornaam</FormLabel>
                      <FormControl>
                        <Input placeholder="Voornaam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Achternaam</FormLabel>
                      <FormControl>
                        <Input placeholder="Achternaam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@voorbeeld.nl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Telefoon</FormLabel>
                      <FormControl>
                        <Input placeholder="0612345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="gender"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Geslacht</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecteer geslacht" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="male">Man</SelectItem>
                          <SelectItem value="female">Vrouw</SelectItem>
                          <SelectItem value="other">Anders</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dateOfBirth"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Geboortedatum</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP", { locale: nl })
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
                              date > new Date() || date < new Date("1900-01-01")
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
              
              <div>
                <h3 className="text-sm font-medium mb-2">Adresgegevens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="street"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Straat</FormLabel>
                        <FormControl>
                          <Input placeholder="Voorbeeldstraat" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="houseNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Huisnummer</FormLabel>
                        <FormControl>
                          <Input placeholder="123" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="postalCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Postcode</FormLabel>
                        <FormControl>
                          <Input placeholder="1234 AB" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Stad</FormLabel>
                        <FormControl>
                          <Input placeholder="Amsterdam" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Aanvullende informatie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="hireDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Datum in dienst</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full pl-3 text-left font-normal",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP", { locale: nl })
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
                                date > new Date() || date < new Date("1900-01-01")
                              }
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-7">
                        <div className="space-y-0.5">
                          <FormLabel>Status</FormLabel>
                          <FormDescription>
                            Is deze docent actief?
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Notities</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Notities over de docent"
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (isEditDialogOpen) {
                      setIsEditDialogOpen(false);
                    } else {
                      setIsAddDialogOpen(false);
                    }
                  }}
                >
                  Annuleren
                </Button>
                <Button type="submit" disabled={createTeacherMutation.isPending || updateTeacherMutation.isPending}>
                  {(createTeacherMutation.isPending || updateTeacherMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditDialogOpen ? "Bijwerken" : "Aanmaken"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog voor verwijderen docent */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Docent verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je de docent "{selectedTeacher?.firstName} {selectedTeacher?.lastName}" wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => {
                if (selectedTeacher) {
                  deleteTeacherMutation.mutate(selectedTeacher.id);
                }
              }}
              disabled={deleteTeacherMutation.isPending}
            >
              {deleteTeacherMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialog voor beschikbaarheid toevoegen */}
      <Dialog open={isAvailabilityDialogOpen} onOpenChange={setIsAvailabilityDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Beschikbaarheid toevoegen</DialogTitle>
            <DialogDescription>
              Voeg nieuwe beschikbaarheid toe voor {selectedTeacher?.firstName} {selectedTeacher?.lastName}.
            </DialogDescription>
          </DialogHeader>
          <Form {...availabilityForm}>
            <form onSubmit={availabilityForm.handleSubmit(onSubmitAvailability)} className="space-y-4">
              <FormField
                control={availabilityForm.control}
                name="dayOfWeek"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dag van de week</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer een dag" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">Maandag</SelectItem>
                        <SelectItem value="2">Dinsdag</SelectItem>
                        <SelectItem value="3">Woensdag</SelectItem>
                        <SelectItem value="4">Donderdag</SelectItem>
                        <SelectItem value="5">Vrijdag</SelectItem>
                        <SelectItem value="6">Zaterdag</SelectItem>
                        <SelectItem value="0">Zondag</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={availabilityForm.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starttijd</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={availabilityForm.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eindtijd</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={availabilityForm.control}
                name="isBackup"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Reserve (back-up)</FormLabel>
                      <FormDescription>
                        Alleen beschikbaar als vervanging nodig is
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={availabilityForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notities</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Bijvoorbeeld: alleen bij specifieke klassen of bijzondere omstandigheden"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAvailabilityDialogOpen(false)}
                >
                  Annuleren
                </Button>
                <Button type="submit" disabled={createAvailabilityMutation.isPending}>
                  {createAvailabilityMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Toevoegen
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog voor talenkennis toevoegen */}
      <Dialog open={isLanguageDialogOpen} onOpenChange={setIsLanguageDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Talenkennis toevoegen</DialogTitle>
            <DialogDescription>
              Voeg nieuwe talenkennis toe voor {selectedTeacher?.firstName} {selectedTeacher?.lastName}.
            </DialogDescription>
          </DialogHeader>
          <Form {...languageForm}>
            <form onSubmit={languageForm.handleSubmit(onSubmitLanguage)} className="space-y-4">
              <FormField
                control={languageForm.control}
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taal</FormLabel>
                    <FormControl>
                      <Input placeholder="Bijvoorbeeld: Nederlands, Engels, Arabisch" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={languageForm.control}
                name="proficiencyLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Niveau</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer niveau" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="beginner">Basis</SelectItem>
                        <SelectItem value="intermediate">Gemiddeld</SelectItem>
                        <SelectItem value="advanced">Gevorderd</SelectItem>
                        <SelectItem value="native">Moedertaal</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsLanguageDialogOpen(false)}
                >
                  Annuleren
                </Button>
                <Button type="submit" disabled={createLanguageMutation.isPending}>
                  {createLanguageMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Toevoegen
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Dialog voor vak toewijzen */}
      <Dialog open={isCourseDialogOpen} onOpenChange={setIsCourseDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Vak toewijzen</DialogTitle>
            <DialogDescription>
              Wijs een vak toe aan {selectedTeacher?.firstName} {selectedTeacher?.lastName}.
            </DialogDescription>
          </DialogHeader>
          <Form {...courseAssignmentForm}>
            <form onSubmit={courseAssignmentForm.handleSubmit(onSubmitCourseAssignment)} className="space-y-4">
              <FormField
                control={courseAssignmentForm.control}
                name="courseId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vak</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(parseInt(value))}
                      defaultValue={field.value.toString()}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer vak" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isLoadingAllCourses ? (
                          <SelectItem value="loading" disabled>Vakken laden...</SelectItem>
                        ) : coursesData && coursesData.length > 0 ? (
                          coursesData.map((course: any) => (
                            <SelectItem 
                              key={course.id} 
                              value={course.id.toString()}
                            >
                              {course.name} ({course.code})
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="empty" disabled>Geen vakken beschikbaar</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={courseAssignmentForm.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Actief</FormLabel>
                      <FormDescription>
                        Is de docent momenteel actief voor dit vak?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={courseAssignmentForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notities</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Eventuele bijzonderheden over de toewijzing"
                        className="min-h-[80px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCourseDialogOpen(false)}
                >
                  Annuleren
                </Button>
                <Button type="submit" disabled={createCourseAssignmentMutation.isPending}>
                  {createCourseAssignmentMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Toewijzen
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}