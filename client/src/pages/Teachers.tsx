import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import { Pencil, Trash2, Search, Plus, PlusCircle, Eye, User, Phone, MapPin, Briefcase, BookOpen, GraduationCap, Book, X, UserCircle, Users, Upload, Image, BookText, XCircle, LucideIcon, School, Download } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PremiumHeader } from "@/components/layout/premium-header";
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
  const [teacherFormData, setTeacherFormData] = useState({
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
    educationLevel: "Bachelor",
    yearsOfExperience: 0,
    documents: [],
    availability: [],
    assignedCourses: [],
    assignedClasses: [],
    profession: "",
    educations: []
  });
  
  // State for search and filters
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [statusFilter, setStatusFilter] = useState("all");
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  
  // Fetch next teacher ID
  const { data: nextTeacherIdData, isLoading: isLoadingNextId } = useQuery({
    queryKey: ['/api/next-teacher-id'],
    enabled: isCreateDialogOpen, // Only fetch when create dialog is opened
  });
  
  useEffect(() => {
    if (nextTeacherIdData?.nextTeacherId && isCreateDialogOpen) {
      setTeacherFormData(prev => ({
        ...prev,
        teacherId: nextTeacherIdData.nextTeacherId
      }));
    }
  }, [nextTeacherIdData, isCreateDialogOpen]);
  
  // Fetch teachers data
  const { data: teachersData = {}, isLoading, isError } = useQuery({
    queryKey: ['/api/teachers', statusFilter, searchQuery, currentPage, rowsPerPage],
  });
  
  // Create teacher mutation
  const createTeacherMutation = useMutation({
    mutationFn: (teacherData: any) => apiRequest('/api/teachers', 'POST', teacherData),
    onSuccess: () => {
      toast({
        title: "Docent toegevoegd",
        description: "De nieuwe docent is succesvol toegevoegd aan het systeem.",
      });
      setIsCreateDialogOpen(false);
      setTeacherFormData({
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
        educationLevel: "Bachelor",
        yearsOfExperience: 0,
        documents: [],
        availability: [],
        assignedCourses: [],
        assignedClasses: [],
        profession: "",
        educations: []
      });
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({queryKey: ['/api/teachers']});
    },
    onError: (error: any) => {
      console.error("Error creating teacher:", error);
      toast({
        title: "Fout bij toevoegen",
        description: error?.message || "Er is een fout opgetreden bij het toevoegen van de docent.",
        variant: "destructive",
      });
    },
  });
  
  // Update teacher mutation
  const updateTeacherMutation = useMutation({
    mutationFn: (teacherData: any) => apiRequest(`/api/teachers/${teacherData.id}`, 'PUT', teacherData),
    onSuccess: () => {
      toast({
        title: "Docent bijgewerkt",
        description: "De docent is succesvol bijgewerkt in het systeem.",
      });
      setIsEditDialogOpen(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({queryKey: ['/api/teachers']});
    },
    onError: (error: any) => {
      console.error("Error updating teacher:", error);
      toast({
        title: "Fout bij bijwerken",
        description: error?.message || "Er is een fout opgetreden bij het bijwerken van de docent.",
        variant: "destructive",
      });
    },
  });
  
  // Delete teacher mutation
  const deleteTeacherMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/teachers/${id}`, 'DELETE'),
    onSuccess: () => {
      toast({
        title: "Docent verwijderd",
        description: "De docent is succesvol verwijderd uit het systeem.",
      });
      setIsDeleteDialogOpen(false);
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({queryKey: ['/api/teachers']});
    },
    onError: (error: any) => {
      console.error("Error deleting teacher:", error);
      toast({
        title: "Fout bij verwijderen",
        description: error?.message || "Er is een fout opgetreden bij het verwijderen van de docent.",
        variant: "destructive",
      });
    },
  });
  
  // Handlers
  const handleCreateTeacher = () => {
    const payload = {
      ...teacherFormData,
    };
    
    console.log("Add new teacher", payload);
    createTeacherMutation.mutate(payload);
  };
  
  const handleUpdateTeacher = () => {
    if (!selectedTeacher?.id) return;
    
    const payload = {
      ...teacherFormData,
      id: selectedTeacher.id
    };
    
    updateTeacherMutation.mutate(payload);
  };
  
  const handleDeleteTeacher = () => {
    if (!selectedTeacher?.id) return;
    deleteTeacherMutation.mutate(selectedTeacher.id);
  };
  
  // Functies voor selecteren van docenten
  const handleSelectTeacher = (teacherId: number) => {
    setSelectedTeachers(prev => 
      prev.includes(teacherId) 
        ? prev.filter(id => id !== teacherId) 
        : [...prev, teacherId]
    );
  };
  
  const handleSelectAll = (checked: boolean) => {
    if (checked && teachersData?.teachers) {
      // Selecteer alle docenten
      setSelectedTeachers(teachersData.teachers.map((teacher: any) => teacher.id));
    } else {
      // Deselecteer alle docenten
      setSelectedTeachers([]);
    }
  };
  
  const handleDeleteMultipleTeachers = () => {
    // Implementeer verwijderen van meerdere docenten
    if (selectedTeachers.length === 0) return;
    
    // Bevestigingsdialoog tonen
    if (window.confirm(`Weet je zeker dat je ${selectedTeachers.length} docent(en) wilt verwijderen?`)) {
      // Voer verwijderingen uit één voor één
      Promise.all(selectedTeachers.map(id => 
        apiRequest(`/api/teachers/${id}`, 'DELETE')
      ))
      .then(() => {
        toast({
          title: "Docenten verwijderd",
          description: `${selectedTeachers.length} docent(en) succesvol verwijderd.`,
        });
        setSelectedTeachers([]);
        queryClient.invalidateQueries({queryKey: ['/api/teachers']});
      })
      .catch(error => {
        console.error("Error deleting teachers:", error);
        toast({
          title: "Fout bij verwijderen",
          description: "Er is een fout opgetreden bij het verwijderen van de docenten.",
          variant: "destructive",
        });
      });
    }
  };
  
  const handleViewTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsViewDialogOpen(true);
  };
  
  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    setTeacherFormData({
      teacherId: teacher.teacherId,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      email: teacher.email,
      phone: teacher.phone,
      isActive: teacher.isActive,
      street: teacher.street,
      houseNumber: teacher.houseNumber,
      postalCode: teacher.postalCode,
      city: teacher.city,
      dateOfBirth: teacher.dateOfBirth,
      gender: teacher.gender,
      notes: teacher.notes,
      certifications: teacher.certifications,
      languages: teacher.languages,
      specialties: teacher.specialties,
      educationLevel: teacher.educationLevel,
      yearsOfExperience: teacher.yearsOfExperience,
      documents: teacher.documents,
      availability: teacher.availability,
      assignedCourses: teacher.assignedCourses,
      assignedClasses: teacher.assignedClasses,
      profession: teacher.profession || "",
      educations: teacher.educations || []
    });
    setIsEditDialogOpen(true);
  };
  
  // Functie om status als badge te renderen
  const renderStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-transparent">Actief</Badge>;
    } else {
      return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-transparent">Inactief</Badge>;
    }
  };
  
  // Helper voor exporteren naar Excel
  const handleExportExcel = () => {
    if (!teachersData?.teachers || teachersData.teachers.length === 0) {
      toast({
        title: "Geen gegevens beschikbaar",
        description: "Er zijn geen docenten om te exporteren.",
        variant: "destructive",
      });
      return;
    }
    
    // Map data voor export
    const exportData = teachersData.teachers.map((teacher: any) => ({
      "ID": teacher.teacherId,
      "Voornaam": teacher.firstName,
      "Achternaam": teacher.lastName,
      "E-mail": teacher.email,
      "Telefoonnummer": teacher.phone,
      "Status": teacher.isActive ? "Actief" : "Inactief",
      "Adres": `${teacher.street} ${teacher.houseNumber}, ${teacher.postalCode} ${teacher.city}`.trim(),
      "Geboortedatum": teacher.dateOfBirth ? formatDateToDisplayFormat(teacher.dateOfBirth) : "",
      "Opleidingsniveau": teacher.educationLevel || "",
      "Jaren ervaring": teacher.yearsOfExperience || "",
      "Notities": teacher.notes || ""
    }));
    
    // Maak een werkblad en workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Docenten");
    
    // Download bestand
    XLSX.writeFile(workbook, "Docenten_Export.xlsx");
    
    toast({
      title: "Export voltooid",
      description: "De docenten zijn succesvol geëxporteerd naar Excel.",
    });
  };
  
  // Calculate pagination info
  const totalItems = teachersData?.count || 0;
  const totalPages = Math.ceil(totalItems / rowsPerPage);
  const startItem = (currentPage - 1) * rowsPerPage + 1;
  const endItem = Math.min(startItem + rowsPerPage - 1, totalItems);
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        {/* Premium header component */}
        <PremiumHeader 
          title="Docenten" 
          path="Beheer > Docenten" 
          icon={GraduationCap} 
        />

        {/* Main content area */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="inline-block animate-spin h-8 w-8 border-4 border-[#1e3a8a] border-t-transparent rounded-full mb-4"></div>
              <p className="text-gray-500">Docenten laden...</p>
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
          title="Docenten" 
          path="Beheer > Docenten" 
          icon={GraduationCap} 
        />

        {/* Main content area */}
        <div className="flex-1 p-6 flex flex-col">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center py-8">
              <XCircle className="mx-auto h-12 w-12 text-red-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Fout bij laden</h3>
              <p className="mt-1 text-gray-500">Er is een fout opgetreden bij het laden van de docenten.</p>
              <div className="mt-6">
                <Button onClick={() => queryClient.invalidateQueries({queryKey: ['/api/teachers']})}>
                  Opnieuw proberen
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium header component */}
      <PremiumHeader 
        title="Docenten" 
        path="Beheer > Docenten" 
        icon={GraduationCap}
        description="Beheer alle docenten en hun gegevens, cursussen en beschikbaarheid"
      />

      {/* Main content area */}
      <div className="px-6 py-6">
        {/* Zoek- en actiebalk - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm mb-4">
          <div className="px-4 py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            {/* Zoekbalk */}
            <div className="relative w-full sm:max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Zoek op naam of docent ID..."
                className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Filters en knoppen */}
            <div className="flex flex-wrap items-center gap-2">
              {selectedTeachers.length > 0 ? (
                <>
                  <span className="text-xs text-gray-500">{selectedTeachers.length} geselecteerd</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedTeachers([])}
                    className="h-7 text-xs rounded-sm"
                  >
                    <X className="h-3.5 w-3.5 mr-1" />
                    Wissen
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteMultipleTeachers}
                    className="h-7 text-xs rounded-sm border-red-300 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="h-3.5 w-3.5 mr-1" />
                    Verwijderen
                  </Button>
                </>
              ) : (
                <>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-32 h-7 text-xs rounded-sm border-[#e5e7eb]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle docenten</SelectItem>
                      <SelectItem value="active">Actief</SelectItem>
                      <SelectItem value="inactive">Inactief</SelectItem>
                    </SelectContent>
                  </Select>
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
                      setTeacherFormData({
                        teacherId: nextTeacherIdData?.nextTeacherId || "",
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
                        educationLevel: "Bachelor",
                        yearsOfExperience: 0,
                        documents: [],
                        availability: [],
                        assignedCourses: [],
                        assignedClasses: [],
                        profession: "",
                        educations: []
                      });
                      setIsCreateDialogOpen(true);
                    }}
                    size="sm"
                    className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    Nieuwe Docent
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabel - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm overflow-hidden">
          {teachersData?.teachers && teachersData.teachers.length > 0 ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-[#f9fafc] border-b border-[#e5e7eb]">
                      <th className="px-4 py-2 text-left">
                        <Checkbox 
                          checked={selectedTeachers.length > 0 && selectedTeachers.length === teachersData.teachers.length}
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
                        <span className="text-xs font-medium text-gray-700">E-mail</span>
                      </th>
                      <th className="px-4 py-2 text-left">
                        <span className="text-xs font-medium text-gray-700">Telefoon</span>
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
                    {teachersData.teachers.map((teacher: any) => (
                      <tr key={teacher.id} className="border-b border-[#e5e7eb] hover:bg-gray-50">
                        <td className="px-4 py-2">
                          <Checkbox 
                            checked={selectedTeachers.includes(teacher.id)}
                            onCheckedChange={() => handleSelectTeacher(teacher.id)}
                            className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
                          />
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-900">{teacher.teacherId}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center">
                            <Avatar className="h-7 w-7 mr-3">
                              <AvatarFallback className="text-xs bg-[#e5e7eb] text-gray-600">
                                {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-xs font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</p>
                              <p className="text-xs text-gray-500">{teacher.gender === 'man' ? 'Man' : 'Vrouw'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500">{teacher.email}</td>
                        <td className="px-4 py-3 text-xs text-gray-500">{teacher.phone}</td>
                        <td className="px-4 py-3">{renderStatusBadge(teacher.isActive)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewTeacher(teacher)}
                              className="h-7 w-7 p-0 text-gray-500"
                            >
                              <Eye className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTeacher(teacher)}
                              className="h-7 w-7 p-0 text-gray-500"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setIsDeleteDialogOpen(true);
                              }}
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
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  >
                    Vorige
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs rounded-sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  >
                    Volgende
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <School className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Geen docenten gevonden</h3>
              <p className="text-gray-500 text-center max-w-md mb-6">
                Er zijn geen docenten die voldoen aan de huidige zoekcriteria. Probeer andere zoek- of filtercriteria of voeg een nieuwe docent toe.
              </p>
              <Button 
                onClick={() => {
                  setTeacherFormData({
                    teacherId: nextTeacherIdData?.nextTeacherId || "",
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
                    educationLevel: "Bachelor",
                    yearsOfExperience: 0,
                    documents: [],
                    availability: [],
                    assignedCourses: [],
                    assignedClasses: [],
                    profession: "",
                    educations: []
                  });
                  setIsCreateDialogOpen(true);
                }}
                className="bg-[#1e40af] hover:bg-[#1e3a8a]"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Nieuwe Docent Toevoegen
              </Button>
            </div>
          )}
        </div>
      </div>
      
      {/* Weergave van docentgegevens Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[85vw] p-0">
          {/* Dialog Header */}
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-medium">
                    {selectedTeacher?.firstName} {selectedTeacher?.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-blue-100">
                      Docentgegevens bekijken
                    </span>
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
          </div>
          
          <div className="p-6">
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
                    <div>
                      <p className="text-xs text-gray-500">Adres</p>
                      <p className="font-medium">
                        {selectedTeacher?.street && selectedTeacher?.houseNumber
                          ? `${selectedTeacher.street} ${selectedTeacher.houseNumber}`
                          : "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Postcode en plaats</p>
                      <p className="font-medium">
                        {selectedTeacher?.postalCode && selectedTeacher?.city
                          ? `${selectedTeacher.postalCode} ${selectedTeacher.city}`
                          : "-"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Professionele informatie</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500">Opleidingsniveau</p>
                      <p className="font-medium">{selectedTeacher?.educationLevel || "-"}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Jaren ervaring</p>
                      <p className="font-medium">{selectedTeacher?.yearsOfExperience || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Certificeringen</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTeacher?.certifications && selectedTeacher.certifications.length > 0
                          ? selectedTeacher.certifications.map((cert: string, index: number) => (
                              <Badge key={index} className="bg-blue-50 text-blue-800 border-transparent">
                                {cert}
                              </Badge>
                            ))
                          : <span className="text-gray-500">-</span>}
                      </div>
                    </div>
                    <div className="col-span-2">
                      <p className="text-xs text-gray-500">Specialiteiten</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTeacher?.specialties && selectedTeacher.specialties.length > 0
                          ? selectedTeacher.specialties.map((spec: string, index: number) => (
                              <Badge key={index} className="bg-green-50 text-green-800 border-transparent">
                                {spec}
                              </Badge>
                            ))
                          : <span className="text-gray-500">-</span>}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-4 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">Notities</h3>
                  <p className="text-sm text-gray-800 whitespace-pre-wrap">
                    {selectedTeacher?.notes || "Geen notities beschikbaar"}
                  </p>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleEditTeacher(selectedTeacher);
                    }}
                  >
                    <Pencil className="h-4 w-4 mr-2" />
                    Bewerken
                  </Button>
                  <Button
                    variant="outline"
                    className="border-red-300 text-red-600 hover:bg-red-50"
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
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Docent toevoegen/bewerken dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
        }
      }}>
        <DialogContent className="sm:max-w-[85vw] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isCreateDialogOpen ? "Nieuwe Docent Toevoegen" : "Docent Bewerken"}
            </DialogTitle>
            <DialogDescription>
              {isCreateDialogOpen 
                ? "Vul de gegevens in om een nieuwe docent toe te voegen aan het systeem." 
                : "Bewerk de gegevens van de geselecteerde docent."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Basisinformatie</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="teacherId">Docent ID</Label>
                    <Input
                      id="teacherId"
                      value={teacherFormData.teacherId}
                      onChange={(e) => setTeacherFormData(prev => ({ ...prev, teacherId: e.target.value }))}
                      className="h-8 text-sm"
                      disabled={isEditDialogOpen}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="isActive">Status</Label>
                    <Select
                      value={teacherFormData.isActive ? "active" : "inactive"}
                      onValueChange={(value) => setTeacherFormData(prev => ({ ...prev, isActive: value === "active" }))}
                    >
                      <SelectTrigger id="isActive" className="h-8 text-sm">
                        <SelectValue placeholder="Status selecteren" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actief</SelectItem>
                        <SelectItem value="inactive">Inactief</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Voornaam</Label>
                    <Input
                      id="firstName"
                      value={teacherFormData.firstName}
                      onChange={(e) => setTeacherFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Achternaam</Label>
                    <Input
                      id="lastName"
                      value={teacherFormData.lastName}
                      onChange={(e) => setTeacherFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dateOfBirth">Geboortedatum</Label>
                    <Input
                      id="dateOfBirth"
                      type="date"
                      value={teacherFormData.dateOfBirth}
                      onChange={(e) => setTeacherFormData(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="gender">Geslacht</Label>
                    <Select
                      value={teacherFormData.gender}
                      onValueChange={(value) => setTeacherFormData(prev => ({ ...prev, gender: value }))}
                    >
                      <SelectTrigger id="gender" className="h-8 text-sm">
                        <SelectValue placeholder="Geslacht selecteren" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="man">Man</SelectItem>
                        <SelectItem value="vrouw">Vrouw</SelectItem>
                        <SelectItem value="ander">Ander</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Contactgegevens</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                      id="email"
                      type="email"
                      value={teacherFormData.email}
                      onChange={(e) => setTeacherFormData(prev => ({ ...prev, email: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label htmlFor="phone">Telefoonnummer</Label>
                    <Input
                      id="phone"
                      value={teacherFormData.phone}
                      onChange={(e) => setTeacherFormData(prev => ({ ...prev, phone: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="street">Straat</Label>
                    <Input
                      id="street"
                      value={teacherFormData.street}
                      onChange={(e) => setTeacherFormData(prev => ({ ...prev, street: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="houseNumber">Huisnummer</Label>
                    <Input
                      id="houseNumber"
                      value={teacherFormData.houseNumber}
                      onChange={(e) => setTeacherFormData(prev => ({ ...prev, houseNumber: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postcode</Label>
                    <Input
                      id="postalCode"
                      value={teacherFormData.postalCode}
                      onChange={(e) => setTeacherFormData(prev => ({ ...prev, postalCode: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="city">Plaats</Label>
                    <Input
                      id="city"
                      value={teacherFormData.city}
                      onChange={(e) => setTeacherFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Professionele informatie</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="educationLevel">Opleidingsniveau</Label>
                    <Select
                      value={teacherFormData.educationLevel}
                      onValueChange={(value) => setTeacherFormData(prev => ({ ...prev, educationLevel: value }))}
                    >
                      <SelectTrigger id="educationLevel" className="h-8 text-sm">
                        <SelectValue placeholder="Niveau selecteren" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MBO">MBO</SelectItem>
                        <SelectItem value="HBO">HBO</SelectItem>
                        <SelectItem value="Bachelor">Bachelor</SelectItem>
                        <SelectItem value="Master">Master</SelectItem>
                        <SelectItem value="Doctoraat">Doctoraat</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearsOfExperience">Jaren ervaring</Label>
                    <Input
                      id="yearsOfExperience"
                      type="number"
                      min="0"
                      value={teacherFormData.yearsOfExperience}
                      onChange={(e) => setTeacherFormData(prev => ({ 
                        ...prev, 
                        yearsOfExperience: parseInt(e.target.value) || 0 
                      }))}
                      className="h-8 text-sm"
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Notities</Label>
                <Textarea
                  id="notes"
                  value={teacherFormData.notes}
                  onChange={(e) => setTeacherFormData(prev => ({ ...prev, notes: e.target.value }))}
                  className="text-sm min-h-[100px]"
                  placeholder="Voeg hier eventuele notities toe over de docent..."
                />
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateDialogOpen(false);
                setIsEditDialogOpen(false);
              }}
            >
              Annuleren
            </Button>
            <Button
              type="button"
              onClick={isCreateDialogOpen ? handleCreateTeacher : handleUpdateTeacher}
              disabled={!teacherFormData.firstName || !teacherFormData.lastName || !teacherFormData.email}
              className="bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              {isCreateDialogOpen ? "Toevoegen" : "Opslaan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Docent verwijderen bevestiging */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Docent verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je deze docent wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {selectedTeacher && (
              <div className="flex items-center space-x-4">
                <Avatar className="h-10 w-10">
                  <AvatarFallback className="bg-[#e5e7eb] text-gray-600">
                    {selectedTeacher.firstName.charAt(0)}{selectedTeacher.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedTeacher.firstName} {selectedTeacher.lastName}</p>
                  <p className="text-sm text-gray-500">{selectedTeacher.teacherId}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
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
              onClick={handleDeleteTeacher}
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teachers;