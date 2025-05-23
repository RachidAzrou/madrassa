import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';
import { Pencil, Trash2, Search, Plus, PlusCircle, Eye, User, Phone, MapPin, Briefcase, BookOpen, GraduationCap, Book, X, UserCircle, Users, Upload, Image, BookText, XCircle, LucideIcon, School, Download } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  const { 
    data: teachersData, 
    isLoading, 
    isError 
  } = useQuery({
    queryKey: ['/api/teachers', searchQuery, statusFilter, currentPage, rowsPerPage],
    select: (data) => ({
      teachers: data.teachers || [],
      totalCount: data.totalCount || 0
    }),
  });
  
  // Calculate total pages
  const totalPages = teachersData?.totalCount 
    ? Math.ceil(teachersData.totalCount / rowsPerPage) 
    : 0;
    
  // Functie om docenten te exporteren naar Excel of CSV
  const handleExportTeachers = async () => {
    try {
      // Verkrijg alle docenten van de API zonder paginatie
      const response = await fetch('/api/teachers?export=true');
      if (!response.ok) throw new Error('Kon docentgegevens niet ophalen voor export');
      const data = await response.json();
      
      if (!data.teachers || data.teachers.length === 0) {
        toast({
          title: "Geen gegevens om te exporteren",
          description: "Er zijn geen docentgegevens beschikbaar om te exporteren.",
          variant: "destructive"
        });
        return;
      }
      
      // Bereid gegevens voor voor export
      const exportData = data.teachers.map((teacher: any) => ({
        ID: teacher.teacherId,
        Voornaam: teacher.firstName,
        Achternaam: teacher.lastName,
        Email: teacher.email,
        Telefoon: teacher.phone,
        Status: teacher.isActive ? 'Actief' : 'Inactief',
        Adres: `${teacher.street || ''} ${teacher.houseNumber || ''}`,
        Postcode: teacher.postalCode,
        Woonplaats: teacher.city,
        Geboortedatum: teacher.dateOfBirth,
        Geslacht: teacher.gender,
        Specialisaties: teacher.specialties?.join(", ") || '',
        AanmaakDatum: new Date(teacher.createdAt).toLocaleDateString('nl-NL')
      }));
      
      // Genereer Excel bestand en download
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Docenten");
      
      const fileName = `Docenten_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);
      
      toast({
        title: "Export succesvol",
        description: `${exportData.length} docenten succesvol geëxporteerd naar ${fileName}`,
      });
    } catch (error) {
      console.error("Fout bij exporteren docenten:", error);
      toast({
        title: "Export mislukt",
        description: "Er is een fout opgetreden bij het exporteren van de docentgegevens.",
        variant: "destructive"
      });
    }
  };
  
  // Mutations
  const createTeacherMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/teachers', 'POST', data),
    onSuccess: () => {
      toast({
        title: "Docent toegevoegd",
        description: "De docent is succesvol toegevoegd aan het systeem.",
      });
      setIsCreateDialogOpen(false);
      // Reset form
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
        assignedClasses: []
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
  
  const updateTeacherMutation = useMutation({
    mutationFn: (data: any) => apiRequest(`/api/teachers/${data.id}`, 'PUT', data),
    onSuccess: () => {
      toast({
        title: "Docent bijgewerkt",
        description: "De docentgegevens zijn succesvol bijgewerkt.",
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
      teacherId: teacher.teacherId || "",
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      email: teacher.email || "",
      phone: teacher.phone || "",
      isActive: teacher.isActive ?? true,
      street: teacher.street || "",
      houseNumber: teacher.houseNumber || "",
      postalCode: teacher.postalCode || "",
      city: teacher.city || "",
      dateOfBirth: teacher.dateOfBirth || "",
      gender: teacher.gender || "man",
      notes: teacher.notes || "",
      certifications: teacher.certifications || [],
      languages: teacher.languages || [],
      specialties: teacher.specialties || [],
      educationLevel: teacher.educationLevel || "Bachelor",
      yearsOfExperience: teacher.yearsOfExperience || 0,
      documents: teacher.documents || [],
      availability: teacher.availability || [],
      assignedCourses: teacher.assignedCourses || [],
      assignedClasses: teacher.assignedClasses || []
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (teacher: any) => {
    setSelectedTeacher(teacher);
    setIsDeleteDialogOpen(true);
  };
  
  // Render status badge
  const renderStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
        Actief
      </span>
    ) : (
      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
        Inactief
      </span>
    );
  };
  
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
            <div className="flex items-center gap-4 mb-2 md:mb-0">
              <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Docenten</h1>
                <p className="text-base text-gray-500 mt-1">Bekijk en beheer alle docenten in het systeem</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-8 bg-white shadow-sm">
          <div className="flex items-center justify-center h-40">
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
      <div className="p-4 md:p-6 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col md:flex-row md:items-center border-b border-gray-200 pb-4 w-full">
            <div className="flex items-center gap-4 mb-2 md:mb-0">
              <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
                <GraduationCap className="h-7 w-7" />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Docenten</h1>
                <p className="text-base text-gray-500 mt-1">Bekijk en beheer alle docenten in het systeem</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border rounded-lg p-8 bg-white shadow-sm">
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
    );
  }
  
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-col mb-8">
        <div className="w-full">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 rounded-md bg-[#1e3a8a] text-white">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Docenten</h1>
              <p className="text-base text-gray-500 mt-1">Bekijk en beheer alle docenten in het systeem</p>
            </div>
          </div>
          
          <div className="border-b border-gray-200 pb-4 mb-4"></div>
          
          <div className="mt-4">
            <div className="flex flex-col gap-4">
              {/* Zoekbalk - volledige breedte */}
              <div className="relative w-full">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Zoek op naam of docent ID..."
                  className="w-full pl-9 h-8 bg-white border-gray-200 shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {/* Filters en knoppen op één rij onder de zoekbalk */}
              <div className="flex flex-wrap justify-between items-center gap-3">
                {/* Filter op status */}
                <div className="flex items-center">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-full sm:w-40 h-8 bg-white border-gray-200 shadow-sm">
                      <SelectValue placeholder="Filter op status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle docenten</SelectItem>
                      <SelectItem value="active">Actief</SelectItem>
                      <SelectItem value="inactive">Inactief</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Actieknoppen */}
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="default" className="border-gray-300 text-gray-700" onClick={handleExportTeachers}>
                    <Download className="h-4 w-4 mr-2" />
                    Exporteren
                  </Button>
                  <Button 
                    variant="default" 
                    size="default" 
                    className="bg-primary hover:bg-primary/90"
                    onClick={() => setIsCreateDialogOpen(true)}
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Nieuwe docent
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
        
        {/* Docententabel */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th scope="col" className="px-3 py-3 text-left">
                  <Checkbox 
                    checked={selectedTeachers.length > 0 && teachersData?.teachers && selectedTeachers.length === teachersData.teachers.length}
                    onCheckedChange={handleSelectAll}
                    aria-label="Selecteer alle docenten"
                  />
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">DOCENT ID</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">NAAM</th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KLAS</th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">STATUS</th>
                <th scope="col" className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {/* Lege state wanneer er geen docenten zijn - onder de headers */}
              {!isLoading && (!teachersData?.teachers || teachersData.teachers.length === 0) && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center">
                    <EmptyState
                      icon={<GraduationCap className="h-10 w-10 opacity-30" />}
                      title="Geen docenten gevonden"
                      description={searchQuery ? `Geen resultaten voor "${searchQuery}". Probeer een andere zoekopdracht of pas de filters aan.` : "Er zijn nog geen docenten toegevoegd aan het systeem."}
                    />
                  </td>
                </tr>
              )}
              
              {/* Loading state */}
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center">
                    <div className="flex justify-center items-center">
                      <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                      <span className="ml-2">Laden...</span>
                    </div>
                  </td>
                </tr>
              )}
              
              {/* Docenten lijst */}
              {!isLoading && teachersData?.teachers && teachersData.teachers.map((teacher: any, index: number) => (
                <tr key={teacher.id} className="group hover:bg-gray-50 border-b border-gray-200">
                  <td className="px-3 py-4 whitespace-nowrap text-sm">
                    <Checkbox
                      checked={selectedTeachers.includes(teacher.id)}
                      onCheckedChange={() => handleSelectTeacher(teacher.id)}
                      aria-label={`Selecteer ${teacher.firstName} ${teacher.lastName}`}
                    />
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{teacher.teacherId}</td>
                  <td className="px-3 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8 mr-2">
                        <AvatarFallback className="bg-[#1e3a8a] text-white">
                          {teacher.firstName?.[0]}{teacher.lastName?.[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-sm text-gray-900">{teacher.firstName} {teacher.lastName}</div>
                    </div>
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-500">
                    {teacher.assignedClasses && teacher.assignedClasses.length > 0 ? 
                      teacher.assignedClasses[0]
                      : 
                      <span className="text-gray-400">-</span>
                    }
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-center">
                    {renderStatusBadge(teacher.isActive)}
                  </td>
                  <td className="px-3 py-4 whitespace-nowrap text-right text-sm">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => handleViewTeacher(teacher)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-8 w-8 p-0 text-amber-600 hover:text-amber-800 hover:bg-amber-50"
                        onClick={() => handleEditTeacher(teacher)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                        onClick={() => openDeleteDialog(teacher)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Paginering - alleen tonen als er docenten zijn */}
          {!isLoading && teachersData?.teachers && teachersData.teachers.length > 0 && (
            <div className="p-4 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-gray-500">
                Toont {((currentPage - 1) * rowsPerPage) + 1}-{Math.min(currentPage * rowsPerPage, teachersData.totalCount)} van {teachersData.totalCount} docenten
              </div>
              
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                >
                  Vorige
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                >
                  Volgende
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Weergave van docentgegevens Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[85vw] p-0">
          <div className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  {selectedTeacher?.firstName} {selectedTeacher?.lastName}
                </DialogTitle>
                <DialogDescription className="text-sm text-blue-100">
                  Docentgegevens bekijken
                </DialogDescription>
              </div>
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
                        selectedTeacher.specialties.map((specialty: string, index: number) => (
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
                        selectedTeacher.certifications.map((cert: string, index: number) => (
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
                        selectedTeacher.languages.map((lang: string, index: number) => (
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
                    selectedTeacher.assignedClasses.map((cls: any, index: number) => (
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
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Sluiten
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              handleEditTeacher(selectedTeacher);
            }}>
              <Pencil className="mr-2 h-4 w-4" />
              Bewerken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Create Teacher Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] h-[95vh]">
          <DialogHeader className="bg-gradient-to-r from-[#1e3a8a] to-[#1e40af] text-white px-6 py-5 rounded-t-lg -mx-6 -mt-6">
            <div className="flex items-center">
              <div className="h-12 w-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mr-4">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-bold text-white">
                  Nieuwe docent
                </DialogTitle>
                <DialogDescription className="text-sm text-blue-100">
                  Vul alle benodigde informatie in om een nieuwe docent toe te voegen aan het systeem.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="mt-2 overflow-y-auto pr-1" style={{ height: "calc(95vh - 100px)" }}>
            <Tabs defaultValue="personal">
              <TabsList className="flex mb-2 overflow-x-auto">
                <TabsTrigger value="personal" className="flex items-center gap-1 px-3">
                  <User className="h-4 w-4" />
                  <span>Persoonlijk</span>
                </TabsTrigger>
                <TabsTrigger value="contact" className="flex items-center gap-1 px-3">
                  <Phone className="h-4 w-4" />
                  <span>Contact</span>
                </TabsTrigger>
                <TabsTrigger value="address" className="flex items-center gap-1 px-3">
                  <MapPin className="h-4 w-4" />
                  <span>Adres</span>
                </TabsTrigger>
                <TabsTrigger value="professional" className="flex items-center gap-1 px-3">
                  <Briefcase className="h-4 w-4" />
                  <span>Professioneel</span>
                </TabsTrigger>
                <TabsTrigger value="subjects" className="flex items-center gap-1 px-3">
                  <Book className="h-4 w-4" />
                  <span>Vakken</span>
                </TabsTrigger>
                <TabsTrigger value="classes" className="flex items-center gap-1 px-3">
                  <ChalkBoard className="h-4 w-4" />
                  <span>Klassen</span>
                </TabsTrigger>
              </TabsList>
            

              
              {/* Persoonlijke informatie tab */}
              <TabsContent value="personal" className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm min-h-[365px]">
                  <h3 className="text-lg font-semibold text-primary mb-2">Persoonlijke gegevens</h3>
                  
                  {/* Foto upload sectie met knoppen rechts */}
                  <div className="flex mb-2 items-start justify-between">
                    <div 
                      className="w-24 h-24 flex items-center justify-center overflow-hidden relative group cursor-pointer"
                      onClick={() => {
                        const fileInput = document.getElementById('teacher-photo') as HTMLInputElement;
                        fileInput?.click();
                      }}
                    >
                      <img id="teacher-photo-preview" src="" alt="" className="w-full h-full object-cover hidden" />
                      <div id="teacher-photo-placeholder" className="w-full h-full flex items-center justify-center bg-gray-50 border-2 border-dashed border-gray-300 rounded-full">
                        <GraduationCap className="h-10 w-10 text-gray-300" />
                        <div className="absolute bottom-0 right-0 bg-[#1e3a8a] rounded-full p-1.5 shadow-sm">
                          <Upload className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                      
                      {/* Verwijder-knop verschijnt alleen bij hover als er een foto is */}
                      <div 
                        className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity hidden"
                        id="photo-delete-overlay"
                        onClick={(e) => {
                          e.stopPropagation();
                          const photoPreview = document.getElementById('teacher-photo-preview') as HTMLImageElement;
                          const photoPlaceholder = document.getElementById('teacher-photo-placeholder');
                          const photoDeleteOverlay = document.getElementById('photo-delete-overlay');
                          const fileInput = document.getElementById('teacher-photo') as HTMLInputElement;
                          
                          if (photoPreview && photoPlaceholder && fileInput && photoDeleteOverlay) {
                            photoPreview.src = '';
                            photoPreview.classList.add('hidden');
                            photoPlaceholder.classList.remove('hidden');
                            photoDeleteOverlay.classList.add('hidden');
                            fileInput.value = '';
                          }
                        }}
                      >
                        <Trash2 className="h-6 w-6 text-white" />
                      </div>
                    </div>
                    
                    <input 
                      type="file" 
                      id="teacher-photo" 
                      accept="image/*" 
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = function(event) {
                            const photoPreview = document.getElementById('teacher-photo-preview') as HTMLImageElement;
                            const photoPlaceholder = document.getElementById('teacher-photo-placeholder');
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
                    
                    <div className="flex flex-col gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center border border-gray-300 h-7 text-xs"
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
                                firstName: "Ahmed",
                                lastName: "El Khatib",
                                birthDate: "1985-08-21",
                                nationalRegisterNumber: "850821378914",
                                gender: "Mannelijk",
                                street: "Leuvensestraat",
                                houseNumber: "12B",
                                postalCode: "1030",
                                city: "Schaarbeek",
                                photoUrl: "https://placehold.co/400x400/eee/31316a?text=Foto+eID"
                              };
                              
                              // Simuleer het laden van de foto uit de eID
                              const photoPreview = document.getElementById('teacher-photo-preview') as HTMLImageElement;
                              const photoPlaceholder = document.getElementById('teacher-photo-placeholder');
                              
                              if (photoPreview && photoPlaceholder) {
                                photoPreview.src = eidData.photoUrl;
                                photoPreview.classList.remove('hidden');
                                photoPlaceholder.classList.add('hidden');
                              }
                              
                              // Vul het formulier in met eID-gegevens
                              setTeacherFormData({
                                ...teacherFormData,
                                firstName: eidData.firstName,
                                lastName: eidData.lastName,
                                dateOfBirth: eidData.birthDate,
                                gender: eidData.gender === "Mannelijk" ? "man" : "vrouw",
                                street: eidData.street,
                                houseNumber: eidData.houseNumber,
                                postalCode: eidData.postalCode,
                                city: eidData.city
                              });
                              
                              // Bericht tonen dat de gegevens zijn geladen
                              localToast({
                                title: "Gegevens geladen",
                                description: "De gegevens van de eID zijn succesvol ingeladen.",
                              });
                            }, 2000);
                          }, 1500);
                        }}
                      >
                        <span className="mr-2 bg-[#77CC9A] text-white rounded-md px-1 font-bold text-xs py-0.5">be|ID</span>
                        Laden via eID
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="flex items-center border border-gray-300 h-7 text-xs"
                        onClick={() => {
                          // Get access to toast context within this function
                          const localToast = toast;
                          
                          localToast({
                            title: "itsme® app",
                            description: "Open de itsme® app op uw smartphone om verder te gaan...",
                          });
                          
                          // Simuleer itsme detectie
                          setTimeout(() => {
                            localToast({
                              title: "itsme® verbinding",
                              description: "Verbinding gemaakt met itsme®. Gegevens worden opgehaald...",
                            });
                            
                            // Simuleer laden van itsme gegevens na 2 seconden
                            setTimeout(() => {
                              // Hier zouden we de itsme-gegevens verwerken
                              // In een echte implementatie zou dit komen van de itsme API
                              const itsmeData = {
                                firstName: "Mohamed",
                                lastName: "Ben Ali",
                                birthDate: "1980-03-12",
                                nationalRegisterNumber: "80031215987",
                                gender: "Mannelijk",
                                street: "Antwerpsesteenweg",
                                houseNumber: "24",
                                postalCode: "2800",
                                city: "Mechelen",
                                photoUrl: "https://placehold.co/400x400/eee/FF4D27?text=Foto+itsme"
                              };
                              
                              // Simuleer het laden van de foto uit itsme
                              const photoPreview = document.getElementById('teacher-photo-preview') as HTMLImageElement;
                              const photoPlaceholder = document.getElementById('teacher-photo-placeholder');
                              
                              if (photoPreview && photoPlaceholder) {
                                photoPreview.src = itsmeData.photoUrl;
                                photoPreview.classList.remove('hidden');
                                photoPlaceholder.classList.add('hidden');
                              }
                              
                              // Vul het formulier in met itsme-gegevens
                              setTeacherFormData({
                                ...teacherFormData,
                                firstName: itsmeData.firstName,
                                lastName: itsmeData.lastName,
                                dateOfBirth: itsmeData.birthDate,
                                gender: itsmeData.gender === "Mannelijk" ? "man" : "vrouw",
                                street: itsmeData.street,
                                houseNumber: itsmeData.houseNumber,
                                postalCode: itsmeData.postalCode,
                                city: itsmeData.city
                              });
                              
                              // Bericht tonen dat de gegevens zijn geladen
                              localToast({
                                title: "Gegevens geladen",
                                description: "De itsme® gegevens zijn succesvol ingeladen.",
                              });
                            }, 2500);
                          }, 2000);
                        }}
                      >
                        <span className="mr-2 bg-[#FF4D27] text-white rounded-md px-2 font-bold text-xs py-0.5">itsme</span>
                        Laden via itsme®
                      </Button>
                    </div>
                  </div>
                  
                  <div className="hidden">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center border border-gray-300"
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
                              firstName: "Ahmed",
                              lastName: "El Khatib",
                              birthDate: "1985-08-21",
                              nationalRegisterNumber: "850821378914",
                              gender: "Mannelijk",
                              street: "Leuvensestraat",
                              houseNumber: "12B",
                              postalCode: "1030",
                              city: "Schaarbeek",
                              photoUrl: "https://placehold.co/400x400/eee/31316a?text=Foto+eID"
                            };
                            
                            // Simuleer het laden van de foto uit de eID
                            const photoPreview = document.getElementById('teacher-photo-preview') as HTMLImageElement;
                            const photoPlaceholder = document.getElementById('teacher-photo-placeholder');
                            
                            if (photoPreview && photoPlaceholder) {
                              photoPreview.src = eidData.photoUrl;
                              photoPreview.classList.remove('hidden');
                              photoPlaceholder.classList.add('hidden');
                            }
                            
                            // Vul het formulier in met eID-gegevens
                            setTeacherFormData({
                              ...teacherFormData,
                              firstName: eidData.firstName,
                              lastName: eidData.lastName,
                              dateOfBirth: eidData.birthDate,
                              gender: eidData.gender === "Mannelijk" ? "man" : "vrouw",
                              street: eidData.street,
                              houseNumber: eidData.houseNumber,
                              postalCode: eidData.postalCode,
                              city: eidData.city
                            });
                            
                            // Voeg een extra bericht toe dat de foto ook beschikbaar is in de foto-tab
                            localToast({
                              title: "Gegevens geladen",
                              description: "De gegevens van de eID zijn succesvol ingeladen. De foto is ook zichtbaar in de foto-tab.",
                            });
                            
                            // Toon een visuele hint dat er ook naar de foto tab gekeken moet worden
                            const photoTabTrigger = document.querySelector('button[value="photo"]');
                            if (photoTabTrigger) {
                              photoTabTrigger.classList.add('animate-pulse');
                              setTimeout(() => {
                                photoTabTrigger.classList.remove('animate-pulse');
                              }, 3000);
                            }
                          }, 2000);
                        }, 1500);
                      }}
                    >
                      <span className="mr-2 bg-[#77CC9A] text-white rounded-md px-1 font-bold text-xs py-0.5">be|ID</span>
                      Gegevens laden via eID
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center border border-gray-300"
                      onClick={() => {
                        // Get access to toast context within this function
                        const localToast = toast;
                        
                        localToast({
                          title: "itsme® app",
                          description: "Open de itsme® app op uw smartphone om verder te gaan...",
                        });
                        
                        // Simuleer itsme detectie
                        setTimeout(() => {
                          localToast({
                            title: "itsme® verbinding",
                            description: "Verbinding gemaakt met itsme®. Gegevens worden opgehaald...",
                          });
                          
                          // Simuleer laden van itsme gegevens na 2 seconden
                          setTimeout(() => {
                            // Hier zouden we de itsme-gegevens verwerken
                            // In een echte implementatie zou dit komen van de itsme API
                            const itsmeData = {
                              firstName: "Mohamed",
                              lastName: "Ben Ali",
                              birthDate: "1980-03-12",
                              nationalRegisterNumber: "80031215987",
                              gender: "Mannelijk",
                              street: "Antwerpsesteenweg",
                              houseNumber: "24",
                              postalCode: "2800",
                              city: "Mechelen",
                              photoUrl: "https://placehold.co/400x400/eee/FF4D27?text=Foto+itsme"
                            };
                            
                            // Simuleer het laden van de foto uit itsme
                            const photoPreview = document.getElementById('teacher-photo-preview') as HTMLImageElement;
                            const photoPlaceholder = document.getElementById('teacher-photo-placeholder');
                            
                            if (photoPreview && photoPlaceholder) {
                              photoPreview.src = itsmeData.photoUrl;
                              photoPreview.classList.remove('hidden');
                              photoPlaceholder.classList.add('hidden');
                            }
                            
                            // Vul het formulier in met itsme-gegevens
                            setTeacherFormData({
                              ...teacherFormData,
                              firstName: itsmeData.firstName,
                              lastName: itsmeData.lastName,
                              dateOfBirth: itsmeData.birthDate,
                              gender: itsmeData.gender === "Mannelijk" ? "man" : "vrouw",
                              street: itsmeData.street,
                              houseNumber: itsmeData.houseNumber,
                              postalCode: itsmeData.postalCode,
                              city: itsmeData.city
                            });
                            
                            // Voeg een extra bericht toe dat de foto ook beschikbaar is in de foto-tab
                            localToast({
                              title: "Gegevens geladen",
                              description: "De itsme® gegevens zijn succesvol ingeladen. De foto is ook zichtbaar in de foto-tab.",
                            });
                            
                            // Toon een visuele hint dat er ook naar de foto tab gekeken moet worden
                            const photoTabTrigger = document.querySelector('button[value="photo"]');
                            if (photoTabTrigger) {
                              photoTabTrigger.classList.add('animate-pulse');
                              setTimeout(() => {
                                photoTabTrigger.classList.remove('animate-pulse');
                              }, 3000);
                            }
                          }, 2500);
                        }, 2000);
                      }}
                    >
                      <span className="mr-2 bg-[#FF4D27] text-white rounded-md px-2 font-bold text-xs py-0.5">itsme</span>
                      Gegevens laden via itsme®
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
                    <div>
                      <Label htmlFor="teacherId" className="text-sm font-medium text-gray-700">
                        Docent ID <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="teacherId"
                        value={teacherFormData.teacherId}
                        onChange={(e) => setTeacherFormData({ ...teacherFormData, teacherId: e.target.value })}
                        className="mt-1 bg-white h-8"
                        placeholder="Automatisch gegenereerd..."
                        disabled={!!nextTeacherIdData?.nextTeacherId}
                      />
                      {isLoadingNextId && <div className="text-xs text-gray-500">ID wordt geladen...</div>}
                    </div>
                    
                    <div>
                      <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                        Status <span className="text-primary">*</span>
                      </Label>
                      <Select
                        value={teacherFormData.isActive ? "actief" : "inactief"}
                        onValueChange={(value) => setTeacherFormData({ ...teacherFormData, isActive: value === "actief" })}
                      >
                        <SelectTrigger className="w-full mt-1 bg-white h-8">
                          <SelectValue placeholder="Selecteer status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="actief">Actief</SelectItem>
                          <SelectItem value="inactief">Inactief</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="gender" className="text-sm font-medium text-gray-700">
                        Geslacht
                      </Label>
                      <Select
                        value={teacherFormData.gender}
                        onValueChange={(value) => setTeacherFormData({ ...teacherFormData, gender: value })}
                      >
                        <SelectTrigger className="w-full mt-1 bg-white h-8">
                          <SelectValue placeholder="Selecteer geslacht" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="man">Man</SelectItem>
                          <SelectItem value="vrouw">Vrouw</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                        Voornaam <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={teacherFormData.firstName}
                        onChange={(e) => setTeacherFormData({ ...teacherFormData, firstName: e.target.value })}
                        className="mt-1 bg-white h-8"
                        placeholder="Voornaam"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                        Achternaam <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        value={teacherFormData.lastName}
                        onChange={(e) => setTeacherFormData({ ...teacherFormData, lastName: e.target.value })}
                        className="mt-1 bg-white h-8"
                        placeholder="Achternaam"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700">
                        Geboortedatum
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={teacherFormData.dateOfBirth || ''}
                        onChange={(e) => setTeacherFormData({ ...teacherFormData, dateOfBirth: e.target.value })}
                        className="mt-1 bg-white h-8"
                      />
                    </div>
                    
                    <div className="md:col-span-3">
                      <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                        Notities
                      </Label>
                      <Textarea
                        id="notes"
                        value={teacherFormData.notes}
                        onChange={(e) => setTeacherFormData({ ...teacherFormData, notes: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="Voeg hier aanvullende informatie toe..."
                        rows={2}
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
                      <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                        Email <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={teacherFormData.email}
                        onChange={(e) => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="email@mymadrassa.nl"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700">
                        Telefoonnummer <span className="text-primary">*</span>
                      </Label>
                      <Input
                        id="phone"
                        value={teacherFormData.phone}
                        onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="06 1234 5678"
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
                      <Label htmlFor="street" className="text-sm font-medium text-gray-700">
                        Straat
                      </Label>
                      <Input
                        id="street"
                        value={teacherFormData.street}
                        onChange={(e) => setTeacherFormData({ ...teacherFormData, street: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="Straatnaam"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="houseNumber" className="text-sm font-medium text-gray-700">
                        Huisnummer
                      </Label>
                      <Input
                        id="houseNumber"
                        value={teacherFormData.houseNumber}
                        onChange={(e) => setTeacherFormData({ ...teacherFormData, houseNumber: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="123"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="postalCode" className="text-sm font-medium text-gray-700">
                        Postcode
                      </Label>
                      <Input
                        id="postalCode"
                        value={teacherFormData.postalCode}
                        onChange={(e) => setTeacherFormData({ ...teacherFormData, postalCode: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="1234 AB"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="city" className="text-sm font-medium text-gray-700">
                        Plaats
                      </Label>
                      <Input
                        id="city"
                        value={teacherFormData.city}
                        onChange={(e) => setTeacherFormData({ ...teacherFormData, city: e.target.value })}
                        className="mt-1 bg-white"
                        placeholder="Amsterdam"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Professionele informatie tab */}
              <TabsContent value="professional" className="space-y-3">
                <div className="p-3 border border-gray-200 rounded-lg bg-white shadow-sm min-h-[365px]">
                  <h3 className="text-lg font-semibold text-primary mb-2">Professionele gegevens</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-3">
                    <div className="md:col-span-3">
                      <Label htmlFor="profession" className="text-sm font-medium text-gray-700">
                        Beroep
                      </Label>
                      <Input
                        id="profession"
                        placeholder="Beroep"
                        value={teacherFormData.profession || ""}
                        onChange={(e) => setTeacherFormData({ ...teacherFormData, profession: e.target.value })}
                        className="mt-1 bg-white h-8"
                      />
                    </div>
                    
                    <div className="md:col-span-3">
                      <Label className="text-sm font-medium text-gray-700 mb-1 block">
                        Opleidingen
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        <Input
                          placeholder="Voeg een opleiding toe en druk op Enter"
                          className="bg-white h-8"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                              e.preventDefault();
                              const value = e.currentTarget.value.trim();
                              if (!teacherFormData.educations) {
                                setTeacherFormData({
                                  ...teacherFormData,
                                  educations: [value]
                                });
                              } else if (!teacherFormData.educations.includes(value)) {
                                setTeacherFormData({
                                  ...teacherFormData,
                                  educations: [...teacherFormData.educations, value]
                                });
                              }
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        
                        {teacherFormData.educations && teacherFormData.educations.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {teacherFormData.educations.map((education, index) => (
                              <div key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md flex items-center group">
                                {education}
                                <button
                                  type="button"
                                  className="ml-1 text-blue-600 hover:text-blue-800 opacity-60 group-hover:opacity-100"
                                  onClick={() => {
                                    setTeacherFormData({
                                      ...teacherFormData,
                                      educations: teacherFormData.educations.filter((_, i) => i !== index)
                                    });
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="md:col-span-3">
                      <Label className="text-sm font-medium text-gray-700 mb-1 block">
                        Talen
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        <Input
                          placeholder="Voeg een taal toe en druk op Enter"
                          className="bg-white h-8"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && e.currentTarget.value.trim() !== '') {
                              e.preventDefault();
                              const value = e.currentTarget.value.trim();
                              if (!teacherFormData.languages.includes(value)) {
                                setTeacherFormData({
                                  ...teacherFormData,
                                  languages: [...teacherFormData.languages, value]
                                });
                              }
                              e.currentTarget.value = '';
                            }
                          }}
                        />
                        
                        {teacherFormData.languages.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {teacherFormData.languages.map((language, index) => (
                              <div key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md flex items-center group">
                                {language}
                                <button
                                  type="button"
                                  className="ml-1 text-blue-600 hover:text-blue-800 opacity-60 group-hover:opacity-100"
                                  onClick={() => {
                                    setTeacherFormData({
                                      ...teacherFormData,
                                      languages: teacherFormData.languages.filter((_, i) => i !== index)
                                    });
                                  }}
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Vakken tab */}
              <TabsContent value="subjects" className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-4">Vakken</h3>
                  <p className="text-gray-500 mb-4">Vakken worden toegewezen na het aanmaken van de docent.</p>
                </div>
              </TabsContent>
              
              {/* Klassen tab */}
              <TabsContent value="classes" className="space-y-6">
                <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                  <h3 className="text-lg font-semibold text-primary mb-4">Klassen</h3>
                  <p className="text-gray-500 mb-4">Klassen worden toegewezen na het aanmaken van de docent.</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleCreateTeacher} disabled={createTeacherMutation.isPending}>
              {createTeacherMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Toevoegen...
                </>
              ) : (
                <>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Docent toevoegen
                </>
              )}
            </Button>
          </DialogFooter>
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
            <div className="p-4 border border-gray-200 rounded-lg bg-white my-4">
              <div className="flex items-center">
                <Avatar className="h-9 w-9 mr-3 bg-blue-100 text-blue-600">
                  <AvatarFallback>
                    {selectedTeacher.firstName?.[0]}{selectedTeacher.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">{selectedTeacher.firstName} {selectedTeacher.lastName}</div>
                  <div className="text-sm text-gray-500">{selectedTeacher.teacherId}</div>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={handleDeleteTeacher} disabled={deleteTeacherMutation.isPending}>
              {deleteTeacherMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Verwijderen...
                </>
              ) : (
                "Definitief verwijderen"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[95vw] sm:h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-primary flex items-center">
              <User className="mr-2 h-5 w-5" />
              Docent bewerken
            </DialogTitle>
            <DialogDescription>
              Bewerk de gegevens van deze docent.
            </DialogDescription>
          </DialogHeader>
          
          <Tabs defaultValue="personal" className="mt-4">
            <TabsList className="grid grid-cols-7 mb-4">
              <TabsTrigger value="photo" className="flex items-center gap-2">
                <Image className="h-4 w-4" />
                <span>Foto</span>
              </TabsTrigger>
              <TabsTrigger value="personal" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>Persoonlijk</span>
              </TabsTrigger>
              <TabsTrigger value="contact" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>Contact</span>
              </TabsTrigger>
              <TabsTrigger value="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Adres</span>
              </TabsTrigger>
              <TabsTrigger value="professional" className="flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                <span>Professioneel</span>
              </TabsTrigger>
              <TabsTrigger value="subjects" className="flex items-center gap-2">
                <Book className="h-4 w-4" />
                <span>Vakken</span>
              </TabsTrigger>
              <TabsTrigger value="classes" className="flex items-center gap-2">
                <ChalkBoard className="h-4 w-4" />
                <span>Klassen</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Similar content as create dialog, but with edit functionality */}
            <TabsContent value="personal" className="space-y-6">
              <div className="p-6 border border-gray-200 rounded-lg bg-white shadow-sm">
                <h3 className="text-lg font-semibold text-primary mb-4">Persoonlijke gegevens</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="teacherId" className="text-sm font-medium text-gray-700">
                      Docent ID <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="teacherId"
                      value={teacherFormData.teacherId}
                      className="mt-1 bg-white"
                      disabled
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                      Status <span className="text-primary">*</span>
                    </Label>
                    <Select
                      value={teacherFormData.isActive ? "actief" : "inactief"}
                      onValueChange={(value) => setTeacherFormData({ ...teacherFormData, isActive: value === "actief" })}
                    >
                      <SelectTrigger className="w-full mt-1 bg-white">
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="actief">Actief</SelectItem>
                        <SelectItem value="inactief">Inactief</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="firstName" className="text-sm font-medium text-gray-700">
                      Voornaam <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="firstName"
                      value={teacherFormData.firstName}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, firstName: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="Voornaam"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lastName" className="text-sm font-medium text-gray-700">
                      Achternaam <span className="text-primary">*</span>
                    </Label>
                    <Input
                      id="lastName"
                      value={teacherFormData.lastName}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, lastName: e.target.value })}
                      className="mt-1 bg-white"
                      placeholder="Achternaam"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuleren
            </Button>
            <Button onClick={handleUpdateTeacher} disabled={updateTeacherMutation.isPending}>
              {updateTeacherMutation.isPending ? (
                <>
                  <div className="animate-spin h-4 w-4 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Opslaan...
                </>
              ) : (
                "Wijzigingen opslaan"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Teachers;