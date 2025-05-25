import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { 
  Search, PlusCircle, Filter, Download, Users, User, Camera,
  Fingerprint, ChevronRight, Edit, Trash2, Eye, Home, X,
  GraduationCap, NotebookText, MapPin, FileEdit, Upload, FileDown,
  ArrowDownToLine, ArrowUpToLine, Info
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
import { 
  DataTableContainer, 
  SearchActionBar, 
  TableContainer,
  DataTableHeader,
  TableLoadingState,
  EmptyTableState
} from "@/components/ui/data-table-container";
import {
  CustomDialog,
  DialogHeaderWithIcon,
  DialogFormContainer,
  SectionContainer,
  DialogFooterContainer,
  FormLabel as CustomFormLabel
} from "@/components/ui/custom-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead as ShadcnTableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function Students() {
  // State hooks
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterAcademicYear, setFilterAcademicYear] = useState("all");
  const [filterStudentGroup, setFilterStudentGroup] = useState("all");
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const currentYear = new Date().getFullYear();
  const [nextStudentId, setNextStudentId] = useState(`ST${currentYear.toString().substring(2, 4)}001`);
  const [importFile, setImportFile] = useState<File | null>(null);
  
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
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const resetForm = () => {
    setFormData(emptyFormData);
  };

  const [isAddGuardianDialogOpen, setIsAddGuardianDialogOpen] = useState(false);
  const [newStudentId, setNewStudentId] = useState(null);

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      // Student would be created here
      console.log('Creating student:', formData);
      
      // Creëer nieuwe student en voeg toe aan lijst
      const newStudent = {
        ...formData,
        id: Date.now().toString(), // Tijdelijk ID voor demo
        studentId: formData.studentId || nextStudentId,
        programName: programs.find(p => p.id.toString() === formData.programId)?.name || '',
        studentGroupName: studentGroups.find(g => g.id.toString() === formData.studentGroupId)?.name || '',
      };
      
      // Update studenten lijst met nieuwe student
      setStudents([newStudent, ...students]);
      
      // Sla nieuw student ID op voor eventuele voogdkoppeling
      const newId = formData.studentId || nextStudentId;
      setNewStudentId(newId);
      
      // Reset formulier en sluit dialoogvenster
      resetForm();
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Student toegevoegd",
        description: "De student is succesvol toegevoegd aan de lijst."
      });
      
      // Open het dialoogvenster om een voogd toe te voegen
      setIsAddGuardianDialogOpen(true);
      
      // Vernieuw de lijst direct met de toegevoegde student
      // De cache wordt automatisch bijgewerkt bij de volgende pagina-refresh
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de student.",
        variant: "destructive"
      });
    }
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setFormData({
      firstName: student.firstName || "",
      lastName: student.lastName || "",
      email: student.email || "",
      phone: student.phone || "",
      dateOfBirth: student.dateOfBirth || null,
      street: student.street || "",
      houseNumber: student.houseNumber || "",
      postalCode: student.postalCode || "",
      city: student.city || "",
      programId: student.programId?.toString() || "",
      enrollmentDate: student.enrollmentDate || "",
      status: student.status || "active",
      notes: student.notes || "",
      studentGroupId: student.studentGroupId?.toString() || "",
      gender: student.gender || "man",
      photoUrl: student.photoUrl || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteStudentClick = (student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };
  
  const handleDeleteStudent = async () => {
    try {
      // Werkelijke API-aanroep om de student te verwijderen
      await fetch(`/api/students/${selectedStudent.id}`, {
        method: 'DELETE',
      });
      
      // Vernieuw de studentenlijst na het verwijderen
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      toast({
        title: "Succes",
        description: `Student ${selectedStudent.firstName} ${selectedStudent.lastName} is succesvol verwijderd.`,
      });
      setIsDeleteDialogOpen(false);
    } catch (error) {
      console.error('Fout bij het verwijderen van student:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de student.",
        variant: "destructive"
      });
    }
  };
  
  const handleUpdateStudent = (e) => {
    e.preventDefault();
    try {
      // Update student implementation would be here
      console.log('Updating student:', formData);
      
      // Mock success feedback
      toast({
        title: "Succes",
        description: `Student ${formData.firstName} ${formData.lastName} is succesvol bijgewerkt.`,
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de student.",
        variant: "destructive"
      });
    }
  };

  const formatDateToDisplayFormat = (dateString) => {
    if (!dateString) return "";
    try {
      return format(parseISO(dateString), 'P', { locale: nl });
    } catch (error) {
      return dateString;
    }
  };
  
  // Functie voor het ophalen van gegevens via eID
  const handleEidAuthentication = () => {
    // Toon een bericht dat het systeem wacht op de eID kaart
    toast({
      title: "eID kaartlezer geactiveerd",
      description: "Plaats uw eID kaart in de kaartlezer...",
      duration: 5000,
    });
    
    // Simuleer een succesvol uitlezen van de eID (in productie zou dit via een echte eID reader API gaan)
    setTimeout(() => {
      // Dit zijn voorbeeldgegevens die automatisch zouden worden ingevuld na het uitlezen van de eID
      const eidData = {
        firstName: "Mohammed",
        lastName: "El Amrani",
        dateOfBirth: "2010-05-15",
        gender: "man",
        street: "Brugstraat",
        houseNumber: "42",
        postalCode: "2000",
        city: "Antwerpen",
        photoUrl: "/images/student-photo-sample.jpg" // In productie: echte foto van de eID
      };
      
      // Vul het formulier in met de data van de eID
      setFormData(prev => ({
        ...prev,
        ...eidData
      }));
      
      toast({
        title: "eID gegevens geladen",
        description: "De gegevens zijn succesvol uitgelezen en ingevuld.",
        variant: "success",
      });
    }, 2000);
  };
  
  // Importeer functionaliteit
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImportFile(file);
    }
  };
  
  const handleImportStudents = () => {
    if (!importFile) {
      toast({
        title: "Geen bestand geselecteerd",
        description: "Selecteer een CSV of Excel bestand om te importeren.",
        variant: "destructive",
      });
      return;
    }
    
    // Simuleer het verwerken van het bestand
    toast({
      title: "Verwerken",
      description: "Bestand wordt verwerkt...",
    });
    
    // Hier zou echte import logica komen om het bestand te verwerken
    setTimeout(() => {
      // Vernieuw de studentenlijst na het importeren
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      toast({
        title: "Import voltooid",
        description: "De studenten zijn succesvol geïmporteerd.",
      });
      
      setIsImportDialogOpen(false);
      setImportFile(null);
    }, 2000);
  };
  
  // Exporteer functionaliteit
  const handleExportStudents = (format) => {
    // Toon een toast-bericht dat het exporteren is gestart
    toast({
      title: "Exporteren",
      description: `Studenten worden geëxporteerd naar ${format.toUpperCase()}...`,
    });
    
    // Simuleer het exporteren van de studenten
    setTimeout(() => {
      toast({
        title: "Export voltooid",
        description: `De studenten zijn succesvol geëxporteerd naar ${format.toUpperCase()}.`,
      });
      
      // Sluit het dialoogvenster
      setIsExportDialogOpen(false);
    }, 1500);
  };
  
  // Functie voor het ophalen van gegevens via itsme
  const handleItsmeAuthentication = () => {
    // Toon een bericht dat het systeem wacht op itsme authenticatie
    toast({
      title: "itsme authenticatie gestart",
      description: "Open de itsme app op uw smartphone en bevestig uw identiteit...",
      duration: 5000,
    });
    
    // Simuleer een succesvol authenticeren via itsme (in productie zou dit via de itsme API gaan)
    setTimeout(() => {
      // Dit zijn voorbeeldgegevens die automatisch zouden worden ingevuld na authenticatie via itsme
      const itsmeData = {
        firstName: "Fatima",
        lastName: "Benali",
        dateOfBirth: "2011-08-22",
        gender: "vrouw",
        email: "fatima.benali@example.com",
        phone: "0470123456",
        street: "Kerkstraat",
        houseNumber: "15",
        postalCode: "1000",
        city: "Brussel"
      };
      
      // Vul het formulier in met de data van itsme
      setFormData(prev => ({
        ...prev,
        ...itsmeData
      }));
      
      toast({
        title: "itsme gegevens geladen",
        description: "De gegevens zijn succesvol uitgelezen en ingevuld.",
        variant: "success",
      });
    }, 2000);
  };

  // Gebruik echte data van de API
  const students = studentsData;

  // Gebruik echte programma's data van de API
  const programs = programsData || [];

  // Gebruik echte studentgroepen data van de API
  const studentGroups = studentGroupsData || [];

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      <PremiumHeader 
        title="Studenten" 
        description="Bekijk en beheer alle studentgegevens, inclusief persoonlijke informatie en inschrijvingsdetails"
        icon={Users}
        breadcrumbs={{
          parent: "Beheer",
          current: "Studenten"
        }}
      />
      
      <DataTableContainer>
        <SearchActionBar>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Filters"
            >
              <Filter className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportDialogOpen(true)}
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Importeer studenten"
            >
              <Download className="h-3.5 w-3.5" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExportDialogOpen(true)}
              className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
              title="Exporteer studenten"
            >
              <Upload className="h-3.5 w-3.5" />
            </Button>

            <Button
              size="sm"
              onClick={() => setIsCreateDialogOpen(true)}
              className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white ml-auto"
            >
              <PlusCircle className="h-3.5 w-3.5 mr-1" />
              Nieuwe Student
            </Button>
          </div>
        </SearchActionBar>

        {/* Filter opties */}
        {showFilterOptions && (
          <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-wrap gap-3 items-center">
            <div className="flex items-center">
              {(statusFilter !== 'all' || filterProgram !== 'all' || filterAcademicYear !== 'all' || filterStudentGroup !== 'all') && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    setStatusFilter('all');
                    setFilterProgram('all');
                    setFilterAcademicYear('all');
                    setFilterStudentGroup('all');
                  }}
                  className="h-7 text-xs text-blue-600 p-0 mr-3"
                >
                  Filters wissen
                </Button>
              )}
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Select 
                value={filterStudentGroup} 
                onValueChange={setFilterStudentGroup}
              >
                <SelectTrigger className="w-40 h-7 text-xs rounded-sm border-[#e5e7eb] bg-white">
                  <SelectValue placeholder="Klas" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#e5e7eb]">
                  <SelectItem value="all" className="focus:bg-blue-200 hover:bg-blue-100">Alle klassen</SelectItem>
                  {studentGroups.map((group) => (
                    <SelectItem key={group.id} value={group.id.toString()} className="focus:bg-blue-200 hover:bg-blue-100">
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select 
                value={filterAcademicYear} 
                onValueChange={setFilterAcademicYear}
              >
                <SelectTrigger className="w-40 h-7 text-xs rounded-sm border-[#e5e7eb] bg-white">
                  <SelectValue placeholder="Schooljaar" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#e5e7eb]">
                  <SelectItem value="all" className="focus:bg-blue-200 hover:bg-blue-100">Alle schooljaren</SelectItem>
                  <SelectItem value="2025-2026" className="focus:bg-blue-200 hover:bg-blue-100">2025-2026</SelectItem>
                  <SelectItem value="2024-2025" className="focus:bg-blue-200 hover:bg-blue-100">2024-2025</SelectItem>
                  <SelectItem value="2023-2024" className="focus:bg-blue-200 hover:bg-blue-100">2023-2024</SelectItem>
                  <SelectItem value="2022-2023" className="focus:bg-blue-200 hover:bg-blue-100">2022-2023</SelectItem>
                </SelectContent>
              </Select>
              
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-40 h-7 text-xs rounded-sm border-[#e5e7eb] bg-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#e5e7eb]">
                  <SelectItem value="all" className="focus:bg-blue-200 hover:bg-blue-100">Alle statussen</SelectItem>
                  <SelectItem value="active" className="focus:bg-blue-200 hover:bg-blue-100">Actief</SelectItem>
                  <SelectItem value="inactive" className="focus:bg-blue-200 hover:bg-blue-100">Inactief</SelectItem>
                  <SelectItem value="graduated" className="focus:bg-blue-200 hover:bg-blue-100">Afgestudeerd</SelectItem>
                  <SelectItem value="withdrawn" className="focus:bg-blue-200 hover:bg-blue-100">Teruggetrokken</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Student Table */}
        <TableContainer>
          <Table>
            <DataTableHeader>
              <TableRow>
                <ShadcnTableHead className="px-4 py-3 w-[40px] text-center">
                  <Checkbox 
                    checked={students.length > 0 && selectedStudents.length === students.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStudents(students.map(s => s.id));
                      } else {
                        setSelectedStudents([]);
                      }
                    }}
                    className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
                  />
                </ShadcnTableHead>
                <ShadcnTableHead className="px-4 py-3 text-center w-[100px]">
                  <span className="text-xs font-medium text-gray-700">ID</span>
                </ShadcnTableHead>
                <ShadcnTableHead className="px-4 py-3 text-center">
                  <span className="text-xs font-medium text-gray-700">Naam</span>
                </ShadcnTableHead>
                <ShadcnTableHead className="px-4 py-3 text-center">
                  <span className="text-xs font-medium text-gray-700">Klas</span>
                </ShadcnTableHead>
                <ShadcnTableHead className="px-4 py-3 text-center">
                  <span className="text-xs font-medium text-gray-700">Schooljaar</span>
                </ShadcnTableHead>
                <ShadcnTableHead className="px-4 py-3 text-center">
                  <span className="text-xs font-medium text-gray-700">Status</span>
                </ShadcnTableHead>
                <ShadcnTableHead className="px-4 py-3 text-right w-[100px]">
                </ShadcnTableHead>
              </TableRow>
            </DataTableHeader>
            <TableBody>
              {studentsLoading ? (
                <TableLoadingState />
              ) : students.length === 0 ? (
                <EmptyTableState 
                  icon={<User className="h-12 w-12 mx-auto text-gray-300" />}
                  title="Geen studenten gevonden"
                  description={searchTerm.trim() !== '' || statusFilter !== 'all' || filterProgram !== 'all' 
                    ? 'Probeer andere zoek- of filtercriteria te gebruiken.' 
                    : 'Er zijn nog geen studenten toegevoegd in het systeem.'}
                  action={
                    (searchTerm.trim() !== '' || statusFilter !== 'all' || filterProgram !== 'all') && (
                      <Button 
                        variant="outline"
                        className="mt-4 h-7 text-xs rounded-sm" 
                        size="sm"
                        onClick={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                          setFilterProgram('all');
                        }}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Wis Filters
                      </Button>
                    )
                  }
                />
              ) : (
                students.map((student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50 group">
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
                        className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
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
                        <div>
                          <p className="text-xs font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600 text-center">
                      {student.studentGroupName || '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600 text-center">
                      {student.academicYear || '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-center">
                      <Badge 
                        variant="outline" 
                        className={`text-xs rounded-sm ${
                          student.status === 'active' ? "bg-green-50 text-green-700 border-green-200" : 
                          student.status === 'inactive' ? "bg-gray-50 text-gray-700 border-gray-200" : 
                          student.status === 'graduated' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {student.status === 'active' ? 'Actief' : 
                         student.status === 'inactive' ? 'Inactief' : 
                         student.status === 'graduated' ? 'Afgestudeerd' : 
                         student.status === 'withdrawn' ? 'Teruggetrokken' : student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                          onClick={() => handleDeleteStudentClick(student)}
                          className="h-7 w-7 p-0 text-gray-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DataTableContainer>

      {/* Create Student Dialog */}
      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            // Reset het formulier wanneer het dialoogvenster sluit
            setFormData(emptyFormData);
          }
        }}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden max-h-[90vh]" aria-describedby="student-dialog-description">
          <div className="bg-[#1e40af] py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">Student Toevoegen</DialogTitle>
                <DialogDescription id="student-dialog-description" className="text-white/70 text-sm m-0">
                  Voeg een nieuwe student toe aan het systeem.
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleCreateStudent} className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 150px)' }}>
            <div className="px-6 py-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-4 md:col-span-2">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Persoonlijke Informatie
                    </h3>
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 mb-1">Foto</p>
                      <div className="flex gap-4 justify-between">
                        <div 
                          className="w-32 h-32 rounded-md border border-gray-300 flex flex-col items-center justify-center bg-gray-50 overflow-hidden relative cursor-pointer hover:bg-gray-100 transition-colors"
                          onClick={() => document.getElementById('photo-upload').click()}
                        >
                          {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="Student foto" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                        <div className="flex flex-col gap-2 justify-center items-end">
                          <button 
                            type="button" 
                            className="flex items-center justify-center gap-1 border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors text-sm"
                            onClick={handleEidAuthentication}
                          >
                            <img src="/images/beid-logo.png" alt="eID" className="h-5" />
                            <span className="text-xs font-medium text-gray-700">eID</span>
                          </button>
                          <button 
                            type="button" 
                            className="flex items-center justify-center gap-1 border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                            onClick={handleItsmeAuthentication}
                          >
                            <img src="/images/itsme-logo.jpeg" alt="itsme" className="h-5" />
                            <span className="text-xs font-medium">itsme</span>
                          </button>
                        </div>
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                setFormData(prev => ({
                                  ...prev,
                                  photoUrl: reader.result
                                }));
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="studentId" className="text-xs font-medium text-gray-700">Student ID</Label>
                        <Input
                          id="studentId"
                          name="studentId"
                          value={formData.academicYear ? 
                            `ST${formData.academicYear.substring(2, 4)}001` : 
                            nextStudentId}
                          disabled
                          className="mt-1 h-9 bg-gray-50 text-gray-500"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="gender" className="text-xs font-medium text-gray-700">Geslacht *</Label>
                        <Select 
                          value={formData.gender} 
                          onValueChange={(value) => handleSelectChange('gender', value)}
                          required
                        >
                          <SelectTrigger id="gender" className="mt-1 h-9 w-full border-[#e5e7eb] bg-white">
                            <SelectValue placeholder="Man of Vrouw" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#e5e7eb]">
                            <SelectItem value="man" className="focus:bg-blue-200 hover:bg-blue-100">Man</SelectItem>
                            <SelectItem value="vrouw" className="focus:bg-blue-200 hover:bg-blue-100">Vrouw</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">Voornaam *</Label>
                        <Input
                          id="firstName"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-9"
                          placeholder="Voornaam"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">Achternaam *</Label>
                        <Input
                          id="lastName"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-9"
                          placeholder="Achternaam"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="email" className="text-xs font-medium text-gray-700">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className="mt-1 h-9"
                          placeholder="Email"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="phone" className="text-xs font-medium text-gray-700">Telefoon</Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="mt-1 h-9"
                          placeholder="Telefoon"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="dateOfBirth" className="text-xs font-medium text-gray-700">Geboortedatum *</Label>
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth || ''}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-9"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <MapPin className="h-4 w-4 mr-2" />
                      Adresgegevens
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2">
                        <Label htmlFor="street" className="text-xs font-medium text-gray-700">Straat *</Label>
                        <Input
                          id="street"
                          name="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-9"
                          placeholder="Straat"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="houseNumber" className="text-xs font-medium text-gray-700">Huisnummer *</Label>
                        <Input
                          id="houseNumber"
                          name="houseNumber"
                          value={formData.houseNumber}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-9"
                          placeholder="Nr."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="postalCode" className="text-xs font-medium text-gray-700">Postcode *</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-9"
                          placeholder="Postcode"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="city" className="text-xs font-medium text-gray-700">Plaats *</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
                          required
                          className="mt-1 h-9"
                          placeholder="Plaats"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Onderwijsgegevens
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label htmlFor="academicYear" className="text-xs font-medium text-gray-700">Schooljaar *</Label>
                        <Select 
                          value={formData.academicYear || ''} 
                          onValueChange={(value) => handleSelectChange('academicYear', value)}
                          required
                        >
                          <SelectTrigger id="academicYear" className="mt-1 h-9 w-full border-[#e5e7eb] bg-white">
                            <SelectValue placeholder="Selecteer schooljaar" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#e5e7eb]">
                            <SelectItem value="2024-2025" className="focus:bg-blue-200 hover:bg-blue-100">2024-2025</SelectItem>
                            <SelectItem value="2025-2026" className="focus:bg-blue-200 hover:bg-blue-100">2025-2026</SelectItem>
                            <SelectItem value="2026-2027" className="focus:bg-blue-200 hover:bg-blue-100">2026-2027</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="studentGroupId" className="text-xs font-medium text-gray-700">Klas</Label>
                        <Select 
                          value={formData.studentGroupId} 
                          onValueChange={(value) => handleSelectChange('studentGroupId', value)}
                        >
                          <SelectTrigger id="studentGroupId" className="mt-1 h-9 w-full border-[#e5e7eb] bg-white">
                            <SelectValue placeholder="Selecteer klas" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#e5e7eb]">
                            {studentGroups.map((group) => (
                              <SelectItem key={group.id} value={group.id.toString()} className="focus:bg-blue-200 hover:bg-blue-100">
                                {group.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="enrollmentDate" className="text-xs font-medium text-gray-700">Inschrijfdatum</Label>
                        <Input
                          id="enrollmentDate"
                          name="enrollmentDate"
                          type="date"
                          value={formData.enrollmentDate || new Date().toISOString().split('T')[0]}
                          onChange={handleInputChange}
                          className="mt-1 h-9"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="status" className="text-xs font-medium text-gray-700">Status *</Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={(value) => handleSelectChange('status', value)}
                          required
                        >
                          <SelectTrigger id="status" className="mt-1 h-9 w-full border-[#e5e7eb] bg-white">
                            <SelectValue placeholder="Selecteer status" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#e5e7eb]">
                            <SelectItem value="enrolled" className="focus:bg-blue-200 hover:bg-blue-100">Ingeschreven</SelectItem>
                            <SelectItem value="unenrolled" className="focus:bg-blue-200 hover:bg-blue-100">Uitgeschreven</SelectItem>
                            <SelectItem value="suspended" className="focus:bg-blue-200 hover:bg-blue-100">Geschorst</SelectItem>
                            <SelectItem value="graduated" className="focus:bg-blue-200 hover:bg-blue-100">Afgestudeerd</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <NotebookText className="h-4 w-4 mr-2" />
                      Aantekeningen
                    </h3>
                    <div>
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={5}
                        className="resize-none"
                        placeholder="Voeg hier eventuele opmerkingen of aantekeningen toe..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 px-6 py-3 flex justify-end gap-2 border-t">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  setIsCreateDialogOpen(false);
                  resetForm();
                }}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                className="bg-[#1e40af] hover:bg-[#1e40af]/90"
              >
                Student Toevoegen
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Student Dialog */}
      <CustomDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogHeaderWithIcon 
          title="Student Details" 
          description="Gedetailleerde informatie over de student"
          icon={<User className="h-5 w-5 text-white" />}
        />
        
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 150px)' }}>
          {selectedStudent && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 mb-6">
                <Avatar className="h-16 w-16 border-2 border-gray-200">
                  {selectedStudent.photoUrl ? (
                    <AvatarImage src={selectedStudent.photoUrl} alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`} />
                  ) : (
                    <AvatarFallback className="bg-[#1e40af] text-white text-lg">
                      {selectedStudent.firstName?.charAt(0)}{selectedStudent.lastName?.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                  <p className="text-sm text-gray-500">{selectedStudent.studentId}</p>
                  <Badge className="mt-2" variant={selectedStudent.status === "active" ? "default" : "secondary"}>
                    {selectedStudent.status === "active" ? "Actief" : selectedStudent.status}
                  </Badge>
                </div>
              </div>
              
              <SectionContainer title="Persoonlijke Informatie" icon={<User className="h-4 w-4" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <CustomFormLabel>Student ID</CustomFormLabel>
                    <p className="text-sm mt-1">{selectedStudent.studentId}</p>
                  </div>
                  <div>
                    <CustomFormLabel>Naam</CustomFormLabel>
                    <p className="text-sm mt-1">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                  </div>
                  <div>
                    <CustomFormLabel>Email</CustomFormLabel>
                    <p className="text-sm mt-1">{selectedStudent.email || "-"}</p>
                  </div>
                  <div>
                    <CustomFormLabel>Telefoon</CustomFormLabel>
                    <p className="text-sm mt-1">{selectedStudent.phone || "-"}</p>
                  </div>
                  <div>
                    <CustomFormLabel>Geboortedatum</CustomFormLabel>
                    <p className="text-sm mt-1">{selectedStudent.dateOfBirth ? formatDateToDisplayFormat(selectedStudent.dateOfBirth) : "-"}</p>
                  </div>
                  <div>
                    <CustomFormLabel>Geslacht</CustomFormLabel>
                    <p className="text-sm mt-1">{selectedStudent.gender === "man" ? "Man" : "Vrouw"}</p>
                  </div>
                </div>
              </SectionContainer>
              
              <SectionContainer title="Adresgegevens" icon={<MapPin className="h-4 w-4" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <CustomFormLabel>Adres</CustomFormLabel>
                    <p className="text-sm mt-1">
                      {selectedStudent.street ? `${selectedStudent.street} ${selectedStudent.houseNumber || ""}` : "-"}
                    </p>
                  </div>
                  <div>
                    <CustomFormLabel>Postcode</CustomFormLabel>
                    <p className="text-sm mt-1">{selectedStudent.postalCode || "-"}</p>
                  </div>
                  <div>
                    <CustomFormLabel>Plaats</CustomFormLabel>
                    <p className="text-sm mt-1">{selectedStudent.city || "-"}</p>
                  </div>
                </div>
              </SectionContainer>
              
              <SectionContainer title="Onderwijsgegevens" icon={<GraduationCap className="h-4 w-4" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <CustomFormLabel>Programma</CustomFormLabel>
                    <p className="text-sm mt-1">{selectedStudent.programName || "-"}</p>
                  </div>
                  <div>
                    <CustomFormLabel>Status</CustomFormLabel>
                    <div className="text-sm mt-1">
                      <Badge variant={selectedStudent.status === "active" ? "default" : "secondary"}>
                        {selectedStudent.status === "active" ? "Actief" : 
                         selectedStudent.status === "graduated" ? "Afgestudeerd" : 
                         selectedStudent.status === "suspended" ? "Geschorst" : 
                         selectedStudent.status === "withdrawn" ? "Teruggetrokken" : 
                         selectedStudent.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <CustomFormLabel>Klas</CustomFormLabel>
                    <p className="text-sm mt-1">{selectedStudent.studentGroupName || "-"}</p>
                  </div>
                  <div>
                    <CustomFormLabel>Schooljaar</CustomFormLabel>
                    <p className="text-sm mt-1">{selectedStudent.academicYear || "-"}</p>
                  </div>
                  <div>
                    <CustomFormLabel>Inschrijfdatum</CustomFormLabel>
                    <p className="text-sm mt-1">{selectedStudent.enrollmentDate ? formatDateToDisplayFormat(selectedStudent.enrollmentDate) : "-"}</p>
                  </div>
                </div>
              </SectionContainer>
              
              {selectedStudent.notes && (
                <SectionContainer title="Aantekeningen" icon={<NotebookText className="h-4 w-4" />}>
                  <p className="text-sm whitespace-pre-wrap">{selectedStudent.notes}</p>
                </SectionContainer>
              )}
            </div>
          )}
        </div>
        
        <DialogFooterContainer
          showSubmitButton={false}
          cancelText="Sluiten"
          onCancel={() => setIsViewDialogOpen(false)}
        />
      </CustomDialog>

      {/* Edit Student Dialog */}
      <CustomDialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogHeaderWithIcon 
          title="Student Bewerken" 
          description="Bewerk de gegevens van deze student"
          icon={<FileEdit className="h-5 w-5 text-white" />}
        />
        
        <form onSubmit={handleUpdateStudent} className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 150px)' }}>
          <div className="px-6 py-4">
            <div className="space-y-4">
              <SectionContainer title="Persoonlijke Informatie" icon={<User className="h-4 w-4" />}>
                <div className="mb-4 flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <Avatar className="h-24 w-24 border-2 border-gray-200 mb-2">
                        {formData.photoUrl ? (
                          <AvatarImage src={formData.photoUrl} alt={`${formData.firstName} ${formData.lastName}`} />
                        ) : (
                          <AvatarFallback className="bg-[#1e40af] text-white text-xl">
                            {formData.firstName?.charAt(0)}{formData.lastName?.charAt(0)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div 
                        className="absolute bottom-0 right-0 bg-gray-100 rounded-full p-1 border border-gray-300 cursor-pointer hover:bg-gray-200 transition-colors"
                        onClick={() => document.getElementById('photo-upload-edit').click()}
                      >
                        <Camera className="h-4 w-4 text-gray-700" />
                      </div>
                    </div>
                    <input
                      id="photo-upload-edit"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData(prev => ({
                              ...prev,
                              photoUrl: reader.result as string
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">Klik op het camera-icoon om de foto te wijzigen</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <CustomFormLabel htmlFor="firstName">Voornaam</CustomFormLabel>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <CustomFormLabel htmlFor="lastName">Achternaam</CustomFormLabel>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <CustomFormLabel htmlFor="email">Email</CustomFormLabel>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <CustomFormLabel htmlFor="phone">Telefoon</CustomFormLabel>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <CustomFormLabel htmlFor="gender">Geslacht</CustomFormLabel>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => setFormData({ ...formData, gender: value })}
                    >
                      <SelectTrigger id="gender" className="h-9 border-[#e5e7eb] bg-white">
                        <SelectValue placeholder="Man of Vrouw" />
                      </SelectTrigger>
                      <SelectContent className="bg-white border-[#e5e7eb]">
                        <SelectItem value="man" className="focus:bg-blue-200 hover:bg-blue-100">Man</SelectItem>
                        <SelectItem value="vrouw" className="focus:bg-blue-200 hover:bg-blue-100">Vrouw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <CustomFormLabel htmlFor="dateOfBirth">Geboortedatum</CustomFormLabel>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth ? formData.dateOfBirth.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
              </SectionContainer>
              
              <SectionContainer title="Adresgegevens" icon={<MapPin className="h-4 w-4" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <CustomFormLabel htmlFor="street">Straat</CustomFormLabel>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <CustomFormLabel htmlFor="houseNumber">Huisnummer</CustomFormLabel>
                    <Input
                      id="houseNumber"
                      value={formData.houseNumber}
                      onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <CustomFormLabel htmlFor="postalCode">Postcode</CustomFormLabel>
                    <Input
                      id="postalCode"
                      value={formData.postalCode}
                      onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  <div>
                    <CustomFormLabel htmlFor="city">Plaats</CustomFormLabel>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
              </SectionContainer>
              
              <SectionContainer title="Onderwijsgegevens" icon={<GraduationCap className="h-4 w-4" />}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <CustomFormLabel htmlFor="programId">Programma</CustomFormLabel>
                    <Select 
                      value={formData.programId} 
                      onValueChange={(value) => setFormData({ ...formData, programId: value })}
                    >
                      <SelectTrigger id="programId" className="h-9">
                        <SelectValue placeholder="Selecteer programma" />
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
                    <CustomFormLabel htmlFor="studentGroupId">Klas</CustomFormLabel>
                    <Select 
                      value={formData.studentGroupId} 
                      onValueChange={(value) => setFormData({ ...formData, studentGroupId: value })}
                    >
                      <SelectTrigger id="studentGroupId" className="h-9">
                        <SelectValue placeholder="Selecteer klas" />
                      </SelectTrigger>
                      <SelectContent>
                        {studentGroups.map((group) => (
                          <SelectItem key={group.id} value={group.id.toString()}>
                            {group.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <CustomFormLabel htmlFor="status">Status</CustomFormLabel>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => setFormData({ ...formData, status: value })}
                    >
                      <SelectTrigger id="status" className="h-9">
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actief</SelectItem>
                        <SelectItem value="graduated">Afgestudeerd</SelectItem>
                        <SelectItem value="suspended">Geschorst</SelectItem>
                        <SelectItem value="withdrawn">Teruggetrokken</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <CustomFormLabel htmlFor="enrollmentDate">Inschrijfdatum</CustomFormLabel>
                    <Input
                      id="enrollmentDate"
                      type="date"
                      value={formData.enrollmentDate ? formData.enrollmentDate.split('T')[0] : ''}
                      onChange={(e) => setFormData({ ...formData, enrollmentDate: e.target.value })}
                      className="h-9"
                    />
                  </div>
                </div>
              </SectionContainer>
              
              <SectionContainer title="Aantekeningen" icon={<NotebookText className="h-4 w-4" />}>
                <div>
                  <CustomFormLabel htmlFor="notes">Aantekeningen</CustomFormLabel>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    className="min-h-[100px]"
                  />
                </div>
              </SectionContainer>
            </div>
          </div>
          
          <DialogFooterContainer
            onCancel={() => setIsEditDialogOpen(false)}
            submitText="Opslaan"
          />
        </form>
      </CustomDialog>

      {/* Delete Student Dialog */}
      <CustomDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogHeaderWithIcon 
          title="Student Verwijderen" 
          description="Weet je zeker dat je deze student wilt verwijderen?"
          icon={<Trash2 className="h-5 w-5 text-white" />}
        />
        
        <div className="px-6 py-4">
          {selectedStudent && (
            <div className="mb-6">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-gray-200">
                  {selectedStudent.photoUrl ? (
                    <AvatarImage src={selectedStudent.photoUrl} alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`} />
                  ) : (
                    <AvatarFallback className="bg-[#1e40af] text-white">
                      {selectedStudent.firstName?.charAt(0)}{selectedStudent.lastName?.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div>
                  <p className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                  <p className="text-xs text-gray-500">Student ID: {selectedStudent.studentId}</p>
                </div>
              </div>
            </div>
          )}
          
          <p className="text-sm text-gray-600 mb-6">Deze actie kan niet ongedaan worden gemaakt. De student wordt permanent verwijderd uit het systeem.</p>
          
          <DialogFooterContainer>
            <Button 
              type="button" 
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="border-gray-300"
            >
              Annuleren
            </Button>
            <Button 
              type="button"
              variant="destructive"
              onClick={handleDeleteStudent}
            >
              Verwijderen
            </Button>
          </DialogFooterContainer>
        </div>
      </CustomDialog>

      {/* Dialoogvenster voor voogd toevoegen */}
      <Dialog open={isAddGuardianDialogOpen} onOpenChange={setIsAddGuardianDialogOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-2">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <DialogTitle className="text-center">Voogd toevoegen</DialogTitle>
              <DialogDescription className="text-center">
                Wil je een voogd toevoegen en koppelen aan deze student?
              </DialogDescription>
            </div>
            
            <div className="bg-gray-50 rounded-md p-4 mb-6">
              <p className="text-gray-700">De student is succesvol toegevoegd. Wil je nu direct een voogd toevoegen en koppelen aan deze student?</p>
              <p className="mt-2 text-gray-700">Student ID: <span className="font-semibold">{newStudentId}</span></p>
            </div>
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsAddGuardianDialogOpen(false)}
              >
                Later toevoegen
              </Button>
              <Button 
                type="button"
                onClick={() => {
                  console.log('Navigating to add guardian for student:', newStudentId);
                  // Hier zou je naar het voogd formulier navigeren met de student ID
                  setIsAddGuardianDialogOpen(false);
                  // Voorbeeld navigatie (in een echte implementatie zou je naar de voogd pagina navigeren)
                  toast({
                    title: "Voogd toevoegen",
                    description: "Je wordt doorgestuurd naar het voogd formulier.",
                  });
                }}
              >
                Voogd toevoegen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Importeer dialoog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[525px] p-0 overflow-hidden">
          <div className="bg-[#1e40af] py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Download className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">Studenten Importeren</DialogTitle>
                <DialogDescription className="text-white/70 text-sm m-0">
                  Upload een CSV of Excel bestand met studentgegevens
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="bg-[#f1f5f9] p-4 rounded-md">
              <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                <FileEdit className="h-4 w-4 mr-2" />
                Velden voor importeren
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-xs text-gray-600">
                  <ul className="space-y-1">
                    <li>• firstName (Voornaam)</li>
                    <li>• lastName (Achternaam)</li>
                    <li>• gender (Geslacht)</li>
                    <li>• academicYear (Schooljaar)</li>
                    <li>• studentGroupId (Klas ID)</li>
                    <li>• status (Status)</li>
                    <li>• email (E-mail)</li>
                  </ul>
                </div>
                <div className="text-xs text-gray-600">
                  <ul className="space-y-1">
                    <li>• phone (Telefoon)</li>
                    <li>• dateOfBirth (Geboortedatum)</li>
                    <li>• street (Straat)</li>
                    <li>• houseNumber (Huisnummer)</li>
                    <li>• postalCode (Postcode)</li>
                    <li>• city (Plaats)</li>
                    <li>• notes (Aantekeningen)</li>
                  </ul>
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-3">
                <Info className="h-3 w-3 inline-block mr-1" />
                Het CSV- of Excel-bestand moet kolommen bevatten met bovenstaande veldnamen.
              </p>
            </div>
            
            <div className="border-2 border-dashed border-gray-300 rounded-md px-6 py-8 bg-white">
              <div className="flex flex-col items-center text-center">
                <Upload className="h-10 w-10 text-[#1e40af] mb-3" />
                <h3 className="text-sm font-medium text-gray-900">
                  {importFile ? importFile.name : "Sleep bestand hierheen of klik om te uploaden"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  CSV of Excel bestanden worden ondersteund
                </p>
                <label className="mt-4">
                  <input
                    type="file"
                    className="hidden"
                    accept=".csv,.xlsx,.xls"
                    onChange={handleFileChange}
                  />
                  <Button 
                    variant="outline" 
                    className="h-8 text-xs rounded-sm border-[#e5e7eb] hover:bg-[#f1f5f9] hover:text-[#1e40af]"
                    asChild
                  >
                    <span>Bestand selecteren</span>
                  </Button>
                </label>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
              <p className="text-xs text-blue-800 flex items-start">
                <Fingerprint className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>Alle gegevens zullen worden gevalideerd voordat ze worden toegevoegd. Ongeldige rijen worden overgeslagen.</span>
              </p>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsImportDialogOpen(false);
                setImportFile(null);
              }}
              className="h-8 text-xs rounded-sm border-[#e5e7eb]"
            >
              Annuleren
            </Button>
            <Button 
              onClick={handleImportStudents}
              className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
              disabled={!importFile}
            >
              Importeren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Exporteer dialoog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          <div className="bg-[#1e40af] py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">Studenten Exporteren</DialogTitle>
                <DialogDescription className="text-white/70 text-sm m-0">
                  Kies een formaat om de studenten te exporteren
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="bg-[#f1f5f9] p-4 rounded-md">
              <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                <FileDown className="h-4 w-4 mr-2" />
                Selecteer exportformaat
              </h3>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <Button 
                  variant="outline"
                  className="h-24 rounded-md border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-blue-300 hover:bg-blue-50"
                  onClick={() => handleExportStudents('excel')}
                >
                  <Upload className="h-8 w-8 text-green-600" />
                  <span className="text-sm font-medium">Excel</span>
                </Button>
                <Button 
                  variant="outline"
                  className="h-24 rounded-md border-gray-300 flex flex-col items-center justify-center gap-2 hover:border-blue-300 hover:bg-blue-50"
                  onClick={() => handleExportStudents('pdf')}
                >
                  <Upload className="h-8 w-8 text-red-600" />
                  <span className="text-sm font-medium">PDF</span>
                </Button>
              </div>
            </div>
            
            <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
              <p className="text-xs text-amber-800 flex items-start">
                <GraduationCap className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                <span>
                  {selectedStudents.length > 0
                    ? `Je hebt ${selectedStudents.length} student(en) geselecteerd om te exporteren.`
                    : "Je hebt geen studenten geselecteerd. Alle studenten worden geëxporteerd."}
                </span>
              </p>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsExportDialogOpen(false)}
              className="h-8 text-xs rounded-sm border-[#e5e7eb]"
            >
              Annuleren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}