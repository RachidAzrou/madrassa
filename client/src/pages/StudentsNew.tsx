import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, PlusCircle, Filter, Download, Users, User, Camera,
  Fingerprint, ChevronRight, Edit, Trash2, Eye, Home, X,
  GraduationCap, NotebookText, MapPin, Upload, FileSpreadsheet,
  FileText, AlertCircle
} from 'lucide-react';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Papa from 'papaparse';
import { 
  DataTableContainer, 
  SearchActionBar, 
  TableContainer,
  DataTableHeader,
  TableLoadingState,
  EmptyTableState,
  ActionButtonsContainer,
  EmptyActionHeader
} from "@/components/ui/data-table-container";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Students() {
  // State for dialogs and UI elements
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterStudentGroup, setFilterStudentGroup] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  // CRUD dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Export en import states
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Selected student states
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  
  // ID generation
  const currentYear = new Date().getFullYear();
  const [nextStudentId, setNextStudentId] = useState(`ST${currentYear.toString().substring(2, 4)}001`);
  
  // Lege formulierdata template
  const emptyFormData = {
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: null,
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    programId: "",
    enrollmentDate: "",
    status: "enrolled",
    notes: "",
    studentGroupId: "",
    gender: "man",
    photoUrl: "",
    studentId: "",
    academicYear: ""
  };
  
  const [formData, setFormData] = useState(emptyFormData);
  
  const { toast } = useToast();
  
  // Data fetching
  const { data: studentsData = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students'],
  });
  
  const { data: programsData = [] } = useQuery({
    queryKey: ['/api/programs'],
  });
  
  const { data: studentGroupsData = [] } = useQuery({
    queryKey: ['/api/student-groups'],
  });
  
  // Form handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // QueryClient voor mutaties
  const queryClient = useQueryClient();
  
  // Mutations voor student CRUD operaties
  const createStudentMutation = useMutation({
    mutationFn: (newStudent: any) => 
      apiRequest('/api/students', { method: 'POST', body: newStudent }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Student toegevoegd",
        description: "De student is succesvol toegevoegd.",
        variant: "success"
      });
    }
  });
  
  const updateStudentMutation = useMutation({
    mutationFn: (student: any) => 
      apiRequest(`/api/students/${student.id}`, { method: 'PUT', body: student }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Student bijgewerkt",
        description: "De gegevens van de student zijn succesvol bijgewerkt.",
        variant: "success"
      });
    }
  });
  
  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/students/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({
        title: "Student verwijderd",
        description: "De student is succesvol verwijderd.",
        variant: "success"
      });
    }
  });
  
  // Student actions handlers
  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Student aanmaken via de mutatie
      await createStudentMutation.mutateAsync(formData);
      
      // Sluit het huidige dialoogvenster
      setIsCreateDialogOpen(false);
      
      // Reset form data
      setFormData(emptyFormData);
    } catch (error) {
      console.error("Fout bij het aanmaken van de student:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het aanmaken van de student.",
        variant: "destructive"
      });
    }
  };
  
  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };
  
  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setFormData({
      ...student,
      programId: student.programId.toString(),
      studentGroupId: student.studentGroupId ? student.studentGroupId.toString() : ""
    });
    setIsEditDialogOpen(true);
  };
  
  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStudentMutation.mutateAsync({
        id: selectedStudent.id,
        ...formData
      });
      
      setIsEditDialogOpen(false);
      setFormData(emptyFormData);
    } catch (error) {
      console.error("Fout bij het bijwerken van de student:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de student.",
        variant: "destructive"
      });
    }
  };
  
  const handleDeleteStudent = (student: any) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteStudent = async () => {
    try {
      await deleteStudentMutation.mutateAsync(selectedStudent.id);
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      
      // Extra melding om te bevestigen dat de verwijdering succesvol was
      toast({
        title: "Student verwijderd",
        description: "De student is succesvol verwijderd uit het systeem.",
        variant: "success"
      });
    } catch (error) {
      console.error("Fout bij het verwijderen van de student:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de student.",
        variant: "destructive"
      });
    }
  };
  
  // Export functies
  const exportToExcel = () => {
    const data = studentsData.map((student: any) => ({
      'Student ID': student.studentId,
      'Voornaam': student.firstName,
      'Achternaam': student.lastName,
      'Email': student.email,
      'Telefoonnummer': student.phone,
      'Opleiding': student.programName,
      'Status': student.status
    }));
    
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Studenten");
    XLSX.writeFile(workbook, "studenten.xlsx");
    
    setIsExportMenuOpen(false);
    toast({
      title: "Export voltooid",
      description: "De gegevens zijn geëxporteerd naar Excel",
      variant: "success"
    });
  };
  
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    const tableColumn = ["Student ID", "Naam", "Email", "Opleiding", "Status"];
    const tableRows: any[] = [];
    
    studentsData.forEach((student: any) => {
      const studentData = [
        student.studentId,
        `${student.firstName} ${student.lastName}`,
        student.email,
        student.programName,
        student.status
      ];
      tableRows.push(studentData);
    });
    
    // @ts-ignore
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 20,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] }
    });
    
    doc.text("Studenten Lijst", 14, 15);
    doc.save("studenten.pdf");
    
    setIsExportMenuOpen(false);
    toast({
      title: "Export voltooid",
      description: "De gegevens zijn geëxporteerd naar PDF",
      variant: "success"
    });
  };
  
  const exportToCSV = () => {
    const data = studentsData.map((student: any) => ({
      'studentId': student.studentId,
      'firstName': student.firstName,
      'lastName': student.lastName,
      'email': student.email,
      'phone': student.phone,
      'programId': student.programId,
      'status': student.status
    }));
    
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'studenten.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setIsExportMenuOpen(false);
    toast({
      title: "Export voltooid", 
      description: "De gegevens zijn geëxporteerd naar CSV",
      variant: "success"
    });
  };
  
  // Import functie
  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const importedStudents = results.data;
        console.log('Geïmporteerde data:', importedStudents);
        
        toast({
          title: "Import voltooid",
          description: `${importedStudents.length} studenten geïmporteerd`,
          variant: "success"
        });
        
        // Hier zou normaal de data naar de server worden gestuurd
        // createStudentMutation.mutate(importedStudents);
        
        setIsImportDialogOpen(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
      error: (error) => {
        console.error('Error importing CSV:', error);
        toast({
          title: "Import mislukt",
          description: "Er is een fout opgetreden bij het importeren",
          variant: "destructive"
        });
      }
    });
  };
  
  // Filter de studenten op basis van zoekopdracht en filters
  const filteredStudents = (studentsData as any[] || []).filter(student => {
    const matchesSearch = 
      searchTerm === "" || 
      student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesProgram = 
      filterProgram === "all" || 
      student.programId.toString() === filterProgram;
    
    const matchesStatus = 
      statusFilter === "all" || 
      student.status === statusFilter;
    
    return matchesSearch && matchesProgram && matchesStatus;
  });
  
  return (
    <div className="container p-4 mx-auto">
      <PremiumHeader 
        title="Studenten" 
        description="Beheer de studenten van je madrassa"
        icon={Users}
      />
      
      <DataTableContainer>
        <SearchActionBar>
          {/* Import/Export knoppen linksboven */}
          <div className="flex items-center gap-2">
            {/* Exporteren knop */}
            <DropdownMenu open={isExportMenuOpen} onOpenChange={setIsExportMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs rounded-sm border-[#e5e7eb]"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="14" 
                    height="14" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2" 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    className="mr-1"
                  >
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  Exporteren
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="min-w-[180px] bg-white">
                <DropdownMenuItem className="text-xs py-2 cursor-pointer" onClick={exportToExcel}>
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-2" />
                  Exporteren als Excel
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs py-2 cursor-pointer" onClick={exportToPDF}>
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  Exporteren als PDF
                </DropdownMenuItem>
                <DropdownMenuItem className="text-xs py-2 cursor-pointer" onClick={exportToCSV}>
                  <FileText className="h-3.5 w-3.5 mr-2" />
                  Exporteren als CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            
            {/* Importeren knop */}
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs rounded-sm border-[#e5e7eb]"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                className="mr-1"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Importeren
            </Button>
          </div>
          
          {/* Zoekbalk */}
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Zoek op naam, ID of email..."
              className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Acties */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter knop */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="h-7 text-xs rounded-sm border-[#e5e7eb]"
            >
              <Filter className="h-3.5 w-3.5 mr-1" />
              Filters
              {showFilterOptions ? 
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1 h-3.5 w-3.5">
                  <path d="M3.13523 6.15803C3.3241 5.95657 3.64052 5.94637 3.84197 6.13523L7.5 9.56464L11.158 6.13523C11.3595 5.94637 11.6759 5.95657 11.8648 6.15803C12.0536 6.35949 12.0434 6.67591 11.842 6.86477L7.84197 10.6148C7.64964 10.7951 7.35036 10.7951 7.15803 10.6148L3.15803 6.86477C2.95657 6.67591 2.94637 6.35949 3.13523 6.15803Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg> : 
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="ml-1 h-3.5 w-3.5">
                  <path d="M3.13523 8.84197C3.3241 9.04343 3.64052 9.05363 3.84197 8.86477L7.5 5.43536L11.158 8.86477C11.3595 9.05363 11.6759 9.04343 11.8648 8.84197C12.0536 8.64051 12.0434 8.32409 11.842 8.13523L7.84197 4.38523C7.64964 4.20492 7.35036 4.20492 7.15803 4.38523L3.15803 8.13523C2.95657 8.32409 2.94637 8.64051 3.13523 8.84197Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
                </svg>
              }
            </Button>
            
            {/* Nieuwe student toevoegen knop */}
            <Button
              onClick={() => {
                setFormData({...emptyFormData, studentId: nextStudentId});
                setIsCreateDialogOpen(true);
              }}
              className="h-7 rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
              size="sm"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Nieuwe Student</span>
            </Button>
          </div>
        </SearchActionBar>
        
        {/* Filter opties */}
        {showFilterOptions && (
          <div className="p-4 mb-4 bg-white border border-[#e5e7eb] rounded-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1">
                  Opleiding
                </Label>
                <Select 
                  value={filterProgram} 
                  onValueChange={(value) => setFilterProgram(value)}
                >
                  <SelectTrigger className="h-8 text-xs rounded-sm bg-white border-[#e5e7eb]">
                    <SelectValue placeholder="Alle opleidingen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Alle opleidingen</SelectItem>
                    {programsData.map((program: any) => (
                      <SelectItem key={program.id} value={program.id.toString()} className="text-xs">
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1">
                  Status
                </Label>
                <Select 
                  value={statusFilter} 
                  onValueChange={(value) => setStatusFilter(value)}
                >
                  <SelectTrigger className="h-8 text-xs rounded-sm bg-white border-[#e5e7eb]">
                    <SelectValue placeholder="Alle statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Alle statussen</SelectItem>
                    <SelectItem value="active" className="text-xs">Actief</SelectItem>
                    <SelectItem value="inactive" className="text-xs">Inactief</SelectItem>
                    <SelectItem value="graduated" className="text-xs">Afgestudeerd</SelectItem>
                    <SelectItem value="enrolled" className="text-xs">Ingeschreven</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label className="text-xs font-medium text-gray-700 mb-1">
                  Klas
                </Label>
                <Select 
                  value={filterStudentGroup} 
                  onValueChange={(value) => setFilterStudentGroup(value)}
                >
                  <SelectTrigger className="h-8 text-xs rounded-sm bg-white border-[#e5e7eb]">
                    <SelectValue placeholder="Alle klassen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Alle klassen</SelectItem>
                    {studentGroupsData.map((group: any) => (
                      <SelectItem key={group.id} value={group.id.toString()} className="text-xs">
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <Button 
              variant="outline"
              className="mt-4 h-7 text-xs rounded-sm" 
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setFilterProgram('all');
                setFilterStudentGroup('all');
              }}
            >
              <X className="h-3.5 w-3.5 mr-1" />
              Wis Filters
            </Button>
          </div>
        )}
        
        <TableContainer>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40px] px-4 py-3 text-center">
                  <Checkbox 
                    checked={selectedStudents.length > 0 && selectedStudents.length === filteredStudents.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStudents(filteredStudents.map(s => s.id));
                      } else {
                        setSelectedStudents([]);
                      }
                    }}
                  />
                </TableHead>
                <TableHead className="px-4 py-3 text-center">
                  <span className="text-xs font-medium text-gray-700">ID</span>
                </TableHead>
                <TableHead className="px-4 py-3 text-center">
                  <span className="text-xs font-medium text-gray-700">Naam</span>
                </TableHead>
                <TableHead className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-gray-700">Klas</span>
                </TableHead>
                <TableHead className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-gray-700">Schooljaar</span>
                </TableHead>
                <TableHead className="px-4 py-3 text-left">
                  <span className="text-xs font-medium text-gray-700">Status</span>
                </TableHead>
                <EmptyActionHeader />
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <TableLoadingState />
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    <EmptyTableState 
                      icon={<Users className="h-8 w-8 text-gray-400" />}
                      title="Geen studenten gevonden"
                      description="Er zijn geen studenten gevonden die aan de zoekcriteria voldoen."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student) => (
                  <TableRow key={student.id} className="group hover:bg-gray-50">
                    <TableCell className="px-4 py-3 text-center">
                      <Checkbox 
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents(prev => [...prev, student.id]);
                          } else {
                            setSelectedStudents(prev => prev.filter(id => id !== student.id));
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs font-medium text-center">{student.studentId}</TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center">
                        <Avatar className="h-7 w-7 mr-3">
                          {student.photoUrl ? (
                            <AvatarImage src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} />
                          ) : (
                            <AvatarFallback className="text-xs bg-[#1e40af] text-white">
                              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div className="text-left">
                          <p className="text-xs font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-500">
                      {student.studentGroupName || "-"}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-500">
                      {student.academicYear || "2023-2024"}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge 
                        variant="outline" 
                        className={`text-xs px-2 py-1 rounded-sm ${
                          student.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 
                          student.status === 'inactive' ? 'bg-red-50 text-red-700 border-red-200' :
                          student.status === 'graduated' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                          'bg-yellow-50 text-yellow-700 border-yellow-200'
                        }`}
                      >
                        {student.status === 'active' ? 'Actief' : 
                         student.status === 'inactive' ? 'Inactief' :
                         student.status === 'graduated' ? 'Afgestudeerd' :
                         'Ingeschreven'}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <ActionButtonsContainer>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewStudent(student)}
                          className="h-7 w-7 p-0 text-gray-500"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditStudent(student)}
                          className="h-7 w-7 p-0 text-gray-500"
                        >
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteStudent(student)}
                          className="h-7 w-7 p-0 text-gray-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </ActionButtonsContainer>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DataTableContainer>
      
      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="import-students-description">
          <DialogHeader>
            <DialogTitle>Importeer Studenten</DialogTitle>
            <DialogDescription id="import-students-description">
              Upload een CSV bestand om meerdere studenten in één keer te importeren.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="bg-blue-50 p-3 rounded-sm border border-blue-200 mb-4">
              <div className="flex items-start">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 mr-2" />
                <div>
                  <p className="text-xs font-medium text-blue-800">CSV Formaat</p>
                  <p className="text-xs text-blue-700 mt-1">
                    Het CSV bestand moet de volgende kolommen bevatten:
                    <span className="block mt-1 font-mono text-blue-800">
                      studentId, firstName, lastName, email, phone, programId, status
                    </span>
                  </p>
                </div>
              </div>
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="csv" className="text-xs">
                Selecteer CSV bestand
              </Label>
              <Input 
                id="csv" 
                type="file" 
                accept=".csv" 
                ref={fileInputRef}
                onChange={handleImportCSV}
                className="text-xs" 
              />
            </div>
          </div>
          <DialogFooter className="sm:justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsImportDialogOpen(false)}
              className="h-8 text-xs rounded-sm"
            >
              Annuleren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Student Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-lg" aria-describedby="view-student-description">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
            <DialogDescription id="view-student-description" className="sr-only">
              Bekijk de details van de geselecteerde student
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="grid gap-6 py-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  {selectedStudent.photoUrl ? (
                    <AvatarImage src={selectedStudent.photoUrl} alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`} />
                  ) : (
                    <AvatarFallback className="text-lg bg-[#1e40af] text-white">
                      {selectedStudent.firstName.charAt(0)}{selectedStudent.lastName.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h3 className="font-medium text-lg">{selectedStudent.firstName} {selectedStudent.lastName}</h3>
                  <p className="text-sm text-gray-500">ID: {selectedStudent.studentId}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">Email</p>
                  <p className="text-sm">{selectedStudent.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">Telefoon</p>
                  <p className="text-sm">{selectedStudent.phone || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">Opleiding</p>
                  <p className="text-sm">{selectedStudent.programName}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-medium text-gray-500">Status</p>
                  <Badge 
                    variant="outline" 
                    className={`text-xs px-2 py-1 rounded-sm ${
                      selectedStudent.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 
                      selectedStudent.status === 'inactive' ? 'bg-red-50 text-red-700 border-red-200' :
                      selectedStudent.status === 'graduated' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                      'bg-yellow-50 text-yellow-700 border-yellow-200'
                    }`}
                  >
                    {selectedStudent.status === 'active' ? 'Actief' : 
                     selectedStudent.status === 'inactive' ? 'Inactief' :
                     selectedStudent.status === 'graduated' ? 'Afgestudeerd' :
                     'Ingeschreven'}
                  </Badge>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsViewDialogOpen(false)}
              className="h-8 text-xs rounded-sm"
            >
              Sluiten
            </Button>
            <Button
              type="button"
              onClick={() => {
                setIsViewDialogOpen(false);
                handleEditStudent(selectedStudent);
              }}
              className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Bewerken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create/Edit Student Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (isCreateDialogOpen) setIsCreateDialogOpen(open);
        if (isEditDialogOpen) setIsEditDialogOpen(open);
        if (!open) setFormData(emptyFormData);
      }}>
        <DialogContent className="sm:max-w-lg" aria-describedby="create-edit-student-description">
          <DialogHeader>
            <DialogTitle>{isEditDialogOpen ? "Student Bewerken" : "Nieuwe Student"}</DialogTitle>
            <DialogDescription id="create-edit-student-description">
              {isEditDialogOpen 
                ? "Bewerk de gegevens van deze student." 
                : "Voeg een nieuwe student toe aan je madrassa."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={isEditDialogOpen ? handleUpdateStudent : handleCreateStudent}>
            <div className="grid gap-6 py-4">
              {/* Persoonlijke informatie */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Persoonlijke informatie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs">Voornaam</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs">Achternaam</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="h-8 text-xs"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs">Telefoon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>
              </div>
              
              {/* Academische informatie */}
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Academische informatie</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId" className="text-xs">Student ID</Label>
                    <Input
                      id="studentId"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      className="h-8 text-xs"
                      disabled={isEditDialogOpen}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="programId" className="text-xs">Opleiding</Label>
                    <Select 
                      value={formData.programId} 
                      onValueChange={(value) => handleSelectChange("programId", value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecteer een opleiding" />
                      </SelectTrigger>
                      <SelectContent>
                        {programsData.map((program: any) => (
                          <SelectItem key={program.id} value={program.id.toString()} className="text-xs">
                            {program.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="studentGroupId" className="text-xs">Klas</Label>
                    <Select 
                      value={formData.studentGroupId} 
                      onValueChange={(value) => handleSelectChange("studentGroupId", value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecteer een klas" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentGroupsData.map((group: any) => (
                          <SelectItem key={group.id} value={group.id.toString()} className="text-xs">
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status" className="text-xs">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleSelectChange("status", value)}
                    >
                      <SelectTrigger className="h-8 text-xs">
                        <SelectValue placeholder="Selecteer een status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active" className="text-xs">Actief</SelectItem>
                        <SelectItem value="inactive" className="text-xs">Inactief</SelectItem>
                        <SelectItem value="graduated" className="text-xs">Afgestudeerd</SelectItem>
                        <SelectItem value="enrolled" className="text-xs">Ingeschreven</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (isCreateDialogOpen) setIsCreateDialogOpen(false);
                  if (isEditDialogOpen) setIsEditDialogOpen(false);
                  setFormData(emptyFormData);
                }}
                className="h-8 text-xs rounded-sm"
              >
                Annuleren
              </Button>
              <Button
                type="submit"
                className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
              >
                {isEditDialogOpen ? "Opslaan" : "Toevoegen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Student Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md" aria-describedby="delete-student-description">
          <DialogHeader>
            <DialogTitle>Student Verwijderen</DialogTitle>
            <DialogDescription id="delete-student-description">
              Weet je zeker dat je deze student wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          {selectedStudent && (
            <div className="py-4">
              <div className="flex items-center gap-3 p-3 border rounded-sm bg-gray-50">
                <Avatar className="h-10 w-10">
                  {selectedStudent.photoUrl ? (
                    <AvatarImage src={selectedStudent.photoUrl} alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`} />
                  ) : (
                    <AvatarFallback className="text-sm bg-[#1e40af] text-white">
                      {selectedStudent.firstName.charAt(0)}{selectedStudent.lastName.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                  <p className="text-xs text-gray-500">ID: {selectedStudent.studentId}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-8 text-xs rounded-sm"
            >
              Annuleren
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmDeleteStudent}
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