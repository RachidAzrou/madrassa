import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, PlusCircle, Filter, Download, Eye, Edit, Trash2, X, UserCircle,
  ChevronUp, ChevronDown, FileText, FileDown, Mail, Home, BookOpen, Phone,
  Users, User, MapPin, GraduationCap, UsersRound, Pencil, Trash, ChevronRight
} from 'lucide-react';
import { Topbar } from '@/components/layout/topbar';
import { PremiumHeader } from '@/components/layout/premium-header';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { format, parseISO } from 'date-fns';
import { nl } from 'date-fns/locale';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Begin pagina component
export default function Students() {
  // State hooks
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [filterStudentGroup, setFilterStudentGroup] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isCreateGuardianDialogOpen, setIsCreateGuardianDialogOpen] = useState(false);
  const [isLinkGuardianDialogOpen, setIsLinkGuardianDialogOpen] = useState(false);
  const [selectedGuardianId, setSelectedGuardianId] = useState("");
  const [guardianRelationType, setGuardianRelationType] = useState("parent");
  const [isEmergencyContact, setIsEmergencyContact] = useState(false);
  const [viewTab, setViewTab] = useState("info");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    studentId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: null,
    address: "",
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    programId: "",
    yearLevel: "",
    enrollmentDate: "",
    status: "active",
    notes: "",
    schoolYear: "",
    studentGroupId: "",
    gender: "man"
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Data fetching
  const { data: studentsData = {}, isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/students'],
  });
  
  const { data: programsData = {} } = useQuery({
    queryKey: ['/api/programs'],
  });
  
  const { data: studentGroupsData = {} } = useQuery({
    queryKey: ['/api/student-groups'],
  });
  
  const { data: guardianData = {} } = useQuery({
    queryKey: ['/api/guardians'],
  });

  // Formulier reset functie
  const resetForm = () => {
    setFormData({
      studentId: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      dateOfBirth: null,
      address: "",
      street: "",
      houseNumber: "",
      postalCode: "",
      city: "",
      programId: "",
      yearLevel: "",
      enrollmentDate: "",
      status: "active",
      notes: "",
      schoolYear: "",
      studentGroupId: "",
      gender: "man"
    });
  };

  // Form change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Select change handlers
  const handleSelectChange = (name, value) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (data) => {
      return fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error('Er is een fout opgetreden bij het aanmaken van de student');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "Student aangemaakt",
        description: "De student is succesvol aangemaakt."
      });
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Update student mutation
  const updateStudentMutation = useMutation({
    mutationFn: (data) => {
      return fetch(`/api/students/${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error('Er is een fout opgetreden bij het bijwerken van de student');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Student bijgewerkt",
        description: "De student is succesvol bijgewerkt."
      });
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Delete student mutation
  const deleteStudentMutation = useMutation({
    mutationFn: () => {
      return fetch(`/api/students/${selectedStudent.id}`, {
        method: 'DELETE'
      }).then(res => {
        if (!res.ok) throw new Error('Er is een fout opgetreden bij het verwijderen van de student');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Student verwijderd",
        description: "De student is succesvol verwijderd."
      });
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Link guardian mutation
  const linkGuardianMutation = useMutation({
    mutationFn: (data) => {
      return fetch('/api/student-guardians', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(res => {
        if (!res.ok) throw new Error('Er is een fout opgetreden bij het koppelen van de voogd');
        return res.json();
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setIsLinkGuardianDialogOpen(false);
      toast({
        title: "Voogd gekoppeld",
        description: "De voogd is succesvol gekoppeld aan de student."
      });
    },
    onError: (error) => {
      toast({
        title: "Fout",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Event handlers
  const handleCreateStudent = (e) => {
    e.preventDefault();
    createStudentMutation.mutate(formData);
  };

  const handleUpdateStudent = (e) => {
    e.preventDefault();
    updateStudentMutation.mutate(formData);
  };

  const handleDeleteStudent = () => {
    deleteStudentMutation.mutate();
  };

  const handleLinkGuardian = (e) => {
    e.preventDefault();
    if (!selectedGuardianId) {
      toast({
        title: "Fout",
        description: "Selecteer een voogd om te koppelen",
        variant: "destructive"
      });
      return;
    }

    linkGuardianMutation.mutate({
      studentId: selectedStudent.id,
      guardianId: selectedGuardianId,
      relationshipType: guardianRelationType,
      isEmergencyContact: isEmergencyContact
    });
  };

  const handleViewStudent = (student) => {
    setSelectedStudent(student);
    setViewTab("info");
    setIsViewDialogOpen(true);
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setFormData({
      studentId: student.studentId,
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email || "",
      phone: student.phone || "",
      dateOfBirth: student.dateOfBirth || null,
      address: student.address || "",
      street: student.street || "",
      houseNumber: student.houseNumber || "",
      postalCode: student.postalCode || "",
      city: student.city || "",
      programId: student.programId?.toString() || "",
      yearLevel: student.yearLevel?.toString() || "",
      enrollmentDate: student.enrollmentDate || "",
      status: student.status || "active",
      notes: student.notes || "",
      schoolYear: student.schoolYear || "",
      studentGroupId: student.studentGroupId?.toString() || "",
      gender: student.gender || "man"
    });
    setIsEditDialogOpen(true);
  };

  const handleDeleteStudentClick = (student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const formatDateToDisplayFormat = (dateString) => {
    if (!dateString) return "";
    try {
      return format(parseISO(dateString), 'P', { locale: nl });
    } catch (error) {
      return dateString;
    }
  };

  // Get available guardians (those not already linked to the student)
  const getAvailableGuardians = () => {
    if (!selectedStudent || !guardianData.guardians) return [];
    
    const linkedGuardianIds = (selectedStudent.guardians || []).map(g => g.id);
    return guardianData.guardians.filter(g => !linkedGuardianIds.includes(g.id));
  };

  // Filtering logic
  const filteredStudents = () => {
    if (!studentsData.students) return [];
    
    return studentsData.students.filter(student => {
      const matchesSearch = 
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = filterStatus === "all" || student.status === filterStatus;
      
      const matchesProgram = filterProgram === "all" || 
        (student.programId && student.programId.toString() === filterProgram);
      
      const matchesStudentGroup = filterStudentGroup === "all" || 
        (student.studentGroupId && student.studentGroupId.toString() === filterStudentGroup);
      
      return matchesSearch && matchesStatus && matchesProgram && matchesStudentGroup;
    });
  };

  // Programs and student groups arrays
  const programs = programsData.programs || [];
  const studentGroups = studentGroupsData.studentGroups || [];

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
      {/* Top navigation bar */}
      {/* Professionele header component */}
      <PremiumHeader 
        title="Studenten" 
        description="Bekijk en beheer alle studentgegevens"
        icon={Users}
        breadcrumbs={{
          parent: "Beheer",
          current: "Studenten"
        }}
      />
      
      <div className="container mx-auto p-4 max-w-7xl">
        <div className="flex justify-end mb-6">
          <Button 
            variant="default" 
            size="default" 
            className="bg-[#1e40af] hover:bg-[#1e40af]/90"
            onClick={() => {
              resetForm();
              setIsCreateDialogOpen(true);
            }}
          >
            <PlusCircle className="mr-2 h-4 w-4" /> Student Toevoegen
          </Button>
        </div>

        <div className="mb-6 flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              type="text"
              placeholder="Zoek op naam, ID of email..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex-initial w-full md:w-auto flex flex-wrap gap-2">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="active">Actief</SelectItem>
                <SelectItem value="inactive">Inactief</SelectItem>
                <SelectItem value="graduated">Afgestudeerd</SelectItem>
                <SelectItem value="withdrawn">Teruggetrokken</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterProgram} onValueChange={setFilterProgram}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Programma" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle programma's</SelectItem>
                {programs.map((program) => (
                  <SelectItem key={program.id} value={program.id.toString()}>
                    {program.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={filterStudentGroup} onValueChange={setFilterStudentGroup}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Klassengroep" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle klassengroepen</SelectItem>
                {studentGroups.map((group) => (
                  <SelectItem key={group.id} value={group.id.toString()}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Student Table */}
        <div className="bg-white rounded-md border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Naam</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden md:table-cell">Programma</TableHead>
                <TableHead className="hidden md:table-cell">Status</TableHead>
                <TableHead className="text-right">Acties</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {studentsLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Studenten laden...
                  </TableCell>
                </TableRow>
              ) : filteredStudents().length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Geen studenten gevonden
                  </TableCell>
                </TableRow>
              ) : (
                filteredStudents().map((student) => {
                  const program = programs.find(p => p.id === student.programId);
                  return (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.studentId}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarFallback className="bg-[#1e40af] text-white">
                              {student.firstName[0]}{student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            {student.firstName} {student.lastName}
                            {student.guardians && student.guardians.length > 0 && (
                              <div className="text-xs text-gray-500">
                                {student.guardians.length} voogd(en)
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {student.email || "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {program ? program.name : "-"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={
                          student.status === 'active' ? 'default' : 
                          student.status === 'inactive' ? 'secondary' :
                          student.status === 'graduated' ? 'success' : 'destructive'
                        }>
                          {student.status === 'active' ? 'Actief' : 
                           student.status === 'inactive' ? 'Inactief' :
                           student.status === 'graduated' ? 'Afgestudeerd' : 'Teruggetrokken'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleViewStudent(student)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditStudent(student)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteStudentClick(student)}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Student Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="text-[#1e40af]">Student Toevoegen</DialogTitle>
            <DialogDescription>
              Voeg een nieuwe student toe aan het systeem.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateStudent}>
            <Tabs defaultValue="handmatig" className="mt-2">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="handmatig">Handmatig</TabsTrigger>
                <TabsTrigger value="eid">e-ID Kaart</TabsTrigger>
                <TabsTrigger value="itsme">itsme®</TabsTrigger>
              </TabsList>
              
              <TabsContent value="handmatig">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="studentId">Student ID</Label>
                    <Input
                      id="studentId"
                      name="studentId"
                      value={formData.studentId}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gender">Geslacht</Label>
                    <Select 
                      value={formData.gender} 
                      onValueChange={(value) => handleSelectChange('gender', value)}
                      required
                    >
                      <SelectTrigger className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]">
                        <SelectValue placeholder="Selecteer geslacht" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="man">Man</SelectItem>
                        <SelectItem value="vrouw">Vrouw</SelectItem>
                        <SelectItem value="anders">Anders</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Voornaam</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Achternaam</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefoon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Geboortedatum</Label>
                    <Input
                      id="dateOfBirth"
                      name="dateOfBirth"
                      type="date"
                      value={formData.dateOfBirth || ""}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="programId">Programma</Label>
                    <Select 
                      value={formData.programId} 
                      onValueChange={(value) => handleSelectChange('programId', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]">
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="yearLevel">Jaar Niveau</Label>
                    <Select 
                      value={formData.yearLevel} 
                      onValueChange={(value) => handleSelectChange('yearLevel', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]">
                        <SelectValue placeholder="Selecteer niveau" />
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="studentGroupId">Klassengroep</Label>
                    <Select 
                      value={formData.studentGroupId} 
                      onValueChange={(value) => handleSelectChange('studentGroupId', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]">
                        <SelectValue placeholder="Selecteer klassengroep" />
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="enrollmentDate">Inschrijvingsdatum</Label>
                    <Input
                      id="enrollmentDate"
                      name="enrollmentDate"
                      type="date"
                      value={formData.enrollmentDate || ""}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(value) => handleSelectChange('status', value)}
                    >
                      <SelectTrigger className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]">
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actief</SelectItem>
                        <SelectItem value="inactive">Inactief</SelectItem>
                        <SelectItem value="graduated">Afgestudeerd</SelectItem>
                        <SelectItem value="withdrawn">Teruggetrokken</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label htmlFor="street">Straat</Label>
                    <Input
                      id="street"
                      name="street"
                      value={formData.street}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="houseNumber">Huisnummer</Label>
                    <Input
                      id="houseNumber"
                      name="houseNumber"
                      value={formData.houseNumber}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postcode</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={formData.postalCode}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="city">Stad</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]"
                    />
                  </div>
                  
                  <div className="col-span-1 md:col-span-2 space-y-2">
                    <Label htmlFor="notes">Notities</Label>
                    <Textarea
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      rows={3}
                      className="border-gray-300 focus:border-[#1e40af] focus:ring-[#1e40af]"
                    />
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="eid">
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#77CC9A] rounded-lg flex items-center justify-center text-white mx-auto mb-4">
                      <span className="font-bold text-2xl">eID</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Identificatie via e-ID kaart</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Sluit uw kaartlezer aan en plaats uw e-ID kaart om automatisch gegevens in te lezen.
                    </p>
                    
                    <div className="flex flex-col items-center">
                      <div className="w-64 h-36 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-6">
                        <div className="text-center text-gray-500">
                          <User className="w-12 h-12 mx-auto text-gray-300" />
                          <p className="text-xs mt-1">e-ID kaart hier plaatsen</p>
                        </div>
                      </div>
                      
                      <Button 
                        className="bg-[#1e40af] hover:bg-[#1e40af]/90 mb-2"
                        disabled
                      >
                        Gegevens Inlezen
                      </Button>
                      <p className="text-xs text-gray-500">Kaartlezer niet gedetecteerd</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="itsme">
                <div className="p-6 space-y-6">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[#FF4D27] rounded-lg flex items-center justify-center text-white mx-auto mb-4">
                      <span className="font-bold text-lg">itsme®</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Identificatie via itsme®</h3>
                    <p className="text-sm text-gray-500 mb-6">
                      Gebruik de itsme® app op uw smartphone om snel en veilig te identificeren.
                    </p>
                    
                    <div className="max-w-sm mx-auto space-y-6">
                      <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                        <ol className="list-decimal list-inside text-sm text-gray-600 space-y-3">
                          <li>Open de itsme® app op uw smartphone</li>
                          <li>Klik op de knop hieronder om de identificatie te starten</li>
                          <li>Scan de QR-code die verschijnt met uw itsme® app</li>
                          <li>Bevestig uw identiteit in de app</li>
                        </ol>
                      </div>
                      
                      <Button className="bg-[#FF4D27] hover:bg-[#FF4D27]/90 w-full">
                        Identificeren met itsme®
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-6 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Annuleren
              </Button>
              <Button type="submit" className="bg-[#1e40af] hover:bg-[#1e40af]/90">
                {createStudentMutation.isPending ? "Bezig met opslaan..." : "Student Toevoegen"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Student Dialog */}
      {selectedStudent && (
        <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-[#1e40af] text-white">
                    {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                {selectedStudent.firstName} {selectedStudent.lastName}
              </DialogTitle>
              <DialogDescription>
                Student ID: {selectedStudent.studentId}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={viewTab} onValueChange={setViewTab} className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="info">Informatie</TabsTrigger>
                <TabsTrigger value="guardians">Voogden</TabsTrigger>
                <TabsTrigger value="enrollments">Inschrijvingen</TabsTrigger>
              </TabsList>
              
              <TabsContent value="info" className="mt-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium text-gray-700">Email</p>
                    <p className="mt-1">{selectedStudent.email || "Niet ingevuld"}</p>
                  </div>
                  
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium text-gray-700">Telefoon</p>
                    <p className="mt-1">{selectedStudent.phone || "Niet ingevuld"}</p>
                  </div>
                  
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium text-gray-700">Geboortedatum</p>
                    <p className="mt-1">{selectedStudent.dateOfBirth ? formatDateToDisplayFormat(selectedStudent.dateOfBirth) : "Niet ingevuld"}</p>
                  </div>
                  
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium text-gray-700">Geslacht</p>
                    <p className="mt-1">
                      {selectedStudent.gender === 'man' ? 'Man' : 
                       selectedStudent.gender === 'vrouw' ? 'Vrouw' : 
                       selectedStudent.gender === 'anders' ? 'Anders' : 'Niet ingevuld'}
                    </p>
                  </div>
                  
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-700">Adres</p>
                    <p className="mt-1">
                      {selectedStudent.street ? `${selectedStudent.street} ${selectedStudent.houseNumber || ''}, ${selectedStudent.postalCode || ''} ${selectedStudent.city || ''}` : "Niet ingevuld"}
                    </p>
                  </div>
                  
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium text-gray-700">Programma</p>
                    <p className="mt-1">
                      {programs.find(p => p.id === selectedStudent.programId)?.name || "Niet ingevuld"}
                    </p>
                  </div>
                  
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium text-gray-700">Jaar Niveau</p>
                    <p className="mt-1">{selectedStudent.yearLevel ? `Jaar ${selectedStudent.yearLevel}` : "Niet ingevuld"}</p>
                  </div>
                  
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium text-gray-700">Klassengroep</p>
                    <p className="mt-1">
                      {studentGroups.find(g => g.id === selectedStudent.studentGroupId)?.name || "Niet ingevuld"}
                    </p>
                  </div>
                  
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium text-gray-700">Inschrijvingsdatum</p>
                    <p className="mt-1">{selectedStudent.enrollmentDate ? formatDateToDisplayFormat(selectedStudent.enrollmentDate) : "Niet ingevuld"}</p>
                  </div>
                  
                  <div className="md:col-span-1">
                    <p className="text-sm font-medium text-gray-700">Status</p>
                    <p className="mt-1">
                      <Badge variant={
                        selectedStudent.status === 'active' ? 'default' : 
                        selectedStudent.status === 'inactive' ? 'secondary' :
                        selectedStudent.status === 'graduated' ? 'success' : 'destructive'
                      }>
                        {selectedStudent.status === 'active' ? 'Actief' : 
                         selectedStudent.status === 'inactive' ? 'Inactief' :
                         selectedStudent.status === 'graduated' ? 'Afgestudeerd' : 'Teruggetrokken'}
                      </Badge>
                    </p>
                  </div>
                  
                  <div className="md:col-span-3">
                    <p className="text-sm font-medium text-gray-700">Notities</p>
                    <p className="mt-1 text-sm text-gray-600 whitespace-pre-line">
                      {selectedStudent.notes || "Geen notities"}
                    </p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="guardians" className="mt-4">
                <div className="flex justify-end mb-4 gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setIsLinkGuardianDialogOpen(true);
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Bestaande Voogd Koppelen
                  </Button>
                  
                  <Button 
                    className="bg-[#1e40af] hover:bg-[#1e40af]/90"
                    size="sm"
                    onClick={() => {
                      setIsCreateGuardianDialogOpen(true);
                    }}
                  >
                    <PlusCircle className="mr-2 h-4 w-4" /> Nieuwe Voogd Toevoegen
                  </Button>
                </div>
                
                {selectedStudent.guardians && selectedStudent.guardians.length > 0 ? (
                  <div className="space-y-4">
                    {selectedStudent.guardians.map((guardian) => (
                      <div key={guardian.id} className="bg-gray-50 p-4 rounded-md border">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium">{guardian.firstName} {guardian.lastName}</h3>
                            <p className="text-sm text-gray-600">{guardian.relationshipType || "Niet gespecificeerd"}</p>
                            
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1">
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Mail className="h-3.5 w-3.5 text-gray-500" />
                                <span>{guardian.email || "Geen email"}</span>
                              </div>
                              
                              <div className="flex items-center gap-1 text-sm text-gray-600">
                                <Phone className="h-3.5 w-3.5 text-gray-500" />
                                <span>{guardian.phone || "Geen telefoon"}</span>
                              </div>
                              
                              {guardian.address && (
                                <div className="flex items-center gap-1 text-sm text-gray-600 md:col-span-2">
                                  <Home className="h-3.5 w-3.5 text-gray-500" />
                                  <span>{guardian.address}</span>
                                </div>
                              )}
                            </div>
                            
                            {guardian.isEmergencyContact && (
                              <Badge variant="outline" className="mt-2 bg-amber-50 text-amber-700 border-amber-200">
                                Noodcontact
                              </Badge>
                            )}
                          </div>
                          
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              // Hier zou je een functie kunnen toevoegen om de voogd te bewerken
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              // Hier zou je een functie kunnen toevoegen om de voogd te ontkoppelen
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserCircle className="mx-auto h-12 w-12 text-gray-300" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">Geen voogden</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      Deze student heeft nog geen gekoppelde voogden.
                    </p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="enrollments" className="mt-4">
                {/* Je zou hier inschrijvingsgegevens kunnen tonen */}
                <div className="text-center py-8">
                  <BookOpen className="mx-auto h-12 w-12 text-gray-300" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Inschrijvingsgegevens</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Hier komen de details van de inschrijvingen.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      )}

      {/* Edit Student Dialog */}
      {selectedStudent && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Student Bewerken</DialogTitle>
              <DialogDescription>
                Bewerk de gegevens van {selectedStudent.firstName} {selectedStudent.lastName}.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleUpdateStudent}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="studentId">Student ID</Label>
                  <Input
                    id="studentId"
                    name="studentId"
                    value={formData.studentId}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="gender">Geslacht</Label>
                  <Select 
                    value={formData.gender} 
                    onValueChange={(value) => handleSelectChange('gender', value)}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer geslacht" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="man">Man</SelectItem>
                      <SelectItem value="vrouw">Vrouw</SelectItem>
                      <SelectItem value="anders">Anders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="firstName">Voornaam</Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Achternaam</Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Telefoon</Label>
                  <Input
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="dateOfBirth">Geboortedatum</Label>
                  <Input
                    id="dateOfBirth"
                    name="dateOfBirth"
                    type="date"
                    value={formData.dateOfBirth || ""}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="programId">Programma</Label>
                  <Select 
                    value={formData.programId} 
                    onValueChange={(value) => handleSelectChange('programId', value)}
                  >
                    <SelectTrigger>
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
                
                <div className="space-y-2">
                  <Label htmlFor="yearLevel">Jaar Niveau</Label>
                  <Select 
                    value={formData.yearLevel} 
                    onValueChange={(value) => handleSelectChange('yearLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer niveau" />
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
                
                <div className="space-y-2">
                  <Label htmlFor="studentGroupId">Klassengroep</Label>
                  <Select 
                    value={formData.studentGroupId} 
                    onValueChange={(value) => handleSelectChange('studentGroupId', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer klassengroep" />
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
                
                <div className="space-y-2">
                  <Label htmlFor="enrollmentDate">Inschrijvingsdatum</Label>
                  <Input
                    id="enrollmentDate"
                    name="enrollmentDate"
                    type="date"
                    value={formData.enrollmentDate || ""}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select 
                    value={formData.status} 
                    onValueChange={(value) => handleSelectChange('status', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actief</SelectItem>
                      <SelectItem value="inactive">Inactief</SelectItem>
                      <SelectItem value="graduated">Afgestudeerd</SelectItem>
                      <SelectItem value="withdrawn">Teruggetrokken</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="street">Straat</Label>
                  <Input
                    id="street"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="houseNumber">Huisnummer</Label>
                  <Input
                    id="houseNumber"
                    name="houseNumber"
                    value={formData.houseNumber}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postcode</Label>
                  <Input
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="city">Stad</Label>
                  <Input
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </div>
                
                <div className="col-span-1 md:col-span-2 space-y-2">
                  <Label htmlFor="notes">Notities</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows={3}
                  />
                </div>
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button type="submit" className="bg-[#1e40af] hover:bg-[#1e40af]/90">
                  {updateStudentMutation.isPending ? "Bezig met opslaan..." : "Wijzigingen Opslaan"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Student Dialog */}
      {selectedStudent && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Student Verwijderen</DialogTitle>
              <DialogDescription>
                Weet je zeker dat je {selectedStudent.firstName} {selectedStudent.lastName} wilt verwijderen? 
                Deze actie kan niet ongedaan worden gemaakt.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                Annuleren
              </Button>
              <Button 
                type="button" 
                variant="destructive"
                onClick={handleDeleteStudent}
              >
                {deleteStudentMutation.isPending ? "Bezig met verwijderen..." : "Student Verwijderen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Link Guardian Dialog */}
      {selectedStudent && (
        <Dialog open={isLinkGuardianDialogOpen} onOpenChange={setIsLinkGuardianDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Voogd Koppelen aan {selectedStudent.firstName} {selectedStudent.lastName}</DialogTitle>
              <DialogDescription>
                Koppel een bestaande voogd aan deze student.
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleLinkGuardian}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="guardianId">Voogd</Label>
                  <Select 
                    value={selectedGuardianId} 
                    onValueChange={setSelectedGuardianId}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer een voogd" />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableGuardians().map((guardian) => (
                        <SelectItem key={guardian.id} value={guardian.id.toString()}>
                          {guardian.firstName} {guardian.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="relationshipType">Relatie</Label>
                  <Select 
                    value={guardianRelationType} 
                    onValueChange={setGuardianRelationType}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecteer relatietype" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parent">Ouder</SelectItem>
                      <SelectItem value="guardian">Voogd</SelectItem>
                      <SelectItem value="family">Familie</SelectItem>
                      <SelectItem value="other">Anders</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isEmergencyContact"
                    checked={isEmergencyContact}
                    onChange={(e) => setIsEmergencyContact(e.target.checked)}
                    className="rounded border-gray-300 text-[#1e40af] focus:ring-[#1e40af]"
                  />
                  <Label htmlFor="isEmergencyContact" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Noodcontact
                  </Label>
                </div>
              </div>
              
              <DialogFooter className="gap-2">
                <Button type="button" variant="outline" onClick={() => setIsLinkGuardianDialogOpen(false)}>
                  Annuleren
                </Button>
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => {
                    setIsLinkGuardianDialogOpen(false);
                    setIsCreateGuardianDialogOpen(true);
                  }}
                >
                  Nieuwe Voogd
                </Button>
                <Button type="submit" className="bg-[#1e40af] hover:bg-[#1e40af]/90">
                  Voogd Koppelen
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      {/* Create Guardian Dialog zou hier kunnen worden toegevoegd */}
    </div>
  );
}