import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, GraduationCap, X, XCircle, FileDown, AlertTriangle, Phone, Save, Mail, BookOpen, Users, Upload } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import EmptyState from '@/components/ui/empty-state';
import { PremiumHeader } from '@/components/layout/premium-header';
import { 
  CustomDialog, 
  DialogFormContainer, 
  SectionContainer, 
  DialogFooterContainer 
} from '@/components/ui/custom-dialog';
import {
  ActionButtonsContainer,
  EmptyActionHeader
} from '@/components/ui/data-table-container';
import { Textarea } from '@/components/ui/textarea';

// Custom ChalkBoard Icon
const ChalkboardIcon = (props: any) => (
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

// Type definities
type TeacherType = {
  id: number;
  teacherId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialty?: string;
  bio?: string;
  dateOfBirth?: string;
  hireDate?: string;
  status: string;
  photoUrl?: string;
};

type SubjectType = {
  id: number;
  name: string;
  code: string;
};

export default function Teachers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTeachers, setSelectedTeachers] = useState<number[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherType | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showNewTeacherDialog, setShowNewTeacherDialog] = useState(false);
  const [hasValidationAttempt, setHasValidationAttempt] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [newTeacher, setNewTeacher] = useState<Partial<TeacherType>>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    specialty: '',
    bio: '',
    status: 'active',
    dateOfBirth: '',
    hireDate: '',
  });
  
  // Mock data - in een echte applicatie komt dit van de API
  const mockTeachers: TeacherType[] = [
    { 
      id: 1, 
      teacherId: 'TCH001', 
      firstName: 'Ahmed', 
      lastName: 'Youssef', 
      email: 'ahmed.youssef@mymadrassa.nl', 
      phone: '0612345678', 
      specialty: 'Arabisch',
      bio: 'Ervaren docent met 10 jaar ervaring in lesgeven Arabisch op verschillende niveaus.',
      dateOfBirth: '1975-05-15',
      hireDate: '2018-09-01',
      status: 'active',
    },
    { 
      id: 2, 
      teacherId: 'TCH002', 
      firstName: 'Fatima', 
      lastName: 'El Bakri', 
      email: 'fatima.elbakri@mymadrassa.nl', 
      phone: '0623456789', 
      specialty: 'Islamitische studies',
      bio: 'Gespecialiseerd in islamitische geschiedenis en ethiek voor jongeren.',
      dateOfBirth: '1982-11-20',
      hireDate: '2019-01-15',
      status: 'active',
    },
    { 
      id: 3, 
      teacherId: 'TCH003', 
      firstName: 'Mohammed', 
      lastName: 'Al-Jaber', 
      email: 'mohammed.aljaber@mymadrassa.nl', 
      phone: '0634567890', 
      specialty: 'Koranrecitatie',
      bio: 'Gespecialiseerd in tajweed en Koranmemoratie, met ervaring in internationale wedstrijden.',
      dateOfBirth: '1970-03-10',
      hireDate: '2017-08-15',
      status: 'inactive',
    }
  ];
  
  // In een echte applicatie haal je de data op met React Query
  const { data: teachers = mockTeachers, isLoading, isError } = useQuery({
    queryKey: ['/api/teachers'],
    queryFn: async () => {
      // In een echte applicatie haal je dit op van de server
      // const response = await apiRequest('/api/teachers');
      // return response;
      
      // Voor nu gebruiken we mock data
      return mockTeachers;
    },
    enabled: true // Schakel deze in voor ontwikkeling
  });
  
  // Mock onderwerpen voor de dropdown
  const mockSubjects: SubjectType[] = [
    { id: 1, name: 'Arabisch', code: 'ARA' },
    { id: 2, name: 'Islamitische studies', code: 'ISL' },
    { id: 3, name: 'Koranrecitatie', code: 'QUR' },
    { id: 4, name: 'Islamitische geschiedenis', code: 'HIS' },
    { id: 5, name: 'Islamitische ethiek', code: 'ETH' }
  ];

  // Gefilterde resultaten
  const searchResults = teachers.filter((teacher: TeacherType) => 
    teacher.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    teacher.teacherId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper functies
  const getStatusLabel = (status: string) => {
    const labels: {[key: string]: string} = {
      'active': 'Actief',
      'inactive': 'Inactief',
      'onleave': 'Met verlof',
      'retired': 'Gepensioneerd'
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: {[key: string]: string} = {
      'active': 'bg-green-100 text-green-800',
      'inactive': 'bg-gray-100 text-gray-800',
      'onleave': 'bg-yellow-100 text-yellow-800',
      'retired': 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  // Selectie functies
  const toggleTeacherSelection = (id: number) => {
    setSelectedTeachers(prev => 
      prev.includes(id) 
        ? prev.filter(teacherId => teacherId !== id) 
        : [...prev, id]
    );
  };

  const handleToggleAllTeachers = () => {
    if (selectedTeachers.length === searchResults.length) {
      setSelectedTeachers([]);
    } else {
      setSelectedTeachers(searchResults.map((teacher: TeacherType) => teacher.id));
    }
  };

  // CRUD functies
  const handleViewTeacher = (teacher: TeacherType) => {
    setSelectedTeacher(teacher);
    setShowViewDialog(true);
  };

  const handleEditTeacher = (teacher: TeacherType) => {
    // Implementatie voor bewerken
    toast({
      title: "Niet geïmplementeerd",
      description: "Deze functie is nog niet beschikbaar.",
    });
  };

  const handleDeleteTeacher = (teacher: TeacherType) => {
    setSelectedTeacher(teacher);
    setShowDeleteDialog(true);
  };

  const confirmDeleteTeacher = async () => {
    if (!selectedTeacher) return;
    
    try {
      // In een echte applicatie doe je dit via de API
      // await apiRequest(`/api/teachers/${selectedTeacher.id}`, {
      //   method: 'DELETE'
      // });
      
      toast({
        title: "Docent verwijderd",
        description: "De docent is succesvol verwijderd.",
      });
      
      // Vernieuw de lijst (in een echte applicatie)
      // queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
      
      setShowDeleteDialog(false);
      setSelectedTeacher(null);
    } catch (error) {
      toast({
        title: "Fout bij verwijderen",
        description: "Er is een probleem opgetreden bij het verwijderen van de docent.",
        variant: "destructive",
      });
    }
  };

  const handleAddNewTeacher = () => {
    setShowNewTeacherDialog(true);
  };

  const handleDeleteSelectedTeachers = () => {
    toast({
      title: "Niet geïmplementeerd",
      description: "Bulk verwijderen is nog niet beschikbaar.",
    });
  };

  const handleExportSelectedTeachers = () => {
    toast({
      title: "Niet geïmplementeerd",
      description: "Exporteren is nog niet beschikbaar.",
    });
  };

  // Valideren van het nieuwe docent formulier
  const validateNewTeacher = () => {
    // Controleren of verplichte velden zijn ingevuld: voornaam, achternaam, email
    if (!newTeacher.firstName || !newTeacher.lastName || !newTeacher.email) {
      toast({
        title: "Ontbrekende velden",
        description: "Vul alle verplichte velden in (voornaam, achternaam en email).",
        variant: "destructive",
      });
      return false;
    }
    return true;
  };

  // Genereer een uniek docent ID
  const generateTeacherId = () => {
    const prefix = 'TCH';
    const nextId = (teachers.length + 1).toString().padStart(3, '0');
    return `${prefix}${nextId}`;
  };

  // Opslaan van nieuwe docent
  const handleSaveTeacher = async () => {
    // Markeer dat we validatie hebben geprobeerd
    setHasValidationAttempt(true);
    
    if (!validateNewTeacher()) return;
    
    try {
      // Genereer een teacherId
      const teacherId = generateTeacherId();
      
      const newTeacherWithId = {
        ...newTeacher,
        teacherId
      };
      
      // In een echte applicatie doe je dit via de API
      // const teacherResponse = await apiRequest('/api/teachers', {
      //   method: 'POST',
      //   body: newTeacherWithId
      // });
      
      toast({
        title: "Docent toegevoegd",
        description: "De nieuwe docent is succesvol toegevoegd.",
      });
      
      // Reset formulier en sluit dialoog
      setNewTeacher({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        specialty: '',
        bio: '',
        status: 'active',
        dateOfBirth: '',
        hireDate: '',
      });
      setShowNewTeacherDialog(false);
      
      // Vernieuw de lijst (in een echte applicatie)
      // queryClient.invalidateQueries({ queryKey: ['/api/teachers'] });
    } catch (error) {
      toast({
        title: "Fout bij toevoegen",
        description: "Er is een probleem opgetreden bij het toevoegen van de docent.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Premium header component */}
      <PremiumHeader 
        title="Docenten" 
        icon={GraduationCap}
        description="Beheer alle docenten en hun gegevens, vakken en beschikbaarheid"
        breadcrumbs={{
          parent: "Beheer",
          current: "Docenten"
        }}
      />
      
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
                placeholder="Zoek op naam, email of ID..."
                className="w-full pl-9 h-8 text-xs rounded-sm bg-white border-[#e5e7eb]"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Acties */}
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
                    onClick={handleDeleteSelectedTeachers}
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
                    onClick={handleExportSelectedTeachers}
                    className="h-7 w-7 p-0 rounded-sm border-[#e5e7eb]"
                    title="Exporteer docenten"
                  >
                    <Upload className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAddNewTeacher}
                    className="h-7 text-xs rounded-sm bg-[#1e40af] hover:bg-[#1e3a8a] text-white w-full sm:w-auto"
                  >
                    <PlusCircle className="h-3.5 w-3.5 mr-1" />
                    Nieuwe Docent
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabel van docenten - Desktop style */}
        <div className="bg-white border border-[#e5e7eb] rounded-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e5e7eb]">
              <thead className="bg-[#f9fafc]">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left w-10">
                    <Checkbox 
                      checked={selectedTeachers.length > 0 && selectedTeachers.length === searchResults.length}
                      onCheckedChange={handleToggleAllTeachers}
                      className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
                    />
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">ID</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Naam</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Specialisatie</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">E-mail</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Status</span>
                  </th>
                  <EmptyActionHeader />
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[#e5e7eb]">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="flex justify-center items-center">
                        <div className="w-6 h-6 border-2 border-[#1e40af] border-t-transparent rounded-full animate-spin"></div>
                        <span className="ml-2 text-sm text-gray-500">Laden...</span>
                      </div>
                    </td>
                  </tr>
                ) : isError ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <div className="flex flex-col items-center justify-center py-6">
                        <XCircle className="h-8 w-8 text-red-500 mb-2" />
                        <p className="text-sm text-red-500">Fout bij het laden van docenten.</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2"
                          onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/teachers'] })}
                        >
                          Opnieuw proberen
                        </Button>
                      </div>
                    </td>
                  </tr>
                ) : searchResults.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center">
                      <EmptyState
                        icon={<GraduationCap className="h-8 w-8 text-gray-400" />}
                        title="Geen docenten gevonden"
                        description={searchQuery ? "Er zijn geen docenten die overeenkomen met je zoekopdracht." : "Er zijn nog geen docenten toegevoegd."}
                        action={
                          <Button 
                            size="sm"
                            onClick={handleAddNewTeacher}
                            className="mt-2 bg-[#1e40af] hover:bg-[#1e3a8a]"
                          >
                            <PlusCircle className="h-3.5 w-3.5 mr-1" />
                            Nieuwe Docent
                          </Button>
                        }
                      />
                    </td>
                  </tr>
                ) : (
                  searchResults.map((teacher: TeacherType) => (
                    <tr key={teacher.id} className="hover:bg-[#f9fafb]">
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Checkbox 
                          checked={selectedTeachers.includes(teacher.id)}
                          onCheckedChange={() => toggleTeacherSelection(teacher.id)}
                          className="h-3.5 w-3.5 rounded-sm border-[#e5e7eb]"
                        />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-600">{teacher.teacherId}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <Avatar className="h-7 w-7 mr-2">
                            <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                              {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</div>
                            <div className="text-xs text-gray-500">{teacher.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-600">{teacher.specialty || 'Niet opgegeven'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-600">{teacher.email}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={`px-2 py-1 text-xs font-normal ${getStatusColor(teacher.status)}`}>
                          {getStatusLabel(teacher.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <ActionButtonsContainer>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleViewTeacher(teacher)}
                            className="h-7 w-7 text-gray-500 hover:text-gray-700"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            <span className="sr-only">Bekijken</span>
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleEditTeacher(teacher)}
                            className="h-7 w-7 text-gray-500 hover:text-gray-700"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Bewerken</span>
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={() => handleDeleteTeacher(teacher)}
                            className="h-7 w-7 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span className="sr-only">Verwijderen</span>
                          </Button>
                        </ActionButtonsContainer>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Dialoogvenster voor verwijderen */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Docent verwijderen</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je de volgende docent wilt verwijderen? Deze actie kan niet ongedaan worden gemaakt.
            </DialogDescription>
          </DialogHeader>
          {selectedTeacher && (
            <div className="flex items-center gap-4 py-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-blue-100 text-blue-600">
                  {selectedTeacher.firstName.charAt(0)}{selectedTeacher.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium">{selectedTeacher.firstName} {selectedTeacher.lastName}</p>
                <p className="text-xs text-gray-500">{selectedTeacher.teacherId}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteTeacher}
            >
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialoogvenster voor bekijken van docent gegevens */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="sm:max-w-[85vw] p-0">
          {/* Dialog Header */}
          <div className="bg-blue-600 py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">Docent gegevens</DialogTitle>
                <DialogDescription className="text-white/70 text-sm m-0">
                  Details van de geselecteerde docent.
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 text-white/70 hover:text-white"
              onClick={() => setShowViewDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {selectedTeacher && (
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Linker kolom - Persoonlijke info */}
                <div className="w-full md:w-1/3">
                  <div className="flex flex-col items-center p-6 border rounded-lg bg-gray-50">
                    <Avatar className="h-24 w-24 mb-4">
                      <AvatarFallback className="text-xl bg-blue-100 text-blue-600">
                        {selectedTeacher.firstName.charAt(0)}{selectedTeacher.lastName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-xl font-semibold">{selectedTeacher.firstName} {selectedTeacher.lastName}</h3>
                    <p className="text-sm text-gray-500 mb-3">{selectedTeacher.teacherId}</p>
                    <Badge className={`px-2 py-1 text-xs font-normal mb-4 ${getStatusColor(selectedTeacher.status)}`}>
                      {getStatusLabel(selectedTeacher.status)}
                    </Badge>
                    
                    <div className="w-full space-y-3">
                      <div className="flex items-start">
                        <Mail className="h-4 w-4 mt-0.5 text-gray-500 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="text-sm">{selectedTeacher.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Phone className="h-4 w-4 mt-0.5 text-gray-500 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Telefoonnummer</p>
                          <p className="text-sm">{selectedTeacher.phone || 'Niet opgegeven'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <BookOpen className="h-4 w-4 mt-0.5 text-gray-500 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">Specialisatie</p>
                          <p className="text-sm">{selectedTeacher.specialty || 'Niet opgegeven'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start">
                        <Users className="h-4 w-4 mt-0.5 text-gray-500 mr-2" />
                        <div>
                          <p className="text-xs text-gray-500">In dienst sinds</p>
                          <p className="text-sm">{selectedTeacher.hireDate || 'Niet opgegeven'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Rechter kolom - Tabs met aanvullende info */}
                <div className="flex-1">
                  <Tabs defaultValue="profile" className="w-full">
                    <TabsList className="w-full justify-start mb-4 bg-gray-100 p-1">
                      <TabsTrigger value="profile" className="data-[state=active]:bg-white">
                        Profiel
                      </TabsTrigger>
                      <TabsTrigger value="subjects" className="data-[state=active]:bg-white">
                        Vakken
                      </TabsTrigger>
                      <TabsTrigger value="schedule" className="data-[state=active]:bg-white">
                        Rooster
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="profile" className="p-4 border rounded-md">
                      <h4 className="text-lg font-medium mb-3">Over {selectedTeacher.firstName}</h4>
                      <p className="text-gray-700 mb-6">{selectedTeacher.bio || 'Geen bio opgegeven.'}</p>
                      
                      <h4 className="text-lg font-medium mb-3">Extra informatie</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-md bg-gray-50">
                          <h5 className="text-sm font-medium mb-2">Aankomende lessen</h5>
                          <p className="text-sm text-gray-500">Geen geplande lessen</p>
                        </div>
                        <div className="p-4 border rounded-md bg-gray-50">
                          <h5 className="text-sm font-medium mb-2">Recente activiteit</h5>
                          <p className="text-sm text-gray-500">Geen recente activiteit</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="subjects" className="p-4 border rounded-md">
                      <h4 className="text-lg font-medium mb-3">Vakken</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-md">
                          <div className="flex items-center mb-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                            <h5 className="text-sm font-medium">Arabisch - Basis</h5>
                          </div>
                          <p className="text-xs text-gray-500">3 klassen · 45 leerlingen</p>
                        </div>
                        
                        <div className="p-4 border rounded-md">
                          <div className="flex items-center mb-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500 mr-2"></div>
                            <h5 className="text-sm font-medium">Islamitische Studies</h5>
                          </div>
                          <p className="text-xs text-gray-500">2 klassen · 30 leerlingen</p>
                        </div>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="schedule" className="p-4 border rounded-md">
                      <h4 className="text-lg font-medium mb-3">Wekelijks rooster</h4>
                      <div className="space-y-3">
                        <div className="flex flex-col">
                          <h5 className="text-sm font-medium">Maandag</h5>
                          <p className="text-sm text-gray-500">Geen lessen ingepland</p>
                        </div>
                        <div className="flex flex-col">
                          <h5 className="text-sm font-medium">Woensdag</h5>
                          <p className="text-sm text-gray-500">16:00 - 17:30 · Arabisch - Basis · Lokaal 3</p>
                        </div>
                        <div className="flex flex-col">
                          <h5 className="text-sm font-medium">Zaterdag</h5>
                          <p className="text-sm text-gray-500">10:00 - 11:30 · Islamitische Studies · Lokaal 1</p>
                          <p className="text-sm text-gray-500">12:00 - 13:30 · Arabisch - Basis · Lokaal 3</p>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="px-6 py-4 bg-gray-50">
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Sluiten
            </Button>
            <Button 
              variant="default" 
              className="bg-[#1e40af] hover:bg-[#1e3a8a]"
              onClick={() => {
                setShowViewDialog(false);
                if (selectedTeacher) {
                  handleEditTeacher(selectedTeacher);
                }
              }}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Bewerken
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialoogvenster voor nieuwe docent */}
      <Dialog open={showNewTeacherDialog} onOpenChange={setShowNewTeacherDialog}>
        <DialogContent className="sm:max-w-[85vw] p-0">
          {/* Dialog Header */}
          <div className="bg-blue-600 py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">Nieuwe docent toevoegen</DialogTitle>
                <DialogDescription className="text-white/70 text-sm m-0">
                  Vul de gegevens in om een nieuwe docent toe te voegen.
                </DialogDescription>
              </div>
            </div>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0 text-white/70 hover:text-white"
              onClick={() => setShowNewTeacherDialog(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Tabs met formulier secties */}
          <DialogFormContainer>
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="w-full justify-start bg-gray-100 p-1 mb-6">
                <TabsTrigger value="basic" className="data-[state=active]:bg-white">
                  Basisgegevens
                </TabsTrigger>
                <TabsTrigger value="details" className="data-[state=active]:bg-white">
                  Details
                </TabsTrigger>
                <TabsTrigger value="subjects" className="data-[state=active]:bg-white">
                  Vakken
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-6 w-full">
                <SectionContainer title="Persoonlijke informatie">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div>
                      <Label htmlFor="firstName" className="text-xs text-gray-700">
                        Voornaam <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={newTeacher.firstName}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, firstName: e.target.value }))}
                        className={`mt-1 w-full ${hasValidationAttempt && !newTeacher.firstName ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-xs text-gray-700">
                        Achternaam <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        value={newTeacher.lastName}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, lastName: e.target.value }))}
                        className={`mt-1 w-full ${hasValidationAttempt && !newTeacher.lastName ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-xs text-gray-700">
                        Email <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={newTeacher.email}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, email: e.target.value }))}
                        className={`mt-1 w-full ${hasValidationAttempt && !newTeacher.email ? 'border-red-500' : ''}`}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phone" className="text-xs text-gray-700">
                        Telefoonnummer
                      </Label>
                      <Input
                        id="phone"
                        value={newTeacher.phone}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, phone: e.target.value }))}
                        className="mt-1 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth" className="text-xs text-gray-700">
                        Geboortedatum
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={newTeacher.dateOfBirth}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                        className="mt-1 w-full"
                      />
                    </div>
                    <div>
                      <Label htmlFor="hireDate" className="text-xs text-gray-700">
                        Datum in dienst
                      </Label>
                      <Input
                        id="hireDate"
                        type="date"
                        value={newTeacher.hireDate}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, hireDate: e.target.value }))}
                        className="mt-1 w-full"
                      />
                    </div>
                  </div>
                </SectionContainer>
              </TabsContent>
              
              <TabsContent value="details" className="space-y-6">
                <SectionContainer title="Aanvullende informatie">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    <div>
                      <Label htmlFor="specialty" className="text-xs text-gray-700">
                        Specialisatie
                      </Label>
                      <Select
                        value={newTeacher.specialty}
                        onValueChange={(value) => setNewTeacher(prev => ({ ...prev, specialty: value }))}
                      >
                        <SelectTrigger className="mt-1 w-full">
                          <SelectValue placeholder="Selecteer specialisatie" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockSubjects.map(subject => (
                            <SelectItem key={subject.id} value={subject.name}>
                              {subject.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="status" className="text-xs text-gray-700">
                        Status
                      </Label>
                      <Select
                        value={newTeacher.status}
                        onValueChange={(value) => setNewTeacher(prev => ({ ...prev, status: value }))}
                      >
                        <SelectTrigger className="mt-1 w-full">
                          <SelectValue placeholder="Selecteer status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Actief</SelectItem>
                          <SelectItem value="inactive">Inactief</SelectItem>
                          <SelectItem value="onleave">Met verlof</SelectItem>
                          <SelectItem value="retired">Gepensioneerd</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="col-span-1 md:col-span-2">
                      <Label htmlFor="bio" className="text-xs text-gray-700">
                        Biografie
                      </Label>
                      <Textarea
                        id="bio"
                        value={newTeacher.bio}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, bio: e.target.value }))}
                        className="mt-1 w-full"
                        rows={5}
                      />
                    </div>
                  </div>
                </SectionContainer>
              </TabsContent>
              
              <TabsContent value="subjects" className="space-y-6">
                <SectionContainer title="Vakken toewijzen">
                  <div className="space-y-4 w-full">
                    <p className="text-sm text-gray-500">
                      Je kunt vakken toewijzen aan deze docent nadat het profiel is aangemaakt.
                    </p>
                  </div>
                </SectionContainer>
              </TabsContent>
            </Tabs>
          </DialogFormContainer>
          
          <DialogFooterContainer>
            <Button 
              variant="outline" 
              onClick={() => setShowNewTeacherDialog(false)}
              className="w-full sm:w-auto"
            >
              Annuleren
            </Button>
            <Button 
              onClick={handleSaveTeacher}
              className="bg-[#1e40af] hover:bg-[#1e3a8a] w-full sm:w-auto"
            >
              <Save className="h-3.5 w-3.5 mr-1" />
              Opslaan
            </Button>
          </DialogFooterContainer>
        </DialogContent>
      </Dialog>
    </div>
  );
}