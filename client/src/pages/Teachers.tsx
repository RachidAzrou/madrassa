import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Search, PlusCircle, Filter, Download, Eye, Pencil, Trash2, GraduationCap, X, XCircle, FileDown, AlertTriangle, Phone, Save, Mail, BookOpen, Users, Upload, Edit, Camera, User, Calendar, Clock, Briefcase } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
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
  DialogFooterContainer,
  DialogHeaderWithIcon
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
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showNewTeacherDialog, setShowNewTeacherDialog] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
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
    hireDate: new Date().toISOString().split('T')[0], // Standaard vandaag
  });
  
  const [teacherEducations, setTeacherEducations] = useState<string[]>([]);
  const [teacherLanguages, setTeacherLanguages] = useState<string[]>([]);
  const [newEducation, setNewEducation] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherType | null>(null);
  const [showTeacherDetail, setShowTeacherDetail] = useState(false);
  const [showEditTeacherDialog, setShowEditTeacherDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
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

  // Exporteer functionaliteit
  const handleExportTeachers = (format: string) => {
    // Toon een toast-bericht dat het exporteren is gestart
    toast({
      title: "Exporteren",
      description: `Docenten worden geëxporteerd naar ${format.toUpperCase()}...`,
    });
    
    // Simuleer het exporteren van de docenten
    setTimeout(() => {
      toast({
        title: "Export voltooid",
        description: `De docenten zijn succesvol geëxporteerd naar ${format.toUpperCase()}.`,
      });
      
      // Sluit het dialoogvenster
      setIsExportDialogOpen(false);
    }, 1500);
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
    const prefix = 'DC';
    const nextId = (teachers.length + 1).toString().padStart(3, '0');
    return `${prefix}${nextId}`;
  };

  // Reset formulier functie
  const resetTeacherForm = () => {
    setNewTeacher({
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      specialty: '',
      bio: '',
      status: 'active',
      dateOfBirth: '',
      hireDate: new Date().toISOString().split('T')[0],
    });
    setTeacherEducations([]);
    setTeacherLanguages([]);
    setNewEducation('');
    setNewLanguage('');
    setSelectedSubjects([]);
    setHasValidationAttempt(false);
    setActiveTab('basic');
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
        teacherId,
        educations: teacherEducations,
        languages: teacherLanguages,
        subjects: selectedSubjects
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
      resetTeacherForm();
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
                    onClick={() => setIsExportDialogOpen(true)}
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
                    <span className="text-xs font-medium text-gray-700">Vakken</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-left">
                    <span className="text-xs font-medium text-gray-700">Status</span>
                  </th>
                  <th scope="col" className="px-4 py-3 text-right">
                    <span className="text-xs font-medium text-gray-700">Acties</span>
                  </th>
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
                    <tr key={teacher.id} className="hover:bg-[#f9fafb] group">
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
                            {teacher.photoUrl ? (
                              <img 
                                src={teacher.photoUrl} 
                                alt={`${teacher.firstName} ${teacher.lastName}`}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                                {teacher.firstName.charAt(0)}{teacher.lastName.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{teacher.firstName} {teacher.lastName}</div>
                            <div className="text-xs text-gray-500">{teacher.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className="text-xs text-gray-600">{teacher.specialty || 'Geen vakken toegewezen'}</span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Badge className={`px-2 py-1 text-xs font-normal ${getStatusColor(teacher.status)}`}>
                          {getStatusLabel(teacher.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right">
                        <div className="flex justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Docent detailvenster */}
      <Dialog open={showTeacherDetail} onOpenChange={setShowTeacherDetail}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedTeacher && (
            <>
              <DialogHeaderWithIcon
                icon={<GraduationCap className="h-5 w-5" />}
                title="Docent Details"
                description={`Bekijk de details van ${selectedTeacher.firstName} ${selectedTeacher.lastName}`}
              />
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    {selectedTeacher.photoUrl ? (
                      <img 
                        src={selectedTeacher.photoUrl} 
                        alt={`${selectedTeacher.firstName} ${selectedTeacher.lastName}`}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <AvatarFallback className="text-lg bg-blue-100 text-blue-600">
                        {selectedTeacher.firstName.charAt(0)}{selectedTeacher.lastName.charAt(0)}
                      </AvatarFallback>
                    )}
                  </Avatar>
                  <div>
                    <h3 className="text-lg font-semibold">{selectedTeacher.firstName} {selectedTeacher.lastName}</h3>
                    <p className="text-sm text-gray-600">{selectedTeacher.teacherId}</p>
                    <Badge className={`px-2 py-1 text-xs font-normal ${getStatusColor(selectedTeacher.status)}`}>
                      {getStatusLabel(selectedTeacher.status)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-xs text-gray-700">E-mail</Label>
                    <p className="text-sm">{selectedTeacher.email}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-700">Telefoon</Label>
                    <p className="text-sm">{selectedTeacher.phone || 'Niet opgegeven'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-700">Vakgebied</Label>
                    <p className="text-sm">{selectedTeacher.specialty || 'Niet opgegeven'}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-gray-700">Datum in dienst</Label>
                    <p className="text-sm">{selectedTeacher.hireDate || 'Niet opgegeven'}</p>
                  </div>
                </div>

                {selectedTeacher.bio && (
                  <div>
                    <Label className="text-xs text-gray-700">Biografie</Label>
                    <p className="text-sm">{selectedTeacher.bio}</p>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowTeacherDetail(false)}
                >
                  Sluiten
                </Button>
                <Button
                  onClick={() => {
                    setShowTeacherDetail(false);
                    handleEditTeacher(selectedTeacher);
                  }}
                  className="bg-[#1e40af] hover:bg-[#1e3a8a]"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Bewerken
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bewerk docent dialog */}
      <Dialog open={showEditTeacherDialog} onOpenChange={setShowEditTeacherDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeaderWithIcon
            icon={<Pencil className="h-5 w-5" />}
            title="Docent Bewerken"
            description="Pas de docentgegevens aan"
          />
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">Basisgegevens</TabsTrigger>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="subjects">Vakken</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              <SectionContainer title="Persoonlijke informatie">
                {/* Foto en verificatie sectie */}
                <div className="mb-6 pb-6 border-b border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Foto & Verificatie</h4>
                  <div className="flex gap-4 justify-between">
                    <div 
                      className="w-32 h-32 rounded-md border border-gray-300 flex flex-col items-center justify-center bg-gray-50 overflow-hidden relative cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => document.getElementById('photo-upload')?.click()}
                    >
                      {newTeacher.photoUrl ? (
                        <img src={newTeacher.photoUrl} alt="Docent foto" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 justify-center items-end">
                      <button 
                        type="button" 
                        className="flex items-center justify-center gap-1 border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                        onClick={() => {
                          alert("BeID functionaliteit wordt binnenkort toegevoegd.");
                        }}
                      >
                        <img src="/images/beid-logo.png" alt="eID" className="h-5" />
                        <span className="text-xs font-medium text-gray-700">eID</span>
                      </button>
                      <button 
                        type="button" 
                        className="flex items-center justify-center gap-1 border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                        onClick={() => {
                          alert("itsme® functionaliteit wordt binnenkort toegevoegd.");
                        }}
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
                            setNewTeacher(prev => ({
                              ...prev,
                              photoUrl: reader.result as string
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                  <div>
                    <Label htmlFor="edit-teacherId" className="text-xs text-gray-700">
                      Docent ID <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-teacherId"
                      value={newTeacher.teacherId || ''}
                      disabled
                      className="mt-1 w-full bg-gray-50"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-firstName" className="text-xs text-gray-700">
                      Voornaam <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-firstName"
                      value={newTeacher.firstName || ''}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, firstName: e.target.value }))}
                      className="mt-1 w-full"
                      placeholder="Voornaam"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-lastName" className="text-xs text-gray-700">
                      Achternaam <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-lastName"
                      value={newTeacher.lastName || ''}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, lastName: e.target.value }))}
                      className="mt-1 w-full"
                      placeholder="Achternaam"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-email" className="text-xs text-gray-700">
                      E-mail <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="edit-email"
                      type="email"
                      value={newTeacher.email || ''}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, email: e.target.value }))}
                      className="mt-1 w-full"
                      placeholder="naam@email.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-phone" className="text-xs text-gray-700">
                      Telefoon
                    </Label>
                    <Input
                      id="edit-phone"
                      value={newTeacher.phone || ''}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, phone: e.target.value }))}
                      className="mt-1 w-full"
                      placeholder="06 12345678"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-dateOfBirth" className="text-xs text-gray-700">
                      Geboortedatum
                    </Label>
                    <Input
                      id="edit-dateOfBirth"
                      type="date"
                      value={newTeacher.dateOfBirth || ''}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                      className="mt-1 w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-hireDate" className="text-xs text-gray-700">
                      Datum in dienst
                    </Label>
                    <Input
                      id="edit-hireDate"
                      type="date"
                      value={newTeacher.hireDate || ''}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, hireDate: e.target.value }))}
                      className="mt-1 w-full"
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-status" className="text-xs text-gray-700">
                      Status
                    </Label>
                    <Select
                      value={newTeacher.status || ''}
                      onValueChange={(value) => setNewTeacher(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger className="mt-1 w-full">
                        <SelectValue placeholder="Selecteer status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Actief</SelectItem>
                        <SelectItem value="inactive">Niet actief</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {/* Foto en verificatie sectie */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Foto & Verificatie</h4>
                  <div className="flex gap-4 justify-between">
                    <div 
                      className="w-32 h-32 rounded-md border border-gray-300 flex flex-col items-center justify-center bg-gray-50 overflow-hidden relative cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => document.getElementById('edit-photo-upload')?.click()}
                    >
                      {newTeacher.photoUrl ? (
                        <img src={newTeacher.photoUrl} alt="Docent foto" className="w-full h-full object-cover" />
                      ) : (
                        <Camera className="h-12 w-12 text-gray-400" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2 justify-center items-end">
                      <button 
                        type="button" 
                        className="flex items-center justify-center gap-1 border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                        onClick={() => {
                          alert("BeID functionaliteit wordt binnenkort toegevoegd.");
                        }}
                      >
                        <img src="/images/beid-logo.png" alt="eID" className="h-5" />
                        <span className="text-xs font-medium text-gray-700">eID</span>
                      </button>
                      <button 
                        type="button" 
                        className="flex items-center justify-center gap-1 border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                        onClick={() => {
                          alert("itsme® functionaliteit wordt binnenkort toegevoegd.");
                        }}
                      >
                        <img src="/images/itsme-logo.jpeg" alt="itsme" className="h-5" />
                        <span className="text-xs font-medium">itsme</span>
                      </button>
                    </div>
                    <input
                      id="edit-photo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setNewTeacher(prev => ({
                              ...prev,
                              photoUrl: reader.result as string
                            }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                </div>
              </SectionContainer>


            </TabsContent>

            <TabsContent value="details" className="space-y-6">
              <SectionContainer title="Aanvullende informatie">
                <div className="grid grid-cols-1 gap-4 w-full">
                  <div>
                    <Label htmlFor="edit-profession" className="text-xs text-gray-700">
                      Beroep
                    </Label>
                    <Input
                      id="edit-profession"
                      value={newTeacher.specialty || ''}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, specialty: e.target.value }))}
                      className="mt-1 w-full"
                      placeholder="Bijv. Docent Arabisch, Imam, ..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-bio" className="text-xs text-gray-700">
                      Biografie
                    </Label>
                    <textarea
                      id="edit-bio"
                      value={newTeacher.bio || ''}
                      onChange={(e) => setNewTeacher(prev => ({ ...prev, bio: e.target.value }))}
                      className="mt-1 w-full p-3 border border-gray-300 rounded-md resize-none"
                      rows={4}
                      placeholder="Korte beschrijving over de docent..."
                    />
                  </div>
                </div>
              </SectionContainer>
            </TabsContent>

            <TabsContent value="subjects" className="space-y-6">
              <SectionContainer title="Vakken">
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">Selecteer de vakken die deze docent onderwijst</p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {mockSubjects.map((subject) => (
                      <div key={subject.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`edit-subject-${subject.id}`}
                          checked={selectedSubjects.includes(subject.name)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSubjects(prev => [...prev, subject.name]);
                            } else {
                              setSelectedSubjects(prev => prev.filter(s => s !== subject.name));
                            }
                          }}
                        />
                        <Label htmlFor={`edit-subject-${subject.id}`} className="text-sm">
                          {subject.name}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionContainer>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowEditTeacherDialog(false);
                setSelectedTeacher(null);
              }}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setShowEditTeacherDialog(false);
                setShowDeleteConfirm(true);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Verwijderen
            </Button>
            <Button
              onClick={() => {
                // Hier zou de update logica komen
                toast({
                  title: "Docent bijgewerkt",
                  description: "De docentgegevens zijn succesvol bijgewerkt.",
                });
                setShowEditTeacherDialog(false);
                setSelectedTeacher(null);
              }}
              className="bg-[#1e40af] hover:bg-[#1e3a8a]"
            >
              Opslaan
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Verwijder bevestiging dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeaderWithIcon
            icon={<Trash2 className="h-5 w-5 text-red-600" />}
            title="Docent verwijderen"
            description="Deze actie kan niet ongedaan worden gemaakt"
          />
          {selectedTeacher && (
            <div className="py-4">
              <p className="text-sm text-gray-600">
                Weet je zeker dat je <strong>{selectedTeacher.firstName} {selectedTeacher.lastName}</strong> ({selectedTeacher.teacherId}) wilt verwijderen?
              </p>
            </div>
          )}
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
            >
              Annuleren
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                // Hier zou de delete logica komen
                toast({
                  title: "Docent verwijderd",
                  description: "De docent is succesvol verwijderd.",
                });
                setShowDeleteConfirm(false);
                setSelectedTeacher(null);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Verwijderen
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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
        <DialogContent className="sm:max-w-[95vw] lg:max-w-[85vw] p-0 max-h-[95vh] overflow-hidden">
          <DialogHeaderWithIcon
            icon={<GraduationCap className="h-5 w-5" />}
            title="Docent Details"
            description="Overzicht van alle docentgegevens en informatie"
          />
          
          {selectedTeacher && (
            <div className="flex-1 overflow-y-auto">
              <div className="p-4 sm:p-6 space-y-6">
                {/* Persoonlijke Informatie Card */}
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Users className="h-5 w-5 mr-2 text-blue-600" />
                      Persoonlijke Informatie
                    </h3>
                  </div>
                  <div className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-6">
                      {/* Foto en basis info */}
                      <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                          <Avatar className="h-24 w-24 border-4 border-white shadow-lg">
                            {selectedTeacher.photoUrl ? (
                              <img 
                                src={selectedTeacher.photoUrl} 
                                alt={`${selectedTeacher.firstName} ${selectedTeacher.lastName}`}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <AvatarFallback className="text-xl bg-blue-100 text-blue-600 font-semibold">
                                {selectedTeacher.firstName.charAt(0)}{selectedTeacher.lastName.charAt(0)}
                              </AvatarFallback>
                            )}
                          </Avatar>
                        </div>
                        <div className="text-center">
                          <h2 className="text-xl font-bold text-gray-900">
                            {selectedTeacher.firstName} {selectedTeacher.lastName}
                          </h2>
                          <p className="text-sm text-gray-500 font-medium">{selectedTeacher.teacherId}</p>
                          <Badge className={`mt-2 px-3 py-1 text-xs font-medium ${getStatusColor(selectedTeacher.status)}`}>
                            {getStatusLabel(selectedTeacher.status)}
                          </Badge>
                        </div>
                      </div>
                      
                      {/* Details grid */}
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <Mail className="h-4 w-4 mt-1 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                              <p className="text-sm font-medium text-gray-900 break-all">{selectedTeacher.email}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <Phone className="h-4 w-4 mt-1 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefoon</p>
                              <p className="text-sm font-medium text-gray-900">{selectedTeacher.phone || 'Niet opgegeven'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <Phone className="h-4 w-4 mt-1 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Geboortedatum</p>
                              <p className="text-sm font-medium text-gray-900">{selectedTeacher.dateOfBirth || 'Niet opgegeven'}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex items-start space-x-3">
                            <BookOpen className="h-4 w-4 mt-1 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Specialisatie</p>
                              <p className="text-sm font-medium text-gray-900">{selectedTeacher.specialty || 'Niet opgegeven'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <BookOpen className="h-4 w-4 mt-1 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">In dienst sinds</p>
                              <p className="text-sm font-medium text-gray-900">{selectedTeacher.hireDate || 'Niet opgegeven'}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-start space-x-3">
                            <Users className="h-4 w-4 mt-1 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</p>
                              <p className="text-sm font-medium text-gray-900">{getStatusLabel(selectedTeacher.status)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Extra Informatie */}
                {selectedTeacher.specialty && (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 px-4 sm:px-6 py-4 border-b border-gray-200">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                        <BookOpen className="h-5 w-5 mr-2 text-green-600" />
                        Aanvullende Informatie
                      </h3>
                    </div>
                    <div className="p-4 sm:p-6">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900 mb-2">Specialisatie</h4>
                        <p className="text-sm text-gray-700">{selectedTeacher.specialty}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooterContainer>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Sluiten
            </Button>
            <Button 
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
          </DialogFooterContainer>
        </DialogContent>
      </Dialog>

      {/* Dialoogvenster voor nieuwe docent */}
      <Dialog open={showNewTeacherDialog} onOpenChange={setShowNewTeacherDialog}>
        <DialogContent className="sm:max-w-[85vw] p-0">
          <DialogHeaderWithIcon
            icon={<GraduationCap className="h-5 w-5" />}
            title="Nieuwe docent toevoegen"
            description="Vul de gegevens in om een nieuwe docent toe te voegen."
            onClose={() => setShowNewTeacherDialog(false)}
          />
          
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
                  {/* Foto en verificatie sectie */}
                  <div className="mb-6 pb-6 border-b border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-4">Foto & Verificatie</h4>
                    <div className="flex gap-4 justify-between">
                      <div 
                        className="w-32 h-32 rounded-md border border-gray-300 flex flex-col items-center justify-center bg-gray-50 overflow-hidden relative cursor-pointer hover:bg-gray-100 transition-colors"
                        onClick={() => document.getElementById('new-photo-upload')?.click()}
                      >
                        {newTeacher.photoUrl ? (
                          <img src={newTeacher.photoUrl} alt="Docent foto" className="w-full h-full object-cover" />
                        ) : (
                          <Camera className="h-12 w-12 text-gray-400" />
                        )}
                      </div>
                      <div className="flex flex-col gap-2 justify-center items-end">
                        <button 
                          type="button" 
                          className="flex items-center justify-center gap-1 border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                          onClick={() => {
                            alert("BeID functionaliteit wordt binnenkort toegevoegd.");
                          }}
                        >
                          <img src="/images/beid-logo.png" alt="eID" className="h-5" />
                          <span className="text-xs font-medium text-gray-700">eID</span>
                        </button>
                        <button 
                          type="button" 
                          className="flex items-center justify-center gap-1 border border-gray-300 rounded-md px-2 py-1 bg-white text-gray-700 hover:bg-gray-50 transition-colors text-sm"
                          onClick={() => {
                            alert("itsme® functionaliteit wordt binnenkort toegevoegd.");
                          }}
                        >
                          <img src="/images/itsme-logo.jpeg" alt="itsme" className="h-5" />
                          <span className="text-xs font-medium">itsme</span>
                        </button>
                      </div>
                      <input
                        id="new-photo-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setNewTeacher(prev => ({
                                ...prev,
                                photoUrl: reader.result as string
                              }));
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* Docent ID direct onder foto */}
                  <div className="mb-6">
                    <Label htmlFor="teacherId" className="text-xs text-gray-700">
                      Docent ID
                    </Label>
                    <Input
                      id="teacherId"
                      value={generateTeacherId()}
                      disabled
                      className="mt-1 w-full bg-gray-50"
                      placeholder="Wordt automatisch gegenereerd"
                    />
                  </div>
                  
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
                      <Label htmlFor="gender" className="text-xs text-gray-700">
                        Geslacht
                      </Label>
                      <Select
                        value={newTeacher.gender}
                        onValueChange={(value) => setNewTeacher(prev => ({ ...prev, gender: value }))}
                      >
                        <SelectTrigger className="mt-1 w-full">
                          <SelectValue placeholder="Selecteer geslacht" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Man">Man</SelectItem>
                          <SelectItem value="Vrouw">Vrouw</SelectItem>
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="inactive">Niet actief</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                </SectionContainer>


              </TabsContent>
              
              <TabsContent value="details" className="space-y-6">
                <SectionContainer title="Aanvullende informatie">
                  <div className="grid grid-cols-1 gap-4 w-full">
                    <div>
                      <Label htmlFor="profession" className="text-xs text-gray-700">
                        Beroep
                      </Label>
                      <Input
                        id="profession"
                        value={newTeacher.specialty || ''}
                        onChange={(e) => setNewTeacher(prev => ({ ...prev, specialty: e.target.value }))}
                        className="mt-1 w-full"
                        placeholder="Bijv. Docent Arabisch, Imam, ..."
                      />
                    </div>
                  </div>
                </SectionContainer>

                <SectionContainer title="Opleidingen">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newEducation}
                        onChange={(e) => setNewEducation(e.target.value)}
                        placeholder="Voeg een opleiding toe..."
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newEducation.trim()) {
                            setTeacherEducations(prev => [...prev, newEducation.trim()]);
                            setNewEducation('');
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newEducation.trim()) {
                            setTeacherEducations(prev => [...prev, newEducation.trim()]);
                            setNewEducation('');
                          }
                        }}
                        className="px-3"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    {teacherEducations.length > 0 && (
                      <div className="space-y-2">
                        {teacherEducations.map((education, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                            <span className="text-sm">{education}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setTeacherEducations(prev => prev.filter((_, i) => i !== index))}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SectionContainer>

                <SectionContainer title="Talen">
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newLanguage}
                        onChange={(e) => setNewLanguage(e.target.value)}
                        placeholder="Voeg een taal toe..."
                        className="flex-1"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && newLanguage.trim()) {
                            setTeacherLanguages(prev => [...prev, newLanguage.trim()]);
                            setNewLanguage('');
                          }
                        }}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          if (newLanguage.trim()) {
                            setTeacherLanguages(prev => [...prev, newLanguage.trim()]);
                            setNewLanguage('');
                          }
                        }}
                        className="px-3"
                      >
                        <PlusCircle className="h-4 w-4" />
                      </Button>
                    </div>
                    {teacherLanguages.length > 0 && (
                      <div className="space-y-2">
                        {teacherLanguages.map((language, index) => (
                          <div key={index} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                            <span className="text-sm">{language}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setTeacherLanguages(prev => prev.filter((_, i) => i !== index))}
                              className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </SectionContainer>
              </TabsContent>
              
              <TabsContent value="subjects" className="space-y-6">
                <SectionContainer title="Vakken toewijzen">
                  <div className="space-y-4 w-full">
                    <p className="text-sm text-gray-600">
                      Selecteer de vakken die deze docent kan onderwijzen.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {mockSubjects.map(subject => (
                        <div key={subject.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`subject-${subject.id}`}
                            checked={selectedSubjects.includes(subject.id.toString())}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedSubjects(prev => [...prev, subject.id.toString()]);
                              } else {
                                setSelectedSubjects(prev => prev.filter(id => id !== subject.id.toString()));
                              }
                            }}
                          />
                          <Label htmlFor={`subject-${subject.id}`} className="text-sm">
                            {subject.name} ({subject.code})
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </SectionContainer>
              </TabsContent>
            </Tabs>
          </DialogFormContainer>
          
          <DialogFooterContainer>
            <Button 
              variant="outline" 
              onClick={() => {
                resetTeacherForm();
                setShowNewTeacherDialog(false);
              }}
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

      {/* Exporteer dialoog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
          <div className="bg-[#1e40af] py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-full">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <div>
                <DialogTitle className="text-white text-lg font-semibold m-0">Docenten Exporteren</DialogTitle>
                <DialogDescription className="text-white/70 text-sm m-0">
                  Kies een formaat om de docenten te exporteren
                </DialogDescription>
              </div>
            </div>
          </div>
          
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-3 gap-4">
              <Card className="border rounded-md p-4 hover:border-blue-500 cursor-pointer transition-all" onClick={() => handleExportTeachers('excel')}>
                <CardContent className="p-0 flex flex-col items-center">
                  <FileDown className="h-8 w-8 mb-2 text-green-600" />
                  <h3 className="text-sm font-medium">Excel</h3>
                </CardContent>
              </Card>
              
              <Card className="border rounded-md p-4 hover:border-blue-500 cursor-pointer transition-all" onClick={() => handleExportTeachers('csv')}>
                <CardContent className="p-0 flex flex-col items-center">
                  <FileDown className="h-8 w-8 mb-2 text-blue-600" />
                  <h3 className="text-sm font-medium">CSV</h3>
                </CardContent>
              </Card>
              
              <Card className="border rounded-md p-4 hover:border-blue-500 cursor-pointer transition-all" onClick={() => handleExportTeachers('pdf')}>
                <CardContent className="p-0 flex flex-col items-center">
                  <FileDown className="h-8 w-8 mb-2 text-red-600" />
                  <h3 className="text-sm font-medium">PDF</h3>
                </CardContent>
              </Card>
            </div>
            
            <div className="bg-blue-50 p-3 rounded-md">
              <p className="text-xs text-blue-700 flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0 mt-0.5 text-blue-700" />
                <span>
                  {selectedTeachers.length > 0
                    ? `Je hebt ${selectedTeachers.length} docent(en) geselecteerd om te exporteren.`
                    : "Je hebt geen docenten geselecteerd. Alle docenten worden geëxporteerd."}
                </span>
              </p>
            </div>
          </div>
          
          <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={() => setIsExportDialogOpen(false)}
              className="h-8 text-xs rounded-sm border-[#e5e7eb]"
            >
              Annuleren
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}