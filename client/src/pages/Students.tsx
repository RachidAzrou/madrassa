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
  UserCheck, CalendarDays, Hash
} from 'lucide-react';

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
    <line x1="6" y1="12" x2="6" y2="20" />
    <line x1="18" y1="12" x2="18" y2="20" />
    <ellipse cx="12" cy="18" rx="3" ry="2" />
    <path d="M10 4h4" />
    <path d="M8 8h8" />
  </svg>
);
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
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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
  
  // State voor voogd-gerelateerde dialogen
  const [foundGuardian, setFoundGuardian] = useState<any>(null);
  const [showGuardianConfirmDialog, setShowGuardianConfirmDialog] = useState(false); 
  const [showGuardianFormDialog, setShowGuardianFormDialog] = useState(false);
  
  // Import dialoog state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [importType, setImportType] = useState<'csv' | 'excel'>('excel');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [columnMappings, setColumnMappings] = useState<{[key: string]: string}>({});
  const [isImporting, setIsImporting] = useState(false);
  
  // Functie om huidige datum in YYYY-MM-DD formaat te krijgen
  const getCurrentDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  // Dit is een commentaar om de dubbele declaratie te vervangen
  
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
    enrollmentDate: getCurrentDate(), // Huidige datum als standaard
    status: 'active' as string,
    notes: '',
    gender: '' as string,
  });
  
  // State voor meerdere programma's
  const [selectedPrograms, setSelectedPrograms] = useState<{
    programId: number;
    yearLevel: string;
  }[]>([]);

  // State voor voogd formulier data
  const [guardianFormData, setGuardianFormData] = useState({
    firstName: '',
    lastName: '',
    relationship: 'ouder',
    email: '',
    phone: '',
    address: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    isEmergencyContact: false,
    emergencyContactName: '',
    emergencyContactPhone: '',
    emergencyContactRelation: '',
    notes: ''
  });

  // Statusopties voor dropdown
  const statusOptions = [
    { value: 'enrolled', label: 'Ingeschreven' },
    { value: 'unenrolled', label: 'Uitgeschreven' },
    { value: 'suspended', label: 'Geschorst' },
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
  // Effect om voogden formulier te resetten wanneer het dialoog opent
  useEffect(() => {
    if (isCreateDialogOpen) {
      setGuardianFormData({
        firstName: '',
        lastName: '',
        relationship: 'ouder',
        email: '',
        phone: '',
        address: '',
        street: '',
        houseNumber: '',
        postalCode: '',
        city: '',
        isEmergencyContact: false,
        emergencyContactName: '',
        emergencyContactPhone: '',
        emergencyContactRelation: '',
        notes: ''
      });
      setFoundGuardian(null);
    }
  }, [isCreateDialogOpen]);

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
    mutationFn: async (data: any) => {
      // Maak eerst de student aan
      const studentResponse = await apiRequest('/api/students', {
        method: 'POST',
        body: data
      });
      
      // Check of er voogd gegevens zijn ingevuld
      const hasGuardianData = guardianFormData.firstName.trim() || 
                              guardianFormData.lastName.trim() || 
                              guardianFormData.email.trim() || 
                              guardianFormData.phone.trim();
      
      if (hasGuardianData) {
        // Maak de voogd aan
        const guardianResponse = await apiRequest('/api/guardians', {
          method: 'POST',
          body: {
            firstName: guardianFormData.firstName,
            lastName: guardianFormData.lastName,
            relationship: guardianFormData.relationship,
            email: guardianFormData.email,
            phone: guardianFormData.phone,
            address: guardianFormData.address,
            street: guardianFormData.street,
            houseNumber: guardianFormData.houseNumber,
            postalCode: guardianFormData.postalCode,
            city: guardianFormData.city,
            isEmergencyContact: guardianFormData.isEmergencyContact,
            emergencyContactName: guardianFormData.emergencyContactName,
            emergencyContactPhone: guardianFormData.emergencyContactPhone,
            emergencyContactRelation: guardianFormData.emergencyContactRelation,
            notes: guardianFormData.notes
          }
        });
        
        // Koppel de voogd aan de student
        await apiRequest('/api/student-guardians', {
          method: 'POST',
          body: {
            studentId: studentResponse.id,
            guardianId: guardianResponse.id
          }
        });
      }
      
      return studentResponse;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      // Invalideer ook de voogdgegevens als er een voogd was gekoppeld
      if (foundGuardian) {
        queryClient.invalidateQueries({ queryKey: ['/api/guardians'] });
        queryClient.invalidateQueries({ queryKey: ['/api/student-guardians'] });
        // Reset de gevonden voogd
        setFoundGuardian(null);
        setShowGuardianConfirmDialog(false);
      }
      
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
        const description = foundGuardian 
          ? "De student is succesvol toegevoegd en gekoppeld aan een voogd."
          : "De student is succesvol toegevoegd.";
        
        toast({
          title: "Student toegevoegd",
          description: description,
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
  // Functie voor het verwerken van geïmporteerde bestanden
  const handleImportFile = (file: File) => {
    setImportFile(file);
    setImportPreview([]);
    setImportColumns([]);
    setColumnMappings({});
    
    if (file.name.endsWith('.csv')) {
      setImportType('csv');
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setImportPreview(results.data.slice(0, 5) as any[]);
            if (results.meta.fields) {
              setImportColumns(results.meta.fields);
            }
          }
        },
        error: (error) => {
          toast({
            title: "Error bij importeren",
            description: `Er is een fout opgetreden bij het verwerken van het CSV bestand: ${error.message}`,
            variant: "destructive"
          });
        }
      });
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
      setImportType('excel');
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (data) {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (json.length > 0) {
              const headers = json[0] as string[];
              setImportColumns(headers);
              
              const rows = [];
              for (let i = 1; i < Math.min(json.length, 6); i++) {
                const row = json[i] as any[];
                const rowData: {[key: string]: any} = {};
                for (let j = 0; j < headers.length; j++) {
                  rowData[headers[j]] = row[j];
                }
                rows.push(rowData);
              }
              setImportPreview(rows);
            }
          }
        } catch (error: any) {
          toast({
            title: "Error bij importeren",
            description: `Er is een fout opgetreden bij het verwerken van het Excel bestand: ${error.message}`,
            variant: "destructive"
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({
        title: "Niet-ondersteund bestandsformaat",
        description: "Alleen CSV, XLS en XLSX bestanden worden ondersteund.",
        variant: "destructive"
      });
    }
  };
  
  // Functie om de geïmporteerde data te verwerken
  const importStudents = async () => {
    if (!importFile || importPreview.length === 0 || Object.keys(columnMappings).length === 0) {
      toast({
        title: "Kan niet importeren",
        description: "Zorg ervoor dat u een bestand heeft geselecteerd en kolomtoewijzingen heeft gemaakt.",
        variant: "destructive"
      });
      return;
    }
    
    setIsImporting(true);
    
    try {
      // Lees alle gegevens uit het bestand
      let allData: any[] = [];
      
      if (importType === 'csv') {
        const parsePromise = new Promise<any[]>((resolve, reject) => {
          Papa.parse(importFile, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: reject
          });
        });
        
        allData = await parsePromise;
      } else if (importType === 'excel') {
        const reader = new FileReader();
        const readPromise = new Promise<any[]>((resolve, reject) => {
          reader.onload = (e) => {
            try {
              const data = e.target?.result;
              if (data) {
                const workbook = XLSX.read(data, { type: 'array' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json = XLSX.utils.sheet_to_json(worksheet);
                resolve(json);
              } else {
                reject(new Error("Kon bestand niet lezen"));
              }
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsArrayBuffer(importFile);
        });
        
        allData = await readPromise;
      }
      
      // Map de gegevens naar het juiste formaat
      const formattedData = allData.map(row => {
        const student: any = {
          studentId: '',
          firstName: '',
          lastName: '',
          email: '',
          phone: '',
          dateOfBirth: null,
          address: '',
          city: '',
          postalCode: '',
          country: 'Nederland',
          status: 'enrolled', // Standaard status: ingeschreven
          notes: '',
          gender: '',
          street: '',
          houseNumber: ''
        };
        
        // Verwerk de kolomtoewijzingen
        Object.entries(columnMappings).forEach(([sourceColumn, targetField]) => {
          if (row[sourceColumn] !== undefined && row[sourceColumn] !== null) {
            if (targetField === 'dateOfBirth' && row[sourceColumn]) {
              // Zorg ervoor dat de datum in het juiste formaat is
              try {
                // Probeer datum te parsen (kan verschillende formaten zijn)
                const parsedDate = new Date(row[sourceColumn]);
                if (!isNaN(parsedDate.getTime())) {
                  // Formatteer naar YYYY-MM-DD
                  const year = parsedDate.getFullYear();
                  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
                  const day = String(parsedDate.getDate()).padStart(2, '0');
                  student[targetField] = `${year}-${month}-${day}`;
                }
              } catch (e) {
                // Als het parsen mislukt, gebruik de waarde als string
                student[targetField] = row[sourceColumn];
              }
            } else {
              student[targetField] = row[sourceColumn];
            }
          }
        });
        
        return student;
      });
      
      // Valideer de gegevens
      const validStudents = formattedData.filter(s => 
        s.firstName && s.lastName // Minimale vereisten
      );
      
      if (validStudents.length === 0) {
        toast({
          title: "Geen geldige studentgegevens",
          description: "De geïmporteerde gegevens bevatten geen geldige studentinformatie. Controleer of de kolomtoewijzingen correct zijn.",
          variant: "destructive"
        });
        setIsImporting(false);
        return;
      }
      
      // Voeg de studenten toe
      const apiPromises = validStudents.map(student => 
        apiRequest("POST", "/api/students", student)
      );
      
      await Promise.all(apiPromises);
      
      // Invalideer de query om de studentenlijst te vernieuwen
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      
      toast({
        title: "Import voltooid",
        description: `${validStudents.length} studenten succesvol geïmporteerd.`,
      });
      
      // Sluit het dialoogvenster en reset de state
      setIsImportDialogOpen(false);
      setImportFile(null);
      setImportPreview([]);
      setImportColumns([]);
      setColumnMappings({});
    } catch (error: any) {
      toast({
        title: "Import mislukt",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

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
      enrollmentDate: getCurrentDate(), // Huidige datum als standaard
      status: 'enrolled',
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

    // Als er een noodcontact is gevonden via e-ID, toon dan de bevestigingsdialoog
    // Dit wordt alleen getoond als de gebruiker op "Student toevoegen" klikt
    if (foundGuardian && foundGuardian.phone && foundGuardian.phone.startsWith('+') && !studentFormData.id) {
      setShowGuardianConfirmDialog(true);
      return;
    }
    
    // Als er een reguliere voogd is gevonden (niet een noodcontact), toon dan ook de bevestigingsdialoog
    if (foundGuardian && !foundGuardian.phone?.startsWith('+') && !studentFormData.id) {
      setShowGuardianConfirmDialog(true);
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
    try {
      // Stuur een API-verzoek om de volledige details van de student op te halen
      const response = await fetch(`/api/students/${student.id}`);
      if (!response.ok) throw new Error('Kon studentgegevens niet ophalen');
      
      const details = await response.json();
      setSelectedStudent(details);
      setIsStudentDetailDialogOpen(true);
    } catch (error) {
      console.error("Fout bij ophalen studentdetails:", error);
      toast({
        title: "Fout bij ophalen gegevens",
        description: "Er is een probleem opgetreden bij het ophalen van de studentgegevens.",
        variant: "destructive"
      });
    }
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

  // Functie om studentgegevens te exporteren als PDF
  const exportStudentsAsPDF = () => {
    // Verberg het exportmenu na selectie
    document.getElementById('export-menu')?.classList.add('hidden');
    
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
    
    doc.save(`studenten_${new Date().toISOString().split('T')[0]}.pdf`);
    
    toast({
      title: "PDF geëxporteerd",
      description: "De studentenlijst is succesvol geëxporteerd als PDF.",
    });
  };
  
  // Functie om studentgegevens te exporteren als Excel bestand
  const exportStudentsAsExcel = () => {
    // Verberg het exportmenu na selectie
    document.getElementById('export-menu')?.classList.add('hidden');
    
    const students = studentsData.students || [];
    
    // Gegevens voorbereiden voor Excel export
    const worksheetData = students.map((student: any) => {
      return {
        'Student ID': student.studentId,
        'Voornaam': student.firstName,
        'Achternaam': student.lastName,
        'Email': student.email,
        'Telefoon': student.phone,
        'Geboortedatum': student.dateOfBirth,
        'Adres': student.address,
        'Straat': student.street,
        'Huisnummer': student.houseNumber,
        'Postcode': student.postalCode,
        'Plaats': student.city,
        'Status': student.status === 'active' ? 'Actief' : 
                student.status === 'pending' ? 'In Afwachting' : 
                student.status === 'inactive' ? 'Inactief' : 'Afgestudeerd',
        'Geslacht': student.gender === 'M' ? 'Man' : student.gender === 'F' ? 'Vrouw' : '-',
        'Notities': student.notes
      };
    });
    
    // Maak een nieuwe werkmap en werkblad
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    
    // Voeg het werkblad toe aan de werkmap
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Studenten');
    
    // Exporteer als Excel-bestand
    XLSX.writeFile(workbook, `studenten_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast({
      title: "Excel geëxporteerd",
      description: "De studentenlijst is succesvol geëxporteerd als Excel bestand.",
    });
  };
  
  // Functie om studentgegevens te exporteren als CSV
  const exportStudentsAsCSV = () => {
    // Verberg het exportmenu na selectie
    document.getElementById('export-menu')?.classList.add('hidden');
    
    const students = studentsData.students || [];
    
    // Gegevens voorbereiden voor CSV export
    const csvData = students.map((student: any) => {
      return {
        'Student ID': student.studentId,
        'Voornaam': student.firstName,
        'Achternaam': student.lastName,
        'Email': student.email,
        'Telefoon': student.phone,
        'Geboortedatum': student.dateOfBirth,
        'Adres': student.address,
        'Straat': student.street,
        'Huisnummer': student.houseNumber,
        'Postcode': student.postalCode,
        'Plaats': student.city,
        'Status': student.status === 'active' ? 'Actief' : 
                student.status === 'pending' ? 'In Afwachting' : 
                student.status === 'inactive' ? 'Inactief' : 'Afgestudeerd',
        'Geslacht': student.gender === 'M' ? 'Man' : student.gender === 'F' ? 'Vrouw' : '-',
        'Notities': student.notes
      };
    });
    
    // Converteer naar CSV en download
    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `studenten_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "CSV geëxporteerd",
      description: "De studentenlijst is succesvol geëxporteerd als CSV bestand.",
    });
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
    const studentList = Array.isArray(studentsData) 
      ? studentsData
      : (studentsData?.students || []);
      
    const studentIds = studentList.map((s: any) => s.id);
    
    if (selectedStudents.length === studentIds.length && 
        studentIds.every((id: number) => selectedStudents.includes(id))) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(studentIds);
    }
  };

  // Function to render status badge
  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'enrolled':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Ingeschreven</Badge>;
      case 'unenrolled':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Uitgeschreven</Badge>;
      case 'suspended':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">Geschorst</Badge>;
      case 'graduated':
        return <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">Afgestudeerd</Badge>;
      // Fallback voor oude statuswaarden
      case 'active':
        return <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">Ingeschreven</Badge>;
      case 'inactive':
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">Uitgeschreven</Badge>;
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">In Afwachting</Badge>;
      default:
        return <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">{status}</Badge>;
    }
  };

  // Programs and student groups arrays
  const programs = programsData.programs || [];
  const studentGroups = studentGroupsData.studentGroups || [];

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
          <div className="flex items-center gap-4 mb-2 md:mb-0">
            <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
              <Users className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Studenten</h1>
              <p className="text-base text-gray-500 mt-1">Bekijk en beheer alle studentgegevens</p>
            </div>
          </div>
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
      
      {/* Zoekbalk */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="Zoek studenten..."
            className="pl-8 bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-wrap gap-2 justify-between">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="default"
              className="border-gray-300 text-gray-700"
              onClick={() => setShowFilterOptions(!showFilterOptions)}
            >
              <Filter className="mr-2 h-4 w-4" /> Filteren
            </Button>
            
            <div className="relative">
              <Button 
                variant="outline" 
                size="default"
                className="border-gray-300 text-gray-700"
                onClick={() => document.getElementById('export-menu')?.classList.toggle('hidden')}
              >
                <FileUp className="mr-2 h-4 w-4" /> Exporteren
              </Button>
              
              <div 
                id="export-menu" 
                className="hidden absolute z-10 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none"
              >
                <div className="py-1">
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" 
                    onClick={exportStudentsAsPDF}
                  >
                    <FileUp className="mr-2 h-4 w-4" /> PDF bestand
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" 
                    onClick={exportStudentsAsExcel}
                  >
                    <FileSpreadsheet className="mr-2 h-4 w-4" /> Excel bestand
                  </button>
                  <button 
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center" 
                    onClick={exportStudentsAsCSV}
                  >
                    <FileText className="mr-2 h-4 w-4" /> CSV bestand
                  </button>
                </div>
              </div>
            </div>
            
            <Button 
              variant="outline" 
              size="default"
              className="border-gray-300 text-gray-700"
              onClick={() => setIsImportDialogOpen(true)}
            >
              <FileDown className="mr-2 h-4 w-4" /> Importeren
            </Button>
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
      </div>

      {/* Filter opties */}
      {showFilterOptions && (
        <div className="mb-6 bg-white p-4 rounded-md border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-medium text-gray-700">Filters</h3>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setShowFilterOptions(false)}
              className="h-7 w-7 p-0"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label htmlFor="status-filter" className="text-xs text-gray-600 mb-1 block">Status</Label>
              <Select 
                value={selectedStatusFilter} 
                onValueChange={setSelectedStatusFilter}
              >
                <SelectTrigger id="status-filter" className="h-8 text-xs">
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
              <Label htmlFor="group-filter" className="text-xs text-gray-600 mb-1 block">Klas</Label>
              <Select 
                value={selectedStudentGroupFilter} 
                onValueChange={setSelectedStudentGroupFilter}
              >
                <SelectTrigger id="group-filter" className="h-8 text-xs">
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
            
            <div>
              <Label htmlFor="year-filter" className="text-xs text-gray-600 mb-1 block">Schooljaar</Label>
              <Select 
                value={selectedYearLevelFilter} 
                onValueChange={setSelectedYearLevelFilter}
              >
                <SelectTrigger id="year-filter" className="h-8 text-xs">
                  <SelectValue placeholder="Alle schooljaren" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle schooljaren</SelectItem>
                  {yearLevels.map((year: any) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-3 border-t border-gray-100 pt-3 justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => {
                setSelectedStatusFilter("all");
                setSelectedStudentGroupFilter("all");
                setSelectedYearLevelFilter("all");
              }}
              className="text-xs h-7"
            >
              Wissen
            </Button>
            <Button 
              size="sm" 
              onClick={() => {
                setPage(1);
                setShowFilterOptions(false);
              }}
              className="text-xs h-7 bg-[#1e3a8a]"
            >
              Toepassen
            </Button>
          </div>
        </div>
      )}

      {/* Studenten tabel - responsieve weergave */}
      <div className="bg-white rounded-md border border-gray-200 shadow-sm overflow-hidden">
        {/* Desktop weergave */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <Checkbox 
                    checked={
                      (() => {
                        const studentList = Array.isArray(studentsData) 
                          ? studentsData
                          : (studentsData?.students || []);
                        const studentIds = studentList.map((s: any) => s.id);
                        return studentIds.length > 0 && 
                          selectedStudents.length === studentIds.length &&
                          studentIds.every(id => selectedStudents.includes(id));
                      })()
                    }
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecteer alle studenten"
                  />
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Naam</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Klas</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schooljaar</th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Acties</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
            
            {/* Lege state wanneer er geen studenten zijn - onder de headers */}
            {!isLoading && (
              (Array.isArray(studentsData) && studentsData.length === 0) ||
              (!Array.isArray(studentsData) && (!studentsData?.students || studentsData?.students.length === 0))
            ) && (
              <tr>
                <td colSpan={8}>
                  <div className="py-6">
                    <StudentEmptyState description="Er zijn momenteel geen studenten in het systeem. Klik op 'Nieuw' om een student toe te voegen." />
                  </div>
                </td>
              </tr>
            )}
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Laden...</span>
                    </div>
                  </td>
                </tr>
              ) : (
                (Array.isArray(studentsData) ? studentsData : []).map((student: any) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <Checkbox 
                        checked={selectedStudents.includes(student.id)}
                        onCheckedChange={() => handleSelectStudent(student.id)}
                        aria-label={`Select ${student.firstName}`}
                      />
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.studentId}</td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback className="bg-[#1e3a8a] text-white">
                            {student.firstName[0]}{student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-sm text-gray-900">{student.firstName} {student.lastName}</div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.studentGroups && student.studentGroups.length > 0
                        ? student.studentGroups[0].groupName
                        : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                      {student.programs && student.programs[0] 
                        ? student.programs[0].yearLevel 
                        : '-'}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-center">
                      {renderStatusBadge(student.status)}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleViewStudentDetails(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => handleEditStudent(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setSelectedStudent(student);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Mobiele kaartweergave - alleen tonen als er studenten zijn en de lege state niet wordt getoond */}
        <div className="md:hidden">
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Laden...</span>
            </div>
          ) : (studentsData?.students?.length === 0) ? null : (
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
                          onClick={() => handleViewStudentDetails(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditStudent(student)}
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
                      <span className="text-gray-500 w-24">Klas:</span>
                      <span className="text-sm text-gray-900 truncate">
                        {student.studentGroups && student.studentGroups.length > 0
                          ? student.studentGroups[0].groupName
                          : '-'}
                      </span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-gray-500 w-24">Schooljaar:</span>
                      <span className="text-sm text-gray-900">
                        {student.programs && student.programs[0] 
                          ? student.programs[0].yearLevel 
                          : '-'}
                      </span>
                    </div>
                    <div className="flex items-baseline">
                      <span className="text-gray-500 w-24">Email:</span>
                      <span className="text-sm text-gray-900 truncate">{student.email}</span>
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
        <DialogContent className="sm:max-w-[85%] max-h-[90vh] h-auto overflow-y-auto p-0">
          {/* Blauwe header */}
          <div className="bg-[#1e3a8a] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <PlusCircle className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    Nieuwe Student Toevoegen
                  </h2>
                  <span className="text-sm text-blue-100 font-medium">
                    Vul de studentinformatie in om een nieuwe student toe te voegen aan het systeem
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="px-6 py-4">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid grid-cols-5 mb-4 p-1 bg-[#1e3a8a]/10 rounded-md">
                <TabsTrigger value="personal" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                  <User className="h-4 w-4" />
                  <span>Persoonlijk</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                  <Phone className="h-4 w-4" />
                  <span>Contact</span>
                </TabsTrigger>
                <TabsTrigger value="address" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                  <MapPin className="h-4 w-4" />
                  <span>Adres</span>
                </TabsTrigger>
                <TabsTrigger value="class" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                  <ChalkBoard className="h-4 w-4" />
                  <span>Klas</span>
                </TabsTrigger>
                <TabsTrigger value="guardian" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                  <UserCheck className="h-4 w-4" />
                  <span>Voogden</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Persoonlijke informatie tab */}
              <TabsContent value="personal" className="mt-0">
                <div className="p-4 bg-white rounded-lg min-h-[450px]">
                  <div className="flex flex-col md:flex-row md:justify-between gap-4 mb-4">
                    {/* Foto upload sectie */}
                    <div className="flex items-start">
                      <div className="relative">
                        <div 
                          className="w-28 h-28 flex items-center justify-center overflow-hidden relative group cursor-pointer rounded-full shadow-md bg-gradient-to-b from-blue-50 to-blue-100 border-4 border-white outline outline-2 outline-blue-100"
                          onClick={() => {
                            const fileInput = document.getElementById('student-photo') as HTMLInputElement;
                            fileInput?.click();
                          }}
                        >
                          <img id="student-photo-preview" src="" alt="" className="w-full h-full object-cover hidden" />
                          <div id="student-photo-placeholder" className="w-full h-full flex items-center justify-center">
                            <User className="h-12 w-12 text-blue-300/60" />
                          </div>
                          
                          {/* Upload indicator overlay bij hover */}
                          <div className="absolute inset-0 bg-blue-900/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-full">
                            <div className="bg-white/90 rounded-full p-2.5 shadow-md">
                              <Upload className="h-5 w-5 text-primary" />
                            </div>
                          </div>
                          
                          {/* Verwijder-knop verschijnt alleen bij hover als er een foto is */}
                          <div 
                            className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hidden rounded-full"
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
                            <div className="bg-white/90 rounded-full p-2.5 shadow-md">
                              <Trash2 className="h-5 w-5 text-red-500" />
                            </div>
                          </div>
                        </div>
                        <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-2 shadow-lg ring-2 ring-white">
                          <Camera className="h-4 w-4 text-white" />
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
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center h-9 border border-gray-200 text-sm shadow-sm hover:bg-blue-50"
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
                              photoUrl: "https://placehold.co/400x400/eee/31316a?text=Foto+eID",
                              // Nieuw veld voor noodcontactnummer
                              emergencyContactPhone: "+32 487 65 43 21"
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
                            
                            // Controleer of er een noodcontactnummer is gedetecteerd in de eID
                            if (eidData.emergencyContactPhone) {
                              // Toon bericht dat er een noodcontactnummer is gedetecteerd
                              localToast({
                                title: "Noodcontact gedetecteerd",
                                description: `Noodcontactnummer ${eidData.emergencyContactPhone} gevonden op eID. Vul het formulier verder in en klik op "Student toevoegen" om het noodcontact te kunnen koppelen.`,
                              });
                              
                              // Maak een tijdelijke voogd met het noodcontactnummer (nog niet opslaan in database)
                              const newGuardian = {
                                firstName: "", // Leeg, moet ingevuld worden
                                lastName: eidData.lastName, // Zelfde achternaam als student
                                relationship: "noodcontact",
                                email: "",
                                phone: eidData.emergencyContactPhone, // Gebruik het noodcontactnummer
                                street: eidData.street,
                                houseNumber: eidData.houseNumber,
                                postalCode: eidData.postalCode,
                                city: eidData.city,
                                isEmergencyContact: true
                              };
                              
                              // Vul ook de voogden tab in met het gedetecteerde noodcontact
                              setGuardianFormData({
                                firstName: "",
                                lastName: eidData.lastName,
                                relationship: "noodcontact",
                                email: "",
                                phone: eidData.emergencyContactPhone,
                                address: "",
                                street: eidData.street,
                                houseNumber: eidData.houseNumber,
                                postalCode: eidData.postalCode,
                                city: eidData.city,
                                isEmergencyContact: true,
                                emergencyContactName: "",
                                emergencyContactPhone: "",
                                emergencyContactRelation: "",
                                notes: ""
                              });
                              
                              // Sla de tijdelijke voogd op zodat deze in de popup getoond kan worden
                              setFoundGuardian(newGuardian);
                              
                              // Wacht met tonen van de popup tot de gebruiker op "Student toevoegen" klikt
                              // De popup wordt nu niet direct getoond, maar pas bij het submitten van het formulier
                            } else {
                              // Zoek naar mogelijke voogden met dezelfde achternaam (als fallback)
                              const lastName = eidData.lastName;
                              
                              // Haal de guardians data op (als dat er is)
                              apiRequest(`/api/guardians/search?lastName=${encodeURIComponent(lastName)}`)
                                .then((matchingGuardians) => {
                                  if (matchingGuardians && matchingGuardians.length > 0) {
                                    // Neem de eerste gevonden voogd met dezelfde achternaam
                                    setFoundGuardian(matchingGuardians[0]);
                                    
                                    // Toon bericht dat er een mogelijke voogd is gevonden
                                    localToast({
                                      title: "Mogelijke voogd gevonden",
                                      description: `${matchingGuardians[0].firstName} ${matchingGuardians[0].lastName} is gevonden als mogelijke voogd.`,
                                    });
                                    
                                    // Toon het bevestigingsdialoog
                                    setShowGuardianConfirmDialog(true);
                                  }
                                })
                                .catch(error => {
                                  console.error("Fout bij zoeken naar voogden:", error);
                                });
                            }
                            
                            // Voeg een extra bericht toe dat de gegevens zijn ingeladen
                            localToast({
                              title: "Gegevens geladen",
                              description: "De gegevens van de eID zijn succesvol ingeladen.",
                            });
                          }, 2000);
                        }, 1500);
                      }}
                    >
                      <span className="mr-2 bg-[#77CC9A] text-white rounded-md px-1 font-bold text-xs py-0.5">be|ID</span>
                      Gegevens laden via eID
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="studentId" className="text-xs font-medium text-gray-700">
                        StudentID <span className="text-muted-foreground text-xs">(automatisch)</span>
                      </Label>
                      <Input
                        id="studentId"
                        value={nextStudentIdData?.nextStudentId || "Wordt geladen..."}
                        disabled
                        className="mt-1 h-9 text-sm bg-gray-50 text-gray-500 font-medium border-gray-200"
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
                        <SelectTrigger id="status" className="mt-1 h-9 text-sm bg-white border-gray-200">
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
                      <Label htmlFor="gender" className="text-xs font-medium text-gray-700">
                        Geslacht
                      </Label>
                      <Select
                        value={studentFormData.gender}
                        onValueChange={(value) => setStudentFormData({ ...studentFormData, gender: value })}
                      >
                        <SelectTrigger id="gender" className="mt-1 h-9 text-sm bg-white border-gray-200">
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
                      <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">
                        Voornaam <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={studentFormData.firstName}
                        onChange={(e) => setStudentFormData({ ...studentFormData, firstName: e.target.value })}
                        className="mt-1 h-9 text-sm bg-white border-gray-200"
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
                        className="mt-1 h-9 text-sm bg-white border-gray-200"
                        placeholder="Achternaam"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-xs font-medium text-gray-700">
                        Geboortedatum
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={studentFormData.dateOfBirth || ''}
                        onChange={(e) => setStudentFormData({ ...studentFormData, dateOfBirth: e.target.value })}
                        className="mt-1 h-9 text-sm bg-white border-gray-200"
                      />
                    </div>
                    
                    <div className="md:col-span-3">
                      <Label htmlFor="notes" className="text-xs font-medium text-gray-700">
                        Notities
                      </Label>
                      <Textarea
                        id="notes"
                        value={studentFormData.notes}
                        onChange={(e) => setStudentFormData({ ...studentFormData, notes: e.target.value })}
                        className="mt-1 text-sm bg-white border-gray-200"
                        placeholder="Voeg hier aanvullende informatie toe..."
                        rows={3}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Contact informatie tab */}
              <TabsContent value="contact" className="mt-0">
                <div className="p-4 bg-white rounded-lg min-h-[450px]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="email" className="text-xs font-medium text-gray-700">
                        Email
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={studentFormData.email}
                        onChange={(e) => setStudentFormData({ ...studentFormData, email: e.target.value })}
                        className="mt-1 h-9 text-sm bg-white border-gray-200"
                        placeholder="student@mymadrassa.nl"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="text-xs font-medium text-gray-700">
                        Telefoonnummer
                      </Label>
                      <Input
                        id="phone"
                        value={studentFormData.phone}
                        onChange={(e) => setStudentFormData({ ...studentFormData, phone: e.target.value })}
                        className="mt-1 h-9 text-sm bg-white border-gray-200"
                        placeholder="06 1234 5678"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="enrollmentDate" className="text-xs font-medium text-gray-700">
                        Inschrijvingsdatum
                      </Label>
                      <Input
                        id="enrollmentDate"
                        type="date"
                        value={studentFormData.enrollmentDate}
                        onChange={(e) => setStudentFormData({ ...studentFormData, enrollmentDate: e.target.value })}
                        className="mt-1 h-9 text-sm bg-white border-gray-200"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Adres informatie tab */}
              <TabsContent value="address" className="mt-0">
                <div className="p-4 bg-white rounded-lg min-h-[450px]">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="street" className="text-xs font-medium text-gray-700">
                        Straat
                      </Label>
                      <Input
                        id="street"
                        value={studentFormData.street}
                        onChange={(e) => setStudentFormData({ ...studentFormData, street: e.target.value })}
                        className="mt-1 h-9 text-sm bg-white border-gray-200"
                        placeholder="Straatnaam"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="houseNumber" className="text-xs font-medium text-gray-700">
                        Huisnummer
                      </Label>
                      <Input
                        id="houseNumber"
                        value={studentFormData.houseNumber}
                        onChange={(e) => setStudentFormData({ ...studentFormData, houseNumber: e.target.value })}
                        className="mt-1 h-9 text-sm bg-white border-gray-200"
                        placeholder="123"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="postalCode" className="text-xs font-medium text-gray-700">
                        Postcode
                      </Label>
                      <Input
                        id="postalCode"
                        value={studentFormData.postalCode}
                        onChange={(e) => setStudentFormData({ ...studentFormData, postalCode: e.target.value })}
                        className="mt-1 h-9 text-sm bg-white border-gray-200"
                        placeholder="1234 AB"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="city" className="text-xs font-medium text-gray-700">
                        Stad
                      </Label>
                      <Input
                        id="city"
                        value={studentFormData.city}
                        onChange={(e) => setStudentFormData({ ...studentFormData, city: e.target.value })}
                        className="mt-1 h-9 text-sm bg-white border-gray-200"
                        placeholder="Amsterdam"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Voogden tab */}
              <TabsContent value="guardian" className="mt-0">
                <div className="p-4 bg-white rounded-lg min-h-[450px]">
                  
                  {/* Persoonlijke informatie sectie */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <User className="h-4 w-4 text-primary mr-2" />
                      <h4 className="text-sm font-medium text-gray-800">Persoonlijke informatie</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label htmlFor="guardian-firstName" className="text-xs font-medium text-gray-700">
                          Voornaam
                        </Label>
                        <Input
                          id="guardian-firstName"
                          value={guardianFormData.firstName}
                          onChange={(e) => setGuardianFormData({ ...guardianFormData, firstName: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Voornaam voogd"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="guardian-lastName" className="text-xs font-medium text-gray-700">
                          Achternaam
                        </Label>
                        <Input
                          id="guardian-lastName"
                          value={guardianFormData.lastName}
                          onChange={(e) => setGuardianFormData({ ...guardianFormData, lastName: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Achternaam voogd"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="guardian-relationship" className="text-xs font-medium text-gray-700">
                          Relatie tot student
                        </Label>
                        <Select
                          value={guardianFormData.relationship}
                          onValueChange={(value) => setGuardianFormData({ ...guardianFormData, relationship: value })}
                        >
                          <SelectTrigger id="guardian-relationship" className="mt-1 h-9 text-sm bg-white border-gray-200">
                            <SelectValue placeholder="Selecteer relatie" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ouder">Ouder</SelectItem>
                            <SelectItem value="voogd">Voogd</SelectItem>
                            <SelectItem value="grootouder">Grootouder</SelectItem>
                            <SelectItem value="noodcontact">Noodcontact</SelectItem>
                            <SelectItem value="ander">Ander</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  {/* Contactgegevens sectie */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <Phone className="h-4 w-4 text-primary mr-2" />
                      <h4 className="text-sm font-medium text-gray-800">Contactgegevens</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="guardian-email" className="text-xs font-medium text-gray-700">
                          Email
                        </Label>
                        <Input
                          id="guardian-email"
                          type="email"
                          value={guardianFormData.email}
                          onChange={(e) => setGuardianFormData({ ...guardianFormData, email: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="email@voorbeeld.nl"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="guardian-phone" className="text-xs font-medium text-gray-700">
                          Telefoonnummer
                        </Label>
                        <Input
                          id="guardian-phone"
                          value={guardianFormData.phone}
                          onChange={(e) => setGuardianFormData({ ...guardianFormData, phone: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="06 1234 5678"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Adresgegevens sectie */}
                  <div className="mb-6">
                    <div className="flex items-center mb-3">
                      <MapPin className="h-4 w-4 text-primary mr-2" />
                      <h4 className="text-sm font-medium text-gray-800">Adresgegevens</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <Label htmlFor="guardian-street" className="text-xs font-medium text-gray-700">
                          Straat
                        </Label>
                        <Input
                          id="guardian-street"
                          value={guardianFormData.street}
                          onChange={(e) => setGuardianFormData({ ...guardianFormData, street: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Straatnaam"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="guardian-houseNumber" className="text-xs font-medium text-gray-700">
                          Huisnummer
                        </Label>
                        <Input
                          id="guardian-houseNumber"
                          value={guardianFormData.houseNumber}
                          onChange={(e) => setGuardianFormData({ ...guardianFormData, houseNumber: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="123"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="guardian-postalCode" className="text-xs font-medium text-gray-700">
                          Postcode
                        </Label>
                        <Input
                          id="guardian-postalCode"
                          value={guardianFormData.postalCode}
                          onChange={(e) => setGuardianFormData({ ...guardianFormData, postalCode: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="1234 AB"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="guardian-city" className="text-xs font-medium text-gray-700">
                          Stad
                        </Label>
                        <Input
                          id="guardian-city"
                          value={guardianFormData.city}
                          onChange={(e) => setGuardianFormData({ ...guardianFormData, city: e.target.value })}
                          className="mt-1 h-9 text-sm bg-white border-gray-200"
                          placeholder="Amsterdam"
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Noodcontact sectie */}
                  <div className="mb-4">
                    <div className="flex items-center mb-3">
                      <AlertCircle className="h-4 w-4 text-primary mr-2" />
                      <h4 className="text-sm font-medium text-gray-800">Noodcontact</h4>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md border">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="guardian-isEmergencyContact"
                          checked={guardianFormData.isEmergencyContact}
                          onCheckedChange={(checked) => setGuardianFormData({ 
                            ...guardianFormData, 
                            isEmergencyContact: checked as boolean 
                          })}
                        />
                        <Label htmlFor="guardian-isEmergencyContact" className="text-sm font-medium text-gray-700">
                          Deze voogd is het primaire noodcontact
                        </Label>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        Vink aan als deze voogd het eerste contactpersoon moet zijn in noodsituaties.
                      </p>
                    </div>
                  </div>
                  
                  {/* Notities sectie */}
                  <div>
                    <div className="flex items-center mb-3">
                      <FileText className="h-4 w-4 text-primary mr-2" />
                      <h4 className="text-sm font-medium text-gray-800">Aanvullende informatie</h4>
                    </div>
                    <div>
                      <Label htmlFor="guardian-notes" className="text-xs font-medium text-gray-700">
                        Notities
                      </Label>
                      <Input
                        id="guardian-notes"
                        value={guardianFormData.notes}
                        onChange={(e) => setGuardianFormData({ ...guardianFormData, notes: e.target.value })}
                        className="mt-1 h-9 text-sm bg-white border-gray-200"
                        placeholder="Aanvullende informatie over deze voogd..."
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Klas toewijzing tab */}
              <TabsContent value="class" className="mt-0">
                <div className="p-4 bg-white rounded-lg min-h-[450px]">
                  <div className="flex justify-between items-center mb-2">
                    {studentFormData.studentGroupId && (
                      <Badge variant="outline" className="bg-blue-50 text-primary border-blue-100 font-medium py-1">
                        <Check className="h-3.5 w-3.5 mr-1" />
                        Klas toegewezen
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="schoolYear" className="text-xs font-medium text-gray-700">
                        Schooljaar <span className="text-primary">*</span>
                      </Label>
                      <Select
                        value={studentFormData.schoolYear || 'geen'}
                        onValueChange={(value) => setStudentFormData({ 
                          ...studentFormData, 
                          schoolYear: value === 'geen' ? '' : value
                        })}
                      >
                        <SelectTrigger className="border-gray-200 bg-white h-9 mt-1 text-sm">
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
                    
                    <div>
                      <Label htmlFor="studentGroupId" className="text-xs font-medium text-gray-700">
                        Selecteer klas
                      </Label>
                      <Select
                        value={studentFormData.studentGroupId?.toString() || 'none'}
                        onValueChange={(value) => setStudentFormData({ 
                          ...studentFormData, 
                          studentGroupId: value === 'none' ? null : parseInt(value) 
                        })}
                      >
                        <SelectTrigger className="border-gray-200 bg-white h-9 mt-1 text-sm">
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
                  
                  {studentFormData.studentGroupId && (
                    <div className="flex items-center p-3 mt-4 rounded-md bg-blue-50 border border-blue-100">
                      <div className="mr-3 p-2 bg-primary rounded-full">
                        <Users className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <h4 className="font-medium text-primary">
                          {studentGroups.find((g: any) => g.id === studentFormData.studentGroupId)?.name}
                        </h4>
                        <p className="text-xs text-gray-600">
                          De student wordt toegewezen aan deze klas
                        </p>
                      </div>
                    </div>
                  )}
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

      {/* Import Students Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[95%] md:max-w-[80%] lg:max-w-[70%] h-auto max-h-[96vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center text-primary">
              <FileUp className="mr-2 h-5 w-5 text-primary" />
              Studenten Importeren
            </DialogTitle>
            <DialogDescription>
              Importeer meerdere studenten vanuit een Excel of CSV bestand. Zorg dat de benodigde velden correct worden herkend.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
              <h3 className="text-sm font-semibold text-blue-800 mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Benodigde velden in importbestand
              </h3>
              <p className="text-sm text-blue-700 mb-2">
                Voor een succesvolle import moet uw bestand de volgende velden bevatten:
              </p>
              <ul className="text-xs text-blue-600 list-disc pl-5 grid grid-cols-1 md:grid-cols-2 gap-1">
                <li><strong>firstName</strong> - Voornaam (verplicht)</li>
                <li><strong>lastName</strong> - Achternaam (verplicht)</li>
                <li><strong>email</strong> - E-mailadres</li>
                <li><strong>phone</strong> - Telefoonnummer</li>
                <li><strong>dateOfBirth</strong> - Geboortedatum (DD-MM-YYYY)</li>
                <li><strong>gender</strong> - Geslacht (M/V)</li>
                <li><strong>street</strong> - Straatnaam</li>
                <li><strong>houseNumber</strong> - Huisnummer</li>
                <li><strong>postalCode</strong> - Postcode</li>
                <li><strong>city</strong> - Plaats</li>
                <li><strong>status</strong> - Status (enrolled, graduated, suspended, withdrawn)</li>
              </ul>

            </div>
            
            {!importFile ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
                  <FileSpreadsheet className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-medium mb-2">Sleep een bestand hierheen of</h3>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2"
                >
                  <Upload className="mr-2 h-4 w-4" /> Selecteer bestand
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".csv,.xls,.xlsx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      handleImportFile(file);
                    }
                  }}
                />
                <p className="text-sm text-gray-500 mt-2">
                  Ondersteunde bestandsformaten: .CSV, .XLS, .XLSX
                </p>
              </div>
            ) : (
              <>
                <div className="flex justify-between items-center pb-2 border-b">
                  <div className="flex items-center">
                    <div className="p-2 bg-blue-50 rounded-lg mr-3">
                      {importType === 'csv' ? (
                        <FileText className="h-6 w-6 text-blue-600" />
                      ) : (
                        <FileSpreadsheet className="h-6 w-6 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{importFile.name}</p>
                      <p className="text-sm text-gray-500">
                        {importType === 'csv' ? 'CSV Bestand' : 'Excel Bestand'} • {(importFile.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      setImportFile(null);
                      setImportPreview([]);
                      setImportColumns([]);
                      setColumnMappings({});
                    }}
                  >
                    <X className="h-4 w-4 mr-1" /> Verwijderen
                  </Button>
                </div>
                
                {importPreview.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="font-medium text-lg">Voorbeeldgegevens</h3>
                    <div className="overflow-x-auto rounded-lg border">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            {importColumns.map((column, idx) => (
                              <th 
                                key={idx} 
                                className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {importPreview.map((row, rowIdx) => (
                            <tr key={rowIdx}>
                              {importColumns.map((column, colIdx) => (
                                <td key={colIdx} className="px-4 py-2 whitespace-nowrap text-gray-900">
                                  {row[column] !== undefined ? String(row[column]) : '-'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    
                    <div className="space-y-4 pt-2">
                      <h3 className="font-medium text-lg">Kolomtoewijzingen</h3>
                      <p className="text-sm text-gray-500">
                        Verbind de kolommen uit uw bestand met de juiste studentvelden
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {importColumns.map((column) => (
                          <div key={column} className="space-y-1">
                            <Label className="text-sm font-medium">
                              {column}
                            </Label>
                            <Select
                              value={columnMappings[column] || ''}
                              onValueChange={(value) => {
                                if (value) {
                                  setColumnMappings({
                                    ...columnMappings,
                                    [column]: value
                                  });
                                } else {
                                  const newMappings = {...columnMappings};
                                  delete newMappings[column];
                                  setColumnMappings(newMappings);
                                }
                              }}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="Selecteer veld" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="">Negeer deze kolom</SelectItem>
                                <SelectItem value="firstName">Voornaam</SelectItem>
                                <SelectItem value="lastName">Achternaam</SelectItem>
                                <SelectItem value="email">E-mail</SelectItem>
                                <SelectItem value="phone">Telefoon</SelectItem>
                                <SelectItem value="dateOfBirth">Geboortedatum</SelectItem>
                                <SelectItem value="gender">Geslacht</SelectItem>
                                <SelectItem value="street">Straat</SelectItem>
                                <SelectItem value="houseNumber">Huisnummer</SelectItem>
                                <SelectItem value="postalCode">Postcode</SelectItem>
                                <SelectItem value="city">Woonplaats</SelectItem>
                                <SelectItem value="status">Status</SelectItem>
                                <SelectItem value="notes">Notities</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsImportDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button 
              variant="default"
              className="bg-[#1e3a8a]"
              onClick={importStudents}
              disabled={!importFile || importPreview.length === 0 || Object.keys(columnMappings).length === 0 || isImporting}
            >
              {isImporting ? (
                <>
                  <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  Importeren...
                </>
              ) : (
                <>
                  <Check className="mr-2 h-4 w-4" /> Importeren
                </>
              )}
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
                  <ChalkBoard className="mr-2 h-4 w-4" />
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
        <DialogContent className="sm:max-w-[95%] max-h-[96vh] h-auto p-0">
          {/* Blauwe header */}
          <div className="bg-[#1e3a8a] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <User className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedStudent?.firstName} {selectedStudent?.lastName}
                  </h2>
                  <span className="text-sm text-blue-100 font-medium">
                    Gedetailleerde informatie over deze student
                  </span>
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                className="text-white hover:bg-[#1e3a8a]/80 hover:text-white"
                onClick={() => setIsStudentDetailDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Sluiten
              </Button>
            </div>
          </div>
          
          {selectedStudent && (
            <div className="px-6 py-4">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid grid-cols-5 mb-4 p-1 bg-[#1e3a8a]/10 rounded-md">
                  <TabsTrigger value="personal" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-2">
                    <User className="h-4 w-4" />
                    <span>Persoonlijk</span>
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-2">
                    <Phone className="h-4 w-4" />
                    <span>Contact</span>
                  </TabsTrigger>
                  <TabsTrigger value="address" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-2">
                    <MapPin className="h-4 w-4" />
                    <span>Adres</span>
                  </TabsTrigger>
                  <TabsTrigger value="class" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-2">
                    <ChalkBoard className="h-4 w-4" />
                    <span>Klas</span>
                  </TabsTrigger>
                  <TabsTrigger value="guardians" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-2">
                    <Users className="h-4 w-4" />
                    <span>Voogden</span>
                  </TabsTrigger>
                </TabsList>
                
                {/* Persoonlijke informatie tab */}
                <TabsContent value="personal" className="pt-0">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1e3a8a] rounded-full">
                          <User className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#1e3a8a]">Persoonlijke gegevens</h3>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      {/* Profiel sectie */}
                      <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg">
                        <Avatar className="h-16 w-16 ring-2 ring-[#1e3a8a]/20">
                          <AvatarFallback className="bg-[#1e3a8a] text-white text-xl">
                            {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h2 className="text-xl font-semibold text-gray-900 mb-1">
                            {selectedStudent.firstName} {selectedStudent.lastName}
                          </h2>
                          <p className="text-[#1e3a8a] font-medium mb-2">{selectedStudent.studentId}</p>
                          <div>
                            {renderStatusBadge(selectedStudent.status)}
                          </div>
                        </div>
                      </div>

                      {/* Basis informatie */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <CalendarDays className="h-4 w-4" />
                            Geboortedatum
                          </label>
                          <p className="text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-md">
                            {selectedStudent.dateOfBirth ? formatDateToDisplayFormat(selectedStudent.dateOfBirth) : "Niet ingevuld"}
                          </p>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Geslacht
                          </label>
                          <p className="text-gray-900 font-medium bg-gray-50 px-3 py-2 rounded-md">
                            {selectedStudent.gender === 'man' ? 'Man' : 
                             selectedStudent.gender === 'vrouw' ? 'Vrouw' : 'Niet ingevuld'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Notities sectie */}
                      <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Notities
                        </label>
                        <div className="bg-gray-50 border rounded-md p-4 min-h-[80px]">
                          <p className="text-gray-900 whitespace-pre-wrap">
                            {selectedStudent.notes || "Geen notities beschikbaar"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Contact tab */}
                <TabsContent value="contact" className="pt-0">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1e3a8a] rounded-full">
                          <Phone className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#1e3a8a]">Contactgegevens</h3>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email adres
                          </label>
                          <div className="bg-gray-50 border rounded-md px-3 py-2">
                            <p className="text-gray-900 font-medium">
                              {selectedStudent.email || "Niet ingevuld"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Telefoonnummer
                          </label>
                          <div className="bg-gray-50 border rounded-md px-3 py-2">
                            <p className="text-gray-900 font-medium">
                              {selectedStudent.phone || "Niet ingevuld"}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <CalendarDays className="h-4 w-4" />
                          Inschrijvingsdatum
                        </label>
                        <div className="bg-gray-50 border rounded-md px-3 py-2">
                          <p className="text-gray-900 font-medium">
                            {selectedStudent.enrollmentDate 
                              ? formatDateToDisplayFormat(selectedStudent.enrollmentDate) 
                              : "Niet ingevuld"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Adres tab */}
                <TabsContent value="address" className="pt-0">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1e3a8a] rounded-full">
                          <MapPin className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#1e3a8a]">Adresgegevens</h3>
                      </div>
                    </div>
                    
                    <div className="p-6 space-y-6">
                      {/* Volledig adres */}
                      <div className="bg-gray-50 border rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-[#1e3a8a] mt-0.5" />
                          <div>
                            <p className="font-semibold text-gray-900 text-lg">
                              {selectedStudent.street} {selectedStudent.houseNumber}
                            </p>
                            <p className="text-gray-600 text-base">
                              {selectedStudent.postalCode} {selectedStudent.city}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Gedetailleerde adres informatie */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            Straatnaam
                          </label>
                          <div className="bg-gray-50 border rounded-md px-3 py-2">
                            <p className="text-gray-900 font-medium">
                              {selectedStudent.street || "Niet ingevuld"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Home className="h-4 w-4" />
                            Huisnummer
                          </label>
                          <div className="bg-gray-50 border rounded-md px-3 py-2">
                            <p className="text-gray-900 font-medium">
                              {selectedStudent.houseNumber || "Niet ingevuld"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Postcode
                          </label>
                          <div className="bg-gray-50 border rounded-md px-3 py-2">
                            <p className="text-gray-900 font-medium">
                              {selectedStudent.postalCode || "Niet ingevuld"}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Stad
                          </label>
                          <div className="bg-gray-50 border rounded-md px-3 py-2">
                            <p className="text-gray-900 font-medium">
                              {selectedStudent.city || "Niet ingevuld"}
                            </p>
                          </div>
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
                
                {/* Voogden tab */}
                <TabsContent value="guardians" className="pt-0">
                  <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#1e3a8a] rounded-full">
                          <Users className="h-5 w-5 text-white" />
                        </div>
                        <h3 className="text-lg font-semibold text-[#1e3a8a]">Voogden & Contactpersonen</h3>
                      </div>
                    </div>
                    
                    <div className="p-6">
                      <ManageStudentGuardians 
                        studentId={selectedStudent.id}
                        readonly={true}
                      />
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
                <Button 
                  variant="outline" 
                  onClick={() => setIsStudentDetailDialogOpen(false)}
                >
                  Sluiten
                </Button>
                <Button 
                  variant="default" 
                  className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/80"
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
      
      {/* Guardian Confirmation Dialog */}
      <Dialog open={showGuardianConfirmDialog} onOpenChange={setShowGuardianConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader className="pb-3 border-b">
            <DialogTitle className="text-xl font-semibold flex items-center text-primary">
              <div className="bg-blue-100 rounded-full p-1.5 mr-3">
                {foundGuardian?.phone && foundGuardian?.phone.startsWith('+') ? 
                  <AlertCircle className="h-5 w-5 text-primary" /> : 
                  <UserCheck className="h-5 w-5 text-primary" />
                }
              </div>
              {foundGuardian?.phone && foundGuardian?.phone.startsWith('+') ? 
                'Noodcontact gedetecteerd' : 
                'Voogd gevonden'
              }
            </DialogTitle>
            <DialogDescription className="text-gray-500 mt-1">
              {foundGuardian?.phone && foundGuardian?.phone.startsWith('+') ? 
                `Er is een noodcontactnummer (${foundGuardian?.phone}) gedetecteerd op de eID. Wilt u dit nummer koppelen als contactpersoon?` : 
                'Er is een voogd gevonden met dezelfde achternaam. Wilt u deze koppelen aan de student?'
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="p-4 border rounded-lg bg-blue-50">
              <div className="flex items-start">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarFallback className="bg-primary text-white">
                    {foundGuardian?.firstName?.[0]}{foundGuardian?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  {/* Bij noodcontacten tonen we alleen het telefoonnummer en een badge */}
                  {(foundGuardian?.phone && foundGuardian?.phone.startsWith('+')) ? (
                    <div className="flex items-center mb-1">
                      <Phone className="h-5 w-5 mr-2 text-red-600" />
                      <span className="font-medium text-red-600">{foundGuardian?.phone}</span>
                      <Badge className="ml-2 bg-red-600 text-white">Noodgeval</Badge>
                    </div>
                  ) : (
                    <h3 className="font-medium">
                      {foundGuardian?.firstName} {foundGuardian?.lastName}
                    </h3>
                  )}
                  
                  {/* Bij noodcontacten tonen we geen relatietype */}
                  {!(foundGuardian?.phone && foundGuardian?.phone.startsWith('+')) && (
                    <p className="text-sm text-gray-600 mt-0.5">
                      {foundGuardian?.relationship === 'noodcontact' ? 'Noodcontact' :
                      foundGuardian?.relationship === 'parent' ? 'Ouder' : 
                      foundGuardian?.relationship === 'guardian' ? 'Voogd' : 'Contactpersoon'}
                    </p>
                  )}
                  
                  <div className="mt-2 text-sm">
                    {/* Bij noodcontacten tonen we geen verdere informatie */}
                    {!(foundGuardian?.phone && foundGuardian?.phone.startsWith('+')) && (
                      <>
                        {foundGuardian?.email && (
                          <div className="flex items-center mt-1">
                            <Mail className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{foundGuardian?.email}</span>
                          </div>
                        )}
                        {foundGuardian?.phone && (
                          <div className="flex items-center mt-1">
                            <Phone className="h-4 w-4 mr-2 text-gray-500" />
                            <span>{foundGuardian?.phone}</span>
                          </div>
                        )}
                        {(foundGuardian?.street || foundGuardian?.city) && (
                          <div className="flex items-center mt-1">
                            <Home className="h-4 w-4 mr-2 text-gray-500" />
                            <span>
                              {foundGuardian?.street} {foundGuardian?.houseNumber}, {foundGuardian?.postalCode} {foundGuardian?.city}
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="flex space-x-2 justify-end border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowGuardianConfirmDialog(false);
                
                // Als het een noodcontactnummer is, verwijderen we de tijdelijke voogd
                if (foundGuardian?.phone && foundGuardian?.phone.startsWith('+') && !foundGuardian.id) {
                  setFoundGuardian(null);
                }
              }}
            >
              {foundGuardian?.phone && foundGuardian?.phone.startsWith('+') 
                ? "Afwijzen" 
                : "Annuleren"}
            </Button>
            
            {/* Als het een bestaande voogd is met ID, toon dan de bewerken knop */}
            {foundGuardian && foundGuardian.id && (
              <Button
                type="button"
                variant="outline"
                className="border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-primary"
                onClick={() => {
                  // Sla de studentgegevens tijdelijk op
                  const tempStudent = {...studentFormData};
                  setShowGuardianConfirmDialog(false);
                  
                  // Redirect naar de voogdenpagina met de voogd-ID in een query parameter
                  window.location.href = `/guardians?edit=${foundGuardian.id}&returnToStudent=true`;
                  
                  toast({
                    title: "Voogd bewerken",
                    description: "U wordt doorgestuurd naar de voogdbewerking. Na het opslaan kunt u terugkeren naar de student.",
                  });
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Bewerken
              </Button>
            )}
            
            {/* Als het een noodcontactnummer is zonder ID, toon dan een andere bewerken knop */}
            {foundGuardian?.phone && foundGuardian?.phone.startsWith('+') && !foundGuardian.id && (
              <Button
                type="button"
                variant="outline"
                className="border-blue-200 bg-blue-50 hover:bg-blue-100 hover:text-primary"
                onClick={() => {
                  // Aanmaken van een nieuwe voogd met het noodcontactnummer
                  const newGuardian = {
                    firstName: "",
                    lastName: "",
                    relationship: "noodcontact",
                    email: "",
                    phone: foundGuardian.phone,
                    isEmergencyContact: true
                  };
                  
                  // Direct naar de Guardians pagina en de dialoog openen
                  // We sturen het telefoonnummer mee in localStorage voor tijdelijke opslag
                  localStorage.setItem('temp_noodcontact_phone', foundGuardian.phone);
                  localStorage.setItem('temp_student_return', 'true');
                  
                  // Markeer de dialoog om te openen op Guardians pagina
                  localStorage.setItem('open_guardian_dialog', 'true');
                  
                  // We redirecten naar de Guardians pagina
                  setShowGuardianConfirmDialog(false);
                  window.location.href = '/guardians';
                  
                  toast({
                    title: "Noodcontact bewerken",
                    description: "U wordt doorgestuurd naar de voogdenpagina om het noodcontact toe te voegen.",
                  });
                }}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Bewerken
              </Button>
            )}
            
            <Button
              type="button"
              onClick={() => {
                // Als het een tijdelijk noodcontact object is (zonder ID), maak eerst een voogdrecord aan
                if (foundGuardian && !foundGuardian.id && foundGuardian.phone && foundGuardian.phone.startsWith('+')) {
                  apiRequest('/api/guardians', {
                    method: 'POST',
                    body: foundGuardian
                  })
                  .then(createdGuardian => {
                    // Maak een kopie van de data om te versturen, zonder studentId
                    const { studentId, ...restData } = studentFormData;
                    const dataToSubmit = {
                      ...restData,
                      programs: selectedPrograms.length > 0 ? selectedPrograms : 
                        (studentFormData.programId ? [{ 
                          programId: studentFormData.programId, 
                          yearLevel: studentFormData.yearLevel 
                        }] : [])
                    };
                    
                    // Voeg de student toe
                    createStudentMutation.mutate(dataToSubmit, {
                      onSuccess: (createdStudent) => {
                        // Na toevoegen van de student, koppel de voogd eraan
                        apiRequest('/api/student-guardians', {
                          method: 'POST',
                          body: {
                            studentId: createdStudent.id,
                            guardianId: createdGuardian.id,
                            relationship: "noodcontact",
                            isPrimary: false
                          }
                        })
                        .then(() => {
                          toast({
                            title: "Student en noodcontact opgeslagen",
                            description: "De student is aangemaakt en het noodcontact is gekoppeld.",
                          });
                        })
                        .catch(error => {
                          console.error("Fout bij koppelen noodcontact:", error);
                          toast({
                            variant: "destructive",
                            title: "Fout bij koppelen noodcontact",
                            description: "Student is aangemaakt, maar kon niet aan het noodcontact worden gekoppeld.",
                          });
                        });
                      }
                    });
                    
                    setShowGuardianConfirmDialog(false);
                  })
                  .catch(error => {
                    console.error("Fout bij aanmaken noodcontact:", error);
                    toast({
                      variant: "destructive",
                      title: "Fout bij aanmaken noodcontact",
                      description: "Er is een fout opgetreden bij het aanmaken van het noodcontact.",
                    });
                  });
                } else {
                  // Maak een kopie van de data om te versturen, zonder studentId
                  const { studentId, ...restData } = studentFormData;
                  const dataToSubmit = {
                    firstName: restData.firstName || "",
                    lastName: restData.lastName || "",
                    email: restData.email || "",
                    phone: restData.phone || "",
                    dateOfBirth: restData.dateOfBirth || null,
                    address: restData.address || "",
                    street: restData.street || "",
                    houseNumber: restData.houseNumber || "",
                    postalCode: restData.postalCode || "",
                    city: restData.city || "",
                    status: restData.status || "actief",
                    enrollmentDate: restData.enrollmentDate || null,
                    schoolYear: restData.schoolYear || "",
                    studentGroupId: restData.studentGroupId || null,
                    notes: restData.notes || "",
                    gender: restData.gender || "",
                    nationality: restData.nationality || "",
                    placeOfBirth: restData.placeOfBirth || "",
                    nationalNumber: restData.nationalNumber || "",
                    programs: selectedPrograms.length > 0 ? selectedPrograms : 
                      (studentFormData.programId ? [{ 
                        programId: studentFormData.programId, 
                        yearLevel: studentFormData.yearLevel 
                      }] : [])
                  };
                  
                  // Voeg de student toe
                  createStudentMutation.mutate(dataToSubmit, {
                    onSuccess: (createdStudent) => {
                      // Als er een bestaande voogd was geselecteerd, koppel deze aan de nieuwe student
                      if (foundGuardian && foundGuardian.id) {
                        apiRequest('/api/student-guardians', {
                          method: 'POST',
                          body: {
                            studentId: createdStudent.id,
                            guardianId: foundGuardian.id,
                            relationship: foundGuardian.relationship || "parent",
                            isPrimary: true
                          }
                        })
                        .then(() => {
                          toast({
                            title: "Student en voogd gekoppeld",
                            description: "De student is aangemaakt en aan de voogd gekoppeld.",
                          });
                        })
                        .catch(error => {
                          console.error("Fout bij koppelen voogd:", error);
                          toast({
                            variant: "destructive",
                            title: "Fout bij koppelen voogd",
                            description: "Student is aangemaakt, maar kon niet aan de voogd worden gekoppeld.",
                          });
                        });
                      }
                    }
                  });
                  
                  setShowGuardianConfirmDialog(false);
                }
              }}
            >
              <Check className="h-4 w-4 mr-2" />
              Bevestigen en opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}