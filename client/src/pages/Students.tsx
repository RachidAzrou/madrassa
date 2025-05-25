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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { nl } from 'date-fns/locale';

export default function Students() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // State variables
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilterOptions, setShowFilterOptions] = useState<boolean>(false);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState<string>('all');
  const [selectedYearLevelFilter, setSelectedYearLevelFilter] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');
  const [selectedStudentGroupFilter, setSelectedStudentGroupFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState<boolean>(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState<boolean>(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState<boolean>(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState<boolean>(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importColumns, setImportColumns] = useState<string[]>([]);
  const [importStep, setImportStep] = useState<number>(1);
  const [isValidatingImport, setIsValidatingImport] = useState<boolean>(false);
  const [importPreviewData, setImportPreviewData] = useState<any[]>([]);
  const [columnMappings, setColumnMappings] = useState<{[key: string]: string}>({});
  const [importValidationErrors, setImportValidationErrors] = useState<string[]>([]);
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
  }>({
    total: 0,
    success: 0,
    failed: 0,
    errors: []
  });
  const [selectedTab, setSelectedTab] = useState<string>('info');
  const [studentFormData, setStudentFormData] = useState<{
    id?: number;
    studentId: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: Date | null;
    address: string;
    street: string;
    houseNumber: string;
    postalCode: string;
    city: string;
    country: string;
    enrolledPrograms: { programId: number; yearLevel: string }[];
    status: string;
    gender: string;
    photo?: string;
    notes?: string;
  }>({
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
  
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false);
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  
  // Queries
  const { data: studentsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['/api/students', {
      page,
      limit: 10,
      search: searchQuery,
      program: selectedProgramFilter,
      yearLevel: selectedYearLevelFilter,
      status: selectedStatusFilter,
      studentGroup: selectedStudentGroupFilter
    }]
  });
  
  const { data: programsData } = useQuery({
    queryKey: ['/api/programs']
  });
  
  const { data: studentGroupsData } = useQuery({
    queryKey: ['/api/student-groups']
  });
  
  const { data: nextStudentIdData } = useQuery({
    queryKey: ['/api/students/next-id']
  });
  
  // Mutations
  const createStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      
      // Add student data
      formData.append('studentData', JSON.stringify({
        studentId: data.studentId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? format(data.dateOfBirth, 'yyyy-MM-dd') : null,
        street: data.street,
        houseNumber: data.houseNumber,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
        status: data.status,
        gender: data.gender,
        notes: data.notes,
        enrolledPrograms: data.enrolledPrograms,
      }));
      
      // Add photo if selected
      if (data.photo) {
        formData.append('photo', data.photo);
      }
      
      return fetch('/api/students', {
        method: 'POST',
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error('Fout bij toevoegen student');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/students']});
      setIsAddDialogOpen(false);
      toast({
        title: "Student toegevoegd",
        description: "De student is succesvol toegevoegd.",
      });
      resetForm();
    },
    onError: (error) => {
      console.error('Error adding student:', error);
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een fout opgetreden bij het toevoegen van de student.",
        variant: "destructive",
      });
    }
  });
  
  const updateStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      const formData = new FormData();
      
      // Add student data
      formData.append('studentData', JSON.stringify({
        id: data.id,
        studentId: data.studentId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        dateOfBirth: data.dateOfBirth ? format(data.dateOfBirth, 'yyyy-MM-dd') : null,
        street: data.street,
        houseNumber: data.houseNumber,
        postalCode: data.postalCode,
        city: data.city,
        country: data.country,
        status: data.status,
        gender: data.gender,
        notes: data.notes,
        enrolledPrograms: data.enrolledPrograms,
      }));
      
      // Add photo if selected
      if (data.photo && data.photo instanceof File) {
        formData.append('photo', data.photo);
      }
      
      return fetch(`/api/students/${data.id}`, {
        method: 'PUT',
        body: formData,
      }).then(res => {
        if (!res.ok) throw new Error('Fout bij bijwerken student');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/students']});
      setIsEditDialogOpen(false);
      toast({
        title: "Student bijgewerkt",
        description: "De student is succesvol bijgewerkt.",
      });
    },
    onError: (error) => {
      console.error('Error updating student:', error);
      toast({
        title: "Fout bij bijwerken",
        description: "Er is een fout opgetreden bij het bijwerken van de student.",
        variant: "destructive",
      });
    }
  });
  
  const deleteStudentMutation = useMutation({
    mutationFn: (id: number) => 
      fetch(`/api/students/${id}`, { method: 'DELETE' })
        .then(res => {
          if (!res.ok) throw new Error('Fout bij verwijderen student');
          return res.json();
        }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/students']});
      setIsDeleteDialogOpen(false);
      setSelectedStudent(null);
      toast({
        title: "Student verwijderd",
        description: "De student is succesvol verwijderd.",
      });
    },
    onError: (error) => {
      console.error('Error deleting student:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de student.",
        variant: "destructive",
      });
    }
  });
  
  const bulkDeleteMutation = useMutation({
    mutationFn: (ids: number[]) => 
      fetch(`/api/students/bulk-delete`, { 
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids }),
      })
        .then(res => {
          if (!res.ok) throw new Error('Fout bij verwijderen studenten');
          return res.json();
        }),
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ['/api/students']});
      setSelectedRows([]);
      setSelectAll(false);
      toast({
        title: "Studenten verwijderd",
        description: `${selectedRows.length} student(en) succesvol verwijderd.`,
      });
    },
    onError: (error) => {
      console.error('Error bulk deleting students:', error);
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een fout opgetreden bij het verwijderen van de studenten.",
        variant: "destructive",
      });
    }
  });
  
  const importStudentsMutation = useMutation({
    mutationFn: (importData: any[]) => 
      fetch('/api/students/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students: importData }),
      })
        .then(res => {
          if (!res.ok) throw new Error('Fout bij importeren studenten');
          return res.json();
        }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({queryKey: ['/api/students']});
      setImportResults({
        total: data.total,
        success: data.success,
        failed: data.failed,
        errors: data.errors || []
      });
      setImportStep(3);
    },
    onError: (error) => {
      console.error('Error importing students:', error);
      toast({
        title: "Fout bij importeren",
        description: "Er is een fout opgetreden bij het importeren van de studenten.",
        variant: "destructive",
      });
    }
  });
  
  // Handle file upload for student import
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImportFile(file);
    
    // Parse file to get columns
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.data.length > 0) {
            setImportColumns(Object.keys(results.data[0]));
            setImportPreviewData(results.data.slice(0, 5));
          }
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        if (!data) return;
        
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        if (json.length > 0) {
          setImportColumns(Object.keys(json[0]));
          setImportPreviewData(json.slice(0, 5));
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };
  
  // Reset column mappings when file changes
  useEffect(() => {
    setColumnMappings({});
  }, [importFile]);
  
  // Handle column mapping change
  const handleColumnMappingChange = (field: string, column: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [field]: column
    }));
  };
  
  // Handle import validation
  const handleValidateImport = () => {
    setIsValidatingImport(true);
    setImportValidationErrors([]);
    
    // Check required fields
    const requiredFields = ['firstName', 'lastName'];
    const missingRequiredFields = requiredFields.filter(field => !columnMappings[field]);
    
    if (missingRequiredFields.length > 0) {
      setImportValidationErrors([`Verplichte velden niet toegewezen: ${missingRequiredFields.join(', ')}`]);
      setIsValidatingImport(false);
      return;
    }
    
    // Parse the entire file to prepare data for import
    const fileExtension = importFile?.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      Papa.parse(importFile!, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          validateAndPrepareImportData(results.data);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        if (!data) return;
        
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        validateAndPrepareImportData(json);
      };
      reader.readAsArrayBuffer(importFile!);
    }
  };
  
  // Validate and prepare import data
  const validateAndPrepareImportData = (data: any[]) => {
    const errors: string[] = [];
    let processedData: any[] = [];
    
    data.forEach((row, index) => {
      // Create a new student object with mapped fields
      const student: any = {
        studentId: nextStudentIdData?.nextStudentId || '', // Will be auto-generated if not provided
        status: 'active',
        gender: 'male',
        country: 'België',
        enrolledPrograms: []
      };
      
      // Map fields based on column mappings
      Object.entries(columnMappings).forEach(([field, column]) => {
        if (column && row[column] !== undefined) {
          student[field] = row[column];
        }
      });
      
      // Validate required fields
      if (!student.firstName || !student.lastName) {
        errors.push(`Rij ${index + 1}: Ontbrekende verplichte velden`);
        return;
      }
      
      processedData.push(student);
    });
    
    setImportValidationErrors(errors);
    
    if (errors.length === 0) {
      // Proceed to next step with the prepared data
      setImportPreviewData(processedData.slice(0, 5));
      setImportStep(2);
    }
    
    setIsValidatingImport(false);
  };
  
  // Handle import submission
  const handleImportSubmit = () => {
    // Parse the entire file to prepare data for import
    const fileExtension = importFile?.name.split('.').pop()?.toLowerCase();
    
    if (fileExtension === 'csv') {
      Papa.parse(importFile!, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          prepareAndSubmitImportData(results.data);
        }
      });
    } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target?.result;
        if (!data) return;
        
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        
        prepareAndSubmitImportData(json);
      };
      reader.readAsArrayBuffer(importFile!);
    }
  };
  
  // Prepare and submit import data
  const prepareAndSubmitImportData = (data: any[]) => {
    const processedData: any[] = [];
    
    data.forEach((row) => {
      // Create a new student object with mapped fields
      const student: any = {
        studentId: row[columnMappings.studentId] || nextStudentIdData?.nextStudentId || '',
        status: 'active',
        gender: 'male',
        country: 'België',
        enrolledPrograms: []
      };
      
      // Map fields based on column mappings
      Object.entries(columnMappings).forEach(([field, column]) => {
        if (column && row[column] !== undefined) {
          if (field === 'dateOfBirth' && row[column]) {
            // Try to parse the date
            try {
              const date = new Date(row[column]);
              student[field] = format(date, 'yyyy-MM-dd');
            } catch (e) {
              student[field] = null;
            }
          } else {
            student[field] = row[column];
          }
        }
      });
      
      // Add program enrollment if specified
      if (columnMappings.programId && row[columnMappings.programId]) {
        const programId = parseInt(row[columnMappings.programId]);
        const yearLevel = columnMappings.yearLevel && row[columnMappings.yearLevel] 
          ? row[columnMappings.yearLevel] 
          : '1';
        
        if (!isNaN(programId)) {
          student.enrolledPrograms = [{
            programId,
            yearLevel
          }];
        }
      }
      
      processedData.push(student);
    });
    
    // Submit the processed data
    importStudentsMutation.mutate(processedData);
  };
  
  // Handle form reset
  const resetForm = () => {
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
      country: 'België',
      enrolledPrograms: [],
      status: 'active',
      gender: 'male',
      notes: ''
    });
    setSelectedPhoto(null);
    setPhotoPreview(null);
  };
  
  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!studentFormData.firstName || !studentFormData.lastName) {
      toast({
        title: "Validatiefout",
        description: "Vul alle verplichte velden in.",
        variant: "destructive",
      });
      return;
    }
    
    // Add photo to form data if selected
    const formDataWithPhoto = {
      ...studentFormData,
      photo: selectedPhoto,
    };
    
    if (isEditDialogOpen && studentFormData.id) {
      updateStudentMutation.mutate(formDataWithPhoto);
    } else {
      createStudentMutation.mutate(formDataWithPhoto);
    }
  };
  
  // Handle photo upload
  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedPhoto(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  // Handle program enrollment addition
  const handleAddProgram = () => {
    if (programsData && programsData.length > 0) {
      setStudentFormData(prev => ({
        ...prev,
        enrolledPrograms: [
          ...prev.enrolledPrograms,
          { programId: programsData[0].id, yearLevel: '1' }
        ]
      }));
    }
  };
  
  // Handle program enrollment removal
  const handleRemoveProgram = (index: number) => {
    setStudentFormData(prev => ({
      ...prev,
      enrolledPrograms: prev.enrolledPrograms.filter((_, i) => i !== index)
    }));
  };
  
  // Handle program enrollment change
  const handleProgramChange = (index: number, programId: string) => {
    setStudentFormData(prev => ({
      ...prev,
      enrolledPrograms: prev.enrolledPrograms.map((program, i) => 
        i === index ? { ...program, programId: parseInt(programId) } : program
      )
    }));
  };
  
  // Handle year level change
  const handleYearLevelChange = (index: number, yearLevel: string) => {
    setStudentFormData(prev => ({
      ...prev,
      enrolledPrograms: prev.enrolledPrograms.map((program, i) => 
        i === index ? { ...program, yearLevel } : program
      )
    }));
  };
  
  // Handle view student
  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setSelectedTab('info');
    setIsViewDialogOpen(true);
  };
  
  // Handle edit student
  const handleEditStudent = (student: any) => {
    const studentToEdit = {
      id: student.id,
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email || '',
      phone: student.phone || '',
      dateOfBirth: student.dateOfBirth ? new Date(student.dateOfBirth) : null,
      address: student.address || '',
      street: student.street || '',
      houseNumber: student.houseNumber || '',
      postalCode: student.postalCode || '',
      city: student.city || '',
      country: student.country || 'België',
      status: student.status || 'active',
      gender: student.gender || 'male',
      notes: student.notes || '',
      enrolledPrograms: student.programs ? student.programs.map((p: any) => ({
        programId: p.programId,
        yearLevel: p.yearLevel
      })) : []
    };
    
    setStudentFormData(studentToEdit);
    
    // Set photo preview if available
    if (student.photo) {
      setPhotoPreview(`/uploads/students/${student.photo}`);
    } else {
      setPhotoPreview(null);
    }
    
    setSelectedPhoto(null);
    setIsEditDialogOpen(true);
  };
  
  // Handle delete student
  const handleDeleteStudent = (student: any) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle delete confirmation
  const handleConfirmDelete = () => {
    if (selectedStudent) {
      deleteStudentMutation.mutate(selectedStudent.id);
    }
  };
  
  // Handle export to Excel
  const handleExportExcel = () => {
    // Fetch all students for export
    fetch('/api/students/export')
      .then(res => res.json())
      .then(data => {
        const worksheet = XLSX.utils.json_to_sheet(data.students);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Studenten");
        XLSX.writeFile(workbook, "studenten_export.xlsx");
      })
      .catch(error => {
        console.error('Error exporting students:', error);
        toast({
          title: "Fout bij exporteren",
          description: "Er is een fout opgetreden bij het exporteren van de studenten.",
          variant: "destructive",
        });
      });
  };
  
  // Handle search input
  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      setPage(1);
    }
  };
  
  // Handle filter change
  const handleFilterChange = (filterType: string, value: string) => {
    setPage(1);
    
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
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedProgramFilter('all');
    setSelectedYearLevelFilter('all');
    setSelectedStatusFilter('all');
    setSelectedStudentGroupFilter('all');
    setPage(1);
  };
  
  // Handle row selection
  const handleRowSelect = (id: number) => {
    setSelectedRows(prev => 
      prev.includes(id) 
        ? prev.filter(rowId => rowId !== id)
        : [...prev, id]
    );
  };
  
  // Handle select all
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedRows([]);
    } else {
      setSelectedRows(studentsData?.students.map((student: any) => student.id) || []);
    }
    setSelectAll(!selectAll);
  };
  
  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedRows.length > 0) {
      bulkDeleteMutation.mutate(selectedRows);
    }
  };
  
  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };
  
  // Handle import dialog close
  const handleCloseImportDialog = () => {
    setIsImportDialogOpen(false);
    setImportFile(null);
    setImportColumns([]);
    setImportPreviewData([]);
    setColumnMappings({});
    setImportStep(1);
    setImportValidationErrors([]);
    setImportResults({
      total: 0,
      success: 0,
      failed: 0,
      errors: []
    });
  };
  
  // Format student ID
  const formatStudentId = (id: string) => {
    return id.padStart(3, '0');
  };
  
  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'graduated':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'suspended':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'expelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  // Get status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'active':
        return 'Actief';
      case 'inactive':
        return 'Inactief';
      case 'graduated':
        return 'Afgestudeerd';
      case 'suspended':
        return 'Geschorst';
      case 'expelled':
        return 'Verwijderd';
      default:
        return 'Onbekend';
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckSquare className="h-3 w-3 mr-1" />;
      case 'inactive':
        return <SquareSlash className="h-3 w-3 mr-1" />;
      case 'graduated':
        return <GraduationCap className="h-3 w-3 mr-1" />;
      case 'suspended':
        return <AlertCircle className="h-3 w-3 mr-1" />;
      case 'expelled':
        return <X className="h-3 w-3 mr-1" />;
      default:
        return <SquareSlash className="h-3 w-3 mr-1" />;
    }
  };
  
  // Get gender icon
  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'male':
        return <img src="attached_assets/muslim_icon.png" className="h-5 w-5 mr-1 inline-block" alt="Mannelijk" />;
      case 'female':
        return <img src="attached_assets/muslima_icon.png" className="h-5 w-5 mr-1 inline-block" alt="Vrouwelijk" />;
      default:
        return <User className="h-3.5 w-3.5 mr-1" />;
    }
  };
  
  // Get gender label
  const getGenderLabel = (gender: string) => {
    switch (gender) {
      case 'male':
        return 'Mannelijk';
      case 'female':
        return 'Vrouwelijk';
      default:
        return 'Onbekend';
    }
  };
  
  // Calculate items per page
  const itemsPerPage = 10;
  const totalItems = studentsData?.totalCount || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (page - 1) * itemsPerPage + 1;
  const endItem = Math.min(startItem + itemsPerPage - 1, totalItems);
  
  // Laad en fout states
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Premium header component */}
        <PremiumHeader 
          title="Studenten" 
          path="Beheer > Studenten" 
          icon={Users} 
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
        {/* Premium header component */}
        <PremiumHeader 
          title="Studenten" 
          path="Beheer > Studenten" 
          icon={Users} 
        />

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
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium header component */}
      <PremiumHeader 
        title="Studenten" 
        path="Beheer > Studenten" 
        icon={Users} 
      />
      
      {/* Main content area */}
      <div className="px-6 py-6">
        {/* Actiebalk met zoekveld en knoppen */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-6">
          <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Zoeken..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="pl-8 h-8 text-xs w-64 rounded-sm"
              />
            </div>
            
            <div className="flex items-center gap-2">
              {selectedRows.length > 0 ? (
                <>
                  <span className="text-xs text-gray-500">
                    {selectedRows.length} {selectedRows.length === 1 ? 'student' : 'studenten'} geselecteerd
                  </span>
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
                        country: 'België',
                        enrolledPrograms: [],
                        status: 'active',
                        gender: 'male',
                        notes: ''
                      });
                      setSelectedPhoto(null);
                      setPhotoPreview(null);
                      setIsAddDialogOpen(true);
                    }}
                    size="sm"
                    className="h-7 text-xs bg-[#1e40af] hover:bg-[#1e3a8a] rounded-sm"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    Student toevoegen
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
                    <SelectValue placeholder="Jaar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle jaren</SelectItem>
                    <SelectItem value="1">Jaar 1</SelectItem>
                    <SelectItem value="2">Jaar 2</SelectItem>
                    <SelectItem value="3">Jaar 3</SelectItem>
                    <SelectItem value="4">Jaar 4</SelectItem>
                    <SelectItem value="5">Jaar 5</SelectItem>
                    <SelectItem value="6">Jaar 6</SelectItem>
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
                    <SelectItem value="graduated">Afgestudeerd</SelectItem>
                    <SelectItem value="suspended">Geschorst</SelectItem>
                    <SelectItem value="expelled">Verwijderd</SelectItem>
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
                      country: 'België',
                      enrolledPrograms: [],
                      status: 'active',
                      gender: 'male',
                      notes: ''
                    });
                    setSelectedPhoto(null);
                    setPhotoPreview(null);
                    setIsAddDialogOpen(true);
                  }}
                  className="bg-[#1e40af] hover:bg-[#1e3a8a]"
                >
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Student toevoegen
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-[#f9fafc] border-b border-[#e5e7eb]">
                      <th className="px-4 py-2 text-left">
                        <div className="flex items-center">
                          <Checkbox 
                            id="select-all" 
                            checked={selectAll} 
                            onCheckedChange={handleSelectAll}
                            className="h-3.5 w-3.5 rounded-sm data-[state=checked]:bg-[#1e40af]"
                          />
                        </div>
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">ID</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Naam</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Telefoon</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Programma</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Acties</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsData.students.map((student: any) => (
                      <tr 
                        key={student.id} 
                        className="border-b border-[#e5e7eb] hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-2 whitespace-nowrap">
                          <Checkbox 
                            id={`select-${student.id}`}
                            checked={selectedRows.includes(student.id)}
                            onCheckedChange={() => handleRowSelect(student.id)}
                            className="h-3.5 w-3.5 rounded-sm data-[state=checked]:bg-[#1e40af]"
                          />
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <span className="font-mono text-xs text-gray-600">
                            {formatStudentId(student.studentId)}
                          </span>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center">
                            <Avatar className="h-7 w-7 mr-2">
                              {student.photo ? (
                                <img 
                                  src={`/uploads/students/${student.photo}`} 
                                  alt={`${student.firstName} ${student.lastName}`}
                                  className="object-cover"
                                />
                              ) : (
                                <AvatarFallback className="bg-gray-100 text-gray-500 text-xs">
                                  {getGenderIcon(student.gender)}
                                </AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {student.firstName} {student.lastName}
                              </div>
                              {student.dateOfBirth && (
                                <div className="text-xs text-gray-500">
                                  <CalendarDays className="h-3 w-3 inline mr-1" />
                                  {new Date(student.dateOfBirth).toLocaleDateString('nl-NL')}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {student.email ? (
                            <div className="text-sm text-gray-600">
                              <Mail className="h-3 w-3 inline mr-1" />
                              <span className="truncate max-w-[160px] inline-block align-middle">
                                {student.email}
                              </span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          {student.phone ? (
                            <div className="text-sm text-gray-600">
                              <Phone className="h-3 w-3 inline mr-1" />
                              {student.phone}
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            {student.programs && student.programs.length > 0 ? (
                              student.programs.map((program: any) => {
                                const programData = programsData?.find((p: any) => p.id === program.programId);
                                return (
                                  <div key={`${student.id}-${program.programId}`} className="flex items-center">
                                    <Badge className="bg-[#e9edf9] text-[#1e40af] hover:bg-[#e9edf9] border border-[#c7d2f0] rounded-sm">
                                      <BookOpen className="h-3 w-3 mr-1" />
                                      {programData?.name || 'Onbekend programma'} (Jaar {program.yearLevel})
                                    </Badge>
                                  </div>
                                );
                              })
                            ) : (
                              <span className="text-xs text-gray-400">Geen programma</span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <Badge className={`${getStatusBadgeClass(student.status)} border rounded-sm px-2 py-0.5 text-xs font-medium`}>
                            {getStatusIcon(student.status)}
                            {getStatusLabel(student.status)}
                          </Badge>
                        </td>
                        <td className="px-4 py-2 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewStudent(student)}
                              className="h-7 w-7 p-0"
                            >
                              <Eye className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditStudent(student)}
                              className="h-7 w-7 p-0"
                            >
                              <Edit className="h-3.5 w-3.5 text-gray-500" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStudent(student)}
                              className="h-7 w-7 p-0"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-500" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Paginering */}
              <div className="px-4 py-3 flex items-center justify-between border-t border-[#e5e7eb]">
                <div className="text-xs text-gray-500">
                  Tonen {startItem} tot {endItem} van {totalItems} studenten
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 1}
                    className="h-7 text-xs rounded-sm"
                  >
                    Vorige
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    const pageNumber = page <= 3
                      ? i + 1
                      : page >= totalPages - 2
                        ? totalPages - 4 + i
                        : page - 2 + i;
                    
                    if (pageNumber <= 0 || pageNumber > totalPages) return null;
                    
                    return (
                      <Button
                        key={pageNumber}
                        variant={page === pageNumber ? "default" : "outline"}
                        size="sm"
                        onClick={() => handlePageChange(pageNumber)}
                        className={`h-7 w-7 p-0 text-xs rounded-sm ${
                          page === pageNumber ? 'bg-[#1e40af]' : ''
                        }`}
                      >
                        {pageNumber}
                      </Button>
                    );
                  })}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={page === totalPages}
                    className="h-7 text-xs rounded-sm"
                  >
                    Volgende
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Student toevoegen/bewerken dialog */}
      <Dialog open={isAddDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsAddDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader variant="premium">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-white" />
                <DialogTitle className="text-white">
                  {isEditDialogOpen ? 'Student bewerken' : 'Student toevoegen'}
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-white opacity-70 mt-1">
              {isEditDialogOpen 
                ? 'Bewerk de gegevens van de student hieronder.'
                : 'Vul de gegevens van de nieuwe student in.'
              }
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <Tabs defaultValue="persoonlijk" className="w-full">
              <TabsList className="grid grid-cols-4 mb-4">
                <TabsTrigger value="persoonlijk">Persoonlijk</TabsTrigger>
                <TabsTrigger value="contact">Contact</TabsTrigger>
                <TabsTrigger value="programma">Programma</TabsTrigger>
                <TabsTrigger value="extra">Extra</TabsTrigger>
              </TabsList>
              
              <TabsContent value="persoonlijk" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      value={studentFormData.studentId}
                      onChange={(e) => setStudentFormData({...studentFormData, studentId: e.target.value})}
                      placeholder="001"
                      className="h-9 text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Laat leeg voor automatisch ID
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={studentFormData.status}
                      onValueChange={(value) => setStudentFormData({...studentFormData, status: value})}
                    >
                      <SelectTrigger id="status" className="h-9 text-sm">
                        <SelectValue placeholder="Selecteer een status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actief</SelectItem>
                        <SelectItem value="inactive">Inactief</SelectItem>
                        <SelectItem value="graduated">Afgestudeerd</SelectItem>
                        <SelectItem value="suspended">Geschorst</SelectItem>
                        <SelectItem value="expelled">Verwijderd</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Voornaam *</Label>
                    <Input
                      id="firstName"
                      value={studentFormData.firstName}
                      onChange={(e) => setStudentFormData({...studentFormData, firstName: e.target.value})}
                      placeholder="Voornaam"
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Achternaam *</Label>
                    <Input
                      id="lastName"
                      value={studentFormData.lastName}
                      onChange={(e) => setStudentFormData({...studentFormData, lastName: e.target.value})}
                      placeholder="Achternaam"
                      required
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="gender">Geslacht</Label>
                    <Select
                      value={studentFormData.gender}
                      onValueChange={(value) => setStudentFormData({...studentFormData, gender: value})}
                    >
                      <SelectTrigger id="gender" className="h-9 text-sm">
                        <SelectValue placeholder="Selecteer geslacht" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Mannelijk</SelectItem>
                        <SelectItem value="female">Vrouwelijk</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Geboortedatum</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className="w-full justify-start text-left font-normal h-9 text-sm"
                        >
                          <CalendarDays className="mr-2 h-4 w-4" />
                          {studentFormData.dateOfBirth ? (
                            format(studentFormData.dateOfBirth, "dd MMMM yyyy", { locale: nl })
                          ) : (
                            <span>Kies een datum</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={studentFormData.dateOfBirth || undefined}
                          onSelect={(date) => setStudentFormData({...studentFormData, dateOfBirth: date})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Foto</Label>
                  <div className="flex items-start space-x-4">
                    <div className="w-24 h-24 border border-[#e5e7eb] rounded-sm flex items-center justify-center overflow-hidden bg-gray-50">
                      {photoPreview ? (
                        <img 
                          src={photoPreview} 
                          alt="Student foto preview" 
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <Camera className="h-8 w-8 text-gray-300" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <Input
                        id="photo"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        className="text-sm file:text-xs file:bg-[#1e40af] file:text-white file:border-0 file:rounded-sm file:px-2 file:py-1 file:mr-2 file:hover:bg-[#1e3a8a]"
                      />
                      <p className="text-xs text-gray-500">
                        Upload een foto van de student (optioneel).
                        <br />
                        Ondersteunde formaten: JPG, PNG, GIF (max. 5MB)
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={studentFormData.email}
                      onChange={(e) => setStudentFormData({...studentFormData, email: e.target.value})}
                      placeholder="email@voorbeeld.be"
                      className="h-9 text-sm"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefoon</Label>
                    <Input
                      id="phone"
                      value={studentFormData.phone}
                      onChange={(e) => setStudentFormData({...studentFormData, phone: e.target.value})}
                      placeholder="+32 123 45 67 89"
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Adres</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-2">
                      <Input
                        id="street"
                        placeholder="Straat"
                        value={studentFormData.street}
                        onChange={(e) => setStudentFormData({...studentFormData, street: e.target.value})}
                        className="h-9 text-sm"
                      />
                    </div>
                    <div>
                      <Input
                        id="houseNumber"
                        placeholder="Huisnummer"
                        value={studentFormData.houseNumber}
                        onChange={(e) => setStudentFormData({...studentFormData, houseNumber: e.target.value})}
                        className="h-9 text-sm"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Input
                      id="postalCode"
                      placeholder="Postcode"
                      value={studentFormData.postalCode}
                      onChange={(e) => setStudentFormData({...studentFormData, postalCode: e.target.value})}
                      className="h-9 text-sm"
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      id="city"
                      placeholder="Gemeente"
                      value={studentFormData.city}
                      onChange={(e) => setStudentFormData({...studentFormData, city: e.target.value})}
                      className="h-9 text-sm"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Land</Label>
                  <Input
                    id="country"
                    value={studentFormData.country}
                    onChange={(e) => setStudentFormData({...studentFormData, country: e.target.value})}
                    placeholder="België"
                    className="h-9 text-sm"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="programma" className="space-y-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Ingeschreven programma's</Label>
                    <Button 
                      type="button"
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddProgram}
                      disabled={!programsData || programsData.length === 0}
                      className="h-7 text-xs"
                    >
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      Programma toevoegen
                    </Button>
                  </div>
                  
                  {studentFormData.enrolledPrograms.length === 0 ? (
                    <div className="text-center py-6 border border-dashed border-gray-200 rounded-sm">
                      <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">Geen programma's toegevoegd</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Klik op 'Programma toevoegen' om een programma toe te voegen.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {studentFormData.enrolledPrograms.map((program, index) => (
                        <div key={index} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-sm">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <Select
                                value={program.programId.toString()}
                                onValueChange={(value) => handleProgramChange(index, value)}
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Selecteer programma" />
                                </SelectTrigger>
                                <SelectContent>
                                  {programsData?.map((p: any) => (
                                    <SelectItem key={p.id} value={p.id.toString()}>
                                      {p.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div>
                              <Select
                                value={program.yearLevel}
                                onValueChange={(value) => handleYearLevelChange(index, value)}
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue placeholder="Selecteer jaar" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="1">Jaar 1</SelectItem>
                                  <SelectItem value="2">Jaar 2</SelectItem>
                                  <SelectItem value="3">Jaar 3</SelectItem>
                                  <SelectItem value="4">Jaar 4</SelectItem>
                                  <SelectItem value="5">Jaar 5</SelectItem>
                                  <SelectItem value="6">Jaar 6</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveProgram(index)}
                            className="h-9 w-9 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="extra" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="notes">Notities</Label>
                  <textarea
                    id="notes"
                    value={studentFormData.notes || ''}
                    onChange={(e) => setStudentFormData({...studentFormData, notes: e.target.value})}
                    placeholder="Bijkomende informatie over de student..."
                    className="w-full min-h-[120px] p-2 text-sm border border-gray-300 rounded-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Extra velden</Label>
                  <div className="p-4 border border-dashed border-gray-200 rounded-sm">
                    <p className="text-sm text-gray-500 text-center">
                      Extra velden worden ingesteld in de systeeminstellingen.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsAddDialogOpen(false);
                  setIsEditDialogOpen(false);
                }}
                className="mr-2"
              >
                Annuleren
              </Button>
              <Button 
                type="submit"
                disabled={createStudentMutation.isPending || updateStudentMutation.isPending}
                className="bg-[#1e40af] hover:bg-[#1e3a8a]"
              >
                {(createStudentMutation.isPending || updateStudentMutation.isPending) && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditDialogOpen ? 'Opslaan' : 'Toevoegen'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Student bekijken dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => {
        if (!open) setIsViewDialogOpen(false);
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader variant="premium">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-white" />
                <DialogTitle className="text-white flex items-center">
                  <span>Student details</span>
                  <Badge className={`${getStatusBadgeClass(selectedStudent?.status || 'active')} border rounded-sm px-2 py-0.5 text-xs font-medium ml-2`}>
                    {getStatusIcon(selectedStudent?.status || 'active')}
                    {getStatusLabel(selectedStudent?.status || 'active')}
                  </Badge>
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-white opacity-70 mt-1">
              Details en informatie over de geselecteerde student.
            </DialogDescription>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="w-24 h-24 border border-[#e5e7eb] rounded-sm flex items-center justify-center overflow-hidden bg-gray-50">
                  {selectedStudent.photo ? (
                    <img 
                      src={`/uploads/students/${selectedStudent.photo}`}
                      alt={`${selectedStudent.firstName} ${selectedStudent.lastName}`}
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      {getGenderIcon(selectedStudent.gender)}
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    <span className="font-mono">#{formatStudentId(selectedStudent.studentId)}</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {selectedStudent.programs && selectedStudent.programs.map((program: any) => {
                      const programData = programsData?.find((p: any) => p.id === program.programId);
                      return (
                        <Badge 
                          key={`view-${selectedStudent.id}-${program.programId}`}
                          className="bg-[#e9edf9] text-[#1e40af] hover:bg-[#e9edf9] border border-[#c7d2f0] rounded-sm"
                        >
                          <BookOpen className="h-3 w-3 mr-1" />
                          {programData?.name || 'Onbekend programma'} (Jaar {program.yearLevel})
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              </div>
              
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="grid grid-cols-5">
                  <TabsTrigger value="info">Info</TabsTrigger>
                  <TabsTrigger value="programma">Programma</TabsTrigger>
                  <TabsTrigger value="klassen">Klassen</TabsTrigger>
                  <TabsTrigger value="voogden">Voogden</TabsTrigger>
                  <TabsTrigger value="financieel">Financieel</TabsTrigger>
                </TabsList>
                
                <TabsContent value="info" className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-6">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                          <User className="h-4 w-4 mr-2 text-[#1e40af]" />
                          Persoonlijke informatie
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="divide-y divide-gray-100">
                          <div className="py-2 grid grid-cols-3 gap-1 text-sm">
                            <dt className="text-gray-500">Naam</dt>
                            <dd className="col-span-2 text-gray-900">{selectedStudent.firstName} {selectedStudent.lastName}</dd>
                          </div>
                          <div className="py-2 grid grid-cols-3 gap-1 text-sm">
                            <dt className="text-gray-500">Geslacht</dt>
                            <dd className="col-span-2 text-gray-900 flex items-center">
                              {getGenderIcon(selectedStudent.gender)}
                              {getGenderLabel(selectedStudent.gender)}
                            </dd>
                          </div>
                          <div className="py-2 grid grid-cols-3 gap-1 text-sm">
                            <dt className="text-gray-500">Geboortedatum</dt>
                            <dd className="col-span-2 text-gray-900">
                              {selectedStudent.dateOfBirth 
                                ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('nl-NL', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric'
                                  })
                                : '-'
                              }
                            </dd>
                          </div>
                          <div className="py-2 grid grid-cols-3 gap-1 text-sm">
                            <dt className="text-gray-500">Nationaliteit</dt>
                            <dd className="col-span-2 text-gray-900">{selectedStudent.nationality || '-'}</dd>
                          </div>
                          <div className="py-2 grid grid-cols-3 gap-1 text-sm">
                            <dt className="text-gray-500">Geboorteplaats</dt>
                            <dd className="col-span-2 text-gray-900">{selectedStudent.placeOfBirth || '-'}</dd>
                          </div>
                          <div className="py-2 grid grid-cols-3 gap-1 text-sm">
                            <dt className="text-gray-500">Rijksregisternr.</dt>
                            <dd className="col-span-2 text-gray-900 font-mono">{selectedStudent.nationalNumber || '-'}</dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                          <Mail className="h-4 w-4 mr-2 text-[#1e40af]" />
                          Contact informatie
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <dl className="divide-y divide-gray-100">
                          <div className="py-2 grid grid-cols-3 gap-1 text-sm">
                            <dt className="text-gray-500">E-mail</dt>
                            <dd className="col-span-2 text-gray-900 break-all">
                              {selectedStudent.email || '-'}
                            </dd>
                          </div>
                          <div className="py-2 grid grid-cols-3 gap-1 text-sm">
                            <dt className="text-gray-500">Telefoon</dt>
                            <dd className="col-span-2 text-gray-900">{selectedStudent.phone || '-'}</dd>
                          </div>
                          <div className="py-2 grid grid-cols-3 gap-1 text-sm">
                            <dt className="text-gray-500">Adres</dt>
                            <dd className="col-span-2 text-gray-900">
                              {selectedStudent.street && selectedStudent.houseNumber 
                                ? (
                                  <>
                                    {selectedStudent.street} {selectedStudent.houseNumber}
                                    <br />
                                    {selectedStudent.postalCode} {selectedStudent.city}
                                    {selectedStudent.country && selectedStudent.country !== 'België' && (
                                      <>
                                        <br />
                                        {selectedStudent.country}
                                      </>
                                    )}
                                  </>
                                )
                                : '-'
                              }
                            </dd>
                          </div>
                        </dl>
                      </CardContent>
                    </Card>
                  </div>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-[#1e40af]" />
                        Notities
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedStudent.notes ? (
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {selectedStudent.notes}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-500 italic">
                          Geen notities beschikbaar.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="programma" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                        <BookOpen className="h-4 w-4 mr-2 text-[#1e40af]" />
                        Ingeschreven programma's
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {selectedStudent.programs && selectedStudent.programs.length > 0 ? (
                        <div className="space-y-4">
                          {selectedStudent.programs.map((program: any) => {
                            const programData = programsData?.find((p: any) => p.id === program.programId);
                            return (
                              <div 
                                key={`details-${selectedStudent.id}-${program.programId}`}
                                className="p-3 border border-gray-200 rounded-sm"
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-medium text-gray-900">
                                      {programData?.name || 'Onbekend programma'}
                                    </h4>
                                    <div className="flex items-center mt-1">
                                      <Badge className="bg-[#e9edf9] text-[#1e40af] hover:bg-[#e9edf9] border border-[#c7d2f0] rounded-sm mr-2">
                                        <Hash className="h-3 w-3 mr-1" />
                                        Jaar {program.yearLevel}
                                      </Badge>
                                      <span className="text-xs text-gray-500">
                                        Ingeschreven op {program.enrolledAt 
                                          ? new Date(program.enrolledAt).toLocaleDateString('nl-NL')
                                          : 'onbekende datum'
                                        }
                                      </span>
                                    </div>
                                  </div>
                                  <div>
                                    <Badge className={`${getStatusBadgeClass(program.status || 'active')} border rounded-sm px-2 py-0.5 text-xs font-medium`}>
                                      {getStatusIcon(program.status || 'active')}
                                      {getStatusLabel(program.status || 'active')}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="text-center py-12 border border-dashed border-gray-200 rounded-sm">
                          <BookOpen className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">Geen programma's gevonden</p>
                          <p className="text-xs text-gray-400 mt-1">
                            Deze student is niet ingeschreven in een programma.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                        <School className="h-4 w-4 mr-2 text-[#1e40af]" />
                        Cursussen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 border border-dashed border-gray-200 rounded-sm">
                        <School className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Geen cursussen beschikbaar</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Cursussen worden toegewezen via de programma-inschrijvingen.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="klassen" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                        <UsersRound className="h-4 w-4 mr-2 text-[#1e40af]" />
                        Klassen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 border border-dashed border-gray-200 rounded-sm">
                        <UsersRound className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Geen klassen gevonden</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Deze student is niet toegewezen aan een klas.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="voogden" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                        <UserCheck className="h-4 w-4 mr-2 text-[#1e40af]" />
                        Voogden
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 border border-dashed border-gray-200 rounded-sm">
                        <UserCheck className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Geen voogden gevonden</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Er zijn geen voogden gekoppeld aan deze student.
                        </p>
                        <Button 
                          className="mt-4 bg-[#1e40af] hover:bg-[#1e3a8a]"
                          size="sm"
                          onClick={() => {
                            setIsViewDialogOpen(false);
                            // Navigate to guardians page
                          }}
                        >
                          <UserCheck className="h-3.5 w-3.5 mr-1" />
                          Voogd koppelen
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="financieel" className="space-y-4 pt-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-gray-900 flex items-center">
                        <CreditCard className="h-4 w-4 mr-2 text-[#1e40af]" />
                        Financiële overzicht
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12 border border-dashed border-gray-200 rounded-sm">
                        <CreditCard className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">Geen financiële gegevens beschikbaar</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Er zijn geen betalingen of facturen gevonden voor deze student.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              
              <div className="flex justify-end space-x-4">
                <Button
                  variant="outline"
                  onClick={() => handleEditStudent(selectedStudent)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Bewerken
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Verwijderen
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* Student verwijderen dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Student verwijderen</AlertDialogTitle>
            <AlertDialogDescription>
              Weet u zeker dat u deze student wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
              {selectedStudent && (
                <div className="mt-4 p-3 border border-gray-200 rounded-sm bg-gray-50">
                  <div className="flex items-center">
                    <div className="h-10 w-10 flex-shrink-0 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                      {getGenderIcon(selectedStudent.gender)}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedStudent.firstName} {selectedStudent.lastName}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-mono">#{formatStudentId(selectedStudent.studentId)}</span>
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleren</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteStudentMutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Verwijderen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Student importeren dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={handleCloseImportDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader variant="premium">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FileUp className="h-5 w-5 text-white" />
                <DialogTitle className="text-white">
                  Studenten importeren
                </DialogTitle>
              </div>
            </div>
            <DialogDescription className="text-white opacity-70 mt-1">
              Importeer studenten vanuit een CSV of Excel bestand.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {importStep === 1 && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Bestand selecteren</Label>
                    <div className="flex items-center space-x-4">
                      <Input
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="text-sm file:text-xs file:bg-[#1e40af] file:text-white file:border-0 file:rounded-sm file:px-2 file:py-1 file:mr-2 file:hover:bg-[#1e3a8a]"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.value = '';
                          }
                          setImportFile(null);
                          setImportColumns([]);
                          setImportPreviewData([]);
                        }}
                        className="h-8 text-xs"
                        disabled={!importFile}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Wissen
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Ondersteunde formaten: CSV, Excel (XLSX, XLS)
                    </p>
                  </div>
                  
                  {importFile && (
                    <>
                      <div className="space-y-2">
                        <Label>Bestandsvoorbeeld</Label>
                        <div className="border border-gray-200 rounded-sm overflow-hidden">
                          <div className="overflow-x-auto">
                            <table className="w-full">
                              <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                  {importColumns.map((column) => (
                                    <th key={column} className="px-3 py-2 text-left text-xs font-medium text-gray-500">
                                      {column}
                                    </th>
                                  ))}
                                </tr>
                              </thead>
                              <tbody>
                                {importPreviewData.map((row, rowIndex) => (
                                  <tr key={rowIndex} className="border-b border-gray-200 last:border-0">
                                    {importColumns.map((column) => (
                                      <td key={`${rowIndex}-${column}`} className="px-3 py-2 text-xs text-gray-600">
                                        {row[column] !== undefined ? String(row[column]) : ''}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500">
                          Eerste 5 rijen worden getoond als voorbeeld.
                        </p>
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="map-street" className="text-xs">Straat</Label>
                      <Select
                        value={columnMappings.street || ''}
                        onValueChange={(value) => handleColumnMappingChange('street', value)}
                      >
                        <SelectTrigger id="map-street" className="h-8 text-xs">
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
                      <Label htmlFor="map-houseNumber" className="text-xs">Huisnummer</Label>
                      <Select
                        value={columnMappings.houseNumber || ''}
                        onValueChange={(value) => handleColumnMappingChange('houseNumber', value)}
                      >
                        <SelectTrigger id="map-houseNumber" className="h-8 text-xs">
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
                      <Label htmlFor="map-postalCode" className="text-xs">Postcode</Label>
                      <Select
                        value={columnMappings.postalCode || ''}
                        onValueChange={(value) => handleColumnMappingChange('postalCode', value)}
                      >
                        <SelectTrigger id="map-postalCode" className="h-8 text-xs">
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
                      <Label htmlFor="map-city" className="text-xs">Gemeente</Label>
                      <Select
                        value={columnMappings.city || ''}
                        onValueChange={(value) => handleColumnMappingChange('city', value)}
                      >
                        <SelectTrigger id="map-city" className="h-8 text-xs">
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
                      <Label htmlFor="map-gender" className="text-xs">Geslacht</Label>
                      <Select
                        value={columnMappings.gender || ''}
                        onValueChange={(value) => handleColumnMappingChange('gender', value)}
                      >
                        <SelectTrigger id="map-gender" className="h-8 text-xs">
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
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs">Programma toewijzing (optioneel)</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="map-programId" className="text-xs">Programma ID</Label>
                      <Select
                        value={columnMappings.programId || ''}
                        onValueChange={(value) => handleColumnMappingChange('programId', value)}
                      >
                        <SelectTrigger id="map-programId" className="h-8 text-xs">
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
                      <Label htmlFor="map-yearLevel" className="text-xs">Jaar</Label>
                      <Select
                        value={columnMappings.yearLevel || ''}
                        onValueChange={(value) => handleColumnMappingChange('yearLevel', value)}
                      >
                        <SelectTrigger id="map-yearLevel" className="h-8 text-xs">
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
                  </div>
                </div>
                    </>
                  )}
                </div>
                
                {importValidationErrors.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-sm">
                    <h4 className="text-sm font-medium text-red-800 mb-2">
                      <AlertCircle className="h-4 w-4 inline-block mr-1" />
                      Validatiefouten
                    </h4>
                    <ul className="space-y-1 text-xs text-red-700">
                      {importValidationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            
            {importStep === 2 && (
              <>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Te importeren gegevens</Label>
                    <div className="border border-gray-200 rounded-sm overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Voornaam</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Achternaam</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Email</th>
                              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Telefoon</th>
                              {columnMappings.programId && (
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500">Programma</th>
                              )}
                            </tr>
                          </thead>
                          <tbody>
                            {importPreviewData.map((student, index) => (
                              <tr key={index} className="border-b border-gray-200 last:border-0">
                                <td className="px-3 py-2 text-xs text-gray-600">{student.firstName}</td>
                                <td className="px-3 py-2 text-xs text-gray-600">{student.lastName}</td>
                                <td className="px-3 py-2 text-xs text-gray-600">{student.email || '-'}</td>
                                <td className="px-3 py-2 text-xs text-gray-600">{student.phone || '-'}</td>
                                {columnMappings.programId && (
                                  <td className="px-3 py-2 text-xs text-gray-600">
                                    {student.programId && programsData 
                                      ? programsData.find((p: any) => p.id === parseInt(student.programId))?.name || 'Onbekend'
                                      : '-'
                                    }
                                    {student.yearLevel && ` (Jaar ${student.yearLevel})`}
                                  </td>
                                )}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500">
                      {importPreviewData.length > 5 
                        ? 'Slechts 5 rijen worden getoond als voorbeeld.' 
                        : 'Alle rijen worden getoond als voorbeeld.'
                      }
                      <br />
                      Totaal aantal te importeren: {importPreviewData.length} studenten
                    </p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-sm">
                    <h4 className="text-sm font-medium text-blue-800 mb-1">
                      <Check className="h-4 w-4 inline-block mr-1" />
                      Gereed voor import
                    </h4>
                    <p className="text-xs text-blue-700">
                      De gegevens zijn gevalideerd en klaar om te importeren. Klik op 'Importeren' om door te gaan.
                    </p>
                  </div>
                </div>
              </>
            )}
            
            {importStep === 3 && (
              <>
                <div className="space-y-4">
                  <div className="text-center">
                    {importResults.failed === 0 ? (
                      <Check className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    ) : (
                      <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    )}
                    
                    <h3 className="text-lg font-medium text-gray-900">
                      {importResults.failed === 0 
                        ? 'Import succesvol voltooid!' 
                        : 'Import gedeeltelijk voltooid'
                      }
                    </h3>
                    
                    <div className="mt-4 flex justify-center space-x-6 text-center">
                      <div>
                        <div className="text-2xl font-semibold text-gray-900">{importResults.total}</div>
                        <div className="text-xs text-gray-500">Totaal</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-green-600">{importResults.success}</div>
                        <div className="text-xs text-gray-500">Succesvol</div>
                      </div>
                      <div>
                        <div className="text-2xl font-semibold text-red-600">{importResults.failed}</div>
                        <div className="text-xs text-gray-500">Mislukt</div>
                      </div>
                    </div>
                  </div>
                  
                  {importResults.errors.length > 0 && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-sm max-h-48 overflow-y-auto">
                      <h4 className="text-sm font-medium text-red-800 mb-2">
                        <AlertCircle className="h-4 w-4 inline-block mr-1" />
                        Importfouten
                      </h4>
                      <ul className="space-y-1 text-xs text-red-700">
                        {importResults.errors.map((error, index) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            {importStep === 1 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCloseImportDialog}
                  className="mr-2"
                >
                  Annuleren
                </Button>
                <Button
                  type="button"
                  onClick={handleValidateImport}
                  disabled={!importFile || isValidatingImport || !columnMappings.firstName || !columnMappings.lastName}
                  className="bg-[#1e40af] hover:bg-[#1e3a8a]"
                >
                  {isValidatingImport && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Valideren
                </Button>
              </>
            )}
            
            {importStep === 2 && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setImportStep(1)}
                  className="mr-2"
                >
                  Terug
                </Button>
                <Button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={importStudentsMutation.isPending}
                  className="bg-[#1e40af] hover:bg-[#1e3a8a]"
                >
                  {importStudentsMutation.isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Importeren
                </Button>
              </>
            )}
            
            {importStep === 3 && (
              <Button
                type="button"
                onClick={handleCloseImportDialog}
                className="bg-[#1e40af] hover:bg-[#1e3a8a]"
              >
                <>
                  <FileUp className="h-3.5 w-3.5 mr-2" />
                  Importeren
                </>
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}