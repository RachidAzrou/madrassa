import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, Check, X, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';

// ActionButtons Component voor de consistency in enrollment-lijsten
function EnrollmentActionButtons({ id }: { id: string }) {
  const { toast } = useToast();
  
  // Mutatie om een inschrijving te verwijderen
  const deleteEnrollmentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/enrollments/${id}`);
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      
      // Toon succes melding
      toast({
        title: "Inschrijving verwijderd",
        description: "De inschrijving is succesvol verwijderd uit het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de inschrijving.",
        variant: "destructive",
      });
    }
  });
  
  const handleViewEnrollment = (id: string) => {
    console.log(`Viewing enrollment with ID: ${id}`);
    toast({
      title: "Inschrijving details",
      description: `Details bekijken voor inschrijving met ID: ${id}`,
      variant: "default",
    });
  };
  
  const handleEditEnrollment = (id: string) => {
    console.log(`Editing enrollment with ID: ${id}`);
    toast({
      title: "Inschrijving bewerken",
      description: `Bewerkingsformulier laden voor inschrijving met ID: ${id}`,
      variant: "default",
    });
  };
  
  const handleDeleteEnrollment = (id: string) => {
    console.log(`Deleting enrollment with ID: ${id}`);
    
    if (confirm(`Weet je zeker dat je de inschrijving met ID: ${id} wilt verwijderen?`)) {
      deleteEnrollmentMutation.mutate(id);
    }
  };

  return (
    <div className="flex justify-end space-x-2">
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => handleViewEnrollment(id)}
      >
        <Eye className="h-4 w-4 text-gray-500" />
        <span className="sr-only">Bekijken</span>
      </Button>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => handleEditEnrollment(id)}
      >
        <Edit className="h-4 w-4 text-blue-500" />
        <span className="sr-only">Bewerken</span>
      </Button>
      <Button 
        variant="ghost" 
        size="icon"
        onClick={() => handleDeleteEnrollment(id)}
      >
        <Trash2 className="h-4 w-4 text-red-500" />
        <span className="sr-only">Verwijderen</span>
      </Button>
    </div>
  );
}

export default function Enrollments() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [program, setProgram] = useState('all');
  const [course, setCourse] = useState('all');
  const [status, setStatus] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('student-enrollments');
  
  // State voor inschrijving dialoog
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [enrollmentFormData, setEnrollmentFormData] = useState({
    studentId: null as number | null,
    courseId: null as number | null,
    status: 'Active' as string,
    enrollmentDate: new Date().toISOString().slice(0, 10),
  });

  // Fetch enrollments with filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/enrollments', { searchTerm, program, course, status, page: currentPage, type: activeTab }],
    staleTime: 30000,
  });

  // Fetch programs for filter
  const { data: programsData } = useQuery({
    queryKey: ['/api/programs'],
  });

  // Fetch courses for filter
  const { data: coursesData } = useQuery({
    queryKey: ['/api/courses'],
  });

  const enrollments = data?.enrollments || [];
  const totalEnrollments = data?.totalCount || 0;
  const totalPages = Math.ceil(totalEnrollments / 10);
  
  const programs = programsData?.programs || [];
  const courses = coursesData?.courses || [];

  // Mutatie om een inschrijving toe te voegen
  const createEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentData: typeof enrollmentFormData) => {
      return apiRequest('POST', '/api/enrollments', enrollmentData);
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/enrollments'] });
      
      // Reset form and close dialog
      setEnrollmentFormData({
        studentId: null,
        courseId: null,
        status: 'Active',
        enrollmentDate: new Date().toISOString().slice(0, 10),
      });
      setIsAddDialogOpen(false);
      
      // Toon succes melding
      toast({
        title: "Inschrijving toegevoegd",
        description: "De inschrijving is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de inschrijving.",
        variant: "destructive",
      });
    }
  });

  const handleAddEnrollment = () => {
    // Open het toevoeg-dialoogvenster
    setIsAddDialogOpen(true);
  };
  
  const handleSubmitEnrollment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!enrollmentFormData.studentId || !enrollmentFormData.courseId) {
      toast({
        title: "Onvolledige gegevens",
        description: "Selecteer een student en een cursus om de inschrijving te voltooien.",
        variant: "destructive",
      });
      return;
    }
    
    createEnrollmentMutation.mutate(enrollmentFormData);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  const handleProgramChange = (value: string) => {
    setProgram(value);
    setCurrentPage(1);
  };

  const handleCourseChange = (value: string) => {
    setCourse(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Actief</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In Behandeling</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Voltooid</Badge>;
      case 'withdrawn':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Teruggetrokken</Badge>;
      case 'on_hold':
        return <Badge className="bg-gray-100 text-gray-800 border-gray-200">In Wacht</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Inschrijvingenbeheer</h1>
          <p className="text-gray-500 mt-1">
            Beheer inschrijvingen voor programma's en cursussen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Input
              placeholder="Zoek inschrijvingen..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button onClick={handleAddEnrollment} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Nieuwe Inschrijving</span>
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-500">Totaal Inschrijvingen</p>
              <div className="mt-1 flex items-baseline">
                <p className="text-2xl font-semibold">1.248</p>
                <p className="ml-2 text-sm text-green-600">+5,4%</p>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">Vergeleken met vorig semester</p>
                <Progress value={65} className="h-1 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-500">Actieve Inschrijvingen</p>
              <div className="mt-1 flex items-baseline">
                <p className="text-2xl font-semibold">865</p>
                <p className="ml-2 text-sm text-green-600">+3,2%</p>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">69% van totale inschrijvingen</p>
                <Progress value={69} className="h-1 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-500">Programma's met Inschrijvingen</p>
              <div className="mt-1 flex items-baseline">
                <p className="text-2xl font-semibold">12</p>
                <p className="ml-2 text-sm text-gray-600">van 15</p>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">80% dekking</p>
                <Progress value={80} className="h-1 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col">
              <p className="text-sm font-medium text-gray-500">Gemiddeld Aantal Cursussen per Student</p>
              <div className="mt-1 flex items-baseline">
                <p className="text-2xl font-semibold">4,2</p>
                <p className="ml-2 text-sm text-red-600">-0,3</p>
              </div>
              <div className="mt-4">
                <p className="text-xs text-gray-500">Vergeleken met vorig semester</p>
                <Progress value={84} className="h-1 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="student-enrollments">Studentinschrijvingen</TabsTrigger>
          <TabsTrigger value="course-enrollments">Cursusinschrijvingen</TabsTrigger>
          <TabsTrigger value="program-enrollments">Programma-inschrijvingen</TabsTrigger>
        </TabsList>
        
        <TabsContent value="student-enrollments" className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programma</label>
                <Select value={program} onValueChange={handleProgramChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Programma's" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Programma's</SelectItem>
                    <SelectItem value="cs">Informatica</SelectItem>
                    <SelectItem value="bus">Bedrijfskunde</SelectItem>
                    <SelectItem value="eng">Techniek</SelectItem>
                    <SelectItem value="arts">Kunsten</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cursus</label>
                <Select value={course} onValueChange={handleCourseChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Cursussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Cursussen</SelectItem>
                    <SelectItem value="cs101">CS101: Inleiding Programmeren</SelectItem>
                    <SelectItem value="cs201">CS201: Datastructuren</SelectItem>
                    <SelectItem value="bus101">BUS101: Bedrijfskunde Basis</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Statussen</SelectItem>
                    <SelectItem value="active">Actief</SelectItem>
                    <SelectItem value="pending">In Behandeling</SelectItem>
                    <SelectItem value="completed">Voltooid</SelectItem>
                    <SelectItem value="withdrawn">Teruggetrokken</SelectItem>
                    <SelectItem value="on_hold">In Wacht</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Student Enrollments Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {isLoading ? 'Laden...' : `Toont ${enrollments.length} van ${totalEnrollments} inschrijvingen`}
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filteren
                </Button>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Exporteren
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                        />
                        Student
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Programma/Cursus
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Inschrijvingsdatum
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <div className="flex items-center">
                        Status
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acties
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Inschrijvingen laden...
                      </td>
                    </tr>
                  ) : isError ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-red-500">
                        Fout bij het laden van inschrijvingen. Probeer het opnieuw.
                      </td>
                    </tr>
                  ) : enrollments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Geen inschrijvingen gevonden met de huidige filters. Probeer je zoekopdracht of filters aan te passen.
                      </td>
                    </tr>
                  ) : (
                    <>
                      {/* Student 1 Enrollment */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                            />
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>JS</AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">Jan Smit</div>
                                <div className="text-sm text-gray-500">STU000452</div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">Informatica</div>
                          <div className="text-sm text-gray-500">Jaar 2 - Semester 1</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">1 sept 2023</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge('Active')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <EnrollmentActionButtons id="ENR001" />
                        </td>
                      </tr>
                      
                      {/* Student 2 Enrollment */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                            />
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>LV</AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">Lisa de Vries</div>
                                <div className="text-sm text-gray-500">STU000389</div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">Bedrijfskunde</div>
                          <div className="text-sm text-gray-500">Jaar 1 - Semester 2</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">15 jan 2024</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge('Pending')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <EnrollmentActionButtons id="ENR002" />
                        </td>
                      </tr>
                      
                      {/* Student 3 Enrollment */}
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                            />
                            <div className="flex items-center">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>MB</AvatarFallback>
                              </Avatar>
                              <div className="ml-4">
                                <div className="font-medium text-gray-900">Martijn Bakker</div>
                                <div className="text-sm text-gray-500">STU000517</div>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">Techniek</div>
                          <div className="text-sm text-gray-500">Jaar 3 - Semester 1</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">5 sept 2022</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge('Completed')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <EnrollmentActionButtons id="ENR003" />
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* Pagination */}
            <div className="px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === 1}
                  onClick={() => handlePageChange(currentPage - 1)}
                >
                  Vorige
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  disabled={currentPage === totalPages}
                  onClick={() => handlePageChange(currentPage + 1)}
                >
                  Volgende
                </Button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Pagina <span className="font-medium">{currentPage}</span> van{' '}
                    <span className="font-medium">{totalPages}</span>
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-l-md"
                      disabled={currentPage === 1}
                      onClick={() => handlePageChange(currentPage - 1)}
                    >
                      Vorige
                    </Button>
                    {/* Page numbers would go here */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="rounded-r-md"
                      disabled={currentPage === totalPages}
                      onClick={() => handlePageChange(currentPage + 1)}
                    >
                      Volgende
                    </Button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="course-enrollments">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-lg font-medium text-gray-700">Cursusinschrijvingen</h3>
            <p className="mt-2 text-gray-500">Hier kunnen cursusinschrijvingen per semester en afdeling worden getoond en beheerd.</p>
          </div>
        </TabsContent>
        
        <TabsContent value="program-enrollments">
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <h3 className="text-lg font-medium text-gray-700">Programma-inschrijvingen</h3>
            <p className="mt-2 text-gray-500">Hier kunnen programma-inschrijvingen per academisch jaar worden getoond en beheerd.</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add Enrollment Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nieuwe Inschrijving Toevoegen</DialogTitle>
            <DialogDescription>
              Vul de inschrijvingsinformatie in om een nieuwe inschrijving aan te maken.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitEnrollment}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="studentId" className="text-right">
                    Student
                  </Label>
                  <Select
                    value={enrollmentFormData.studentId?.toString() || ''}
                    onValueChange={(value) => setEnrollmentFormData({ 
                      ...enrollmentFormData, 
                      studentId: value ? parseInt(value) : null 
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer student" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* We tonen een hardcodeerde lijst omdat de echte lijst via de API op dit moment niet beschikbaar is */}
                      <SelectItem value="1">S1001 - Jan de Vries</SelectItem>
                      <SelectItem value="2">S1002 - Emma Bakker</SelectItem>
                      <SelectItem value="3">S1003 - Noah van Dijk</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="courseId" className="text-right">
                    Cursus
                  </Label>
                  <Select
                    value={enrollmentFormData.courseId?.toString() || ''}
                    onValueChange={(value) => setEnrollmentFormData({ 
                      ...enrollmentFormData, 
                      courseId: value ? parseInt(value) : null 
                    })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer cursus" />
                    </SelectTrigger>
                    <SelectContent>
                      {/* We tonen een hardcodeerde lijst omdat de echte lijst via de API op dit moment niet beschikbaar is */}
                      <SelectItem value="1">CS101 - Introductie Programmeren</SelectItem>
                      <SelectItem value="2">CS202 - Datastructuren en Algoritmen</SelectItem>
                      <SelectItem value="3">MATH110 - Lineaire Algebra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={enrollmentFormData.status}
                    onValueChange={(value) => setEnrollmentFormData({ ...enrollmentFormData, status: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Actief</SelectItem>
                      <SelectItem value="Pending">In afwachting</SelectItem>
                      <SelectItem value="Withdrawn">Teruggetrokken</SelectItem>
                      <SelectItem value="Completed">Voltooid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="enrollmentDate" className="text-right">
                    Inschrijvingsdatum
                  </Label>
                  <Input
                    id="enrollmentDate"
                    type="date"
                    value={enrollmentFormData.enrollmentDate}
                    onChange={(e) => setEnrollmentFormData({ ...enrollmentFormData, enrollmentDate: e.target.value })}
                    className="mt-1"
                  />
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
                disabled={createEnrollmentMutation.isPending}
              >
                {createEnrollmentMutation.isPending ? 'Bezig met toevoegen...' : 'Inschrijving toevoegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}