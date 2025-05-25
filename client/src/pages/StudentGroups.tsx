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
  CalendarIcon, Loader2, XCircle, Users2, X, AlertTriangle, Save
} from 'lucide-react';
import ManageStudentEnrollments from "@/components/student-groups/ManageStudentEnrollments";
import { ClassEmptyState } from "@/components/ui/empty-states";
import { PremiumHeader } from "@/components/layout/premium-header";
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
import { Label } from "@/components/ui/label";
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
    curriculum: z.string().optional(),
    instructor: z.string().optional(),
    notes: z.string().optional(),
    location: z.string().optional(),
    startTime: z.string().optional(),
    endTime: z.string().optional(),
    dayOfWeek: z.string().optional(),
    maxCapacity: z.coerce.number().optional(),
    isActive: z.boolean().default(true),
  });

  // Initialize form for add/edit
  const form = useForm<z.infer<typeof studentGroupSchema>>({
    resolver: zodResolver(studentGroupSchema),
    defaultValues: {
      name: "",
      academicYear: new Date().getFullYear().toString(),
      programId: undefined,
      courseId: undefined,
      curriculum: "",
      instructor: "",
      notes: "",
      location: "",
      startTime: "",
      endTime: "",
      dayOfWeek: "",
      maxCapacity: 25,
      isActive: true,
    },
  });

  // Initialize form for student enrollments
  const [showManageEnrollments, setShowManageEnrollments] = useState(false);
  const [selectedGroupForEnrollments, setSelectedGroupForEnrollments] = useState<any>(null);

  // Fetch programs for dropdown
  const { data: programsData } = useQuery({
    queryKey: ['/api/programs'],
  });

  // Fetch courses for dropdown
  const { data: coursesData } = useQuery({
    queryKey: ['/api/courses'],
  });

  // Fetch academic years for dropdown
  const { data: academicYearsData } = useQuery({
    queryKey: ['/api/academic-years'],
  });

  // Create student group mutation
  const createStudentGroupMutation = useMutation({
    mutationFn: (data: z.infer<typeof studentGroupSchema>) => {
      return apiRequest('/api/student-groups', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Klas aangemaakt",
        description: "De klas is succesvol aangemaakt.",
      });
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij aanmaken",
        description: error?.message || "Er is een fout opgetreden bij het aanmaken van de klas.",
        variant: "destructive",
      });
    },
  });

  // Update student group mutation
  const updateStudentGroupMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest(`/api/student-groups/${data.id}`, 'PUT', data);
    },
    onSuccess: () => {
      toast({
        title: "Klas bijgewerkt",
        description: "De klas is succesvol bijgewerkt.",
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken",
        description: error?.message || "Er is een fout opgetreden bij het bijwerken van de klas.",
        variant: "destructive",
      });
    },
  });

  // Delete student group mutation
  const deleteStudentGroupMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/student-groups/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Klas verwijderd",
        description: "De klas is succesvol verwijderd.",
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error?.message || "Er is een fout opgetreden bij het verwijderen van de klas.",
        variant: "destructive",
      });
    },
  });

  // Form submission handlers
  const onAddSubmit = (data: z.infer<typeof studentGroupSchema>) => {
    createStudentGroupMutation.mutate(data);
  };

  const onEditSubmit = (data: z.infer<typeof studentGroupSchema>) => {
    if (selectedGroup?.id) {
      updateStudentGroupMutation.mutate({
        ...data,
        id: selectedGroup.id
      });
    }
  };

  const handleEditGroup = (group: any) => {
    setSelectedGroup(group);
    form.reset({
      name: group.name,
      academicYear: group.academicYear || new Date().getFullYear().toString(),
      programId: group.programId,
      courseId: group.courseId,
      curriculum: group.curriculum || "",
      instructor: group.instructor || "",
      notes: group.notes || "",
      location: group.location || "",
      startTime: group.startTime || "",
      endTime: group.endTime || "",
      dayOfWeek: group.dayOfWeek || "",
      maxCapacity: group.maxCapacity || 25,
      isActive: group.isActive !== false,
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteGroup = (group: any) => {
    setSelectedGroup(group);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteGroup = () => {
    if (selectedGroup?.id) {
      deleteStudentGroupMutation.mutate(selectedGroup.id);
    }
  };

  const handleManageEnrollments = (group: any) => {
    setSelectedGroupForEnrollments(group);
    setShowManageEnrollments(true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Page header - Professionele desktop stijl (conform Dashboard) */}
      <PremiumHeader 
        title="Klassen" 
        path="Beheer > Klassen" 
        icon={ChalkBoard}
        description="Beheer klasgroepen, bekijk studentenlijsten en wijs docenten toe aan klassen"
      />

      {/* Main content area */}
      <div className="px-6 py-6 flex-1">
        {/* Zoek- en actiebalk - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4 p-4">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            {/* Zoekbalk */}
            <div className="relative w-full md:w-auto flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Zoek klassen..."
                className="pl-9 h-8 text-xs bg-white w-full rounded-sm border-[#e5e7eb]"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            {/* Filters */}
            <div className="flex flex-wrap gap-2 items-center">
              <Select value={academicYear} onValueChange={handleAcademicYearChange}>
                <SelectTrigger className="w-full sm:w-40 h-8 text-xs rounded-sm border-[#e5e7eb]">
                  <SelectValue placeholder="Academisch jaar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle jaren</SelectItem>
                  {academicYearsData?.map((year: any) => (
                    <SelectItem key={year.id} value={year.name}>{year.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={program} onValueChange={handleProgramChange}>
                <SelectTrigger className="w-full sm:w-40 h-8 text-xs rounded-sm border-[#e5e7eb]">
                  <SelectValue placeholder="Programma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle programma's</SelectItem>
                  {programsData?.map((prog: any) => (
                    <SelectItem key={prog.id} value={prog.id.toString()}>{prog.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button
                onClick={() => {
                  form.reset();
                  setIsAddDialogOpen(true);
                }}
                size="sm"
                className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Nieuwe Klas
              </Button>
            </div>
          </div>
        </div>
        
        {/* Cards grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, index) => (
              <Card key={index} className="border border-[#e5e7eb] shadow-none rounded-sm">
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                </CardContent>
                <CardFooter>
                  <Skeleton className="h-8 w-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="text-center py-12 bg-white border border-[#e5e7eb] rounded-sm">
            <XCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Fout bij laden</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Er is een fout opgetreden bij het laden van de klassen. Probeer het later opnieuw.
            </p>
            <Button 
              onClick={() => queryClient.invalidateQueries({queryKey: ['/api/student-groups']})}
              className="mt-4 bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              Opnieuw laden
            </Button>
          </div>
        ) : studentGroups.length === 0 ? (
          <div className="bg-white border border-[#e5e7eb] rounded-sm p-8">
            <ClassEmptyState 
              title="Geen klassen gevonden"
              description="Er zijn nog geen klassen aangemaakt of er zijn geen resultaten die overeenkomen met uw zoekcriteria."
              action={
                <Button
                  onClick={() => {
                    form.reset();
                    setIsAddDialogOpen(true);
                  }}
                  className="bg-[#1e40af] hover:bg-[#1e3a8a]"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nieuwe Klas Aanmaken
                </Button>
              }
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {studentGroups.map((group: any) => (
                <Card key={group.id} className="border border-[#e5e7eb] shadow-none rounded-sm">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-base font-medium">{group.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {group.academicYear || new Date().getFullYear().toString()}
                        </CardDescription>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem 
                            onClick={() => handleManageEnrollments(group)}
                            className="text-xs cursor-pointer"
                          >
                            <Users2 className="mr-2 h-3.5 w-3.5" />
                            Beheer Studenten
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleEditGroup(group)}
                            className="text-xs cursor-pointer"
                          >
                            <Pencil className="mr-2 h-3.5 w-3.5" />
                            Bewerken
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteGroup(group)}
                            className="text-red-600 text-xs cursor-pointer"
                          >
                            <Trash2 className="mr-2 h-3.5 w-3.5" />
                            Verwijderen
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center">
                        <BookOpen className="h-3.5 w-3.5 text-gray-500 mr-2" />
                        <span>
                          {group.programName || "Geen programma"}
                          {group.courseName && ` - ${group.courseName}`}
                        </span>
                      </div>
                      {group.instructor && (
                        <div className="flex items-center">
                          <GraduationCap className="h-3.5 w-3.5 text-gray-500 mr-2" />
                          <span>{group.instructor}</span>
                        </div>
                      )}
                      <div className="flex items-center">
                        <UsersRound className="h-3.5 w-3.5 text-gray-500 mr-2" />
                        <span>{group.studentCount || 0} studenten</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs font-normal">
                        {group.isActive !== false ? "Actief" : "Inactief"}
                      </Badge>
                      {group.dayOfWeek && (
                        <Badge variant="outline" className="text-xs font-normal">
                          {group.dayOfWeek}
                        </Badge>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
            
            {/* Paginering */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
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
                        onClick={() => handlePageChange(Math.min(currentPage + 1, totalPages))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Add Student Group Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Nieuwe Klas Aanmaken</DialogTitle>
            <DialogDescription>
              Vul de details in om een nieuwe klas aan te maken.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onAddSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Naam</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Voer een naam in" 
                          {...field} 
                          className="h-8 text-sm"
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
                      <FormLabel>Academisch Jaar</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Selecteer jaar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYearsData?.map((year: any) => (
                            <SelectItem key={year.id} value={year.name}>{year.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Programma</FormLabel>
                      <Select 
                        value={field.value?.toString() || ""} 
                        onValueChange={(value) => field.onChange(parseInt(value) || undefined)}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Selecteer programma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none_program">Geen programma</SelectItem>
                          {programsData?.map((prog: any) => (
                            <SelectItem key={prog.id} value={prog.id.toString()}>{prog.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="courseId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vak</FormLabel>
                      <Select 
                        value={field.value?.toString() || ""} 
                        onValueChange={(value) => field.onChange(parseInt(value) || undefined)}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Selecteer vak" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none_course">Geen vak</SelectItem>
                          {coursesData?.map((course: any) => (
                            <SelectItem key={course.id} value={course.id.toString()}>{course.name}</SelectItem>
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
                      <FormLabel>Docent</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Docent naam" 
                          {...field} 
                          className="h-8 text-sm"
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
                      <FormLabel>Max. Capaciteit</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1"
                          placeholder="Aantal studenten" 
                          {...field} 
                          value={field.value || ""}
                          onChange={e => field.onChange(parseInt(e.target.value) || undefined)}
                          className="h-8 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Locatie</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Klaslokaal" 
                          {...field} 
                          className="h-8 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dayOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Dag</FormLabel>
                      <Select 
                        value={field.value || ""} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Selecteer dag" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none_day">Geen dag</SelectItem>
                          <SelectItem value="Maandag">Maandag</SelectItem>
                          <SelectItem value="Dinsdag">Dinsdag</SelectItem>
                          <SelectItem value="Woensdag">Woensdag</SelectItem>
                          <SelectItem value="Donderdag">Donderdag</SelectItem>
                          <SelectItem value="Vrijdag">Vrijdag</SelectItem>
                          <SelectItem value="Zaterdag">Zaterdag</SelectItem>
                          <SelectItem value="Zondag">Zondag</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Starttijd</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field} 
                          className="h-8 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Eindtijd</FormLabel>
                      <FormControl>
                        <Input 
                          type="time" 
                          {...field} 
                          className="h-8 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Notities</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Extra informatie over de klas" 
                          {...field} 
                          className="text-sm min-h-[80px]"
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
                    <FormItem className="col-span-2 flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Actieve status</FormLabel>
                        <FormDescription className="text-xs">
                          Geeft aan of deze klas actief is in het huidige academische jaar.
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
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddDialogOpen(false)}
                  className="h-8 text-xs rounded-sm"
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
                >
                  Klas Aanmaken
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Student Group Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Klas Bewerken</DialogTitle>
            <DialogDescription>
              Pas de details van de geselecteerde klas aan.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Naam</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Voer een naam in" 
                          {...field} 
                          className="h-8 text-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Resterende form fields (dezelfde als in de Add dialog) */}
                {/* ... */}
                
                <FormField
                  control={form.control}
                  name="academicYear"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academisch Jaar</FormLabel>
                      <Select 
                        value={field.value} 
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Selecteer jaar" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {academicYearsData?.map((year: any) => (
                            <SelectItem key={year.id} value={year.name}>{year.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="programId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Programma</FormLabel>
                      <Select 
                        value={field.value?.toString() || ""} 
                        onValueChange={(value) => field.onChange(parseInt(value) || undefined)}
                      >
                        <FormControl>
                          <SelectTrigger className="h-8 text-sm">
                            <SelectValue placeholder="Selecteer programma" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none_program">Geen programma</SelectItem>
                          {programsData?.map((prog: any) => (
                            <SelectItem key={prog.id} value={prog.id.toString()}>{prog.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Verkorte versie van de overige velden voor bewerking */}
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="col-span-2 flex flex-row items-center justify-between rounded-lg border p-3">
                      <div className="space-y-0.5">
                        <FormLabel>Actieve status</FormLabel>
                        <FormDescription className="text-xs">
                          Geeft aan of deze klas actief is in het huidige academische jaar.
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
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsEditDialogOpen(false)}
                  className="h-8 text-xs rounded-sm"
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
                >
                  Wijzigingen Opslaan
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Student Group Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[450px]">
          <AlertDialogHeader>
            <AlertDialogTitle>Klas verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je deze klas wilt verwijderen? Alle gegevens gerelateerd aan deze klas, inclusief studenteninschrijvingen, zullen worden verwijderd. Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-8 text-xs rounded-sm">Annuleren</AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmDeleteGroup}
              className="h-8 text-xs rounded-sm bg-red-600 hover:bg-red-700 text-white"
            >
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Manage Enrollments Dialog */}
      {showManageEnrollments && selectedGroupForEnrollments && (
        <Dialog open={showManageEnrollments} onOpenChange={setShowManageEnrollments}>
          <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Studenten Beheren - {selectedGroupForEnrollments.name}</DialogTitle>
              <DialogDescription>
                Voeg studenten toe aan deze klas of verwijder ze.
              </DialogDescription>
            </DialogHeader>
            <ManageStudentEnrollments 
              groupId={selectedGroupForEnrollments.id} 
              onClose={() => setShowManageEnrollments(false)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}