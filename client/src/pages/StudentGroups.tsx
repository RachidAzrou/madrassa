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
  CalendarIcon, Loader2, XCircle,
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <ChalkBoard className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Klassen</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Beheer klassen, secties en activiteitengroepen
          </p>
        </div>
      </div>
      
      {/* Zoekbalk - onder de paginatitel geplaatst */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-4">
        <div className="relative w-full md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Zoek klassen..."
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
        
        <Button onClick={handleAddStudentGroup} className="flex items-center bg-primary hover:bg-primary/90">
          <PlusCircle className="mr-2 h-4 w-4" />
          <span>Klas Aanmaken</span>
        </Button>
      </div>

      {/* Main content area */}
      <Tabs defaultValue="grid" className="space-y-4">
        <div className="flex items-center gap-4 mb-6">
          <TabsList className="p-1 bg-blue-900/10">
            <TabsTrigger value="grid" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">Rasterweergave</TabsTrigger>
            <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">Lijstweergave</TabsTrigger>
          </TabsList>
        </div>
        
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
                      {Array(4).fill(null).map((_, j) => (
                        <div key={j} className="w-8 h-8 rounded-full bg-gray-200"></div>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter>
                    <div className="h-8 bg-gray-200 rounded w-full"></div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-10">
              <div className="text-red-500 mb-2">Er is een fout opgetreden bij het laden van de klassen</div>
              <Button 
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] })}
              >
                Probeer opnieuw
              </Button>
            </div>
          ) : studentGroups.length === 0 ? (
            <div className="text-center py-10">
              <School className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-2">Geen klassen gevonden</h3>
              <p className="text-gray-500 mb-4">
                Er zijn geen klassen die overeenkomen met de geselecteerde filters.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {studentGroups.map((group: any) => (
                <Card key={group.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg font-bold">{group.name}</CardTitle>
                        <CardDescription>
                          {group.academicYear || "Geen academisch jaar"}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            className="cursor-pointer flex items-center"
                            onClick={() => handleEditStudentGroup(group)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Bewerken</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="cursor-pointer flex items-center"
                            onClick={() => {
                              setSelectedGroup(group);
                              setIsEditDialogOpen(true);
                              // We gebruiken een kleine vertraging om ervoor te zorgen dat de dialog eerst opent
                              setTimeout(() => {
                                const studentenTab = document.querySelector('[value="studenten"]') as HTMLElement;
                                if (studentenTab) studentenTab.click();
                              }, 100);
                            }}
                          >
                            <UsersRound className="mr-2 h-4 w-4" />
                            <span>Studenten beheren</span>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="cursor-pointer text-red-600 flex items-center"
                            onClick={() => handleDeleteStudentGroup(group)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            <span>Verwijderen</span>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-500 mb-3">
                      <div className="flex items-center mb-1">
                        <GraduationCap className="h-4 w-4 mr-2" />
                        <span>{group.programName || "Geen programma toegewezen"}</span>
                      </div>
                      <div className="flex items-center mb-1">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span>{group.courseName || "Geen vak toegewezen"}</span>
                      </div>
                      <div className="flex items-center">
                        <UsersRound className="h-4 w-4 mr-2" />
                        <span>{(group.studentCount || 0)} / {group.maxCapacity || "∞"} studenten</span>
                      </div>
                    </div>
                    <div className="h-1 bg-gray-100 rounded-full mt-2 mb-3">
                      <div 
                        className={cn(
                          "h-1 rounded-full",
                          group.maxCapacity && group.studentCount / group.maxCapacity > 0.8 
                            ? "bg-red-400" 
                            : "bg-green-400"
                        )}
                        style={{ 
                          width: group.maxCapacity 
                            ? `${Math.min(100, (group.studentCount / group.maxCapacity) * 100)}%` 
                            : '0%' 
                        }}
                      ></div>
                    </div>
                    {group.description && (
                      <p className="text-sm text-gray-600 mt-2 line-clamp-2">{group.description}</p>
                    )}
                  </CardContent>
                  <CardFooter className="pt-0 flex justify-between items-center">
                    <Badge variant={group.isActive ? "default" : "outline"}>
                      {group.isActive ? "Actief" : "Inactief"}
                    </Badge>
                    <Button variant="ghost" size="sm" className="gap-1">
                      <Eye className="h-4 w-4" />
                      <span>Details</span>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <Pagination className="mt-8">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
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
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg shadow">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academisch Jaar</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Opleiding</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vak</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Studenten</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {isLoading ? (
                  Array(5).fill(null).map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
                      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-2/3"></div></td>
                      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
                      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
                      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/4"></div></td>
                      <td className="p-3"><div className="h-4 bg-gray-200 rounded w-1/3"></div></td>
                    </tr>
                  ))
                ) : studentGroups.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center">
                      <School className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Geen klassen gevonden</p>
                    </td>
                  </tr>
                ) : (
                  studentGroups.map((group: any) => (
                    <tr key={group.id} className="hover:bg-gray-50">
                      <td className="p-3">
                        <div className="font-medium">{group.name}</div>
                      </td>
                      <td className="p-3">{group.academicYear || "—"}</td>
                      <td className="p-3">{group.programName || "—"}</td>
                      <td className="p-3">{group.courseName || "—"}</td>
                      <td className="p-3">
                        <div className="flex items-center">
                          <span className="mr-2">{(group.studentCount || 0)} / {group.maxCapacity || "∞"}</span>
                          <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                            <div 
                              className={cn(
                                "h-1.5 rounded-full",
                                group.maxCapacity && group.studentCount / group.maxCapacity > 0.8 
                                  ? "bg-red-400" 
                                  : "bg-green-400"
                              )}
                              style={{ 
                                width: group.maxCapacity 
                                  ? `${Math.min(100, (group.studentCount / group.maxCapacity) * 100)}%` 
                                  : '0%' 
                              }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={group.isActive ? "default" : "outline"}>
                          {group.isActive ? "Actief" : "Inactief"}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEditStudentGroup(group)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600" onClick={() => handleDeleteStudentGroup(group)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {totalPages > 1 && (
            <Pagination className="mt-8">
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
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <PaginationItem key={page}>
                    <PaginationLink
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(page);
                      }}
                      isActive={currentPage === page}
                    >
                      {page}
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
        </TabsContent>
      </Tabs>

      {/* Klas toevoegen/bewerken dialoog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-[95vw] sm:h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Klas bewerken" : "Nieuwe klas aanmaken"}
            </DialogTitle>
            <DialogDescription>
              Vul de onderstaande gegevens in om een {isEditDialogOpen ? "bestaande" : "nieuwe"} klas {isEditDialogOpen ? "bij te werken" : "aan te maken"}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <Tabs defaultValue="algemeen" className="w-full">
                <TabsList className="grid grid-cols-5 w-full p-1 bg-blue-900/10">
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

                {/* Studenten tabblad */}
                <TabsContent value="studenten" className="pt-4">
                  {isEditDialogOpen && selectedGroup ? (
                    <ManageStudentEnrollments groupId={selectedGroup.id} />
                  ) : (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <p className="text-gray-500 mb-2">
                        Sla de klas eerst op om studenten toe te kunnen wijzen.
                      </p>
                      <p className="text-sm text-gray-400">
                        Na het aanmaken kun je vanuit het bewerkscherm studenten toewijzen.
                      </p>
                    </div>
                  )}
                </TabsContent>

                {/* Algemeen tabblad */}
                <TabsContent value="algemeen" className="pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Klasnaam *</FormLabel>
                          <FormControl>
                            <Input placeholder="Voer klasnaam in" {...field} />
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
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
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
                          <FormLabel>Maximale Capaciteit</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="30"
                              {...field}
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
                      name="description"
                      render={({ field }) => (
                        <FormItem className="col-span-2">
                          <FormLabel>Beschrijving</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Geef een beschrijving van de klas en doelstellingen"
                              className="min-h-24"
                              {...field} 
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
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                          <div className="space-y-0.5">
                            <FormLabel>Status Actief</FormLabel>
                            <FormDescription>
                              Als dit niet actief is, kan de klas niet worden gebruikt voor nieuwe inschrijvingen.
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
                </TabsContent>

                {/* Studenten tabblad */}
                <TabsContent value="studenten" className="pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Studenten toewijzen</h3>
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="Zoek studenten..." 
                          className="w-64"
                        />
                        <Button type="button" variant="outline" size="sm">
                          <Search className="h-4 w-4 mr-2" />
                          Zoeken
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-md">
                      <div className="p-3 bg-gray-50 border-b">
                        <h4 className="font-medium">Toegewezen studenten</h4>
                        <p className="text-sm text-gray-500">Sleep studenten naar deze sectie om ze toe te wijzen aan de klas.</p>
                      </div>
                      <div className="p-4 min-h-[150px] bg-gray-50/30">
                        <div className="text-center text-gray-500 py-10">
                          <UsersRound className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                          <p>Er zijn nog geen studenten toegewezen</p>
                          <p className="text-sm mt-1">Gebruik de zoekfunctie om studenten te vinden en toe te wijzen</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-md mt-4">
                      <div className="p-3 bg-gray-50 border-b">
                        <h4 className="font-medium">Beschikbare studenten</h4>
                        <p className="text-sm text-gray-500">Selecteer en sleep de studenten die je wilt toewijzen aan deze klas.</p>
                      </div>
                      <div className="p-3">
                        <table className="w-full">
                          <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                            <tr>
                              <th className="px-2 py-2 text-left">ID</th>
                              <th className="px-2 py-2 text-left">Naam</th>
                              <th className="px-2 py-2 text-left">Email</th>
                              <th className="px-2 py-2 text-left">Status</th>
                              <th className="px-2 py-2 text-left">Acties</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {/* Studenten zullen hier dynamisch geladen worden */}
                            <tr className="text-center h-16">
                              <td colSpan={5} className="text-gray-500 text-sm">
                                Zoek studenten om toe te voegen aan de klas
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Docenten tabblad */}
                <TabsContent value="docenten" className="pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Docenten toewijzen</h3>
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="Zoek docenten..." 
                          className="w-64"
                        />
                        <Button type="button" variant="outline" size="sm">
                          <Search className="h-4 w-4 mr-2" />
                          Zoeken
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-md">
                      <div className="p-3 bg-gray-50 border-b">
                        <h4 className="font-medium">Toegewezen docenten</h4>
                        <p className="text-sm text-gray-500">Wijs docenten toe aan deze klas en geef aan welke vakken ze geven.</p>
                      </div>
                      <div className="p-4 min-h-[150px] bg-gray-50/30">
                        <FormField
                          control={form.control}
                          name="instructor"
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel>Docent</FormLabel>
                              <FormControl>
                                <Input placeholder="Naam van docent" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="text-center text-gray-500 py-5">
                          <p className="text-sm">Voeg extra docenten toe voor specifieke vakken indien nodig</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-md mt-4">
                      <div className="p-3 bg-gray-50 border-b">
                        <h4 className="font-medium">Beschikbare docenten</h4>
                        <p className="text-sm text-gray-500">Selecteer docenten om toe te wijzen aan deze klas.</p>
                      </div>
                      <div className="p-3">
                        <table className="w-full">
                          <thead className="bg-gray-50 text-xs font-medium text-gray-500 uppercase">
                            <tr>
                              <th className="px-2 py-2 text-left">ID</th>
                              <th className="px-2 py-2 text-left">Naam</th>
                              <th className="px-2 py-2 text-left">Vakken</th>
                              <th className="px-2 py-2 text-left">Geslacht</th>
                              <th className="px-2 py-2 text-left">Status</th>
                              <th className="px-2 py-2 text-left">Acties</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y">
                            {/* Voorbeeldgegevens - Deze worden later dynamisch geladen */}
                            <tr>
                              <td className="px-2 py-2">D001</td>
                              <td className="px-2 py-2">Ahmed Mustapha</td>
                              <td className="px-2 py-2">
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="outline" className="bg-blue-50">Arabisch</Badge>
                                  <Badge variant="outline" className="bg-blue-50">Tajweed</Badge>
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <div className="bg-blue-100 text-blue-800 rounded-full p-1 w-7 h-7 flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="7" r="4"/>
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                                  </svg>
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <Badge variant="default">Actief</Badge>
                              </td>
                              <td className="px-2 py-2">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                            <tr>
                              <td className="px-2 py-2">D002</td>
                              <td className="px-2 py-2">Fatima El-Zahra</td>
                              <td className="px-2 py-2">
                                <div className="flex flex-wrap gap-1">
                                  <Badge variant="outline" className="bg-blue-50">Fiqh</Badge>
                                  <Badge variant="outline" className="bg-blue-50">Islamitische Geschiedenis</Badge>
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <div className="bg-pink-100 text-pink-800 rounded-full p-1 w-7 h-7 flex items-center justify-center">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="7" r="4"/>
                                    <path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/>
                                    <line x1="16" y1="16" x2="13" y2="16"/>
                                    <line x1="8" y1="16" x2="11" y2="16"/>
                                  </svg>
                                </div>
                              </td>
                              <td className="px-2 py-2">
                                <Badge variant="default">Actief</Badge>
                              </td>
                              <td className="px-2 py-2">
                                <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Vakken tabblad */}
                <TabsContent value="vakken" className="pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Vakken toewijzen</h3>
                      <div className="flex items-center gap-2">
                        <Input 
                          placeholder="Zoek vakken..." 
                          className="w-64"
                        />
                        <Button type="button" variant="outline" size="sm">
                          <Search className="h-4 w-4 mr-2" />
                          Zoeken
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-md">
                      <div className="p-3 bg-gray-50 border-b">
                        <h4 className="font-medium">Toegewezen vakken</h4>
                        <p className="text-sm text-gray-500">De vakken die in deze klas worden onderwezen.</p>
                      </div>
                      <div className="p-4 min-h-[100px] bg-gray-50/30">
                        <FormField
                          control={form.control}
                          name="courseId"
                          render={({ field }) => (
                            <FormItem className="mb-4">
                              <FormLabel>Vak</FormLabel>
                              <Select 
                                onValueChange={(value) => field.onChange(Number(value))}
                                value={field.value?.toString()}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Selecteer hoofdvak" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {courses.map((course) => (
                                    <SelectItem key={course.id} value={course.id.toString()}>
                                      {course.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="text-center text-gray-500 py-2">
                          <p className="text-sm">Voeg extra vakken toe indien nodig</p>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-md mt-4">
                      <div className="p-3 bg-gray-50 border-b">
                        <h4 className="font-medium">Curriculum opbouw</h4>
                        <p className="text-sm text-gray-500">Plan het curriculum en het aantal uren per week.</p>
                      </div>
                      <div className="p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="border rounded-md p-3">
                            <h5 className="font-medium mb-2">Lesrooster</h5>
                            <div className="space-y-2">
                              {/* Voorbeelditem dat wordt toegevoegd wanneer er een vak is geselecteerd */}
                              <div className="border rounded p-3 bg-gray-50">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">Arabisch</span>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                    <Trash2 className="h-4 w-4 text-red-500" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">Dag</label>
                                    <Select defaultValue="maandag">
                                      <SelectTrigger className="w-full text-sm h-8">
                                        <SelectValue placeholder="Selecteer dag" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="maandag">Maandag</SelectItem>
                                        <SelectItem value="dinsdag">Dinsdag</SelectItem>
                                        <SelectItem value="woensdag">Woensdag</SelectItem>
                                        <SelectItem value="donderdag">Donderdag</SelectItem>
                                        <SelectItem value="vrijdag">Vrijdag</SelectItem>
                                        <SelectItem value="zaterdag">Zaterdag</SelectItem>
                                        <SelectItem value="zondag">Zondag</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">Tijd</label>
                                    <div className="flex items-center gap-1">
                                      <Select defaultValue="18:00">
                                        <SelectTrigger className="w-full text-sm h-8">
                                          <SelectValue placeholder="Start" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Array.from({ length: 14 }).map((_, i) => {
                                            const hour = 8 + i;
                                            return (
                                              <SelectItem key={hour} value={`${hour}:00`}>
                                                {`${hour}:00`}
                                              </SelectItem>
                                            );
                                          })}
                                        </SelectContent>
                                      </Select>
                                      <span>-</span>
                                      <Select defaultValue="19:30">
                                        <SelectTrigger className="w-full text-sm h-8">
                                          <SelectValue placeholder="Eind" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {Array.from({ length: 14 }).map((_, i) => {
                                            const hour = 9 + i;
                                            return (
                                              <SelectItem key={hour} value={`${hour}:30`}>
                                                {`${hour}:30`}
                                              </SelectItem>
                                            );
                                          })}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="text-xs text-gray-500 mt-2 italic">
                                <p>Je kunt alleen vakken toevoegen die eerst zijn toegewezen aan deze klas</p>
                              </div>
                            </div>
                            <Button type="button" variant="outline" size="sm" className="mt-3 w-full">
                              <Plus className="h-4 w-4 mr-2" />
                              Vak toevoegen aan rooster
                            </Button>
                          </div>
                          <div className="border rounded-md p-3">
                            <h5 className="font-medium mb-2">Beschikbare vakken</h5>
                            <div className="space-y-2">
                              <div className="border rounded p-3 bg-blue-50">
                                <h6 className="font-medium">Arabisch</h6>
                                <p className="text-xs text-gray-600 mt-1">Docent: Ahmed Mustapha</p>
                                <Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Toevoegen aan rooster
                                </Button>
                              </div>
                              <div className="border rounded p-3 bg-blue-50">
                                <h6 className="font-medium">Fiqh</h6>
                                <p className="text-xs text-gray-600 mt-1">Docent: Fatima El-Zahra</p>
                                <Button type="button" variant="ghost" size="sm" className="mt-2 h-7 px-2 text-xs">
                                  <Plus className="h-3 w-3 mr-1" />
                                  Toevoegen aan rooster
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Planning tabblad */}
                <TabsContent value="planning" className="pt-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium">Planning en roosters</h3>
                    </div>

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
                                      format(field.value, "dd-MM-yyyy")
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
                                      format(field.value, "dd-MM-yyyy")
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

                    <div className="border rounded-md">
                      <div className="p-3 bg-gray-50 border-b">
                        <h4 className="font-medium">Lesdagen en tijden</h4>
                        <p className="text-sm text-gray-500">Configureer op welke dagen en tijden lessen plaatsvinden.</p>
                      </div>
                      <div className="p-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                          {['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag'].map((day) => (
                            <div key={day} className="border rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium">{day}</span>
                                <Switch />
                              </div>
                              <div className="space-y-1 mt-3">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">Van</label>
                                    <Select disabled>
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="09:00" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 13 }, (_, i) => {
                                          const hour = 8 + i;
                                          return (
                                            <SelectItem key={hour} value={`${hour}:00`}>
                                              {`${hour}:00`}
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-500 block mb-1">Tot</label>
                                    <Select disabled>
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="12:00" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {Array.from({ length: 13 }, (_, i) => {
                                          const hour = 8 + i;
                                          return (
                                            <SelectItem key={hour} value={`${hour}:00`}>
                                              {`${hour}:00`}
                                            </SelectItem>
                                          )
                                        })}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-md">
                      <div className="p-3 bg-gray-50 border-b">
                        <h4 className="font-medium">Belangrijke datums</h4>
                        <p className="text-sm text-gray-500">Plan tentamendata, vakanties en andere belangrijke momenten.</p>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          {/* Voorbeeld ingevoerde datums */}
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div className="border rounded-md p-3 bg-blue-50 relative">
                              <div className="absolute top-2 right-2">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                              <div className="bg-primary text-white text-xs rounded-full px-2 py-0.5 inline-block mb-1">Les</div>
                              <h5 className="font-medium text-sm">Eerste les</h5>
                              <p className="text-xs text-gray-600 mt-1">05-09-2025</p>
                            </div>
                            
                            <div className="border rounded-md p-3 bg-amber-50 relative">
                              <div className="absolute top-2 right-2">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                              <div className="bg-amber-500 text-white text-xs rounded-full px-2 py-0.5 inline-block mb-1">Examen</div>
                              <h5 className="font-medium text-sm">Midterm examen</h5>
                              <p className="text-xs text-gray-600 mt-1">15-12-2025</p>
                            </div>
                            
                            <div className="border rounded-md p-3 bg-green-50 relative">
                              <div className="absolute top-2 right-2">
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </div>
                              <div className="bg-green-500 text-white text-xs rounded-full px-2 py-0.5 inline-block mb-1">Vakantie</div>
                              <h5 className="font-medium text-sm">Wintervakantie</h5>
                              <p className="text-xs text-gray-600 mt-1">20-12-2025 - 05-01-2026</p>
                            </div>
                          </div>
                          
                          {/* Formulier voor nieuwe datum */}
                          <div className="border rounded-md p-3 mt-4">
                            <h5 className="font-medium text-sm mb-3">Nieuwe datum toevoegen</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Titel</label>
                                <Input className="h-8 text-sm" placeholder="Beschrijving van deze datum" />
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Type</label>
                                <Select defaultValue="les">
                                  <SelectTrigger className="h-8 text-sm">
                                    <SelectValue placeholder="Selecteer type" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="les">Les</SelectItem>
                                    <SelectItem value="examen">Examen</SelectItem>
                                    <SelectItem value="vakantie">Vakantie</SelectItem>
                                    <SelectItem value="activiteit">Activiteit</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Datum</label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="h-8 text-sm w-full justify-start font-normal">
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      <span>Kies een datum</span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" initialFocus />
                                  </PopoverContent>
                                </Popover>
                              </div>
                              <div>
                                <label className="text-xs text-gray-500 block mb-1">Einddatum (optioneel)</label>
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button variant={"outline"} className="h-8 text-sm w-full justify-start font-normal">
                                      <CalendarIcon className="mr-2 h-4 w-4" />
                                      <span>Kies een datum</span>
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar mode="single" initialFocus />
                                  </PopoverContent>
                                </Popover>
                              </div>
                            </div>
                            <Button type="button" size="sm" className="mt-3">
                              <Plus className="h-4 w-4 mr-2" />
                              Toevoegen
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    isEditDialogOpen ? setIsEditDialogOpen(false) : setIsAddDialogOpen(false);
                  }}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit"
                  disabled={createStudentGroupMutation.isPending || updateStudentGroupMutation.isPending}
                >
                  {(createStudentGroupMutation.isPending || updateStudentGroupMutation.isPending) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isEditDialogOpen ? "Bijwerken" : "Aanmaken"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Klas verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze klas wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {selectedGroup && (
            <div className="py-4 space-y-3">
              <div className="border rounded-md p-3 bg-red-50">
                <p className="text-sm text-gray-700 font-medium">
                  Je staat op het punt om de volgende klas te verwijderen:
                </p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm"><span className="font-medium">Naam:</span> {selectedGroup.name}</p>
                  <p className="text-sm"><span className="font-medium">Academisch jaar:</span> {selectedGroup.academicYear}</p>
                  {selectedGroup.programId && (
                    <p className="text-sm">
                      <span className="font-medium">Opleiding:</span> {
                        programs.find(p => p.id === selectedGroup.programId)?.name || 'Onbekend'
                      }
                    </p>
                  )}
                  {selectedGroup.maxCapacity && (
                    <p className="text-sm"><span className="font-medium">Capaciteit:</span> {selectedGroup.maxCapacity} studenten</p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Status:</span> {selectedGroup.isActive ? 'Actief' : 'Inactief'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-red-600">
                Let op: Bij het verwijderen van een klas worden alle gekoppelde studenten losgekoppeld van deze klas.
              </p>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedGroup) {
                  deleteStudentGroupMutation.mutate(selectedGroup.id);
                }
              }}
              className="bg-red-600 hover:bg-red-700"
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