import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Search, PlusCircle, Filter, Download, Users, User, Camera,
  Fingerprint, ChevronRight, Edit, Trash2, Eye, Home,
  GraduationCap, NotebookText, MapPin
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

export default function Students() {
  // State hooks
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterProgram, setFilterProgram] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const currentYear = new Date().getFullYear();
  const [nextStudentId, setNextStudentId] = useState(`ST${currentYear}001`);
  const [formData, setFormData] = useState({
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
  });
  
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

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    try {
      // Student would be created here
      console.log('Creating student:', formData);
      setIsCreateDialogOpen(false);
      toast({
        title: "Student toegevoegd",
        description: "De student is succesvol toegevoegd."
      });
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

  const formatDateToDisplayFormat = (dateString) => {
    if (!dateString) return "";
    try {
      return format(parseISO(dateString), 'P', { locale: nl });
    } catch (error) {
      return dateString;
    }
  };

  // Dummy data for testing
  const students = [
    {
      id: 1,
      studentId: "STU-001",
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.j@example.com",
      phone: "0123456789",
      programId: 1,
      programName: "Computer Science",
      status: "active",
      photoUrl: ""
    },
    {
      id: 2,
      studentId: "STU-002",
      firstName: "Michael",
      lastName: "Brown",
      email: "michael.b@example.com",
      phone: "0123456789",
      programId: 2,
      programName: "Business Administration",
      status: "active",
      photoUrl: ""
    }
  ];

  const programs = [
    { id: 1, name: "Computer Science" },
    { id: 2, name: "Business Administration" }
  ];

  const studentGroups = [
    { id: 1, name: "Group A" },
    { id: 2, name: "Group B" }
  ];

  return (
    <div className="bg-[#f7f9fc] min-h-screen">
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
            onClick={() => setIsCreateDialogOpen(true)}
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
              ) : students.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
                    Geen studenten gevonden.
                  </TableCell>
                </TableRow>
              ) : (
                students.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell className="font-medium">{student.studentId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          {student.photoUrl ? (
                            <AvatarImage src={student.photoUrl} alt={`${student.firstName} ${student.lastName}`} />
                          ) : (
                            <AvatarFallback className="bg-[#1e40af] text-white">
                              {student.firstName.charAt(0)}{student.lastName.charAt(0)}
                            </AvatarFallback>
                          )}
                        </Avatar>
                        <span>{student.firstName} {student.lastName}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{student.email}</TableCell>
                    <TableCell className="hidden md:table-cell">{student.programName}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge 
                        variant={student.status === 'active' ? 'default' : 
                               student.status === 'inactive' ? 'secondary' : 
                               student.status === 'graduated' ? 'success' : 'outline'
                        }
                        className={student.status === 'active' ? 'bg-green-100 text-green-800 hover:bg-green-100' : 
                                 student.status === 'inactive' ? 'bg-gray-100 text-gray-800 hover:bg-gray-100' : 
                                 student.status === 'graduated' ? 'bg-blue-100 text-blue-800 hover:bg-blue-100' : ''
                        }
                      >
                        {student.status === 'active' ? 'Actief' : 
                         student.status === 'inactive' ? 'Inactief' : 
                         student.status === 'graduated' ? 'Afgestudeerd' : 
                         student.status === 'withdrawn' ? 'Teruggetrokken' : student.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleViewStudent(student)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditStudent(student)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => handleDeleteStudentClick(student)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Student Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden max-h-[90vh]">
          <div className="bg-[#1e40af] py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <User className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">Student Toevoegen</DialogTitle>
                <DialogDescription className="text-white/70 text-sm m-0">
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
                          >
                            <img src="/images/beid-logo.png" alt="eID" className="h-5" />
                            <span className="text-xs font-medium text-gray-700">eID</span>
                          </button>
                          <button 
                            type="button" 
                            className="flex items-center justify-center gap-1 border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm"
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
                            `ST${formData.academicYear.split('-')[0]}001` : 
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
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder="Selecteer geslacht" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="man">Man</SelectItem>
                            <SelectItem value="vrouw">Vrouw</SelectItem>
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
                        <Label htmlFor="dateOfBirth" className="text-xs font-medium text-gray-700">Geboortedatum</Label>
                        <Input
                          id="dateOfBirth"
                          name="dateOfBirth"
                          type="date"
                          value={formData.dateOfBirth || ''}
                          onChange={handleInputChange}
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
                        <Label htmlFor="street" className="text-xs font-medium text-gray-700">Straat</Label>
                        <Input
                          id="street"
                          name="street"
                          value={formData.street}
                          onChange={handleInputChange}
                          className="mt-1 h-9"
                          placeholder="Straat"
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="houseNumber" className="text-xs font-medium text-gray-700">Huisnummer</Label>
                        <Input
                          id="houseNumber"
                          name="houseNumber"
                          value={formData.houseNumber}
                          onChange={handleInputChange}
                          className="mt-1 h-9"
                          placeholder="Nr."
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="postalCode" className="text-xs font-medium text-gray-700">Postcode</Label>
                        <Input
                          id="postalCode"
                          name="postalCode"
                          value={formData.postalCode}
                          onChange={handleInputChange}
                          className="mt-1 h-9"
                          placeholder="Postcode"
                        />
                      </div>
                      
                      <div className="md:col-span-2">
                        <Label htmlFor="city" className="text-xs font-medium text-gray-700">Plaats</Label>
                        <Input
                          id="city"
                          name="city"
                          value={formData.city}
                          onChange={handleInputChange}
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
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder="Selecteer schooljaar" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="2024-2025">2024-2025</SelectItem>
                            <SelectItem value="2025-2026">2025-2026</SelectItem>
                            <SelectItem value="2026-2027">2026-2027</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div>
                        <Label htmlFor="studentGroupId" className="text-xs font-medium text-gray-700">Klas *</Label>
                        <Select 
                          value={formData.studentGroupId} 
                          onValueChange={(value) => handleSelectChange('studentGroupId', value)}
                          required
                        >
                          <SelectTrigger className="mt-1 h-9">
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
                          <SelectTrigger className="mt-1 h-9">
                            <SelectValue placeholder="Selecteer status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="enrolled">Ingeschreven</SelectItem>
                            <SelectItem value="unenrolled">Uitgeschreven</SelectItem>
                            <SelectItem value="suspended">Geschorst</SelectItem>
                            <SelectItem value="graduated">Afgestudeerd</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-[#f1f5f9] px-4 py-3 rounded-md h-full flex flex-col">
                    <h3 className="text-sm font-medium text-[#1e40af] mb-3 flex items-center">
                      <NotebookText className="h-4 w-4 mr-2" />
                      Aantekeningen
                    </h3>
                    <div className="flex-grow flex flex-col">
                      <Textarea
                        id="notes"
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                        rows={8}
                        className="resize-none flex-grow"
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
                onClick={() => setIsCreateDialogOpen(false)}
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

      {/* Delete Student Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col items-center gap-2 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mb-2">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <DialogTitle className="text-center">Student Verwijderen</DialogTitle>
              <DialogDescription className="text-center">
                Weet je zeker dat je deze student wilt verwijderen? 
                Dit kan niet ongedaan worden gemaakt.
              </DialogDescription>
            </div>
            
            {selectedStudent && (
              <div className="bg-gray-50 rounded-md p-4 mb-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
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
                    <p className="text-sm text-gray-500">{selectedStudent.studentId}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
              >
                Annuleren
              </Button>
              <Button 
                type="button"
                variant="destructive"
                onClick={() => {
                  setIsDeleteDialogOpen(false);
                  toast({
                    title: "Student verwijderd",
                    description: "De student is succesvol verwijderd."
                  });
                }}
              >
                Verwijderen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}