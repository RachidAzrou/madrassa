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
  UserCheck, CalendarDays, Hash, Save
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
      setSelectedPrograms([]);
    }
  }, [isCreateDialogOpen]);
  
  // Ophalen studenten met paginering en filters
  const { data: studentsData = {}, isLoading, isError } = useQuery({
    queryKey: [
      '/api/students', 
      { 
        page, 
        searchTerm, 
        programId: selectedProgramFilter === 'all' ? undefined : selectedProgramFilter,
        yearLevel: selectedYearLevelFilter === 'all' ? undefined : selectedYearLevelFilter,
        status: selectedStatusFilter === 'all' ? undefined : selectedStatusFilter,
        studentGroupId: selectedStudentGroupFilter === 'all' ? undefined : selectedStudentGroupFilter
      }
    ],
  });
  
  // Mutations voor student CRUD operaties
  const createStudentMutation = useMutation({
    mutationFn: (studentData: any) => {
      return apiRequest('/api/students', 'POST', studentData);
    },
    onSuccess: () => {
      toast({
        title: "Student toegevoegd",
        description: "De student is succesvol toegevoegd aan het systeem.",
      });
      
      // Reset formulieren en sluit dialogen
      setIsCreateDialogOpen(false);
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
        enrollmentDate: getCurrentDate(),
        status: 'active',
        notes: '',
        gender: '',
      });
      setFoundGuardian(null);
      setSelectedPrograms([]);
      
      // Vernieuw data
      queryClient.invalidateQueries({queryKey: ['/api/students']});
    },
    onError: (error: any) => {
      console.error("Error creating student:", error);
      toast({
        title: "Fout bij toevoegen",
        description: error?.message || "Er is een fout opgetreden bij het toevoegen van de student.",
        variant: "destructive",
      });
    },
  });
  
  const updateStudentMutation = useMutation({
    mutationFn: (studentData: any) => {
      return apiRequest(`/api/students/${studentData.id}`, 'PUT', studentData);
    },
    onSuccess: () => {
      toast({
        title: "Student bijgewerkt",
        description: "De student is succesvol bijgewerkt in het systeem.",
      });
      
      // Reset en sluit dialoog
      setIsEditDialogOpen(false);
      setSelectedStudent(null);
      
      // Vernieuw data
      queryClient.invalidateQueries({queryKey: ['/api/students']});
    },
    onError: (error: any) => {
      console.error("Error updating student:", error);
      toast({
        title: "Fout bij bijwerken",
        description: error?.message || "Er is een fout opgetreden bij het bijwerken van de student.",
        variant: "destructive",
      });
    },
  });
  
  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => {
      return apiRequest(`/api/students/${id}`, 'DELETE');
    },
    onSuccess: () => {
      toast({
        title: "Student verwijderd",
        description: "De student is succesvol verwijderd uit het systeem.",
      });
      
      // Reset en sluit dialoog
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      
      // Vernieuw data
      queryClient.invalidateQueries({queryKey: ['/api/students']});
    },
    onError: (error: any) => {
      console.error("Error deleting student:", error);
      toast({
        title: "Fout bij verwijderen",
        description: error?.message || "Er is een fout opgetreden bij het verwijderen van de student.",
        variant: "destructive",
      });
    },
  });
  
  // Importeren van studenten
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
      
      // Transformeer gegevens volgens de kolomtoewijzingen
      const transformedData = allData.map(row => {
        const transformedRow: any = {};
        
        Object.entries(columnMappings).forEach(([targetField, sourceField]) => {
          if (sourceField && row[sourceField] !== undefined) {
            transformedRow[targetField] = row[sourceField];
          }
        });
        
        return transformedRow;
      });
      
      // Maak een array van beloften voor alle studenten om toe te voegen
      const importPromises = transformedData.map(studentData => {
        // Basisvelden vereist voor elke student
        const requiredData = {
          studentId: studentData.studentId || `IMPORT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          firstName: studentData.firstName || '',
          lastName: studentData.lastName || '',
          status: 'active',
          ...studentData
        };
        
        return apiRequest('/api/students', 'POST', requiredData);
      });
      
      // Voer alle beloften parallel uit
      const results = await Promise.allSettled(importPromises);
      
      // Tel successen en mislukkingen
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      // Toon resultaat
      if (successful > 0) {
        toast({
          title: "Import voltooid",
          description: `${successful} student(en) succesvol geïmporteerd${failed > 0 ? `, ${failed} mislukt` : ''}.`,
        });
        
        // Vernieuw data
        queryClient.invalidateQueries({queryKey: ['/api/students']});
        
        // Reset import state
        setIsImportDialogOpen(false);
        setImportFile(null);
        setImportPreview([]);
        setImportColumns([]);
        setColumnMappings({});
      } else {
        toast({
          title: "Import mislukt",
          description: "Geen studenten konden worden geïmporteerd. Controleer uw gegevens en probeer het opnieuw.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error during import:", error);
      toast({
        title: "Importfout",
        description: "Er is een fout opgetreden tijdens het importeren. Controleer het bestandsformaat en probeer het opnieuw.",
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };
  
  // Bestandsverwerking voor import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportFile(file);
    
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      setImportType('csv');
      
      Papa.parse(file, {
        header: true,
        preview: 5,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data && results.data.length > 0) {
            setImportPreview(results.data);
            if (results.meta.fields) {
              setImportColumns(results.meta.fields);
            }
          }
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      setImportType('excel');
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          if (data) {
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(worksheet, { header: 'A' });
            
            // Extract headers (first row)
            const headers = json[0] ? Object.values(json[0]) : [];
            
            // Extract data (remaining rows)
            const previewData = json.slice(1, 6).map((row: any) => {
              const rowData: any = {};
              headers.forEach((header, index) => {
                const cellKey = Object.keys(row)[index];
                if (cellKey && header) {
                  rowData[header.toString()] = row[cellKey];
                }
              });
              return rowData;
            });
            
            setImportPreview(previewData);
            setImportColumns(headers.map(h => h.toString()));
          }
        } catch (error) {
          console.error("Error reading Excel file:", error);
          toast({
            title: "Bestandsfout",
            description: "Kan Excel-bestand niet verwerken. Controleer of het bestand geldig is.",
            variant: "destructive"
          });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast({
        title: "Niet-ondersteund bestandstype",
        description: "Upload een CSV- of Excel-bestand (.xlsx, .xls).",
        variant: "destructive"
      });
      setImportFile(null);
    }
  };
  
  // Kolomtoewijzing voor import
  const handleColumnMappingChange = (targetField: string, sourceField: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [targetField]: sourceField
    }));
  };
  
  // Exporteer studenten naar Excel
  const handleExportExcel = () => {
    if (!studentsData.students || studentsData.students.length === 0) {
      toast({
        title: "Geen gegevens beschikbaar",
        description: "Er zijn geen studenten om te exporteren.",
        variant: "destructive",
      });
      return;
    }
    
    // Map data voor export
    const exportData = studentsData.students.map((student: any) => ({
      "Student ID": student.studentId,
      "Voornaam": student.firstName,
      "Achternaam": student.lastName,
      "Email": student.email,
      "Telefoon": student.phone,
      "Geboortedatum": student.dateOfBirth ? formatDateToDisplayFormat(student.dateOfBirth) : "",
      "Adres": `${student.street || ''} ${student.houseNumber || ''}, ${student.postalCode || ''} ${student.city || ''}`.trim(),
      "Programma": student.programName || "",
      "Niveau": student.yearLevel || "",
      "Status": student.status || "",
      "Inschrijfdatum": student.enrollmentDate ? formatDateToDisplayFormat(student.enrollmentDate) : "",
      "Notities": student.notes || ""
    }));
    
    // Maak een werkblad en workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Studenten");
    
    // Download bestand
    XLSX.writeFile(workbook, "Studenten_Export.xlsx");
    
    toast({
      title: "Export voltooid",
      description: "De studenten zijn succesvol geëxporteerd naar Excel.",
    });
  };
  
  // Handler voor bulk verwijderen
  const handleBulkDelete = () => {
    if (selectedStudents.length === 0) return;
    
    if (window.confirm(`Weet je zeker dat je ${selectedStudents.length} geselecteerde student(en) wilt verwijderen?`)) {
      Promise.all(selectedStudents.map(id => apiRequest(`/api/students/${id}`, 'DELETE')))
        .then(() => {
          toast({
            title: "Studenten verwijderd",
            description: `${selectedStudents.length} student(en) succesvol verwijderd.`,
          });
          setSelectedStudents([]);
          queryClient.invalidateQueries({queryKey: ['/api/students']});
        })
        .catch(error => {
          console.error("Error bulk deleting students:", error);
          toast({
            title: "Fout bij verwijderen",
            description: "Er is een fout opgetreden bij het verwijderen van de geselecteerde studenten.",
            variant: "destructive",
          });
        });
    }
  };
  
  // Selecteer/deselecteer alle studenten
  const handleSelectAll = (checked: boolean) => {
    if (checked && studentsData.students) {
      setSelectedStudents(studentsData.students.map((student: any) => student.id.toString()));
    } else {
      setSelectedStudents([]);
    }
  };
  
  // Selecteer/deselecteer een enkele student
  const handleSelectStudent = (studentId: string) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId) 
        : [...prev, studentId]
    );
  };
  
  // Controleer of alle studenten geselecteerd zijn
  const areAllStudentsSelected = () => {
    return studentsData.students && 
           studentsData.students.length > 0 && 
           selectedStudents.length === studentsData.students.length;
  };
  
  // Zoeken, filteren en paginering
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset paginering bij zoeken
  };
  
  const handleFilterChange = (filterType: string, value: string) => {
    switch (filterType) {
      case 'program':
        setSelectedProgramFilter(value);
        break;
      case 'yearLevel':
        setSelectedYearLevelFilter(value);
        break;
      case 'status':
        setSelectedStatusFilter(value);
        break;
      case 'studentGroup':
        setSelectedStudentGroupFilter(value);
        break;
    }
    setPage(1); // Reset paginering bij filtering
  };
  
  const resetFilters = () => {
    setSelectedProgramFilter('all');
    setSelectedYearLevelFilter('all');
    setSelectedStatusFilter('all');
    setSelectedStudentGroupFilter('all');
    setSearchTerm('');
    setPage(1);
  };
  
  // CRUD operations handlers
  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setIsStudentDetailDialogOpen(true);
  };
  
  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    
    // Vul het formulier met de geselecteerde student gegevens
    setStudentFormData({
      studentId: student.studentId || '',
      firstName: student.firstName || '',
      lastName: student.lastName || '',
      email: student.email || '',
      phone: student.phone || '',
      dateOfBirth: student.dateOfBirth || null,
      address: student.address || '',
      street: student.street || '',
      houseNumber: student.houseNumber || '',
      postalCode: student.postalCode || '',
      city: student.city || '',
      programId: student.programId || null,
      yearLevel: student.yearLevel || '',
      schoolYear: student.schoolYear || '',
      studentGroupId: student.studentGroupId || null,
      enrollmentDate: student.enrollmentDate || getCurrentDate(),
      status: student.status || 'active',
      notes: student.notes || '',
      gender: student.gender || '',
    });
    
    // Als er meerdere programma's zijn, vul deze ook in
    if (student.programs && student.programs.length > 0) {
      setSelectedPrograms(student.programs.map((p: any) => ({
        programId: p.programId,
        yearLevel: p.yearLevel || '',
      })));
    } else if (student.programId) {
      setSelectedPrograms([{
        programId: student.programId,
        yearLevel: student.yearLevel || '',
      }]);
    } else {
      setSelectedPrograms([]);
    }
    
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteStudent = (student: any) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };
  
  const confirmDeleteStudent = () => {
    if (selectedStudent?.id) {
      deleteStudentMutation.mutate(selectedStudent.id);
    }
  };
  
  // Formulier verwerking
  const handleAddStudent = () => {
    // Valideer basis velden
    if (!studentFormData.firstName || !studentFormData.lastName) {
      toast({
        title: "Velden ontbreken",
        description: "Voornaam en achternaam zijn verplicht.",
        variant: "destructive",
      });
      return;
    }
    
    // Bereid data voor
    const baseData = {
      ...studentFormData
    };
    
    // Als een guardian gevonden is, koppel deze
    if (foundGuardian) {
      // In dit geval geven we de guardian data door en laten we de API de koppeling maken
      console.log("Creating student with guardian:", foundGuardian);
      
      // Creëer student met voogd
      const dataToSubmit = {
        ...baseData,
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
      
      // Reset de dialoog
      setShowGuardianConfirmDialog(false);
      setFoundGuardian(null);
    } else {
      // Geen voogd geselecteerd, vraag om het toevoegen van een voogd
      setShowGuardianFormDialog(true);
    }
  };
  
  const handleUpdateStudent = () => {
    if (!selectedStudent?.id) return;
    
    // Valideer basis velden
    if (!studentFormData.firstName || !studentFormData.lastName) {
      toast({
        title: "Velden ontbreken",
        description: "Voornaam en achternaam zijn verplicht.",
        variant: "destructive",
      });
      return;
    }
    
    // Bereid data voor
    const dataToSubmit = {
      ...studentFormData,
      id: selectedStudent.id,
      programs: selectedPrograms.length > 0 ? selectedPrograms : 
        (studentFormData.programId ? [{ 
          programId: studentFormData.programId, 
          yearLevel: studentFormData.yearLevel 
        }] : [])
    };
    
    // Update de student
    updateStudentMutation.mutate(dataToSubmit);
  };
  
  // Voogd toevoegen
  const handleAddGuardian = () => {
    // Valideer basis velden
    if (!guardianFormData.firstName || !guardianFormData.lastName || !guardianFormData.email) {
      toast({
        title: "Velden ontbreken",
        description: "Voornaam, achternaam en email zijn verplicht voor een voogd.",
        variant: "destructive",
      });
      return;
    }
    
    // Check eerst of deze voogd al bestaat op basis van email
    apiRequest('/api/guardians/check-exists', {
      method: 'POST',
      body: { email: guardianFormData.email }
    })
    .then(response => {
      if (response.exists) {
        // Voogd bestaat al, stel voor om deze te koppelen
        setFoundGuardian({
          ...response.guardian,
          relationship: guardianFormData.relationship
        });
        setShowGuardianConfirmDialog(true);
        setShowGuardianFormDialog(false);
      } else {
        // Voogd bestaat niet, maak een nieuwe aan
        apiRequest('/api/guardians', {
          method: 'POST',
          body: guardianFormData
        })
        .then(newGuardian => {
          toast({
            title: "Voogd toegevoegd",
            description: "De voogd is succesvol aangemaakt.",
          });
          
          setFoundGuardian({
            ...newGuardian,
            relationship: guardianFormData.relationship
          });
          
          setShowGuardianFormDialog(false);
          setShowGuardianConfirmDialog(true);
        })
        .catch(error => {
          console.error("Error creating guardian:", error);
          toast({
            title: "Fout bij aanmaken voogd",
            description: error?.message || "Er is een fout opgetreden bij het aanmaken van de voogd.",
            variant: "destructive",
          });
        });
      }
    })
    .catch(error => {
      console.error("Error checking guardian existence:", error);
      toast({
        title: "Fout bij controleren voogd",
        description: "Er is een fout opgetreden bij het controleren of de voogd al bestaat.",
        variant: "destructive",
      });
    });
  };
  
  // Programma selectie
  const handleAddProgram = () => {
    if (!studentFormData.programId) return;
    
    // Voeg toe aan geselecteerde programma's
    setSelectedPrograms(prev => {
      // Check of dit programma al geselecteerd is
      const exists = prev.some(p => p.programId === studentFormData.programId);
      if (exists) return prev;
      
      return [
        ...prev,
        {
          programId: studentFormData.programId,
          yearLevel: studentFormData.yearLevel || ''
        }
      ];
    });
    
    // Reset programId en yearLevel in het formulier
    setStudentFormData(prev => ({
      ...prev,
      programId: null,
      yearLevel: ''
    }));
  };
  
  const handleRemoveProgram = (programId: number) => {
    setSelectedPrograms(prev => prev.filter(p => p.programId !== programId));
  };
  
  // Render helpers
  const renderStatus = (status: string) => {
    switch (status) {
      case 'active':
      case 'enrolled':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-transparent">Ingeschreven</Badge>;
      case 'inactive':
      case 'unenrolled':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-transparent">Uitgeschreven</Badge>;
      case 'suspended':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200 border-transparent">Geschorst</Badge>;
      case 'graduated':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-transparent">Afgestudeerd</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent">{status}</Badge>;
    }
  };
  
  const renderGender = (gender: string) => {
    switch (gender) {
      case 'man':
        return 'Man';
      case 'vrouw':
        return 'Vrouw';
      case 'ander':
        return 'Ander';
      default:
        return gender || '-';
    }
  };
  
  // Bereken paginering gegevens
  const itemsPerPage = 10;
  const totalItems = studentsData?.totalCount || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(startItem + itemsPerPage - 1, totalItems);
  
  // Laad en fout states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Page header - Professionele desktop stijl */}
        <header className="bg-white border-b border-[#e5e7eb] shadow-sm">
          <div className="flex flex-col">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <h1 className="text-base font-medium text-gray-800 tracking-tight">Studenten</h1>
              </div>
              <div className="flex items-center">
                <div className="text-xs text-gray-500 font-medium">
                  {new Date().toLocaleDateString('nl-NL', {day: 'numeric', month: 'long', year: 'numeric'})}
                </div>
              </div>
            </div>
            <div className="px-6 py-2 bg-[#f9fafc] border-t border-[#e5e7eb] flex items-center">
              <div className="text-xs text-gray-500">Beheer &gt; Studenten</div>
            </div>
          </div>
        </header>

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
        {/* Page header - Professionele desktop stijl */}
        <header className="bg-white border-b border-[#e5e7eb] shadow-sm">
          <div className="flex flex-col">
            <div className="px-6 py-4 flex justify-between items-center">
              <div>
                <h1 className="text-base font-medium text-gray-800 tracking-tight">Studenten</h1>
              </div>
              <div className="flex items-center">
                <div className="text-xs text-gray-500 font-medium">
                  {new Date().toLocaleDateString('nl-NL', {day: 'numeric', month: 'long', year: 'numeric'})}
                </div>
              </div>
            </div>
            <div className="px-6 py-2 bg-[#f9fafc] border-t border-[#e5e7eb] flex items-center">
              <div className="text-xs text-gray-500">Beheer &gt; Studenten</div>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <div className="px-6 py-6 flex-1">
          <div className="text-center py-12 bg-white border border-[#e5e7eb] rounded-sm">
            <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">Fout bij laden</h3>
            <p className="mt-2 text-gray-500 max-w-md mx-auto">
              Er is een fout opgetreden bij het laden van de studenten. Probeer het later opnieuw.
            </p>
            <Button 
              onClick={() => queryClient.invalidateQueries({queryKey: ['/api/students']})}
              className="mt-4 bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              Opnieuw laden
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  // Main render
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Page header - Professionele desktop stijl */}
      <header className="bg-white border-b border-[#e5e7eb] shadow-sm">
        <div className="flex flex-col">
          <div className="px-6 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-base font-medium text-gray-800 tracking-tight">Studenten</h1>
            </div>
            <div className="flex items-center">
              <div className="text-xs text-gray-500 font-medium">
                {new Date().toLocaleDateString('nl-NL', {day: 'numeric', month: 'long', year: 'numeric'})}
              </div>
            </div>
          </div>
          <div className="px-6 py-2 bg-[#f9fafc] border-t border-[#e5e7eb] flex items-center">
            <div className="text-xs text-gray-500">Beheer &gt; Studenten</div>
          </div>
        </div>
      </header>

      {/* Main content area */}
      <div className="px-6 py-6 flex-1">
        {/* Zoek- en actiebalk - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4">
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Zoekbalk */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Zoek op naam of student ID..."
                className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </div>
            
            {/* Filters en knoppen */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedStudents.length > 0 ? (
                <>
                  <span className="text-xs text-gray-500">{selectedStudents.length} geselecteerd</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedStudents([])}
                    className="h-7 text-xs rounded-sm"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Wissen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleBulkDelete}
                    className="h-7 text-xs rounded-sm border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Verwijderen
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsImportDialogOpen(true)}
                    className="h-7 text-xs rounded-sm border-[#e5e7eb]"
                  >
                    <Upload className="h-3.5 w-3.5 mr-1" />
                    Importeren
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportExcel}
                    className="h-7 text-xs rounded-sm border-[#e5e7eb]"
                  >
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Exporteren
                  </Button>
                  <Button
                    onClick={() => {
                      setStudentFormData({
                        studentId: nextStudentIdData?.nextStudentId || '',
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
                        enrollmentDate: getCurrentDate(),
                        status: 'active',
                        notes: '',
                        gender: '',
                      });
                      setIsCreateDialogOpen(true);
                    }}
                    size="sm"
                    className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    Nieuwe Student
                  </Button>
                </>
              )}
            </div>
          </div>
          
          {/* Filter opties */}
          <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-wrap gap-3 items-center">
            <div className="flex items-center">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowFilterOptions(!showFilterOptions)}
                className="h-7 text-xs"
              >
                <Filter className="h-3.5 w-3.5 mr-1" />
                Filters
                {showFilterOptions ? 
                  <ChevronUp className="h-3.5 w-3.5 ml-1" /> : 
                  <ChevronDown className="h-3.5 w-3.5 ml-1" />
                }
              </Button>
              
              {(selectedProgramFilter !== 'all' || 
                selectedYearLevelFilter !== 'all' || 
                selectedStatusFilter !== 'all' || 
                selectedStudentGroupFilter !== 'all') && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={resetFilters}
                  className="h-7 text-xs text-blue-600"
                >
                  Wissen
                </Button>
              )}
            </div>
            
            {showFilterOptions && (
              <div className="w-full flex flex-wrap gap-3 mt-2">
                <Select 
                  value={selectedProgramFilter} 
                  onValueChange={(value) => handleFilterChange('program', value)}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Programma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle programma's</SelectItem>
                    {programsData?.map((program: any) => (
                      <SelectItem key={program.id} value={program.id.toString()}>
                        {program.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select 
                  value={selectedYearLevelFilter} 
                  onValueChange={(value) => handleFilterChange('yearLevel', value)}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Niveau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle niveaus</SelectItem>
                    <SelectItem value="1">Niveau 1</SelectItem>
                    <SelectItem value="2">Niveau 2</SelectItem>
                    <SelectItem value="3">Niveau 3</SelectItem>
                    <SelectItem value="4">Niveau 4</SelectItem>
                    <SelectItem value="5">Niveau 5</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={selectedStatusFilter} 
                  onValueChange={(value) => handleFilterChange('status', value)}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle statussen</SelectItem>
                    <SelectItem value="active">Actief</SelectItem>
                    <SelectItem value="inactive">Inactief</SelectItem>
                    <SelectItem value="suspended">Geschorst</SelectItem>
                    <SelectItem value="graduated">Afgestudeerd</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select 
                  value={selectedStudentGroupFilter} 
                  onValueChange={(value) => handleFilterChange('studentGroup', value)}
                >
                  <SelectTrigger className="w-40 h-7 text-xs rounded-sm">
                    <SelectValue placeholder="Klas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle klassen</SelectItem>
                    {studentGroupsData?.map((group: any) => (
                      <SelectItem key={group.id} value={group.id.toString()}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        
        {/* Studenten tabel */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm overflow-hidden">
          {!studentsData.students || studentsData.students.length === 0 ? (
            <div className="py-12 text-center">
              <UserCircle className="mx-auto h-12 w-12 text-gray-300" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Geen studenten gevonden</h3>
              <p className="mt-1 text-sm text-gray-500">
                Er zijn geen studenten gevonden die voldoen aan de zoekcriteria.
              </p>
              <div className="mt-6">
                <Button
                  onClick={() => {
                    setStudentFormData({
                      studentId: nextStudentIdData?.nextStudentId || '',
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
                      enrollmentDate: getCurrentDate(),
                      status: 'active',
                      notes: '',
                      gender: '',
                    });
                    setIsCreateDialogOpen(true);
                  }}
                  className="bg-[#1e40af] hover:bg-[#1e3a8a]"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Nieuwe Student Toevoegen
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f9fafc] border-b border-[#e5e7eb]">
                      <th className="px-4 py-2 text-left">
                        <Checkbox 
                          checked={areAllStudentsSelected()}
                          onCheckedChange={handleSelectAll}
                          className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
                        />
                      </th>
                      <th className="px-4 py-2 text-left">
                        <span className="text-xs font-medium text-gray-700">ID</span>
                      </th>
                      <th className="px-4 py-2 text-left">
                        <span className="text-xs font-medium text-gray-700">Naam</span>
                      </th>
                      <th className="px-4 py-2 text-left">
                        <span className="text-xs font-medium text-gray-700">Email</span>
                      </th>
                      <th className="px-4 py-2 text-left">
                        <span className="text-xs font-medium text-gray-700">Telefoon</span>
                      </th>
                      <th className="px-4 py-2 text-left">
                        <span className="text-xs font-medium text-gray-700">Programma</span>
                      </th>
                      <th className="px-4 py-2 text-left">
                        <span className="text-xs font-medium text-gray-700">Status</span>
                      </th>
                      <th className="px-4 py-2 text-left">
                        <span className="text-xs font-medium text-gray-700">Acties</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsData.students.map((student: any) => (
                      <tr key={student.id} className="border-b border-[#e5e7eb] hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <Checkbox 
                            checked={selectedStudents.includes(student.id.toString())}
                            onCheckedChange={() => handleSelectStudent(student.id.toString())}
                            className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-900">{student.studentId}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Avatar className="h-7 w-7 mr-3">
                              <AvatarFallback className="text-xs bg-[#e5e7eb] text-gray-600">
                                {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                              <p className="text-xs text-gray-500">{renderGender(student.gender)}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{student.email || '-'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{student.phone || '-'}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{student.programName || '-'}</td>
                        <td className="px-4 py-3">{renderStatus(student.status)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
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
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStudent(student)}
                              className="h-7 w-7 p-0 text-gray-500"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginering */}
              <div className="px-4 py-3 border-t border-[#e5e7eb] flex flex-col sm:flex-row justify-between items-center text-xs text-gray-500">
                <div>
                  Resultaten {startItem}-{endItem} van {totalItems}
                </div>
                <div className="flex items-center space-x-2 mt-2 sm:mt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-sm"
                    disabled={page <= 1}
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  >
                    Vorige
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    Volgende
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Dialogen - view, create, edit, delete */}
      
      {/* Student Details Dialog */}
      <Dialog open={isStudentDetailDialogOpen} onOpenChange={setIsStudentDetailDialogOpen}>
        <DialogContent className="sm:max-w-[85vw] p-0">
          {/* Dialog Header */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <UserRound className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-medium">
                    {selectedStudent?.firstName} {selectedStudent?.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-blue-100">
                      Studentgegevens bekijken
                    </span>
                    <Badge className="bg-white/20 text-white border-transparent hover:bg-white/30">
                      {selectedStudent?.status === 'active' ? 'Actief' : selectedStudent?.status}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                className="text-white hover:bg-blue-700 hover:text-white"
                onClick={() => setIsStudentDetailDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Sluiten
              </Button>
            </div>
          </div>
          
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Basisinformatie</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Student ID</p>
                      <p className="font-medium">{selectedStudent?.studentId || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p>{renderStatus(selectedStudent?.status || 'active')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Voornaam</p>
                      <p className="font-medium">{selectedStudent?.firstName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Achternaam</p>
                      <p className="font-medium">{selectedStudent?.lastName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Geslacht</p>
                      <p className="font-medium">{renderGender(selectedStudent?.gender)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Geboortedatum</p>
                      <p className="font-medium">{selectedStudent?.dateOfBirth ? formatDateToDisplayFormat(selectedStudent.dateOfBirth) : "-"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Contactgegevens</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">E-mail</p>
                      <p className="font-medium">{selectedStudent?.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Telefoonnummer</p>
                      <p className="font-medium">{selectedStudent?.phone || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Adres</p>
                      <p className="font-medium">
                        {selectedStudent?.street && selectedStudent?.houseNumber
                          ? `${selectedStudent.street} ${selectedStudent.houseNumber}`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Postcode en plaats</p>
                      <p className="font-medium">
                        {selectedStudent?.postalCode && selectedStudent?.city
                          ? `${selectedStudent.postalCode} ${selectedStudent.city}`
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Opleidingsgegevens</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Programma</p>
                      <p className="font-medium">{selectedStudent?.programName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Niveau</p>
                      <p className="font-medium">{selectedStudent?.yearLevel || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Klassen</p>
                      <p className="font-medium">{selectedStudent?.studentGroups?.map((g: any) => g.name).join(', ') || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Inschrijfdatum</p>
                      <p className="font-medium">{selectedStudent?.enrollmentDate ? formatDateToDisplayFormat(selectedStudent.enrollmentDate) : "-"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Notities</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {selectedStudent?.notes || "Geen notities beschikbaar"}
                  </p>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsStudentDetailDialogOpen(false);
                      handleEditStudent(selectedStudent);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Bewerken
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      setIsStudentDetailDialogOpen(false);
                      setIsDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Verwijderen
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Student verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze student wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="flex items-center space-x-4 py-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#e5e7eb] text-gray-600">
                  {selectedStudent.firstName.charAt(0)}{selectedStudent.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                <p className="text-sm text-gray-500">{selectedStudent.studentId}</p>
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
              onClick={confirmDeleteStudent}
              className="h-8 text-xs rounded-sm"
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Student Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Nieuwe Student Toevoegen</DialogTitle>
            <DialogDescription>
              Vul de gegevens in om een nieuwe student toe te voegen.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                placeholder="Student ID"
                value={studentFormData.studentId}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, studentId: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={studentFormData.status}
                onValueChange={(value) => setStudentFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status" className="h-8 text-sm">
                  <SelectValue placeholder="Status selecteren" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firstName">Voornaam</Label>
              <Input
                id="firstName"
                placeholder="Voornaam"
                value={studentFormData.firstName}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Achternaam</Label>
              <Input
                id="lastName"
                placeholder="Achternaam"
                value={studentFormData.lastName}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Geslacht</Label>
              <Select
                value={studentFormData.gender}
                onValueChange={(value) => setStudentFormData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger id="gender" className="h-8 text-sm">
                  <SelectValue placeholder="Geslacht selecteren" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Geboortedatum</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={studentFormData.dateOfBirth || ''}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="E-mail"
                value={studentFormData.email}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, email: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoonnummer</Label>
              <Input
                id="phone"
                placeholder="Telefoonnummer"
                value={studentFormData.phone}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="street">Straat</Label>
              <Input
                id="street"
                placeholder="Straat"
                value={studentFormData.street}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, street: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="houseNumber">Huisnummer</Label>
              <Input
                id="houseNumber"
                placeholder="Huisnummer"
                value={studentFormData.houseNumber}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, houseNumber: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="postalCode">Postcode</Label>
              <Input
                id="postalCode"
                placeholder="Postcode"
                value={studentFormData.postalCode}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="city">Plaats</Label>
              <Input
                id="city"
                placeholder="Plaats"
                value={studentFormData.city}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, city: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="col-span-2 border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Programma's</h3>
                <div className="flex items-center gap-2">
                  <Select
                    value={studentFormData.programId?.toString() || ''}
                    onValueChange={(value) => setStudentFormData(prev => ({ 
                      ...prev, 
                      programId: value ? parseInt(value) : null 
                    }))}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue placeholder="Programma" />
                    </SelectTrigger>
                    <SelectContent>
                      {programsData?.map((program: any) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={studentFormData.yearLevel}
                    onValueChange={(value) => setStudentFormData(prev => ({ 
                      ...prev, 
                      yearLevel: value 
                    }))}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue placeholder="Niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Niveau 1</SelectItem>
                      <SelectItem value="2">Niveau 2</SelectItem>
                      <SelectItem value="3">Niveau 3</SelectItem>
                      <SelectItem value="4">Niveau 4</SelectItem>
                      <SelectItem value="5">Niveau 5</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddProgram}
                    disabled={!studentFormData.programId}
                    className="h-8 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Toevoegen
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-sm p-2 min-h-[60px]">
                {selectedPrograms.length === 0 ? (
                  <p className="text-sm text-gray-500 p-2">Geen programma's geselecteerd</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedPrograms.map((program, index) => {
                      const programName = programsData?.find((p: any) => p.id === program.programId)?.name || program.programId;
                      return (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {programName} {program.yearLevel && `(Niveau ${program.yearLevel})`}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveProgram(program.programId)} 
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notities</Label>
              <Textarea
                id="notes"
                placeholder="Notities over de student"
                value={studentFormData.notes}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="h-24 text-sm"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateDialogOpen(false)}
              className="h-8 text-xs rounded-sm"
            >
              Annuleren
            </Button>
            <Button 
              onClick={handleAddStudent}
              className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              Volgende: Voogd toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Guardian Form Dialog */}
      <Dialog open={showGuardianFormDialog} onOpenChange={setShowGuardianFormDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Voogd Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een voogd toe voor deze student. Als de voogd al bestaat in het systeem, zal deze automatisch worden gevonden.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="guardianFirstName">Voornaam</Label>
              <Input
                id="guardianFirstName"
                placeholder="Voornaam"
                value={guardianFormData.firstName}
                onChange={(e) => setGuardianFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guardianLastName">Achternaam</Label>
              <Input
                id="guardianLastName"
                placeholder="Achternaam"
                value={guardianFormData.lastName}
                onChange={(e) => setGuardianFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guardianEmail">E-mail</Label>
              <Input
                id="guardianEmail"
                type="email"
                placeholder="E-mail"
                value={guardianFormData.email}
                onChange={(e) => setGuardianFormData(prev => ({ ...prev, email: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="guardianPhone">Telefoonnummer</Label>
              <Input
                id="guardianPhone"
                placeholder="Telefoonnummer"
                value={guardianFormData.phone}
                onChange={(e) => setGuardianFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="relationship">Relatie tot student</Label>
              <Select
                value={guardianFormData.relationship}
                onValueChange={(value) => setGuardianFormData(prev => ({ ...prev, relationship: value }))}
              >
                <SelectTrigger id="relationship" className="h-8 text-sm">
                  <SelectValue placeholder="Relatie selecteren" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ouder">Ouder</SelectItem>
                  <SelectItem value="grootouder">Grootouder</SelectItem>
                  <SelectItem value="voogd">Voogd</SelectItem>
                  <SelectItem value="ander">Ander</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center h-8 mt-5">
                <Checkbox
                  id="isEmergencyContact"
                  checked={guardianFormData.isEmergencyContact}
                  onCheckedChange={(checked) => 
                    setGuardianFormData(prev => ({ 
                      ...prev, 
                      isEmergencyContact: checked === true 
                    }))
                  }
                  className="mr-2"
                />
                <Label htmlFor="isEmergencyContact" className="text-sm">Noodcontact</Label>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowGuardianFormDialog(false);
                
                // Ga direct door met toevoegen student zonder voogd
                const dataToSubmit = {
                  ...studentFormData,
                  programs: selectedPrograms.length > 0 ? selectedPrograms : 
                    (studentFormData.programId ? [{ 
                      programId: studentFormData.programId, 
                      yearLevel: studentFormData.yearLevel 
                    }] : [])
                };
                
                createStudentMutation.mutate(dataToSubmit);
              }}
              className="h-8 text-xs rounded-sm"
            >
              Overslaan
            </Button>
            <Button 
              onClick={handleAddGuardian}
              className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              Voogd Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Guardian Confirm Dialog */}
      <Dialog open={showGuardianConfirmDialog} onOpenChange={setShowGuardianConfirmDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Voogd Bevestigen</DialogTitle>
            <DialogDescription>
              {foundGuardian?.id 
                ? "Een bestaande voogd is gevonden met dit e-mailadres. Wil je deze koppelen aan de student?" 
                : "Bevestig de gegevens van de nieuwe voogd."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-[#e5e7eb] text-gray-600">
                  {foundGuardian?.firstName?.charAt(0)}{foundGuardian?.lastName?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{foundGuardian?.firstName} {foundGuardian?.lastName}</p>
                <p className="text-sm text-gray-500">{foundGuardian?.email}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Telefoonnummer</p>
                <p className="text-sm">{foundGuardian?.phone || "Niet opgegeven"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Relatie</p>
                <p className="text-sm">{foundGuardian?.relationship || "Ouder"}</p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setShowGuardianConfirmDialog(false);
                setFoundGuardian(null);
                setShowGuardianFormDialog(true);
              }}
              className="h-8 text-xs rounded-sm"
            >
              Terug
            </Button>
            <Button 
              onClick={() => {
                // Bereid data voor
                const restData = {
                  ...studentFormData
                };
                
                // Creëer student met voogd
                const dataToSubmit = {
                  ...restData,
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
              }}
              className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              <Check className="h-4 w-4 mr-2" />
              Bevestigen en opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Student Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Student Bewerken</DialogTitle>
            <DialogDescription>
              Bewerk de gegevens van de geselecteerde student.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="studentId">Student ID</Label>
              <Input
                id="studentId"
                placeholder="Student ID"
                value={studentFormData.studentId}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, studentId: e.target.value }))}
                className="h-8 text-sm"
                disabled={true} // Student ID kan niet worden gewijzigd
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={studentFormData.status}
                onValueChange={(value) => setStudentFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger id="status" className="h-8 text-sm">
                  <SelectValue placeholder="Status selecteren" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Rest van de velden, zelfde als in Create Dialog */}
            <div className="space-y-2">
              <Label htmlFor="firstName">Voornaam</Label>
              <Input
                id="firstName"
                placeholder="Voornaam"
                value={studentFormData.firstName}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, firstName: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName">Achternaam</Label>
              <Input
                id="lastName"
                placeholder="Achternaam"
                value={studentFormData.lastName}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, lastName: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gender">Geslacht</Label>
              <Select
                value={studentFormData.gender}
                onValueChange={(value) => setStudentFormData(prev => ({ ...prev, gender: value }))}
              >
                <SelectTrigger id="gender" className="h-8 text-sm">
                  <SelectValue placeholder="Geslacht selecteren" />
                </SelectTrigger>
                <SelectContent>
                  {genderOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="dateOfBirth">Geboortedatum</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={studentFormData.dateOfBirth || ''}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                placeholder="E-mail"
                value={studentFormData.email}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, email: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefoonnummer</Label>
              <Input
                id="phone"
                placeholder="Telefoonnummer"
                value={studentFormData.phone}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, phone: e.target.value }))}
                className="h-8 text-sm"
              />
            </div>
            
            <div className="col-span-2 border-t pt-4 mt-2">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium">Programma's</h3>
                <div className="flex items-center gap-2">
                  <Select
                    value={studentFormData.programId?.toString() || ''}
                    onValueChange={(value) => setStudentFormData(prev => ({ 
                      ...prev, 
                      programId: value ? parseInt(value) : null 
                    }))}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue placeholder="Programma" />
                    </SelectTrigger>
                    <SelectContent>
                      {programsData?.map((program: any) => (
                        <SelectItem key={program.id} value={program.id.toString()}>
                          {program.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={studentFormData.yearLevel}
                    onValueChange={(value) => setStudentFormData(prev => ({ 
                      ...prev, 
                      yearLevel: value 
                    }))}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue placeholder="Niveau" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Niveau 1</SelectItem>
                      <SelectItem value="2">Niveau 2</SelectItem>
                      <SelectItem value="3">Niveau 3</SelectItem>
                      <SelectItem value="4">Niveau 4</SelectItem>
                      <SelectItem value="5">Niveau 5</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleAddProgram}
                    disabled={!studentFormData.programId}
                    className="h-8 text-xs"
                  >
                    <Plus className="h-3.5 w-3.5 mr-1" />
                    Toevoegen
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-sm p-2 min-h-[60px]">
                {selectedPrograms.length === 0 ? (
                  <p className="text-sm text-gray-500 p-2">Geen programma's geselecteerd</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {selectedPrograms.map((program, index) => {
                      const programName = programsData?.find((p: any) => p.id === program.programId)?.name || program.programId;
                      return (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                          {programName} {program.yearLevel && `(Niveau ${program.yearLevel})`}
                          <X 
                            className="h-3 w-3 cursor-pointer" 
                            onClick={() => handleRemoveProgram(program.programId)} 
                          />
                        </Badge>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            
            <div className="col-span-2 space-y-2">
              <Label htmlFor="notes">Notities</Label>
              <Textarea
                id="notes"
                placeholder="Notities over de student"
                value={studentFormData.notes}
                onChange={(e) => setStudentFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="h-24 text-sm"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
              className="h-8 text-xs rounded-sm"
            >
              Annuleren
            </Button>
            <Button 
              onClick={handleUpdateStudent}
              className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              Wijzigingen Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Studenten Importeren</DialogTitle>
            <DialogDescription>
              Importeer studenten vanuit een CSV- of Excel-bestand.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-6">
            <div className="space-y-2">
              <Label>Bestandstype</Label>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="typeExcel"
                    name="importType"
                    value="excel"
                    checked={importType === 'excel'}
                    onChange={() => setImportType('excel')}
                    className="mr-2"
                  />
                  <Label htmlFor="typeExcel" className="text-sm">Excel (.xlsx, .xls)</Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="typeCsv"
                    name="importType"
                    value="csv"
                    checked={importType === 'csv'}
                    onChange={() => setImportType('csv')}
                    className="mr-2"
                  />
                  <Label htmlFor="typeCsv" className="text-sm">CSV (.csv)</Label>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Bestand uploaden</Label>
              <div className="border border-dashed border-gray-300 rounded-sm p-6 text-center cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 mb-1">Klik om een bestand te kiezen of sleep het hier naartoe</p>
                <p className="text-xs text-gray-500">{importType === 'excel' ? 'Excel (.xlsx, .xls)' : 'CSV (.csv)'} bestanden</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept={importType === 'excel' ? '.xlsx,.xls' : '.csv'}
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
              {importFile && (
                <p className="text-sm text-green-600 mt-2">
                  Geselecteerd bestand: {importFile.name}
                </p>
              )}
            </div>
            
            {importPreview.length > 0 && (
              <>
                <div className="space-y-2">
                  <Label>Voorbeeld van geïmporteerde gegevens</Label>
                  <div className="border rounded-sm overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          {importColumns.map((header, i) => (
                            <th key={i} className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {importPreview.map((row, i) => (
                          <tr key={i}>
                            {importColumns.map((header, j) => (
                              <td key={j} className="px-3 py-2 whitespace-nowrap text-xs text-gray-500">
                                {row[header] !== undefined ? String(row[header]) : '-'}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Kolomtoewijzing</Label>
                  <p className="text-xs text-gray-500 mb-2">
                    Wijs kolommen uit uw bestand toe aan de juiste velden in het systeem.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="map-studentId" className="text-xs">Student ID</Label>
                      <Select
                        value={columnMappings.studentId || ''}
                        onValueChange={(value) => handleColumnMappingChange('studentId', value)}
                      >
                        <SelectTrigger id="map-studentId" className="h-8 text-xs">
                          <SelectValue placeholder="Selecteer kolom" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Niet toewijzen</SelectItem>
                          {importColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="map-firstName" className="text-xs">Voornaam *</Label>
                      <Select
                        value={columnMappings.firstName || ''}
                        onValueChange={(value) => handleColumnMappingChange('firstName', value)}
                      >
                        <SelectTrigger id="map-firstName" className="h-8 text-xs">
                          <SelectValue placeholder="Selecteer kolom" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Niet toewijzen</SelectItem>
                          {importColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="map-lastName" className="text-xs">Achternaam *</Label>
                      <Select
                        value={columnMappings.lastName || ''}
                        onValueChange={(value) => handleColumnMappingChange('lastName', value)}
                      >
                        <SelectTrigger id="map-lastName" className="h-8 text-xs">
                          <SelectValue placeholder="Selecteer kolom" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Niet toewijzen</SelectItem>
                          {importColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="map-email" className="text-xs">E-mail</Label>
                      <Select
                        value={columnMappings.email || ''}
                        onValueChange={(value) => handleColumnMappingChange('email', value)}
                      >
                        <SelectTrigger id="map-email" className="h-8 text-xs">
                          <SelectValue placeholder="Selecteer kolom" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Niet toewijzen</SelectItem>
                          {importColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="map-phone" className="text-xs">Telefoon</Label>
                      <Select
                        value={columnMappings.phone || ''}
                        onValueChange={(value) => handleColumnMappingChange('phone', value)}
                      >
                        <SelectTrigger id="map-phone" className="h-8 text-xs">
                          <SelectValue placeholder="Selecteer kolom" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Niet toewijzen</SelectItem>
                          {importColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="map-dateOfBirth" className="text-xs">Geboortedatum</Label>
                      <Select
                        value={columnMappings.dateOfBirth || ''}
                        onValueChange={(value) => handleColumnMappingChange('dateOfBirth', value)}
                      >
                        <SelectTrigger id="map-dateOfBirth" className="h-8 text-xs">
                          <SelectValue placeholder="Selecteer kolom" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Niet toewijzen</SelectItem>
                          {importColumns.map(col => (
                            <SelectItem key={col} value={col}>{col}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Andere velden kunnen hier worden toegevoegd */}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    * Verplichte velden voor import
                  </p>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsImportDialogOpen(false);
                setImportFile(null);
                setImportPreview([]);
                setImportColumns([]);
                setColumnMappings({});
              }}
              className="h-8 text-xs rounded-sm"
            >
              Annuleren
            </Button>
            <Button 
              onClick={importStudents}
              disabled={!importFile || importPreview.length === 0 || Object.keys(columnMappings).length === 0 || isImporting}
              className="h-8 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              {isImporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                  Bezig met importeren...
                </>
              ) : (
                <>
                  <FileUp className="h-3.5 w-3.5 mr-2" />
                  Importeren
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}