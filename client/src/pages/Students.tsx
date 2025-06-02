import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Link, useLocation } from 'wouter';
import { useToast } from "@/hooks/use-toast";
import { 
  Search, PlusCircle, Filter, Download, Users, User, Camera,
  Fingerprint, ChevronRight, Edit, Trash2, Eye, Home, X,
  GraduationCap, NotebookText, MapPin, FileEdit, Upload, FileDown,
  ArrowDownToLine, ArrowUpToLine, Info, UserPlus, UserCheck, HeartPulse,
  Mail, Save, FileText, Calendar, Phone, AlertTriangle, Plus, Link2
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
import { DeleteDialog } from "@/components/ui/delete-dialog";
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
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [newStudentGuardians, setNewStudentGuardians] = useState<any[]>([]);
  const [newStudentSiblings, setNewStudentSiblings] = useState<any[]>([]);
  const [guardianFormData, setGuardianFormData] = useState({
    firstName: '',
    lastName: '',
    relationship: 'parent',
    relationshipOther: '',
    email: '',
    phone: '',
    isEmergencyContact: false,
    emergencyContactFirstName: '',
    emergencyContactLastName: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    emergencyContactRelationshipOther: '',
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
    academicYear: "2024-2025"
  };
  
  const [formData, setFormData] = useState(emptyFormData);
  const [editFormData, setEditFormData] = useState(emptyFormData);
  // Studenten data komt nu alleen uit de database via React Query

  // Functie om de volgende beschikbare student ID te genereren op basis van schooljaar
  const generateNextStudentId = (studentsData = []) => {
    // Haal het huidige jaar op en maak suffix (bijv. 2025 -> 25)
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2); // Laatste 2 cijfers van het jaar
    const prefix = `ST${yearSuffix}`;
    
    if (studentsData.length === 0) return `${prefix}001`;
    
    // Haal alle bestaande student ID's op voor het huidige jaar
    const existingIds = studentsData
      .map(student => student.studentId)
      .filter(id => id && id.startsWith(prefix))
      .map(id => parseInt(id.substring(prefix.length)))
      .filter(num => !isNaN(num))
      .sort((a, b) => a - b);
    
    // Zoek het volgende beschikbare nummer
    let nextNumber = 1;
    for (const num of existingIds) {
      if (num === nextNumber) {
        nextNumber++;
      } else {
        break;
      }
    }
    
    return `${prefix}${nextNumber.toString().padStart(3, '0')}`;
  };
  
  const { toast } = useToast();

  // Data fetching van database
  const { data: studentsData = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students'],
    staleTime: 5 * 60 * 1000, // 5 minuten cache
    refetchOnWindowFocus: true,
    refetchOnMount: true
  });
  
  const { data: programsData = [] } = useQuery({
    queryKey: ['/api/programs'],
  });
  
  const { data: studentGroupsData = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ['/api/student-groups'],
  });
  
  const { data: guardians = [] } = useQuery({
    queryKey: ['/api/guardians'],
  });

  // Query voor het ophalen van sibling relaties van een student
  const { data: studentSiblings = [], refetch: refetchSiblings } = useQuery({
    queryKey: ['/api/students', selectedStudent?.id, 'siblings'],
    queryFn: () => selectedStudent?.id ? apiRequest(`/api/students/${selectedStudent.id}/siblings`) : [],
    enabled: !!selectedStudent?.id,
    staleTime: 0, // Altijd verse data ophalen
    refetchOnWindowFocus: true
  });

  // Helper functie om relatie waarden naar Nederlands te vertalen
  const getRelationshipLabel = (relationship: string) => {
    switch (relationship) {
      case 'sibling':
        return 'Broer/Zus';
      case 'parent':
        return 'Ouder';
      case 'guardian':
        return 'Voogd';
      case 'grandparent':
        return 'Grootouder';
      case 'other':
        return 'Anders';
      default:
        return 'Broer/Zus'; // Default voor siblings
    }
  };

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
  
  // Data wordt nu alleen opgehaald uit de database via React Query
  
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
      // Stap 1: Maak eerst de student aan in de database
      const studentData = {
        ...formData,
        status: formData.status || "ingeschreven"
      };
      
      const studentResponse = await apiRequest('/api/students', {
        method: 'POST',
        body: studentData
      });
      
      console.log('Student aangemaakt:', studentResponse);
      
      // Stap 2: Maak nieuwe voogden aan en koppel ze
      if (newStudentGuardians && newStudentGuardians.length > 0) {
        for (const guardian of newStudentGuardians) {
          try {
            // Maak eerst de voogd aan in de database
            const guardianResponse = await apiRequest('/api/guardians', {
              method: 'POST',
              body: {
                firstName: guardian.firstName,
                lastName: guardian.lastName,
                email: guardian.email,
                phone: guardian.phone,
                relationship: guardian.relationship,
                relationshipOther: guardian.relationshipOther,
                address: guardian.address,
                occupation: guardian.occupation,
                isEmergencyContact: guardian.isEmergencyContact,
                emergencyContactFirstName: guardian.emergencyContactFirstName,
                emergencyContactLastName: guardian.emergencyContactLastName,
                emergencyContactPhone: guardian.emergencyContactPhone,
                emergencyContactRelationship: guardian.emergencyContactRelationship,
                emergencyContactRelationshipOther: guardian.emergencyContactRelationshipOther
              }
            });
            
            // Koppel de voogd aan de student
            await apiRequest('/api/student-guardians', {
              method: 'POST',
              body: {
                studentId: studentResponse.id,
                guardianId: guardianResponse.id,
                relationshipType: guardian.relationship,
                isPrimary: guardian.isEmergencyContact || false
              }
            });
            
            console.log('Voogd aangemaakt en gekoppeld:', guardianResponse);
          } catch (guardianError) {
            console.error('Fout bij aanmaken voogd:', guardianError);
            toast({
              title: "Waarschuwing",
              description: `Voogd ${guardian.firstName} ${guardian.lastName} kon niet worden aangemaakt.`,
              variant: "destructive",
            });
          }
        }
      }
      
      // Stap 3: Refresh de data
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      
      // Reset formulier en states
      resetForm();
      setNewStudentGuardians([]);
      setSelectedGuardians([]);
      setIsCreateDialogOpen(false);
      
      toast({
        title: "Student toegevoegd",
        description: "De student en gekoppelde voogden zijn succesvol toegevoegd."
      });
      
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
    // Pre-fill the edit form with student data
    setEditFormData({
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
      studentGroup: student.studentGroupName && student.academicYear ? `${student.studentGroupName} (${student.academicYear})` : "", // Laad bestaande klasnaam met schooljaar
      studentGroupName: student.studentGroupName || "", // Voor tabelweergave
      gender: student.gender || "man",
      photoUrl: student.photoUrl || "",
      studentId: student.studentId || "",
      academicYear: student.academicYear || "2024-2025"
    });
    
    // Load existing family data
    setNewStudentGuardians(student.guardians || []);
    setNewStudentSiblings(student.siblings || []);
    
    setIsEditDialogOpen(true);
  };

  const handleDeleteStudentClick = (student) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      // Werkelijke API-aanroep om de student te verwijderen
      await fetch(`/api/students/${studentToDelete.id}`, {
        method: 'DELETE',
      });
      
      // Vernieuw de studentenlijst na het verwijderen
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      // Update lokale state
      // Data wordt automatisch bijgewerkt via React Query invalidation
      
      toast({
        title: "Succes",
        description: `Student ${studentToDelete.firstName} ${studentToDelete.lastName} is succesvol verwijderd.`,
      });
      
      setIsDeleteDialogOpen(false);
      setStudentToDelete(null);
    } catch (error) {
      console.error('Fout bij het verwijderen van student:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen van de student.",
        variant: "destructive"
      });
    }
  };
  
  // Functie om edit form input te hanteren
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  // Functie om edit form select te hanteren
  const handleEditSelectChange = (name, value) => {
    if (name === 'studentGroup') {
      // Als klas wordt gewijzigd, zoek het groep ID en sla de klasnaam op
      // De waarde is nu in het formaat "Klas 1A (2024-2025)", dus we matchen op de volledige string
      const selectedGroup = studentGroupsData?.find(group => `${group.name} (${group.academicYear})` === value);
      setEditFormData(prev => ({ 
        ...prev, 
        [name]: value,
        studentGroupId: selectedGroup ? selectedGroup.id.toString() : '', // Sla groep ID op
        studentGroupName: selectedGroup ? selectedGroup.name : '', // Alleen de klasnaam zonder schooljaar
        academicYear: selectedGroup ? selectedGroup.academicYear : '' // Sla het schooljaar apart op
      }));
    } else {
      setEditFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  // Functie om edit form te submitten
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (!selectedStudent) return;

      // Stuur wijzigingen naar de database via API
      const studentUpdateData = {
        ...editFormData,
        id: selectedStudent.id,
        // Converteer lege strings naar null voor numerieke velden
        programId: editFormData.programId === '' ? null : parseInt(editFormData.programId),
        studentGroupId: editFormData.studentGroupId === '' ? null : parseInt(editFormData.studentGroupId)
      };

      const updatedStudent = await apiRequest(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        body: studentUpdateData
      });

      console.log('Student bijgewerkt:', updatedStudent);
      
      // Stap 2: Update de klas enrollment als studentGroupId is gewijzigd
      if (editFormData.studentGroupId && editFormData.studentGroupId !== '') {
        try {
          const groupId = parseInt(editFormData.studentGroupId);
          
          // Eerst alle bestaande actieve enrollments voor deze student deactiveren
          await apiRequest(`/api/students/${selectedStudent.id}/enrollments/deactivate-all`, {
            method: 'PUT'
          });
          
          // Dan een nieuwe actieve enrollment aanmaken
          await apiRequest('/api/student-group-enrollments', {
            method: 'POST',
            body: {
              studentId: selectedStudent.id,
              groupId: groupId,
              status: 'active',
              notes: `Bijgewerkt via student edit op ${new Date().toLocaleDateString('nl-NL')}`
            }
          });
          
          console.log('Klas enrollment bijgewerkt voor groep:', groupId);
        } catch (enrollmentError) {
          console.warn('Klas enrollment kon niet worden bijgewerkt:', enrollmentError);
          // Dit is een waarschuwing, niet een fatale fout
        }
      }
      
      // Stap 3: Verwerk toegevoegde voogden
      if (newStudentGuardians.length > 0) {
        try {
          for (const guardian of newStudentGuardians) {
            // Controleer of de voogd al bestaat (alleen als email beschikbaar is)
            let guardianId;
            let existingGuardian = null;
            
            if (guardian.email) {
              try {
                existingGuardian = await apiRequest(`/api/guardians/email/${encodeURIComponent(guardian.email)}`, {
                  method: 'GET'
                });
              } catch (error) {
                // Voogd bestaat niet, we maken een nieuwe aan
                existingGuardian = null;
              }
            }
            
            if (existingGuardian && existingGuardian.id) {
              guardianId = existingGuardian.id;
              console.log('Bestaande voogd gevonden:', guardianId);
            } else {
              // Maak nieuwe voogd aan
              const newGuardian = await apiRequest('/api/guardians', {
                method: 'POST',
                body: {
                  firstName: guardian.firstName,
                  lastName: guardian.lastName,
                  email: guardian.email || null,
                  phone: guardian.phone || null,
                  relationship: guardian.relationship || 'parent',
                  isEmergencyContact: guardian.isEmergencyContact || false,
                  emergencyContactName: guardian.emergencyContactName || null,
                  emergencyContactPhone: guardian.emergencyContactPhone || null,
                  emergencyContactRelation: guardian.emergencyContactRelation || null
                }
              });
              guardianId = newGuardian.id;
              console.log('Nieuwe voogd aangemaakt:', guardianId);
            }
            
            // Koppel voogd aan student (controleer eerst of relatie al bestaat)
            await apiRequest('/api/student-guardians', {
              method: 'POST',
              body: {
                studentId: selectedStudent.id,
                guardianId: guardianId,
                relationship: guardian.relationship || 'parent'
              }
            });
            console.log('Voogd gekoppeld aan student:', { studentId: selectedStudent.id, guardianId, relationship: guardian.relationship });
          }
          console.log('Alle voogden succesvol toegevoegd');
        } catch (guardianError) {
          console.error('Voogden konden niet worden toegevoegd:', guardianError);
        }
      }
      
      // Refresh de students data
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student-group-enrollments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
      
      toast({
        title: "Succes",
        description: `Student ${editFormData.firstName} ${editFormData.lastName} is succesvol bijgewerkt.`,
      });
      
      setIsEditDialogOpen(false);
      setEditFormData(emptyFormData);
      setSelectedStudent(null);
      setNewStudentGuardians([]);
    } catch (error) {
      console.error('Fout bij het bijwerken van student:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het bijwerken van de student.",
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
  


  // Database data wordt automatisch gebruikt via React Query

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
                    checked={studentsData.length > 0 && selectedStudents.length === studentsData.length}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedStudents(studentsData.map(s => s.id));
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
              ) : studentsData.length === 0 ? (
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
                studentsData.map((student) => (
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
                      {student.studentGroup || '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600">
                      {student.academicYear || '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <Badge 
                        variant="outline" 
                        className={`text-xs rounded-sm ${
                          student.status === 'active' || student.status === 'ingeschreven' ? "bg-green-50 text-green-700 border-green-200" : 
                          student.status === 'inactive' || student.status === 'uitgeschreven' ? "bg-red-50 text-red-700 border-red-200" : 
                          student.status === 'afgestudeerd' ? "bg-gray-50 text-gray-700 border-gray-200" :
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
                        <Input
                          id="academicYear"
                          name="academicYear"
                          value={formData.academicYear}
                          onChange={handleInputChange}
                          placeholder="2024-2025"
                          className={`mt-1 h-9 w-full border-[#e5e7eb] bg-white ${missingRequiredFields.includes('academicYear') ? 'border-red-500 bg-red-50' : ''}`}
                          required
                        />
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
                        {newStudentGuardians.length > 0 ? (
                          <div className="space-y-2 mb-2">
                            {newStudentGuardians.map((guardian, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-md border">
                                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{guardian.firstName} {guardian.lastName}</p>
                                  <p className="text-xs text-gray-500">
                                    {guardian.relationship === 'parent' && 'Ouder'}
                                    {guardian.relationship === 'guardian' && 'Voogd'}
                                    {guardian.relationship === 'grandparent' && 'Grootouder'}
                                    {guardian.relationship === 'other' && guardian.relationshipOther}
                                    {guardian.phone && ` • ${guardian.phone}`}
                                  </p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    setNewStudentGuardians(newStudentGuardians.filter((_, i) => i !== index));
                                    toast({
                                      title: "Voogd verwijderd",
                                      description: `${guardian.firstName} ${guardian.lastName} is verwijderd.`,
                                    });
                                  }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md text-center mb-2">
                            <UserPlus className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Nog geen voogden toegevoegd</p>
                          </div>
                        )}
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          className="text-[#1e40af] border-[#1e40af] hover:bg-blue-50 w-full"
                          onClick={() => setIsAddGuardianDialogOpen(true)}
                        >
                          <UserPlus className="h-3.5 w-3.5 mr-1" />
                          Voogd toevoegen
                        </Button>
                      </div>
                      
                      <div>
                        <Label className="text-xs font-medium text-gray-700 mb-2 block">Broers/Zussen</Label>
                        {newStudentSiblings.length > 0 ? (
                          <div className="space-y-2 mb-2">
                            {newStudentSiblings.map((sibling, index) => (
                              <div key={index} className="flex items-center gap-3 p-2 bg-white rounded-md border">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                  <Users className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium">{sibling.firstName} {sibling.lastName}</p>
                                  <p className="text-xs text-gray-500">{sibling.studentId} • {sibling.class}</p>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  className="h-7 w-7 p-0 text-red-500 hover:text-red-700"
                                  onClick={() => {
                                    setNewStudentSiblings(newStudentSiblings.filter((_, i) => i !== index));
                                    toast({
                                      title: "Broer/zus ontkoppeld",
                                      description: `${sibling.firstName} ${sibling.lastName} is ontkoppeld.`,
                                    });
                                  }}
                                >
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="p-3 bg-gray-50 rounded-md text-center mb-2">
                            <Users className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                            <p className="text-xs text-gray-500">Nog geen broers/zussen gekoppeld</p>
                          </div>
                        )}
                        <Button 
                          type="button"
                          variant="outline" 
                          size="sm"
                          className="text-[#1e40af] border-[#1e40af] hover:bg-blue-50 w-full"
                          onClick={() => setIsLinkSiblingDialogOpen(true)}
                        >
                          <Users className="h-3.5 w-3.5 mr-1" />
                          Broer/Zus koppelen
                        </Button>
                      </div>
                    </div>
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
                      selectedStudent.status === 'inactive' || selectedStudent.status === 'uitgeschreven' ? "bg-red-50 text-red-700 border-red-200" : 
                      selectedStudent.status === 'afgestudeerd' ? "bg-gray-50 text-gray-700 border-gray-200" :
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
              
              {/* Persoonlijke Informatie - alleen velden van het toevoegen formulier */}
              <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2" />
                  Persoonlijke Informatie
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <User className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Geslacht</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.gender || 'Niet opgegeven'}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Geboortedatum</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStudent.dateOfBirth ? format(parseISO(selectedStudent.dateOfBirth), 'd MMMM yyyy', { locale: nl }) : "Niet opgegeven"}
                    </p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Mail className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Email</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.email || "Niet opgegeven"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Phone className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Telefoon</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.phone || "Niet opgegeven"}</p>
                  </div>
                </div>
              </div>

              {/* Adresgegevens - alle velden van het toevoegen formulier */}
              <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  Adresgegevens
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Straat</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.street || "Niet opgegeven"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Huisnummer</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.houseNumber || "Niet opgegeven"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Postcode</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.postalCode || "Niet opgegeven"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <MapPin className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Plaats</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.city || "Niet opgegeven"}</p>
                  </div>
                </div>
              </div>

              {/* Onderwijsgegevens - alleen velden van het toevoegen formulier */}
              <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                  <GraduationCap className="h-4 w-4 mr-2" />
                  Onderwijsgegevens
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Schooljaar</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.academicYear || "Niet opgegeven"}</p>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Users className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Klas</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">{selectedStudent.studentGroupName || "Niet toegewezen"}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-gray-500">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs font-medium uppercase tracking-wide">Inschrijvingsdatum</span>
                    </div>
                    <p className="text-sm font-medium text-gray-900">
                      {selectedStudent.enrollmentDate ? format(parseISO(selectedStudent.enrollmentDate), 'd MMMM yyyy', { locale: nl }) : "Niet opgegeven"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Familie Informatie */}
              <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                  <Users className="h-4 w-4 mr-2" />
                  Familie
                </h3>
                <div className="space-y-4">
                  {/* Voogden */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Voogden</h4>
                    <div className="space-y-2">
                      {selectedStudent.guardians && selectedStudent.guardians.length > 0 ? (
                        selectedStudent.guardians.map((guardian: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                  {guardian.firstName?.charAt(0)}{guardian.lastName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{guardian.firstName} {guardian.lastName}</p>
                                <p className="text-xs text-gray-500">{guardian.relationship || 'Relatie niet opgegeven'}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-600">{guardian.phone || 'Geen telefoon'}</p>
                              <p className="text-xs text-gray-500">{guardian.email || 'Geen email'}</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">Geen voogden toegewezen</p>
                      )}
                    </div>
                  </div>

                  {/* Broers/Zussen */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Broers/Zussen</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsLinkSiblingDialogOpen(true)}
                        className="text-xs h-7 px-2 border-[#1e40af] text-[#1e40af] hover:bg-[#1e40af] hover:text-white"
                      >
                        <Link className="h-3 w-3 mr-1" />
                        Koppelen
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {studentSiblings && studentSiblings.length > 0 ? (
                        studentSiblings.map((sibling: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                                  {sibling.firstName?.charAt(0)}{sibling.lastName?.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="text-sm font-medium text-gray-900">{sibling.firstName} {sibling.lastName}</p>
                                <p className="text-xs text-gray-500">{sibling.studentIdCode || 'Student ID niet beschikbaar'}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <div className="text-right">
                                <div className="flex items-center gap-1">
                                  <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 min-w-[60px] justify-center">
                                    {getRelationshipLabel(sibling.relationship)}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Familie relatie</p>
                              </div>
                              <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await apiRequest(`/api/students/${selectedStudent.id}/siblings/${sibling.id}`, {
                                    method: 'DELETE'
                                  });
                                  queryClient.invalidateQueries({ queryKey: ['/api/students', selectedStudent.id, 'siblings'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/students', sibling.siblingId, 'siblings'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/students'] });
                                  refetchSiblings();
                                  toast({
                                    title: "Broer/zus ontkoppeld",
                                    description: `${sibling.firstName} ${sibling.lastName} is ontkoppeld.`,
                                  });
                                } catch (error) {
                                  console.error('Error removing sibling:', error);
                                  toast({
                                    title: "Fout",
                                    description: "Er is een probleem opgetreden bij het ontkoppelen van de broer/zus.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 italic">Geen broers/zussen geregistreerd</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notities - volledige breedte */}
              <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                  <FileText className="h-4 w-4 mr-2" />
                  Notities
                </h3>
                <div className="bg-white rounded-md border border-gray-200 p-4">
                  {selectedStudent.notes ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedStudent.notes}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Geen notities toegevoegd</p>
                  )}
                </div>
              </div>
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
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby="edit-student-description">
          <DialogHeaderWithIcon 
            title="Student Bewerken" 
            description="Pas de studentgegevens aan en sla wijzigingen op"
            icon={<Edit className="h-5 w-5 text-white" />}
          />
          
          <form onSubmit={handleEditSubmit} className="px-6 py-4 space-y-6">
            {/* Persoonlijke Informatie */}
            <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
              <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                <User className="h-4 w-4 mr-2" />
                Persoonlijke Informatie
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-firstName" className="text-xs font-medium text-gray-700">Voornaam *</Label>
                  <Input
                    id="edit-firstName"
                    name="firstName"
                    value={editFormData.firstName}
                    onChange={handleEditInputChange}
                    placeholder="Voornaam"
                    className={`mt-1 h-9 w-full border-[#e5e7eb] bg-white ${missingRequiredFields.includes('firstName') ? 'border-red-500 bg-red-50' : ''}`}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-lastName" className="text-xs font-medium text-gray-700">Achternaam *</Label>
                  <Input
                    id="edit-lastName"
                    name="lastName"
                    value={editFormData.lastName}
                    onChange={handleEditInputChange}
                    placeholder="Achternaam"
                    className={`mt-1 h-9 w-full border-[#e5e7eb] bg-white ${missingRequiredFields.includes('lastName') ? 'border-red-500 bg-red-50' : ''}`}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-gender" className="text-xs font-medium text-gray-700">Geslacht</Label>
                  <Select 
                    value={editFormData.gender || ''} 
                    onValueChange={(value) => handleEditSelectChange('gender', value)}
                  >
                    <SelectTrigger 
                      id="edit-gender"
                      className="mt-1 h-9 w-full border-[#e5e7eb] bg-white"
                    >
                      <SelectValue placeholder="Selecteer geslacht" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#e5e7eb]">
                      <SelectItem value="man" className="focus:bg-blue-200 hover:bg-blue-100">Man</SelectItem>
                      <SelectItem value="vrouw" className="focus:bg-blue-200 hover:bg-blue-100">Vrouw</SelectItem>
                      <SelectItem value="anders" className="focus:bg-blue-200 hover:bg-blue-100">Anders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-dateOfBirth" className="text-xs font-medium text-gray-700">Geboortedatum</Label>
                  <Input
                    id="edit-dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={editFormData.dateOfBirth || ''}
                    onChange={handleEditInputChange}
                    className="mt-1 h-9 w-full border-[#e5e7eb] bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Contactgegevens */}
            <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
              <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                Contactgegevens
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-email" className="text-xs font-medium text-gray-700">Email *</Label>
                  <Input
                    id="edit-email"
                    name="email"
                    type="email"
                    value={editFormData.email}
                    onChange={handleEditInputChange}
                    placeholder="email@voorbeeld.com"
                    className={`mt-1 h-9 w-full border-[#e5e7eb] bg-white ${missingRequiredFields.includes('email') ? 'border-red-500 bg-red-50' : ''}`}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-phone" className="text-xs font-medium text-gray-700">Telefoon</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    value={editFormData.phone}
                    onChange={handleEditInputChange}
                    placeholder="04 12 34 56 78"
                    className="mt-1 h-9 w-full border-[#e5e7eb] bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Adresgegevens */}
            <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
              <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                <MapPin className="h-4 w-4 mr-2" />
                Adresgegevens
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-street" className="text-xs font-medium text-gray-700">Straat *</Label>
                  <Input
                    id="edit-street"
                    name="street"
                    value={editFormData.street}
                    onChange={handleEditInputChange}
                    placeholder="Straatnaam"
                    className={`mt-1 h-9 w-full border-[#e5e7eb] bg-white ${missingRequiredFields.includes('street') ? 'border-red-500 bg-red-50' : ''}`}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-houseNumber" className="text-xs font-medium text-gray-700">Huisnummer *</Label>
                  <Input
                    id="edit-houseNumber"
                    name="houseNumber"
                    value={editFormData.houseNumber}
                    onChange={handleEditInputChange}
                    placeholder="123"
                    className={`mt-1 h-9 w-full border-[#e5e7eb] bg-white ${missingRequiredFields.includes('houseNumber') ? 'border-red-500 bg-red-50' : ''}`}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-postalCode" className="text-xs font-medium text-gray-700">Postcode *</Label>
                  <Input
                    id="edit-postalCode"
                    name="postalCode"
                    value={editFormData.postalCode}
                    onChange={handleEditInputChange}
                    placeholder="1000"
                    className={`mt-1 h-9 w-full border-[#e5e7eb] bg-white ${missingRequiredFields.includes('postalCode') ? 'border-red-500 bg-red-50' : ''}`}
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="edit-city" className="text-xs font-medium text-gray-700">Plaats *</Label>
                  <Input
                    id="edit-city"
                    name="city"
                    value={editFormData.city}
                    onChange={handleEditInputChange}
                    placeholder="Brussel"
                    className={`mt-1 h-9 w-full border-[#e5e7eb] bg-white ${missingRequiredFields.includes('city') ? 'border-red-500 bg-red-50' : ''}`}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Onderwijsgegevens */}
            <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
              <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                <GraduationCap className="h-4 w-4 mr-2" />
                Onderwijsgegevens
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="edit-academicYear" className="text-xs font-medium text-gray-700">Schooljaar</Label>
                  <Input
                    id="edit-academicYear"
                    value={editFormData.academicYear || 'Niet toegewezen'}
                    className="mt-1 h-9 w-full border-[#e5e7eb] bg-gray-100 text-gray-600 cursor-not-allowed"
                    disabled
                    readOnly
                  />
                  <p className="text-xs text-gray-500 mt-1">Schooljaar wordt bepaald door klasindeling</p>
                </div>
                
                <div>
                  <Label htmlFor="edit-studentGroup" className="text-xs font-medium text-gray-700">Klas</Label>
                  <Select 
                    value={editFormData.studentGroup || ''} 
                    onValueChange={(value) => handleEditSelectChange('studentGroup', value)}
                  >
                    <SelectTrigger 
                      id="edit-studentGroup"
                      className="mt-1 h-9 w-full border-[#e5e7eb] bg-white"
                    >
                      <SelectValue placeholder="Selecteer klas" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#e5e7eb]">
                      {isGroupsLoading ? (
                        <SelectItem value="loading" disabled>Klassen laden...</SelectItem>
                      ) : studentGroupsData && studentGroupsData.length > 0 ? (
                        studentGroupsData.map((group: any) => (
                          <SelectItem 
                            key={`${group.id}-${group.name}-${group.academicYear}`} 
                            value={`${group.name} (${group.academicYear})`}
                            className="focus:bg-blue-200 hover:bg-blue-100"
                          >
                            {group.name} ({group.academicYear})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-classes" disabled>Geen klassen beschikbaar</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="edit-status" className="text-xs font-medium text-gray-700">Status</Label>
                  <Select 
                    value={editFormData.status || ''} 
                    onValueChange={(value) => handleEditSelectChange('status', value)}
                  >
                    <SelectTrigger 
                      id="edit-status"
                      className="mt-1 h-9 w-full border-[#e5e7eb] bg-white"
                    >
                      <SelectValue placeholder="Selecteer status" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-[#e5e7eb]">
                      <SelectItem value="ingeschreven" className="focus:bg-blue-200 hover:bg-blue-100">Ingeschreven</SelectItem>
                      <SelectItem value="uitgeschreven" className="focus:bg-blue-200 hover:bg-blue-100">Uitgeschreven</SelectItem>
                      <SelectItem value="afgestudeerd" className="focus:bg-blue-200 hover:bg-blue-100">Afgestudeerd</SelectItem>
                      <SelectItem value="geschorst" className="focus:bg-blue-200 hover:bg-blue-100">Geschorst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Familie */}
            <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
              <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Familie
              </h3>
              <div className="space-y-4">
                {/* Voogden */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Voogden</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddGuardianDialogOpen(true)}
                      className="text-xs h-7 px-2 border-[#1e40af] text-[#1e40af] hover:bg-[#1e40af] hover:text-white"
                    >
                      <PlusCircle className="h-3 w-3 mr-1" />
                      Voogd Toevoegen
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {newStudentGuardians.length > 0 ? (
                      newStudentGuardians.map((guardian, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-blue-100 text-blue-700 text-xs">
                                {guardian.firstName?.charAt(0)}{guardian.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{guardian.firstName} {guardian.lastName}</p>
                              <p className="text-xs text-gray-500">{guardian.relationship || 'Relatie niet opgegeven'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <p className="text-xs text-gray-600">{guardian.phone || 'Geen telefoon'}</p>
                              <p className="text-xs text-gray-500">{guardian.email || 'Geen email'}</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setNewStudentGuardians(prev => prev.filter((_, i) => i !== index));
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">Geen voogden toegevoegd</p>
                    )}
                  </div>
                </div>

                {/* Broers/Zussen */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Broers/Zussen</h4>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsLinkSiblingDialogOpen(true)}
                      className="text-xs h-7 px-2 border-[#1e40af] text-[#1e40af] hover:bg-[#1e40af] hover:text-white"
                    >
                      <Link className="h-3 w-3 mr-1" />
                      Broer/Zus Koppelen
                    </Button>
                  </div>
                  <div className="space-y-2">
                    {studentSiblings && studentSiblings.length > 0 ? (
                      studentSiblings.map((sibling: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-green-100 text-green-700 text-xs">
                                {sibling.firstName?.charAt(0)}{sibling.lastName?.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{sibling.firstName} {sibling.lastName}</p>
                              <p className="text-xs text-gray-500">Student ID: {sibling.studentIdCode || 'Niet beschikbaar'}</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <div className="text-right">
                              <div className="flex items-center gap-1">
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 min-w-[60px] justify-center">
                                  {getRelationshipLabel(sibling.relationship)}
                                </span>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">Familie relatie</p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={async () => {
                                try {
                                  await apiRequest(`/api/students/${selectedStudent.id}/siblings/${sibling.siblingId}`, {
                                    method: 'DELETE'
                                  });
                                  queryClient.invalidateQueries({ queryKey: ['/api/students', selectedStudent.id, 'siblings'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/students', sibling.siblingId, 'siblings'] });
                                  queryClient.invalidateQueries({ queryKey: ['/api/students'] });
                                  refetchSiblings();
                                  toast({
                                    title: "Broer/zus ontkoppeld",
                                    description: `${sibling.firstName} ${sibling.lastName} is ontkoppeld.`,
                                  });
                                } catch (error) {
                                  console.error('Error removing sibling:', error);
                                  toast({
                                    title: "Fout",
                                    description: "Er is een probleem opgetreden bij het ontkoppelen van de broer/zus.",
                                    variant: "destructive",
                                  });
                                }
                              }}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic">Geen broers/zussen gekoppeld</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Notities - volledige breedte */}
            <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
              <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Notities
              </h3>
              <Textarea
                id="edit-notes"
                name="notes"
                value={editFormData.notes || ''}
                onChange={handleEditInputChange}
                placeholder="Voeg hier notities toe over de student..."
                className="mt-1 min-h-[100px] w-full border-[#e5e7eb] bg-white resize-none"
                rows={4}
              />
            </div>

            <DialogFooterContainer>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                className="bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
              >
                Wijzigingen Opslaan
              </Button>
            </DialogFooterContainer>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDeleteStudent}
        title="Student verwijderen"
        description={`Weet je zeker dat je ${studentToDelete?.firstName} ${studentToDelete?.lastName} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`}
        item={studentToDelete ? {
          name: `${studentToDelete.firstName} ${studentToDelete.lastName}`,
          id: studentToDelete.studentId,
          photoUrl: studentToDelete.photoUrl,
          initials: `${studentToDelete.firstName?.charAt(0)}${studentToDelete.lastName?.charAt(0)}`
        } : undefined}
        warningText="Let op: Als je deze student verwijdert, worden ook alle gekoppelde gegevens zoals voogden, inschrijvingen en rapporten permanent verwijderd."
        confirmButtonText="Verwijderen"
        cancelButtonText="Annuleren"
      />

      {/* Add Guardian Dialog */}
      <Dialog open={isAddGuardianDialogOpen} onOpenChange={setIsAddGuardianDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[95vh] flex flex-col p-0" aria-describedby="guardian-dialog-description">
          <div className="bg-[#1e40af] py-5 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <UserPlus className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl font-semibold m-0">Voogd Toevoegen</DialogTitle>
                <DialogDescription id="guardian-dialog-description" className="text-white/80 text-sm m-0 mt-1">
                  Voeg een nieuwe voogd toe of koppel een bestaande voogd aan de student
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="flex-1 px-8 py-6 overflow-y-auto">{/* Note: removed maxHeight style */}
            <Tabs value={isAddingNewGuardian ? "new" : "existing"} onValueChange={(value) => setIsAddingNewGuardian(value === "new")}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="new" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Nieuwe Voogd Aanmaken
              </TabsTrigger>
              <TabsTrigger value="existing" className="flex items-center gap-2">
                <Search className="h-4 w-4" />
                Bestaande Voogd Koppelen
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="new" className="space-y-6">
              {/* Basis Informatie */}
              <div className="bg-[#f1f5f9] px-4 py-4 rounded-lg">
                <h3 className="text-sm font-semibold text-[#1e40af] mb-4 flex items-center">
                  <UserCheck className="h-4 w-4 mr-2" />
                  Basis Informatie
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardian-firstName" className="text-xs font-medium text-gray-700">
                      Voornaam <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="guardian-firstName" 
                      placeholder="Voornaam van de voogd" 
                      className="h-9 text-sm"
                      value={guardianFormData.firstName}
                      onChange={(e) => setGuardianFormData(prev => ({...prev, firstName: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian-lastName" className="text-xs font-medium text-gray-700">
                      Achternaam <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="guardian-lastName" 
                      placeholder="Achternaam van de voogd" 
                      className="h-9 text-sm"
                      value={guardianFormData.lastName}
                      onChange={(e) => setGuardianFormData(prev => ({...prev, lastName: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian-relationship" className="text-xs font-medium text-gray-700">
                      Relatie tot Student <span className="text-red-500">*</span>
                    </Label>
                    <Select 
                      value={guardianFormData.relationship} 
                      onValueChange={(value) => setGuardianFormData(prev => ({...prev, relationship: value}))}
                      required
                    >
                      <SelectTrigger id="guardian-relationship" className="h-9 text-sm border-gray-300">
                        <SelectValue placeholder="Selecteer relatie" />
                      </SelectTrigger>
                      <SelectContent className="bg-white">
                        <SelectItem value="parent" className="text-black hover:bg-blue-100 focus:bg-blue-200">Ouder</SelectItem>
                        <SelectItem value="guardian" className="text-black hover:bg-blue-100 focus:bg-blue-200">Voogd</SelectItem>
                        <SelectItem value="grandparent" className="text-black hover:bg-blue-100 focus:bg-blue-200">Grootouder</SelectItem>
                        <SelectItem value="other" className="text-black hover:bg-blue-100 focus:bg-blue-200">Anders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  {guardianFormData.relationship === 'other' && (
                    <div className="space-y-2">
                      <Label htmlFor="guardian-relationshipOther" className="text-xs font-medium text-gray-700">
                        Specificeer relatie <span className="text-red-500">*</span>
                      </Label>
                      <Input 
                        id="guardian-relationshipOther" 
                        placeholder="Bijv. oom, tante, neef, nicht..." 
                        className="h-9 text-sm"
                        value={guardianFormData.relationshipOther || ''}
                        onChange={(e) => setGuardianFormData(prev => ({...prev, relationshipOther: e.target.value}))}
                        required
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Contact Informatie */}
              <div className="bg-[#f1f5f9] px-4 py-4 rounded-lg">
                <h3 className="text-sm font-semibold text-[#1e40af] mb-4 flex items-center">
                  <Phone className="h-4 w-4 mr-2" />
                  Contact Informatie
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="guardian-phone" className="text-xs font-medium text-gray-700">
                      Telefoonnummer <span className="text-red-500">*</span>
                    </Label>
                    <Input 
                      id="guardian-phone" 
                      placeholder="06 12345678" 
                      className="h-9 text-sm"
                      value={guardianFormData.phone || ''}
                      onChange={(e) => setGuardianFormData(prev => ({...prev, phone: e.target.value}))}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardian-email" className="text-xs font-medium text-gray-700">
                      E-mailadres
                    </Label>
                    <Input 
                      id="guardian-email" 
                      type="email"
                      placeholder="naam@voorbeeld.nl" 
                      className="h-9 text-sm"
                      value={guardianFormData.email || ''}
                      onChange={(e) => setGuardianFormData(prev => ({...prev, email: e.target.value}))}
                    />
                  </div>
                </div>
              </div>

              {/* Noodcontact */}
              <div className="bg-[#f1f5f9] px-4 py-4 rounded-lg">
                <h3 className="text-sm font-semibold text-[#1e40af] mb-4 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Noodcontact Instellingen
                </h3>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-white rounded-md border">
                    <Checkbox 
                      id="guardian-isEmergencyContact" 
                      checked={guardianFormData.isEmergencyContact}
                      onCheckedChange={(checked) => 
                        setGuardianFormData(prev => ({
                          ...prev, 
                          isEmergencyContact: checked === true
                        }))
                      }
                      className="h-4 w-4 rounded-sm border-gray-300 data-[state=checked]:bg-[#1e40af] bg-[#fff] mt-0.5"
                    />
                    <div className="flex-1">
                      <label
                        htmlFor="guardian-isEmergencyContact"
                        className="text-sm font-medium text-gray-700 leading-none cursor-pointer"
                      >
                        Primair noodcontact
                      </label>
                      <p className="text-xs text-gray-500 mt-1">
                        Deze persoon wordt als eerste gebeld in geval van nood
                      </p>
                    </div>
                  </div>

                  {guardianFormData.isEmergencyContact && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="flex items-center mb-2">
                        <Mail className="h-4 w-4 text-blue-600 mr-2" />
                        <h4 className="text-sm font-medium text-blue-800">Secundair Noodcontact (Optioneel)</h4>
                      </div>
                      <p className="text-xs text-blue-600 mb-3">
                        Voeg een tweede contactpersoon toe die gebeld wordt als het primaire contact niet bereikbaar is.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="guardian-emergencyContactFirstName" className="text-xs font-medium text-gray-700">Voornaam</Label>
                          <Input 
                            id="guardian-emergencyContactFirstName" 
                            placeholder="Voornaam" 
                            className="h-8 text-sm bg-white"
                            value={guardianFormData.emergencyContactFirstName || ''}
                            onChange={(e) => setGuardianFormData(prev => ({...prev, emergencyContactFirstName: e.target.value}))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guardian-emergencyContactLastName" className="text-xs font-medium text-gray-700">Achternaam</Label>
                          <Input 
                            id="guardian-emergencyContactLastName" 
                            placeholder="Achternaam" 
                            className="h-8 text-sm bg-white"
                            value={guardianFormData.emergencyContactLastName || ''}
                            onChange={(e) => setGuardianFormData(prev => ({...prev, emergencyContactLastName: e.target.value}))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guardian-emergencyContactPhone" className="text-xs font-medium text-gray-700">Telefoonnummer</Label>
                          <Input 
                            id="guardian-emergencyContactPhone" 
                            placeholder="06 87654321" 
                            className="h-8 text-sm bg-white"
                            value={guardianFormData.emergencyContactPhone || ''}
                            onChange={(e) => setGuardianFormData(prev => ({...prev, emergencyContactPhone: e.target.value}))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="guardian-emergencyContactRelationship" className="text-xs font-medium text-gray-700">Relatie</Label>
                          <Select 
                            value={guardianFormData.emergencyContactRelationship || ''} 
                            onValueChange={(value) => setGuardianFormData(prev => ({...prev, emergencyContactRelationship: value}))}
                          >
                            <SelectTrigger id="guardian-emergencyContactRelationship" className="h-8 text-sm border-gray-300 bg-white">
                              <SelectValue placeholder="Selecteer relatie" />
                            </SelectTrigger>
                            <SelectContent className="bg-white">
                              <SelectItem value="parent" className="text-black hover:bg-blue-100 focus:bg-blue-200">Ouder</SelectItem>
                              <SelectItem value="guardian" className="text-black hover:bg-blue-100 focus:bg-blue-200">Voogd</SelectItem>
                              <SelectItem value="grandparent" className="text-black hover:bg-blue-100 focus:bg-blue-200">Grootouder</SelectItem>
                              <SelectItem value="sibling" className="text-black hover:bg-blue-100 focus:bg-blue-200">Broer/Zus</SelectItem>
                              <SelectItem value="other" className="text-black hover:bg-blue-100 focus:bg-blue-200">Anders</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        {guardianFormData.emergencyContactRelationship === 'other' && (
                          <div className="space-y-2">
                            <Label htmlFor="guardian-emergencyContactRelationshipOther" className="text-xs font-medium text-gray-700">
                              Specificeer relatie <span className="text-red-500">*</span>
                            </Label>
                            <Input 
                              id="guardian-emergencyContactRelationshipOther" 
                              placeholder="Bijv. vriend, buurman, collega..." 
                              className="h-8 text-sm"
                              value={guardianFormData.emergencyContactRelationshipOther || ''}
                              onChange={(e) => setGuardianFormData(prev => ({...prev, emergencyContactRelationshipOther: e.target.value}))}
                              required
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="existing" className="space-y-4">
              <div className="bg-[#f1f5f9] px-4 py-4 rounded-lg">
                <h3 className="text-sm font-semibold text-[#1e40af] mb-4 flex items-center">
                  <Search className="h-4 w-4 mr-2" />
                  Zoek Bestaande Voogd
                </h3>
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="guardian-search" className="text-xs font-medium text-gray-700">Zoek op naam of telefoon</Label>
                    <Input
                      id="guardian-search"
                      value={guardianSearchTerm}
                      onChange={(e) => setGuardianSearchTerm(e.target.value)}
                      placeholder="Typ naam of telefoonnummer..."
                      className="h-9 text-sm mt-2"
                    />
                  </div>
                  
                  {/* Bestaande voogden uit database */}
                  {guardianSearchTerm.length > 0 && (
                    <div className="bg-white border rounded-lg divide-y max-h-60 overflow-y-auto">
                      {guardians.filter(guardian => 
                        guardian.firstName.toLowerCase().includes(guardianSearchTerm.toLowerCase()) ||
                        guardian.lastName.toLowerCase().includes(guardianSearchTerm.toLowerCase()) ||
                        (guardian.phone && guardian.phone.includes(guardianSearchTerm))
                      ).map((guardian) => (
                        <div key={guardian.id} className="p-3 hover:bg-gray-50 cursor-pointer" 
                             onClick={() => {
                               const existingGuardian = {
                                 ...guardian,
                                 id: Date.now(),
                                 relationshipOther: '',
                                 isEmergencyContact: false,
                                 emergencyContactFirstName: '',
                                 emergencyContactLastName: '',
                                 emergencyContactPhone: '',
                                 emergencyContactRelationship: '',
                               };
                               setNewStudentGuardians([...newStudentGuardians, existingGuardian]);
                               setGuardianSearchTerm('');
                               toast({
                                 title: "Voogd gekoppeld",
                                 description: `${guardian.firstName} ${guardian.lastName} is gekoppeld aan de student.`,
                               });
                               setIsAddGuardianDialogOpen(false);
                             }}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <p className="font-medium text-sm">{guardian.firstName} {guardian.lastName}</p>
                              <p className="text-xs text-gray-500">{guardian.phone} • {guardian.email}</p>
                              <p className="text-xs text-blue-600">
                                {guardian.relationship === 'parent' && 'Ouder'}
                                {guardian.relationship === 'guardian' && 'Voogd'}
                                {guardian.relationship === 'grandparent' && 'Grootouder'}
                              </p>
                            </div>
                            <Button size="sm" variant="outline" className="h-7 text-xs">
                              <UserPlus className="h-3 w-3 mr-1" />
                              Koppelen
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {guardians.filter(guardian => 
                        guardian.firstName.toLowerCase().includes(guardianSearchTerm.toLowerCase()) ||
                        guardian.lastName.toLowerCase().includes(guardianSearchTerm.toLowerCase()) ||
                        (guardian.phone && guardian.phone.includes(guardianSearchTerm))
                      ).length === 0 && (
                        <div className="p-4 text-center text-gray-500">
                          <Search className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm">Geen bestaande voogden gevonden voor "{guardianSearchTerm}"</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {guardianSearchTerm.length === 0 && (
                    <div className="text-center text-gray-500 py-8 bg-white rounded-md border-2 border-dashed border-gray-200">
                      <Search className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-medium">Begin met typen om bestaande voogden te zoeken</p>
                      <p className="text-xs text-gray-400 mt-1">Zoek op naam of telefoonnummer om een bestaande voogd te koppelen</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          </div>

          
          <div className="bg-gray-50 px-8 py-4 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsAddGuardianDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={() => {
                if (isAddingNewGuardian) {
                  // Valideer verplichte velden
                  if (!guardianFormData.firstName || !guardianFormData.lastName || !guardianFormData.phone || !guardianFormData.relationship) {
                    toast({
                      title: "Incomplete gegevens",
                      description: "Vul alle verplichte velden in (voornaam, achternaam, telefoon en relatie).",
                      variant: "destructive",
                    });
                    return;
                  }

                  // Valideer relationshipOther als 'other' is geselecteerd
                  if (guardianFormData.relationship === 'other' && !guardianFormData.relationshipOther) {
                    toast({
                      title: "Specificeer relatie",
                      description: "Geef aan wat de relatie is tot de student.",
                      variant: "destructive",
                    });
                    return;
                  }

                  const newGuardian = {
                    ...guardianFormData,
                    id: Date.now(),
                  };
                  
                  setSelectedGuardians([...selectedGuardians, newGuardian]);
                  setNewStudentGuardians([...newStudentGuardians, newGuardian]);
                  
                  // Reset formulier
                  setGuardianFormData({
                    firstName: '',
                    lastName: '',
                    relationship: 'parent',
                    relationshipOther: '',
                    email: '',
                    phone: '',
                    isEmergencyContact: false,
                    emergencyContactFirstName: '',
                    emergencyContactLastName: '',
                    emergencyContactPhone: '',
                    emergencyContactRelationship: '',
                    emergencyContactRelationshipOther: '',
                  });

                  toast({
                    title: "Voogd toegevoegd",
                    description: `${newGuardian.firstName} ${newGuardian.lastName} is toegevoegd aan de familie.`,
                  });
                }
                setIsAddGuardianDialogOpen(false);
              }}
              className="bg-[#1e40af] hover:bg-[#1e40af]/90"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Voogd Toevoegen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Link Sibling Dialog */}
      <Dialog open={isLinkSiblingDialogOpen} onOpenChange={setIsLinkSiblingDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0" aria-describedby="sibling-dialog-description">
          <div className="bg-[#1e40af] py-5 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-full">
                <Users className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-xl font-semibold m-0">Bestaande Student als Broer/Zus Koppelen</DialogTitle>
                <DialogDescription id="sibling-dialog-description" className="text-white/80 text-sm m-0 mt-1">
                  Koppel een bestaande student als broer of zus.
                </DialogDescription>
              </div>
            </div>
          </div>

          <div className="flex-1 px-8 py-6 overflow-y-auto">
            <div className="space-y-4">
            <div>
              <Label htmlFor="sibling-search" className="text-sm font-medium text-gray-700">Zoek student om te koppelen als broer/zus</Label>
              <Input
                id="sibling-search"
                value={siblingSearchTerm}
                onChange={(e) => setSiblingSearchTerm(e.target.value)}
                placeholder="Typ naam of student ID..."
                className="h-9 text-sm mt-2"
              />
            </div>
            
            {/* Bestaande studenten uit database */}
            {siblingSearchTerm.length > 0 && (
              <div className="bg-white border rounded-lg divide-y max-h-60 overflow-y-auto">
                {studentsData.filter(student => 
                  (student.firstName.toLowerCase().includes(siblingSearchTerm.toLowerCase()) ||
                  student.lastName.toLowerCase().includes(siblingSearchTerm.toLowerCase()) ||
                  student.studentId.toLowerCase().includes(siblingSearchTerm.toLowerCase())) &&
                  student.id !== selectedStudent?.id // Voorkom dat student zichzelf selecteert
                ).map((student) => (
                  <div key={student.id} className="p-3 hover:bg-gray-50 cursor-pointer" 
                       onClick={async () => {
                         try {
                           // Als we een nieuwe student aan het maken zijn, gebruik localStorage
                           if (!selectedStudent?.id) {
                             const newSibling = {
                               id: Date.now(),
                               studentId: student.studentId,
                               firstName: student.firstName,
                               lastName: student.lastName,
                               class: student.studentGroupName || 'Onbekend',
                               relationship: 'broer/zus'
                             };
                             setNewStudentSiblings([...newStudentSiblings, newSibling]);
                           } else {
                             // Voor bestaande studenten, gebruik de API voor bidirectionele relatie
                             await apiRequest(`/api/students/${selectedStudent.id}/siblings`, {
                               method: 'POST',
                               body: {
                                 siblingId: student.id,
                                 relationship: 'sibling'
                               }
                             });
                             
                             // Herlaad de sibling data voor beide studenten om de bidirectionele relatie te tonen
                             queryClient.invalidateQueries({ queryKey: ['/api/students', selectedStudent.id, 'siblings'] });
                             queryClient.invalidateQueries({ queryKey: ['/api/students', student.id, 'siblings'] });
                             queryClient.invalidateQueries({ queryKey: ['/api/students'] });
                             
                             // Force een directe refetch van de sibling data
                             refetchSiblings();
                           }
                           
                           setSiblingSearchTerm('');
                           toast({
                             title: "Broer/zus gekoppeld",
                             description: `${student.firstName} ${student.lastName} is toegevoegd als broer/zus.`,
                           });
                           setIsLinkSiblingDialogOpen(false);
                         } catch (error) {
                           console.error('Error adding sibling:', error);
                           toast({
                             title: "Fout",
                             description: "Er is een probleem opgetreden bij het koppelen van de broer/zus.",
                             variant: "destructive",
                           });
                         }
                       }}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-gray-500">{student.studentId} • {student.studentGroupName || 'Geen klas'}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs">
                        <Users className="h-3 w-3 mr-1" />
                        Koppelen
                      </Button>
                    </div>
                  </div>
                ))}
                
                {studentsData.filter(student => 
                  student.firstName.toLowerCase().includes(siblingSearchTerm.toLowerCase()) ||
                  student.lastName.toLowerCase().includes(siblingSearchTerm.toLowerCase()) ||
                  student.studentId.toLowerCase().includes(siblingSearchTerm.toLowerCase())
                ).length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm">Geen studenten gevonden voor "{siblingSearchTerm}"</p>
                  </div>
                )}
              </div>
            )}
            
            {siblingSearchTerm.length === 0 && (
              <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-medium">Begin met typen om studenten te zoeken</p>
                <p className="text-xs text-gray-400 mt-1">Zoek op naam of student ID om een broer/zus te koppelen</p>
              </div>
            )}
            </div>
          </div>

          <div className="bg-gray-50 px-8 py-4 border-t flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsLinkSiblingDialogOpen(false)}>
              Sluiten
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
