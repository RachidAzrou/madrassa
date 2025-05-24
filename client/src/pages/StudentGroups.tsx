import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, School, 
  Pencil, MoreVertical, Plus, GraduationCap, BookOpen, UsersRound,
  CalendarIcon, Loader2, XCircle, Users2, X, AlertTriangle
} from 'lucide-react';
import ManageStudentEnrollments from "@/components/student-groups/ManageStudentEnrollments";
// Aangepast ChalkboardTeacher icoon
const ChalkBoard = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <rect x="2" y="2" width="20" height="14" rx="2" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <line x1="6" y1="12" x2="6" y2="20" />
    <line x1="18" y1="12" x2="18" y2="20" />
    <ellipse cx="12" cy="18" rx="3" ry="2" />
    <path d="M10 4h4" />
    <path d="M8 8h8" />
  </svg>
);
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar } from "@/components/ui/calendar";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { apiRequest } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function StudentGroups() {
  const [searchTerm, setSearchTerm] = useState('');
  const [academicYear, setAcademicYear] = useState('all');
  const [program, setProgram] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Dialog controls
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch student groups with filters
  const { data: studentGroupsData, isLoading, isError } = useQuery({
    queryKey: ['/api/student-groups', { searchTerm, academicYear, program, page: currentPage }],
    staleTime: 1000, // Kortere stale time om updates sneller te zien
  });

  // Direct gebruik van de data uit de API response
  const studentGroups = Array.isArray(studentGroupsData) ? studentGroupsData : [];
  const totalStudentGroups = studentGroups.length;
  const totalPages = Math.ceil(totalStudentGroups / 9);

  // Form validation schema
  const studentGroupSchema = z.object({
    name: z.string().min(2, { message: "Naam moet minimaal 2 tekens bevatten" }),
    academicYear: z.string({ required_error: "Selecteer een academisch jaar" }),
    programId: z.coerce.number().optional(),
    courseId: z.coerce.number().optional(),
    instructor: z.string().optional(),
    description: z.string().optional(),
    maxCapacity: z.coerce.number().optional(),
    startDate: z.date().optional(),
    endDate: z.date().optional(),
    isActive: z.boolean().default(true),
  });

  // Form setup
  const form = useForm<z.infer<typeof studentGroupSchema>>({
    resolver: zodResolver(studentGroupSchema),
    defaultValues: {
      name: "",
      academicYear: "2024-2025",
      programId: undefined,
      courseId: undefined,
      instructor: "",
      description: "",
      maxCapacity: 30,
      isActive: true,
    },
  });

  // Fetch programs for dropdown
  const { data: programsData } = useQuery<any[]>({
    queryKey: ['/api/programs'],
    staleTime: 300000,
  });

  const programs = programsData || [];

  // Fetch courses for dropdown
  const { data: coursesData } = useQuery<{courses: any[]}>({
    queryKey: ['/api/courses'],
    staleTime: 300000,
  });

  const courses = coursesData?.courses || [];

  // Verbeterde mutation voor het aanmaken van een nieuwe klas
  const createStudentGroupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof studentGroupSchema>) => {
      try {
        // Convert dates to ISO strings
        const formattedData = {
          ...data,
          startDate: data.startDate ? data.startDate.toISOString() : undefined,
          endDate: data.endDate ? data.endDate.toISOString() : undefined,
        };
        return await apiRequest('/api/student-groups', { 
          method: 'POST', 
          body: formattedData 
        });
      } catch (error: any) {
        console.error('Error creating student group:', error);
        throw new Error(error?.message || 'Fout bij het aanmaken van de klas');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Klas toegevoegd',
        description: 'De klas is succesvol aangemaakt in het systeem.',
      });
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout bij aanmaken',
        description: error?.message || 'Er is een fout opgetreden bij het aanmaken van de klas. Controleer of de naam uniek is en alle velden correct zijn ingevuld.',
        variant: 'destructive',
      });
      console.error('Create student group error:', error);
    },
  });

  // Verbeterde mutation voor het bijwerken van een klas
  const updateStudentGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof studentGroupSchema> }) => {
      try {
        // Convert dates to ISO strings
        const formattedData = {
          ...data,
          startDate: data.startDate ? data.startDate.toISOString() : undefined,
          endDate: data.endDate ? data.endDate.toISOString() : undefined,
        };
        return await apiRequest(`/api/student-groups/${id}`, {
          method: 'PUT',
          body: formattedData
        });
      } catch (error: any) {
        console.error('Error updating student group:', error);
        throw new Error(error?.message || 'Fout bij het bijwerken van de klas');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Klas bijgewerkt',
        description: 'De klas is succesvol bijgewerkt in het systeem.',
      });
      setIsEditDialogOpen(false);
      setSelectedGroup(null);
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout bij bijwerken',
        description: error?.message || 'Er is een fout opgetreden bij het bijwerken van de klas. Controleer of alle velden correct zijn ingevuld.',
        variant: 'destructive',
      });
      console.error('Update student group error:', error);
    },
  });

  // Verbeterde mutation voor het verwijderen van een klas
  const deleteStudentGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      try {
        return await apiRequest(`/api/student-groups/${id}`, {
          method: 'DELETE'
        });
      } catch (error: any) {
        console.error('Error deleting student group:', error);
        throw new Error(error?.message || 'Fout bij het verwijderen van de klas');
      }
    },
    onSuccess: () => {
      toast({
        title: 'Klas verwijderd',
        description: 'De klas is succesvol verwijderd uit het systeem.',
      });
      setIsDeleteDialogOpen(false);
      setSelectedGroup(null);
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Fout bij verwijderen',
        description: error?.message || 'Er is een fout opgetreden bij het verwijderen van de klas. Mogelijk zijn er nog studenten aan deze klas gekoppeld.',
        variant: 'destructive',
      });
      console.error('Delete student group error:', error);
    },
  });

  const handleAddStudentGroup = () => {
    form.reset({
      name: "",
      academicYear: "2024-2025",
      programId: undefined,
      courseId: undefined,
      instructor: "",
      description: "",
      maxCapacity: 30,
      isActive: true,
    });
    setIsAddDialogOpen(true);
    setIsDialogOpen(true);
  };

  const handleEditStudentGroup = (group: any) => {
    setSelectedGroup(group);
    form.reset({
      name: group.name,
      academicYear: group.academicYear,
      programId: group.programId,
      courseId: group.courseId,
      instructor: group.instructor || "",
      description: group.description || "",
      maxCapacity: group.maxCapacity,
      startDate: group.startDate ? new Date(group.startDate) : undefined,
      endDate: group.endDate ? new Date(group.endDate) : undefined,
      isActive: group.isActive,
    });
    setIsEditDialogOpen(true);
    setIsDialogOpen(true);
  };

  const handleDeleteStudentGroup = (group: any) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = (data: z.infer<typeof studentGroupSchema>) => {
    if (isEditDialogOpen && selectedGroup) {
      updateStudentGroupMutation.mutate({ id: selectedGroup.id, data });
    } else {
      createStudentGroupMutation.mutate(data);
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleProgramChange = (value: string) => {
    setProgram(value);
    setCurrentPage(1);
  };

  const handleAcademicYearChange = (value: string) => {
    setAcademicYear(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Render the page
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
              <ChalkBoard className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Klassen</h1>
              <p className="text-base text-gray-500 mt-1">Beheer klassen, secties en activiteitengroepen</p>
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
            placeholder="Zoek klassen..."
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
        
        <div className="flex justify-end items-center">
          <Button onClick={handleAddStudentGroup} className="flex items-center bg-primary hover:bg-primary/90">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Klas Aanmaken</span>
          </Button>
        </div>
      </div>

      {/* Main content area */}
      <Tabs defaultValue="grid" className="space-y-4">
        
        <div className="student-groups-filters bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Academisch Jaar</label>
              <Select value={academicYear} onValueChange={handleAcademicYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Jaren" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Jaren</SelectItem>
                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opleiding</label>
              <Select value={program} onValueChange={handleProgramChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Opleidingen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Opleidingen</SelectItem>
                  {Array.isArray(programs) ? programs.map((program: any) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.name}
                    </SelectItem>
                  )) : null}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <Select defaultValue="all" onValueChange={(value) => {
                // Status filter handler
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Alle Statussen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Statussen</SelectItem>
                  <SelectItem value="active">Actief</SelectItem>
                  <SelectItem value="inactive">Inactief</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <TabsContent value="grid" className="space-y-4">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array(6).fill(null).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-gray-200 rounded w-full mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-5/6 mb-3"></div>
                    <div className="flex -space-x-2 mt-4">
                      {Array(3).fill(null).map((_, j) => (
                        <div key={j} className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white"></div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-10">
              <div className="bg-red-50 inline-flex rounded-full p-4 mb-4">
                <XCircle className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-medium">Fout bij ophalen van klassen</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                Er is een probleem opgetreden bij het laden van de klassen. Probeer de pagina te vernieuwen of neem contact op met de beheerder.
              </p>
              <Button variant="outline" className="mt-4" onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] })}>
                Opnieuw proberen
              </Button>
            </div>
          ) : studentGroups.length === 0 ? (
            <div className="text-center py-10 bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="bg-blue-50 inline-flex rounded-full p-4 mb-4">
                <ChalkBoard className="h-6 w-6 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium">Geen klassen gevonden</h3>
              <p className="text-gray-500 mt-2 max-w-md mx-auto">
                {searchTerm || academicYear !== 'all' || program !== 'all' 
                  ? 'Er zijn geen klassen gevonden die aan je zoekcriteria voldoen. Pas je filters aan of maak een nieuwe klas aan.' 
                  : 'Er zijn nog geen klassen aangemaakt in het systeem. Klik op de knop hieronder om je eerste klas aan te maken.'}
              </p>
              <Button className="mt-4 bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white" onClick={handleAddStudentGroup}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Klas Aanmaken
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {studentGroups.map((group: any) => (
                  <Card key={group.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{group.name}</CardTitle>
                          <CardDescription>
                            {group.academicYear} {group.programName && `• ${group.programName}`}
                          </CardDescription>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEditStudentGroup(group)}>
                              <Pencil className="mr-2 h-4 w-4" />
                              Bewerken
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleDeleteStudentGroup(group)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Verwijderen
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-2 mb-1">
                          <GraduationCap className="h-4 w-4 text-gray-400" />
                          <span>{group.instructor || "Geen hoofddocent toegewezen"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <UsersRound className="h-4 w-4 text-gray-400" />
                          <span>{group.enrollmentCount || 0} student{group.enrollmentCount !== 1 ? 'en' : ''}</span>
                          {group.maxCapacity && (
                            <span className="text-xs text-gray-400">
                              (max: {group.maxCapacity})
                            </span>
                          )}
                        </div>
                      </div>
                      
                      {/* Student avatars */}
                      <div className="flex -space-x-2 mt-4">
                        {/* Toon avatars of fallback wanneer er geen studenten zijn */}
                        {Array(Math.min(group.enrollmentCount || 0, 3)).fill(null).map((_, i) => (
                          <Avatar key={i} className="border-2 border-white">
                            <AvatarFallback className="bg-blue-100 text-blue-800 text-xs">
                              S{i+1}
                            </AvatarFallback>
                          </Avatar>
                        ))}
                        {group.enrollmentCount > 3 && (
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 border-2 border-white text-xs font-medium text-gray-600">
                            +{group.enrollmentCount - 3}
                          </div>
                        )}
                        {group.enrollmentCount === 0 && (
                          <div className="text-xs text-gray-400 mt-1">Nog geen studenten ingeschreven</div>
                        )}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t pt-3 flex justify-between">
                      <Badge variant={group.isActive ? "default" : "secondary"}>
                        {group.isActive ? "Actief" : "Inactief"}
                      </Badge>
                      <Button variant="ghost" size="sm" className="gap-1" onClick={() => handleEditStudentGroup(group)}>
                        <Eye className="h-4 w-4" />
                        Details
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              
              {totalPages > 1 && (
                <Pagination className="mt-6">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) handlePageChange(currentPage - 1);
                        }}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <PaginationItem key={i}>
                        <PaginationLink 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            handlePageChange(i + 1);
                          }}
                          isActive={currentPage === i + 1}
                        >
                          {i + 1}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    <PaginationItem>
                      <PaginationNext 
                        href="#" 
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages) handlePageChange(currentPage + 1);
                        }}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          setIsDialogOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-[95vw] md:max-w-[85vw] lg:max-w-[80vw] xl:max-w-[75vw] sm:h-[85vh] p-0 gap-0 bg-white overflow-hidden">
          <DialogHeader className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ChalkBoard className="h-5 w-5 text-[#1e3a8a]" />
                <DialogTitle className="text-xl">
                  {isEditDialogOpen ? "Klas bewerken" : "Nieuwe klas aanmaken"}
                </DialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setIsDialogOpen(false);
                }}
                className="h-8 w-8 rounded-full p-0 text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Sluiten</span>
              </Button>
            </div>
            <DialogDescription className="text-gray-500 mt-2">
              Vul de onderstaande gegevens in om een {isEditDialogOpen ? "bestaande" : "nieuwe"} klas {isEditDialogOpen ? "bij te werken" : "aan te maken"}.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(85vh - 130px)' }}>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="algemeen" className="w-full">
                  <TabsList className="grid grid-cols-5 w-full h-10 p-1 bg-blue-900/10">
                    <TabsTrigger value="algemeen" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                      <ChalkBoard className="h-4 w-4" />
                      <span>Algemeen</span>
                    </TabsTrigger>
                    <TabsTrigger value="studenten" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                      <UsersRound className="h-4 w-4" />
                      <span>Studenten</span>
                    </TabsTrigger>
                    <TabsTrigger value="docenten" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                      <GraduationCap className="h-4 w-4" />
                      <span>Docenten</span>
                    </TabsTrigger>
                    <TabsTrigger value="vakken" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                      <BookOpen className="h-4 w-4" />
                      <span>Vakken</span>
                    </TabsTrigger>
                    <TabsTrigger value="planning" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Planning</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Content voor tabbladen hier - voor de leesbaarheid zijn deze weggelaten */}
                  {/* Je kunt hier jouw tab content toevoegen */}
                </Tabs>

                <DialogFooter className="pt-6 flex justify-between">
                  <Button
                    type="button"
                    variant="outline" 
                    onClick={() => {
                      isEditDialogOpen ? setIsEditDialogOpen(false) : setIsAddDialogOpen(false);
                      setIsDialogOpen(false);
                    }}
                  >
                    Annuleren
                  </Button>
                  <Button 
                    type="submit"
                    className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white"
                    disabled={createStudentGroupMutation.isPending || updateStudentGroupMutation.isPending}
                  >
                    {(createStudentGroupMutation.isPending || updateStudentGroupMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEditDialogOpen ? "Opslaan" : "Aanmaken"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md p-0 gap-0 bg-white overflow-hidden">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-red-500" />
                <AlertDialogTitle className="text-xl m-0">Klas verwijderen</AlertDialogTitle>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsDeleteDialogOpen(false)}
                className="h-8 w-8 rounded-full p-0 text-gray-400 hover:text-gray-500"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Sluiten</span>
              </Button>
            </div>
            <AlertDialogDescription className="text-gray-500 mt-2">
              Weet je zeker dat je deze klas wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
            
            {selectedGroup && (
              <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center gap-3">
                  <div className="bg-red-100 p-2 rounded-full">
                    <Trash2 className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-red-800">
                      Alle inschrijvingen en roosters gekoppeld aan deze klas worden ook verwijderd.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (selectedGroup) {
                  deleteStudentGroupMutation.mutate(selectedGroup.id);
                }
              }}
              className="gap-1"
              disabled={deleteStudentGroupMutation.isPending}
            >
              {deleteStudentGroupMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              <Trash2 className="h-4 w-4 mr-1" />
              Verwijderen
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}