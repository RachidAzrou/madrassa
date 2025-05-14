import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, CheckCircle, XCircle, FileText, Clock, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { apiRequest } from '@/lib/queryClient';

export default function Admissions() {
  const [searchTerm, setSearchTerm] = useState('');
  const [program, setProgram] = useState('all');
  const [status, setStatus] = useState('all');
  const [academicYear, setAcademicYear] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState('applications');

  // Fetch applicants with filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/admissions/applicants', { searchTerm, program, status, academicYear, page: currentPage }],
    staleTime: 30000,
  });

  // Fetch programs for filter
  const { data: programsData } = useQuery({
    queryKey: ['/api/programs'],
  });

  // Fetch academic years for filter
  const { data: academicYearsData } = useQuery({
    queryKey: ['/api/academic-years'],
  });

  // Fetch admission stats
  const { data: statsData } = useQuery({
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

  const handleAddApplicant = async () => {
    // Implementation will be added for applicant creation
    console.log('Add applicant clicked');
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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Toelatingsbeheer</h1>
          <p className="text-gray-500 mt-1">
            Beoordeel en verwerk studentaanmeldingen en toelatingen
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleAddApplicant} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Nieuwe Aanmelding</span>
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Totaal Aanmeldingen</p>
                <p className="text-2xl font-bold">{stats.totalApplications}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Wachtend op Beoordeling</p>
                <p className="text-2xl font-bold">{stats.pendingReview}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Goedgekeurd</p>
                <p className="text-2xl font-bold">{stats.approved}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Inschrijvingsgraad</p>
                <div className="flex items-center">
                  <p className="text-2xl font-bold">{stats.enrollmentRate}%</p>
                </div>
                <Progress value={stats.enrollmentRate} className="h-1.5 mt-1.5 w-32" />
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center">
                <School className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="applications">Aanmeldingen</TabsTrigger>
          <TabsTrigger value="admission-programs">Toelatingsprogramma's</TabsTrigger>
          <TabsTrigger value="settings">Instellingen</TabsTrigger>
        </TabsList>
        
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
                    <SelectItem value="cs">Informatica</SelectItem>
                    <SelectItem value="bus">Bedrijfskunde</SelectItem>
                    <SelectItem value="eng">Techniek</SelectItem>
                    <SelectItem value="arts">Kunst</SelectItem>
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
                  ) : isError ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-red-500">
                        Fout bij het laden van aanmelders. Probeer het opnieuw.
                      </td>
                    </tr>
                  ) : applicants.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                        Geen aanmelders gevonden met de huidige filters. Probeer uw zoekopdracht of filters aan te passen.
                      </td>
                    </tr>
                  ) : (
                    // Temporary demo data
                    <>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900">Thomas Johnson</div>
                              <div className="text-sm text-gray-500">thomas.johnson@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Computer Science</div>
                          <div className="text-xs text-gray-500">Bachelor's Degree</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">12 Apr, 2024</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge('Pending')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">Bekijken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <span className="sr-only">Approve</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <XCircle className="h-4 w-4 text-red-500" />
                              <span className="sr-only">Reject</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900">Sarah Williams</div>
                              <div className="text-sm text-gray-500">sarah.williams@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Business Administration</div>
                          <div className="text-xs text-gray-500">Master's Degree</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">08 Apr, 2024</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge('Approved')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">Bekijken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Bewerken</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <input 
                              type="checkbox" 
                              className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                            />
                            <div>
                              <div className="font-medium text-gray-900">Michael Brown</div>
                              <div className="text-sm text-gray-500">michael.brown@example.com</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">Engineering</div>
                          <div className="text-xs text-gray-500">Bachelor's Degree</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">05 Apr, 2024</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge('Rejected')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">Bekijken</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-3 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between sm:hidden">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing <span className="font-medium">{((currentPage - 1) * 10) + 1}</span> to{" "}
                      <span className="font-medium">
                        {Math.min(currentPage * 10, totalApplicants)}
                      </span>{" "}
                      of <span className="font-medium">{totalApplicants}</span> results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="rounded-l-md"
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Vorige
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
                        className="rounded-r-md"
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Volgende
                      </Button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="admission-programs">
          <Card>
            <CardHeader>
              <CardTitle>Toelatingsprogramma's</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-4">
                Configureer toelatingsprogramma's, vereisten en aanmeldformulieren voor verschillende academische jaren.
              </p>
              
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programmanaam</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Academisch Jaar</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Startdatum</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Einddatum</th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">Bachelor Toelating</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">2024-2025</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">01 jan 2024</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">30 jun 2024</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-green-100 text-green-800 border-green-200">Actief</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">Bekijken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Bewerken</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">Master Toelating</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">2024-2025</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">01 feb 2024</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">31 jul 2024</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-green-100 text-green-800 border-green-200">Actief</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">Bekijken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Bewerken</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">Overstapstudenten</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">2024-2025</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">15 jan 2024</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">15 jul 2024</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className="bg-green-100 text-green-800 border-green-200">Actief</Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-2">
                            <Button variant="ghost" size="icon">
                              <Eye className="h-4 w-4 text-gray-500" />
                              <span className="sr-only">Bekijken</span>
                            </Button>
                            <Button variant="ghost" size="icon">
                              <Edit className="h-4 w-4 text-blue-500" />
                              <span className="sr-only">Bewerken</span>
                            </Button>
                          </div>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Toelatingsinstelling</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500 mb-6">
                Configureer globale instellingen voor het toelatingsproces, inclusief aanmeldformulieren, vereisten en werkstromen.
              </p>
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Aanmeldformulier Instellingen</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Configureer de velden en secties die in het aanmeldformulier verschijnen.
                  </p>
                  <Button variant="outline">Aanmeldformulier Aanpassen</Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-2">Documentvereisten</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Specificeer de vereiste documenten voor verschillende programma's en aanmelderstypes.
                  </p>
                  <Button variant="outline">Documentvereisten Beheren</Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-2">Goedkeuringsproces</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Definieer het goedkeuringsproces en notificatie-instellingen voor aanmeldingen.
                  </p>
                  <Button variant="outline">Goedkeuringsproces Configureren</Button>
                </div>
                
                <div className="border-t pt-6">
                  <h3 className="text-lg font-medium mb-2">E-mailsjablonen</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Pas de e-mailnotificaties aan die aan aanmelders worden verzonden tijdens het toelatingsproces.
                  </p>
                  <Button variant="outline">E-mailsjablonen Bewerken</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}