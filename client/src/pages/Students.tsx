import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { 
  Search, PlusCircle, Filter, Download, Users, User, Camera,
  Fingerprint, ChevronRight, Edit, Trash2, Eye, Home, X,
  GraduationCap, NotebookText, MapPin, FileEdit, Upload, FileDown,
  ArrowDownToLine, ArrowUpToLine, Info, UserPlus, UserCheck, HeartPulse,
  Mail, Save
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import { 
  DataTableContainer, 
  SearchActionBar, 
  TableContainer,
  DataTableHeader,
  TableLoadingState,
  EmptyTableState,
  QuickActions
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
  const [_, setLocation] = useLocation();
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
  const [isAddGuardianDialogOpen, setIsAddGuardianDialogOpen] = useState(false);
  const [isLinkSiblingDialogOpen, setIsLinkSiblingDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [newStudentGuardians, setNewStudentGuardians] = useState<any[]>([]);
  const [newStudentSiblings, setNewStudentSiblings] = useState<any[]>([]);
  const [guardianFormData, setGuardianFormData] = useState({
    firstName: '',
    lastName: '',
    relationship: 'ouder',
    email: '',
    phone: '',
    address: '',
    occupation: '',
    isEmergencyContact: true,
  });
  const [isAddingNewGuardian, setIsAddingNewGuardian] = useState(true);
  const [guardianSearchTerm, setGuardianSearchTerm] = useState('');
  const [siblingSearchTerm, setSiblingSearchTerm] = useState('');
  const [selectedGuardians, setSelectedGuardians] = useState<any[]>([]);
  const [selectedSiblings, setSelectedSiblings] = useState<any[]>([]);
  const [hasValidationAttempt, setHasValidationAttempt] = useState(false);
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
    enrollmentDate: new Date().toISOString().split('T')[0], // Huidige datum als standaard
    status: "enrolled",
    notes: "",
    studentGroupId: "",
    gender: "man",
    photoUrl: "",
    studentId: "",
    academicYear: ""
  };
  
  const [formData, setFormData] = useState(emptyFormData);
  // Initialiseer students state met data uit localStorage indien beschikbaar
  const [students, setStudents] = useState(() => {
    const savedStudents = localStorage.getItem('students');
    return savedStudents ? JSON.parse(savedStudents) : [];
  });
  
  const { toast } = useToast();

  // Data fetching met voorkeur voor localStorage data tijdens ontwikkeling
  const { data: studentsData = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students'],
    // Gebruik staleTime om cache langer te behouden tijdens ontwikkeling
    staleTime: Infinity
  });
  
  const { data: programsData = [] } = useQuery({
    queryKey: ['/api/programs'],
  });
  
  const { data: studentGroupsData = [] } = useQuery({
    queryKey: ['/api/student-groups'],
  });
  
  const { data: guardians = [] } = useQuery({
    queryKey: ['/api/guardians'],
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

  const [newStudentId, setNewStudentId] = useState(null);

  // State om ontbrekende velden bij te houden
  const [missingRequiredFields, setMissingRequiredFields] = useState([]);
  
  // Effect om studenten te synchroniseren met localStorage wanneer ze veranderen
  useEffect(() => {
    if (students.length > 0) {
      localStorage.setItem('students', JSON.stringify(students));
      console.log('Studenten opgeslagen in localStorage:', students.length);
    }
  }, [students]);
  
  const handleCreateStudent = async (e) => {
    e.preventDefault();
    
    // Controleer verplichte velden
    const requiredFields = [
      { name: 'firstName', label: 'Voornaam' },
      { name: 'lastName', label: 'Achternaam' },
      { name: 'dateOfBirth', label: 'Geboortedatum' },
      { name: 'gender', label: 'Geslacht' },
      { name: 'street', label: 'Straat' },
      { name: 'houseNumber', label: 'Huisnummer' },
      { name: 'postalCode', label: 'Postcode' },
      { name: 'city', label: 'Plaats' },
      { name: 'academicYear', label: 'Schooljaar' },
      { name: 'enrollmentDate', label: 'Inschrijfdatum' },
      { name: 'status', label: 'Status' }
    ];
    
    const missingFields = requiredFields.filter(field => !formData[field.name]);
    
    // Update state met ontbrekende velden
    setMissingRequiredFields(missingFields.map(f => f.name));
    
    if (missingFields.length > 0) {
      toast({
        title: "Verplichte velden ontbreken",
        description: `Vul de volgende verplichte velden in: ${missingFields.map(f => f.label).join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    try {
      // Genereer een uniek ID voor de nieuwe student
      const newStudent = {
        ...formData,
        id: Date.now(), // Gebruik timestamp als unieke ID
        studentId: formData.studentId || nextStudentId,
        status: formData.status || "ingeschreven", // Default waarde
        programName: programs.find(p => p.id.toString() === formData.programId)?.name || '',
        studentGroupName: studentGroups.find(g => g.id.toString() === formData.studentGroupId)?.name || '',
        guardians: selectedGuardians,
        relatedStudents: selectedSiblings
      };
      
      // Update studenten lijst met nieuwe student
      setStudents(prevStudents => {
        const updatedStudents = [newStudent, ...prevStudents];
        // Sla de bijgewerkte lijst op in localStorage
        localStorage.setItem('students', JSON.stringify(updatedStudents));
        return updatedStudents;
      });
      
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
      
    } catch (error) {
      console.error("Fout bij toevoegen student:", error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het toevoegen van de student.",
        variant: "destructive"
      });
    }
  };

  const handleViewStudent = async (student) => {
    // Basisinformatie van de student instellen
    setSelectedStudent(student);
    
    try {
      // Haal de werkelijke voogden op die aan deze student zijn gekoppeld
      const studentGuardians = student.guardians || [];
      
      // Haal de werkelijke broers/zussen op die aan deze student zijn gekoppeld
      const studentSiblings = student.relatedStudents || [];
      
      // Update de geselecteerde student met de werkelijke gegevens
      setSelectedStudent(prevStudent => ({
        ...prevStudent,
        guardians: studentGuardians,
        relatedStudents: studentSiblings
      }));
      
      // Open het dialoogvenster
      setIsViewDialogOpen(true);
    } catch (error) {
      console.error("Fout bij het ophalen van gerelateerde gegevens:", error);
      toast({
        title: "Waarschuwing",
        description: "Kon niet alle gegevens voor deze student laden.",
        variant: "destructive"
      });
      
      // Open het dialoogvenster nog steeds met basis studentgegevens
      setIsViewDialogOpen(true);
    }
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
      
      // Update lokale state
      const updatedStudents = students.filter(student => student.id !== selectedStudent.id);
      setStudents(updatedStudents);
      
      // Update localStorage
      localStorage.setItem('students', JSON.stringify(updatedStudents));
      
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

  // Update studenten wanneer data wordt geladen
  useEffect(() => {
    if (studentsData && studentsData.length > 0) {
      setStudents(studentsData);
    }
  }, [studentsData]);

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
                    <TableCell className="px-4 py-3 text-xs font-medium">{student.studentId}</TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center">
                        <Avatar className="h-7 w-7 mr-3">
                          {student.photoUrl ? (
                            <AvatarImage src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} />
                          ) : (
                            <AvatarFallback className="text-xs bg-[#1e40af] text-white" style={{ backgroundColor: "#1e40af" }}>
                              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <p className="text-xs font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600">
                      {student.studentGroupName || '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600">
                      {student.academicYear || '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge 
                        variant="outline" 
                        className={`text-xs rounded-sm ${
                          student.status === 'active' || student.status === 'ingeschreven' ? "bg-green-50 text-green-700 border-green-200" : 
                          student.status === 'inactive' || student.status === 'uitgeschreven' ? "bg-gray-50 text-gray-700 border-gray-200" : 
                          student.status === 'afgestudeerd' ? "bg-blue-50 text-blue-700 border-blue-200" :
                          student.status === 'geschorst' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                          "bg-yellow-50 text-yellow-700 border-yellow-200"
                        }`}
                      >
                        {student.status === 'active' ? 'Ingeschreven' : 
                         student.status === 'inactive' ? 'Uitgeschreven' : 
                         student.status === 'enrolled' ? 'Ingeschreven' :
                         student.status === 'graduated' ? 'Afgestudeerd' :
                         student.status === 'suspended' ? 'Geschorst' :
                         student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <QuickActions
                        onView={() => handleViewStudent(student)}
                        onEdit={() => handleEditStudent(student)}
                        onDelete={() => handleDeleteStudentClick(student)}
                      />
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
                          <SelectTrigger 
                            id="gender" 
                            className={`mt-1 h-9 w-full border-[#e5e7eb] bg-white ${missingRequiredFields.includes('gender') ? 'border-red-500 bg-red-50' : ''}`}
                          >
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
                          className={`mt-1 h-9 ${missingRequiredFields.includes('firstName') ? 'border-red-500 bg-red-50' : ''}`}
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
                          className={`mt-1 h-9 ${missingRequiredFields.includes('lastName') ? 'border-red-500 bg-red-50' : ''}`}
                          placeholder="Achternaam"
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
                          className={`mt-1 h-9 ${missingRequiredFields.includes('dateOfBirth') ? 'border-red-500 bg-red-50' : ''}`}
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
                          className={`mt-1 h-9 ${missingRequiredFields.includes('street') ? 'border-red-500 bg-red-50' : ''}`}
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
                          className={`mt-1 h-9 ${missingRequiredFields.includes('houseNumber') ? 'border-red-500 bg-red-50' : ''}`}
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
                          className={`mt-1 h-9 ${missingRequiredFields.includes('postalCode') ? 'border-red-500 bg-red-50' : ''}`}
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
                          className={`mt-1 h-9 ${missingRequiredFields.includes('city') ? 'border-red-500 bg-red-50' : ''}`}
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
                          <SelectTrigger 
                            id="academicYear"
                            className={`mt-1 h-9 w-full border-[#e5e7eb] bg-white ${missingRequiredFields.includes('academicYear') ? 'border-red-500 bg-red-50' : ''}`}
                          >
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
                        <Label htmlFor="enrollmentDate" className="text-xs font-medium text-gray-700">Inschrijfdatum *</Label>
                        <Input
                          id="enrollmentDate"
                          name="enrollmentDate"
                          type="date"
                          value={formData.enrollmentDate || new Date().toISOString().split('T')[0]}
                          onChange={handleInputChange}
                          required
                          className={`mt-1 h-9 ${missingRequiredFields.includes('enrollmentDate') ? 'border-red-500 bg-red-50' : ''}`}
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="status" className="text-xs font-medium text-gray-700">Status *</Label>
                        <Select 
                          value={formData.status} 
                          onValueChange={(value) => handleSelectChange('status', value)}
                          required
                        >
                          <SelectTrigger 
                            id="status" 
                            className={`mt-1 h-9 w-full border-[#e5e7eb] bg-white ${missingRequiredFields.includes('status') ? 'border-red-500 bg-red-50' : ''}`}
                          >
                            <SelectValue placeholder="Selecteer status" />
                          </SelectTrigger>
                          <SelectContent className="bg-white border-[#e5e7eb]">
                            <SelectItem value="ingeschreven" className="focus:bg-blue-200 hover:bg-blue-100">Ingeschreven</SelectItem>
                            <SelectItem value="uitgeschreven" className="focus:bg-blue-200 hover:bg-blue-100">Uitgeschreven</SelectItem>
                            <SelectItem value="geschorst" className="focus:bg-blue-200 hover:bg-blue-100">Geschorst</SelectItem>
                            <SelectItem value="afgestudeerd" className="focus:bg-blue-200 hover:bg-blue-100">Afgestudeerd</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md w-full">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Familie
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">Voogden</Label>
                        {selectedGuardians.length > 0 ? (
                          <div className="space-y-2 mb-2">
                            {selectedGuardians.map((guardian, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="bg-[#1e40af] text-white text-xs">
                                    {guardian.firstName?.charAt(0)}{guardian.lastName?.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="text-sm font-medium">{guardian.firstName} {guardian.lastName}</p>
                                  <p className="text-xs text-gray-500">{guardian.relationship}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 ml-auto"
                                  onClick={() => {
                                    setSelectedGuardians(selectedGuardians.filter((_, i) => i !== index));
                                  }}
                                >
                                  <X className="h-3.5 w-3.5 text-gray-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div className="p-3 bg-gray-50 rounded-md text-center">
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            className="text-[#1e40af] border-[#1e40af] hover:bg-blue-50 w-full"
                            onClick={() => {
                              setIsAddGuardianDialogOpen(true);
                            }}
                          >
                            <UserPlus className="h-3.5 w-3.5 mr-1" />
                            Voogd toevoegen
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">Broers/Zussen</Label>
                        {selectedSiblings.length > 0 ? (
                          <div className="space-y-2 mb-2">
                            {selectedSiblings.map((sibling, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-md">
                                <Avatar className="h-8 w-8">
                                  {sibling.photoUrl ? (
                                    <AvatarImage src={sibling.photoUrl} alt={`${sibling.firstName} ${sibling.lastName}`} />
                                  ) : (
                                    <AvatarFallback className="bg-[#1e40af] text-white text-xs">
                                      {sibling.firstName?.charAt(0)}{sibling.lastName?.charAt(0)}
                                    </AvatarFallback>
                                  )}
                                </Avatar>
                                <div>
                                  <p className="text-sm">{sibling.firstName} {sibling.lastName}</p>
                                  <p className="text-xs text-gray-500">{sibling.studentId}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 ml-auto"
                                  onClick={() => {
                                    setSelectedSiblings(selectedSiblings.filter((_, i) => i !== index));
                                  }}
                                >
                                  <X className="h-3.5 w-3.5 text-gray-500" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : null}
                        <div className="p-3 bg-gray-50 rounded-md text-center">
                          <Button 
                            type="button"
                            variant="outline" 
                            size="sm"
                            className="text-[#1e40af] border-[#1e40af] hover:bg-blue-50 w-full"
                            onClick={() => {
                              setIsLinkSiblingDialogOpen(true);
                            }}
                          >
                            <Users className="h-3.5 w-3.5 mr-1" />
                            Broer/Zus koppelen
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md mt-4">
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

      {/* View Student Dialog - Readonly Details */}
      <CustomDialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogHeaderWithIcon 
          title="Student Overzicht" 
          description="Bekijk studentinformatie (alleen-lezen)"
          icon={<Eye className="h-5 w-5 text-white" />}
        />
        
        <div className="px-6 py-4 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 150px)' }}>
          {selectedStudent && (
            <div className="space-y-6">
              {/* Student Header */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <Avatar className="h-20 w-20 border-4 border-white shadow-md">
                  {selectedStudent.photoUrl ? (
                    <AvatarImage src={selectedStudent.photoUrl} alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`} />
                  ) : (
                    <AvatarFallback className="bg-[#1e40af] text-white text-xl">
                      {selectedStudent.firstName?.charAt(0)}{selectedStudent.lastName?.charAt(0)}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</h2>
                  <p className="text-lg text-gray-600 font-medium">{selectedStudent.studentId}</p>
                  <Badge 
                    variant="outline" 
                    className={`text-sm rounded-full px-3 py-1 font-medium ${
                      selectedStudent.status === 'active' || selectedStudent.status === 'ingeschreven' ? "bg-green-50 text-green-700 border-green-200" : 
                      selectedStudent.status === 'inactive' || selectedStudent.status === 'uitgeschreven' ? "bg-gray-50 text-gray-700 border-gray-200" : 
                      selectedStudent.status === 'afgestudeerd' ? "bg-blue-50 text-blue-700 border-blue-200" :
                      selectedStudent.status === 'geschorst' ? "bg-yellow-50 text-yellow-700 border-yellow-200" :
                      "bg-yellow-50 text-yellow-700 border-yellow-200"
                    }`}
                  >
                    {selectedStudent.status === 'active' ? 'Ingeschreven' : 
                     selectedStudent.status === 'inactive' ? 'Uitgeschreven' : 
                     selectedStudent.status === 'enrolled' ? 'Ingeschreven' :
                     selectedStudent.status === 'graduated' ? 'Afgestudeerd' :
                     selectedStudent.status === 'suspended' ? 'Geschorst' :
                     selectedStudent.status}
                  </Badge>
                </div>
              </div>
              
              {/* Persoonlijke Informatie */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 py-3 border-b">
                  <h3 className="text-lg font-semibold text-[#1e40af] flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Persoonlijke Informatie
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-gray-500">Email</dt>
                      <dd className="text-sm text-gray-900">{selectedStudent.email || "Niet opgegeven"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-gray-500">Telefoon</dt>
                      <dd className="text-sm text-gray-900">{selectedStudent.phone || "Niet opgegeven"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-gray-500">Geboortedatum</dt>
                      <dd className="text-sm text-gray-900">
                        {selectedStudent.dateOfBirth ? format(parseISO(selectedStudent.dateOfBirth), 'd MMMM yyyy', { locale: nl }) : "Niet opgegeven"}
                      </dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-gray-500">Geslacht</dt>
                      <dd className="text-sm text-gray-900">{selectedStudent.gender || "Niet opgegeven"}</dd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Onderwijs Informatie */}
              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 py-3 border-b">
                  <h3 className="text-lg font-semibold text-green-700 flex items-center">
                    <GraduationCap className="h-5 w-5 mr-2" />
                    Onderwijs
                  </h3>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-gray-500">Klas</dt>
                      <dd className="text-sm text-gray-900">{selectedStudent.studentGroupName || "Geen klas toegewezen"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-gray-500">Programma</dt>
                      <dd className="text-sm text-gray-900">{selectedStudent.programName || "Geen programma toegewezen"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-gray-500">Schooljaar</dt>
                      <dd className="text-sm text-gray-900">{selectedStudent.academicYear || "Niet opgegeven"}</dd>
                    </div>
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-gray-500">Inschrijfdatum</dt>
                      <dd className="text-sm text-gray-900">
                        {selectedStudent.enrollmentDate ? format(parseISO(selectedStudent.enrollmentDate), 'd MMMM yyyy', { locale: nl }) : "Niet opgegeven"}
                      </dd>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adres Informatie */}
              {(selectedStudent.street || selectedStudent.city) && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 px-4 py-3 border-b">
                    <h3 className="text-lg font-semibold text-purple-700 flex items-center">
                      <MapPin className="h-5 w-5 mr-2" />
                      Adres
                    </h3>
                  </div>
                  <div className="p-4">
                    <div className="space-y-1">
                      <dt className="text-sm font-medium text-gray-500">Adres</dt>
                      <dd className="text-sm text-gray-900">
                        {[selectedStudent.street, selectedStudent.houseNumber].filter(Boolean).join(' ')}<br/>
                        {[selectedStudent.postalCode, selectedStudent.city].filter(Boolean).join(' ')}
                      </dd>
                    </div>
                  </div>
                </div>
              )}

              {/* Opmerkingen */}
              {selectedStudent.notes && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-orange-50 to-amber-50 px-4 py-3 border-b">
                    <h3 className="text-lg font-semibold text-orange-700 flex items-center">
                      <FileText className="h-5 w-5 mr-2" />
                      Opmerkingen
                    </h3>
                  </div>
                  <div className="p-4">
                    <p className="text-sm text-gray-900">{selectedStudent.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <DialogFooterContainer>
          <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
            Sluiten
          </Button>
        </DialogFooterContainer>
      </CustomDialog>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Student bewerken</DialogTitle>
          </DialogHeader>
          <p>Edit dialog inhoud komt hier...</p>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteStudent}
        title="Student verwijderen"
        description={`Weet je zeker dat je ${studentToDelete?.firstName} ${studentToDelete?.lastName} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
      />
    </div>
  );
}
