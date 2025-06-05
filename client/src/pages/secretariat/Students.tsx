import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { 
  Search, Plus, Download, Filter, Eye, Edit, Trash2, 
  User, Users, GraduationCap, Phone, Mail, Calendar,
  MapPin, FileText, AlertTriangle, Star, BookOpen,
  Settings, Save, X, Upload, UserPlus, NotebookText
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/ui/empty-state';
import { PremiumHeader } from '@/components/layout/premium-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

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

export default function Students() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('alle');
  const [classFilter, setClassFilter] = useState('alle');
  const [genderFilter, setGenderFilter] = useState('alle');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Form state
  const [newStudent, setNewStudent] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    classId: 0,
    guardianId: 0,
    emergencyContact: '',
    notes: '',
    status: 'active',
    photoUrl: '',
    street: '',
    houseNumber: '',
    postalCode: '',
    city: ''
  });

  // Data fetching
  const { data: students = [], isLoading, isError } = useQuery({
    queryKey: ['/api/students'],
    staleTime: 60000,
  });

  const { data: classes = [], isLoading: classesLoading } = useQuery({
    queryKey: ['/api/classes'],
    staleTime: 60000,
  });

  const { data: guardians = [], isLoading: guardiansLoading } = useQuery({
    queryKey: ['/api/guardians'],
    staleTime: 60000,
  });

  // Filter students
  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch = searchQuery === '' || 
      student.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'alle' || student.status === statusFilter;
    const matchesClass = classFilter === 'alle' || student.classId?.toString() === classFilter;
    const matchesGender = genderFilter === 'alle' || student.gender === genderFilter;
    
    return matchesSearch && matchesStatus && matchesClass && matchesGender;
  });

  // Mutations
  const createStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/students', { body: data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({ title: "Student succesvol toegevoegd" });
      setShowCreateDialog(false);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij toevoegen student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await apiRequest('PUT', `/api/students/${id}`, { body: data });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({ title: "Student succesvol bijgewerkt" });
      setShowEditDialog(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij bijwerken student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/students/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      toast({ title: "Student succesvol verwijderd" });
      setShowDeleteDialog(false);
      setSelectedStudent(null);
    },
    onError: (error: any) => {
      toast({
        title: "Fout bij verwijderen student",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Helper functions
  const resetForm = () => {
    setNewStudent({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      classId: 0,
      guardianId: 0,
      emergencyContact: '',
      notes: '',
      status: 'active',
      photoUrl: '',
      street: '',
      houseNumber: '',
      postalCode: '',
      city: ''
    });
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: 'Actief', className: 'bg-green-100 text-green-800' },
      inactive: { label: 'Inactief', className: 'bg-gray-100 text-gray-800' },
      suspended: { label: 'Geschorst', className: 'bg-red-100 text-red-800' },
      graduated: { label: 'Afgestudeerd', className: 'bg-blue-100 text-blue-800' }
    };
    
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const handleCreateStudent = () => {
    if (!newStudent.firstName || !newStudent.lastName) {
      toast({
        title: "Validatiefout",
        description: "Voornaam en achternaam zijn verplicht",
        variant: "destructive",
      });
      return;
    }
    createStudentMutation.mutate(newStudent);
  };

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setNewStudent({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      phone: student.phone,
      dateOfBirth: student.dateOfBirth,
      gender: student.gender,
      classId: student.classId || 0,
      guardianId: 0,
      emergencyContact: student.emergencyContact || '',
      notes: '',
      status: student.status || 'active',
      photoUrl: '',
      street: '',
      houseNumber: '',
      postalCode: '',
      city: ''
    });
    setShowEditDialog(true);
  };

  const handleUpdateStudent = () => {
    if (selectedStudent) {
      updateStudentMutation.mutate({ id: selectedStudent.id, data: newStudent });
    }
  };

  const handleViewStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowViewDialog(true);
  };

  const handleDeleteStudent = (student: Student) => {
    setSelectedStudent(student);
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = () => {
    if (selectedStudent) {
      deleteStudentMutation.mutate(selectedStudent.id);
    }
  };

  // Export functionality
  const handleExport = () => {
    const headers = ['Student ID', 'Voornaam', 'Achternaam', 'Email', 'Telefoon', 'Klas', 'Status'];
    const csvData = filteredStudents.map((student: Student) => [
      student.studentId,
      student.firstName,
      student.lastName,
      student.email,
      student.phone,
      student.className || '',
      student.status
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `studenten_export_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast({
      title: "Export voltooid",
      description: "Studenten zijn geëxporteerd naar CSV bestand.",
    });
  };

  // Calculate statistics
  const activeStudents = students.filter((s: Student) => s.status === 'active').length;
  const totalStudents = students.length;
  const maleStudents = students.filter((s: Student) => s.gender === 'Man').length;
  const femaleStudents = students.filter((s: Student) => s.gender === 'Vrouw').length;

  if (isLoading || classesLoading || guardiansLoading) {
    return (
      <div className="bg-[#f7f9fc] min-h-screen">
        <PremiumHeader
          icon={GraduationCap}
          title="Studentenbeheer"
          description="Beheer alle studenten en hun gegevens"
          breadcrumbs={{
            parent: "Secretariaat",
            current: "Studenten"
          }}
        />
        <div className="px-6 py-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-[#f7f9fc] min-h-screen">
        <PremiumHeader
          icon={GraduationCap}
          title="Studentenbeheer"
          description="Beheer alle studenten en hun gegevens"
          breadcrumbs={{
            parent: "Secretariaat",
            current: "Studenten"
          }}
        />
        <div className="px-6 py-6 max-w-7xl mx-auto">
          <div className="text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-red-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Er is een fout opgetreden</h3>
            <p className="mt-1 text-sm text-gray-500">Probeer de pagina te vernieuwen.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Premium Header */}
      <PremiumHeader
        icon={GraduationCap}
        title="Studentenbeheer"
        description="Beheer alle studenten en hun gegevens"
        breadcrumbs={{
          parent: "Secretariaat",
          current: "Studenten"
        }}
      />

      {/* Main Content */}
      <div className="px-6 py-6 max-w-7xl mx-auto space-y-6">
        
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Totaal Studenten</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Alle geregistreerde studenten
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Actieve Studenten</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeStudents}</div>
              <p className="text-xs text-muted-foreground">
                Momenteel ingeschreven
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mannelijke Studenten</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{maleStudents}</div>
              <p className="text-xs text-muted-foreground">
                {totalStudents > 0 ? Math.round((maleStudents / totalStudents) * 100) : 0}% van totaal
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vrouwelijke Studenten</CardTitle>
              <User className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">{femaleStudents}</div>
              <p className="text-xs text-muted-foreground">
                {totalStudents > 0 ? Math.round((femaleStudents / totalStudents) * 100) : 0}% van totaal
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Action Bar */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="px-6 py-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    type="text"
                    placeholder="Zoek studenten..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleExport}>
                  <Download className="h-4 w-4 mr-2" />
                  Exporteren
                </Button>
                <Button
                  onClick={() => setShowCreateDialog(true)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nieuwe Student
                </Button>
              </div>
            </div>

            {/* Filter Row */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="text-sm font-medium">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle statussen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle statussen</SelectItem>
                    <SelectItem value="active">Actief</SelectItem>
                    <SelectItem value="inactive">Inactief</SelectItem>
                    <SelectItem value="suspended">Geschorst</SelectItem>
                    <SelectItem value="graduated">Afgestudeerd</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Klas</Label>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle klassen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle klassen</SelectItem>
                    {classes.map((cls: StudentClass) => (
                      <SelectItem key={cls.id} value={cls.id.toString()}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-sm font-medium">Geslacht</Label>
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Alle geslachten" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="alle">Alle geslachten</SelectItem>
                    <SelectItem value="Man">Man</SelectItem>
                    <SelectItem value="Vrouw">Vrouw</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-medium text-gray-900">
                  Studenten ({filteredStudents.length})
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Beheer alle geregistreerde studenten
                </p>
              </div>
              
              {selectedStudents.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">
                    {selectedStudents.length} geselecteerd
                  </span>
                  <Button variant="outline" size="sm">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Verwijderen
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            {filteredStudents.length === 0 ? (
              <EmptyState
                icon={GraduationCap}
                title="Geen studenten gevonden"
                description="Er zijn geen studenten die voldoen aan de huidige zoekcriteria."
                action={{
                  label: "Nieuwe Student Toevoegen",
                  onClick: () => setShowCreateDialog(true)
                }}
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedStudents.length === filteredStudents.length}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStudents(filteredStudents.map((s: Student) => s.id));
                          } else {
                            setSelectedStudents([]);
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Klas</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Voogd</TableHead>
                    <TableHead>Acties</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student: Student) => (
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
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {student.firstName?.[0]}{student.lastName?.[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {student.firstName} {student.lastName}
                            </div>
                            <div className="text-sm text-gray-500">{student.studentId}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-900">
                          {student.email && (
                            <div className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {student.email}
                            </div>
                          )}
                          {student.phone && (
                            <div className="flex items-center mt-1 text-gray-500">
                              <Phone className="h-3 w-3 mr-1" />
                              {student.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {student.className ? (
                          <Badge variant="outline">{student.className}</Badge>
                        ) : (
                          <span className="text-gray-400">Geen klas</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(student.status)}
                      </TableCell>
                      <TableCell>
                        {student.guardianName ? (
                          <span className="text-sm text-gray-900">{student.guardianName}</span>
                        ) : (
                          <span className="text-gray-400">Geen voogd</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewStudent(student)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bekijken</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEditStudent(student)}
                                  className="h-8 w-8 p-0"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Bewerken</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>

                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteStudent(student)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Verwijderen</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Create Student Dialog - Admin Style */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">Nieuwe Student Toevoegen</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  Voeg een nieuwe student toe aan het systeem met alle benodigde gegevens
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-6">
                <TabsTrigger value="personal" className="flex items-center gap-2 text-xs">
                  <User className="h-3.5 w-3.5" />
                  <span>Persoonlijk</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-2 text-xs">
                  <Phone className="h-3.5 w-3.5" />
                  <span>Contact</span>
                </TabsTrigger>
                <TabsTrigger value="academic" className="flex items-center gap-2 text-xs">
                  <GraduationCap className="h-3.5 w-3.5" />
                  <span>Onderwijs</span>
                </TabsTrigger>
                <TabsTrigger value="guardian" className="flex items-center gap-2 text-xs">
                  <Users className="h-3.5 w-3.5" />
                  <span>Voogden</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="personal" className="space-y-4 min-h-[400px]">
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <User className="h-4 w-4 mr-2" />
                    Persoonlijke Informatie
                  </h3>
                  <div className="flex items-start gap-6 mb-4">
                    <div className="flex flex-col items-center gap-3">
                      <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                        {newStudent.photoUrl ? (
                          <AvatarImage src={newStudent.photoUrl} alt="Student foto" />
                        ) : (
                          <AvatarFallback className="bg-[#1e40af] text-white text-lg">
                            {newStudent.firstName?.[0]}{newStudent.lastName?.[0]}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => document.getElementById('photo-upload')?.click()}
                          className="text-xs px-2 py-1 h-7"
                        >
                          <Upload className="h-3 w-3 mr-1" />
                          Upload
                        </Button>
                        <Button
                          type="button"
                          variant="outline" 
                          size="sm"
                          className="text-xs px-2 py-1 h-7"
                        >
                          <FileText className="h-3 w-3 mr-1" />
                          eID
                        </Button>
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
                              setNewStudent(prev => ({
                                ...prev,
                                photoUrl: reader.result as string
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="studentId" className="text-xs font-medium text-gray-700">Student ID</Label>
                        <Input
                          id="studentId"
                          value="ST25003"
                          disabled
                          className="h-8 text-sm bg-gray-50 text-gray-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-xs font-medium text-gray-700">
                          Geslacht <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={newStudent.gender} 
                          onValueChange={(value) => setNewStudent({...newStudent, gender: value})}
                          required
                        >
                          <SelectTrigger className="h-8 text-sm border-gray-300">
                            <SelectValue placeholder="Man of Vrouw" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="man" className="text-black hover:bg-blue-100 focus:bg-blue-200">Man</SelectItem>
                            <SelectItem value="vrouw" className="text-black hover:bg-blue-100 focus:bg-blue-200">Vrouw</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-xs font-medium text-gray-700">
                          Voornaam <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="firstName"
                          value={newStudent.firstName}
                          onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Voornaam"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-xs font-medium text-gray-700">
                          Achternaam <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="lastName"
                          value={newStudent.lastName}
                          onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Achternaam"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dateOfBirth" className="text-xs font-medium text-gray-700">
                          Geboortedatum <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="dateOfBirth"
                          type="date"
                          value={newStudent.dateOfBirth}
                          onChange={(e) => setNewStudent({...newStudent, dateOfBirth: e.target.value})}
                          className="h-8 text-sm"
                          required
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
                        <Label htmlFor="street" className="text-xs font-medium text-gray-700">Straat <span className="text-red-500">*</span></Label>
                        <Input
                          id="street"
                          value={newStudent.street || ''}
                          onChange={(e) => setNewStudent({...newStudent, street: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Straat"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="houseNumber" className="text-xs font-medium text-gray-700">Huisnummer <span className="text-red-500">*</span></Label>
                        <Input
                          id="houseNumber"
                          value={newStudent.houseNumber || ''}
                          onChange={(e) => setNewStudent({...newStudent, houseNumber: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Nr."
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="postalCode" className="text-xs font-medium text-gray-700">Postcode <span className="text-red-500">*</span></Label>
                        <Input
                          id="postalCode"
                          value={newStudent.postalCode || ''}
                          onChange={(e) => setNewStudent({...newStudent, postalCode: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Postcode"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <Label htmlFor="city" className="text-xs font-medium text-gray-700">Plaats <span className="text-red-500">*</span></Label>
                        <Input
                          id="city"
                          value={newStudent.city || ''}
                          onChange={(e) => setNewStudent({...newStudent, city: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Plaats"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4 min-h-[400px]">
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    Contact Informatie
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-xs font-medium text-gray-700">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newStudent.email}
                        onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                        className="h-8 text-sm"
                        placeholder="student@example.com"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone" className="text-xs font-medium text-gray-700">Telefoon</Label>
                      <Input
                        id="phone"
                        value={newStudent.phone}
                        onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                        className="h-8 text-sm"
                        placeholder="06-12345678"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="academic" className="space-y-4 min-h-[400px]">
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <GraduationCap className="h-4 w-4 mr-2" />
                    Onderwijsgegevens
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="classId" className="text-xs font-medium text-gray-700">Klas</Label>
                      <Select 
                        value={newStudent.classId.toString()} 
                        onValueChange={(value) => setNewStudent({...newStudent, classId: parseInt(value)})}
                      >
                        <SelectTrigger className="h-8 text-sm border-gray-300">
                          <SelectValue placeholder="Selecteer klas" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="0" className="text-black hover:bg-blue-100 focus:bg-blue-200">Geen klas</SelectItem>
                          {classes.map((cls: StudentClass) => (
                            <SelectItem key={cls.id} value={cls.id.toString()} className="text-black hover:bg-blue-100 focus:bg-blue-200">
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="guardian" className="space-y-4 min-h-[400px]">
                <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                  <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Voogd Informatie
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="guardianId" className="text-xs font-medium text-gray-700">Voogd</Label>
                      <Select 
                        value={newStudent.guardianId.toString()} 
                        onValueChange={(value) => setNewStudent({...newStudent, guardianId: parseInt(value)})}
                      >
                        <SelectTrigger className="h-8 text-sm border-gray-300">
                          <SelectValue placeholder="Selecteer voogd" />
                        </SelectTrigger>
                        <SelectContent className="bg-white">
                          <SelectItem value="0" className="text-black hover:bg-blue-100 focus:bg-blue-200">Geen voogd</SelectItem>
                          {guardians.map((guardian: Guardian) => (
                            <SelectItem key={guardian.id} value={guardian.id.toString()} className="text-black hover:bg-blue-100 focus:bg-blue-200">
                              {guardian.firstName} {guardian.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="emergencyContact" className="text-xs font-medium text-gray-700">Noodcontact</Label>
                      <Input
                        id="emergencyContact"
                        value={newStudent.emergencyContact}
                        onChange={(e) => setNewStudent({...newStudent, emergencyContact: e.target.value})}
                        className="h-8 text-sm"
                        placeholder="Noodcontact informatie"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setShowCreateDialog(false);
                resetForm();
              }}
              className="mr-2"
            >
              Annuleren
            </Button>
            <Button 
              type="submit"
              onClick={handleCreateStudent}
              disabled={createStudentMutation.isPending}
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6"
            >
              <Plus className="h-4 w-4 mr-2" />
              {createStudentMutation.isPending ? 'Student Toevoegen...' : 'Student Toevoegen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Student Dialog - Admin Style */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">Student Details</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  {selectedStudent ? `Bekijk alle details van ${selectedStudent.firstName} ${selectedStudent.lastName}` : ""}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedStudent && (
            <div className="py-4">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="personal" className="flex items-center gap-2 text-xs">
                    <User className="h-3.5 w-3.5" />
                    <span>Persoonlijk</span>
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex items-center gap-2 text-xs">
                    <Phone className="h-3.5 w-3.5" />
                    <span>Contact</span>
                  </TabsTrigger>
                  <TabsTrigger value="academic" className="flex items-center gap-2 text-xs">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Onderwijs</span>
                  </TabsTrigger>
                  <TabsTrigger value="guardian" className="flex items-center gap-2 text-xs">
                    <Users className="h-3.5 w-3.5" />
                    <span>Voogden</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Persoonlijke Informatie
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Student ID</Label>
                        <p className="text-sm text-gray-900 mt-1 font-medium">{selectedStudent.studentId}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Volledige Naam</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Geslacht</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedStudent.gender}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Geboortedatum</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('nl-NL') : 'Niet opgegeven'}
                        </p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Status</Label>
                        <div className="mt-1">{getStatusBadge(selectedStudent.status)}</div>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Inschrijfdatum</Label>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(selectedStudent.createdAt).toLocaleDateString('nl-NL')}
                        </p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Informatie
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Email</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedStudent.email || 'Niet opgegeven'}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Telefoon</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedStudent.phone || 'Niet opgegeven'}</p>
                      </div>
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Noodcontact</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedStudent.emergencyContact || 'Niet opgegeven'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="academic" className="space-y-4">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Onderwijsgegevens
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Huidige Klas</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedStudent.className || 'Geen klas toegewezen'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="guardian" className="space-y-4">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <Users className="h-4 w-4 mr-2" />
                      Voogd Informatie
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs font-medium text-gray-700">Voogd</Label>
                        <p className="text-sm text-gray-900 mt-1">{selectedStudent.guardianName || 'Geen voogd toegewezen'}</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-gray-200">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Sluiten
            </Button>
            {selectedStudent && (
              <Button 
                onClick={() => {
                  setShowViewDialog(false);
                  handleEditStudent(selectedStudent);
                }}
                className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white"
              >
                <Edit className="h-4 w-4 mr-2" />
                Bewerken
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Student Dialog - Admin Style */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                <Edit className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">Student Bewerken</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  {selectedStudent ? `Bewerk gegevens van ${selectedStudent.firstName} ${selectedStudent.lastName}` : "Bewerk studentgegevens"}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedStudent && (
            <div className="py-4">
              <Tabs defaultValue="personal" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="personal" className="flex items-center gap-2 text-xs">
                    <User className="h-3.5 w-3.5" />
                    <span>Persoonlijk</span>
                  </TabsTrigger>
                  <TabsTrigger value="contact" className="flex items-center gap-2 text-xs">
                    <Phone className="h-3.5 w-3.5" />
                    <span>Contact</span>
                  </TabsTrigger>
                  <TabsTrigger value="academic" className="flex items-center gap-2 text-xs">
                    <GraduationCap className="h-3.5 w-3.5" />
                    <span>Onderwijs</span>
                  </TabsTrigger>
                  <TabsTrigger value="status" className="flex items-center gap-2 text-xs">
                    <Settings className="h-3.5 w-3.5" />
                    <span>Status</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="personal" className="space-y-4 min-h-[400px]">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <User className="h-4 w-4 mr-2" />
                      Persoonlijke Informatie
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editFirstName" className="text-xs font-medium text-gray-700">
                          Voornaam <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="editFirstName"
                          value={newStudent.firstName}
                          onChange={(e) => setNewStudent({...newStudent, firstName: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Voornaam"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editLastName" className="text-xs font-medium text-gray-700">
                          Achternaam <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="editLastName"
                          value={newStudent.lastName}
                          onChange={(e) => setNewStudent({...newStudent, lastName: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Achternaam"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editDateOfBirth" className="text-xs font-medium text-gray-700">
                          Geboortedatum <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          id="editDateOfBirth"
                          type="date"
                          value={newStudent.dateOfBirth}
                          onChange={(e) => setNewStudent({...newStudent, dateOfBirth: e.target.value})}
                          className="h-8 text-sm"
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editGender" className="text-xs font-medium text-gray-700">
                          Geslacht <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={newStudent.gender} 
                          onValueChange={(value) => setNewStudent({...newStudent, gender: value})}
                          required
                        >
                          <SelectTrigger className="h-8 text-sm border-gray-300">
                            <SelectValue placeholder="Selecteer geslacht" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="Man" className="text-black hover:bg-blue-100 focus:bg-blue-200">Man</SelectItem>
                            <SelectItem value="Vrouw" className="text-black hover:bg-blue-100 focus:bg-blue-200">Vrouw</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="contact" className="space-y-4 min-h-[400px]">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <Phone className="h-4 w-4 mr-2" />
                      Contact Informatie
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editEmail" className="text-xs font-medium text-gray-700">Email</Label>
                        <Input
                          id="editEmail"
                          type="email"
                          value={newStudent.email}
                          onChange={(e) => setNewStudent({...newStudent, email: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="student@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editPhone" className="text-xs font-medium text-gray-700">Telefoon</Label>
                        <Input
                          id="editPhone"
                          value={newStudent.phone}
                          onChange={(e) => setNewStudent({...newStudent, phone: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="06-12345678"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editEmergencyContact" className="text-xs font-medium text-gray-700">Noodcontact</Label>
                        <Input
                          id="editEmergencyContact"
                          value={newStudent.emergencyContact}
                          onChange={(e) => setNewStudent({...newStudent, emergencyContact: e.target.value})}
                          className="h-8 text-sm"
                          placeholder="Noodcontact informatie"
                        />
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="academic" className="space-y-4 min-h-[400px]">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <GraduationCap className="h-4 w-4 mr-2" />
                      Onderwijsgegevens
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editClassId" className="text-xs font-medium text-gray-700">Klas</Label>
                        <Select 
                          value={newStudent.classId.toString()} 
                          onValueChange={(value) => setNewStudent({...newStudent, classId: parseInt(value)})}
                        >
                          <SelectTrigger className="h-8 text-sm border-gray-300">
                            <SelectValue placeholder="Selecteer klas" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="0" className="text-black hover:bg-blue-100 focus:bg-blue-200">Geen klas</SelectItem>
                            {classes.map((cls: StudentClass) => (
                              <SelectItem key={cls.id} value={cls.id.toString()} className="text-black hover:bg-blue-100 focus:bg-blue-200">
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="editGuardianId" className="text-xs font-medium text-gray-700">Voogd</Label>
                        <Select 
                          value={newStudent.guardianId.toString()} 
                          onValueChange={(value) => setNewStudent({...newStudent, guardianId: parseInt(value)})}
                        >
                          <SelectTrigger className="h-8 text-sm border-gray-300">
                            <SelectValue placeholder="Selecteer voogd" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="0" className="text-black hover:bg-blue-100 focus:bg-blue-200">Geen voogd</SelectItem>
                            {guardians.map((guardian: Guardian) => (
                              <SelectItem key={guardian.id} value={guardian.id.toString()} className="text-black hover:bg-blue-100 focus:bg-blue-200">
                                {guardian.firstName} {guardian.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="status" className="space-y-4 min-h-[400px]">
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <Settings className="h-4 w-4 mr-2" />
                      Status & Instellingen
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="editStatus" className="text-xs font-medium text-gray-700">Status</Label>
                        <Select 
                          value={newStudent.status} 
                          onValueChange={(value) => setNewStudent({...newStudent, status: value})}
                        >
                          <SelectTrigger className="h-8 text-sm border-gray-300">
                            <SelectValue placeholder="Selecteer status" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="active" className="text-black hover:bg-blue-100 focus:bg-blue-200">Actief</SelectItem>
                            <SelectItem value="inactive" className="text-black hover:bg-blue-100 focus:bg-blue-200">Inactief</SelectItem>
                            <SelectItem value="suspended" className="text-black hover:bg-blue-100 focus:bg-blue-200">Geschorst</SelectItem>
                            <SelectItem value="graduated" className="text-black hover:bg-blue-100 focus:bg-blue-200">Afgestudeerd</SelectItem>
                            <SelectItem value="withdrawn" className="text-black hover:bg-blue-100 focus:bg-blue-200">Teruggetrokken</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}

          <DialogFooter className="pt-4 border-t border-gray-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowEditDialog(false)}
              className="mr-2"
            >
              Annuleren
            </Button>
            <Button 
              type="submit"
              onClick={handleUpdateStudent}
              disabled={updateStudentMutation.isPending}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white px-6"
            >
              <Save className="h-4 w-4 mr-2" />
              {updateStudentMutation.isPending ? 'Wijzigingen Opslaan...' : 'Wijzigingen Opslaan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog - Admin Style */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader className="pb-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                <Trash2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold text-gray-900">Student Verwijderen</DialogTitle>
                <DialogDescription className="text-sm text-gray-600 mt-1">
                  Deze actie kan niet ongedaan worden gemaakt
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="py-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">Waarschuwing</h4>
                  <p className="text-sm text-red-700">
                    {selectedStudent && 
                      `Weet je zeker dat je ${selectedStudent.firstName} ${selectedStudent.lastName} permanent wilt verwijderen? Alle gerelateerde gegevens worden ook verwijderd.`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-gray-200">
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="mr-2"
            >
              Annuleren
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleConfirmDelete}
              disabled={deleteStudentMutation.isPending}
              className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {deleteStudentMutation.isPending ? 'Verwijderen...' : 'Definitief Verwijderen'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}