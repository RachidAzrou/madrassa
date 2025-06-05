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
    studentId: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    placeOfBirth: '',
    emergencyContact: '',
    emergencyContactPhone: '',
    emergencyContactRelationship: '',
    medicalConditions: '',
    allergies: '',
    dietary: '',
    medications: '',
    notes: '',
    status: 'active',
    address: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: '',
    country: '',
    programId: '',
    academicYearId: '',
    studentGroupId: '',
    guardians: [] as any[],
    siblings: [] as any[]
  };

  // State for form data
  const [formData, setFormData] = useState(emptyFormData);
  const { toast } = useToast();

  // Data fetching
  const { data: students = [], isLoading: studentsLoading, error: studentsError, refetch: refetchStudents } = useQuery({
    queryKey: ['/api/students'],
    staleTime: 60000,
  });

  const { data: programs = [], isLoading: programsLoading } = useQuery({
    queryKey: ['/api/programs'],
    staleTime: 60000,
  });

  const { data: academicYears = [], isLoading: academicYearsLoading } = useQuery({
    queryKey: ['/api/academic-years'],
    staleTime: 60000,
  });

  const { data: studentGroups = [], isLoading: studentGroupsLoading } = useQuery({
    queryKey: ['/api/student-groups'],
    staleTime: 60000,
  });

  const { data: guardians = [], isLoading: guardiansLoading } = useQuery({
    queryKey: ['/api/guardians'],
    staleTime: 60000,
  });

  // Determine next student ID
  useEffect(() => {
    if (students && students.length > 0) {
      const sortedStudents = [...students].sort((a, b) => {
        const aNum = parseInt(a.studentId.replace(/\D/g, ''));
        const bNum = parseInt(b.studentId.replace(/\D/g, ''));
        return bNum - aNum;
      });
      
      if (sortedStudents.length > 0) {
        const lastStudentId = sortedStudents[0].studentId;
        const numericPart = parseInt(lastStudentId.replace(/\D/g, ''));
        const nextNum = numericPart + 1;
        const paddedNextNum = nextNum.toString().padStart(5, '0');
        setNextStudentId(`ST${paddedNextNum}`);
      }
    }
  }, [students]);

  useEffect(() => {
    if (isCreateDialogOpen || isEditDialogOpen) {
      setFormData(prev => ({
        ...prev,
        studentId: isCreateDialogOpen ? nextStudentId : prev.studentId
      }));
    }
  }, [nextStudentId, isCreateDialogOpen, isEditDialogOpen]);

  // Filter students
  const filteredStudents = students.filter((student: any) => {
    if (!student) return false;
    
    const matchesSearch = searchTerm === "" || 
      (student.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       student.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       student.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       student.studentId?.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    const matchesProgram = filterProgram === "all" || student.programId?.toString() === filterProgram;
    const matchesAcademicYear = filterAcademicYear === "all" || student.academicYearId?.toString() === filterAcademicYear;
    const matchesStudentGroup = filterStudentGroup === "all" || student.studentGroupId?.toString() === filterStudentGroup;
    
    return matchesSearch && matchesStatus && matchesProgram && matchesAcademicYear && matchesStudentGroup;
  });

  // Get program name
  const getProgramName = (programId: number) => {
    const program = programs.find((p: any) => p.id === programId);
    return program ? program.name : 'Onbekend';
  };

  // Get student group name
  const getStudentGroupName = (studentGroupId: number) => {
    const group = studentGroups.find((g: any) => g.id === studentGroupId);
    return group ? group.name : 'Geen groep';
  };

  // Get academic year name
  const getAcademicYearName = (academicYearId: number) => {
    const year = academicYears.find((y: any) => y.id === academicYearId);
    return year ? year.name : 'Onbekend';
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasValidationAttempt(true);
    
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast({
        title: "Fout",
        description: "Voornaam, achternaam en email zijn verplicht.",
        variant: "destructive"
      });
      return;
    }

    try {
      if (isCreateDialogOpen) {
        const response = await apiRequest('POST', '/api/students', {
          body: {
            ...formData,
            guardians: newStudentGuardians,
            siblings: newStudentSiblings
          }
        });
        
        if (response.ok) {
          await refetchStudents();
          toast({
            title: "Success",
            description: "Student succesvol toegevoegd.",
          });
          handleCloseDialog();
        }
      } else if (isEditDialogOpen) {
        const response = await apiRequest('PUT', `/api/students/${selectedStudent?.id}`, {
          body: formData
        });
        
        if (response.ok) {
          await refetchStudents();
          toast({
            title: "Success",
            description: "Student succesvol bijgewerkt.",
          });
          handleCloseDialog();
        }
      }
    } catch (error) {
      console.error('Error saving student:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het opslaan.",
        variant: "destructive"
      });
    }
  };

  // Handle student deletion
  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    
    try {
      const response = await apiRequest('DELETE', `/api/students/${studentToDelete.id}`, {});
      
      if (response.ok) {
        await refetchStudents();
        toast({
          title: "Success",
          description: "Student succesvol verwijderd.",
        });
        setIsDeleteDialogOpen(false);
        setStudentToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting student:', error);
      toast({
        title: "Fout",
        description: "Er is een fout opgetreden bij het verwijderen.",
        variant: "destructive"
      });
    }
  };

  // Dialog handlers
  const handleCreateStudent = () => {
    setFormData(emptyFormData);
    setNewStudentGuardians([]);
    setNewStudentSiblings([]);
    setSelectedGuardians([]);
    setSelectedSiblings([]);
    setHasValidationAttempt(false);
    setIsCreateDialogOpen(true);
  };

  const handleViewStudent = (student: any) => {
    setSelectedStudent(student);
    setIsViewDialogOpen(true);
  };

  const handleEditStudent = (student: any) => {
    setSelectedStudent(student);
    setFormData({
      ...student,
      guardians: student.guardians || [],
      siblings: student.siblings || []
    });
    setHasValidationAttempt(false);
    setIsEditDialogOpen(true);
  };

  const handleDeleteClick = (student: any) => {
    setStudentToDelete(student);
    setIsDeleteDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setIsEditDialogOpen(false);
    setIsViewDialogOpen(false);
    setSelectedStudent(null);
    setFormData(emptyFormData);
    setNewStudentGuardians([]);
    setNewStudentSiblings([]);
    setSelectedGuardians([]);
    setSelectedSiblings([]);
    setHasValidationAttempt(false);
  };

  // Handle input changes
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Export functionality
  const handleExport = () => {
    setIsExportDialogOpen(true);
  };

  const handleConfirmExport = () => {
    const headers = [
      'Student ID', 'Voornaam', 'Achternaam', 'Email', 'Telefoon', 
      'Geboortedatum', 'Geslacht', 'Status', 'Programma', 'Academisch Jaar', 'Studentgroep'
    ];
    
    const csvData = filteredStudents.map((student: any) => [
      student.studentId,
      student.firstName,
      student.lastName,
      student.email,
      student.phone || '',
      student.dateOfBirth || '',
      student.gender || '',
      student.status,
      getProgramName(student.programId),
      getAcademicYearName(student.academicYearId),
      getStudentGroupName(student.studentGroupId)
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `studenten_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    setIsExportDialogOpen(false);
    toast({
      title: "Export voltooid",
      description: "Studenten zijn geëxporteerd naar CSV bestand.",
    });
  };

  // Status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Actief', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactief', className: 'bg-gray-100 text-gray-800' },
      graduated: { label: 'Afgestudeerd', className: 'bg-blue-100 text-blue-800' },
      transferred: { label: 'Overgeplaatst', className: 'bg-yellow-100 text-yellow-800' },
      suspended: { label: 'Geschorst', className: 'bg-red-100 text-red-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.inactive;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  if (studentsLoading) {
    return <TableLoadingState />;
  }

  if (studentsError) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Er is een fout opgetreden</h3>
          <p className="mt-1 text-sm text-gray-500">
            Kon de studenten niet laden. Probeer het opnieuw.
          </p>
          <div className="mt-6">
            <Button onClick={() => refetchStudents()}>
              Opnieuw proberen
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Premium Header - Exact admin styling */}
      <PremiumHeader
        icon={<Users className="h-5 w-5 text-white" />}
        title="Studentenbeheer"
        subtitle="Beheer alle studenten en hun informatie"
        parentLabel="Secretariaat"
        currentLabel="Studenten"
      />

      {/* Main Content Container */}
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        
        {/* Data Table Container with exact admin styling */}
        <DataTableContainer>
          {/* Search and Action Bar */}
          <SearchActionBar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            placeholder="Zoek studenten op naam, email of student ID..."
            showFilterOptions={showFilterOptions}
            onToggleFilters={() => setShowFilterOptions(!showFilterOptions)}
            onExport={handleExport}
            onImport={() => setIsImportDialogOpen(true)}
            onCreate={handleCreateStudent}
            createLabel="Nieuwe Student"
            createIcon={<UserPlus className="h-4 w-4" />}
          />

          {/* Filter Options */}
          {showFilterOptions && (
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle statussen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle statussen</SelectItem>
                      <SelectItem value="active">Actief</SelectItem>
                      <SelectItem value="inactive">Inactief</SelectItem>
                      <SelectItem value="graduated">Afgestudeerd</SelectItem>
                      <SelectItem value="transferred">Overgeplaatst</SelectItem>
                      <SelectItem value="suspended">Geschorst</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Programma</Label>
                  <Select value={filterProgram} onValueChange={setFilterProgram}>
                    <SelectTrigger>
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
                  <Label className="text-sm font-medium">Academisch Jaar</Label>
                  <Select value={filterAcademicYear} onValueChange={setFilterAcademicYear}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle jaren" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle jaren</SelectItem>
                      {academicYears.map((year: any) => (
                        <SelectItem key={year.id} value={year.id.toString()}>
                          {year.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-sm font-medium">Studentgroep</Label>
                  <Select value={filterStudentGroup} onValueChange={setFilterStudentGroup}>
                    <SelectTrigger>
                      <SelectValue placeholder="Alle groepen" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle groepen</SelectItem>
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

          {/* Table Header with Statistics */}
          <DataTableHeader
            title="Studenten"
            count={filteredStudents.length}
            totalCount={students.length}
            selectedCount={selectedStudents.length}
            onSelectAll={() => {
              if (selectedStudents.length === filteredStudents.length) {
                setSelectedStudents([]);
              } else {
                setSelectedStudents(filteredStudents.map((s: any) => s.id));
              }
            }}
            isAllSelected={selectedStudents.length === filteredStudents.length}
            isIndeterminate={selectedStudents.length > 0 && selectedStudents.length < filteredStudents.length}
          >
            <QuickActions>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/secretariat/guardians')}
                className="h-8"
              >
                <Users className="h-4 w-4 mr-2" />
                Voogden
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocation('/secretariat/classes')}
                className="h-8"
              >
                <GraduationCap className="h-4 w-4 mr-2" />
                Klassen
              </Button>
            </QuickActions>
          </DataTableHeader>

          {/* Table Container */}
          <TableContainer>
            {filteredStudents.length === 0 ? (
              <EmptyTableState
                icon={Users}
                title="Geen studenten gevonden"
                description="Er zijn geen studenten die voldoen aan de huidige filters."
                actionLabel="Nieuwe Student"
                onAction={handleCreateStudent}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <ShadcnTableHead className="w-12">
                      <Checkbox
                        checked={selectedStudents.length === filteredStudents.length}
                        onCheckedChange={() => {
                          if (selectedStudents.length === filteredStudents.length) {
                            setSelectedStudents([]);
                          } else {
                            setSelectedStudents(filteredStudents.map((s: any) => s.id));
                          }
                        }}
                        className="translate-y-[2px]"
                      />
                    </ShadcnTableHead>
                    <ShadcnTableHead>Student</ShadcnTableHead>
                    <ShadcnTableHead>Programma</ShadcnTableHead>
                    <ShadcnTableHead>Groep</ShadcnTableHead>
                    <ShadcnTableHead>Status</ShadcnTableHead>
                    <ShadcnTableHead>Contact</ShadcnTableHead>
                    <ShadcnTableHead className="w-24">Acties</ShadcnTableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student: any) => (
                    <TableRow key={student.id} className="hover:bg-gray-50">
                      <TableCell>
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                          className="translate-y-[2px]"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} />
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">
                              {student.studentId}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getProgramName(student.programId)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {getAcademicYearName(student.academicYearId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {getStudentGroupName(student.studentGroupId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(student.status)}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center text-gray-900">
                            <Mail className="h-3 w-3 mr-1" />
                            {student.email}
                          </div>
                          {student.phone && (
                            <div className="flex items-center text-gray-500 mt-1">
                              <Phone className="h-3 w-3 mr-1" />
                              {student.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStudent(student)}
                            className="h-8 w-8 p-0"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditStudent(student)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(student)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
        </DataTableContainer>
      </div>

      {/* Create/Edit Student Dialog */}
      <CustomDialog 
        open={isCreateDialogOpen || isEditDialogOpen} 
        onOpenChange={handleCloseDialog}
        className="max-w-4xl max-h-[90vh]"
      >
        <DialogHeaderWithIcon
          icon={<UserPlus className="h-5 w-5 text-blue-600" />}
          title={isCreateDialogOpen ? "Nieuwe Student Toevoegen" : "Student Bewerken"}
          description={isCreateDialogOpen ? "Voeg een nieuwe student toe aan het systeem" : "Bewerk de gegevens van de student"}
        />
        
        <DialogFormContainer>
          <form onSubmit={handleSubmit} className="space-y-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basisgegevens</TabsTrigger>
                <TabsTrigger value="contact">Contact & Adres</TabsTrigger>
                <TabsTrigger value="academic">Academisch</TabsTrigger>
                <TabsTrigger value="medical">Medisch & Extra</TabsTrigger>
              </TabsList>

              {/* Basic Information Tab */}
              <TabsContent value="basic" className="space-y-4">
                <SectionContainer title="Persoonlijke Informatie">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <CustomFormLabel htmlFor="studentId" required>Student ID</CustomFormLabel>
                      <Input
                        id="studentId"
                        value={formData.studentId}
                        onChange={(e) => handleInputChange('studentId', e.target.value)}
                        placeholder="ST25001"
                        disabled={isEditDialogOpen}
                        className={hasValidationAttempt && !formData.studentId ? 'border-red-500' : ''}
                      />
                    </div>
                    <div></div>
                    
                    <div>
                      <CustomFormLabel htmlFor="firstName" required>Voornaam</CustomFormLabel>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange('firstName', e.target.value)}
                        placeholder="Mohammed"
                        className={hasValidationAttempt && !formData.firstName ? 'border-red-500' : ''}
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="lastName" required>Achternaam</CustomFormLabel>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        placeholder="Al-Rahman"
                        className={hasValidationAttempt && !formData.lastName ? 'border-red-500' : ''}
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="email" required>Email</CustomFormLabel>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        placeholder="mohammed.alrahman@example.com"
                        className={hasValidationAttempt && !formData.email ? 'border-red-500' : ''}
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="phone">Telefoon</CustomFormLabel>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange('phone', e.target.value)}
                        placeholder="+31 6 12345678"
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="dateOfBirth">Geboortedatum</CustomFormLabel>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="gender">Geslacht</CustomFormLabel>
                      <Select value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer geslacht" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Man</SelectItem>
                          <SelectItem value="female">Vrouw</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="nationality">Nationaliteit</CustomFormLabel>
                      <Input
                        id="nationality"
                        value={formData.nationality}
                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                        placeholder="Nederlandse"
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="placeOfBirth">Geboorteplaats</CustomFormLabel>
                      <Input
                        id="placeOfBirth"
                        value={formData.placeOfBirth}
                        onChange={(e) => handleInputChange('placeOfBirth', e.target.value)}
                        placeholder="Amsterdam"
                      />
                    </div>
                  </div>
                </SectionContainer>
              </TabsContent>

              {/* Contact & Address Tab */}
              <TabsContent value="contact" className="space-y-4">
                <SectionContainer title="Adresgegevens">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <CustomFormLabel htmlFor="street">Straat</CustomFormLabel>
                      <Input
                        id="street"
                        value={formData.street}
                        onChange={(e) => handleInputChange('street', e.target.value)}
                        placeholder="Kalverstraat"
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="houseNumber">Huisnummer</CustomFormLabel>
                      <Input
                        id="houseNumber"
                        value={formData.houseNumber}
                        onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                        placeholder="123A"
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="postalCode">Postcode</CustomFormLabel>
                      <Input
                        id="postalCode"
                        value={formData.postalCode}
                        onChange={(e) => handleInputChange('postalCode', e.target.value)}
                        placeholder="1012 NX"
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="city">Plaats</CustomFormLabel>
                      <Input
                        id="city"
                        value={formData.city}
                        onChange={(e) => handleInputChange('city', e.target.value)}
                        placeholder="Amsterdam"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <CustomFormLabel htmlFor="country">Land</CustomFormLabel>
                      <Input
                        id="country"
                        value={formData.country}
                        onChange={(e) => handleInputChange('country', e.target.value)}
                        placeholder="Nederland"
                      />
                    </div>
                  </div>
                </SectionContainer>

                <SectionContainer title="Noodcontact">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <CustomFormLabel htmlFor="emergencyContact">Naam noodcontact</CustomFormLabel>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => handleInputChange('emergencyContact', e.target.value)}
                        placeholder="Ahmed Al-Rahman"
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="emergencyContactPhone">Telefoon noodcontact</CustomFormLabel>
                      <Input
                        id="emergencyContactPhone"
                        value={formData.emergencyContactPhone}
                        onChange={(e) => handleInputChange('emergencyContactPhone', e.target.value)}
                        placeholder="+31 6 87654321"
                      />
                    </div>
                    
                    <div className="col-span-2">
                      <CustomFormLabel htmlFor="emergencyContactRelationship">Relatie noodcontact</CustomFormLabel>
                      <Input
                        id="emergencyContactRelationship"
                        value={formData.emergencyContactRelationship}
                        onChange={(e) => handleInputChange('emergencyContactRelationship', e.target.value)}
                        placeholder="Vader"
                      />
                    </div>
                  </div>
                </SectionContainer>
              </TabsContent>

              {/* Academic Tab */}
              <TabsContent value="academic" className="space-y-4">
                <SectionContainer title="Academische Informatie">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <CustomFormLabel htmlFor="programId">Programma</CustomFormLabel>
                      <Select value={formData.programId?.toString()} onValueChange={(value) => handleInputChange('programId', parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer programma" />
                        </SelectTrigger>
                        <SelectContent>
                          {programs.map((program: any) => (
                            <SelectItem key={program.id} value={program.id.toString()}>
                              {program.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="academicYearId">Academisch Jaar</CustomFormLabel>
                      <Select value={formData.academicYearId?.toString()} onValueChange={(value) => handleInputChange('academicYearId', parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer academisch jaar" />
                        </SelectTrigger>
                        <SelectContent>
                          {academicYears.map((year: any) => (
                            <SelectItem key={year.id} value={year.id.toString()}>
                              {year.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="studentGroupId">Studentgroep</CustomFormLabel>
                      <Select value={formData.studentGroupId?.toString()} onValueChange={(value) => handleInputChange('studentGroupId', parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer studentgroep" />
                        </SelectTrigger>
                        <SelectContent>
                          {studentGroups.map((group: any) => (
                            <SelectItem key={group.id} value={group.id.toString()}>
                              {group.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="status">Status</CustomFormLabel>
                      <Select value={formData.status} onValueChange={(value) => handleInputChange('status', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecteer status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actief</SelectItem>
                          <SelectItem value="inactive">Inactief</SelectItem>
                          <SelectItem value="graduated">Afgestudeerd</SelectItem>
                          <SelectItem value="transferred">Overgeplaatst</SelectItem>
                          <SelectItem value="suspended">Geschorst</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SectionContainer>
              </TabsContent>

              {/* Medical & Extra Tab */}
              <TabsContent value="medical" className="space-y-4">
                <SectionContainer title="Medische Informatie">
                  <div className="space-y-4">
                    <div>
                      <CustomFormLabel htmlFor="medicalConditions">Medische Aandoeningen</CustomFormLabel>
                      <Textarea
                        id="medicalConditions"
                        value={formData.medicalConditions}
                        onChange={(e) => handleInputChange('medicalConditions', e.target.value)}
                        placeholder="Vermeld eventuele medische aandoeningen..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="allergies">Allergieën</CustomFormLabel>
                      <Textarea
                        id="allergies"
                        value={formData.allergies}
                        onChange={(e) => handleInputChange('allergies', e.target.value)}
                        placeholder="Vermeld eventuele allergieën..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="dietary">Dieetvoorschriften</CustomFormLabel>
                      <Textarea
                        id="dietary"
                        value={formData.dietary}
                        onChange={(e) => handleInputChange('dietary', e.target.value)}
                        placeholder="Vermeld eventuele dieetvoorschriften..."
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <CustomFormLabel htmlFor="medications">Medicatie</CustomFormLabel>
                      <Textarea
                        id="medications"
                        value={formData.medications}
                        onChange={(e) => handleInputChange('medications', e.target.value)}
                        placeholder="Vermeld eventuele medicatie..."
                        rows={3}
                      />
                    </div>
                  </div>
                </SectionContainer>

                <SectionContainer title="Extra Informatie">
                  <div>
                    <CustomFormLabel htmlFor="notes">Opmerkingen</CustomFormLabel>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => handleInputChange('notes', e.target.value)}
                      placeholder="Eventuele extra opmerkingen..."
                      rows={4}
                    />
                  </div>
                </SectionContainer>
              </TabsContent>
            </Tabs>
          </form>
        </DialogFormContainer>

        <DialogFooterContainer>
          <Button type="button" variant="outline" onClick={handleCloseDialog}>
            Annuleren
          </Button>
          <Button type="submit" onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
            <Save className="h-4 w-4 mr-2" />
            {isCreateDialogOpen ? 'Student Toevoegen' : 'Wijzigingen Opslaan'}
          </Button>
        </DialogFooterContainer>
      </CustomDialog>

      {/* View Student Dialog */}
      <CustomDialog open={isViewDialogOpen} onOpenChange={() => setIsViewDialogOpen(false)} className="max-w-4xl">
        <DialogHeaderWithIcon
          icon={<Eye className="h-5 w-5 text-blue-600" />}
          title="Student Details"
          description={selectedStudent ? `Details van ${selectedStudent.firstName} ${selectedStudent.lastName}` : ""}
        />
        
        {selectedStudent && (
          <DialogFormContainer>
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Basisgegevens</TabsTrigger>
                <TabsTrigger value="contact">Contact & Adres</TabsTrigger>
                <TabsTrigger value="academic">Academisch</TabsTrigger>
                <TabsTrigger value="medical">Medisch & Extra</TabsTrigger>
              </TabsList>

              {/* View tabs content similar to edit but readonly */}
              <TabsContent value="basic" className="space-y-4">
                <SectionContainer title="Persoonlijke Informatie">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Student ID</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedStudent.studentId}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Status</Label>
                      <div className="mt-1">{getStatusBadge(selectedStudent.status)}</div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Voornaam</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedStudent.firstName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Achternaam</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedStudent.lastName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Email</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedStudent.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Telefoon</Label>
                      <p className="text-sm text-gray-900 mt-1">{selectedStudent.phone || 'Niet opgegeven'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Geboortedatum</Label>
                      <p className="text-sm text-gray-900 mt-1">
                        {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('nl-NL') : 'Niet opgegeven'}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Geslacht</Label>
                      <p className="text-sm text-gray-900 mt-1">
                        {selectedStudent.gender === 'male' ? 'Man' : selectedStudent.gender === 'female' ? 'Vrouw' : 'Niet opgegeven'}
                      </p>
                    </div>
                  </div>
                </SectionContainer>
              </TabsContent>

              {/* Continue with other tabs... */}
            </Tabs>
          </DialogFormContainer>
        )}

        <DialogFooterContainer>
          <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
            Sluiten
          </Button>
          {selectedStudent && (
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              handleEditStudent(selectedStudent);
            }}>
              <Edit className="h-4 w-4 mr-2" />
              Bewerken
            </Button>
          )}
        </DialogFooterContainer>
      </CustomDialog>

      {/* Delete Confirmation Dialog */}
      <DeleteDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteStudent}
        title="Student Verwijderen"
        description={
          studentToDelete 
            ? `Weet je zeker dat je ${studentToDelete.firstName} ${studentToDelete.lastName} wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.`
            : ""
        }
      />

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Studenten Exporteren</DialogTitle>
            <DialogDescription>
              Exporteer de huidige lijst van studenten naar een CSV bestand.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-gray-600">
              Er worden {filteredStudents.length} studenten geëxporteerd op basis van de huidige filters.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleConfirmExport}>
              <Download className="h-4 w-4 mr-2" />
              Exporteren
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}