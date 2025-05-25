import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, FileText, Clock, School, User, Phone, Mail, Calendar, BookOpen, Building, Clipboard, Info, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  
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
  const { data = { applicants: [], totalCount: 0 }, isLoading, isError } = useQuery<{ applicants: Applicant[], totalCount: number }>({
    queryKey: ['/api/admissions/applicants', { searchTerm, program, status, academicYear, page: currentPage }],
    staleTime: 30000,
  });

  // Fetch programs for filter
  const { data: programsData = { programs: [] } } = useQuery<{ programs: Program[] }>({
    queryKey: ['/api/programs'],
    staleTime: 600000, // Longer stale time for reference data
  });

  // Fetch academic years for filter
  const { data: academicYearsData = { academicYears: [] } } = useQuery<{ academicYears: AcademicYear[] }>({
    queryKey: ['/api/academic-years'],
    staleTime: 600000, // Longer stale time for reference data
  });

  // Fetch admission stats
  const { data: statsData = { stats: { totalApplications: 0, pendingReview: 0, approved: 0, rejected: 0, withdrawals: 0, conversionRate: 0, enrollmentRate: 0 } } } = useQuery<{ stats: AdmissionStats }>({
    queryKey: ['/api/admissions/stats'],
    staleTime: 60000,
  });

  // Mutations
  const addApplicantMutation = useMutation({
    mutationFn: (newApplicant: any) => {
      return apiRequest('/api/admissions/applicants', 'POST', newApplicant);
    },
    onSuccess: () => {
      setIsAddDialogOpen(false);
      toast({
        title: "Aanmelding toegevoegd",
        description: "De aanmelding is succesvol toegevoegd.",
      });
      // Reset form
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
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/applicants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de aanmelding.",
        variant: "destructive",
      });
      console.error("Error adding applicant:", error);
    }
  });

  const updateApplicantStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: string }) => {
      return apiRequest(`/api/admissions/applicants/${id}/status`, 'PUT', { status });
    },
    onSuccess: () => {
      toast({
        title: "Status bijgewerkt",
        description: "De status van de aanmelding is succesvol bijgewerkt.",
      });
      setIsViewDialogOpen(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/applicants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van de status.",
        variant: "destructive",
      });
      console.error("Error updating applicant status:", error);
    }
  });

  const deleteApplicantMutation = useMutation({
    mutationFn: (id: string) => {
      return apiRequest(`/api/admissions/applicants/${id}`, 'DELETE');
    },
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      toast({
        title: "Aanmelding verwijderd",
        description: "De aanmelding is succesvol verwijderd.",
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/applicants'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admissions/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de aanmelding.",
        variant: "destructive",
      });
      console.error("Error deleting applicant:", error);
    }
  });

  // Handlers
  const handleViewApplicant = (applicant: Applicant) => {
    setCurrentApplicant(applicant);
    setIsViewDialogOpen(true);
  };

  const handleEditApplicant = (applicant: Applicant) => {
    // Implementatie voor bewerken
    toast({
      title: "Niet geïmplementeerd",
      description: "Bewerken van aanmeldingen is nog niet beschikbaar.",
    });
  };

  const handleDeleteApplicant = (applicant: Applicant) => {
    setCurrentApplicant(applicant);
    setIsDeleteDialogOpen(true);
  };

  const handleAddApplicant = () => {
    if (!applicationFormData.firstName || !applicationFormData.lastName || !applicationFormData.email || !applicationFormData.programId || !applicationFormData.academicYearId) {
      toast({
        title: "Ontbrekende velden",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }

    const newApplicant = {
      ...applicationFormData,
      applicationDate: new Date().toISOString(),
    };

    addApplicantMutation.mutate(newApplicant);
  };

  const handleStatusChange = (status: string) => {
    if (!currentApplicant) return;
    updateApplicantStatusMutation.mutate({ id: currentApplicant.id, status });
  };

  const handleDeleteConfirm = () => {
    if (!currentApplicant) return;
    deleteApplicantMutation.mutate(currentApplicant.id);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'program':
        setProgram(value);
        break;
      case 'status':
        setStatus(value);
        break;
      case 'academicYear':
        setAcademicYear(value);
        break;
    }
    setCurrentPage(1);
  };

  const resetFilters = () => {
    setProgram('all');
    setStatus('all');
    setAcademicYear('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  // Helpers
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge className="bg-yellow-100 text-yellow-800 border-transparent">In behandeling</Badge>;
      case 'Approved':
        return <Badge className="bg-green-100 text-green-800 border-transparent">Goedgekeurd</Badge>;
      case 'Rejected':
        return <Badge className="bg-red-100 text-red-800 border-transparent">Afgewezen</Badge>;
      case 'Withdrawn':
        return <Badge className="bg-gray-100 text-gray-800 border-transparent">Teruggetrokken</Badge>;
      default:
        return <Badge className="bg-blue-100 text-blue-800 border-transparent">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMMM yyyy', { locale: nl });
    } catch (e) {
      return dateString;
    }
  };

  // Pagination variables
  const itemsPerPage = 10;
  const totalPages = Math.ceil((data?.totalCount || 0) / itemsPerPage);
  const currentStartItem = (currentPage - 1) * itemsPerPage + 1;
  const currentEndItem = Math.min(currentStartItem + itemsPerPage - 1, data?.totalCount || 0);

  // Filter options for status
  const statusOptions = [
    { value: 'all', label: 'Alle statussen' },
    { value: 'Pending', label: 'In behandeling' },
    { value: 'Approved', label: 'Goedgekeurd' },
    { value: 'Rejected', label: 'Afgewezen' },
    { value: 'Withdrawn', label: 'Teruggetrokken' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Page header - Professionele desktop stijl (conform Dashboard) */}
      <header className="bg-white border-b border-[#e5e7eb] shadow-sm">
        <div className="flex flex-col">
          <div className="px-6 py-4 flex justify-between items-center">
            <div className="flex items-center">
              <Clipboard className="h-5 w-5 text-[#1e40af] mr-2" />
              <h1 className="text-base font-medium text-gray-800 tracking-tight">Aanmeldingen</h1>
            </div>
            <div className="flex items-center">
              <div className="text-xs text-gray-500 font-medium">
                {new Date().toLocaleDateString('nl-NL', {day: 'numeric', month: 'long', year: 'numeric'})}
              </div>
            </div>
          </div>
          <div className="px-6 py-2 bg-[#f9fafc] border-t border-[#e5e7eb] flex items-center">
            <div className="text-xs text-gray-500">Beheer &gt; Aanmeldingen</div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="px-6 py-6 flex-1">
        {/* Stats cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="shadow-none border-[#e5e7eb] rounded-sm">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-medium text-gray-500">Totaal Aanmeldingen</CardTitle>
            </CardHeader>
            <CardContent className="py-3 px-4">
              <div className="text-2xl font-semibold">{statsData.stats.totalApplications}</div>
            </CardContent>
          </Card>
          
          <Card className="shadow-none border-[#e5e7eb] rounded-sm">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-medium text-gray-500">In behandeling</CardTitle>
            </CardHeader>
            <CardContent className="py-3 px-4">
              <div className="text-2xl font-semibold">{statsData.stats.pendingReview}</div>
              <div className="text-xs text-yellow-600">
                {((statsData.stats.pendingReview / statsData.stats.totalApplications) * 100 || 0).toFixed(1)}% van totaal
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-none border-[#e5e7eb] rounded-sm">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-medium text-gray-500">Goedgekeurd</CardTitle>
            </CardHeader>
            <CardContent className="py-3 px-4">
              <div className="text-2xl font-semibold">{statsData.stats.approved}</div>
              <div className="text-xs text-green-600">
                {((statsData.stats.approved / statsData.stats.totalApplications) * 100 || 0).toFixed(1)}% van totaal
              </div>
            </CardContent>
          </Card>
          
          <Card className="shadow-none border-[#e5e7eb] rounded-sm">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-medium text-gray-500">Afgewezen</CardTitle>
            </CardHeader>
            <CardContent className="py-3 px-4">
              <div className="text-2xl font-semibold">{statsData.stats.rejected}</div>
              <div className="text-xs text-red-600">
                {((statsData.stats.rejected / statsData.stats.totalApplications) * 100 || 0).toFixed(1)}% van totaal
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Zoek- en actiebalk - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4">
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Zoekbalk */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Zoek op naam of email..."
                className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            {/* Acties */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilterOptions(!showFilterOptions)}
                className="h-7 text-xs rounded-sm border-[#e5e7eb]"
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filters
                {showFilterOptions ? 
                  <ChevronUp className="h-3.5 w-3.5 ml-1" /> : 
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                }
              </Button>
              
              <Button
                size="sm"
                onClick={() => setIsAddDialogOpen(true)}
                className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
              >
                <PlusCircle className="h-3.5 w-3.5 mr-1" />
                Nieuwe Aanmelding
              </Button>
            </div>
          </div>
          
          {/* Filter opties */}
          {showFilterOptions && (
            <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-wrap gap-3 items-center">
              <div className="flex items-center">
                {(program !== 'all' || status !== 'all' || academicYear !== 'all') && (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={resetFilters}
                    className="h-7 text-xs text-blue-600 p-0 mr-3"
                  >
                    Filters wissen
                  </Button>
                )}
              </div>
              
              <div className="flex flex-wrap gap-3">
                <Select 
                  value={program} 
                  onValueChange={(value) => handleFilterChange('program', value)}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Programma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle programma's</SelectItem>
                    {programsData?.programs?.map((program: Program) => (
                      <SelectItem key={program.id} value={program.id}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={status} 
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={academicYear} 
                  onValueChange={(value) => handleFilterChange('academicYear', value)}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Academisch jaar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle jaren</SelectItem>
                    {academicYearsData?.academicYears?.map((year: AcademicYear) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>

        {/* Tabel van aanmeldingen - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e5e7eb]">
              <thead className="bg-[#f9fafc]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Naam</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Programma</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Academisch Jaar</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Datum Aanmelding</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Status</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right w-[120px]">
                    <span className="text-xs font-medium text-gray-700">Acties</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e5e7eb]">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-500">Laden...</span>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center py-6">
                        <XCircle className="h-8 w-8 text-red-500 mb-2" />
                        <p className="text-sm text-red-500">Fout bij het laden van aanmeldingen.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/admissions/applicants'] })}
                          className="mt-2 h-7 text-xs rounded-sm"
                        >
                          Opnieuw proberen
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : data.applicants.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-4 text-center">
                      <div className="py-6">
                        <div className="flex flex-col items-center justify-center">
                          <Clipboard className="h-12 w-12 text-gray-300 mb-2" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Geen aanmeldingen gevonden</h3>
                          <p className="text-sm text-gray-500 max-w-md text-center mb-4">
                            {searchTerm || program !== 'all' || status !== 'all' || academicYear !== 'all' 
                              ? 'Er zijn geen aanmeldingen die voldoen aan de huidige filters.' 
                              : 'Er zijn nog geen aanmeldingen in het systeem.'}
                          </p>
                          {(searchTerm || program !== 'all' || status !== 'all' || academicYear !== 'all') && (
                            <Button 
                              variant="outline"
                              size="sm"
                              onClick={resetFilters}
                              className="h-8 text-xs rounded-sm"
                            >
                              Filters wissen
                            </Button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  data.applicants.map((applicant) => (
                    <tr key={applicant.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center">
                          <div>
                            <p className="text-xs font-medium text-gray-900">{applicant.firstName} {applicant.lastName}</p>
                            <p className="text-xs text-gray-500">{applicant.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{applicant.programName}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{applicant.academicYear}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{formatDate(applicant.applicationDate)}</td>
                      <td className="px-4 py-3">{getStatusBadge(applicant.status)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewApplicant(applicant)}
                            className="h-7 w-7 p-0 text-gray-500"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditApplicant(applicant)}
                            className="h-7 w-7 p-0 text-gray-500"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteApplicant(applicant)}
                            className="h-7 w-7 p-0 text-gray-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Paginering */}
          {data.applicants.length > 0 && (
            <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
              <div>
                Resultaten {currentStartItem}-{currentEndItem} van {data.totalCount}
              </div>
              <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs rounded-sm"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  Vorige
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs rounded-sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  Volgende
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dialogen */}
      
      {/* Nieuwe aanmelding dialoog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nieuwe Aanmelding</DialogTitle>
            <DialogDescription>
              Vul de gegevens in voor een nieuwe aanmelding.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Voornaam</Label>
              <Input 
                id="firstName" 
                placeholder="Voornaam" 
                className="h-8 text-sm"
                value={applicationFormData.firstName}
                onChange={(e) => setApplicationFormData({...applicationFormData, firstName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Achternaam</Label>
              <Input 
                id="lastName" 
                placeholder="Achternaam" 
                className="h-8 text-sm"
                value={applicationFormData.lastName}
                onChange={(e) => setApplicationFormData({...applicationFormData, lastName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="E-mail" 
                className="h-8 text-sm"
                value={applicationFormData.email}
                onChange={(e) => setApplicationFormData({...applicationFormData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoonnummer</Label>
              <Input 
                id="phone" 
                placeholder="Telefoonnummer" 
                className="h-8 text-sm"
                value={applicationFormData.phone}
                onChange={(e) => setApplicationFormData({...applicationFormData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Geboortedatum</Label>
              <Input 
                id="dateOfBirth" 
                type="date" 
                className="h-8 text-sm"
                value={applicationFormData.dateOfBirth}
                onChange={(e) => setApplicationFormData({...applicationFormData, dateOfBirth: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="programId">Programma</Label>
              <Select 
                value={applicationFormData.programId?.toString() || ""} 
                onValueChange={(value) => setApplicationFormData({...applicationFormData, programId: value ? parseInt(value) : null})}
              >
                <SelectTrigger id="programId" className="h-8 text-sm">
                  <SelectValue placeholder="Selecteer programma" />
                </SelectTrigger>
                <SelectContent>
                  {programsData?.programs?.map((program: Program) => (
                    <SelectItem key={program.id} value={program.id}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="academicYearId">Academisch Jaar</Label>
              <Select 
                value={applicationFormData.academicYearId?.toString() || ""} 
                onValueChange={(value) => setApplicationFormData({...applicationFormData, academicYearId: value ? parseInt(value) : null})}
              >
                <SelectTrigger id="academicYearId" className="h-8 text-sm">
                  <SelectValue placeholder="Selecteer jaar" />
                </SelectTrigger>
                <SelectContent>
                  {academicYearsData?.academicYears?.map((year: AcademicYear) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="previousEducation">Vorige Opleiding</Label>
              <Textarea 
                id="previousEducation" 
                placeholder="Beschrijf eerdere opleidingen" 
                className="h-20 text-sm"
                value={applicationFormData.previousEducation}
                onChange={(e) => setApplicationFormData({...applicationFormData, previousEducation: e.target.value})}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="personalStatement">Persoonlijke Motivatie</Label>
              <Textarea 
                id="personalStatement" 
                placeholder="Waarom wil je dit programma volgen?" 
                className="h-20 text-sm"
                value={applicationFormData.personalStatement}
                onChange={(e) => setApplicationFormData({...applicationFormData, personalStatement: e.target.value})}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAddDialogOpen(false)}
              className="h-8 text-xs rounded-sm"
            >
              Annuleren
            </Button>
            <Button
              onClick={handleAddApplicant}
              className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              Aanmelding Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details dialoog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Aanmelding details</DialogTitle>
            <DialogDescription>
              Details van de aanmelding.
            </DialogDescription>
          </DialogHeader>
          
          {currentApplicant && (
            <div className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Persoonlijke informatie</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">Naam</span>
                        <span className="text-sm font-medium">{currentApplicant.firstName} {currentApplicant.lastName}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">Geboortedatum</span>
                        <span className="text-sm">{formatDate(currentApplicant.dateOfBirth)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">E-mail</span>
                        <span className="text-sm">{currentApplicant.email}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">Telefoonnummer</span>
                        <span className="text-sm">{currentApplicant.phone}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Aanmeldingsinformatie</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">Datum aanmelding</span>
                        <span className="text-sm">{formatDate(currentApplicant.applicationDate)}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">Programma</span>
                        <span className="text-sm">{currentApplicant.programName}</span>
                      </div>
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                        <span className="text-xs text-gray-500">Academisch jaar</span>
                        <span className="text-sm">{currentApplicant.academicYear}</span>
                      </div>
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-xs text-gray-500">Status</span>
                        <span>{getStatusBadge(currentApplicant.status)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Vorige Opleiding</h4>
                    <p className="text-sm border rounded-sm p-3 bg-gray-50 min-h-[100px]">
                      {currentApplicant.previousEducation || "Geen informatie beschikbaar"}
                    </p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 mb-3">Persoonlijke Motivatie</h4>
                    <p className="text-sm border rounded-sm p-3 bg-gray-50 min-h-[100px]">
                      {currentApplicant.personalStatement || "Geen informatie beschikbaar"}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-500 mb-3">Status bijwerken</h4>
                <RadioGroup defaultValue={currentApplicant.status} onValueChange={handleStatusChange} className="flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Pending" id="pending" className="h-3.5 w-3.5" />
                    <Label htmlFor="pending" className="text-xs">In behandeling</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Approved" id="approved" className="h-3.5 w-3.5" />
                    <Label htmlFor="approved" className="text-xs">Goedkeuren</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Rejected" id="rejected" className="h-3.5 w-3.5" />
                    <Label htmlFor="rejected" className="text-xs">Afwijzen</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Withdrawn" id="withdrawn" className="h-3.5 w-3.5" />
                    <Label htmlFor="withdrawn" className="text-xs">Teruggetrokken</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
              className="h-8 text-xs rounded-sm"
            >
              Sluiten
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewDialogOpen(false);
                handleEditApplicant(currentApplicant!);
              }}
              className="h-8 text-xs rounded-sm"
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Bewerken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Verwijder dialoog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Aanmelding verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze aanmelding wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          {currentApplicant && (
            <div className="py-4">
              <div className="bg-gray-50 border rounded-sm p-4">
                <p className="font-medium">{currentApplicant.firstName} {currentApplicant.lastName}</p>
                <p className="text-sm text-gray-500">{currentApplicant.email}</p>
                <p className="text-sm text-gray-500 mt-1">Programma: {currentApplicant.programName}</p>
                <div className="mt-2">{getStatusBadge(currentApplicant.status)}</div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-8 text-xs rounded-sm"
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              className="h-8 text-xs rounded-sm"
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}