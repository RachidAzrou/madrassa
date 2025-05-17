import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, FileText, Clock, School, User, Phone, Mail, Calendar, BookOpen, Building, Clipboard, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  programId: number;
  programName: string;
  academicYearId: number;
  academicYear: string;
  previousEducation: string;
  personalStatement: string;
  status: string;
  applicationDate: string;
}

interface Program {
  id: string;
  name: string;
  code: string;
}

interface AcademicYear {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface AdmissionStats {
  totalApplications: number;
  pendingReview: number;
  approved: number;
  rejected: number;
  withdrawals: number;
  conversionRate: number;
  enrollmentRate: number;
}

export default function Admissions() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [program, setProgram] = useState('all');
  const [status, setStatus] = useState('all');
  const [academicYear, setAcademicYear] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('applications');
  
  // State voor dialoogvensters
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentApplicant, setCurrentApplicant] = useState<Applicant | null>(null);
  const [currentTabIndex, setCurrentTabIndex] = useState(0);
  
  // State voor aanvraagformulier
  const [applicationFormData, setApplicationFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: new Date().toISOString().split('T')[0],
    programId: null as number | null,
    academicYearId: null as number | null,
    previousEducation: '',
    personalStatement: '',
    status: 'Pending' as string,
  });

  // Fetch applicants with filters
  const { data, isLoading, isError } = useQuery<{ applicants: Applicant[], totalCount: number }>({
    queryKey: ['/api/admissions/applicants', { searchTerm, program, status, academicYear, page: currentPage }],
    staleTime: 30000,
  });

  // Fetch programs for filter
  const { data: programsData } = useQuery<{ programs: Program[] }>({
    queryKey: ['/api/programs'],
  });

  // Fetch academic years for filter
  const { data: academicYearsData } = useQuery<{ academicYears: AcademicYear[] }>({
    queryKey: ['/api/academic-years'],
  });

  // Fetch admission stats
  const { data: statsData } = useQuery<{ stats: AdmissionStats }>({
    queryKey: ['/api/admissions/stats'],
  });

  const applicants = data?.applicants || [];
  const totalApplicants = data?.totalCount || 0;
  const totalPages = Math.ceil(totalApplicants / 10); // Assuming 10 applicants per page
  const programs = programsData?.programs || [];
  const academicYears = academicYearsData?.academicYears || [];
  const stats = statsData?.stats || {
    totalApplications: 0,
    pendingReview: 0,
    approved: 0,
    rejected: 0,
    enrollmentRate: 0,
  };

  // Mutaties voor CRUD operaties
  const createApplicationMutation = useMutation({
    mutationFn: async (applicationData: typeof applicationFormData) => {
      return apiRequest('POST', '/api/admissions/applications', applicationData);
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/applicants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/stats'] });
      
      // Reset form and close dialog
      setApplicationFormData({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: new Date().toISOString().split('T')[0],
        programId: null,
        academicYearId: null,
        previousEducation: '',
        personalStatement: '',
        status: 'Pending',
      });
      setIsAddDialogOpen(false);
      
      // Toon succesmelding
      toast({
        title: "Aanvraag toegevoegd",
        description: "De toelatingsaanvraag is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de aanvraag.",
        variant: "destructive",
      });
    }
  });
  
  const updateApplicationMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string, data: Partial<typeof applicationFormData> }) => {
      return apiRequest('PATCH', `/api/admissions/applications/${id}`, data);
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/applicants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/stats'] });
      
      // Close dialog
      setIsEditDialogOpen(false);
      
      // Toon succesmelding
      toast({
        title: "Aanvraag bijgewerkt",
        description: "De toelatingsaanvraag is succesvol bijgewerkt in het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bewerken",
        description: error.message || "Er is een fout opgetreden bij het bewerken van de aanvraag.",
        variant: "destructive",
      });
    }
  });
  
  const deleteApplicationMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admissions/applications/${id}`);
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/applicants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/stats'] });
      
      // Close dialog
      setIsDeleteDialogOpen(false);
      
      // Toon succesmelding
      toast({
        title: "Aanvraag verwijderd",
        description: "De toelatingsaanvraag is succesvol verwijderd uit het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de aanvraag.",
        variant: "destructive",
      });
    }
  });

  // Handler functies voor CRUD operaties
  const handleAddApplicant = () => {
    // Reset form en open dialoogvenster
    setApplicationFormData({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: new Date().toISOString().split('T')[0],
      programId: null,
      academicYearId: null,
      previousEducation: '',
      personalStatement: '',
      status: 'Pending',
    });
    setCurrentTabIndex(0);
    setIsAddDialogOpen(true);
  };
  
  const handleViewApplicant = (applicant: Applicant) => {
    setCurrentApplicant(applicant);
    setCurrentTabIndex(0);
    setIsViewDialogOpen(true);
  };
  
  const handleEditApplicant = (applicant: Applicant) => {
    setCurrentApplicant(applicant);
    setApplicationFormData({
      firstName: applicant.firstName,
      lastName: applicant.lastName,
      email: applicant.email,
      phone: applicant.phone,
      dateOfBirth: applicant.dateOfBirth,
      programId: applicant.programId,
      academicYearId: applicant.academicYearId,
      previousEducation: applicant.previousEducation || '',
      personalStatement: applicant.personalStatement || '',
      status: applicant.status,
    });
    setCurrentTabIndex(0);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteApplicant = (applicant: Applicant) => {
    setCurrentApplicant(applicant);
    setIsDeleteDialogOpen(true);
  };
  
  const handleSubmitApplication = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationFormData.firstName || !applicationFormData.lastName || !applicationFormData.email) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle verplichte velden in om de aanvraag toe te voegen.",
        variant: "destructive",
      });
      return;
    }
    
    createApplicationMutation.mutate(applicationFormData);
  };
  
  const handleUpdateApplication = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!applicationFormData.firstName || !applicationFormData.lastName || !applicationFormData.email) {
      toast({
        title: "Onvolledige gegevens",
        description: "Vul alle verplichte velden in om de aanvraag bij te werken.",
        variant: "destructive",
      });
      return;
    }
    
    if (currentApplicant?.id) {
      updateApplicationMutation.mutate({ 
        id: currentApplicant.id, 
        data: applicationFormData 
      });
    }
  };
  
  const handleConfirmDelete = () => {
    if (currentApplicant?.id) {
      deleteApplicationMutation.mutate(currentApplicant.id);
    }
  };
  
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return format(date, 'dd MMMM yyyy', { locale: nl });
    } catch (error) {
      return dateString;
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

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setCurrentPage(1);
  };

  const handleAcademicYearChange = (value: string) => {
    setAcademicYear(value);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const getStatusBadge = (status: string) => {
    switch(status.toLowerCase()) {
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">In afwachting</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Goedgekeurd</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 border-red-200">Afgewezen</Badge>;
      case 'enrolled':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Ingeschreven</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <FileText className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Aanmeldingen</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Beoordeel en verwerk studentaanmeldingen en toelatingen
          </p>
        </div>
      </div>
      
      {/* Dashboard Stats - met dezelfde stijl als in Dashboard.tsx */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <FileText className="h-20 w-20 text-sky-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Totaal Aanmeldingen</h3>
          <p className="text-2xl font-bold text-sky-700">{stats.totalApplications}</p>

        </div>
        
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <Clock className="h-20 w-20 text-sky-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Wachtend op Beoordeling</h3>
          <p className="text-2xl font-bold text-sky-700">{stats.pendingReview}</p>

        </div>
        
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <CheckCircle className="h-20 w-20 text-sky-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Goedgekeurd</h3>
          <p className="text-2xl font-bold text-sky-700">{stats.approved}</p>

        </div>
        
        <div className="bg-gradient-to-br from-sky-50 to-sky-100 rounded-xl shadow-md border border-sky-200 p-5 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <School className="h-20 w-20 text-sky-500" />
          </div>
          <h3 className="text-sm font-medium text-gray-600 mb-1">Inschrijvingsgraad</h3>
          <p className="text-2xl font-bold text-sky-700">{stats.enrollmentRate}%</p>
          <div className="mt-2">
            <Progress value={stats.enrollmentRate} className="h-1.5" />
          </div>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="p-1 bg-blue-900/10">
              <TabsTrigger value="applications" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">Aanmeldingen</TabsTrigger>
              <TabsTrigger value="admission-programs" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">Toelatingsprogramma's</TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">Instellingen</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Button 
            onClick={handleAddApplicant} 
            variant="default" 
            size="default" 
            className="bg-primary hover:bg-primary/90 md:w-auto"
          >
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Nieuwe Aanmelding</span>
          </Button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        
        <TabsContent value="applications" className="space-y-4">
          {/* Filters */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Zoeken</label>
                <div className="relative">
                  <Input
                    placeholder="Zoek aanmeldingen..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Programma</label>
                <Select value={program} onValueChange={handleProgramChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Programma's" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Programma's</SelectItem>
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
                <Select value={status} onValueChange={handleStatusChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle Statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Statussen</SelectItem>
                    <SelectItem value="pending">In afwachting</SelectItem>
                    <SelectItem value="approved">Goedgekeurd</SelectItem>
                    <SelectItem value="rejected">Afgewezen</SelectItem>
                    <SelectItem value="enrolled">Ingeschreven</SelectItem>
                  </SelectContent>
                </Select>
              </div>
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
            </div>
          </div>

          {/* Applicant List Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {isLoading ? 'Laden...' : `Tonen van ${applicants.length} van ${totalApplicants} aanmeldingen`}
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
                        Aanmelder
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programma</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aanmelddatum</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Aanmelders laden...
                      </td>
                    </tr>
                  ) : applicants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Geen aanmelders gevonden
                      </td>
                    </tr>
                  ) : (
                    applicants.map((applicant) => (
                      <tr key={applicant.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {applicant.firstName} {applicant.lastName}
                              </div>
                              <div className="text-sm text-gray-500">
                                {new Date().getFullYear() - new Date(applicant.dateOfBirth).getFullYear()} jaar
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{applicant.programName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(applicant.applicationDate)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(applicant.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button 
                            className="text-blue-600 hover:text-blue-900 mr-3"
                            onClick={() => handleViewApplicant(applicant)}
                            title="Bekijken"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-green-600 hover:text-green-900 mr-3"
                            onClick={() => handleEditApplicant(applicant)}
                            title="Bewerken"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteApplicant(applicant)}
                            title="Verwijderen"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="bg-white border-t border-gray-200 px-4 py-3 flex items-center justify-between">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Vorige
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  Volgende
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <span className="font-medium">{currentPage}</span> van <span className="font-medium">{totalPages}</span> pagina's
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Vorige</span>
                      &laquo;
                    </button>
                    {/* Generate page buttons */}
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const pageNumber = currentPage <= 3 
                        ? i + 1 
                        : currentPage >= totalPages - 2 
                          ? totalPages - 4 + i 
                          : currentPage - 2 + i;
                      
                      if (pageNumber > 0 && pageNumber <= totalPages) {
                        return (
                          <button
                            key={pageNumber}
                            onClick={() => handlePageChange(pageNumber)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium
                            ${pageNumber === currentPage
                              ? 'z-10 bg-primary text-white border-primary'
                              : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      }
                      return null;
                    })}
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
                    >
                      <span className="sr-only">Volgende</span>
                      &raquo;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="admission-programs" className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500">Toelatingsprogramma's configuratie</p>
          </div>
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <p className="text-gray-500">Toelatingsproces instellingen</p>
          </div>
        </TabsContent>
      </Tabs>
    
      {/* Dialoogvenster voor het bekijken van een aanmelding */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Aanmeldingsdetails
              {currentApplicant && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {currentApplicant.firstName} {currentApplicant.lastName}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Bekijk alle details van de aanmelding
            </DialogDescription>
          </DialogHeader>
          
          {currentApplicant && (
            <ScrollArea className="flex-1 px-1">
              <Tabs value={String(currentTabIndex)} onValueChange={(value) => setCurrentTabIndex(Number(value))}>
                <TabsList className="mb-4 p-1 bg-blue-900/10">
                  <TabsTrigger value="0" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <User className="w-4 h-4 mr-2" />
                    Persoonlijk
                  </TabsTrigger>
                  <TabsTrigger value="1" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="2" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Programma
                  </TabsTrigger>
                  <TabsTrigger value="3" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <Clipboard className="w-4 h-4 mr-2" />
                    Motivatie
                  </TabsTrigger>
                  <TabsTrigger value="4" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <Info className="w-4 h-4 mr-2" />
                    Status
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="0" className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="view-firstName" className="text-gray-700">Voornaam</Label>
                      <div id="view-firstName" className="mt-1 p-2 border rounded-md bg-gray-50">{currentApplicant.firstName}</div>
                    </div>
                    <div>
                      <Label htmlFor="view-lastName" className="text-gray-700">Achternaam</Label>
                      <div id="view-lastName" className="mt-1 p-2 border rounded-md bg-gray-50">{currentApplicant.lastName}</div>
                    </div>
                    <div>
                      <Label htmlFor="view-dateOfBirth" className="text-gray-700">Geboortedatum</Label>
                      <div id="view-dateOfBirth" className="mt-1 p-2 border rounded-md bg-gray-50">{formatDate(currentApplicant.dateOfBirth)}</div>
                    </div>
                    <div>
                      <Label htmlFor="view-applicationDate" className="text-gray-700">Aanmeldingsdatum</Label>
                      <div id="view-applicationDate" className="mt-1 p-2 border rounded-md bg-gray-50">{formatDate(currentApplicant.applicationDate)}</div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="1" className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="view-email" className="text-gray-700">E-mailadres</Label>
                      <div id="view-email" className="mt-1 p-2 border rounded-md bg-gray-50">{currentApplicant.email}</div>
                    </div>
                    <div>
                      <Label htmlFor="view-phone" className="text-gray-700">Telefoonnummer</Label>
                      <div id="view-phone" className="mt-1 p-2 border rounded-md bg-gray-50">{currentApplicant.phone}</div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="2" className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="view-program" className="text-gray-700">Programma</Label>
                      <div id="view-program" className="mt-1 p-2 border rounded-md bg-gray-50">{currentApplicant.programName}</div>
                    </div>
                    <div>
                      <Label htmlFor="view-academicYear" className="text-gray-700">Academisch Jaar</Label>
                      <div id="view-academicYear" className="mt-1 p-2 border rounded-md bg-gray-50">{currentApplicant.academicYear}</div>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="view-previousEducation" className="text-gray-700">Eerdere Opleiding</Label>
                      <div id="view-previousEducation" className="mt-1 p-2 border rounded-md bg-gray-50 min-h-[100px]">
                        {currentApplicant.previousEducation || "Geen informatie beschikbaar"}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="3" className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="view-personalStatement" className="text-gray-700">Persoonlijke Motivatie</Label>
                    <div id="view-personalStatement" className="mt-1 p-2 border rounded-md bg-gray-50 min-h-[200px]">
                      {currentApplicant.personalStatement || "Geen informatie beschikbaar"}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="4" className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="view-status" className="text-gray-700">Huidige Status</Label>
                    <div id="view-status" className="mt-1 p-2 border rounded-md bg-gray-50">
                      {getStatusBadge(currentApplicant.status)}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
          )}
          
          <DialogFooter className="mt-6 gap-2">
            <Button onClick={() => setIsViewDialogOpen(false)} variant="outline">
              Sluiten
            </Button>
            {currentApplicant && (
              <Button onClick={() => {
                setIsViewDialogOpen(false);
                handleEditApplicant(currentApplicant);
              }}>
                <Edit className="w-4 h-4 mr-2" />
                Bewerken
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Dialoogvenster voor het toevoegen/bewerken van een aanmelding */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">Nieuwe Aanmelding</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe aanmelding toe aan het systeem
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmitApplication} className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 px-1">
              <Tabs value={String(currentTabIndex)} onValueChange={(value) => setCurrentTabIndex(Number(value))}>
                <TabsList className="mb-4 p-1 bg-blue-900/10">
                  <TabsTrigger value="0" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <User className="w-4 h-4 mr-2" />
                    Persoonlijk
                  </TabsTrigger>
                  <TabsTrigger value="1" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="2" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Programma
                  </TabsTrigger>
                  <TabsTrigger value="3" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <Clipboard className="w-4 h-4 mr-2" />
                    Motivatie
                  </TabsTrigger>
                  <TabsTrigger value="4" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <Info className="w-4 h-4 mr-2" />
                    Status
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="0" className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-gray-700">
                        Voornaam <span className="text-[#3b5998]">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={applicationFormData.firstName}
                        onChange={(e) => setApplicationFormData({ ...applicationFormData, firstName: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-gray-700">
                        Achternaam <span className="text-[#3b5998]">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        value={applicationFormData.lastName}
                        onChange={(e) => setApplicationFormData({ ...applicationFormData, lastName: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-gray-700">Geboortedatum</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={applicationFormData.dateOfBirth}
                        onChange={(e) => setApplicationFormData({ ...applicationFormData, dateOfBirth: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="1" className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-gray-700">
                        E-mailadres <span className="text-[#3b5998]">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={applicationFormData.email}
                        onChange={(e) => setApplicationFormData({ ...applicationFormData, email: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-gray-700">Telefoonnummer</Label>
                      <Input
                        id="phone"
                        value={applicationFormData.phone}
                        onChange={(e) => setApplicationFormData({ ...applicationFormData, phone: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="2" className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="programId" className="text-gray-700">Programma</Label>
                      <Select
                        value={applicationFormData.programId?.toString() || ""}
                        onValueChange={(value) => setApplicationFormData({ ...applicationFormData, programId: Number(value) })}
                      >
                        <SelectTrigger id="programId" className="mt-1">
                          <SelectValue placeholder="Selecteer een programma" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((program) => (
                            <SelectItem key={program.id} value={program.id.toString()}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="academicYearId" className="text-gray-700">Academisch Jaar</Label>
                      <Select
                        value={applicationFormData.academicYearId?.toString() || ""}
                        onValueChange={(value) => setApplicationFormData({ ...applicationFormData, academicYearId: Number(value) })}
                      >
                        <SelectTrigger id="academicYearId" className="mt-1">
                          <SelectValue placeholder="Selecteer een academisch jaar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">2025-2026</SelectItem>
                          <SelectItem value="2">2024-2025</SelectItem>
                          <SelectItem value="3">2023-2024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="previousEducation" className="text-gray-700">Eerdere Opleiding</Label>
                      <Textarea
                        id="previousEducation"
                        value={applicationFormData.previousEducation}
                        onChange={(e) => setApplicationFormData({ ...applicationFormData, previousEducation: e.target.value })}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="3" className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="personalStatement" className="text-gray-700">Persoonlijke Motivatie</Label>
                    <Textarea
                      id="personalStatement"
                      value={applicationFormData.personalStatement}
                      onChange={(e) => setApplicationFormData({ ...applicationFormData, personalStatement: e.target.value })}
                      className="mt-1 min-h-[200px]"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="4" className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="status" className="text-gray-700">Status</Label>
                    <RadioGroup
                      value={applicationFormData.status}
                      onValueChange={(value) => setApplicationFormData({ ...applicationFormData, status: value })}
                      className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Pending" id="status-pending" />
                        <Label htmlFor="status-pending" className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                          In afwachting
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Approved" id="status-approved" />
                        <Label htmlFor="status-approved" className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Goedgekeurd
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Rejected" id="status-rejected" />
                        <Label htmlFor="status-rejected" className="flex items-center">
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          Afgewezen
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Enrolled" id="status-enrolled" />
                        <Label htmlFor="status-enrolled" className="flex items-center">
                          <School className="h-4 w-4 mr-2 text-blue-600" />
                          Ingeschreven
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
            
            <DialogFooter className="mt-6 gap-2">
              <Button type="button" onClick={() => setIsAddDialogOpen(false)} variant="outline">
                Annuleren
              </Button>
              <Button type="submit" disabled={createApplicationMutation.isPending}>
                {createApplicationMutation.isPending ? "Bezig met toevoegen..." : "Aanmelding toevoegen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Dialoogvenster voor het bewerken van een aanmelding */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="w-[95vw] max-w-[95vw] max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl">
              Aanmelding Bewerken
              {currentApplicant && (
                <span className="ml-2 text-sm font-normal text-gray-500">
                  {currentApplicant.firstName} {currentApplicant.lastName}
                </span>
              )}
            </DialogTitle>
            <DialogDescription>
              Wijzig de gegevens van de aanmelding
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleUpdateApplication} className="flex-1 flex flex-col">
            <ScrollArea className="flex-1 px-1">
              <Tabs value={String(currentTabIndex)} onValueChange={(value) => setCurrentTabIndex(Number(value))}>
                <TabsList className="mb-4 p-1 bg-blue-900/10">
                  <TabsTrigger value="0" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <User className="w-4 h-4 mr-2" />
                    Persoonlijk
                  </TabsTrigger>
                  <TabsTrigger value="1" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="2" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <BookOpen className="w-4 h-4 mr-2" />
                    Programma
                  </TabsTrigger>
                  <TabsTrigger value="3" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <Clipboard className="w-4 h-4 mr-2" />
                    Motivatie
                  </TabsTrigger>
                  <TabsTrigger value="4" className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#1e3a8a] data-[state=active]:shadow-md">
                    <Info className="w-4 h-4 mr-2" />
                    Status
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="0" className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-firstName" className="text-gray-700">
                        Voornaam <span className="text-[#3b5998]">*</span>
                      </Label>
                      <Input
                        id="edit-firstName"
                        value={applicationFormData.firstName}
                        onChange={(e) => setApplicationFormData({ ...applicationFormData, firstName: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-lastName" className="text-gray-700">
                        Achternaam <span className="text-[#3b5998]">*</span>
                      </Label>
                      <Input
                        id="edit-lastName"
                        value={applicationFormData.lastName}
                        onChange={(e) => setApplicationFormData({ ...applicationFormData, lastName: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-dateOfBirth" className="text-gray-700">Geboortedatum</Label>
                      <Input
                        id="edit-dateOfBirth"
                        type="date"
                        value={applicationFormData.dateOfBirth}
                        onChange={(e) => setApplicationFormData({ ...applicationFormData, dateOfBirth: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="1" className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-email" className="text-gray-700">
                        E-mailadres <span className="text-[#3b5998]">*</span>
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={applicationFormData.email}
                        onChange={(e) => setApplicationFormData({ ...applicationFormData, email: e.target.value })}
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-phone" className="text-gray-700">Telefoonnummer</Label>
                      <Input
                        id="edit-phone"
                        value={applicationFormData.phone}
                        onChange={(e) => setApplicationFormData({ ...applicationFormData, phone: e.target.value })}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="2" className="space-y-4 pt-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-programId" className="text-gray-700">Programma</Label>
                      <Select
                        value={applicationFormData.programId?.toString() || ""}
                        onValueChange={(value) => setApplicationFormData({ ...applicationFormData, programId: Number(value) })}
                      >
                        <SelectTrigger id="edit-programId" className="mt-1">
                          <SelectValue placeholder="Selecteer een programma" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((program) => (
                            <SelectItem key={program.id} value={program.id.toString()}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="edit-academicYearId" className="text-gray-700">Academisch Jaar</Label>
                      <Select
                        value={applicationFormData.academicYearId?.toString() || ""}
                        onValueChange={(value) => setApplicationFormData({ ...applicationFormData, academicYearId: Number(value) })}
                      >
                        <SelectTrigger id="edit-academicYearId" className="mt-1">
                          <SelectValue placeholder="Selecteer een academisch jaar" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">2025-2026</SelectItem>
                          <SelectItem value="2">2024-2025</SelectItem>
                          <SelectItem value="3">2023-2024</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-previousEducation" className="text-gray-700">Eerdere Opleiding</Label>
                      <Textarea
                        id="edit-previousEducation"
                        value={applicationFormData.previousEducation}
                        onChange={(e) => setApplicationFormData({ ...applicationFormData, previousEducation: e.target.value })}
                        className="mt-1 min-h-[100px]"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="3" className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="edit-personalStatement" className="text-gray-700">Persoonlijke Motivatie</Label>
                    <Textarea
                      id="edit-personalStatement"
                      value={applicationFormData.personalStatement}
                      onChange={(e) => setApplicationFormData({ ...applicationFormData, personalStatement: e.target.value })}
                      className="mt-1 min-h-[200px]"
                    />
                  </div>
                </TabsContent>
                
                <TabsContent value="4" className="space-y-4 pt-2">
                  <div>
                    <Label htmlFor="edit-status" className="text-gray-700">Status</Label>
                    <RadioGroup
                      value={applicationFormData.status}
                      onValueChange={(value) => setApplicationFormData({ ...applicationFormData, status: value })}
                      className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Pending" id="edit-status-pending" />
                        <Label htmlFor="edit-status-pending" className="flex items-center">
                          <Clock className="h-4 w-4 mr-2 text-yellow-600" />
                          In afwachting
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Approved" id="edit-status-approved" />
                        <Label htmlFor="edit-status-approved" className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
                          Goedgekeurd
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Rejected" id="edit-status-rejected" />
                        <Label htmlFor="edit-status-rejected" className="flex items-center">
                          <XCircle className="h-4 w-4 mr-2 text-red-600" />
                          Afgewezen
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="Enrolled" id="edit-status-enrolled" />
                        <Label htmlFor="edit-status-enrolled" className="flex items-center">
                          <School className="h-4 w-4 mr-2 text-blue-600" />
                          Ingeschreven
                        </Label>
                      </div>
                    </RadioGroup>
                  </div>
                </TabsContent>
              </Tabs>
            </ScrollArea>
            
            <DialogFooter className="mt-6 gap-2">
              <Button type="button" onClick={() => setIsEditDialogOpen(false)} variant="outline">
                Annuleren
              </Button>
              <Button type="submit" disabled={updateApplicationMutation.isPending}>
                {updateApplicationMutation.isPending ? "Bezig met opslaan..." : "Wijzigingen opslaan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Dialoogvenster voor het verwijderen van een aanmelding */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aanmelding verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze aanmelding wilt verwijderen? 
              Deze actie kan niet ongedaan gemaakt worden.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {currentApplicant && (
              <p className="text-sm text-gray-700">
                Je staat op het punt om de aanmelding van <strong>{currentApplicant.firstName} {currentApplicant.lastName}</strong> te verwijderen.
              </p>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button onClick={() => setIsDeleteDialogOpen(false)} variant="outline">
              Annuleren
            </Button>
            <Button
              onClick={handleConfirmDelete}
              disabled={deleteApplicationMutation.isPending}
              variant="destructive"
            >
              {deleteApplicationMutation.isPending ? "Bezig met verwijderen..." : "Verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}