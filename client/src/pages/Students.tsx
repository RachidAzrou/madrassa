import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, X } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

// Hulpfunctie om data in correct formaat te zetten voor API
const formatDateForApi = (dateString: string | null | undefined): string | null => {
  if (!dateString) return null;
  
  // Als datum al in YYYY-MM-DD formaat is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Als datum in DD-MM-YYYY formaat is (zoals van datepicker)
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateString)) {
    const [day, month, year] = dateString.split('-');
    return `${year}-${month}-${day}`;
  }
  
  // Probeert datum om te zetten via Date object
  try {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.error('Ongeldige datumwaarde:', dateString);
  }
  
  return null;
};

export default function Students() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [program, setProgram] = useState('all');
  const [year, setYear] = useState('all');
  const [status, setStatus] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  
  // State voor student dialogen
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [studentFormData, setStudentFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '' as string | null,
    address: '',
    city: '',
    postalCode: '',
    programId: null as number | null,
    yearLevel: null as number | null,
    enrollmentDate: '',
    status: 'active' as string,
  });

  // Fetch students with filters
  const { data, isLoading, isError } = useQuery({
    queryKey: ['/api/students', { searchTerm, program, year, status, sortBy, page: currentPage }],
    staleTime: 30000,
  });

  const students = data?.students || [];
  const totalStudents = data?.totalCount || 0;
  const totalPages = Math.ceil(totalStudents / 10); // Assuming 10 students per page

  // Mutatie om een student toe te voegen
  const createStudentMutation = useMutation({
    mutationFn: async (studentData: typeof studentFormData) => {
      return apiRequest('POST', '/api/students', studentData);
    },
    onSuccess: () => {
      // Invalidate query cache to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      // Reset form and close dialog
      setStudentFormData({
        studentId: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        address: '',
        programId: null,
        yearLevel: null,
        status: 'Active',
      });
      setIsAddDialogOpen(false);
      
      // Toon succes melding
      toast({
        title: "Student toegevoegd",
        description: "De student is succesvol toegevoegd aan het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de student.",
        variant: "destructive",
      });
    }
  });

  const handleAddStudent = () => {
    // Open het toevoeg-dialoogvenster
    setIsAddDialogOpen(true);
  };
  
  const handleSubmitStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Kopieer de student data voor we deze aanpassen
    const formattedData = { ...studentFormData };
    
    // Gebruik de formatDateForApi functie voor correcte datumformattering
    // Zet de geboortedatum om naar het juiste format en gebruik een lege string als het null is
    const formattedDate = formatDateForApi(formattedData.dateOfBirth) || '';
    formattedData.dateOfBirth = formattedDate;
    
    console.log('Verstuur student data:', formattedData);
    
    // Verzend de geformatteerde data
    createStudentMutation.mutate(formattedData);
  };

  const handleViewStudent = (id: string) => {
    console.log(`Viewing student with ID: ${id}`);
    // Navigeer naar een gedetailleerde weergave of toon een modal
    toast({
      title: "Student details",
      description: `Details bekijken voor student met ID: ${id}`,
      variant: "default",
    });
  };

  const handleEditStudent = (student: any) => {
    // Stel de geselecteerde student in en kopieer hun gegevens naar het formulier
    setSelectedStudent(student);
    setStudentFormData({
      studentId: student.studentId || '',
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      phone: student.phone || '',
      dateOfBirth: student.dateOfBirth || '',
      address: student.address || '',
      city: student.city || '',
      postalCode: student.postalCode || '',
      programId: student.programId,
      yearLevel: student.yearLevel,
      enrollmentDate: student.enrollmentDate || '',
      status: student.status || 'active',
    });
    setIsEditDialogOpen(true);
  };

  // Mutatie voor het updaten van een student
  const updateStudentMutation = useMutation({
    mutationFn: async (data: { id: string; studentData: typeof studentFormData }) => {
      return apiRequest('PUT', `/api/students/${data.id}`, data.studentData);
    },
    onSuccess: () => {
      // Vernieuw de lijst van studenten
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      // Sluit het dialoog en reset het formulier
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      
      // Toon een succesmelding
      toast({
        title: "Student bijgewerkt",
        description: "De studentgegevens zijn succesvol bijgewerkt.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken",
        description: error.message || "Er is een fout opgetreden bij het bijwerken van de student.",
        variant: "destructive",
      });
    }
  });

  const handleSubmitEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStudent) {
      // Kopieer de studentdata voor we deze aanpassen
      const formattedData = { ...studentFormData };
      
      // Gebruik de formatDateForApi functie voor correcte datumformattering
      const formattedDate = formatDateForApi(formattedData.dateOfBirth);
      formattedData.dateOfBirth = formattedDate;
      
      console.log('Verstuur bewerkte student data:', formattedData);
      
      updateStudentMutation.mutate({
        id: selectedStudent.id,
        studentData: formattedData
      });
    }
  };

  const handleDeleteStudent = (student: any) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  // Mutatie voor het verwijderen van een student
  const deleteStudentMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/students/${id}`);
    },
    onSuccess: () => {
      // Vernieuw de lijst van studenten
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      // Sluit het dialoog
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      
      // Toon een succesmelding
      toast({
        title: "Student verwijderd",
        description: "De student is succesvol verwijderd uit het systeem.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen",
        description: error.message || "Er is een fout opgetreden bij het verwijderen van de student.",
        variant: "destructive",
      });
    }
  });

  const confirmDeleteStudent = () => {
    if (selectedStudent) {
      deleteStudentMutation.mutate(selectedStudent.id);
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

  const handleYearChange = (value: string) => {
    setYear(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setCurrentPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Page Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Studentenbeheer</h1>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Input
              type="text"
              placeholder="Zoek studenten..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="w-full md:w-64 pl-10"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <Button onClick={handleAddStudent} className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" />
            <span>Student Toevoegen</span>
          </Button>
        </div>
      </div>

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
            <label className="block text-sm font-medium text-gray-700 mb-1">Jaar</label>
            <Select value={year} onValueChange={handleYearChange}>
              <SelectTrigger>
                <SelectValue placeholder="Alle Jaren" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Jaren</SelectItem>
                <SelectItem value="1">Jaar 1</SelectItem>
                <SelectItem value="2">Jaar 2</SelectItem>
                <SelectItem value="3">Jaar 3</SelectItem>
                <SelectItem value="4">Jaar 4</SelectItem>
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
                <SelectItem value="pending">In afwachting</SelectItem>
                <SelectItem value="inactive">Inactief</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sorteren op</label>
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger>
                <SelectValue placeholder="Naam" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Naam</SelectItem>
                <SelectItem value="id">ID</SelectItem>
                <SelectItem value="program">Programma</SelectItem>
                <SelectItem value="date">Registratiedatum</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Student List Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {isLoading ? 'Laden...' : `Tonen van ${students.length} van de ${totalStudents} studenten`}
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Toon of verberg geavanceerde filteropties
                alert('Geavanceerde filteropties worden hier weergegeven');
              }}
            >
              <Filter className="mr-2 h-4 w-4" />
              Filteren
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                // Exporteer studentengegevens als CSV
                console.log('Exporteren van studentengegevens');
                alert('Studentengegevens worden geëxporteerd als CSV...');
                // Hier API-aanroep voor downloaden implementeren
              }}
            >
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
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Programma</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Jaar</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-red-500">
                    Fout bij het laden van studenten. Probeer het opnieuw.
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    Geen studenten gevonden. Probeer je filters aan te passen.
                  </td>
                </tr>
              ) : (
                students.map((student: any) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-gray-300 text-primary focus:ring-primary mr-3"
                        />
                        <Avatar className="h-9 w-9">
                          <AvatarFallback>
                            {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{student.firstName} {student.lastName}</div>
                          <div className="text-sm text-gray-500">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.studentId}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.program}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">Jaar {student.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        student.status === 'active' ? 'bg-green-100 text-green-800' : 
                        student.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {student.status === 'active' ? 'Actief' : 
                         student.status === 'pending' ? 'In afwachting' : 
                         student.status === 'inactive' ? 'Inactief' :
                         student.status.charAt(0).toUpperCase() + student.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-primary hover:text-primary-dark"
                        onClick={() => handleViewStudent(student.id)}
                      >
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">Bekijken</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-gray-500 hover:text-gray-700"
                        onClick={() => handleEditStudent(student)}
                      >
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Bewerken</span>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-500 hover:text-red-700"
                        onClick={() => handleDeleteStudent(student)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Verwijderen</span>
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Tonen <span className="font-medium">{students.length > 0 ? (currentPage - 1) * 10 + 1 : 0}</span> tot <span className="font-medium">{Math.min(currentPage * 10, totalStudents)}</span> van <span className="font-medium">{totalStudents}</span> resultaten
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Paginering">
                <button
                  onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Vorige</span>
                  &larr;
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => handlePageChange(i + 1)}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                      currentPage === i + 1
                        ? 'bg-primary text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                >
                  <span className="sr-only">Volgende</span>
                  &rarr;
                </button>
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Student Life Images */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Studentenleven</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <img 
            src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
            alt="Studenten studeren samen" 
            className="rounded-lg shadow-sm h-48 w-full object-cover" 
          />
          <img 
            src="https://pixabay.com/get/g5ce301cea77c986decbe6332e3e27b75a70717da74d0bf7c4bfe2ec8dbb3dbd496461b8b2ab7f06b0624f2fe10a4e01a485f2136242a2b6dac2359ccb793d32c_1280.jpg" 
            alt="Studenten werken samen" 
            className="rounded-lg shadow-sm h-48 w-full object-cover" 
          />
          <img 
            src="https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
            alt="Student studeert buiten" 
            className="rounded-lg shadow-sm h-48 w-full object-cover" 
          />
          <img 
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600" 
            alt="Diploma-uitreiking" 
            className="rounded-lg shadow-sm h-48 w-full object-cover" 
          />
        </div>
      </div>

      {/* Add Student Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Nieuwe Student Toevoegen</DialogTitle>
            <DialogDescription>
              Vul de studentinformatie in om een nieuwe student toe te voegen aan het systeem.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitStudent}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="studentId" className="text-right">
                    Studentnummer
                  </Label>
                  <Input
                    id="studentId"
                    required
                    value={studentFormData.studentId}
                    onChange={(e) => setStudentFormData({ ...studentFormData, studentId: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="status" className="text-right">
                    Status
                  </Label>
                  <Select
                    value={studentFormData.status || ''}
                    onValueChange={(value) => setStudentFormData({ ...studentFormData, status: value })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Actief</SelectItem>
                      <SelectItem value="Inactive">Inactief</SelectItem>
                      <SelectItem value="Suspended">Geschorst</SelectItem>
                      <SelectItem value="Graduated">Afgestudeerd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="firstName" className="text-right">
                    Voornaam
                  </Label>
                  <Input
                    id="firstName"
                    required
                    value={studentFormData.firstName}
                    onChange={(e) => setStudentFormData({ ...studentFormData, firstName: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="lastName" className="text-right">
                    Achternaam
                  </Label>
                  <Input
                    id="lastName"
                    required
                    value={studentFormData.lastName}
                    onChange={(e) => setStudentFormData({ ...studentFormData, lastName: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="email" className="text-right">
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={studentFormData.email}
                    onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="phone" className="text-right">
                    Telefoonnummer
                  </Label>
                  <Input
                    id="phone"
                    value={studentFormData.phone || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div className="col-span-1">
                  <Label htmlFor="dateOfBirth" className="text-right">
                    Geboortedatum
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={studentFormData.dateOfBirth || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, dateOfBirth: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="address" className="text-right">
                    Adres
                  </Label>
                  <Input
                    id="address"
                    value={studentFormData.address || ''}
                    onChange={(e) => setStudentFormData({ ...studentFormData, address: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1">
                  <Label htmlFor="programId" className="text-right">
                    Opleidingsprogramma
                  </Label>
                  <Select
                    value={studentFormData.programId?.toString() || ''}
                    onValueChange={(value) => setStudentFormData({ ...studentFormData, programId: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer programma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Informatica</SelectItem>
                      <SelectItem value="2">Bedrijfskunde</SelectItem>
                      <SelectItem value="3">Techniek</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-1">
                  <Label htmlFor="yearLevel" className="text-right">
                    Studiejaar
                  </Label>
                  <Select
                    value={studentFormData.yearLevel?.toString() || ''}
                    onValueChange={(value) => setStudentFormData({ ...studentFormData, yearLevel: value ? parseInt(value) : null })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selecteer jaar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Jaar 1</SelectItem>
                      <SelectItem value="2">Jaar 2</SelectItem>
                      <SelectItem value="3">Jaar 3</SelectItem>
                      <SelectItem value="4">Jaar 4</SelectItem>
                    </SelectContent>
                  </Select>
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
                disabled={createStudentMutation.isPending}
              >
                {createStudentMutation.isPending ? 'Bezig met toevoegen...' : 'Student toevoegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
