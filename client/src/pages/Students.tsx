import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, X, UserCircle,
  ChevronUp, ChevronDown, FileText, FileDown, Mail, Home, BookOpen, Phone,
  Users, User, MapPin, GraduationCap, UsersRound, Pencil, Trash, CreditCard, AlertCircle,
  Image, Upload, School, UserRound, Camera, CheckSquare, SquareSlash
} from 'lucide-react';
import ManageStudentGuardians from '@/components/guardians/ManageStudentGuardians';
import { useToast } from '@/hooks/use-toast';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { apiRequest } from '@/lib/queryClient';
import { formatDateToDisplayFormat } from '@/lib/utils';

export default function Students() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProgramFilter, setSelectedProgramFilter] = useState('all');
  const [selectedYearLevelFilter, setSelectedYearLevelFilter] = useState('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedStudentGroupFilter, setSelectedStudentGroupFilter] = useState('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStudentDetailDialogOpen, setIsStudentDetailDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [isFeeNotificationOpen, setIsFeeNotificationOpen] = useState(false);
  const [feeDetails, setFeeDetails] = useState<any>(null);
  
  // State voor het studentformulier
  const [studentFormData, setStudentFormData] = useState({
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: null as string | null,
    address: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    programId: null as number | null,
    yearLevel: '',
    schoolYear: '' as string | null,
    studentGroupId: null as number | null,
    enrollmentDate: '',
    status: 'active' as string,
    notes: '',
    gender: '' as string,
  });
  
  // State voor meerdere programma's
  const [selectedPrograms, setSelectedPrograms] = useState<{
    programId: number;
    yearLevel: string;
  }[]>([]);

  // Statusopties voor dropdown
  const statusOptions = [
    { value: 'active', label: 'Actief' },
    { value: 'pending', label: 'In Afwachting' },
    { value: 'inactive', label: 'Inactief' },
    { value: 'graduated', label: 'Afgestudeerd' }
  ];

  // Geslacht opties voor dropdown
  const genderOptions = [
    { value: 'man', label: 'Man' },
    { value: 'vrouw', label: 'Vrouw' },
    { value: 'ander', label: 'Ander' }
  ];

  // Ophalen programma's voor dropdown
  const { data: programsData = {} } = useQuery({
    queryKey: ['/api/programs'],
  });

  // Ophalen studentengroepen voor dropdown
  const { data: studentGroupsData = {} } = useQuery({
    queryKey: ['/api/student-groups'],
  });
  
  // Ophalen van het volgende beschikbare studentID
  const { data: nextStudentIdData } = useQuery({
    queryKey: ['/api/next-student-id'],
    enabled: isCreateDialogOpen, // Laad alleen als het dialoogvenster geopend is
  });

  // Ophalen studenten
  const { data: studentsData = {}, isLoading } = useQuery({
    queryKey: ['/api/students', { 
      page, 
      search: searchTerm, 
      programId: selectedProgramFilter !== 'all' ? selectedProgramFilter : undefined, 
      yearLevel: selectedYearLevelFilter !== 'all' ? selectedYearLevelFilter : undefined, 
      status: selectedStatusFilter !== 'all' ? selectedStatusFilter : undefined, 
      studentGroupId: selectedStudentGroupFilter !== 'all' ? selectedStudentGroupFilter : undefined 
    }]
  });

  // Ophalen student details
  const getStudentDetails = (studentId: string) => {
    return apiRequest(`/api/students/${studentId}`);
  };

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (data: any) => {
      return apiRequest('/api/students', {
        method: 'POST',
        body: data
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      resetForm();
      setIsCreateDialogOpen(false);
      
      // Controleer of er een betalingsrecord is aangemaakt
      if (data && data.feeCreated) {
        setFeeDetails(data.feeDetails);
        
        // Toon een toast notificatie
        toast({
          title: "Student toegevoegd",
          description: "De student is succesvol toegevoegd en een betalingsrecord is aangemaakt.",
        });
        
        // Open de specifieke notificatie dialog
        setIsFeeNotificationOpen(true);
      } else {
        // Fallback bericht als er geen betalingsrecord is gemaakt
        toast({
          title: "Student toegevoegd",
          description: "De student is succesvol toegevoegd.",
        });
      }
    },
    onError: (error) => {
      console.error("Fout bij aanmaken student:", error);
      toast({
        title: "Fout bij aanmaken student",
        description: error instanceof Error ? error.message : "Er is een onbekende fout opgetreden",
        variant: "destructive",
      });
    }
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return apiRequest(`/api/students/${id}`, {
        method: 'PATCH',
        body: data
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      // Invalideer ook gerelateerde queries
      queryClient.invalidateQueries({ queryKey: ['/api/student-guardians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-group-enrollments'] });
      
      resetForm();
      setIsEditDialogOpen(false);
      toast({
        title: "Student bijgewerkt",
        description: "De student is succesvol bijgewerkt.",
      });
    },
    onError: (error) => {
      console.error("Fout bij bijwerken student:", error);
      toast({
        title: "Fout bij bijwerken student",
        description: error instanceof Error ? error.message : "Er is een onbekende fout opgetreden",
        variant: "destructive",
      });
    }
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: (id: string) => {
      return apiRequest(`/api/students/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      // Invalideer alle relevante queries
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-guardians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-group-enrollments'] });
      
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      
      toast({
        title: "Student verwijderd",
        description: "De student is succesvol verwijderd.",
      });
    },
    onError: (error) => {
      console.error("Fout bij verwijderen student:", error);
      toast({
        title: "Fout bij verwijderen student",
        description: error instanceof Error ? error.message : "Er is een onbekende fout opgetreden",
        variant: "destructive",
      });
    }
  });

  // Delete multiple students mutation
  const deleteMultipleStudentsMutation = useMutation({
    mutationFn: (ids: string[]) => {
      return apiRequest('/api/students/batch', {
        method: 'DELETE',
        body: { ids }
      });
    },
    onSuccess: () => {
      // Invalideer alle relevante queries
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/dashboard/recent-students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-guardians'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-programs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/attendance'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-group-enrollments'] });
      
      setSelectedStudents([]);
      
      toast({
        title: "Studenten verwijderd",
        description: `${ids.length} studenten zijn succesvol verwijderd.`,
      });
    },
    onError: (error) => {
      console.error("Fout bij verwijderen van meerdere studenten:", error);
      toast({
        title: "Fout bij verwijderen",
        description: error instanceof Error ? error.message : "Er is een onbekende fout opgetreden",
        variant: "destructive",
      });
    }
  });

  // Function to reset form
  const resetForm = () => {
    setStudentFormData({
      studentId: '',
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: null,
      address: '',
      street: '',
      houseNumber: '',
      postalCode: '',
      city: '',
      programId: null,
      yearLevel: '',
      schoolYear: '',
      studentGroupId: null,
      enrollmentDate: '',
      status: 'active',
      notes: '',
      gender: '',
    });
    setSelectedPrograms([]);
  };

  // Function to handle student creation
  const handleCreateStudent = () => {
    // Validatie
    if (!studentFormData.firstName || !studentFormData.lastName) {
      alert('Vul alstublieft voornaam en achternaam in');
      return;
    }

    // Maak een kopie van de data om te versturen, zonder studentId (wordt automatisch gegenereerd door server)
    const { studentId, ...restData } = studentFormData;
    const dataToSubmit = {
      ...restData,
      programs: selectedPrograms.length > 0 ? selectedPrograms : 
        (studentFormData.programId ? [{ 
          programId: studentFormData.programId, 
          yearLevel: studentFormData.yearLevel 
        }] : [])
    };

    createStudentMutation.mutate(dataToSubmit);
  };

  // Function to handle student update
  const handleUpdateStudent = () => {
    if (!selectedStudent) return;

    // Maak een kopie van de data om te versturen
    const dataToSubmit = {
      ...studentFormData,
      programs: selectedPrograms.length > 0 ? selectedPrograms : 
        (studentFormData.programId ? [{ 
          programId: studentFormData.programId, 
          yearLevel: studentFormData.yearLevel 
        }] : [])
    };

    updateStudentMutation.mutate({
      id: selectedStudent.id,
      data: dataToSubmit
    });
  };

  // Function to handle student deletion
  const handleDeleteStudent = () => {
    if (!selectedStudent) return;
    deleteStudentMutation.mutate(selectedStudent.id);
  };

  // Function to delete multiple students
  const handleDeleteMultipleStudents = () => {
    if (selectedStudents.length === 0) return;
    deleteMultipleStudentsMutation.mutate(selectedStudents);
  };

  // Function to view student details
  const handleViewStudentDetails = async (student: any) => {
    const details = await getStudentDetails(student.id);
    setSelectedStudent(details);
    setIsStudentDetailDialogOpen(true);
  };

  // Function to edit student
  const handleEditStudent = async (student: any) => {
    const details = await getStudentDetails(student.id);
    setSelectedStudent(details);
    
    // Set form data
    setStudentFormData({
      studentId: details.studentId || '',
      firstName: details.firstName || '',
      lastName: details.lastName || '',
      email: details.email || '',
      phone: details.phone || '',
      dateOfBirth: details.dateOfBirth || null,
      address: details.address || '',
      street: details.street || '',
      houseNumber: details.houseNumber || '',
      postalCode: details.postalCode || '',
      city: details.city || '',
      programId: details.programs && details.programs[0] ? details.programs[0].programId : null,
      yearLevel: details.programs && details.programs[0] ? details.programs[0].yearLevel : '',
      schoolYear: details.schoolYear || '',
      studentGroupId: details.studentGroupId || null,
      enrollmentDate: details.enrollmentDate || '',
      status: details.status || 'active',
      notes: details.notes || '',
      gender: details.gender || '',
    });
    
    // Set selected programs
    if (details.programs && details.programs.length > 0) {
      setSelectedPrograms(details.programs.map((p: any) => ({
        programId: p.programId,
        yearLevel: p.yearLevel
      })));
    } else {
      setSelectedPrograms([]);
    }
    
    setIsEditDialogOpen(true);
  };

  // Function to export student data as PDF
  const exportStudentsAsPDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(18);
    doc.text('Studentenlijst', 14, 22);
    
    // Subtitle with date
    doc.setFontSize(11);
    doc.setTextColor(100);
    doc.text(`Geëxporteerd op ${new Date().toLocaleDateString('nl-NL')}`, 14, 30);
    
    const students = studentsData.students || [];
    
    // Filter columns to include in PDF
    const tableColumn = ["ID", "Naam", "Email", "Telefoon", "Status"];
    
    // Map the data to match the columns
    const tableRows = students.map((student: any) => [
      student.studentId,
      `${student.firstName} ${student.lastName}`,
      student.email,
      student.phone,
      student.status === 'active' ? 'Actief' : 
      student.status === 'pending' ? 'In Afwachting' : 
      student.status === 'inactive' ? 'Inactief' : 'Afgestudeerd'
    ]);
    
    // Generate the PDF
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 40,
      styles: {
        fontSize: 10,
        cellPadding: 3,
        lineColor: [200, 200, 200]
      },
      headStyles: {
        fillColor: [59, 89, 152],
        textColor: 255,
        fontStyle: 'bold'
      },
      alternateRowStyles: {
        fillColor: [240, 240, 240]
      }
    });
    
    doc.save('studentenlijst.pdf');
  };

  // Filter unique year levels for dropdown
  const yearLevels = Array.from(
    new Set(
      (studentsData.students || []).map((s: any) => 
        s.programs && s.programs[0] ? s.programs[0].yearLevel : null
      ).filter(Boolean)
    )
  );

  // Handle checkbox selection
  const handleSelectStudent = (studentId: string) => {
    if (selectedStudents.includes(studentId)) {
      setSelectedStudents(selectedStudents.filter(id => id !== studentId));
    } else {
      setSelectedStudents([...selectedStudents, studentId]);
    }
  };

  // Handle select all
  const handleSelectAll = () => {
    if (selectedStudents.length === (studentsData.students || []).length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents((studentsData.students || []).map((s: any) => s.id));
    }
  };

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Actief</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">In Afwachting</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Inactief</Badge>;
      case 'graduated':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Afgestudeerd</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
    }
  };

  // Programs and student groups arrays
  const programs = programsData.programs || [];
  const studentGroups = studentGroupsData.studentGroups || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-4">
        <div>
          <div className="flex items-center">
            <div className="mr-3 text-[#1e3a8a] bg-blue-100 rounded-lg p-2">
              <Users className="h-6 w-6" />
            </div>
            <h1 className="text-2xl font-semibold text-[#1e3a8a]">Studenten</h1>
          </div>
          <p className="text-gray-500 text-sm mt-1 ml-11">
            Bekijk en beheer alle studentgegevens
          </p>
        </div>
      </div>

      {/* Notification dialog voor nieuw betalingsrecord */}
      <Dialog open={isFeeNotificationOpen} onOpenChange={setIsFeeNotificationOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center text-lg font-semibold">
              <CreditCard className="mr-2 h-5 w-5 text-[#1e3a8a]" />
              Betalingsrecord aangemaakt
            </DialogTitle>
            <DialogDescription>
              Er is automatisch een betalingsrecord aangemaakt voor deze student.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {feeDetails && (
              <div className="rounded-lg border p-4 bg-blue-50">
                <div className="mb-4 font-medium text-blue-900">Details betalingsrecord:</div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Factuurnummer:</span>
                    <span className="font-medium">{feeDetails.invoiceNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Bedrag:</span>
                    <span className="font-medium">{new Intl.NumberFormat('nl-NL', { style: 'currency', currency: 'EUR' }).format(feeDetails.amount)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Vervaldatum:</span>
                    <span className="font-medium">{new Date(feeDetails.dueDate).toLocaleDateString('nl-NL')}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium">Niet betaald</span>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex items-center bg-amber-50 p-4 rounded-lg">
              <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
              <span className="text-sm text-amber-800">
                U kunt deze betaling beheren via de Betalingsbeheer pagina. 
                Daar kunt u ook korting toepassen of de betaalstatus bijwerken.
              </span>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 sm:justify-between">
            <Button
              variant="outline"
              onClick={() => setIsFeeNotificationOpen(false)}
            >
              Sluiten
            </Button>
            <Button
              onClick={() => {
                setIsFeeNotificationOpen(false);
                // Hier navigeren we naar de betalingsbeheer pagina
                window.location.href = '/fees';
              }}
              className="bg-[#1e3a8a] hover:bg-blue-800"
            >
              Naar betalingsbeheer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <div className="mb-6 flex flex-col md:flex-row gap-4 justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="search"
              placeholder="Zoek studenten..."
              className="pl-8 bg-white"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="default"
              className="border-gray-300 text-gray-700"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
            >
              <Filter className="mr-2 h-4 w-4" /> Filteren
            </Button>
            
            <Button 
              variant="outline" 
              size="default"
              className="border-gray-300 text-gray-700"
              onClick={exportStudentsAsPDF}
            >
              <Download className="mr-2 h-4 w-4" /> Exporteren
            </Button>
          </div>
        </div>
        
        <Button 
          variant="default" 
          size="default" 
          className="bg-primary hover:bg-primary/90"
          onClick={() => {
            resetForm();
            setIsCreateDialogOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" /> Student Toevoegen
        </Button>
      </div>

      {/* Filter opties */}
      {showFilterOptions && (
        <div className="mb-6 bg-white p-4 rounded-md border border-gray-200 shadow-sm">
          <h3 className="text-lg font-medium mb-4">Filter Opties</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="program-filter">Programma</Label>
              <Select 
                value={selectedProgramFilter} 
                onValueChange={setSelectedProgramFilter}
              >
                <SelectTrigger id="program-filter" className="bg-white">
                  <SelectValue placeholder="Alle programma's" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle programma's</SelectItem>
                  {programs.map((program: any) => (
                    <SelectItem key={program.id} value={program.id.toString()}>
                      {program.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="year-filter">Leerjaar</Label>
              <Select 
                value={selectedYearLevelFilter} 
                onValueChange={setSelectedYearLevelFilter}
              >
                <SelectTrigger id="year-filter" className="bg-white">
                  <SelectValue placeholder="Alle leerjaren" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle leerjaren</SelectItem>
                  {yearLevels.map((year: any) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select 
                value={selectedStatusFilter} 
                onValueChange={setSelectedStatusFilter}
              >
                <SelectTrigger id="status-filter" className="bg-white">
                  <SelectValue placeholder="Alle statussen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle statussen</SelectItem>
                  {statusOptions.map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="group-filter">Klas</Label>
              <Select 
                value={selectedStudentGroupFilter} 
                onValueChange={setSelectedStudentGroupFilter}
              >
                <SelectTrigger id="group-filter" className="bg-white">
                  <SelectValue placeholder="Alle klassen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle klassen</SelectItem>
                  {studentGroups.map((group: any) => (
                    <SelectItem key={group.id} value={group.id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Studenten tabel - responsieve weergave */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
        {/* Desktop weergave */}
        <div className="hidden md:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox 
                    checked={
                      selectedStudents.length > 0 && 
                      selectedStudents.length === (studentsData.students || []).length
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>Student ID</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Programma</TableHead>
                <TableHead>Leerjaar</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                      <span className="ml-2">Laden...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (Array.isArray(studentsData) ? studentsData : []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Geen studenten gevonden
                  </TableCell>
                </TableRow>
              ) : (
                (Array.isArray(studentsData) ? studentsData : []).map((student: any) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => handleSelectStudent(student.id)}
                        aria-label={`Select ${student.firstName}`}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{student.studentId}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-[#1e3a8a] text-white">
                            {student.firstName[0]}{student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        {student.firstName} {student.lastName}
                      </div>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      {student.programs && student.programs[0] 
                        ? programs.find((p: any) => p.id === student.programs[0].programId)?.name 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {student.programs && student.programs[0] 
                        ? student.programs[0].yearLevel 
                        : '-'}
                    </TableCell>
                    <TableCell>
                      {renderStatusBadge(student.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleViewStudentDetails(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => handleEditStudent(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        
        {/* Mobiele kaartweergave */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Laden...</span>
            </div>
          ) : (Array.isArray(studentsData) ? studentsData : []).length === 0 ? (
            <div className="text-center py-8">
              Geen studenten gevonden
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {(Array.isArray(studentsData) ? studentsData : []).map((student: any) => (
                <div key={student.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start">
                      <Checkbox 
                        className="mt-1 mr-2"
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => handleSelectStudent(student.id)}
                        aria-label={`Select ${student.firstName}`}
                      />
                      <div>
                        <div className="flex items-center">
                          <Avatar className="h-10 w-10 mr-2">
                            <AvatarFallback className="bg-[#1e3a8a] text-white">
                              {student.firstName?.[0] || ""}{student.lastName?.[0] || ""}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-xs text-gray-500">{student.studentId}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center">
                      {renderStatusBadge(student.status)}
                      <div className="flex ml-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewStudent(student.id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditStudent(student.id)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div className="ml-10 space-y-1 text-sm">
                    <div className="flex items-baseline">
                      <span className="text-gray-500 w-24">Email:</span>
                      <span className="text-sm text-gray-900 truncate">{student.email}</span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-gray-500 w-24">Programma:</span>
                      <span className="text-sm text-gray-900">
                        {student.programs && student.programs[0] 
                          ? programs.find((p: any) => p.id === student.programs[0].programId)?.name 
                          : '-'}
                      </span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-gray-500 w-24">Leerjaar:</span>
                      <span className="text-sm text-gray-900">
                        {student.programs && student.programs[0] 
                          ? student.programs[0].yearLevel 
                          : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Batch acties */}
        {selectedStudents.length > 0 && (
          <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
            <div className="text-sm">
              {selectedStudents.length} student(en) geselecteerd
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteMultipleStudents}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Verwijder geselecteerde
            </Button>
          </div>
        )}

        {/* Paginering */}
        {(studentsData.students || []).length > 0 && (
          <div className="p-4 border-t border-gray-200">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page > 1) setPage(page - 1);
                    }}
                  />
                </PaginationItem>
                
                {/* Toon paginanummers */}
                {Array.from({ length: Math.ceil((studentsData.totalCount || 0) / 10) }, (_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink 
                      href="#"
                      isActive={page === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        setPage(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (page < Math.ceil((studentsData.totalCount || 0) / 10)) {
                        setPage(page + 1);
                      }
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}
      </div>

      {/* Create Student Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[95%] max-h-[96vh] h-auto">
          <DialogHeader>
            <DialogTitle>Nieuwe Student Toevoegen</DialogTitle>
            <DialogDescription>
              Vul de studentinformatie in om een nieuwe student toe te voegen aan het systeem.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-2">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid grid-cols-4 mb-2">
                <TabsTrigger value="personal">
                  <User className="mr-2 h-4 w-4" />
                  Persoonlijk
                </TabsTrigger>
                <TabsTrigger value="contact">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact
                </TabsTrigger>
                <TabsTrigger value="address">
                  <MapPin className="mr-2 h-4 w-4" />
                  Adres
                </TabsTrigger>
                <TabsTrigger value="class">
                  <School className="mr-2 h-4 w-4" />
                  Klas
                </TabsTrigger>
              </TabsList>
              

              
              {/* Persoonlijke informatie tab */}
              <TabsContent value="personal" className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <h3 className="text-base font-semibold text-primary mb-1">Persoonlijke gegevens</h3>
                  
                  {/* Foto upload sectie */}
                  <div className="flex mb-0 mt-0 items-start">
                    <div 
                      className="w-24 h-24 flex items-center justify-center overflow-hidden relative group cursor-pointer mr-4"
                      onClick={() => {
                        const fileInput = document.getElementById('student-photo') as HTMLInputElement;
                        fileInput?.click();
                      }}
                    >
                      <img id="student-photo-preview" src="" alt="" className="w-full h-full object-cover hidden" />
                      <div id="student-photo-placeholder" className="w-full h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-full">
                        <User className="h-10 w-10 text-gray-300" />
                        <div className="absolute bottom-0 right-0 bg-[#1e3a8a] rounded-full p-1.5 shadow-sm">
                          <Upload className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                      
                      {/* Verwijder-knop verschijnt alleen bij hover als er een foto is */}
                      <div 
                        className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hidden"
                        id="photo-delete-overlay"
                        onClick={(e) => {
                          e.stopPropagation();
                          const photoPreview = document.getElementById('student-photo-preview') as HTMLImageElement;
                          const photoPlaceholder = document.getElementById('student-photo-placeholder');
                          const photoDeleteOverlay = document.getElementById('photo-delete-overlay');
                          const fileInput = document.getElementById('student-photo') as HTMLInputElement;
                          
                          if (photoPreview && photoPlaceholder && fileInput && photoDeleteOverlay) {
                            photoPreview.src = '';
                            photoPreview.classList.add('hidden');
                            photoPlaceholder.classList.remove('hidden');
                            photoDeleteOverlay.classList.add('hidden');
                            fileInput.value = '';
                          }
                        }}
                      >
                        <Trash2 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    
                    <input 
                      type="file" 
                      id="student-photo" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = function(event) {
                            const photoPreview = document.getElementById('student-photo-preview') as HTMLImageElement;
                            const photoPlaceholder = document.getElementById('student-photo-placeholder');
                            const photoDeleteOverlay = document.getElementById('photo-delete-overlay');
                            
                            if (photoPreview && photoPlaceholder && photoDeleteOverlay && event.target?.result) {
                              photoPreview.src = event.target.result as string;
                              photoPreview.classList.remove('hidden');
                              photoPlaceholder.classList.add('hidden');
                              photoDeleteOverlay.classList.remove('hidden');
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  
                  <div className="flex mt-0 mb-0 justify-end">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center border border-gray-300 text-xs h-7"
                      onClick={() => {
                        // Get access to toast context within this function
                        const localToast = toast;
                        
                        localToast({
                          title: "eID detectie",
                          description: "Zoeken naar eID-kaartlezer...",
                        });
                        
                        // Simuleer eID detectie (in werkelijkheid zou dit een echte API-integratie zijn)
                        setTimeout(() => {
                          localToast({
                            title: "eID gedetecteerd",
                            description: "Gegevens worden geladen van de identiteitskaart...",
                          });
                          
                          // Simuleer laden van eID gegevens na 2 seconden
                          setTimeout(() => {
                            // Hier zouden we de kaartgegevens verwerken
                            // In een echte implementatie zou dit komen van de eID API
                            const eidData = {
                              firstName: "Amina",
                              lastName: "El Alaoui",
                              birthDate: "2012-05-15",
                              nationalRegisterNumber: "012051534567",
                              gender: "Vrouwelijk",
                              street: "Molenbeekstraat",
                              houseNumber: "45",
                              postalCode: "1080",
                              city: "Brussel",
                              photoUrl: "https://placehold.co/400x400/eee/31316a?text=Foto+eID"
                            };
                            
                            // Simuleer het laden van de foto uit de eID
                            const photoPreview = document.getElementById('student-photo-preview') as HTMLImageElement;
                            const photoPlaceholder = document.getElementById('student-photo-placeholder');
                            
                            if (photoPreview && photoPlaceholder) {
                              photoPreview.src = eidData.photoUrl;
                              photoPreview.classList.remove('hidden');
                              photoPlaceholder.classList.add('hidden');
                            }
                            
                            // Vul het formulier in met eID-gegevens
                            setStudentFormData({
                              ...studentFormData,
                              firstName: eidData.firstName,
                              lastName: eidData.lastName,
                              dateOfBirth: eidData.birthDate,
                              nationalNumber: eidData.nationalRegisterNumber,
                              gender: eidData.gender === "Vrouwelijk" ? "vrouw" : "man",
                              street: eidData.street,
                              houseNumber: eidData.houseNumber,
                              postalCode: eidData.postalCode,
                              city: eidData.city
                            });
                            
                            // Voeg een extra bericht toe dat de foto ook beschikbaar is in de foto-tab
                            localToast({
                              title: "Gegevens geladen",
                              description: "De gegevens van de eID zijn succesvol ingeladen. De foto is ook zichtbaar in de foto-tab.",
                            });
                            
                            // Toon een visuele hint dat er ook naar de foto tab gekeken moet worden
                            const photoTabTrigger = document.querySelector('button[value="photo"]');
                            if (photoTabTrigger) {
                              photoTabTrigger.classList.add('animate-pulse');
                              setTimeout(() => {
                                photoTabTrigger.classList.remove('animate-pulse');
                              }, 3000);
                            }
                          }, 2000);
                        }, 1500);
                      }}
                    >
                      <span className="mr-2 bg-[#77CC9A] text-white rounded-md px-1 font-bold text-xs py-0.5">be|ID</span>
                      Gegevens laden via eID
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="studentId" className="text-xs font-medium text-gray-700">
                        StudentID <span className="text-muted-foreground text-xs">(automatisch)</span>
                      </Label>
                      <Input
                        id="studentId"
                        value={nextStudentIdData?.nextStudentId || "Wordt geladen..."}
                        disabled
                        className="mt-0.5 h-8 text-sm bg-gray-100 text-gray-500 font-medium"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="status" className="text-xs font-medium text-gray-700">
                        Status <span className="text-primary">*</span>
                      </Label>
                      <Select
                        value={studentFormData.status}
                        onValueChange={(value) => setStudentFormData({ ...studentFormData, status: value })}
                      >
                        <SelectTrigger id="status" className="mt-0.5 h-8 text-sm bg-white">
                          <SelectValue placeholder="Selecteer status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">
                        Voornaam <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={studentFormData.firstName}
                        onChange={(e) => setStudentFormData({ ...studentFormData, firstName: e.target.value })}
                        className="mt-0.5 h-8 text-sm bg-white"
                        placeholder="Voornaam"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">
                        Achternaam <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        value={studentFormData.lastName}
                        onChange={(e) => setStudentFormData({ ...studentFormData, lastName: e.target.value })}
                        className="mt-0.5 h-8 text-sm bg-white"
                        placeholder="Achternaam"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                        Geslacht
                      </Label>
                      <Select
                        value={studentFormData.gender}
                        onValueChange={(value) => setStudentFormData({ ...studentFormData, gender: value })}
                      >
                        <SelectTrigger id="gender" className="mt-1 bg-white">
                          <SelectValue placeholder="Selecteer geslacht" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                        Geboortedatum
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={studentFormData.dateOfBirth || ''}
                        onChange={(e) => setStudentFormData({ ...studentFormData, dateOfBirth: e.target.value })}
                        className="mt-1 bg-white"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                        Notities
                      </Label>
                      <Textarea
                        id="notes"
                        value={studentFormData.notes}
                        onChange={(e) => setStudentFormData({ ...studentFormData, notes: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="Voeg hier aanvullende informatie toe..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Contact informatie tab */}
              <TabsContent value="contact" className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-4">Contactgegevens</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={studentFormData.email}
                        onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="student@mymadrassa.nl"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Telefoonnummer
                      </Label>
                      <Input
                        id="phone"
                        value={studentFormData.phone}
                        onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="06 1234 5678"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="enrollmentDate" className="text-sm font-medium text-gray-700">
                        Inschrijvingsdatum
                      </Label>
                      <Input
                        id="enrollmentDate"
                        type="date"
                        value={studentFormData.enrollmentDate}
                        onChange={(e) => setStudentFormData({ ...studentFormData, enrollmentDate: e.target.value })}
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Adres informatie tab */}
              <TabsContent value="address" className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-4">Adresgegevens</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="street" className="text-sm font-medium text-gray-700">
                        Straat
                      </Label>
                      <Input
                        id="street"
                        value={studentFormData.street}
                        onChange={(e) => setStudentFormData({ ...studentFormData, street: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="Straatnaam"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="houseNumber" className="text-sm font-medium text-gray-700">
                        Huisnummer
                      </Label>
                      <Input
                        id="houseNumber"
                        value={studentFormData.houseNumber}
                        onChange={(e) => setStudentFormData({ ...studentFormData, houseNumber: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="123"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
                        Postcode
                      </Label>
                      <Input
                        id="postalCode"
                        value={studentFormData.postalCode}
                        onChange={(e) => setStudentFormData({ ...studentFormData, postalCode: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="1234 AB"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                        Stad
                      </Label>
                      <Input
                        id="city"
                        value={studentFormData.city}
                        onChange={(e) => setStudentFormData({ ...studentFormData, city: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="Amsterdam"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Klas toewijzing tab */}
              <TabsContent value="class" className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-primary">Klas Toewijzing</h3>
                    {studentFormData.studentGroupId && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
                        Klas toegewezen
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-6">
                    <p className="text-sm text-gray-500">
                      Wijs de student toe aan een klas. Een student kan maar in één klas zitten.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <Label htmlFor="schoolYear" className="text-sm font-medium text-gray-700">
                          Schooljaar <span className="text-primary">*</span>
                        </Label>
                        <div className="mt-2">
                          <Select
                            value={studentFormData.schoolYear || 'geen'}
                            onValueChange={(value) => setStudentFormData({ 
                              ...studentFormData, 
                              schoolYear: value === 'geen' ? '' : value
                            })}
                          >
                            <SelectTrigger className="border-gray-200 bg-white">
                              <SelectValue placeholder="Selecteer schooljaar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="geen">Selecteer schooljaar</SelectItem>
                              <SelectItem value="2024-2025">2024-2025</SelectItem>
                              <SelectItem value="2025-2026">2025-2026</SelectItem>
                              <SelectItem value="2026-2027">2026-2027</SelectItem>
                              <SelectItem value="2027-2028">2027-2028</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="studentGroupId" className="text-sm font-medium text-gray-700">
                          Selecteer klas
                        </Label>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Select
                              value={studentFormData.studentGroupId?.toString() || 'none'}
                              onValueChange={(value) => setStudentFormData({ 
                                ...studentFormData, 
                                studentGroupId: value === 'none' ? null : parseInt(value) 
                              })}
                            >
                              <SelectTrigger className="border-gray-200 bg-white">
                                <SelectValue placeholder="Selecteer klas" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Geen klas</SelectItem>
                                {studentGroups.map((group: any) => (
                                  <SelectItem key={group.id} value={group.id.toString()}>
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {studentFormData.studentGroupId && (
                      <div className="flex items-center p-4 mt-4 rounded-md bg-blue-50 border border-blue-100">
                        <div className="mr-4 p-2 bg-primary rounded-full">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-primary">
                            {studentGroups.find((g: any) => g.id === studentFormData.studentGroupId)?.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            De student wordt toegewezen aan deze klas
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* Vakken toewijzing tab */}
              <TabsContent value="subjects" className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-primary">Vakken Toewijzing</h3>
                    {selectedPrograms.length > 0 && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
                        {selectedPrograms.length} vakken toegewezen
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    <p className="text-sm text-gray-500">
                      Wijs de student toe aan vakken. Dit is optioneel voor studenten die individuele vakken willen volgen.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="programId" className="text-sm font-medium text-gray-700">
                          Programma
                        </Label>
                        <Select
                          value={studentFormData.programId?.toString() || 'none'}
                          onValueChange={(value) => setStudentFormData({ 
                            ...studentFormData, 
                            programId: value === 'none' ? null : parseInt(value) 
                          })}
                        >
                          <SelectTrigger id="programId" className="mt-1 bg-white">
                            <SelectValue placeholder="Selecteer programma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Selecteer programma</SelectItem>
                            {programs.map((program: any) => (
                              <SelectItem key={program.id} value={program.id.toString()}>
                                {program.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="yearLevel" className="text-sm font-medium text-gray-700">
                          Leerjaar
                        </Label>
                        <Input
                          id="yearLevel"
                          value={studentFormData.yearLevel}
                          onChange={(e) => setStudentFormData({ ...studentFormData, yearLevel: e.target.value })}
                          className="mt-1 bg-white"
                          placeholder="Bijv. Jaar 1"
                        />
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={() => {
                        if (studentFormData.programId) {
                          // Check if program already exists
                          const programExists = selectedPrograms.some(
                            p => p.programId === studentFormData.programId
                          );
                          
                          if (!programExists) {
                            setSelectedPrograms([
                              ...selectedPrograms,
                              {
                                programId: studentFormData.programId,
                                yearLevel: studentFormData.yearLevel
                              }
                            ]);
                          }
                        }
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Voeg programma toe
                    </Button>
                    
                    {/* Geselecteerde programma's */}
                    {selectedPrograms.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Geselecteerde programma's:</h4>
                        <div className="space-y-2">
                          {selectedPrograms.map((program, index) => (
                            <div 
                              key={index}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200"
                            >
                              <div>
                                <span className="font-medium">
                                  {programs.find((p: any) => p.id === program.programId)?.name}
                                </span>
                                <span className="text-sm text-gray-600 ml-2">
                                  ({program.yearLevel})
                                </span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedPrograms(
                                    selectedPrograms.filter((_, i) => i !== index)
                                  );
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setIsCreateDialogOpen(false);
            }}>
              Annuleren
            </Button>
            <Button 
              type="submit" 
              onClick={handleCreateStudent}
              disabled={createStudentMutation.isPending}
            >
              {createStudentMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
              )}
              Student toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[95%] max-h-[90vh] h-auto">
          <DialogHeader>
            <DialogTitle>Student Bewerken</DialogTitle>
            <DialogDescription>
              Werk de gegevens bij voor student: {studentFormData.firstName} {studentFormData.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid grid-cols-5 mb-4">
                <TabsTrigger value="personal">
                  <User className="mr-2 h-4 w-4" />
                  Persoonlijk
                </TabsTrigger>
                <TabsTrigger value="contact">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact
                </TabsTrigger>
                <TabsTrigger value="address">
                  <MapPin className="mr-2 h-4 w-4" />
                  Adres
                </TabsTrigger>
                <TabsTrigger value="class">
                  <Users className="mr-2 h-4 w-4" />
                  Klas
                </TabsTrigger>
                <TabsTrigger value="subjects">
                  <BookOpen className="mr-2 h-4 w-4" />
                  Vakken
                </TabsTrigger>
              </TabsList>
              
              {/* Same tabs as create student dialog */}
              {/* Persoonlijke informatie tab */}
              <TabsContent value="personal" className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-4">Persoonlijke gegevens</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="edit-studentId" className="text-sm font-medium text-gray-700">
                        Studentnummer <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="edit-studentId"
                        value={studentFormData.studentId}
                        onChange={(e) => setStudentFormData({ ...studentFormData, studentId: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="Bijv. S12345"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-status" className="text-sm font-medium text-gray-700">
                        Status <span className="text-primary">*</span>
                      </Label>
                      <Select
                        value={studentFormData.status}
                        onValueChange={(value) => setStudentFormData({ ...studentFormData, status: value })}
                      >
                        <SelectTrigger id="edit-status" className="mt-1 bg-white">
                          <SelectValue placeholder="Selecteer status" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-firstName" className="text-sm font-medium text-gray-700">
                        Voornaam <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="edit-firstName"
                        value={studentFormData.firstName}
                        onChange={(e) => setStudentFormData({ ...studentFormData, firstName: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="Voornaam"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-lastName" className="text-sm font-medium text-gray-700">
                        Achternaam <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="edit-lastName"
                        value={studentFormData.lastName}
                        onChange={(e) => setStudentFormData({ ...studentFormData, lastName: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="Achternaam"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-gender" className="text-sm font-medium text-gray-700">
                        Geslacht
                      </Label>
                      <Select
                        value={studentFormData.gender}
                        onValueChange={(value) => setStudentFormData({ ...studentFormData, gender: value })}
                      >
                        <SelectTrigger id="edit-gender" className="mt-1 bg-white">
                          <SelectValue placeholder="Selecteer geslacht" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-dateOfBirth" className="text-sm font-medium text-gray-700">
                        Geboortedatum
                      </Label>
                      <Input
                        id="edit-dateOfBirth"
                        type="date"
                        value={studentFormData.dateOfBirth || ''}
                        onChange={(e) => setStudentFormData({ ...studentFormData, dateOfBirth: e.target.value })}
                        className="mt-1 bg-white"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-notes" className="text-sm font-medium text-gray-700">
                        Notities
                      </Label>
                      <Textarea
                        id="edit-notes"
                        value={studentFormData.notes}
                        onChange={(e) => setStudentFormData({ ...studentFormData, notes: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="Voeg hier aanvullende informatie toe..."
                        rows={4}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Contact informatie tab */}
              <TabsContent value="contact" className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-4">Contactgegevens</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="edit-email" className="text-sm font-medium text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="edit-email"
                        type="email"
                        value={studentFormData.email}
                        onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="student@mymadrassa.nl"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-phone" className="text-sm font-medium text-gray-700">
                        Telefoonnummer
                      </Label>
                      <Input
                        id="edit-phone"
                        value={studentFormData.phone}
                        onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="06 1234 5678"
                      />
                    </div>
                    
                    <div className="md:col-span-2">
                      <Label htmlFor="edit-enrollmentDate" className="text-sm font-medium text-gray-700">
                        Inschrijvingsdatum
                      </Label>
                      <Input
                        id="edit-enrollmentDate"
                        type="date"
                        value={studentFormData.enrollmentDate}
                        onChange={(e) => setStudentFormData({ ...studentFormData, enrollmentDate: e.target.value })}
                        className="mt-1 bg-white"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Adres informatie tab */}
              <TabsContent value="address" className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-4">Adresgegevens</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="edit-street" className="text-sm font-medium text-gray-700">
                        Straat
                      </Label>
                      <Input
                        id="edit-street"
                        value={studentFormData.street}
                        onChange={(e) => setStudentFormData({ ...studentFormData, street: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="Straatnaam"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-houseNumber" className="text-sm font-medium text-gray-700">
                        Huisnummer
                      </Label>
                      <Input
                        id="edit-houseNumber"
                        value={studentFormData.houseNumber}
                        onChange={(e) => setStudentFormData({ ...studentFormData, houseNumber: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="123"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-postalCode" className="text-sm font-medium text-gray-700">
                        Postcode
                      </Label>
                      <Input
                        id="edit-postalCode"
                        value={studentFormData.postalCode}
                        onChange={(e) => setStudentFormData({ ...studentFormData, postalCode: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="1234 AB"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="edit-city" className="text-sm font-medium text-gray-700">
                        Stad
                      </Label>
                      <Input
                        id="edit-city"
                        value={studentFormData.city}
                        onChange={(e) => setStudentFormData({ ...studentFormData, city: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="Amsterdam"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Klas toewijzing tab */}
              <TabsContent value="class" className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-primary">Klas Toewijzing</h3>
                    {studentFormData.studentGroupId && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
                        Klas toegewezen
                      </Badge>
                    )}
                  </div>
                  <div className="space-y-6">
                    <p className="text-sm text-gray-500">
                      Wijs de student toe aan een klas. Een student kan maar in één klas zitten.
                    </p>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div>
                        <Label htmlFor="edit-schoolYear" className="text-sm font-medium text-gray-700">
                          Schooljaar <span className="text-primary">*</span>
                        </Label>
                        <div className="mt-2">
                          <Select
                            value={studentFormData.schoolYear || 'geen'}
                            onValueChange={(value) => setStudentFormData({ 
                              ...studentFormData, 
                              schoolYear: value === 'geen' ? '' : value
                            })}
                          >
                            <SelectTrigger className="border-gray-200 bg-white">
                              <SelectValue placeholder="Selecteer schooljaar" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="geen">Selecteer schooljaar</SelectItem>
                              <SelectItem value="2024-2025">2024-2025</SelectItem>
                              <SelectItem value="2025-2026">2025-2026</SelectItem>
                              <SelectItem value="2026-2027">2026-2027</SelectItem>
                              <SelectItem value="2027-2028">2027-2028</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-studentGroupId" className="text-sm font-medium text-gray-700">
                          Selecteer klas
                        </Label>
                        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Select
                              value={studentFormData.studentGroupId?.toString() || 'none'}
                              onValueChange={(value) => setStudentFormData({ 
                                ...studentFormData, 
                                studentGroupId: value === 'none' ? null : parseInt(value) 
                              })}
                            >
                              <SelectTrigger className="border-gray-200 bg-white">
                                <SelectValue placeholder="Selecteer klas" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">Geen klas</SelectItem>
                                {studentGroups.map((group: any) => (
                                  <SelectItem key={group.id} value={group.id.toString()}>
                                    {group.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {studentFormData.studentGroupId && (
                      <div className="flex items-center p-4 mt-4 rounded-md bg-blue-50 border border-blue-100">
                        <div className="mr-4 p-2 bg-primary rounded-full">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h4 className="font-medium text-primary">
                            {studentGroups.find((g: any) => g.id === studentFormData.studentGroupId)?.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            De student wordt toegewezen aan deze klas
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              {/* Vakken toewijzing tab */}
              <TabsContent value="subjects" className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-primary">Vakken Toewijzing</h3>
                    {selectedPrograms.length > 0 && (
                      <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 font-medium">
                        {selectedPrograms.length} vakken toegewezen
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-6">
                    <p className="text-sm text-gray-500">
                      Wijs de student toe aan vakken. Dit is optioneel voor studenten die individuele vakken willen volgen.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="edit-programId" className="text-sm font-medium text-gray-700">
                          Programma
                        </Label>
                        <Select
                          value={studentFormData.programId?.toString() || 'none'}
                          onValueChange={(value) => setStudentFormData({ 
                            ...studentFormData, 
                            programId: value === 'none' ? null : parseInt(value) 
                          })}
                        >
                          <SelectTrigger id="edit-programId" className="mt-1 bg-white">
                            <SelectValue placeholder="Selecteer programma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Selecteer programma</SelectItem>
                            {programs.map((program: any) => (
                              <SelectItem key={program.id} value={program.id.toString()}>
                                {program.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="edit-yearLevel" className="text-sm font-medium text-gray-700">
                          Leerjaar
                        </Label>
                        <Input
                          id="edit-yearLevel"
                          value={studentFormData.yearLevel}
                          onChange={(e) => setStudentFormData({ ...studentFormData, yearLevel: e.target.value })}
                          className="mt-1 bg-white"
                          placeholder="Bijv. Jaar 1"
                        />
                      </div>
                    </div>
                    
                    <Button
                      type="button"
                      variant="outline"
                      className="mt-2"
                      onClick={() => {
                        if (studentFormData.programId) {
                          // Check if program already exists
                          const programExists = selectedPrograms.some(
                            p => p.programId === studentFormData.programId
                          );
                          
                          if (!programExists) {
                            setSelectedPrograms([
                              ...selectedPrograms,
                              {
                                programId: studentFormData.programId,
                                yearLevel: studentFormData.yearLevel
                              }
                            ]);
                          }
                        }
                      }}
                    >
                      <PlusCircle className="mr-2 h-4 w-4" /> Voeg programma toe
                    </Button>
                    
                    {/* Geselecteerde programma's */}
                    {selectedPrograms.length > 0 && (
                      <div className="mt-6">
                        <h4 className="font-medium mb-2">Geselecteerde programma's:</h4>
                        <div className="space-y-2">
                          {selectedPrograms.map((program, index) => (
                            <div 
                              key={index}
                              className="flex justify-between items-center p-3 bg-gray-50 rounded-md border border-gray-200"
                            >
                              <div>
                                <span className="font-medium">
                                  {programs.find((p: any) => p.id === program.programId)?.name}
                                </span>
                                <span className="text-sm text-gray-600 ml-2">
                                  ({program.yearLevel})
                                </span>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                onClick={() => {
                                  setSelectedPrograms(
                                    selectedPrograms.filter((_, i) => i !== index)
                                  );
                                }}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              resetForm();
              setIsEditDialogOpen(false);
            }}>
              Annuleren
            </Button>
            <Button 
              type="submit" 
              onClick={handleUpdateStudent}
              disabled={updateStudentMutation.isPending}
            >
              {updateStudentMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
              )}
              Wijzigingen opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Student Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Student verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je de student <span className="font-semibold">
                {selectedStudent?.firstName} {selectedStudent?.lastName}
              </span> wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteStudent}
              disabled={deleteStudentMutation.isPending}
            >
              {deleteStudentMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
              )}
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Detail Dialog */}
      <Dialog open={isStudentDetailDialogOpen} onOpenChange={setIsStudentDetailDialogOpen}>
        <DialogContent className="sm:max-w-[95%] max-h-[96vh] h-auto">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription>
              Gedetailleerde informatie over {selectedStudent?.firstName} {selectedStudent?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="py-2">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid grid-cols-4 mb-2">
                  <TabsTrigger value="personal">
                    <User className="mr-2 h-4 w-4" />
                    Persoonlijk
                  </TabsTrigger>
                  <TabsTrigger value="contact">
                    <Phone className="mr-2 h-4 w-4" />
                    Contact
                  </TabsTrigger>
                  <TabsTrigger value="address">
                    <MapPin className="mr-2 h-4 w-4" />
                    Adres
                  </TabsTrigger>
                  <TabsTrigger value="class">
                    <Users className="mr-2 h-4 w-4" />
                    Klas
                  </TabsTrigger>
                </TabsList>
                
                {/* Persoonlijke informatie tab */}
                <TabsContent value="personal" className="pt-2">
                  <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-primary mb-4">Persoonlijke gegevens</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div className="md:col-span-2 flex">
                        <div className="mr-4">
                          <Avatar className="h-16 w-16">
                            <AvatarFallback className="bg-[#1e3a8a] text-white text-xl">
                              {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold mb-1">
                            {selectedStudent.firstName} {selectedStudent.lastName}
                          </h2>
                          <p className="text-gray-600">{selectedStudent.studentId}</p>
                          <div className="mt-2">
                            {renderStatusBadge(selectedStudent.status)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="md:col-span-1">
                        <p className="text-sm font-medium text-gray-700">Geboortedatum</p>
                        <p className="mt-1">{selectedStudent.dateOfBirth ? formatDateToDisplayFormat(selectedStudent.dateOfBirth) : "Niet ingevuld"}</p>
                      </div>
                      <div className="md:col-span-1">
                        <p className="text-sm font-medium text-gray-700">Geslacht</p>
                        <p className="mt-1">
                          {selectedStudent.gender === 'man' ? 'Man' : 
                           selectedStudent.gender === 'vrouw' ? 'Vrouw' : 'Niet ingevuld'}
                        </p>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Notities</p>
                        <p className="mt-1 whitespace-pre-wrap">{selectedStudent.notes || "Geen notities"}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Contact tab */}
                <TabsContent value="contact" className="pt-2">
                  <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-primary mb-4">Contactgegevens</h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Email</p>
                          <p className="mt-1 flex items-center">
                            <Mail className="h-4 w-4 mr-2 text-gray-500" />
                            {selectedStudent.email || "Niet ingevuld"}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Telefoonnummer</p>
                          <p className="mt-1 flex items-center">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            {selectedStudent.phone || "Niet ingevuld"}
                          </p>
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700">Inschrijvingsdatum</p>
                        <p className="mt-1">
                          {selectedStudent.enrollmentDate 
                            ? formatDateToDisplayFormat(selectedStudent.enrollmentDate) 
                            : "Niet ingevuld"}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Adres tab */}
                <TabsContent value="address" className="pt-2">
                  <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-primary mb-4">Adresgegevens</h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="flex items-start">
                        <MapPin className="h-5 w-5 mr-2 mt-0.5 text-gray-500" />
                        <div>
                          <p className="font-medium">
                            {selectedStudent.street} {selectedStudent.houseNumber}
                          </p>
                          <p className="text-gray-600">
                            {selectedStudent.postalCode} {selectedStudent.city}
                          </p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Straat</p>
                          <p className="mt-1">{selectedStudent.street || "Niet ingevuld"}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Huisnummer</p>
                          <p className="mt-1">{selectedStudent.houseNumber || "Niet ingevuld"}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Postcode</p>
                          <p className="mt-1">{selectedStudent.postalCode || "Niet ingevuld"}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Stad</p>
                          <p className="mt-1">{selectedStudent.city || "Niet ingevuld"}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Klas tab */}
                <TabsContent value="class" className="pt-2">
                  <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-primary mb-4">Klas Informatie</h3>
                    
                    <div className="grid grid-cols-1 gap-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-700">Schooljaar</p>
                          <p className="mt-1">{selectedStudent.schoolYear || "Niet toegewezen"}</p>
                        </div>
                        
                        <div>
                          <p className="text-sm font-medium text-gray-700">Klas</p>
                          <p className="mt-1">
                            {selectedStudent.studentGroupId 
                              ? studentGroups.find((g: any) => g.id === selectedStudent.studentGroupId)?.name
                              : "Niet toegewezen"}
                          </p>
                        </div>
                      </div>
                      
                      {selectedStudent.studentGroupId && (
                        <div className="flex items-center p-4 mt-2 rounded-md bg-blue-50 border border-blue-100">
                          <div className="mr-4 p-2 bg-primary rounded-full">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-medium text-primary">
                              {studentGroups.find((g: any) => g.id === selectedStudent.studentGroupId)?.name}
                            </h4>
                            <p className="text-sm text-gray-600">
                              De student is toegewezen aan deze klas
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>
                
                {/* Vakken tab */}
                <TabsContent value="subjects" className="pt-2">
                  <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                    <h3 className="text-lg font-semibold text-primary mb-4">Vakken Informatie</h3>
                    
                    {(!selectedStudent.programs || selectedStudent.programs.length === 0) ? (
                      <div className="p-4 bg-gray-50 rounded-md border border-gray-200 text-center">
                        <GraduationCap className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                        <p className="text-gray-600">
                          Deze student volgt geen vakken
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {selectedStudent.programs.map((program: any, index: number) => (
                          <div 
                            key={index}
                            className="flex justify-between items-center p-4 bg-gray-50 rounded-md border border-gray-200"
                          >
                            <div>
                              <h4 className="font-medium">
                                {programs.find((p: any) => p.id === program.programId)?.name || "Onbekend programma"}
                              </h4>
                              <p className="text-sm text-gray-600 mt-1">
                                Leerjaar: {program.yearLevel || "Niet gespecificeerd"}
                              </p>
                            </div>
                            <div>
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button 
                  variant="outline" 
                  onClick={() => setIsStudentDetailDialogOpen(false)}
                >
                  Sluiten
                </Button>
                <Button 
                  variant="default" 
                  onClick={() => {
                    setIsStudentDetailDialogOpen(false);
                    handleEditStudent(selectedStudent);
                  }}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Bewerken
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}