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
                      <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Klas</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Titularis</th>
                      <th className="py-3 px-4 font-medium text-xs uppercase text-gray-500 text-left">Status</th>
                      <th className="py-3 px-4 text-right">
                        <span className="sr-only">Acties</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {studentGroups.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-8 px-4 text-center">
                          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
                            <ChalkBoard className="h-8 w-8 text-blue-600" />
                          </div>
                          <h3 className="text-lg font-medium text-gray-900 mb-2">Geen klassen gevonden</h3>
                          <p className="text-gray-500 max-w-md mx-auto">
                            {searchTerm 
                              ? `Er zijn geen klassen gevonden die overeenkomen met "${searchTerm}". Probeer een andere zoekopdracht.` 
                              : 'Er zijn nog geen klassen aangemaakt.'}
                          </p>
                        </td>
                      </tr>
                    ) : (
                      studentGroups.map((group: any) => (
                        <tr key={group.id} className="group hover:bg-blue-50/50 transition-colors border-b border-gray-200">
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
                            <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
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
                          className={currentPage === 1 ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                        />
                      </PaginationItem>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink 
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))} 
                          className={currentPage === totalPages ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
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

      {/* Add/Edit Student Group Dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
          setIsDialogOpen(false);
          setSelectedGroup(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white rounded-t-lg">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <ChalkBoard className="h-6 w-6" />
                <DialogTitle className="text-xl">
                  {isEditDialogOpen ? 'Klas Bewerken' : 'Nieuwe Klas Aanmaken'}
                </DialogTitle>
              </div>
              <Button 
                variant="ghost" 
                size="icon"
                className="text-white hover:bg-blue-700/20 rounded-full h-8 w-8 p-0"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setIsDialogOpen(false);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <DialogDescription className="text-blue-100 mt-2">
              {isEditDialogOpen 
                ? 'Werk de gegevens van deze klas bij in het systeem.'
                : 'Vul de benodigde informatie in om een nieuwe klas aan te maken.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="mt-6">
            <TabsList className="mb-4 bg-gray-100">
              <TabsTrigger value="basic">Basisinformatie</TabsTrigger>
              <TabsTrigger value="schedule">Planning</TabsTrigger>
              {isEditDialogOpen && <TabsTrigger value="students">Studenten</TabsTrigger>}
            </TabsList>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <TabsContent value="basic" className="space-y-4 px-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Klasnaam *</FormLabel>
                          <FormControl>
                            <Input placeholder="bijv. Klas 1A" {...field} />
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
                          <FormLabel>Academisch Jaar *</FormLabel>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer een jaar" />
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
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="programId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Opleiding</FormLabel>
                          <Select 
                            value={field.value ? field.value.toString() : ""} 
                            onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecteer een opleiding" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="">Geen opleiding</SelectItem>
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
                          <FormLabel>Klastitularis</FormLabel>
                          <FormControl>
                            <Input placeholder="Naam van de titularis" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Beschrijving</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Beschrijving van de klas, bijzonderheden, etc."
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="maxCapacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Maximum Capaciteit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            {...field}
                            onChange={e => field.onChange(e.target.valueAsNumber)}
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
                      <FormItem className="flex items-center justify-between space-y-0 rounded-lg border p-3">
                        <div>
                          <FormLabel className="font-medium text-base">Status</FormLabel>
                          <FormDescription>Is deze klas momenteel actief?</FormDescription>
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
                </TabsContent>
                
                <TabsContent value="schedule" className="space-y-4 px-1">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Startdatum</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "P")
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
                          <FormLabel>Einddatum</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant={"outline"}
                                  className={cn(
                                    "pl-3 text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                  )}
                                >
                                  {field.value ? (
                                    format(field.value, "P")
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
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
                
                {isEditDialogOpen && (
                  <TabsContent value="students" className="px-1">
                    {selectedGroup && (
                      <ManageStudentEnrollments 
                        groupId={selectedGroup.id} 
                        groupName={selectedGroup.name} 
                      />
                    )}
                  </TabsContent>
                )}
                
                <DialogFooter className="bg-gray-50 p-4 mt-6 -mx-6 -mb-6 rounded-b-lg flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setIsEditDialogOpen(false);
                      setIsDialogOpen(false);
                    }}
                  >
                    Annuleren
                  </Button>
                  <Button 
                    type="submit"
                    disabled={createStudentGroupMutation.isPending || updateStudentGroupMutation.isPending}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {(createStudentGroupMutation.isPending || updateStudentGroupMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isEditDialogOpen ? 'Opslaan' : 'Aanmaken'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Klas verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je de klas "{selectedGroup?.name}" wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedGroup && deleteStudentGroupMutation.mutate(selectedGroup.id)}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
            >
              {deleteStudentGroupMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig met verwijderen...
                </>
              ) : (
                "Verwijderen"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}