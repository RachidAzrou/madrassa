import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, Plus, Download, Filter, Eye, Edit, Trash2, 
  User, Users, GraduationCap, Phone, Mail, Calendar,
  MapPin, FileText, AlertTriangle, Star, BookOpen,
  Settings, Save, X, Upload, UserPlus, NotebookText,
  Home, MoreHorizontal, PlusCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { CustomDialogContent } from '@/components/ui/custom-dialog-content';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/ui/empty-state';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

// Types - exact copy from admin
interface Student {
  id: number;
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  status: string;
  classId?: number;
  className?: string;
  guardianName?: string;
  emergencyContact?: string;
  createdAt: string;
}

interface Guardian {
  id: number;
  firstName: string;
  lastName: string;
  relationship: string;
  email: string;
  phone: string;
}

interface StudentClass {
  id: number;
  name: string;
  academicYear: string;
  studentCount: number;
}

// Admin-style components
const DataTableContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-white border border-[#e5e7eb] rounded-lg shadow-sm overflow-hidden">
    {children}
  </div>
);

const SearchActionBar = ({ children }: { children: React.ReactNode }) => (
  <div className="px-4 py-3 border-b border-[#e5e7eb] flex flex-wrap items-center justify-between gap-3">
    {children}
  </div>
);

const TableContainer = ({ children }: { children: React.ReactNode }) => (
  <div className="overflow-x-auto">
    {children}
  </div>
);

const QuickActions = ({ onView, onEdit, onDelete }: { onView: () => void, onEdit: () => void, onDelete: () => void }) => (
  <div className="flex items-center gap-1">
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onView}>
            <Eye className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bekijken</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={onEdit}>
            <Edit className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bewerken</TooltipContent>
      </Tooltip>
    </TooltipProvider>
    
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500 hover:text-red-700" onClick={onDelete}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Verwijderen</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  </div>
);

export default function Students() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State variables - exact copy from admin
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [filterProgram, setFilterProgram] = useState('all');
  const [filterAcademicYear, setFilterAcademicYear] = useState('all');
  const [filterStudentGroup, setFilterStudentGroup] = useState('all');
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Admin-style state variables
  const [newStudentGuardians, setNewStudentGuardians] = useState<any[]>([]);
  const [newStudentSiblings, setNewStudentSiblings] = useState<any[]>([]);
  const [isAddGuardianDialogOpen, setIsAddGuardianDialogOpen] = useState(false);
  const [isLinkSiblingDialogOpen, setIsLinkSiblingDialogOpen] = useState(false);
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
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isProcessingEid, setIsProcessingEid] = useState(false);
  
  // Admin-style form data
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
    enrollmentDate: new Date().toISOString().split('T')[0],
    status: "enrolled",
    notes: "",
    studentGroupId: "",
    gender: "man",
    photoUrl: "",
    studentId: "",
    academicYear: "2024-2025",
    nationality: "",
    placeOfBirth: ""
  };
  
  const [formData, setFormData] = useState(emptyFormData);
  const [editFormData, setEditFormData] = useState(emptyFormData);

  // Data fetching with proper typing
  const { data: students = [], isLoading, isError } = useQuery<Student[]>({
    queryKey: ['/api/students'],
    staleTime: 60000,
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery<StudentClass[]>({
    queryKey: ['/api/classes'],
    staleTime: 60000,
  });

  const { data: guardians = [], isLoading: guardiansLoading } = useQuery<Guardian[]>({
    queryKey: ['/api/guardians'],
    staleTime: 60000,
  });

  // Filter students - exact copy from admin
  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch = searchTerm === '' || 
      student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || student.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Admin-style helper functions
  const generateNextStudentId = (studentsData = []) => {
    const currentYear = new Date().getFullYear();
    const yearSuffix = currentYear.toString().slice(-2);
    const prefix = `ST${yearSuffix}`;
    
    if (studentsData.length === 0) return `${prefix}001`;
    
    const existingIds = studentsData
      .map((student: any) => student.studentId)
      .filter((id: string) => id && id.startsWith(prefix))
      .map((id: string) => parseInt(id.substring(prefix.length)))
      .filter((num: number) => !isNaN(num))
      .sort((a: number, b: number) => a - b);
    
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

  // Photo upload functionality
  const handlePhotoUpload = () => {
    document.getElementById('photo-upload')?.click();
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Bestand te groot",
          description: "De foto mag maximaal 5MB groot zijn.",
          variant: "destructive",
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ongeldig bestandstype",
          description: "Alleen afbeeldingen zijn toegestaan.",
          variant: "destructive",
        });
        return;
      }

      setIsUploadingPhoto(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photoUrl: reader.result as string
        }));
        setIsUploadingPhoto(false);
        toast({
          title: "Foto geüpload",
          description: "De studentenfoto is succesvol geüpload.",
        });
      };
      reader.onerror = () => {
        setIsUploadingPhoto(false);
        toast({
          title: "Upload gefaald",
          description: "Er is een fout opgetreden bij het uploaden van de foto.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePhotoRemove = () => {
    setFormData(prev => ({
      ...prev,
      photoUrl: ''
    }));
    toast({
      title: "Foto verwijderd",
      description: "De studentenfoto is verwijderd.",
    });
  };

  // eID scanning functionality
  const handleEidScan = () => {
    const eidInput = document.getElementById('eid-upload') as HTMLInputElement;
    if (eidInput) {
      eidInput.click();
    }
  };



  const processEidDocument = async (file: File) => {
    setIsProcessingEid(true);
    
    try {
      toast({
        title: "eID wordt verwerkt",
        description: "Het eID document wordt gescand voor gegevens...",
      });

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('eidDocument', file);

      // Send to backend eID processing service
      const response = await fetch('/api/eid/process', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('eID processing failed');
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        // Update form with extracted eID data
        setFormData(prev => ({
          ...prev,
          firstName: result.data.firstName || prev.firstName,
          lastName: result.data.lastName || prev.lastName,
          dateOfBirth: result.data.dateOfBirth || prev.dateOfBirth,
          street: result.data.street || prev.street,
          houseNumber: result.data.houseNumber || prev.houseNumber,
          postalCode: result.data.postalCode || prev.postalCode,
          city: result.data.city || prev.city,
          gender: result.data.gender || prev.gender,
          nationality: result.data.nationality || prev.nationality,
          placeOfBirth: result.data.placeOfBirth || prev.placeOfBirth,
        }));

        toast({
          title: "eID succesvol gescand",
          description: "Alle persoonsgegevens zijn automatisch ingevuld vanuit het eID document.",
        });
      } else {
        throw new Error(result.message || 'Geen gegevens gevonden in eID document');
      }
    } catch (error: any) {
      console.error('eID processing error:', error);
      toast({
        title: "eID scannen gefaald",
        description: error.message || "Er is een fout opgetreden bij het verwerken van het eID document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingEid(false);
    }
  };

  const resetForm = () => {
    setFormData(emptyFormData);
    setNewStudentGuardians([]);
    setNewStudentSiblings([]);
    setNextStudentId(generateNextStudentId(students as any[]));
    setHasValidationAttempt(false);
  };

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

  const validateRequiredFields = () => {
    const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'gender', 'street', 'houseNumber', 'postalCode', 'city'];
    const missing = requiredFields.filter(field => !formData[field as keyof typeof formData]);
    return missing;
  };

  // Mutations
  const createStudentMutation = useMutation({
    mutationFn: async (studentData: any) => {
      const response = await apiRequest('POST', '/api/students', studentData);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Student toegevoegd",
        description: "De nieuwe student is succesvol toegevoegd.",
        variant: "default",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen",
        description: error.message || "Er is een fout opgetreden bij het toevoegen van de student.",
        variant: "destructive",
      });
    },
  });

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setHasValidationAttempt(true);
    
    // Validate required fields using admin-style validation
    const missingFields = validateRequiredFields();
    if (missingFields.length > 0) {
      toast({
        title: "Validatiefout",
        description: `Vul alle verplichte velden in: ${missingFields.join(', ')}`,
        variant: "destructive",
      });
      return;
    }

    // Build student data with admin structure
    const studentData = {
      studentId: formData.academicYear ? 
        `ST${formData.academicYear.substring(2, 4)}001` : 
        generateNextStudentId(students as any[]),
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email || null,
      phone: formData.phone || null,
      dateOfBirth: formData.dateOfBirth,
      gender: formData.gender,
      street: formData.street,
      houseNumber: formData.houseNumber,
      postalCode: formData.postalCode,
      city: formData.city,
      photoUrl: formData.photoUrl || null,
      status: formData.status || 'ingeschreven',
      notes: formData.notes || null,
      academicYear: formData.academicYear,
      enrollmentDate: formData.enrollmentDate,
      studentGroupId: formData.studentGroupId ? parseInt(formData.studentGroupId) : null,
      guardians: newStudentGuardians,
      siblings: newStudentSiblings
    };

    createStudentMutation.mutate(studentData);
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setEditFormData({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth,
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      programId: "",
      enrollmentDate: new Date().toISOString().split('T')[0],
      status: student.status,
      notes: "",
      studentGroupId: student.classId?.toString() || "",
      gender: student.gender,
      photoUrl: "",
      studentId: student.studentId,
      academicYear: "2024-2025"
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      <PremiumHeader 
        title="Studenten" 
        description="Bekijk en beheer alle studentgegevens, inclusief persoonlijke informatie en inschrijvingsdetails"
        icon={Users}
        breadcrumbs={{
          parent: "Secretariaat",
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
              {statusFilter !== 'all' && (
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                  className="h-7 text-xs text-blue-600 p-0 mr-3"
                >
                  Filters wissen
                </Button>
              )}
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-7 w-32 text-xs rounded-sm border-[#e5e7eb]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#e5e7eb]">
                <SelectItem value="all" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Alle statussen</SelectItem>
                <SelectItem value="ingeschreven" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Ingeschreven</SelectItem>
                <SelectItem value="uitgeschreven" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Uitgeschreven</SelectItem>
                <SelectItem value="geschorst" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Geschorst</SelectItem>
                <SelectItem value="afgestudeerd" className="text-xs focus:bg-blue-200 hover:bg-blue-100">Afgestudeerd</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Tabel */}
        <TableContainer>
          <Table>
            <TableHeader className="bg-[#f9fafb]">
              <TableRow>
                <TableHead className="w-12 px-4 py-3">
                  <Checkbox />
                </TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Student</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Klas</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Schooljaar</TableHead>
                <TableHead className="px-4 py-3 text-xs font-medium text-gray-700">Status</TableHead>
                <TableHead className="w-20 px-4 py-3 text-xs font-medium text-gray-700 text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="ml-2 text-gray-600">Laden...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredStudents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <EmptyState
                      icon={<Users className="h-10 w-10 opacity-30" />}
                      title="Geen studenten gevonden"
                      description="Er zijn geen studenten die voldoen aan de huidige criteria."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents.map((student: Student) => (
                  <TableRow key={student.id} className="hover:bg-gray-50">
                    <TableCell className="px-4 py-3">
                      <Checkbox />
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                            {student.firstName?.[0]}{student.lastName?.[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-xs font-medium text-gray-900">{student.firstName} {student.lastName}</p>
                          <p className="text-xs text-gray-500">{student.studentId}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600">
                      {student.className || '-'}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-xs text-gray-600">
                      2024-2025
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
                        onDelete={() => handleDeleteStudent(student)}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </DataTableContainer>

      {/* Create Student Dialog - Complete Admin Copy */}
      <Dialog 
        open={isCreateDialogOpen} 
        onOpenChange={(open) => {
          setIsCreateDialogOpen(open);
          if (!open) {
            resetForm();
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
                          onClick={() => document.getElementById('photo-upload')?.click()}
                        >
                          {formData.photoUrl ? (
                            <img src={formData.photoUrl} alt="Student foto" className="w-full h-full object-cover" />
                          ) : (
                            <User className="h-12 w-12 text-gray-400" />
                          )}
                        </div>
                        <div className="flex flex-col gap-2 justify-center items-end">
                          <button 
                            type="button" 
                            className={`flex items-center justify-center gap-1 border border-gray-300 rounded-md px-2 py-1 hover:bg-gray-50 transition-colors text-sm ${isUploadingPhoto ? 'opacity-50 cursor-not-allowed' : ''}`}
                            onClick={handlePhotoUpload}
                            disabled={isUploadingPhoto}
                          >
                            {isUploadingPhoto ? (
                              <div className="animate-spin w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                            ) : (
                              <Upload className="h-4 w-4 text-gray-500" />
                            )}
                            <span className="text-xs font-medium text-gray-700">
                              {isUploadingPhoto ? 'Uploading...' : 'Upload'}
                            </span>
                          </button>
                          {formData.photoUrl && (
                            <button 
                              type="button" 
                              className="flex items-center justify-center gap-1 border border-red-300 rounded-md px-2 py-1 hover:bg-red-50 transition-colors text-sm"
                              onClick={handlePhotoRemove}
                            >
                              <X className="h-4 w-4 text-red-500" />
                              <span className="text-xs font-medium text-red-700">Verwijder</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* eID Knop */}
                    <div className="flex items-center gap-2 mb-4">
                      <button
                        type="button"
                        className={`inline-flex items-center justify-center rounded border border-gray-300 bg-white hover:bg-gray-50 transition-colors p-1.5 ${isProcessingEid ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={handleEidScan}
                        disabled={isProcessingEid}
                        title="Klik om eID gegevens automatisch in te vullen"
                      >
                        {isProcessingEid ? (
                          <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        ) : (
                          <img 
                            src="/attached_assets/e-id-logo_1749570968055.png" 
                            alt="eID logo" 
                            className="h-6 w-auto"
                          />
                        )}
                      </button>
                      <p className="text-xs text-gray-600">
                        Klik op het logo om met je elektronische identiteitskaart gegevens automatisch op te laden
                      </p>
                    </div>
                    
                    {/* Hidden inputs */}
                    <input
                      id="photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handlePhotoChange}
                    />
                    <input
                      id="eid-upload"
                      type="file"
                      accept="image/*,.pdf"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target?.files?.[0];
                        if (file) {
                          // Validate file size (max 10MB for documents)
                          if (file.size > 10 * 1024 * 1024) {
                            toast({
                              title: "Bestand te groot",
                              description: "Het eID document mag maximaal 10MB zijn.",
                              variant: "destructive",
                            });
                            return;
                          }

                          // Validate file type
                          const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf'];
                          if (!allowedTypes.includes(file.type)) {
                            toast({
                              title: "Ongeldig bestandstype",
                              description: "Alleen afbeeldingen (JPG, PNG, GIF) en PDF bestanden zijn toegestaan.",
                              variant: "destructive",
                            });
                            return;
                          }

                          processEidDocument(file);
                        }
                        // Reset the input value so the same file can be selected again
                        e.target.value = '';
                      }}
                    />
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
                            className="mt-1 h-9 w-full border-[#e5e7eb] bg-white"
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
                  
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Onderwijsgegevens
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="academicYear" className="text-xs font-medium text-gray-700">Schooljaar *</Label>
                        <Input
                          id="academicYear"
                          name="academicYear"
                          value={formData.academicYear}
                          onChange={handleInputChange}
                          required
                          placeholder="2024-2025"
                          className="mt-1 h-9 w-full border-[#e5e7eb] bg-white"
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
                            {classes?.map?.((group: any) => (
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
                          <SelectTrigger 
                            id="status" 
                            className="mt-1 h-9 w-full border-[#e5e7eb] bg-white"
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
                disabled={createStudentMutation.isPending}
                className="bg-[#1e40af] hover:bg-[#1d3a9e] text-white"
              >
                <User className="h-4 w-4 mr-2" />
                {createStudentMutation.isPending ? 'Student toevoegen...' : 'Student toevoegen'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Guardian Dialog - Complete Admin Copy */}
      <Dialog open={isAddGuardianDialogOpen} onOpenChange={setIsAddGuardianDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-blue-600" />
              Voogd Toevoegen
            </DialogTitle>
            <DialogDescription>
              Voeg een voogd toe voor deze student
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={isAddingNewGuardian ? "new" : "existing"} onValueChange={(value) => setIsAddingNewGuardian(value === "new")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="new">Nieuwe Voogd</TabsTrigger>
              <TabsTrigger value="existing">Bestaande Voogd</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new" className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="guardian-firstName">Voornaam *</Label>
                  <Input
                    id="guardian-firstName"
                    value={guardianFormData.firstName}
                    onChange={(e) => setGuardianFormData({...guardianFormData, firstName: e.target.value})}
                    placeholder="Voornaam"
                  />
                </div>
                <div>
                  <Label htmlFor="guardian-lastName">Achternaam *</Label>
                  <Input
                    id="guardian-lastName"
                    value={guardianFormData.lastName}
                    onChange={(e) => setGuardianFormData({...guardianFormData, lastName: e.target.value})}
                    placeholder="Achternaam"
                  />
                </div>
                <div>
                  <Label htmlFor="guardian-email">Email</Label>
                  <Input
                    id="guardian-email"
                    type="email"
                    value={guardianFormData.email}
                    onChange={(e) => setGuardianFormData({...guardianFormData, email: e.target.value})}
                    placeholder="Email"
                  />
                </div>
                <div>
                  <Label htmlFor="guardian-phone">Telefoon</Label>
                  <Input
                    id="guardian-phone"
                    value={guardianFormData.phone}
                    onChange={(e) => setGuardianFormData({...guardianFormData, phone: e.target.value})}
                    placeholder="Telefoon"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="guardian-relationship">Relatie *</Label>
                  <Select 
                    value={guardianFormData.relationship} 
                    onValueChange={(value) => setGuardianFormData({...guardianFormData, relationship: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer relatie" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Ouder</SelectItem>
                      <SelectItem value="guardian">Voogd</SelectItem>
                      <SelectItem value="grandparent">Grootouder</SelectItem>
                      <SelectItem value="other">Anders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {guardianFormData.relationship === 'other' && (
                  <div className="col-span-2">
                    <Label htmlFor="guardian-relationshipOther">Specificeer relatie</Label>
                    <Input
                      id="guardian-relationshipOther"
                      value={guardianFormData.relationshipOther}
                      onChange={(e) => setGuardianFormData({...guardianFormData, relationshipOther: e.target.value})}
                      placeholder="Specificeer relatie"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="existing" className="space-y-4">
              <div>
                <Label>Zoek Bestaande Voogd</Label>
                <Input
                  value={guardianSearchTerm}
                  onChange={(e) => setGuardianSearchTerm(e.target.value)}
                  placeholder="Zoek op naam..."
                  className="mb-3"
                />
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {guardians
                    ?.filter((guardian: any) => 
                      guardian.firstName?.toLowerCase().includes(guardianSearchTerm.toLowerCase()) ||
                      guardian.lastName?.toLowerCase().includes(guardianSearchTerm.toLowerCase())
                    )
                    .map((guardian: any) => (
                      <div
                        key={guardian.id}
                        className={`p-3 border rounded-md cursor-pointer transition-colors ${
                          selectedGuardians.some(g => g.id === guardian.id)
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                        onClick={() => {
                          if (selectedGuardians.some(g => g.id === guardian.id)) {
                            setSelectedGuardians(selectedGuardians.filter(g => g.id !== guardian.id));
                          } else {
                            setSelectedGuardians([...selectedGuardians, guardian]);
                          }
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-medium">{guardian.firstName} {guardian.lastName}</p>
                            <p className="text-sm text-gray-500">{guardian.email}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddGuardianDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={() => {
                if (isAddingNewGuardian) {
                  if (guardianFormData.firstName && guardianFormData.lastName && guardianFormData.relationship) {
                    setNewStudentGuardians([...newStudentGuardians, guardianFormData]);
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
                    setIsAddGuardianDialogOpen(false);
                  }
                } else {
                  setNewStudentGuardians([...newStudentGuardians, ...selectedGuardians]);
                  setSelectedGuardians([]);
                  setIsAddGuardianDialogOpen(false);
                }
              }}
            >
              Toevoegen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link Sibling Dialog - Complete Admin Copy */}
      <Dialog open={isLinkSiblingDialogOpen} onOpenChange={setIsLinkSiblingDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              Broer/Zus Koppelen
            </DialogTitle>
            <DialogDescription>
              Koppel een bestaande student als broer of zus
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label>Zoek Student</Label>
              <Input
                value={siblingSearchTerm}
                onChange={(e) => setSiblingSearchTerm(e.target.value)}
                placeholder="Zoek op naam of student ID..."
                className="mb-3"
              />
              <div className="max-h-48 overflow-y-auto space-y-2">
                {students
                  ?.filter((student: any) => 
                    (student.firstName?.toLowerCase().includes(siblingSearchTerm.toLowerCase()) ||
                     student.lastName?.toLowerCase().includes(siblingSearchTerm.toLowerCase()) ||
                     student.studentId?.toLowerCase().includes(siblingSearchTerm.toLowerCase())) &&
                    !newStudentSiblings.some(s => s.id === student.id)
                  )
                  .map((student: any) => (
                    <div
                      key={student.id}
                      className={`p-3 border rounded-md cursor-pointer transition-colors ${
                        selectedSiblings.some(s => s.id === student.id)
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => {
                        if (selectedSiblings.some(s => s.id === student.id)) {
                          setSelectedSiblings(selectedSiblings.filter(s => s.id !== student.id));
                        } else {
                          setSelectedSiblings([...selectedSiblings, student]);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                          <User className="h-4 w-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{student.firstName} {student.lastName}</p>
                          <p className="text-sm text-gray-500">{student.studentId} • {student.className || 'Geen klas'}</p>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLinkSiblingDialogOpen(false)}>
              Annuleren
            </Button>
            <Button 
              onClick={() => {
                setNewStudentSiblings([...newStudentSiblings, ...selectedSiblings]);
                setSelectedSiblings([]);
                setIsLinkSiblingDialogOpen(false);
              }}
            >
              Koppelen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}