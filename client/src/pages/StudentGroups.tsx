import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, Users, 
  Pencil, MoreVertical, Plus, GraduationCap, BookOpen, UsersRound,
  CalendarIcon, Loader2, 
} from 'lucide-react';
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

  // Fetch student groups with filters
  const { data, isLoading, isError } = useQuery<{
    studentGroups: any[];
    totalCount: number;
    page: number;
    totalPages: number;
  }>({
    queryKey: ['/api/student-groups', { searchTerm, academicYear, program, page: currentPage }],
    staleTime: 30000,
  });

  const studentGroups = data?.studentGroups || [];
  const totalStudentGroups = data?.totalCount || 0;
  const totalPages = Math.ceil(totalStudentGroups / 9); // Assuming 9 groups per page for grid layout

  // Dialoog controls
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Form validation schema
  const studentGroupSchema = z.object({
    name: z.string().min(2, {
      message: "Naam moet minimaal 2 tekens bevatten",
    }),
    academicYear: z.string({
      required_error: "Selecteer een academisch jaar",
    }),
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
  const { data: coursesData } = useQuery<any[]>({
    queryKey: ['/api/courses'],
    staleTime: 300000,
  });

  const courses = coursesData || [];

  // Mutation for creating a new student group
  const createStudentGroupMutation = useMutation({
    mutationFn: async (data: z.infer<typeof studentGroupSchema>) => {
      // Convert dates to ISO strings
      const formattedData = {
        ...data,
        startDate: data.startDate ? data.startDate.toISOString() : undefined,
        endDate: data.endDate ? data.endDate.toISOString() : undefined,
      };
      return await apiRequest('POST', '/api/student-groups', formattedData);
    },
    onSuccess: () => {
      toast({
        title: 'Studentengroep toegevoegd',
        description: 'De studentengroep is succesvol aangemaakt.',
      });
      setIsAddDialogOpen(false);
      form.reset();
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });
    },
    onError: () => {
      toast({
        title: 'Fout bij aanmaken',
        description: 'Er is een fout opgetreden bij het aanmaken van de studentengroep.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for updating a student group
  const updateStudentGroupMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: z.infer<typeof studentGroupSchema> }) => {
      // Convert dates to ISO strings
      const formattedData = {
        ...data,
        startDate: data.startDate ? data.startDate.toISOString() : undefined,
        endDate: data.endDate ? data.endDate.toISOString() : undefined,
      };
      return await apiRequest('PUT', `/api/student-groups/${id}`, formattedData);
    },
    onSuccess: () => {
      toast({
        title: 'Studentengroep bijgewerkt',
        description: 'De studentengroep is succesvol bijgewerkt.',
      });
      setIsEditDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });
    },
    onError: () => {
      toast({
        title: 'Fout bij bijwerken',
        description: 'Er is een fout opgetreden bij het bijwerken van de studentengroep.',
        variant: 'destructive',
      });
    },
  });

  // Mutation for deleting a student group
  const deleteStudentGroupMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest('DELETE', `/api/student-groups/${id}`);
    },
    onSuccess: () => {
      toast({
        title: 'Studentengroep verwijderd',
        description: 'De studentengroep is succesvol verwijderd.',
      });
      setIsDeleteDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['/api/student-groups'] });
    },
    onError: () => {
      toast({
        title: 'Fout bij verwijderen',
        description: 'Er is een fout opgetreden bij het verwijderen van de studentengroep.',
        variant: 'destructive',
      });
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Studentengroepen</h1>
          <p className="text-gray-500 mt-1">
            Beheer studentengroepen, secties en activiteitengroepen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Zoek groepen..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button onClick={handleAddStudentGroup} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Groep Aanmaken</span>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="student-groups-filters bg-white rounded-lg shadow-sm p-4 border border-gray-200 mb-4">
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
                {programs.map(program => (
                  <SelectItem key={program.id} value={program.id.toString()}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <Select defaultValue="all" onValueChange={(value) => {
              // Status filter handler
              setCurrentPage(1);
              // Implementeer statusfiltering in de API of client-side
              toast({
                title: "Status filter aangepast",
                description: `Filter op status: ${value}`,
              });
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

      {/* Student Groups View */}
      <Tabs defaultValue="grid" className="space-y-4">
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger value="grid">Rasterweergave</TabsTrigger>
            <TabsTrigger value="list">Lijstweergave</TabsTrigger>
          </TabsList>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Toon een uitgebreider filtervenster
                const filterSection = document.querySelector('.student-groups-filters');
                if (filterSection) {
                  filterSection.classList.toggle('hidden');
                  
                  toast({
                    title: "Filters bijgewerkt",
                    description: "Gebruik de filtervelden om groepen te zoeken.",
                  });
                }
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filteren
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Download studentengroepen als CSV
                const csvContent = 
                  "data:text/csv;charset=utf-8," + 
                  "ID,Naam,Academisch Jaar,Programma,Capaciteit,Status\n" + 
                  studentGroups.map(g => 
                    `${g.id || ''},${g.name || ''},${g.academicYear || ''},${g.programName || ''},${g.maxCapacity || 0},${g.isActive ? 'Actief' : 'Inactief'}`
                  ).join("\n");
                
                const encodedUri = encodeURI(csvContent);
                const link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", "studentengroepen.csv");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                toast({
                  title: "Exporteren voltooid",
                  description: "Studentengroepen zijn geëxporteerd als CSV bestand.",
                });
              }}
            >
              <Download className="mr-2 h-4 w-4" />
              Exporteren
            </Button>
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
            <div className="text-center py-8 text-red-500">
              Fout bij het laden van studentengroepen. Probeer het later opnieuw.
            </div>
          ) : studentGroups.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Geen Studentengroepen</h3>
              <p className="mt-1 text-sm text-gray-500">
                Begin door een nieuwe studentengroep aan te maken.
              </p>
              <div className="mt-6">
                <Button onClick={handleAddStudentGroup}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Groep Aanmaken
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Example card 1 */}
              <Card>
                <CardHeader>
                  <CardTitle>CS-2024-A</CardTitle>
                  <CardDescription>
                    <Badge className="mr-1 bg-blue-100 text-blue-800 hover:bg-blue-100">Computer Science</Badge>
                    <Badge variant="outline">2024-2025</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex justify-between">
                      <span>Studenten:</span>
                      <span className="font-medium">32</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Docent:</span>
                      <span className="font-medium">Dr. Alan Turing</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cursussen:</span>
                      <span className="font-medium">6</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Studenten</p>
                    <div className="flex -space-x-2">
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>AB</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>CD</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>EF</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-white bg-gray-100 text-xs text-gray-500">
                        +28
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <div className="space-x-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* Example card 2 */}
              <Card>
                <CardHeader>
                  <CardTitle>BUS-2024-B</CardTitle>
                  <CardDescription>
                    <Badge className="mr-1 bg-green-100 text-green-800 hover:bg-green-100">Business</Badge>
                    <Badge variant="outline">2024-2025</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex justify-between">
                      <span>Students:</span>
                      <span className="font-medium">28</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instructor:</span>
                      <span className="font-medium">Prof. Adam Smith</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Courses:</span>
                      <span className="font-medium">5</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Studenten</p>
                    <div className="flex -space-x-2">
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>TJ</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>PK</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>ML</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-white bg-gray-100 text-xs text-gray-500">
                        +25
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <div className="space-x-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>

              {/* Example card 3 */}
              <Card>
                <CardHeader>
                  <CardTitle>ENG-2024-A</CardTitle>
                  <CardDescription>
                    <Badge className="mr-1 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Engineering</Badge>
                    <Badge variant="outline">2024-2025</Badge>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-gray-500 space-y-2">
                    <div className="flex justify-between">
                      <span>Students:</span>
                      <span className="font-medium">24</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Instructor:</span>
                      <span className="font-medium">Dr. Nikola Tesla</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Courses:</span>
                      <span className="font-medium">7</span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="text-xs text-gray-500 mb-1">Studenten</p>
                    <div className="flex -space-x-2">
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>RB</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>ST</AvatarFallback>
                      </Avatar>
                      <Avatar className="h-8 w-8 border-2 border-white">
                        <AvatarFallback>LM</AvatarFallback>
                      </Avatar>
                      <div className="flex items-center justify-center h-8 w-8 rounded-full border-2 border-white bg-gray-100 text-xs text-gray-500">
                        +21
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t pt-4 flex justify-between">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    View
                  </Button>
                  <div className="space-x-1">
                    <Button variant="ghost" size="icon">
                      <Edit className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center space-x-2 mt-8">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: totalPages }).map((_, i) => (
                <Button 
                  key={i}
                  variant={currentPage === i + 1 ? "default" : "outline"} 
                  size="sm"
                  onClick={() => handlePageChange(i + 1)}
                >
                  {i + 1}
                </Button>
              ))}
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {isLoading ? 'Loading...' : `Showing ${studentGroups.length} of ${totalStudentGroups} student groups`}
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Group Name</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Program</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academic Year</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading student groups...
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-red-500">
                        Error loading student groups. Please try again.
                      </td>
                    </tr>
                  ) : studentGroups.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No student groups found with the current filters. Try changing your search or filters.
                      </td>
                    </tr>
                  ) : (
                    <>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">CS-2024-A</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Computer Science</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">2024-2025</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">32 students</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Dr. Alan Turing</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">Bekijken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">BUS-2024-B</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Business</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">2024-2025</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">28 students</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Prof. Adam Smith</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">Bekijken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">ENG-2024-A</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">Engineering</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">2024-2025</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">24 students</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Dr. Nikola Tesla</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">Bekijken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Trash2 className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Delete</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Student Group toevoegen/bewerken dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {isEditDialogOpen ? "Studentengroep bewerken" : "Nieuwe studentengroep aanmaken"}
            </DialogTitle>
            <DialogDescription>
              Vul de onderstaande gegevens in om een {isEditDialogOpen ? "bestaande" : "nieuwe"} studentengroep {isEditDialogOpen ? "bij te werken" : "aan te maken"}.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Naam *</FormLabel>
                      <FormControl>
                        <Input placeholder="Voer groepsnaam in" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="academicYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Academisch jaar *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer jaar" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="2023-2024">2023-2024</SelectItem>
                            <SelectItem value="2024-2025">2024-2025</SelectItem>
                            <SelectItem value="2025-2026">2025-2026</SelectItem>
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
                        <FormLabel>Maximale capaciteit</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={1}
                            placeholder="30"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="programId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Programma</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer programma" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {programs.map((program) => (
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
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cursus</FormLabel>
                        <Select
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          value={field.value?.toString()}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecteer cursus" />
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
                </div>

                <div className="grid grid-cols-2 gap-4">
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

                <FormField
                  control={form.control}
                  name="instructor"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Docent</FormLabel>
                      <FormControl>
                        <Input placeholder="Naam van docent" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Beschrijving</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Beschrijving van de studentengroep"
                          className="min-h-[80px]"
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
                        <FormLabel>Status</FormLabel>
                        <FormDescription>
                          Is deze studentengroep actief?
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
                  onClick={() => {
                    setIsAddDialogOpen(false);
                    setIsEditDialogOpen(false);
                  }}
                >
                  Annuleren
                </Button>
                <Button 
                  type="submit" 
                  disabled={
                    createStudentGroupMutation.isPending || 
                    updateStudentGroupMutation.isPending
                  }
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
            <AlertDialogTitle>Studentengroep verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet je zeker dat je de studentengroep "{selectedGroup?.name}" wilt verwijderen?
              Deze actie kan niet ongedaan worden gemaakt.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedGroup) {
                  deleteStudentGroupMutation.mutate(selectedGroup.id);
                }
              }}
              className="bg-red-600 text-white hover:bg-red-700"
              disabled={deleteStudentGroupMutation.isPending}
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