import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { StudentEmptyState } from '@/components/ui/empty-states';
import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, X, UserCircle, Check,
  ChevronUp, ChevronDown, FileText, FileDown, Mail, Home, BookOpen, Phone,
  Users, User, MapPin, GraduationCap, UsersRound, Pencil, Trash, CreditCard, AlertCircle,
  FileUp, Upload, FilePlus2, FileSpreadsheet, Image, School, UserRound, Camera, CheckSquare, SquareSlash,
  UserCheck, CalendarDays, Hash, Save, Plus, Loader2
} from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';

// Aangepast ChalkboardTeacher icoon
const ChalkBoard = (props: any) => (
  <svg
    xmlns="http://www.w3.org/2000/svg" 
    width="20" 
    height="20" 
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
    <path d="M6 16v4" />
    <path d="M18 16v4" />
    <path d="M8 7h.01" />
    <path d="M12 7h.01" />
    <path d="M16 7h.01" />
  </svg>
);

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from "date-fns";
import { nl } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Students() {
  const queryClient = useQueryClient();
  
  // API calls en data management
  const { data: studentsData, isLoading, isError } = useQuery({
    queryKey: ['/api/students'],
    // Voor development zonder backend (mock data)
    // queryFn: async () => {
    //   await new Promise(resolve => setTimeout(resolve, 1000)); // simuleer netwerk vertraging
    //   return { students: mockStudents, totalCount: mockStudents.length };
    // }
  });

  const { data: programsData } = useQuery({
    queryKey: ['/api/programs']
  });

  const { data: nextStudentIdData } = useQuery({
    queryKey: ['/api/students/next-id']
  });

  // Referenties voor bestandsupload
  const fileInputRef = useRef<HTMLInputElement>(null);

  // UI state management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedProgram, setSelectedProgram] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortColumn, setSortColumn] = useState('studentId');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Dialoog states
  const [addStudentDialogOpen, setAddStudentDialogOpen] = useState(false);
  const [viewStudentDialogOpen, setViewStudentDialogOpen] = useState(false);
  const [editStudentDialogOpen, setEditStudentDialogOpen] = useState(false);
  const [deleteStudentDialogOpen, setDeleteStudentDialogOpen] = useState(false);
  const [bulkImportDialogOpen, setBulkImportDialogOpen] = useState(false);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [importFileType, setImportFileType] = useState('');
  const [confirmImportDialogOpen, setConfirmImportDialogOpen] = useState(false);

  // Student data voor bewerkingen
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [newStudent, setNewStudent] = useState({
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
    country: 'België',
    enrolledPrograms: [],
    status: 'active',
    gender: 'male',
    notes: ''
  });
  
  // Mutations voor API acties
  const addStudentMutation = useMutation({
    mutationFn: async (student: any) => {
      return await apiRequest('/api/students', {
        method: 'POST',
        body: student
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setAddStudentDialogOpen(false);
      resetNewStudent();
      toast({
        title: "Student succesvol toegevoegd",
        description: "De nieuwe student is toegevoegd aan het systeem.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen van student",
        description: error.message || "Er is een fout opgetreden. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  });

  const editStudentMutation = useMutation({
    mutationFn: async (student: any) => {
      return await apiRequest(`/api/students/${student.id}`, {
        method: 'PUT',
        body: student
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setEditStudentDialogOpen(false);
      toast({
        title: "Student succesvol bijgewerkt",
        description: "De student gegevens zijn bijgewerkt in het systeem.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken van student",
        description: error.message || "Er is een fout opgetreden. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: number) => {
      return await apiRequest(`/api/students/${studentId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setDeleteStudentDialogOpen(false);
      setSelectedStudent(null);
      toast({
        title: "Student succesvol verwijderd",
        description: "De student is verwijderd uit het systeem.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen van student",
        description: error.message || "Er is een fout opgetreden. Probeer het opnieuw.",
        variant: "destructive",
      });
    }
  });

  const bulkImportMutation = useMutation({
    mutationFn: async (students: any[]) => {
      return await apiRequest('/api/students/bulk-import', {
        method: 'POST',
        body: { students }
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setConfirmImportDialogOpen(false);
      setBulkImportDialogOpen(false);
      setImportPreviewData([]);
      toast({
        title: "Import succesvol",
        description: `${data.imported || 'Alle'} studenten zijn succesvol geïmporteerd.`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij importeren",
        description: error.message || "Er is een fout opgetreden tijdens het importeren.",
        variant: "destructive",
      });
    }
  });

  // Reset nieuw student formulier
  const resetNewStudent = () => {
    if (nextStudentIdData?.nextStudentId) {
      setNewStudent({
        studentId: nextStudentIdData.nextStudentId,
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
        country: 'België',
        enrolledPrograms: [],
        status: 'active',
        gender: 'male',
        notes: ''
      });
    }
  };

  // Effect voor het zetten van student ID bij het openen van het toevoegen dialoog
  useEffect(() => {
    if (addStudentDialogOpen && nextStudentIdData?.nextStudentId) {
      setNewStudent(prev => ({
        ...prev,
        studentId: nextStudentIdData.nextStudentId
      }));
    }
  }, [addStudentDialogOpen, nextStudentIdData]);

  // Verwerken van geüploade bestanden
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    const fileName = file.name.toLowerCase();

    if (fileName.endsWith('.csv')) {
      setImportFileType('csv');
      fileReader.onload = (e) => {
        const csvOutput = e.target?.result as string;
        Papa.parse(csvOutput, {
          header: true,
          complete: (results) => {
            setImportPreviewData(results.data);
          }
        });
      };
      fileReader.readAsText(file);
    } 
    else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
      setImportFileType('excel');
      fileReader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        setImportPreviewData(jsonData);
      };
      fileReader.readAsArrayBuffer(file);
    }
    else {
      toast({
        title: "Ongeldig bestandsformaat",
        description: "Upload een CSV of Excel bestand (.xlsx/.xls).",
        variant: "destructive",
      });
    }
  };

  // Bulkimport uitvoeren
  const handleConfirmImport = () => {
    if (importPreviewData.length === 0) {
      toast({
        title: "Geen gegevens om te importeren",
        description: "Upload een geldig bestand met studentgegevens.",
        variant: "destructive",
      });
      return;
    }

    // Transformeer importdata naar het juiste formaat
    const formattedData = importPreviewData.map((item: any) => ({
      studentId: item.studentId || item.StudentId || item['Student ID'] || '',
      firstName: item.firstName || item.FirstName || item['First Name'] || item.Voornaam || '',
      lastName: item.lastName || item.LastName || item['Last Name'] || item.Achternaam || '',
      email: item.email || item.Email || item['E-mail'] || '',
      phone: item.phone || item.Phone || item.Telefoon || '',
      gender: (item.gender || item.Gender || item.Geslacht || '').toLowerCase() === 'female' ? 'female' : 'male',
      dateOfBirth: item.dateOfBirth || item.DateOfBirth || item['Date of Birth'] || item.Geboortedatum || null,
      street: item.street || item.Street || item.Straat || '',
      houseNumber: item.houseNumber || item.HouseNumber || item['House Number'] || item.Huisnummer || '',
      postalCode: item.postalCode || item.PostalCode || item['Postal Code'] || item.Postcode || '',
      city: item.city || item.City || item.Stad || '',
      country: item.country || item.Country || item.Land || 'België',
      status: item.status || item.Status || 'active'
    }));

    bulkImportMutation.mutate(formattedData);
  };

  // Sorteren, filteren en paginering van studenten
  const filteredAndSortedStudents = () => {
    if (!studentsData?.students) return [];

    let filtered = [...studentsData.students];
    
    // Filteren op zoekterm
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(student => 
        student.firstName.toLowerCase().includes(lowerQuery) ||
        student.lastName.toLowerCase().includes(lowerQuery) ||
        student.studentId.toLowerCase().includes(lowerQuery) ||
        (student.email && student.email.toLowerCase().includes(lowerQuery))
      );
    }
    
    // Filteren op status
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(student => student.status === selectedFilter);
    }
    
    // Filteren op programma
    if (selectedProgram !== 'all') {
      filtered = filtered.filter(student => 
        student.enrolledPrograms && 
        student.enrolledPrograms.some((enrollment: any) => 
          enrollment.programId.toString() === selectedProgram
        )
      );
    }
    
    // Sorteren
    filtered.sort((a, b) => {
      let valueA, valueB;
      
      switch (sortColumn) {
        case 'studentId':
          valueA = a.studentId;
          valueB = b.studentId;
          break;
        case 'firstName':
          valueA = a.firstName;
          valueB = b.firstName;
          break;
        case 'lastName':
          valueA = a.lastName;
          valueB = b.lastName;
          break;
        case 'email':
          valueA = a.email || '';
          valueB = b.email || '';
          break;
        default:
          valueA = a.studentId;
          valueB = b.studentId;
      }
      
      if (sortDirection === 'asc') {
        return valueA.localeCompare(valueB);
      } else {
        return valueB.localeCompare(valueA);
      }
    });
    
    return filtered;
  };
  
  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };
  
  // Handlers voor student acties
  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setViewStudentDialogOpen(true);
  };
  
  const handleEditStudent = (student: any) => {
    setSelectedStudent({
      ...student,
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null
    });
    setEditStudentDialogOpen(true);
  };
  
  const handleDeleteStudent = (student: any) => {
    setSelectedStudent(student);
    setDeleteStudentDialogOpen(true);
  };
  
  // UI berekeningen voor paginering
  const totalItems = filteredAndSortedStudents().length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(startItem + itemsPerPage - 1, totalItems);
  
  // Laad en fout states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Professionele header component */}
        <PageHeader 
          title="Studenten" 
          icon={<Users className="h-5 w-5 text-white" />} 
          parent="Beheer"
          current="Studenten" 
        />

        {/* Main content area */}
        <div className="px-6 py-6 flex-1">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-[#1e3a8a] border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-500">Studenten laden...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (isError) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Professionele header component */}
        <PageHeader 
          title="Studenten" 
          icon={<Users className="h-5 w-5 text-white" />} 
          parent="Beheer"
          current="Studenten" 
        />

        {/* Main content area */}
        <div className="px-6 py-6 flex-1">
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Fout bij laden</h3>
              <p className="text-gray-500 mb-4">Er is een probleem opgetreden bij het laden van de studentengegevens.</p>
              <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/students'] })}>
                Opnieuw proberen
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Leeg state als er geen studenten zijn
  if (studentsData?.students.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Professionele header component */}
        <PageHeader 
          title="Studenten" 
          icon={<Users className="h-5 w-5 text-white" />} 
          parent="Beheer"
          current="Studenten" 
        />

        <div className="px-6 py-6 flex-1">
          <StudentEmptyState
            title="Geen studenten gevonden"
            description="Er zijn nog geen studenten toegevoegd aan het systeem. Voeg je eerste student toe of importeer studentgegevens."
            action={
              <div className="flex gap-2 mt-2">
                <Button onClick={() => setAddStudentDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Student toevoegen
                </Button>
                <Button variant="outline" onClick={() => setBulkImportDialogOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Studenten importeren
                </Button>
              </div>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Professionele header component */}
      <PageHeader 
        title="Studenten" 
        icon={<Users className="h-5 w-5 text-white" />} 
        parent="Beheer"
        current="Studenten" 
      />
      
      {/* Main content area */}
      <div className="px-6 py-6 flex-1">
        <div className="max-w-7xl mx-auto">
          {/* Action bar */}
          <div className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Zoek op naam, ID of email..."
                  className="pl-8 w-full sm:w-[300px]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                  <SelectTrigger className="w-[130px]">
                    <Filter className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle status</SelectItem>
                    <SelectItem value="active">Actief</SelectItem>
                    <SelectItem value="inactive">Inactief</SelectItem>
                    <SelectItem value="suspended">Geschorst</SelectItem>
                    <SelectItem value="graduated">Afgestudeerd</SelectItem>
                  </SelectContent>
                </Select>
                
                {programsData?.length > 0 && (
                  <Select value={selectedProgram} onValueChange={setSelectedProgram}>
                    <SelectTrigger className="w-[160px]">
                      <BookOpen className="mr-2 h-4 w-4" />
                      <SelectValue placeholder="Programma" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle programma's</SelectItem>
                      {programsData.map((program: any) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={() => setAddStudentDialogOpen(true)}>
                <PlusCircle className="h-4 w-4 mr-2" />
                Student toevoegen
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Exporteren
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => {
                    const worksheet = XLSX.utils.json_to_sheet(filteredAndSortedStudents());
                    const workbook = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(workbook, worksheet, "Studenten");
                    XLSX.writeFile(workbook, "studenten_export.xlsx");
                  }}>
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Excel exporteren
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => {
                    const csv = Papa.unparse(filteredAndSortedStudents());
                    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                    const link = document.createElement('a');
                    const url = URL.createObjectURL(blob);
                    link.href = url;
                    link.setAttribute('download', 'studenten_export.csv');
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}>
                    <FileText className="h-4 w-4 mr-2" />
                    CSV exporteren
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" onClick={() => setBulkImportDialogOpen(true)}>
                <Upload className="h-4 w-4 mr-2" />
                Importeren
              </Button>
            </div>
          </div>
          
          {/* Table container */}
          <div className="bg-white rounded-md border shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">
                      <button
                        className="flex items-center text-xs font-medium"
                        onClick={() => handleSort('studentId')}
                      >
                        ID
                        {sortColumn === 'studentId' && (
                          sortDirection === 'asc' ? 
                          <ChevronUp className="ml-1 h-3 w-3" /> : 
                          <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center text-xs font-medium"
                        onClick={() => handleSort('firstName')}
                      >
                        Voornaam
                        {sortColumn === 'firstName' && (
                          sortDirection === 'asc' ? 
                          <ChevronUp className="ml-1 h-3 w-3" /> : 
                          <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center text-xs font-medium"
                        onClick={() => handleSort('lastName')}
                      >
                        Achternaam
                        {sortColumn === 'lastName' && (
                          sortDirection === 'asc' ? 
                          <ChevronUp className="ml-1 h-3 w-3" /> : 
                          <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>
                      <button
                        className="flex items-center text-xs font-medium"
                        onClick={() => handleSort('email')}
                      >
                        Email
                        {sortColumn === 'email' && (
                          sortDirection === 'asc' ? 
                          <ChevronUp className="ml-1 h-3 w-3" /> : 
                          <ChevronDown className="ml-1 h-3 w-3" />
                        )}
                      </button>
                    </TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Programma</TableHead>
                    <TableHead className="text-right">Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedStudents()
                    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                    .map((student: any) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.studentId}</TableCell>
                        <TableCell>{student.firstName}</TableCell>
                        <TableCell>{student.lastName}</TableCell>
                        <TableCell>{student.email}</TableCell>
                        <TableCell>
                          <Badge 
                            variant={
                              student.status === 'active' ? 'default' :
                              student.status === 'inactive' ? 'secondary' :
                              student.status === 'suspended' ? 'destructive' :
                              'outline'
                            }
                          >
                            {student.status === 'active' && 'Actief'}
                            {student.status === 'inactive' && 'Inactief'}
                            {student.status === 'suspended' && 'Geschorst'}
                            {student.status === 'graduated' && 'Afgestudeerd'}
                            {!['active', 'inactive', 'suspended', 'graduated'].includes(student.status) && student.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {student.enrolledPrograms && student.enrolledPrograms.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {student.enrolledPrograms.map((enrollment: any, index: number) => (
                                <Badge key={index} variant="outline" className="whitespace-nowrap">
                                  {enrollment.programName || (
                                    programsData?.find((p: any) => p.id === enrollment.programId)?.name || 
                                    'Onbekend programma'
                                  )}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">Geen programma</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="icon" onClick={() => handleViewStudent(student)}>
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditStudent(student)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteStudent(student)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
            
            {/* Pagination */}
            <div className="px-4 py-2 border-t flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-500">
                Toont {startItem}-{endItem} van {totalItems} studenten
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Vorige
                </Button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    // Calculate page numbers to show (centered around current page)
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <Button
                        key={i}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        className="w-9"
                        onClick={() => setCurrentPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Volgende
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Add Student Dialog */}
      <Dialog open={addStudentDialogOpen} onOpenChange={setAddStudentDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student toevoegen</DialogTitle>
            <DialogDescription>
              Vul de onderstaande gegevens in om een nieuwe student toe te voegen.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="general" className="mt-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="general">Algemeen</TabsTrigger>
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="programs">Programma's</TabsTrigger>
            </TabsList>
            
            <TabsContent value="general" className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input 
                    id="studentId" 
                    value={newStudent.studentId} 
                    onChange={(e) => setNewStudent({...newStudent, studentId: e.target.value})}
                    placeholder="Bijv. S-001"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Geslacht</Label>
                  <RadioGroup 
                    value={newStudent.gender} 
                    onValueChange={(value) => setNewStudent({...newStudent, gender: value})}
                    className="flex space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="male" id="male" />
                      <Label htmlFor="male" className="cursor-pointer">Man</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="female" id="female" />
                      <Label htmlFor="female" className="cursor-pointer">Vrouw</Label>
                    </div>
                  </RadioGroup>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="firstName">Voornaam</Label>
                  <Input 
                    id="firstName" 
                    value={newStudent.firstName} 
                    onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                    placeholder="Voornaam"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Achternaam</Label>
                  <Input 
                    id="lastName" 
                    value={newStudent.lastName} 
                    onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                    placeholder="Achternaam"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Geboortedatum</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !newStudent.dateOfBirth && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newStudent.dateOfBirth ? (
                          format(newStudent.dateOfBirth, "PPP", { locale: nl })
                        ) : (
                          <span>Kies een datum</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={newStudent.dateOfBirth || undefined}
                        onSelect={(date) => setNewStudent({...newStudent, dateOfBirth: date})}
                        initialFocus
                        locale={nl}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={newStudent.status} 
                    onValueChange={(value) => setNewStudent({...newStudent, status: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actief</SelectItem>
                      <SelectItem value="inactive">Inactief</SelectItem>
                      <SelectItem value="suspended">Geschorst</SelectItem>
                      <SelectItem value="graduated">Afgestudeerd</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notities</Label>
                  <Textarea 
                    id="notes" 
                    value={newStudent.notes} 
                    onChange={(e) => setNewStudent({...newStudent, notes: e.target.value})}
                    placeholder="Aanvullende informatie over de student"
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="contact" className="py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">E-mailadres</Label>
                  <Input 
                    id="email" 
                    type="email"
                    value={newStudent.email} 
                    onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                    placeholder="email@voorbeeld.com"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoonnummer</Label>
                  <Input 
                    id="phone" 
                    value={newStudent.phone} 
                    onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                    placeholder="+32 000 00 00 00"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="street">Straat</Label>
                  <Input 
                    id="street" 
                    value={newStudent.street} 
                    onChange={(e) => setNewStudent({...newStudent, street: e.target.value})}
                    placeholder="Straatnaam"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="houseNumber">Huisnummer</Label>
                  <Input 
                    id="houseNumber" 
                    value={newStudent.houseNumber} 
                    onChange={(e) => setNewStudent({...newStudent, houseNumber: e.target.value})}
                    placeholder="123"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postcode</Label>
                  <Input 
                    id="postalCode" 
                    value={newStudent.postalCode} 
                    onChange={(e) => setNewStudent({...newStudent, postalCode: e.target.value})}
                    placeholder="1000"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Plaats</Label>
                  <Input 
                    id="city" 
                    value={newStudent.city} 
                    onChange={(e) => setNewStudent({...newStudent, city: e.target.value})}
                    placeholder="Brussel"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Land</Label>
                  <Input 
                    id="country" 
                    value={newStudent.country} 
                    onChange={(e) => setNewStudent({...newStudent, country: e.target.value})}
                    placeholder="België"
                  />
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="programs" className="py-4">
              {programsData?.length > 0 ? (
                <div className="space-y-4">
                  <div className="text-sm text-gray-500">
                    Selecteer de programma's waarin deze student is ingeschreven.
                  </div>
                  
                  <div className="space-y-2 border rounded-md p-4">
                    {programsData.map((program: any) => (
                      <div key={program.id} className="flex items-center space-x-2">
                        <Checkbox 
                          id={`program-${program.id}`}
                          checked={newStudent.enrolledPrograms.some((p: any) => p.programId === program.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewStudent({
                                ...newStudent, 
                                enrolledPrograms: [
                                  ...newStudent.enrolledPrograms, 
                                  { programId: program.id, programName: program.name }
                                ]
                              });
                            } else {
                              setNewStudent({
                                ...newStudent,
                                enrolledPrograms: newStudent.enrolledPrograms.filter(
                                  (p: any) => p.programId !== program.id
                                )
                              });
                            }
                          }}
                        />
                        <Label htmlFor={`program-${program.id}`} className="cursor-pointer">
                          {program.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Geen programma's beschikbaar</h3>
                  <p className="text-gray-500 mb-4 text-center">
                    Er zijn nog geen opleidingsprogramma's toegevoegd aan het systeem.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setAddStudentDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={() => {
                // Combineer adresgegevens
                const fullAddress = [
                  newStudent.street,
                  newStudent.houseNumber,
                  newStudent.postalCode,
                  newStudent.city,
                  newStudent.country
                ].filter(Boolean).join(', ');
                
                addStudentMutation.mutate({
                  ...newStudent,
                  address: fullAddress
                });
              }}
              disabled={addStudentMutation.isPending || !newStudent.firstName || !newStudent.lastName}
            >
              {addStudentMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig met opslaan...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Student toevoegen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Student Dialog */}
      <Dialog open={viewStudentDialogOpen} onOpenChange={setViewStudentDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span>Student details</span>
                  <Badge 
                    variant={
                      selectedStudent.status === 'active' ? 'default' :
                      selectedStudent.status === 'inactive' ? 'secondary' :
                      selectedStudent.status === 'suspended' ? 'destructive' :
                      'outline'
                    }
                  >
                    {selectedStudent.status === 'active' && 'Actief'}
                    {selectedStudent.status === 'inactive' && 'Inactief'}
                    {selectedStudent.status === 'suspended' && 'Geschorst'}
                    {selectedStudent.status === 'graduated' && 'Afgestudeerd'}
                    {!['active', 'inactive', 'suspended', 'graduated'].includes(selectedStudent.status) && selectedStudent.status}
                  </Badge>
                </DialogTitle>
              </DialogHeader>
              
              <div className="flex flex-col md:flex-row gap-6 py-4">
                <div className="md:w-1/3 flex flex-col items-center">
                  <Avatar className="h-32 w-32 mb-4">
                    <AvatarImage src="" alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`} />
                    <AvatarFallback className="text-2xl bg-blue-100 text-blue-600">
                      {selectedStudent.gender === 'female' ? (
                        <img src="/attached_assets/muslima_icon.png" alt="Student" className="h-20 w-20" />
                      ) : (
                        <img src="/attached_assets/muslim_icon.png" alt="Student" className="h-20 w-20" />
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <h3 className="text-xl font-medium text-center">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <p className="text-gray-500 text-sm mb-2">{selectedStudent.studentId}</p>
                  
                  {selectedStudent.enrolledPrograms && selectedStudent.enrolledPrograms.length > 0 && (
                    <div className="flex flex-wrap gap-1 justify-center">
                      {selectedStudent.enrolledPrograms.map((enrollment: any, index: number) => (
                        <Badge key={index} variant="outline" className="whitespace-nowrap">
                          {enrollment.programName || (
                            programsData?.find((p: any) => p.id === enrollment.programId)?.name || 
                            'Onbekend programma'
                          )}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="md:w-2/3">
                  <Tabs defaultValue="details">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="contact">Contact</TabsTrigger>
                      <TabsTrigger value="notes">Notities</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="details" className="pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Student ID</h4>
                          <p>{selectedStudent.studentId}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Geslacht</h4>
                          <p>{selectedStudent.gender === 'male' ? 'Man' : 'Vrouw'}</p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Geboortedatum</h4>
                          <p>
                            {selectedStudent.dateOfBirth ? 
                              format(new Date(selectedStudent.dateOfBirth), 'dd MMMM yyyy', { locale: nl }) : 
                              'Niet ingevuld'
                            }
                          </p>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium text-gray-500">Status</h4>
                          <p>
                            {selectedStudent.status === 'active' && 'Actief'}
                            {selectedStudent.status === 'inactive' && 'Inactief'}
                            {selectedStudent.status === 'suspended' && 'Geschorst'}
                            {selectedStudent.status === 'graduated' && 'Afgestudeerd'}
                            {!['active', 'inactive', 'suspended', 'graduated'].includes(selectedStudent.status) && selectedStudent.status}
                          </p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="contact" className="pt-4 space-y-4">
                      <div className="grid grid-cols-1 gap-4">
                        <div className="flex items-start gap-2">
                          <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">E-mailadres</h4>
                            <p>{selectedStudent.email || 'Niet ingevuld'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Telefoonnummer</h4>
                            <p>{selectedStudent.phone || 'Niet ingevuld'}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                          <div>
                            <h4 className="text-sm font-medium text-gray-500">Adres</h4>
                            <p>
                              {[
                                selectedStudent.street,
                                selectedStudent.houseNumber,
                                selectedStudent.postalCode,
                                selectedStudent.city,
                                selectedStudent.country
                              ].filter(Boolean).join(', ') || 'Niet ingevuld'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="notes" className="pt-4">
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium text-gray-500">Notities</h4>
                        {selectedStudent.notes ? (
                          <p className="whitespace-pre-line">{selectedStudent.notes}</p>
                        ) : (
                          <p className="text-gray-400 italic">Geen notities beschikbaar</p>
                        )}
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setViewStudentDialogOpen(false)}>
                  Sluiten
                </Button>
                <Button onClick={() => {
                  setViewStudentDialogOpen(false);
                  handleEditStudent(selectedStudent);
                }}>
                  <Edit className="h-4 w-4 mr-2" />
                  Bewerken
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Edit Student Dialog */}
      <Dialog open={editStudentDialogOpen} onOpenChange={setEditStudentDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle>Student bewerken</DialogTitle>
                <DialogDescription>
                  Bewerk de gegevens van student {selectedStudent.firstName} {selectedStudent.lastName}.
                </DialogDescription>
              </DialogHeader>
              
              <Tabs defaultValue="general" className="mt-4">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="general">Algemeen</TabsTrigger>
                  <TabsTrigger value="contact">Contact</TabsTrigger>
                  <TabsTrigger value="programs">Programma's</TabsTrigger>
                </TabsList>
                
                <TabsContent value="general" className="py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-studentId">Student ID</Label>
                      <Input 
                        id="edit-studentId" 
                        value={selectedStudent.studentId} 
                        onChange={(e) => setSelectedStudent({...selectedStudent, studentId: e.target.value})}
                        placeholder="Bijv. S-001"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Geslacht</Label>
                      <RadioGroup 
                        value={selectedStudent.gender} 
                        onValueChange={(value) => setSelectedStudent({...selectedStudent, gender: value})}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="male" id="edit-male" />
                          <Label htmlFor="edit-male" className="cursor-pointer">Man</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="female" id="edit-female" />
                          <Label htmlFor="edit-female" className="cursor-pointer">Vrouw</Label>
                        </div>
                      </RadioGroup>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-firstName">Voornaam</Label>
                      <Input 
                        id="edit-firstName" 
                        value={selectedStudent.firstName} 
                        onChange={(e) => setSelectedStudent({...selectedStudent, firstName: e.target.value})}
                        placeholder="Voornaam"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-lastName">Achternaam</Label>
                      <Input 
                        id="edit-lastName" 
                        value={selectedStudent.lastName} 
                        onChange={(e) => setSelectedStudent({...selectedStudent, lastName: e.target.value})}
                        placeholder="Achternaam"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-dateOfBirth">Geboortedatum</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !selectedStudent.dateOfBirth && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {selectedStudent.dateOfBirth ? (
                              format(new Date(selectedStudent.dateOfBirth), "PPP", { locale: nl })
                            ) : (
                              <span>Kies een datum</span>
                            )}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth) : undefined}
                            onSelect={(date) => setSelectedStudent({...selectedStudent, dateOfBirth: date})}
                            initialFocus
                            locale={nl}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-status">Status</Label>
                      <Select 
                        value={selectedStudent.status} 
                        onValueChange={(value) => setSelectedStudent({...selectedStudent, status: value})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actief</SelectItem>
                          <SelectItem value="inactive">Inactief</SelectItem>
                          <SelectItem value="suspended">Geschorst</SelectItem>
                          <SelectItem value="graduated">Afgestudeerd</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2 md:col-span-2">
                      <Label htmlFor="edit-notes">Notities</Label>
                      <Textarea 
                        id="edit-notes" 
                        value={selectedStudent.notes || ''} 
                        onChange={(e) => setSelectedStudent({...selectedStudent, notes: e.target.value})}
                        placeholder="Aanvullende informatie over de student"
                        rows={3}
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="contact" className="py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit-email">E-mailadres</Label>
                      <Input 
                        id="edit-email" 
                        type="email"
                        value={selectedStudent.email || ''} 
                        onChange={(e) => setSelectedStudent({...selectedStudent, email: e.target.value})}
                        placeholder="email@voorbeeld.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-phone">Telefoonnummer</Label>
                      <Input 
                        id="edit-phone" 
                        value={selectedStudent.phone || ''} 
                        onChange={(e) => setSelectedStudent({...selectedStudent, phone: e.target.value})}
                        placeholder="+32 000 00 00 00"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-street">Straat</Label>
                      <Input 
                        id="edit-street" 
                        value={selectedStudent.street || ''} 
                        onChange={(e) => setSelectedStudent({...selectedStudent, street: e.target.value})}
                        placeholder="Straatnaam"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-houseNumber">Huisnummer</Label>
                      <Input 
                        id="edit-houseNumber" 
                        value={selectedStudent.houseNumber || ''} 
                        onChange={(e) => setSelectedStudent({...selectedStudent, houseNumber: e.target.value})}
                        placeholder="123"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-postalCode">Postcode</Label>
                      <Input 
                        id="edit-postalCode" 
                        value={selectedStudent.postalCode || ''} 
                        onChange={(e) => setSelectedStudent({...selectedStudent, postalCode: e.target.value})}
                        placeholder="1000"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-city">Plaats</Label>
                      <Input 
                        id="edit-city" 
                        value={selectedStudent.city || ''} 
                        onChange={(e) => setSelectedStudent({...selectedStudent, city: e.target.value})}
                        placeholder="Brussel"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit-country">Land</Label>
                      <Input 
                        id="edit-country" 
                        value={selectedStudent.country || ''} 
                        onChange={(e) => setSelectedStudent({...selectedStudent, country: e.target.value})}
                        placeholder="België"
                      />
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="programs" className="py-4">
                  {programsData?.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-500">
                        Selecteer de programma's waarin deze student is ingeschreven.
                      </div>
                      
                      <div className="space-y-2 border rounded-md p-4">
                        {programsData.map((program: any) => (
                          <div key={program.id} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`edit-program-${program.id}`}
                              checked={selectedStudent.enrolledPrograms && 
                                selectedStudent.enrolledPrograms.some((p: any) => p.programId === program.id)}
                              onCheckedChange={(checked) => {
                                const currentPrograms = selectedStudent.enrolledPrograms || [];
                                
                                if (checked) {
                                  setSelectedStudent({
                                    ...selectedStudent, 
                                    enrolledPrograms: [
                                      ...currentPrograms, 
                                      { programId: program.id, programName: program.name }
                                    ]
                                  });
                                } else {
                                  setSelectedStudent({
                                    ...selectedStudent,
                                    enrolledPrograms: currentPrograms.filter(
                                      (p: any) => p.programId !== program.id
                                    )
                                  });
                                }
                              }}
                            />
                            <Label htmlFor={`edit-program-${program.id}`} className="cursor-pointer">
                              {program.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8">
                      <BookOpen className="h-12 w-12 text-gray-300 mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">Geen programma's beschikbaar</h3>
                      <p className="text-gray-500 mb-4 text-center">
                        Er zijn nog geen opleidingsprogramma's toegevoegd aan het systeem.
                      </p>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
              
              <DialogFooter className="mt-6">
                <Button variant="outline" onClick={() => setEditStudentDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button 
                  onClick={() => {
                    // Combineer adresgegevens
                    const fullAddress = [
                      selectedStudent.street,
                      selectedStudent.houseNumber,
                      selectedStudent.postalCode,
                      selectedStudent.city,
                      selectedStudent.country
                    ].filter(Boolean).join(', ');
                    
                    editStudentMutation.mutate({
                      ...selectedStudent,
                      address: fullAddress
                    });
                  }}
                  disabled={editStudentMutation.isPending || !selectedStudent.firstName || !selectedStudent.lastName}
                >
                  {editStudentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bezig met opslaan...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Wijzigingen opslaan
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Delete Student Dialog */}
      <Dialog open={deleteStudentDialogOpen} onOpenChange={setDeleteStudentDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          {selectedStudent && (
            <>
              <DialogHeader>
                <DialogTitle>Student verwijderen</DialogTitle>
                <DialogDescription>
                  Weet je zeker dat je de gegevens van {selectedStudent.firstName} {selectedStudent.lastName} wilt verwijderen?
                </DialogDescription>
              </DialogHeader>
              
              <div className="py-4">
                <div className="rounded-md bg-red-50 p-4 border border-red-100">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-red-800">Let op</h3>
                      <div className="mt-2 text-sm text-red-700">
                        <p>
                          Deze actie kan niet ongedaan worden gemaakt. Alle gegevens van deze student worden permanent verwijderd uit het systeem.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <DialogFooter>
                <Button variant="outline" onClick={() => setDeleteStudentDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => deleteStudentMutation.mutate(selectedStudent.id)}
                  disabled={deleteStudentMutation.isPending}
                >
                  {deleteStudentMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Bezig met verwijderen...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Student verwijderen
                    </>
                  )}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Bulk Import Dialog */}
      <Dialog open={bulkImportDialogOpen} onOpenChange={setBulkImportDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Studenten importeren</DialogTitle>
            <DialogDescription>
              Upload een CSV of Excel bestand met studentgegevens om in bulk te importeren.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {importPreviewData.length === 0 ? (
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12">
                <FileUp className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Upload een bestand</h3>
                <p className="text-gray-500 mb-4 text-center max-w-md">
                  Sleep een CSV of Excel bestand hierheen, of klik om een bestand te selecteren.
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileUpload}
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Bestand selecteren
                </Button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex justify-between items-center">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">Voorbeeld van gegevens</h3>
                    <p className="text-gray-500 text-sm">
                      {importPreviewData.length} records gevonden in het {importFileType === 'csv' ? 'CSV' : 'Excel'} bestand.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => {
                    setImportPreviewData([]);
                    setImportFileType('');
                  }}>
                    <X className="h-4 w-4 mr-2" />
                    Wissen
                  </Button>
                </div>
                
                <div className="border rounded-md overflow-x-auto mb-4">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        {importPreviewData.length > 0 && 
                          Object.keys(importPreviewData[0]).slice(0, 5).map((key) => (
                            <TableHead key={key}>{key}</TableHead>
                          ))
                        }
                        {importPreviewData.length > 0 && Object.keys(importPreviewData[0]).length > 5 && (
                          <TableHead>...</TableHead>
                        )}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreviewData.slice(0, 5).map((row, rowIndex) => (
                        <TableRow key={rowIndex}>
                          {Object.values(row).slice(0, 5).map((value: any, valueIndex) => (
                            <TableCell key={valueIndex}>{value}</TableCell>
                          ))}
                          {Object.values(row).length > 5 && (
                            <TableCell>...</TableCell>
                          )}
                        </TableRow>
                      ))}
                      {importPreviewData.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-gray-500">
                            +{importPreviewData.length - 5} meer records
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Opmerkingen</h4>
                  <ul className="text-sm text-gray-500 space-y-1 list-disc list-inside">
                    <li>Zorg ervoor dat de kolomnamen overeenkomen met de verwachte velden.</li>
                    <li>Voeg minimaal de verplichte velden toe: voornaam, achternaam en student ID.</li>
                    <li>Duplicaten worden bijgewerkt op basis van student ID of email.</li>
                  </ul>
                </div>
                
                <Button
                  className="w-full"
                  onClick={() => setConfirmImportDialogOpen(true)}
                >
                  <CheckSquare className="h-4 w-4 mr-2" />
                  Importeren starten
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Confirm Import Dialog */}
      <Dialog open={confirmImportDialogOpen} onOpenChange={setConfirmImportDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Importeren bevestigen</DialogTitle>
            <DialogDescription>
              Je staat op het punt om {importPreviewData.length} studenten te importeren.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="rounded-md bg-blue-50 p-4 border border-blue-100">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-blue-400" aria-hidden="true" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-blue-800">Let op</h3>
                  <div className="mt-2 text-sm text-blue-700">
                    <p>
                      Bestaande studenten worden bijgewerkt als er een match is op student ID of email. Nieuwe studenten worden toegevoegd.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmImportDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={handleConfirmImport}
              disabled={bulkImportMutation.isPending}
            >
              {bulkImportMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig met importeren...
                </>
              ) : (
                <>
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Importeren bevestigen
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}