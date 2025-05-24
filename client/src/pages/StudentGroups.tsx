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
import { ClassEmptyState } from "@/components/ui/empty-states";
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
import { Checkbox } from '@/components/ui/checkbox';
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
      setIsDialogOpen(false);
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
      setIsDialogOpen(false);
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
                    <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-10">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <AlertTriangle className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Fout bij laden</h3>
              <p className="text-gray-500 mb-4">Er is een fout opgetreden bij het laden van de klassen. Probeer de pagina te vernieuwen.</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] })}>
                Opnieuw proberen
              </Button>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-md border shadow-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="py-3 px-2 w-10 font-medium text-xs uppercase text-gray-500 text-center">
                        <Checkbox 
                          className="translate-y-[2px]"
                          onCheckedChange={(checked) => {
                            // Hier later functionaliteit toevoegen voor 'selecteer alles'
                          }}
                        />
                        <span className="sr-only">Selecteer Alles</span>
                      </th>
                      <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Klas</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Titularis</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Status</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-right">
                        <span className="sr-only">Acties</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentGroups.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8">
                          <ClassEmptyState description={
                            searchTerm 
                              ? `Er zijn geen klassen gevonden die overeenkomen met "${searchTerm}". Probeer een andere zoekopdracht.` 
                              : 'Er zijn nog geen klassen aangemaakt.'
                          } />
                        </td>
                      </tr>
                    ) : (
                      studentGroups.map((group: any) => (
                        <tr key={group.id} className="group hover:bg-blue-50/50 transition-colors border-b border-gray-200">
                          <td className="py-3 px-2 text-center">
                            <Checkbox 
                              className="translate-y-[2px]"
                              onCheckedChange={(checked) => {
                                // Hier later functionaliteit toevoegen voor individuele selectie
                              }}
                            />
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-medium text-gray-900">{group.name}</div>
                            <div className="text-gray-500 text-xs">{group.academicYear} • {group.enrolledCount || 0} studenten</div>
                          </td>
                          <td className="py-3 px-4 text-gray-700">
                            {group.instructor || "-"}
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant={group.isActive ? "default" : "outline"} className={group.isActive ? "bg-green-100 text-green-800 hover:bg-green-100" : "text-gray-500"}>
                              {group.isActive ? "Actief" : "Inactief"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-blue-600"
                                onClick={() => handleEditStudentGroup(group)}
                              >
                                <Eye className="h-4 w-4" />
                                <span className="sr-only">Details bekijken</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-slate-600"
                                onClick={() => handleEditStudentGroup(group)}
                              >
                                <Edit className="h-4 w-4" />
                                <span className="sr-only">Bewerken</span>
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-8 w-8 p-0 text-red-600"
                                onClick={() => handleDeleteStudentGroup(group)}
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(Math.max(1, currentPage - 1))} 
                          className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <PaginationItem key={i}>
                          <PaginationLink 
                            isActive={currentPage === i + 1}
                            onClick={() => handlePageChange(i + 1)}
                          >
                            {i + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
                          className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[85%] max-h-[90vh] h-auto overflow-y-auto p-0">
          {/* Blauwe header */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  {isEditDialogOpen ? 
                    <Pencil className="h-6 w-6 text-white" /> : 
                    <ChalkBoard className="h-6 w-6 text-white" />
                  }
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    {isEditDialogOpen ? "Klas Bewerken" : "Nieuwe Klas Aanmaken"}
                  </DialogTitle>
                  <DialogDescription className="text-sm text-blue-100 font-medium">
                    Vul de onderstaande gegevens in om een {isEditDialogOpen ? "bestaande" : "nieuwe"} klas {isEditDialogOpen ? "bij te werken" : "aan te maken"}.
                  </DialogDescription>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setIsDialogOpen(false);
                }}
                className="h-8 w-8 rounded-full p-0 text-white hover:bg-white/20"
              >
                <X className="h-5 w-5" />
                <span className="sr-only">Sluiten</span>
              </Button>
            </div>
          </div>
          
          <div className="px-6 py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <Tabs defaultValue="algemeen" className="w-full">
                  <TabsList className="grid grid-cols-5 mb-4 p-1 bg-[#1e3a8a]/10 rounded-md">
                    <TabsTrigger value="algemeen" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                      <ChalkBoard className="h-4 w-4" />
                      <span>Algemeen</span>
                    </TabsTrigger>
                    <TabsTrigger value="studenten" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                      <UsersRound className="h-4 w-4" />
                      <span>Studenten</span>
                    </TabsTrigger>
                    <TabsTrigger value="docenten" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                      <GraduationCap className="h-4 w-4" />
                      <span>Docenten</span>
                    </TabsTrigger>
                    <TabsTrigger value="vakken" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                      <BookOpen className="h-4 w-4" />
                      <span>Vakken</span>
                    </TabsTrigger>
                    <TabsTrigger value="planning" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                      <CalendarIcon className="h-4 w-4" />
                      <span>Planning</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Algemeen tabblad */}
                  <TabsContent value="algemeen" className="mt-0">
                    <div className="p-4 bg-white rounded-lg min-h-[450px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-700">Klasnaam <span className="text-primary">*</span></FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="Voer klasnaam in" 
                                  {...field} 
                                  className="mt-1 h-9 text-sm bg-white border-gray-200" 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="academicYear"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-700">Academisch Jaar <span className="text-primary">*</span></FormLabel>
                              <Select 
                                onValueChange={field.onChange} 
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="mt-1 h-9 text-sm bg-white border-gray-200">
                                    <SelectValue placeholder="Selecteer academisch jaar" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="2025-2026">2025-2026</SelectItem>
                                  <SelectItem value="2024-2025">2024-2025</SelectItem>
                                  <SelectItem value="2023-2024">2023-2024</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="maxCapacity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-700">Maximale Capaciteit</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="30"
                                  {...field}
                                  className="mt-1 h-9 text-sm bg-white border-gray-200"
                                  onChange={(e) => {
                                    const value = parseInt(e.target.value);
                                    field.onChange(isNaN(value) ? undefined : value);
                                  }}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="programId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-700">Opleiding</FormLabel>
                              <Select
                                onValueChange={(value) => field.onChange(parseInt(value))}
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger className="mt-1 h-9 text-sm bg-white border-gray-200">
                                    <SelectValue placeholder="Selecteer opleiding" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {programs.map((program: any) => (
                                    <SelectItem key={program.id} value={program.id.toString()}>
                                      {program.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="instructor"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-700">Klastitularis</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Naam van klastitularis"
                                  {...field}
                                  className="mt-1 h-9 text-sm bg-white border-gray-200"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="isActive"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                              <div className="space-y-0.5">
                                <FormLabel className="text-xs font-medium text-gray-700">Actieve Status</FormLabel>
                                <FormDescription className="text-xs">
                                  Bepaalt of deze klas actief is in het systeem
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
                        <div className="col-span-1 md:col-span-2">
                          <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-xs font-medium text-gray-700">Beschrijving</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Voeg een beschrijving toe..."
                                    className="resize-none text-sm bg-white border-gray-200"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Studenten tabblad */}
                  <TabsContent value="studenten" className="mt-0">
                    <div className="p-4 bg-white rounded-lg min-h-[450px]">
                      <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center">
                          <h3 className="text-lg font-medium">Ingeschreven Studenten</h3>
                          <Button 
                            variant="outline" 
                            className="flex items-center text-sm"
                            disabled={!isEditDialogOpen}
                            onClick={(e) => {
                              e.preventDefault();
                              // Hier zou je een functie kunnen aanroepen om studenten toe te voegen
                              toast({
                                title: "Info",
                                description: "Eerst de klas opslaan voordat studenten kunnen worden toegevoegd."
                              });
                            }}
                          >
                            <Plus className="mr-1 h-4 w-4" />
                            <span>Studenten Toevoegen</span>
                          </Button>
                        </div>
                        
                        {!isEditDialogOpen ? (
                          <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                            <Users2 className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                            <h3 className="text-sm font-medium text-gray-700 mb-1">Nog geen studenten ingeschreven</h3>
                            <p className="text-xs text-gray-500">Sla de klas eerst op voordat je studenten kunt toevoegen.</p>
                          </div>
                        ) : (
                          <ManageStudentEnrollments groupId={selectedGroup?.id} />
                        )}
                      </div>
                    </div>
                  </TabsContent>
                  
                  {/* Docenten tabblad */}
                  <TabsContent value="docenten" className="mt-0">
                    <div className="p-4 bg-white rounded-lg min-h-[450px]">
                      <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                        <GraduationCap className="mx-auto h-10 w-10 text-gray-400 mb-3" />
                        <h3 className="text-sm font-medium text-gray-700 mb-1">Docenttoewijzingen</h3>
                        <p className="text-xs text-gray-500">Docenten kunnen worden toegewezen nadat de klas is aangemaakt.</p>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Vakken tabblad */}
                  <TabsContent value="vakken" className="mt-0">
                    <div className="p-4 bg-white rounded-lg min-h-[450px]">
                      <FormField
                        control={form.control}
                        name="courseId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs font-medium text-gray-700">Vakken</FormLabel>
                            <Select
                              onValueChange={(value) => field.onChange(parseInt(value))}
                              value={field.value?.toString()}
                            >
                              <FormControl>
                                <SelectTrigger className="mt-1 h-9 text-sm bg-white border-gray-200">
                                  <SelectValue placeholder="Selecteer vak" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {courses.map((course: any) => (
                                  <SelectItem key={course.id} value={course.id.toString()}>
                                    {course.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormDescription className="text-xs">
                              Het vak dat aan deze klas wordt onderwezen
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="mt-8">
                        <FormField
                          control={form.control}
                          name="curriculum"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-xs font-medium text-gray-700">Curriculum</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger className="mt-1 h-9 text-sm bg-white border-gray-200">
                                    <SelectValue placeholder="Selecteer curriculum" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="arabisch">Arabisch</SelectItem>
                                  <SelectItem value="islamitisch">Islamitisch</SelectItem>
                                  <SelectItem value="taal">Taal & Cultuur</SelectItem>
                                  <SelectItem value="wiskunde">Wiskunde</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormDescription className="text-xs">
                                Het curriculum dat deze klas volgt
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <div className="text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300 mt-4">
                          <BookOpen className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-500">Meerdere vakken kunnen worden toegewezen nadat de klas is aangemaakt.</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  {/* Planning tabblad */}
                  <TabsContent value="planning" className="mt-0">
                    <div className="p-4 bg-white rounded-lg min-h-[450px]">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="startDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-xs font-medium text-gray-700">Startdatum</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "pl-3 text-left font-normal mt-1 h-9 text-sm bg-white border-gray-200",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd-MM-yyyy")
                                      ) : (
                                        <span>Selecteer datum</span>
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
                          name="endDate"
                          render={({ field }) => (
                            <FormItem className="flex flex-col">
                              <FormLabel className="text-xs font-medium text-gray-700">Einddatum</FormLabel>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <FormControl>
                                    <Button
                                      variant={"outline"}
                                      className={cn(
                                        "pl-3 text-left font-normal mt-1 h-9 text-sm bg-white border-gray-200",
                                        !field.value && "text-muted-foreground"
                                      )}
                                    >
                                      {field.value ? (
                                        format(field.value, "dd-MM-yyyy")
                                      ) : (
                                        <span>Selecteer datum</span>
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
                                    initialFocus
                                  />
                                </PopoverContent>
                              </Popover>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      
                      <div className="mt-8">
                        <h3 className="text-sm font-medium text-gray-700 mb-3">Lesroosters</h3>
                        <div className="text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                          <CalendarIcon className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                          <p className="text-xs text-gray-500">Lesroosters kunnen worden ingesteld nadat de klas is aangemaakt.</p>
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </form>
            </Form>
          </div>
          <div className="p-4 border-t flex justify-end gap-3 bg-gray-50">
            <Button
              type="button"
              variant="outline" 
              onClick={() => {
                setIsAddDialogOpen(false);
                setIsEditDialogOpen(false);
                setIsDialogOpen(false);
              }}
              className="border-gray-300"
            >
              Annuleren
            </Button>
            <Button 
              type="button"
              onClick={form.handleSubmit(onSubmit)}
              className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/90 text-white"
              disabled={createStudentGroupMutation.isPending || updateStudentGroupMutation.isPending}
            >
              {(createStudentGroupMutation.isPending || updateStudentGroupMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditDialogOpen ? "Opslaan" : "Klas Aanmaken"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 text-red-600">
              <AlertTriangle className="h-5 w-5" />
              <AlertDialogTitle>Klas verwijderen</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Weet je zeker dat je deze klas wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="px-6 py-3 text-sm border-t border-b border-gray-100 bg-gray-50 my-2">
            <p className="font-medium mb-1">{selectedGroup?.name}</p>
            <p className="text-gray-500">{selectedGroup?.academicYear}</p>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedGroup && deleteStudentGroupMutation.mutate(selectedGroup.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteStudentGroupMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}