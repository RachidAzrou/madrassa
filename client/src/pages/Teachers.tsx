import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import { Pencil, Trash2, Search, Plus, PlusCircle, Eye, User, Phone, MapPin, Briefcase, Save, Loader2, GraduationCap, Book, X, UserCircle, Users, Upload, Image, BookText, XCircle, LucideIcon, School, Download, FileUp } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { formatDateToDisplayFormat } from "@/lib/utils";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import EmptyState from "@/components/ui/empty-state";

const Teachers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // State for teacher form data
  const [newTeacher, setNewTeacher] = useState({
    teacherId: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    isActive: true,
    street: "",
    houseNumber: "",
    postalCode: "",
    city: "",
    dateOfBirth: "",
    gender: "man",
    notes: "",
    certifications: [],
    languages: [],
    specialties: [],
    educationLevel: "",
    yearsOfExperience: "",
    assignedClasses: [],
    profession: "",
    educations: []
  });
  
  // State voor het toevoegen van specialties, certifications, languages, classes
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newCertification, setNewCertification] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [newClassName, setNewClassName] = useState("");
  const [newClassDescription, setNewClassDescription] = useState("");
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [selectedTeachers, setSelectedTeachers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Fetch next teacher ID
  const { data: nextTeacherIdData, isLoading: isLoadingNextId } = useQuery({
    queryKey: ['/api/next-teacher-id'],
    enabled: isCreateDialogOpen, // Only fetch when create dialog is opened
  });
  
  useEffect(() => {
    if (nextTeacherIdData?.nextTeacherId && isCreateDialogOpen) {
      setNewTeacher({ ...newTeacher, teacherId: nextTeacherIdData.nextTeacherId });
    }
  }, [nextTeacherIdData, isCreateDialogOpen]);
  
  // Fetch teachers data
  const { data: teachersData, isLoading } = useQuery({
    queryKey: ['/api/teachers'],
  });
  
  // Create teacher mutation
  const createTeacherMutation = useMutation({
    mutationFn: (teacherData) => {
      return apiRequest('/api/teachers', {
        method: 'POST',
        body: teacherData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setIsCreateDialogOpen(false);
      setNewTeacher({
        teacherId: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        isActive: true,
        street: "",
        houseNumber: "",
        postalCode: "",
        city: "",
        dateOfBirth: "",
        gender: "man",
        notes: "",
        certifications: [],
        languages: [],
        specialties: [],
        educationLevel: "",
        yearsOfExperience: "",
        assignedClasses: [],
        profession: "",
        educations: []
      });
      toast({
        title: "Docent toegevoegd",
        description: "De docent is succesvol toegevoegd aan het systeem.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij toevoegen",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Update teacher mutation
  const updateTeacherMutation = useMutation({
    mutationFn: (teacherData) => {
      return apiRequest(`/api/teachers/${teacherData.id}`, {
        method: 'PUT',
        body: teacherData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setIsEditDialogOpen(false);
      toast({
        title: "Docent bijgewerkt",
        description: "De docent is succesvol bijgewerkt in het systeem.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij bijwerken",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: (id) => {
      return apiRequest(`/api/teachers/${id}`, {
        method: 'DELETE',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      setIsDeleteDialogOpen(false);
      setSelectedTeacher(null);
      toast({
        title: "Docent verwijderd",
        description: "De docent is succesvol verwijderd uit het systeem.",
      });
    },
    onError: (error) => {
      toast({
        title: "Fout bij verwijderen",
        description: `Er is een fout opgetreden: ${error.message}`,
        variant: "destructive",
      });
    },
  });
  
  // Handle create teacher
  const handleCreateTeacher = () => {
    setIsSubmitting(true);
    
    // Validation
    if (!newTeacher.firstName || !newTeacher.lastName || !newTeacher.email || !newTeacher.phone) {
      toast({
        title: "Ontbrekende velden",
        description: "Vul alle verplichte velden in (voornaam, achternaam, e-mail, telefoonnummer).",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }
    
    createTeacherMutation.mutate(newTeacher);
  };
  
  // Handle edit teacher
  const handleEditTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setIsEditDialogOpen(true);
  };
  
  // Handle update teacher
  const handleUpdateTeacher = () => {
    if (!selectedTeacher.firstName || !selectedTeacher.lastName || !selectedTeacher.email || !selectedTeacher.phone) {
      toast({
        title: "Ontbrekende velden",
        description: "Vul alle verplichte velden in (voornaam, achternaam, e-mail, telefoonnummer).",
        variant: "destructive",
      });
      return;
    }
    
    updateTeacherMutation.mutate(selectedTeacher);
  };
  
  // Handle delete teacher
  const handleDeleteTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };
  
  // Handle view teacher
  const handleViewTeacher = (teacher) => {
    setSelectedTeacher(teacher);
    setIsViewDialogOpen(true);
  };
  
  // Export to Excel
  const handleExportToExcel = () => {
    if (!teachersData?.teachers || teachersData.teachers.length === 0) {
      toast({
        title: "Geen gegevens om te exporteren",
        description: "Er zijn geen docenten om te exporteren.",
        variant: "destructive",
      });
      return;
    }
    
    // Prepare data for export
    const exportData = teachersData.teachers.map(teacher => ({
      'Docent ID': teacher.teacherId,
      'Voornaam': teacher.firstName,
      'Achternaam': teacher.lastName,
      'E-mail': teacher.email,
      'Telefoonnummer': teacher.phone,
      'Status': teacher.isActive ? 'Actief' : 'Inactief',
      'Adres': `${teacher.street} ${teacher.houseNumber}`,
      'Postcode': teacher.postalCode,
      'Plaats': teacher.city,
      'Geboortedatum': formatDateToDisplayFormat(teacher.dateOfBirth),
      'Opleiding': teacher.educationLevel,
      'Ervaring (jaren)': teacher.yearsOfExperience,
    }));
    
    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Docenten');
    
    // Save file
    XLSX.writeFile(workbook, 'docenten_export.xlsx');
    
    toast({
      title: "Export voltooid",
      description: "De docentengegevens zijn geëxporteerd naar Excel.",
    });
  };
  
  // Apply filters and search
  const filteredTeachers = teachersData?.teachers
    ? teachersData.teachers.filter(teacher => {
        const matchesStatus = statusFilter === 'all' || 
                             (statusFilter === 'active' && teacher.isActive) || 
                             (statusFilter === 'inactive' && !teacher.isActive);
                             
        const matchesSearch = searchQuery === '' || 
                             teacher.firstName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             teacher.lastName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             teacher.teacherId.toLowerCase().includes(searchQuery.toLowerCase());
                             
        return matchesStatus && matchesSearch;
      })
    : [];
    
  // Pagination
  const paginatedTeachers = filteredTeachers.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  const totalPages = Math.ceil(filteredTeachers.length / rowsPerPage);
  
  // Handle select all teachers
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allIds = filteredTeachers.map(teacher => teacher.id);
      setSelectedTeachers(allIds);
    } else {
      setSelectedTeachers([]);
    }
  };
  
  // Handle select individual teacher
  const handleSelectTeacher = (id) => {
    if (selectedTeachers.includes(id)) {
      setSelectedTeachers(selectedTeachers.filter(teacherId => teacherId !== id));
    } else {
      setSelectedTeachers([...selectedTeachers, id]);
    }
  };
  
  // Utility function to render status badge
  const renderStatusBadge = (isActive) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Actief</Badge>;
    } else {
      return <Badge variant="outline" className="text-gray-500">Inactief</Badge>;
    }
  };

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col space-y-4">
        <h1 className="text-2xl font-bold">Docenten</h1>
        
        {/* Search and Filter Section */}
        <div className="flex flex-col space-y-4">
          <div className="flex flex-col space-y-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                placeholder="Zoek op naam, e-mail of ID..."
                className="w-full pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="h-8 w-[180px]">
                <SelectValue placeholder="Status filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle statussen</SelectItem>
                <SelectItem value="active">Actief</SelectItem>
                <SelectItem value="inactive">Inactief</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="relative">
              <Button 
                variant="outline" 
                size="default"
                className="border-gray-300 text-gray-700"
                onClick={handleExportToExcel}
              >
                <FileUp className="mr-2 h-4 w-4" /> Exporteren
              </Button>
            </div>
            
            <Button
              variant="default" 
              size="default" 
              className="bg-primary hover:bg-primary/90 ml-auto"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Nieuwe docent
            </Button>
          </div>
        </div>
        
        {/* Teachers Table */}
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 uppercase text-xs">
              <tr>
                <th className="py-3 px-4 font-medium text-left">
                  <Checkbox 
                    checked={selectedTeachers.length === filteredTeachers.length && filteredTeachers.length > 0} 
                    onCheckedChange={handleSelectAll} 
                  />
                </th>
                <th className="py-3 px-4 font-medium text-left">ID</th>
                <th className="py-3 px-4 font-medium text-left">NAAM</th>
                <th className="py-3 px-4 font-medium text-left">E-MAIL</th>
                <th className="py-3 px-4 font-medium text-left">TELEFOONNUMMER</th>
                <th className="py-3 px-4 font-medium text-left">STATUS</th>
                <th className="py-3 px-4 font-medium text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-4 text-center">Gegevens laden...</td>
                </tr>
              ) : paginatedTeachers.length > 0 ? (
                paginatedTeachers.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <Checkbox 
                        checked={selectedTeachers.includes(teacher.id)} 
                        onCheckedChange={() => handleSelectTeacher(teacher.id)} 
                      />
                    </td>
                    <td className="py-3 px-4 font-medium">{teacher.teacherId}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-[#1e3a8a] text-white">
                            {teacher.firstName[0]}{teacher.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{teacher.firstName} {teacher.lastName}</p>
                          <p className="text-xs text-gray-500">{teacher.assignedClasses?.length || 0} klassen</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">{teacher.email}</td>
                    <td className="py-3 px-4">{teacher.phone}</td>
                    <td className="py-3 px-4">{renderStatusBadge(teacher.isActive)}</td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleViewTeacher(teacher)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditTeacher(teacher)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive"
                          onClick={() => handleDeleteTeacher(teacher)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8">
                    <EmptyState 
                      icon={<Users className="h-10 w-10 text-gray-400" />}
                      title="Geen docenten gevonden"
                      description="Er zijn geen docenten die overeenkomen met je zoekcriteria."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {filteredTeachers.length > rowsPerPage && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Weergave {(currentPage - 1) * rowsPerPage + 1} tot {Math.min(currentPage * rowsPerPage, filteredTeachers.length)} van {filteredTeachers.length} docenten
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Vorige
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Volgende
              </Button>
            </div>
          </div>
        )}
      </div>
      
      {/* View Teacher Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[85vw] p-0">
          <DialogHeader className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    {selectedTeacher?.firstName} {selectedTeacher?.lastName}
                  </DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <DialogDescription className="text-sm text-blue-100 font-medium">
                      Docentgegevens bekijken
                    </DialogDescription>
                    <Badge className="bg-white/20 text-white border-transparent hover:bg-white/30">
                      {selectedTeacher?.isActive ? 'Actief' : 'Inactief'}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Button
                type="button"
                variant="ghost"
                className="text-white hover:bg-blue-700 hover:text-white"
                onClick={() => setIsViewDialogOpen(false)}
              >
                <X className="h-4 w-4 mr-2" />
                Sluiten
              </Button>
            </div>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto" style={{ height: "calc(80vh - 170px)" }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Basisinformatie</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Docent ID</p>
                      <p className="font-medium">{selectedTeacher?.teacherId || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Status</p>
                      <p>{renderStatusBadge(selectedTeacher?.isActive)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Voornaam</p>
                      <p className="font-medium">{selectedTeacher?.firstName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Achternaam</p>
                      <p className="font-medium">{selectedTeacher?.lastName || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Geslacht</p>
                      <p className="font-medium">{selectedTeacher?.gender === "man" ? "Man" : "Vrouw"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Geboortedatum</p>
                      <p className="font-medium">{selectedTeacher?.dateOfBirth ? formatDateToDisplayFormat(selectedTeacher.dateOfBirth) : "-"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Contactgegevens</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">E-mail</p>
                      <p className="font-medium">{selectedTeacher?.email || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Telefoonnummer</p>
                      <p className="font-medium">{selectedTeacher?.phone || "-"}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Adresgegevens</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Straat</p>
                      <p className="font-medium">{selectedTeacher?.street || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Huisnummer</p>
                      <p className="font-medium">{selectedTeacher?.houseNumber || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Postcode</p>
                      <p className="font-medium">{selectedTeacher?.postalCode || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Plaats</p>
                      <p className="font-medium">{selectedTeacher?.city || "-"}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Professionele informatie</h3>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Opleidingsniveau</p>
                      <p className="font-medium">{selectedTeacher?.educationLevel || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Jaren ervaring</p>
                      <p className="font-medium">{selectedTeacher?.yearsOfExperience || "0"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Specialisaties</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTeacher?.specialties && selectedTeacher.specialties.length > 0 ? (
                          selectedTeacher.specialties.map((specialty, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-full">
                              {specialty}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Certificeringen</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTeacher?.certifications && selectedTeacher.certifications.length > 0 ? (
                          selectedTeacher.certifications.map((cert, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded-full">
                              {cert}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Talen</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTeacher?.languages && selectedTeacher.languages.length > 0 ? (
                          selectedTeacher.languages.map((lang, index) => (
                            <span key={index} className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-full">
                              {lang}
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Toegewezen klassen</h3>
                  <div className="grid grid-cols-1 gap-3">
                    {selectedTeacher?.assignedClasses && selectedTeacher.assignedClasses.length > 0 ? (
                      selectedTeacher.assignedClasses.map((cls, index) => (
                        <div key={index} className="p-2 bg-gray-50 rounded border border-gray-200">
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-xs text-gray-500">{cls.description}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">Geen klassen toegewezen</p>
                    )}
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Notities</h3>
                  <p className="text-sm text-gray-700 whitespace-pre-line min-h-[60px]">
                    {selectedTeacher?.notes || "Geen notities"}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter className="px-6 py-4 border-t">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Sluiten
            </Button>
            <Button 
              onClick={() => {
                setIsViewDialogOpen(false);
                handleEditTeacher(selectedTeacher);
              }}
              className="bg-[#1e3a8a] hover:bg-[#1e3a8a]/80"
            >
              <Pencil className="mr-2 h-4 w-4" />
              Bewerken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Teacher Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] p-0">
          <DialogHeader className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold text-white">
                    Nieuwe docent
                  </DialogTitle>
                  <DialogDescription className="text-sm text-blue-100 font-medium">
                    Vul alle benodigde informatie in om een nieuwe docent toe te voegen
                  </DialogDescription>
                </div>
              </div>
              

            </div>
          </DialogHeader>
          
          <div className="p-6 overflow-y-auto" style={{ height: "calc(80vh - 170px)" }}>
            <Tabs defaultValue="personal" className="w-full">
              <TabsList className="grid grid-cols-6 p-1 bg-[#1e3a8a]/10 rounded-md mb-4">
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
                <TabsTrigger value="professional" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                  <Briefcase className="h-4 w-4" />
                  <span>Professioneel</span>
                </TabsTrigger>
                <TabsTrigger value="subjects" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                  <Book className="h-4 w-4" />
                  <span>Vakken</span>
                </TabsTrigger>
                <TabsTrigger value="classes" className="flex items-center gap-1 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm px-3">
                  <ChalkBoard className="h-4 w-4" />
                  <span>Klassen</span>
                </TabsTrigger>
              </TabsList>
              
              {/* Persoonlijke informatie tab */}
              <TabsContent value="personal" className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="text-xs">Voornaam *</Label>
                    <Input 
                      id="firstName" 
                      className="h-9" 
                      value={newTeacher.firstName} 
                      onChange={(e) => setNewTeacher({...newTeacher, firstName: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="text-xs">Achternaam *</Label>
                    <Input 
                      id="lastName" 
                      className="h-9" 
                      value={newTeacher.lastName} 
                      onChange={(e) => setNewTeacher({...newTeacher, lastName: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender" className="text-xs">Geslacht *</Label>
                    <Select value={newTeacher.gender} onValueChange={(value) => setNewTeacher({...newTeacher, gender: value})}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecteer geslacht" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="man">Man</SelectItem>
                        <SelectItem value="vrouw">Vrouw</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth" className="text-xs">Geboortedatum</Label>
                    <Input 
                      id="dateOfBirth" 
                      type="date" 
                      className="h-9" 
                      value={newTeacher.dateOfBirth} 
                      onChange={(e) => setNewTeacher({...newTeacher, dateOfBirth: e.target.value})} 
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Contact tab */}
              <TabsContent value="contact" className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-xs">E-mail *</Label>
                    <Input 
                      id="email" 
                      type="email" 
                      className="h-9" 
                      value={newTeacher.email} 
                      onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-xs">Telefoonnummer *</Label>
                    <Input 
                      id="phone" 
                      className="h-9" 
                      value={newTeacher.phone} 
                      onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})} 
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Adres tab */}
              <TabsContent value="address" className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street" className="text-xs">Straat</Label>
                    <Input 
                      id="street" 
                      className="h-9" 
                      value={newTeacher.street} 
                      onChange={(e) => setNewTeacher({...newTeacher, street: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="houseNumber" className="text-xs">Huisnummer</Label>
                    <Input 
                      id="houseNumber" 
                      className="h-9" 
                      value={newTeacher.houseNumber} 
                      onChange={(e) => setNewTeacher({...newTeacher, houseNumber: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode" className="text-xs">Postcode</Label>
                    <Input 
                      id="postalCode" 
                      className="h-9" 
                      value={newTeacher.postalCode} 
                      onChange={(e) => setNewTeacher({...newTeacher, postalCode: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city" className="text-xs">Plaats</Label>
                    <Input 
                      id="city" 
                      className="h-9" 
                      value={newTeacher.city} 
                      onChange={(e) => setNewTeacher({...newTeacher, city: e.target.value})} 
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Professioneel tab */}
              <TabsContent value="professional" className="space-y-3">
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="educationLevel" className="text-xs">Opleidingsniveau</Label>
                    <Select value={newTeacher.educationLevel} onValueChange={(value) => setNewTeacher({...newTeacher, educationLevel: value})}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="Selecteer opleidingsniveau" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mbo">MBO</SelectItem>
                        <SelectItem value="hbo">HBO</SelectItem>
                        <SelectItem value="wo">WO</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience" className="text-xs">Jaren ervaring</Label>
                    <Input 
                      id="yearsOfExperience" 
                      type="number" 
                      className="h-9" 
                      value={newTeacher.yearsOfExperience} 
                      onChange={(e) => setNewTeacher({...newTeacher, yearsOfExperience: e.target.value})} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="notes" className="text-xs">Notities</Label>
                    <Textarea 
                      id="notes" 
                      className="min-h-[100px]" 
                      value={newTeacher.notes} 
                      onChange={(e) => setNewTeacher({...newTeacher, notes: e.target.value})} 
                    />
                  </div>
                </div>
              </TabsContent>
              
              {/* Vakken tab */}
              <TabsContent value="subjects" className="space-y-3">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Specialisaties</Label>
                    <div className="flex flex-wrap gap-2">
                      {newTeacher.specialties.map((specialty, index) => (
                        <Badge key={index} className="bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-1">
                          {specialty}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() => {
                              const updatedSpecialties = [...newTeacher.specialties];
                              updatedSpecialties.splice(index, 1);
                              setNewTeacher({...newTeacher, specialties: updatedSpecialties});
                            }}
                          />
                        </Badge>
                      ))}
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (newSpecialty.trim()) {
                            setNewTeacher({
                              ...newTeacher,
                              specialties: [...newTeacher.specialties, newSpecialty]
                            });
                            setNewSpecialty("");
                          }
                        }}
                      >
                        <Input
                          placeholder="Nieuwe specialisatie"
                          className="h-9 w-48"
                          value={newSpecialty}
                          onChange={(e) => setNewSpecialty(e.target.value)}
                        />
                        <Button type="submit" size="sm" className="h-9">Toevoegen</Button>
                      </form>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Certificeringen</Label>
                    <div className="flex flex-wrap gap-2">
                      {newTeacher.certifications.map((cert, index) => (
                        <Badge key={index} className="bg-green-100 text-green-700 hover:bg-green-200 px-3 py-1">
                          {cert}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() => {
                              const updatedCerts = [...newTeacher.certifications];
                              updatedCerts.splice(index, 1);
                              setNewTeacher({...newTeacher, certifications: updatedCerts});
                            }}
                          />
                        </Badge>
                      ))}
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (newCertification.trim()) {
                            setNewTeacher({
                              ...newTeacher,
                              certifications: [...newTeacher.certifications, newCertification]
                            });
                            setNewCertification("");
                          }
                        }}
                      >
                        <Input
                          placeholder="Nieuwe certificering"
                          className="h-9 w-48"
                          value={newCertification}
                          onChange={(e) => setNewCertification(e.target.value)}
                        />
                        <Button type="submit" size="sm" className="h-9">Toevoegen</Button>
                      </form>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Talen</Label>
                    <div className="flex flex-wrap gap-2">
                      {newTeacher.languages.map((lang, index) => (
                        <Badge key={index} className="bg-purple-100 text-purple-700 hover:bg-purple-200 px-3 py-1">
                          {lang}
                          <X
                            className="h-3 w-3 ml-1 cursor-pointer"
                            onClick={() => {
                              const updatedLangs = [...newTeacher.languages];
                              updatedLangs.splice(index, 1);
                              setNewTeacher({...newTeacher, languages: updatedLangs});
                            }}
                          />
                        </Badge>
                      ))}
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (newLanguage.trim()) {
                            setNewTeacher({
                              ...newTeacher,
                              languages: [...newTeacher.languages, newLanguage]
                            });
                            setNewLanguage("");
                          }
                        }}
                      >
                        <Input
                          placeholder="Nieuwe taal"
                          className="h-9 w-48"
                          value={newLanguage}
                          onChange={(e) => setNewLanguage(e.target.value)}
                        />
                        <Button type="submit" size="sm" className="h-9">Toevoegen</Button>
                      </form>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Klassen tab */}
              <TabsContent value="classes" className="space-y-3">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Toegewezen klassen</Label>
                    <div className="flex flex-wrap gap-2">
                      {newTeacher.assignedClasses.map((cls, index) => (
                        <div key={index} className="bg-gray-50 border border-gray-200 rounded p-2 w-full sm:w-[calc(50%-8px)]">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">{cls.name}</p>
                              <p className="text-xs text-gray-500">{cls.description}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const updatedClasses = [...newTeacher.assignedClasses];
                                updatedClasses.splice(index, 1);
                                setNewTeacher({...newTeacher, assignedClasses: updatedClasses});
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      <form
                        className="flex flex-col gap-2 w-full"
                        onSubmit={(e) => {
                          e.preventDefault();
                          if (newClassName.trim() && newClassDescription.trim()) {
                            setNewTeacher({
                              ...newTeacher,
                              assignedClasses: [
                                ...newTeacher.assignedClasses, 
                                { name: newClassName, description: newClassDescription }
                              ]
                            });
                            setNewClassName("");
                            setNewClassDescription("");
                          }
                        }}
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <Input
                            placeholder="Naam van de klas"
                            className="h-9"
                            value={newClassName}
                            onChange={(e) => setNewClassName(e.target.value)}
                          />
                          <Input
                            placeholder="Beschrijving"
                            className="h-9"
                            value={newClassDescription}
                            onChange={(e) => setNewClassDescription(e.target.value)}
                          />
                        </div>
                        <Button type="submit" className="w-full sm:w-auto">Klas toevoegen</Button>
                      </form>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <div className="px-6 py-4 border-t flex justify-end gap-2">
            <Button onClick={handleCreateTeacher} disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Bezig met opslaan...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Docent toevoegen
                </>
              )}
            </Button>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuleren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Verwijderbevestiging Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-destructive flex items-center">
              <Trash2 className="mr-2 h-5 w-5" />
              Docent verwijderen
            </DialogTitle>
            <DialogDescription>
              Weet u zeker dat u de volgende docent wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          
          {selectedTeacher && (
            <div className="bg-gray-50 border border-gray-200 rounded-md p-3 mb-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#1e3a8a] text-white">
                    {selectedTeacher.firstName[0]}{selectedTeacher.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{selectedTeacher.firstName} {selectedTeacher.lastName}</p>
                  <p className="text-sm text-gray-600">{selectedTeacher.email}</p>
                  <p className="text-xs text-gray-500">ID: {selectedTeacher.teacherId}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteTeacherMutation.mutate(selectedTeacher?.id)}
              disabled={deleteTeacherMutation.isPending}
            >
              {deleteTeacherMutation.isPending ? "Bezig met verwijderen..." : "Verwijderen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teachers;